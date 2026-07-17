import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { assessPackAgainstMatrix } from '../services/matrix-assessment.js';
import { chunkDocuments } from '../services/document-chunker.js';
import { generateEmbeddings } from '../services/vector-embeddings.js';
import { vectorStore } from '../services/vector-store.js';
import prisma from '../db/client.js';
import { sendSubmissionErrorNotification, sendNewOrgNotification } from '../services/telegram.js';
import { analysisLimiter, uploadLimiter } from '../middleware/rate-limit.js';
import { createUploadMiddleware } from '../utils/upload-config.js';
import { classifyDocType } from '../utils/textUtils.js';
import { runSpecialistReview } from '../services/specialist-review.js';
import { processPDF } from '../services/ingestion.js';

const router = express.Router();

// Minimum non-whitespace characters required for a PDF to be considered machine-readable.
// Files below this threshold are treated as scanned/image-only and surfaced as gap items.
const MIN_EXTRACTABLE_CHARS = 50;

// In-memory store for crew review results (keyed by assessmentId)
// In production this would use Redis or the database
const crewReviewCache = new Map<string, { status: 'pending' | 'done' | 'error'; result?: any; error?: string }>();

// In-memory cache for assessment status (fast path, L1 cache)
// The authoritative store is the DB (QuickAssessJob) — this just avoids a DB
// round-trip on every poll for recently-started assessments in the same process.
const assessmentCache = new Map<string, {
  status: 'pending' | 'done' | 'error';
  progress?: string;
  result?: any;
  error?: string;
}>();

// ── DB-backed status persistence ─────────────────────────────────────────────
// Survives server restarts and Railway container cycling.

async function dbWriteStatus(id: string, data: { status: string; progress?: string; result?: any; error?: string }) {
  try {
    const resultJson = data.result !== undefined ? JSON.stringify(data.result) : undefined;
    await prisma.quickAssessJob.upsert({
      where: { id },
      create: { id, status: data.status, progress: data.progress, result: resultJson, error: data.error },
      update: { status: data.status, progress: data.progress, result: resultJson, error: data.error },
    });
  } catch (e) {
    console.warn('[quick-assess] DB status write failed (non-fatal):', e instanceof Error ? e.message : e);
  }
}

async function dbReadStatus(id: string) {
  try {
    const row = await prisma.quickAssessJob.findUnique({ where: { id } });
    if (!row) return null;
    return {
      status: row.status,
      progress: row.progress ?? undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error ?? undefined,
    };
  } catch { return null; }
}

// ── Legacy file-based fallback (belt-and-suspenders) ─────────────────────────
const STATUS_DIR = path.join(process.cwd(), 'temp-uploads');

function statusFilePath(id: string) {
  return path.join(STATUS_DIR, `${id}-status.json`);
}

function writeStatusFile(id: string, data: { status: string; progress?: string; result?: any; error?: string }) {
  try {
    if (!fs.existsSync(STATUS_DIR)) fs.mkdirSync(STATUS_DIR, { recursive: true });
    fs.writeFileSync(statusFilePath(id), JSON.stringify(data));
  } catch { /* non-fatal */ }
}

