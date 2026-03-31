/**
 * LangGraph-Orchestrated Assessment Engine
 *
 * Replaces the sequential LLM loop in Phase 2 of matrix-assessment.ts with:
 *
 *   START
 *     ↓
 *   parallel_assess   — Run all 8 category groups concurrently (vs. 30 sequential calls)
 *     ↓
 *   critique          — Re-examine high-severity "partial" results that may be false negatives
 *     ↓
 *   END
 *
 * Drop-in replacement: call runLangGraphAssessment() instead of the for-loop in
 * assessPackAgainstMatrix(). Returns the same AssessmentResult[] shape.
 */

import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import Anthropic from '@anthropic-ai/sdk';

// Re-use the existing assessment primitives — we import only the types
// and call them the same way the existing engine does.
// These types are duplicated here to avoid circular imports.
export interface PackDocument {
  filename: string;
  docType: string | null;
  extractedText: string;
  filepath?: string;
}

export interface PackContext {
  isLondon: boolean;
  isHRB: boolean;
  buildingType: string;
  heightMeters: number | null;
  storeys: number | null;
}

export interface MatrixRow {
  matrix_id: string;
  matrix_title: string;
  matrix_description: string;
  success_definition: string;
  failure_modes: string[];
  applicability_rules: any;
  reference_sources: string[];
  evidence_expected: string[];
  category: string;
  severity_if_unmet: string;
}

// Use 'any' to avoid circular dependency with matrix-assessment.ts which
// defines the full AssessmentResult type with many required fields.
// The runtime shape matches — TypeScript just can't resolve the two files.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssessmentResult = any;

// ── Graph state ───────────────────────────────────────────────────────────────

const AssessmentStateAnnotation = Annotation.Root({
  packDocs:       Annotation<PackDocument[]>,
  context:        Annotation<PackContext>,
  criteria:       Annotation<MatrixRow[]>,
  client:         Annotation<Anthropic>,
  // Results accumulate via reducer — each node appends its slice
  results: Annotation<AssessmentResult[]>({
    reducer: (existing, incoming) => [...existing, ...incoming],
    default: () => [],
  }),
  // Track which IDs were critiqued so we can replace the original
  critiqueUpdates: Annotation<Map<string, AssessmentResult>>({
    reducer: (existing, incoming) => new Map([...existing, ...incoming]),
    default: () => new Map(),
  }),
});

type AssessmentState = typeof AssessmentStateAnnotation.State;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * One targeted LLM call: extract facts for a single criterion and decide status.
 * Mirrors extractFacts + applyComplianceLogic from matrix-assessment.ts but
 * emits a simpler result suitable for the critique use-case.
 */
async function singleCriterionCall(
  row: MatrixRow,
  packDocs: PackDocument[],
  client: Anthropic,
  mode: 'standard' | 'critique' = 'standard'
): Promise<AssessmentResult> {
  const docContext = packDocs.map(d =>
    `Document: ${d.filename}\nType: ${d.docType || 'Unknown'}\n` +
    `Content excerpt:\n${d.extractedText.slice(0, 1500)}`
  ).join('\n\n---\n\n');

  const critiquePrefix = mode === 'critique'
    ? `⚠️  CRITIQUE MODE: A previous analysis marked this as PARTIAL. Look harder. ` +
      `Is there actually enough explicit evidence to mark this as MEETS? Be thorough.\n\n`
    : '';

  const prompt = `${critiquePrefix}## BSR Compliance Check
ID: ${row.matrix_id}
Title: ${row.matrix_title}
Description: ${row.matrix_description}
Success definition: ${row.success_definition}
Expected evidence: ${row.evidence_expected.join(', ')}
Severity if unmet: ${row.severity_if_unmet}

## Documents
${docContext}

## Your Task
Assess whether the documents satisfy this criterion.
Respond in JSON only:
{
  "status": "meets" | "partial" | "does_not_meet" | "missing_information",
  "reasoning": "Concise evidence-based explanation (1-3 sentences). Quote the document if relevant.",
  "gaps_identified": ["specific gap 1", "specific gap 2"],
  "actions_required": [{ "action": "...", "owner": "...", "effort": "S|M|L" }]
}`;

  let responseText = '';
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    responseText = (response.content[0] as any).text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      matrix_id: row.matrix_id,
      matrix_title: row.matrix_title,
      category: row.category,
      status: parsed.status || 'not_assessed',
      severity: row.severity_if_unmet,
      reasoning: parsed.reasoning || '',
      success_definition: row.success_definition,
      pack_evidence: { found: parsed.status === 'meets', document: null, page: null, quote: null },
      reference_evidence: { found: false, doc_id: null, doc_title: null, page: null, quote: null },
      gaps_identified: parsed.gaps_identified || [],
      actions_required: parsed.actions_required || [],
      confidence_old: 'medium',
      proposed_change: null,
      evidence_quality: parsed.status === 'meets' ? 'explicit' : 'absent',
      _langgraph: true,
    };
  } catch {
    return {
      matrix_id: row.matrix_id,
      matrix_title: row.matrix_title,
      category: row.category,
      status: 'not_assessed',
      severity: row.severity_if_unmet,
      reasoning: `LangGraph assessment failed to parse response: ${responseText.slice(0, 200)}`,
      success_definition: row.success_definition,
      pack_evidence: { found: false, document: null, page: null, quote: null },
      reference_evidence: { found: false, doc_id: null, doc_title: null, page: null, quote: null },
      gaps_identified: [],
      actions_required: [],
      confidence_old: 'low',
      proposed_change: null,
      evidence_quality: 'absent',
      _langgraph: true,
    };
  }
}

