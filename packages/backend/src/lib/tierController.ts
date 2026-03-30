/**
 * tierController.ts — Large-Pack Tiered Processing Controller
 *
 * Processes application packs of 1,600–2,000 PDFs in three tiers:
 *
 *   Tier 1 — Ingest + classify every file (concurrency-limited, no LLM if
 *             classifier confidence is 'high' or 'medium')
 *   Tier 2 — Filter by target Approved Document Part, retrieve the most
 *             relevant chunks via TF-IDF cosine similarity (top 30)
 *   Tier 3 — One groundedCall per check against the retrieved subset
 *
 * Embedding note: neither openai nor a dedicated embeddings endpoint is
 * installed in this project (package.json has @anthropic-ai/sdk only, and
 * the Anthropic API does not expose an embeddings endpoint). Retrieval
 * therefore uses TF-IDF cosine similarity — zero external API cost and
 * sufficient for keyword-dense BSR compliance documents.
 */

import { ingestPDF } from './ingest';
import { classifyDocument } from './classifier';
import { groundedCall, GroundedResponse, SourcePassage } from './groundedLLM';
import { DocumentChunk } from './ingest';
import { ApprovedDocumentPart } from '../types';

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface ClassifiedDocument {
  chunks: DocumentChunk[];
  part: ApprovedDocumentPart;
  confidence: 'high' | 'medium' | 'low';
}

export interface RetrievedSubset {
  checkId: string;
  targetParts: ApprovedDocumentPart[];
  relevantChunks: DocumentChunk[];
}

export interface AnalysisResult {
  checkId: string;
  findings: GroundedResponse[];
}

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

/**
 * Run `tasks` with at most `limit` concurrent executions.
 * Returns results in the same order as input (using Promise.allSettled semantics).
 */
async function withConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      try {
        results[index] = { status: 'fulfilled', value: await tasks[index]() };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// TF-IDF cosine similarity (Tier 2 retrieval)
// ---------------------------------------------------------------------------

type TermVector = Map<string, number>;

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function buildTf(tokens: string[]): TermVector {
  const tf: TermVector = new Map();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  // Normalise by document length
  const len = tokens.length || 1;
  tf.forEach((v, k) => tf.set(k, v / len));
  return tf;
}

function buildIdf(vectors: TermVector[]): TermVector {
  const df: TermVector = new Map();
  const N = vectors.length || 1;
  for (const vec of vectors) {
    for (const term of vec.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const idf: TermVector = new Map();
  df.forEach((count, term) => {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1); // smooth IDF
  });
  return idf;
}

function applyIdf(tf: TermVector, idf: TermVector): TermVector {
  const tfidf: TermVector = new Map();
  tf.forEach((tfVal, term) => {
    tfidf.set(term, tfVal * (idf.get(term) ?? 1));
  });
  return tfidf;
}

function cosineSimilarity(a: TermVector, b: TermVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  a.forEach((val, term) => {
    dot += val * (b.get(term) ?? 0);
    normA += val * val;
  });
  b.forEach((val) => {
    normB += val * val;
  });

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Return up to `topK` chunks from `pool` ranked by TF-IDF cosine similarity
 * against `query`.
 */
function retrieveTopChunks(
  pool: DocumentChunk[],
  query: string,
  topK: number
): DocumentChunk[] {
  if (pool.length === 0) return [];

  const chunkVectors = pool.map((c) => buildTf(tokenise(c.text)));
  const queryTokens = tokenise(query);

  // Build IDF across the filtered pool (not the whole corpus)
  const idf = buildIdf(chunkVectors);
  const queryTfidf = applyIdf(buildTf(queryTokens), idf);

  const scored = pool.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(applyIdf(chunkVectors[i], idf), queryTfidf),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.chunk);
}

// ---------------------------------------------------------------------------
// Tier 1 — Ingest and classify all files
// ---------------------------------------------------------------------------

const TIER1_CONCURRENCY = 20;
const TIER1_LOG_INTERVAL = 100;

export async function runTier1(files: string[]): Promise<ClassifiedDocument[]> {
  console.log(`[Tier 1] Starting ingestion and classification of ${files.length} files`);

  let completed = 0;
  let llmClassifications = 0;

  const tasks = files.map((filePath) => async (): Promise<ClassifiedDocument> => {
    const chunks = await ingestPDF(filePath);
    const { part, confidence } = await classifyDocument(chunks);

    completed++;
    if (confidence === 'low') llmClassifications++;

    if (completed % TIER1_LOG_INTERVAL === 0 || completed === files.length) {
      console.log(
        `[Tier 1] ${completed}/${files.length} files processed` +
        ` (${llmClassifications} LLM classifier calls so far)`
      );
    }

    return { chunks, part, confidence };
  });

  const settled = await withConcurrencyLimit(tasks, TIER1_CONCURRENCY);

  const classified: ClassifiedDocument[] = [];
  let skipped = 0;

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === 'fulfilled') {
      classified.push(result.value);
    } else {
      skipped++;
      console.warn(`[Tier 1] Failed to process "${files[i]}":`, result.reason);
    }
  }

  console.log(
    `[Tier 1] Complete — ${classified.length} classified, ${skipped} skipped`
  );

  return classified;
}