function readStatusFile(id: string) {
  try {
    const p = statusFilePath(id);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

async function triggerCrewReview(assessmentId: string, context: any, results: any[], attempt = 1) {
  crewReviewCache.set(assessmentId, { status: 'pending' });
  try {
    const domainReviews = await runSpecialistReview(context, results);
    crewReviewCache.set(assessmentId, { status: 'done', result: domainReviews });
    // Persist to DB so it survives server restarts and Railway container cycling
    await prisma.quickAssessJob.update({
      where: { id: assessmentId },
      data: { crewStatus: 'done', crewReview: JSON.stringify(domainReviews) },
    }).catch(e => console.warn('[crew] DB persist failed (non-fatal):', e instanceof Error ? e.message : e));
    console.log(`✅ Specialist review complete for ${assessmentId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Specialist review failed for ${assessmentId} (attempt ${attempt}): ${msg}`);
    if (attempt < 2) {
      // Retry once after 15s — handles transient API errors
      console.log(`[crew] Retrying specialist review for ${assessmentId} in 15s…`);
      setTimeout(() => triggerCrewReview(assessmentId, context, results, attempt + 1), 15_000);
      return;
    }
    crewReviewCache.set(assessmentId, { status: 'error', error: msg });
    await prisma.quickAssessJob.update({
      where: { id: assessmentId },
      data: { crewStatus: 'error', crewError: msg },
    }).catch(() => {});
  }
  // Clean up memory after 2 hours (DB row cleaned up separately)
  setTimeout(() => crewReviewCache.delete(assessmentId), 7_200_000);
}

// Configure multer for temporary uploads (uses UUID filenames)
const upload = createUploadMiddleware({
  directory: 'temp-uploads',
  filenameStrategy: 'uuid',
  validatePdf: false, // PDF validation happens later in the flow
});

async function extractPDFText(filepath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filepath);
    let pageNumber = 0;

    // Inject [PAGE N] markers so downstream LLM calls can cite exact pages.
    // pdf-parse calls pagerender sequentially (page 1 → 2 → …) and joins
    // results with '\n\n', so the counter reliably tracks page number.
    const options = {
      pagerender: (pageData: any) =>
        pageData.getTextContent().then((textContent: any) => {
          pageNumber++;
          const text = (textContent.items as any[])
            .map((item: any) => item.str)
            .join(' ')
            .trim();
          return `[PAGE ${pageNumber}]\n${text}`;
        }),
    };

    const pdfData = await pdfParse(dataBuffer, options);
    return pdfData.text.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return '';
  }
}

// classifyDocType imported from ../utils/textUtils.js (canonical 10-type version)

/**
 * Full two-phase matrix assessment - no database required to run
 *
 * Phase 1: 55 deterministic rules
 * Phase 2: LLM enrichment with Claude
 *
 * Returns complete assessment results for carousel display
 */
// Safety net: prevent unhandled async/sync errors from crashing the process
process.on('unhandledRejection', (reason) => {
  console.error('[assess] Unhandled rejection (safety net):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[assess] Uncaught exception (safety net):', err);
});