// ── Graph nodes ───────────────────────────────────────────────────────────────

/**
 * parallel_assess node
 * Groups criteria by category, runs all groups concurrently.
 * Each group's criteria run sequentially within the group
 * (to avoid hammering the API simultaneously from 30 calls).
 */
async function parallelAssessNode(state: AssessmentState): Promise<Partial<AssessmentState>> {
  const { criteria, packDocs, client } = state;

  // Group by category
  const groups = new Map<string, MatrixRow[]>();
  for (const row of criteria) {
    const cat = row.category || 'OTHER';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(row);
  }

  console.log(`[LangGraph] parallel_assess: ${groups.size} category groups → ${criteria.length} checks`);
  const groupNames = [...groups.keys()].join(', ');
  console.log(`[LangGraph] Categories: ${groupNames}`);

  // Run category groups sequentially to prevent OOM on constrained containers.
  // (Speed is not critical here — assessments run in the background with async polling.)
  const results: AssessmentResult[] = [];
  for (const [category, rows] of groups.entries()) {
    console.log(`  [LangGraph] → ${category}: ${rows.length} checks`);
    for (const row of rows) {
      const result = await singleCriterionCall(row, packDocs, client, 'standard');
      results.push(result);
    }
    console.log(`  [LangGraph] ✓ ${category} done`);
  }
  console.log(`[LangGraph] parallel_assess complete: ${results.length} results`);
  return { results };
}

/**
 * critique node
 * Re-examines high-severity "partial" results.
 * A "partial" on a HIGH severity check might be a false negative —
 * the evidence exists but the first pass was too conservative.
 * The critique LLM call specifically looks harder before confirming partial.
 */
async function critiqueNode(state: AssessmentState): Promise<Partial<AssessmentState>> {
  const { results, packDocs, criteria, client } = state;

  // Find high-severity partials worth re-examining
  const toReview = results.filter(r =>
    r.status === 'partial' &&
    (r.severity === 'high' || r.severity === 'critical') &&
    r._langgraph === true
  );

  if (toReview.length === 0) {
    console.log('[LangGraph] critique: no high-severity partials to review');
    return {};
  }

  console.log(`[LangGraph] critique: re-examining ${toReview.length} high-severity partial results`);

  const updates = new Map<string, AssessmentResult>();

  for (const original of toReview) {
    const row = criteria.find(c => c.matrix_id === original.matrix_id);
    if (!row) continue;

    const revised = await singleCriterionCall(row, packDocs, client, 'critique');

    // Only upgrade from partial → meets (don't downgrade)
    if (revised.status === 'meets' && original.status === 'partial') {
      console.log(`  [LangGraph] ✓ ${row.matrix_id}: upgraded partial → meets after critique`);
      updates.set(row.matrix_id, {
        ...revised,
        reasoning: `[Critique confirmed: meets]\n${revised.reasoning}`,
      });
    } else {
      console.log(`  [LangGraph] → ${row.matrix_id}: critique confirmed ${original.status}`);
    }
  }

  console.log(`[LangGraph] critique complete: ${updates.size} upgrades`);
  return { critiqueUpdates: updates };
}

// ── Graph definition ──────────────────────────────────────────────────────────

function buildGraph() {
  const graph = new StateGraph(AssessmentStateAnnotation)
    .addNode('parallel_assess', parallelAssessNode)
    .addNode('critique', critiqueNode)
    .addEdge(START, 'parallel_assess')
    .addEdge('parallel_assess', 'critique')
    .addEdge('critique', END);

  return graph.compile();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for the sequential for-loop in assessPackAgainstMatrix().
 *
 * Usage:
 *   // Before (sequential):
 *   for (const row of applicableCriteria) {
 *     const result = await assessCriterionTwoStage(row, packDocs, referenceEvidence, client);
 *     llmResults.push(result);
 *   }
 *
 *   // After (LangGraph parallel + critique):
 *   const llmResults = await runLangGraphAssessment(applicableCriteria, packDocs, context, client);
 */
export async function runLangGraphAssessment(
  criteria: MatrixRow[],
  packDocs: PackDocument[],
  _context: PackContext,
  client: Anthropic
): Promise<AssessmentResult[]> {
  // Plain sequential loop — bypasses LangGraph's graph/state machinery to
  // avoid internal serialisation crashes on constrained Railway containers.
  // Logic is identical: assess every criterion, then critique high-severity partials.

  console.log(`[assess] Phase 2: ${criteria.length} criteria (sequential)`);

  // Step 1 — assess every criterion
  const results: AssessmentResult[] = [];
  for (const row of criteria) {
    const result = await singleCriterionCall(row, packDocs, client, 'standard');
    results.push(result);
  }

  console.log(`[assess] Phase 2 done: ${results.length} results`);

  // Step 2 — critique high-severity partials
  const toReview = results.filter(r =>
    r.status === 'partial' &&
    (r.severity === 'high' || r.severity === 'critical') &&
    r._langgraph === true
  );

  if (toReview.length > 0) {
    console.log(`[assess] Critique: re-examining ${toReview.length} high-severity partials`);
    for (const original of toReview) {
      const row = criteria.find(c => c.matrix_id === original.matrix_id);
      if (!row) continue;
      const revised = await singleCriterionCall(row, packDocs, client, 'critique');
      if (revised.status === 'meets') {
        const idx = results.findIndex(r => r.matrix_id === original.matrix_id);
        if (idx >= 0) {
          results[idx] = { ...revised, reasoning: `[Critique confirmed: meets]\n${revised.reasoning}` };
          console.log(`[assess] Critique: ${row.matrix_id} upgraded partial → meets`);
        }
      }
    }
  }

  return results;
}