// ---------------------------------------------------------------------------
// Tier 2 — Filter by target parts, retrieve top-30 chunks
// ---------------------------------------------------------------------------

const TIER2_TOP_K = 30;

export async function runTier2(
  classified: ClassifiedDocument[],
  targetParts: ApprovedDocumentPart[],
  checkId: string
): Promise<RetrievedSubset> {
  const targetSet = new Set<ApprovedDocumentPart>(targetParts);

  // Collect all chunks from documents assigned to the target parts
  const pool: DocumentChunk[] = classified
    .filter((doc) => targetSet.has(doc.part))
    .flatMap((doc) => doc.chunks);

  const relevantChunks = retrieveTopChunks(pool, checkId, TIER2_TOP_K);

  console.log(
    `[Tier 2] check="${checkId}" parts=[${targetParts.join(',')}] ` +
    `pool=${pool.length} chunks → selected ${relevantChunks.length}`
  );

  return { checkId, targetParts, relevantChunks };
}

// ---------------------------------------------------------------------------
// Tier 3 — One groundedCall per check
// ---------------------------------------------------------------------------

export async function runTier3(subset: RetrievedSubset): Promise<AnalysisResult> {
  const passages: SourcePassage[] = subset.relevantChunks.map((chunk) => ({
    filename: chunk.filename,
    page: chunk.pageNumber,
    section: chunk.sectionHeading || 'Unknown section',
    text: chunk.text,
  }));

  const prompt =
    `Review the following source passages for compliance check "${subset.checkId}" ` +
    `against Approved Document Part(s) ${subset.targetParts.join(', ')}. ` +
    `Identify any gaps, inconsistencies, or insufficient information. ` +
    `Cite every finding with [filename, p.N, §Section].`;

  const response = await groundedCall(prompt, passages);

  console.log(
    `[Tier 3] check="${subset.checkId}" isClean=${response.isClean}` +
    (response.uncitedSentences.length > 0
      ? ` uncited=${response.uncitedSentences.length}`
      : '')
  );

  return {
    checkId: subset.checkId,
    findings: [response],
  };
}

// ---------------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------------

export async function processApplicationPack(
  files: string[],
  checks: Array<{ checkId: string; targetParts: ApprovedDocumentPart[] }>
): Promise<AnalysisResult[]> {
  console.log(
    `\n${'='.repeat(60)}\n` +
    `[processApplicationPack] ${files.length} files, ${checks.length} checks\n` +
    `${'='.repeat(60)}`
  );

  // ---- Tier 1: run once across all files ----
  const classified = await runTier1(files);

  const skippedCount = files.length - classified.length;
  let llmCallCount = classified.filter((d) => d.confidence === 'low').length;

  // ---- Tier 2 + Tier 3: once per check ----
  const results: AnalysisResult[] = [];

  for (const check of checks) {
    const subset = await runTier2(classified, check.targetParts, check.checkId);

    if (subset.relevantChunks.length === 0) {
      console.warn(
        `[processApplicationPack] No relevant chunks found for check "${check.checkId}" ` +
        `— skipping Tier 3 call`
      );
      results.push({ checkId: check.checkId, findings: [] });
      continue;
    }

    const result = await runTier3(subset);
    llmCallCount++; // one groundedCall per check (retry counted separately inside groundedCall)
    results.push(result);
  }

  console.log(
    `\n${'='.repeat(60)}\n` +
    `[processApplicationPack] Complete\n` +
    `  Total files:      ${files.length}\n` +
    `  Skipped files:    ${skippedCount}\n` +
    `  Total LLM calls:  ${llmCallCount}\n` +
    `${'='.repeat(60)}\n`
  );

  return results;
}