// Background worker — runs the full pipeline and populates assessmentCache
async function runAssessmentBackground(
  assessmentId: string,
  files: Express.Multer.File[],
  context: any,
) {
  const startTime = Date.now();
  const tempDataPath = path.join(process.cwd(), 'temp-uploads', `${assessmentId}.json`);

  const setProgress = (msg: string) => {
    const entry = { ...assessmentCache.get(assessmentId)!, status: 'pending' as const, progress: msg };
    assessmentCache.set(assessmentId, entry);
    writeStatusFile(assessmentId, entry);
    dbWriteStatus(assessmentId, entry); // fire-and-forget, non-blocking
  };

  try {
    setProgress('Extracting text from documents…');
    const packDocs = await Promise.all(
      files.map(async (file) => {
        const extractedText = await extractPDFText(file.path);
        const docType = classifyDocType(file.originalname, extractedText);
        return { filename: file.originalname, docType, extractedText, filepath: file.path };
      })
    );

    // Partition documents: scanned/image-only PDFs yield fewer than MIN_EXTRACTABLE_CHARS
    // non-whitespace characters and must not be passed to the assessment engine —
    // they would appear as filename-only evidence while contributing zero actual content.
    const scannedDocs = packDocs.filter(
      d => d.extractedText.replace(/\s/g, '').length < MIN_EXTRACTABLE_CHARS
    );
    const processableDocs = packDocs.filter(
      d => d.extractedText.replace(/\s/g, '').length >= MIN_EXTRACTABLE_CHARS
    );
    if (scannedDocs.length > 0) {
      console.warn(
        `[assess] ${scannedDocs.length} scanned/image PDF(s) detected and excluded from assessment: ` +
        scannedDocs.map(d => d.filename).join(', ')
      );
    }

    // RAG indexing is optional — skip gracefully if OPENAI_API_KEY is absent.
    // Only index processable docs; scanned PDFs produce no meaningful chunks.
    try {
      setProgress('Indexing documents for semantic search…');
      const processableFiles = files.filter(f =>
        processableDocs.some(d => d.filename === f.originalname)
      );
      const chunkedDocs = await chunkDocuments(
        processableFiles.map(file => ({
          filepath: file.path,
          filename: file.originalname,
          docType: processableDocs.find(d => d.filename === file.originalname)?.docType ?? null,
        }))
      );
      const allChunks = chunkedDocs.flatMap(doc => doc.chunks);
      const embeddings = await generateEmbeddings(allChunks);
      await vectorStore.index(embeddings);
      console.log(`[assess] RAG: ${allChunks.length} chunks indexed`);
    } catch (ragErr) {
      console.warn('[assess] RAG skipped (OPENAI_API_KEY not set or embeddings failed):', ragErr instanceof Error ? ragErr.message : ragErr);
    }

    setProgress('Running Phase 1: deterministic rules…');
    // Only processable docs are passed to the engine — scanned files must never appear
    // as evidence under any criterion (SM-029 or otherwise).
    // Guard: if every uploaded file is scanned/image-only, skip the engine entirely
    // rather than running it against zero evidence (Rule 2 violation).
    let fullAssessment: Awaited<ReturnType<typeof assessPackAgainstMatrix>>;
    if (processableDocs.length === 0) {
      console.warn('[assess] All uploaded documents are scanned/image-only — engine skipped, gap items only.');
      fullAssessment = {
        project_name: context.projectName ?? null,
        pack_context: context,
        reference_standards_applied: [],
        criteria_summary: {
          total_applicable: 0,
          assessed: 0,
          not_assessed: scannedDocs.length,
          meets: 0,
          partial: 0,
          does_not_meet: 0,
          missing_information: 0,
        },
        flagged_by_severity: { high: scannedDocs.length, medium: 0, low: 0 },
        results: [],
        assessment_phases: {
          deterministic: { total_rules: 0, passed: 0, failed: 0, needs_review: 0, results: [] },
          llm_analysis: { total_criteria: 0, assessed: 0, results_count: 0 },
        },
        readiness_score: 0,
        assessment_date: new Date().toISOString(),
        guardrail_stats: {
          corpus_backed_criteria: 0,
          criteria_with_reference_anchors: 0,
          reference_anchor_rate: 0,
          deterministic_rule_count: 0,
          llm_criteria_count: 0,
        },
        api_usage: { api_calls_made: 0, tokens_input: 0, tokens_output: 0 },
        integrity_issues: [],
      };
    } else {
      fullAssessment = await assessPackAgainstMatrix(processableDocs, context);
    }

    // Inject explicit gap items for scanned/unprocessable documents so they are
    // always visible in the report and never silently omitted.
    for (const doc of scannedDocs) {
      fullAssessment.results.push({
        matrix_id: `UNPROCESSED_DOC_${doc.filename.replace(/[^a-zA-Z0-9]/g, '_')}`,
        matrix_title: `Unprocessed Document: ${doc.filename}`,
        category: 'Document Processing',
        status: 'not_assessed',
        severity: 'high',
        reasoning:
          `"${doc.filename}" could not be read — it appears to be a scanned or image-only PDF ` +
          `with no machine-readable text layer. Fewer than ${MIN_EXTRACTABLE_CHARS} non-whitespace ` +
          `characters were extracted. This file was not used as evidence for any criteria.`,
        success_definition: 'Document is a searchable PDF with fully extractable text.',
        pack_evidence: { found: false, document: doc.filename, page: null, quote: null },
        reference_evidence: { found: false, doc_id: null, doc_title: null, page: null, quote: null },
        gaps_identified: [`"${doc.filename}" has no text layer — its content could not be assessed.`],
        actions_required: [{
          action: `Re-upload a machine-readable (text-based) version of "${doc.filename}", or obtain an OCR-processed copy.`,
          owner: 'Principal Designer',
          effort: 'S' as const,
          expected_benefit: 'Document content will be included in the assessment.',
        }],
      });
    }

    const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    const tempData = {
      assessmentId,
      // Keep all packDocs (including scanned) so the save handler creates document
      // records for every uploaded file — zero-chunk detection handles them there.
      packDocs: packDocs.map(d => ({ filename: d.filename, docType: d.docType, filepath: d.filepath, extractedText: d.extractedText })),
      context,
      results: fullAssessment,
      processingTimeSeconds,
    };
    fs.writeFileSync(tempDataPath, JSON.stringify(tempData));

    const payload = {
      success: true,
      assessmentId,
      documentsProcessed: files.length,
      context,
      results: fullAssessment.results,
      summary: {
        total: fullAssessment.criteria_summary.total_applicable,
        meets: fullAssessment.criteria_summary.meets,
        partial: fullAssessment.criteria_summary.partial,
        does_not_meet: fullAssessment.criteria_summary.does_not_meet,
        not_assessed: fullAssessment.criteria_summary.not_assessed,
      },
      assessment_phases: fullAssessment.assessment_phases,
      fullAssessment,
    };

    assessmentCache.set(assessmentId, { status: 'done', result: payload });
    writeStatusFile(assessmentId, { status: 'done', result: payload });
    await dbWriteStatus(assessmentId, { status: 'done', result: payload }); // await so it's persisted before trigger
    triggerCrewReview(assessmentId, context, fullAssessment.results);

    // Clean up uploaded files after 1 hour
    setTimeout(() => {
      try {
        if (fs.existsSync(tempDataPath)) fs.unlinkSync(tempDataPath);
        files.forEach(file => { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); });
      } catch { /* ignore */ }
    }, 3_600_000);

    // Clean up cache entry, status file, and DB row after 2 hours
    setTimeout(() => {
      assessmentCache.delete(assessmentId);
      try { if (fs.existsSync(statusFilePath(assessmentId))) fs.unlinkSync(statusFilePath(assessmentId)); } catch { /* ignore */ }
      prisma.quickAssessJob.delete({ where: { id: assessmentId } }).catch(() => {});
    }, 7_200_000);

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Background assessment ${assessmentId} failed:`, errMsg);
    sendSubmissionErrorNotification({ submissionId: assessmentId, errorMessage: errMsg }).catch(() => {});
    assessmentCache.set(assessmentId, { status: 'error', error: errMsg });
    writeStatusFile(assessmentId, { status: 'error', error: errMsg });
    await dbWriteStatus(assessmentId, { status: 'error', error: errMsg });
    setTimeout(() => {
      assessmentCache.delete(assessmentId);
      try { if (fs.existsSync(statusFilePath(assessmentId))) fs.unlinkSync(statusFilePath(assessmentId)); } catch { /* ignore */ }
      prisma.quickAssessJob.delete({ where: { id: assessmentId } }).catch(() => {});
    }, 7_200_000);
  }
}

// POST /api/assess — accept files, start background assessment, return 202 immediately
router.post('/', uploadLimiter, analysisLimiter, upload.any(), async (req: Request, res: Response) => {
  try {
    const allFiles = (req.files as Express.Multer.File[]) || [];
    const files = allFiles.filter(f => f.fieldname === 'documents');
    const { buildingType, heightMeters, storeys, isLondon, isHRB } = req.body;

    if (files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }
    if (files.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 documents per assessment' });
    }

    const assessmentId = uuidv4();
    const context = {
      isLondon: isLondon === 'true' || isLondon === true || false,
      isHRB: isHRB === 'true' || isHRB === true || true,
      buildingType: buildingType || 'residential',
      heightMeters: heightMeters ? parseFloat(heightMeters) : null,
      storeys: storeys ? parseInt(storeys) : null,
    };

    const initialEntry = { status: 'pending' as const, progress: 'Starting assessment…' };
    assessmentCache.set(assessmentId, initialEntry);
    writeStatusFile(assessmentId, initialEntry);
    await dbWriteStatus(assessmentId, initialEntry); // persist before 202 so first poll never 404s

    // Fire-and-forget — response is delivered via poll endpoint
    runAssessmentBackground(assessmentId, files, context);

    console.log(`📄 Assessment ${assessmentId} queued (${files.length} docs)`);
    return res.status(202).json({ assessmentId, status: 'pending' });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to start assessment', details: errMsg });
  }
});

// GET /api/assess/:id/status — poll for assessment progress
router.get('/:assessmentId/status', async (req: Request, res: Response) => {
  const id = String(req.params['assessmentId']);

  // L1: in-memory (same process)
  let entry: { status: string; progress?: string; result?: any; error?: string } | undefined =
    assessmentCache.get(id);

  // L2: file-based (same container, survived restart)
  if (!entry) {
    entry = readStatusFile(id) ?? undefined;
    if (entry) assessmentCache.set(id, entry as any); // warm L1
  }

  // L3: DB (survives full container restart / multi-instance Railway)
  if (!entry) {
    const dbEntry = await dbReadStatus(id);
    if (dbEntry) {
      entry = dbEntry;
      assessmentCache.set(id, dbEntry as any); // warm L1 + L2
      writeStatusFile(id, dbEntry);
    }
  }

  if (!entry) {
    return res.status(404).json({ error: 'Assessment not found or expired' });
  }
  if (entry.status === 'pending') {
    return res.json({ status: 'pending', progress: entry.progress || 'Processing…' });
  }
  if (entry.status === 'error') {
    return res.json({ status: 'error', error: entry.error });
  }
  // done — return full result
  return res.json({ status: 'done', ...entry.result });
});

/**
 * Poll for specialist review result
 * L1: in-memory cache (same process, fast path)
 * L2: DB (survives server restarts and Railway container cycling)
 * Returns { status: 'pending' | 'done' | 'error', domain_reviews? }
 */
router.get('/crew-review/:assessmentId', async (req: Request, res: Response) => {
  const id = String(req.params['assessmentId']);

  // L1: in-memory
  const memEntry = crewReviewCache.get(id);
  if (memEntry) {
    if (memEntry.status === 'pending') return res.json({ status: 'pending' });
    if (memEntry.status === 'error')   return res.json({ status: 'error', error: memEntry.error });
    return res.json({ status: 'done', domain_reviews: memEntry.result });
  }

  // L2: DB fallback (page refresh / server restart scenario)
  try {
    const row = await prisma.quickAssessJob.findUnique({ where: { id } });
    if (!row) return res.status(404).json({ error: 'No crew review found for this assessment' });

    if (row.crewStatus === 'done' && row.crewReview) {
      const parsed = JSON.parse(row.crewReview);
      crewReviewCache.set(id, { status: 'done', result: parsed }); // warm L1
      return res.json({ status: 'done', domain_reviews: parsed });
    }
    if (row.crewStatus === 'error') {
      return res.json({ status: 'error', error: row.crewError ?? 'Specialist review failed' });
    }
    // Assessment exists in DB but crew review not yet done — still pending
    return res.json({ status: 'pending' });
  } catch {
    return res.status(404).json({ error: 'No crew review found for this assessment' });
  }
});

/**
 * Save assessment results to database (creates client + pack)
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { assessmentId, clientName, projectName, clientCompany, userEmail } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ error: 'Assessment ID required' });
    }

    if (!clientName || !projectName) {
      return res.status(400).json({ error: 'Client name and project name required' });
    }

    // Load temp assessment data
    const tempDataPath = path.join(process.cwd(), 'temp-uploads', `${assessmentId}.json`);

    if (!fs.existsSync(tempDataPath)) {
      return res.status(404).json({ error: 'Assessment data not found or expired' });
    }

    const tempData = JSON.parse(fs.readFileSync(tempDataPath, 'utf-8'));

    console.log(`💾 Saving assessment to database: ${clientName} / ${projectName}`);

    // Create client
    const client = await prisma.client.create({
      data: {
        name: clientName,
        company: clientCompany || null
      }
    });

    console.log(`✓ Created client: ${client.id}`);
    sendNewOrgNotification(client.name).catch(() => {});

    // Create pack
    const pack = await prisma.pack.create({
      data: {
        name: projectName,
        clientId: client.id
      }
    });

    console.log(`✓ Created pack: ${pack.id}`);

    // Create pack version
    const version = await prisma.packVersion.create({
      data: {
        packId: pack.id,
        versionNumber: 1,
        matrixAssessment: JSON.stringify(tempData.results),
        buildingType: tempData.context.buildingType,
        height: tempData.context.heightMeters?.toString() || null,
        storeys: tempData.context.storeys?.toString() || null
      }
    });

    console.log(`✓ Created version: ${version.id}`);

    // AUTO-GENERATE ACTION ITEMS FROM ASSESSMENT
    console.log(`📋 Auto-generating action items from assessment...`);

    const allIssues = tempData.results.results.filter((r: any) =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );

    // Extract critical blockers
    const criticalIssues = allIssues.filter((i: any) =>
      i.triage?.urgency === 'CRITICAL_BLOCKER' ||
      i.triage?.blocks_submission
    );

    // Extract missing information items
    const missingInfo = allIssues.filter((i: any) => {
      const reasoning = (i.reasoning || '').toLowerCase();
      const gaps = (i.gaps_identified || []).join(' ').toLowerCase();
      return (
        reasoning.includes('missing') ||
        reasoning.includes('not provided') ||
        reasoning.includes('tbc') ||
        reasoning.includes('to be confirmed') ||
        gaps.includes('missing')
      );
    });

    // Extract specialist requirements
    const specialistRequired = allIssues.filter((i: any) => {
      const action = i.actions_required?.[0];
      return action?.owner && (
        action.owner.toLowerCase().includes('fire') ||
        action.owner.toLowerCase().includes('structural') ||
        action.owner.toLowerCase().includes('mep') ||
        action.owner.toLowerCase().includes('architect') ||
        action.owner.toLowerCase().includes('engineer')
      );
    });

    // Create tasks for critical blockers
    const tasksToCreate: any[] = [];
    let sortOrder = 0;

    criticalIssues.forEach((issue: any) => {
      tasksToCreate.push({
        title: `[CRITICAL] ${issue.matrix_title}`,
        description: issue.reasoning || 'Critical blocker - must be resolved before submission',
        sortOrder: sortOrder++,
        status: 'not_started',
        priority: 'high',
        category: 'Critical Blocker',
        tags: JSON.stringify(['critical', 'blocker'])
      });
    });

    // Create tasks for missing information (limit to 10 most important)
    missingInfo.slice(0, 10).forEach((issue: any) => {
      const action = issue.actions_required?.[0];
      tasksToCreate.push({
        title: `Missing: ${issue.matrix_title}`,
        description: `${issue.reasoning || 'Information missing from submission'}\n\n${action ? `Action: ${action.action}` : ''}`,
        sortOrder: sortOrder++,
        status: 'not_started',
        priority: 'medium',
        category: 'Missing Information',
        tags: JSON.stringify(['missing-info', 'client-action'])
      });
    });

    // Create tasks for specialist requirements (limit to 5 most important)
    const uniqueSpecialists = new Set<string>();
    specialistRequired.slice(0, 5).forEach((issue: any) => {
      const action = issue.actions_required?.[0];
      const specialist = action?.owner || 'Specialist';

      if (!uniqueSpecialists.has(specialist)) {
        uniqueSpecialists.add(specialist);
        tasksToCreate.push({
          title: `Engage: ${specialist}`,
          description: `Required for: ${issue.matrix_title}\n\n${action ? `Action: ${action.action}` : ''}`,
          sortOrder: sortOrder++,
          status: 'not_started',
          priority: 'medium',
          category: 'Specialist Required',
          tags: JSON.stringify(['specialist', specialist.toLowerCase()])
        });
      }
    });

    // Bulk create all tasks
    if (tasksToCreate.length > 0) {
      await prisma.packTask.createMany({
        data: tasksToCreate.map(task => ({
          packId: pack.id,
          ...task
        }))
      });
      console.log(`✓ Created ${tasksToCreate.length} action items`);
    }

    // Move uploaded files to permanent storage
    const uploadsDir = path.join(process.cwd(), 'uploads', pack.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Phase 1: filesystem operations (must run outside a DB transaction).
    // Every submitted document is resolved to a final path + chunk records here.
    // Scanned/image PDFs produce zero chunks and are flagged for gap-item injection.
    type DocToSave = {
      filename: string;
      filepath: string;
      docType: string | null;
      chunkRecords: { text: string; pageRef: number; chunkIndex: number }[];
    };
    const docsToSave: DocToSave[] = [];
    const unprocessableDocs: string[] = [];

    for (const doc of tempData.packDocs) {
      let finalPath: string = doc.filepath;
      let chunkRecords: { text: string; pageRef: number; chunkIndex: number }[];

      if (fs.existsSync(doc.filepath)) {
        const newPath = path.join(uploadsDir, doc.filename);
        fs.copyFileSync(doc.filepath, newPath);
        finalPath = newPath;
        // Use processPDF so every chunk carries the correct page number
        const docInfo = await processPDF(doc.filepath);
        chunkRecords = docInfo.chunks;
      } else {
        // File is gone — fall back to text-only chunking; page citations will not be
        // accurate but content is preserved so re-runs are not blocked.
        console.warn(`[Save] ${doc.filename}: original file gone, falling back to single-page chunks — page citations will not be accurate`);
        const text: string = doc.extractedText || '';
        const CHUNK_SIZE = 1000;
        const CHUNK_OVERLAP = 200;
        const advance = CHUNK_SIZE - CHUNK_OVERLAP; // guard: loop only runs when advance > 0
        chunkRecords = [];
        let charIdx = 0;
        let chunkIdx = 0;
        while (advance > 0 && charIdx < text.length) {
          const slice = text.slice(charIdx, charIdx + CHUNK_SIZE).trim();
          if (slice.length > 0) {
            chunkRecords.push({ text: slice, pageRef: 1, chunkIndex: chunkIdx++ });
          }
          charIdx += advance;
        }
      }

      if (chunkRecords.length === 0) {
        console.warn(`[Save] ${doc.filename} yielded no extractable text (scanned/image PDF) — saved to pack without chunks; gap item will appear in assessment.`);
        unprocessableDocs.push(doc.filename);
      }

      docsToSave.push({ filename: doc.filename, filepath: finalPath, docType: doc.docType, chunkRecords });
    }

    console.log(`✓ Processed ${docsToSave.length}/${tempData.packDocs.length} documents${unprocessableDocs.length > 0 ? ` (${unprocessableDocs.length} not chunked — scanned PDF)` : ''}`);

    // Phase 2: inject gap items into the in-memory assessment before any DB write,
    // so the transaction below stores a consistent, fully-annotated result.
    if (unprocessableDocs.length > 0) {
      for (const filename of unprocessableDocs) {
        (tempData.results.results as any[]).push({
          matrix_id: `UNPROCESSED_DOC_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`,
          matrix_title: `Unprocessed Document: ${filename}`,
          category: 'Document Processing',
          status: 'not_assessed',
          severity: 'high',
          reasoning:
            `"${filename}" was submitted but could not be processed — it appears to be a scanned ` +
            `or image-only PDF with no text layer. Its contents were not evaluated in this assessment.`,
          success_definition: 'Document is a searchable PDF with fully extractable text.',
          pack_evidence: { found: false, document: filename, page: null, quote: null },
          reference_evidence: { found: false, doc_id: null, doc_title: null, page: null, quote: null },
          gaps_identified: [`"${filename}" has no text layer — content could not be extracted or assessed.`],
          actions_required: [{
            action: `Re-upload "${filename}" as a searchable (text-layer) PDF.`,
            owner: 'Principal Designer',
            effort: 'S' as const,
            expected_benefit: 'Document content will be included in the assessment.',
          }],
        });
      }
    }

    // Phase 3: single atomic transaction — all document records + amended assessment
    // are written together so a partial failure can never leave the DB inconsistent.
    await prisma.$transaction(async (tx) => {
      for (const doc of docsToSave) {
        await tx.document.create({
          data: {
            packVersionId: version.id,
            libraryType: 'pack',
            filename: doc.filename,
            filepath: doc.filepath,
            docType: doc.docType,
            chunks: { create: doc.chunkRecords },
          },
        });
      }
      if (unprocessableDocs.length > 0) {
        await tx.packVersion.update({
          where: { id: version.id },
          data: { matrixAssessment: JSON.stringify(tempData.results) },
        });
      }
    });

    // ── Admin instrumentation: create Organisation + Submission ──────────────
    try {
      const assessment = tempData.results;
      const orgName = clientCompany || clientName;
      const orgEmail = userEmail || 'unknown@attlee.ai';
      const pilotOrgs = ['l&q', 'peabody', 'clarion', 'notting hill genesis'];
      const isPilot = pilotOrgs.some(p => orgName.toLowerCase().includes(p));

      // Find or create Organisation
      let org = await prisma.organisation.findFirst({ where: { name: orgName } });
      if (!org) {
        org = await prisma.organisation.create({
          data: { name: orgName, primaryEmail: orgEmail, isPilot }
        });
      }

      // Extract failure categories from results
      const failedResults = (assessment.results || []).filter(
        (r: any) => r.status === 'does_not_meet' || r.status === 'partial'
      );
      const failureCategorySet = new Set<string>(failedResults.map((r: any) => r.category).filter(Boolean));
      const failureCategories = Array.from(failureCategorySet);

      // API usage from assessment
      const apiUsage = assessment.api_usage || { api_calls_made: 0, tokens_input: 0, tokens_output: 0 };
      // Estimate cost: claude-sonnet-4 at ~$3/M input, $15/M output, convert to GBP (0.79)
      const estimatedCostUsd = (apiUsage.tokens_input / 1_000_000) * 3 + (apiUsage.tokens_output / 1_000_000) * 15;
      const estimatedCostGbp = estimatedCostUsd * 0.79;

      const summary = assessment.criteria_summary || {};

      await prisma.submission.create({
        data: {
          organisationId: org.id,
          userEmail: orgEmail,
          completedAt: new Date(),
          processingTimeSeconds: tempData.processingTimeSeconds || null,
          documentCount: tempData.packDocs.length,
          documentNames: JSON.stringify(tempData.packDocs.map((d: any) => d.filename)),
          totalChecksRun: summary.total_applicable || 0,
          checksPassed: summary.meets || 0,
          checksPartial: summary.partial || 0,
          checksFailed: summary.does_not_meet || 0,
          regulatoryReadinessScore: assessment.readiness_score ?? null,
          failureCategories: JSON.stringify(failureCategories),
          apiCallsMade: apiUsage.api_calls_made,
          tokensInput: apiUsage.tokens_input,
          tokensOutput: apiUsage.tokens_output,
          estimatedApiCostGbp: estimatedCostGbp,
          status: 'completed'
        }
      });

      // Update org last_active and submission count
      await prisma.organisation.update({
        where: { id: org.id },
        data: { lastActiveAt: new Date(), submissionCount: { increment: 1 } }
      });

      console.log(`✓ Admin submission record created for org: ${orgName}`);
    } catch (adminErr) {
      // Non-fatal: don't fail the save if admin instrumentation fails
      console.error('Warning: admin instrumentation failed:', adminErr);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Clean up temp files
    fs.unlinkSync(tempDataPath);
    tempData.packDocs.forEach((doc: any) => {
      if (fs.existsSync(doc.filepath)) fs.unlinkSync(doc.filepath);
    });

    res.json({
      success: true,
      client: { id: client.id, name: client.name },
      pack: { id: pack.id, name: pack.name },
      version: { id: version.id, versionNumber: version.versionNumber }
    });

  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({
      error: 'Failed to save assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
