import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { analyzePackVersion, runMatrixAssessment } from '../services/analysis.js';
import { sendSubmissionErrorNotification } from '../services/telegram.js';
import {
  generateMarkdownReport,
  generatePDFReport,
  generateJSONExport,
  getReportContent,
  getMatrixReportContent,
  generateMatrixMarkdownReport,
  generateMatrixPDFReport,
  generateMatrixJSONExport,
} from '../services/report.js';
import { analysisLimiter, exportLimiter } from '../middleware/rate-limit.js';
import { chat, chatStream, AssessmentContext } from '../services/chat-service.js';
import { generateAIAnalysis } from '../services/ai-analysis-service.js';

const router = Router();

// In-memory analysis status tracking
const analysisStatus = new Map<
  string,
  { status: 'pending' | 'running' | 'completed' | 'failed'; error?: string }
>();

// SSE streams for live assessment progress
const progressStreams = new Map<string, Response>();

function broadcastProgress(versionId: string, event: object) {
  const stream = progressStreams.get(versionId);
  if (stream) {
    stream.write(`data: ${JSON.stringify(event)}\n\n`);
    // Flush immediately — Railway/nginx may buffer otherwise and events never reach the client
    (stream as any).flush?.();
  }
}

// POST /api/packs/:packId/versions/:versionId/analyze - Run analysis
router.post(
  '/packs/:packId/versions/:versionId/analyze',
  analysisLimiter,
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!versionId || !UUID_REGEX.test(versionId)) {
        return res.status(400).json({ error: 'Invalid version ID — must be a valid UUID.' });
      }

      // Check version exists
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: { documents: true },
      });

      if (!version) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }

      if (version.documents.length === 0) {
        res.status(400).json({ error: 'No documents in this version' });
        return;
      }

      // Set status to running
      analysisStatus.set(versionId, { status: 'running' });

      // Return immediately, run analysis in background
      res.json({ status: 'running', versionId });

      // Run analysis (don't await)
      analyzePackVersion(versionId)
        .then(() => {
          analysisStatus.set(versionId, { status: 'completed' });
        })
        .catch((error) => {
          console.error('Analysis failed:', error);
          analysisStatus.set(versionId, {
            status: 'failed',
            error: error.message,
          });
        });
    } catch (error) {
      console.error('Error starting analysis:', error);
      res.status(500).json({ error: 'Failed to start analysis' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/analyze/status - Get analysis status
router.get(
  '/packs/:packId/versions/:versionId/analyze/status',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const status = analysisStatus.get(versionId) || { status: 'pending' };

      // Also check if we have issues (analysis completed previously)
      if (status.status === 'pending') {
        const issueCount = await prisma.issueAction.count({
          where: { packVersionId: versionId },
        });
        if (issueCount > 0) {
          res.json({ status: 'completed' });
          return;
        }
      }

      res.json(status);
    } catch (error) {
      console.error('Error getting analysis status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/report - Get report content
router.get(
  '/packs/:packId/versions/:versionId/report',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const { markdown, data } = await getReportContent(versionId);

      // Parse JSON fields for issues
      const parsedIssues = data.issues.map((issue) => ({
        id: (issue as { id?: string }).id,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        finding: issue.finding,
        whyItMatters: issue.whyItMatters,
        action: issue.action,
        ownerRole: issue.ownerRole,
        effort: issue.effort,
        endUserConsideration: issue.endUserConsideration,
        expectedBenefit: issue.expectedBenefit,
        confidence: issue.confidence,
        citations: JSON.parse(issue.citations || '[]'),
        evidence: JSON.parse(issue.evidence || '[]'),
      }));

      // Calculate criteria based on Gateway 2 standard checks
      // These are the core criteria areas checked for every submission:
      const GATEWAY2_CRITERIA = [
        'Building Height Consistency',
        'Storey Count Consistency',
        'Fire Strategy Documentation',
        'Structural Information',
        'External Wall System Details',
        'Means of Escape Provisions',
        'Compartmentation Strategy',
        'Ventilation Systems',
        'Principal Designer Competence',
        'Principal Contractor Competence',
        'Construction Control Plan',
        'Change Control Process',
        'Golden Thread Compliance',
        'Fire Risk Assessment',
        'Building Description Accuracy',
        'Site Location Documentation',
        'Document Cross-Referencing',
        'Regulatory Compliance Mapping',
      ];

      const criteriaChecked = GATEWAY2_CRITERIA.length;
      // Issues represent criteria with problems - we need to ensure passed is never negative
      const criteriaWithIssues = Math.min(data.issues.length, criteriaChecked);
      const criteriaPassed = criteriaChecked - criteriaWithIssues;

      res.json({
        markdown,
        summary: {
          packName: data.pack.name,
          versionNumber: data.version.versionNumber,
          projectName: data.version.projectName,
          documentCount: data.documents.length,
          fieldCount: data.fields.length,
          issueCount: data.issues.length,
          highIssues: data.issues.filter((i) => i.severity === 'high').length,
          mediumIssues: data.issues.filter((i) => i.severity === 'medium')
            .length,
          lowIssues: data.issues.filter((i) => i.severity === 'low').length,
          criteriaChecked,
          criteriaPassed: Math.max(0, criteriaPassed),
        },
        issues: parsedIssues,
        documents: data.documents.map((d) => ({
          filename: d.filename.replace(/^\d+-\d+-/, ''),
          docType: d.docType,
        })),
        fields: data.fields,
      });
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({ error: 'Failed to get report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/report/download/:format - Download report
router.get(
  '/packs/:packId/versions/:versionId/report/download/:format',
  exportLimiter,
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string; const format = req.params.format as string;

      let filepath: string;
      let contentType: string;

      switch (format) {
        case 'md':
          filepath = await generateMarkdownReport(versionId);
          contentType = 'text/markdown';
          break;
        case 'pdf':
          filepath = await generatePDFReport(versionId);
          contentType = 'application/pdf';
          break;
        case 'json':
          filepath = await generateJSONExport(versionId);
          contentType = 'application/json';
          break;
        default:
          res.status(400).json({ error: 'Invalid format' });
          return;
      }

      const filename = path.basename(filepath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({ error: 'Failed to download report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/issues - Get issues
router.get(
  '/packs/:packId/versions/:versionId/issues',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;
      const { severity, category } = req.query;

      const where: {
        packVersionId: string;
        severity?: 'high' | 'medium' | 'low';
        category?: string;
      } = {
        packVersionId: versionId,
      };

      if (severity && ['high', 'medium', 'low'].includes(severity as string)) {
        where.severity = severity as 'high' | 'medium' | 'low';
      }
      if (category && typeof category === 'string') {
        where.category = category;
      }

      const issues = await prisma.issueAction.findMany({
        where,
        orderBy: [{ severity: 'asc' }, { category: 'asc' }, { createdAt: 'desc' }],
      });

      // Parse JSON fields
      const parsedIssues = issues.map((issue) => ({
        ...issue,
        citations: JSON.parse(issue.citations || '[]'),
        evidence: JSON.parse(issue.evidence || '[]'),
      }));

      res.json(parsedIssues);
    } catch (error) {
      console.error('Error getting issues:', error);
      res.status(500).json({ error: 'Failed to get issues' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/fields - Get extracted fields
router.get(
  '/packs/:packId/versions/:versionId/fields',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const fields = await prisma.extractedField.findMany({
        where: { packVersionId: versionId },
        include: {
          evidenceDocument: true,
        },
        orderBy: { fieldName: 'asc' },
      });

      res.json(fields);
    } catch (error) {
      console.error('Error getting fields:', error);
      res.status(500).json({ error: 'Failed to get fields' });
    }
  }
);

// ============================================
// MATRIX-BASED ASSESSMENT ENDPOINTS
// ============================================

// GET /api/packs/:packId/versions/:versionId/assessment-progress - SSE stream for live ticker
router.get(
  '/packs/:packId/versions/:versionId/assessment-progress',
  (req: Request, res: Response) => {
    const versionId = req.params.versionId as string;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    progressStreams.set(versionId, res);

    req.on('close', () => {
      progressStreams.delete(versionId);
    });
  }
);

// POST /api/packs/:packId/versions/:versionId/matrix-assess - Run matrix assessment
router.post(
  '/packs/:packId/versions/:versionId/matrix-assess',
  analysisLimiter,
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      // Check version exists
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: { documents: true },
      });

      if (!version) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }

      if (version.documents.length === 0) {
        res.status(400).json({ error: 'No documents in this version' });
        return;
      }

      // Set status to running
      analysisStatus.set(versionId, { status: 'running' });

      // Return immediately, run assessment in background
      res.json({ status: 'running', versionId, type: 'matrix' });

      // Run matrix assessment (don't await)
      runMatrixAssessment(versionId, (event) => broadcastProgress(versionId, event))
        .then(() => {
          analysisStatus.set(versionId, { status: 'completed' });
          broadcastProgress(versionId, { done: true });
          progressStreams.delete(versionId);
        })
        .catch((error) => {
          console.error('Matrix assessment failed:', error);
          analysisStatus.set(versionId, {
            status: 'failed',
            error: error.message,
          });
          // Notify the frontend immediately so it shows an error instead of spinning forever
          broadcastProgress(versionId, { error: true, message: error.message });
          progressStreams.delete(versionId);
          sendSubmissionErrorNotification({
            submissionId: versionId,
            errorMessage: error.message,
          }).catch(() => {});
        });
    } catch (error) {
      console.error('Error starting matrix assessment:', error);
      res.status(500).json({ error: 'Failed to start matrix assessment' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/matrix-report - Get matrix report
router.get(
  '/packs/:packId/versions/:versionId/matrix-report',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      const { markdown, assessment, uiSummary } = await getMatrixReportContent(versionId);

      if (!assessment) {
        res.status(404).json({ error: 'No matrix assessment found. Run matrix-assess first.' });
        return;
      }

      res.json({
        markdown,
        uiSummary,
        summary: {
          criteria_summary: assessment.criteria_summary,
          flagged_by_severity: assessment.flagged_by_severity,
          reference_standards: assessment.reference_standards_applied.length,
          guardrail_stats: assessment.guardrail_stats,
        },
        results: assessment.results,
        reference_standards: assessment.reference_standards_applied,
      });
    } catch (error) {
      console.error('Error getting matrix report:', error);
      res.status(500).json({ error: 'Failed to get matrix report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/matrix-report/download/:format
router.get(
  '/packs/:packId/versions/:versionId/matrix-report/download/:format',
  exportLimiter,
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string; const format = req.params.format as string;

      let filepath: string;
      let contentType: string;

      switch (format) {
        case 'md':
          filepath = await generateMatrixMarkdownReport(versionId);
          contentType = 'text/markdown';
          break;
        case 'pdf':
          filepath = await generateMatrixPDFReport(versionId);
          contentType = 'application/pdf';
          break;
        case 'json':
          filepath = await generateMatrixJSONExport(versionId);
          contentType = 'application/json';
          break;
        default:
          res.status(400).json({ error: 'Invalid format. Use md, pdf, or json.' });
          return;
      }

      const filename = path.basename(filepath);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading matrix report:', error);
      res.status(500).json({ error: 'Failed to download matrix report' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/assessment - Get full assessment (frontend-compatible)
// This is an alias/transformation of matrix-report for frontend compatibility
router.get(
  '/packs/:packId/versions/:versionId/assessment',
  async (req: Request, res: Response) => {
    try {
      const packId = req.params.packId as string;
      const versionId = req.params.versionId as string;

      // If assessment failed on the backend, surface the error immediately
      // rather than returning 404 forever and leaving the frontend spinning
      const runStatus = analysisStatus.get(versionId);
      if (runStatus?.status === 'failed') {
        res.status(503).json({ error: runStatus.error || 'Assessment failed. Please re-run.' });
        return;
      }

      // Get matrix assessment data
      const { assessment } = await getMatrixReportContent(versionId);

      if (!assessment) {
        res.status(404).json({ error: 'No assessment found. Run matrix-assess first.' });
        return;
      }

      // Get pack version for context
      const packVersion = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: {
          pack: true,
        },
      });

      if (!packVersion) {
        res.status(404).json({ error: 'Pack version not found' });
        return;
      }

      // Find the immediately preceding assessed version for diff
      const previousVersion = await prisma.packVersion.findFirst({
        where: {
          packId: packVersion.packId,
          createdAt: { lt: packVersion.createdAt },
          matrixAssessment: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform to FullAssessment format expected by frontend
      const fullAssessment = {
        pack_id: packId,
        version_id: versionId,
        pack_context: assessment.pack_context,
        readiness_score: assessment.readiness_score,
        reference_standards_applied: assessment.reference_standards_applied,
        results: assessment.results,
        generated_at: (assessment as any).generated_at || new Date().toISOString(),
        // Diff support — null when no prior assessment exists
        previous_assessment: previousVersion?.matrixAssessment ?? null,
        previous_version_id: previousVersion?.id ?? null,
        previous_version_created_at: previousVersion?.createdAt ?? null,
      };

      res.json(fullAssessment);
    } catch (error) {
      console.error('Error getting assessment:', error);
      res.status(500).json({ error: 'Failed to get assessment' });
    }
  }
);

// GET /api/packs/:packId/versions/:versionId/submission-gate - Get submission gate decision
router.get(
  '/packs/:packId/versions/:versionId/submission-gate',
  async (req: Request, res: Response) => {
    try {
      const versionId = req.params.versionId as string;

      // Get matrix assessment data
      const { assessment } = await getMatrixReportContent(versionId);

      if (!assessment) {
        res.status(404).json({ error: 'No assessment found. Run matrix-assess first.' });
        return;
      }

      // Calculate submission gate decision
      const criticalFailures = assessment.results.filter(
        (r: any) => r.status === 'does_not_meet' && r.category.includes('Critical')
      ).length;

      const highPriorityFailures = assessment.results.filter(
        (r: any) => r.status === 'does_not_meet' || r.status === 'partial'
      ).length;

      const totalCriteria = assessment.results.length;
      const passedCriteria = assessment.results.filter((r: any) => r.status === 'meets').length;

      // Determine gate status
      let decision: 'red' | 'amber' | 'green';
      let recommendation: string;

      if (criticalFailures > 0) {
        decision = 'red';
        recommendation = 'NOT READY - Critical issues must be resolved before submission';
      } else if (highPriorityFailures > totalCriteria * 0.3) {
        decision = 'amber';
        recommendation = 'REVIEW REQUIRED - Significant gaps identified that should be addressed';
      } else if (assessment.readiness_score >= 80) {
        decision = 'green';
        recommendation = 'READY - Pack meets quality standards for submission';
      } else {
        decision = 'amber';
        recommendation = 'REVIEW REQUIRED - Some gaps identified that should be addressed';
      }

      const submissionGate = {
        decision,
        recommendation,
        readiness_score: assessment.readiness_score,
        blockers: criticalFailures,
        high_priority_issues: highPriorityFailures,
        total_criteria: totalCriteria,
        passed_criteria: passedCriteria,
        generated_at: new Date().toISOString(),
      };

      res.json(submissionGate);
    } catch (error) {
      console.error('Error getting submission gate:', error);
      res.status(500).json({ error: 'Failed to get submission gate' });
    }
  }
);

async function serveDocumentFile(req: Request, res: Response) {
  try {
    const documentId = req.params.documentId as string;
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document || !document.filepath) return res.status(404).json({ error: 'Document not found' });
    if (!fs.existsSync(document.filepath)) return res.status(404).json({ error: 'File not found on disk' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    fs.createReadStream(document.filepath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve file' });
  }
}

// GET /api/packs/:packId/versions/:versionId/documents/:documentId/file
router.get('/packs/:packId/versions/:versionId/documents/:documentId/file', serveDocumentFile);

// GET /api/documents/:documentId/file  (simpler alias used by PDFViewerModal)
router.get('/documents/:documentId/file', serveDocumentFile);

async function loadAssessmentContext(packId: string, versionId: string): Promise<AssessmentContext | null> {
  const version = await prisma.packVersion.findFirst({
    where: { id: versionId, packId },
  });
  if (!version || !version.matrixAssessment) return null;
  const data = JSON.parse(version.matrixAssessment as string);
  return {
    pack_id: packId,
    version_id: versionId,
    project_name: version.projectName,
    building_type: version.buildingType,
    height_meters: version.height ? parseFloat(version.height) : null,
    storeys: version.storeys ? parseFloat(version.storeys) : null,
    readiness_score: data.readiness_score,
    criteria_summary: data.criteria_summary,
    flagged_by_severity: data.flagged_by_severity,
    results: data.results ?? [],
  };
}

router.get('/packs/:packId/versions/:versionId/ai-analysis', async (req: Request, res: Response) => {
  try {
    const packId = req.params.packId as string;
    const versionId = req.params.versionId as string;
    const context = await loadAssessmentContext(packId, versionId);
    if (!context) return res.status(404).json({ error: 'No assessment found. Run matrix-assess first.' });
    const analysis = await generateAIAnalysis(context);
    res.json(analysis);
  } catch (err) {
    console.error('AI analysis error:', err);
    res.status(500).json({ error: 'Failed to generate AI analysis' });
  }
});

router.post('/packs/:packId/versions/:versionId/chat', async (req: Request, res: Response) => {
  try {
    const packId = req.params.packId as string;
    const versionId = req.params.versionId as string;
    const { messages } = req.body as { messages: Array<{ role: 'user' | 'assistant'; content: string }> };
    if (!messages || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages array is required' });
    const context = await loadAssessmentContext(packId, versionId);
    if (!context) return res.status(404).json({ error: 'No assessment found. Run matrix-assess first.' });
    if (req.headers.accept === 'text/event-stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      await chatStream(context, messages, (chunk) => res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`), () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
    } else {
      const reply = await chat(context, messages);
      res.json({ reply });
    }
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
