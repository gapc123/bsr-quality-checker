/**
 * Sequential Assessment Engine
 *
 * Runs Phase 2 LLM checks sequentially (assess all criteria, then critique
 * high-severity partials). Previously used LangGraph's graph/state machinery
 * but that caused internal JSON.stringify crashes on constrained containers.
 */

import Anthropic from '@anthropic-ai/sdk';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssessmentResult = any;

async function singleCriterionCall(
  row: MatrixRow,
  packDocs: PackDocument[],
  client: Anthropic,
  mode: 'standard' | 'critique' = 'standard'
): Promise<AssessmentResult> {
  const docContext = packDocs.map(d =>
    `Document: ${d.filename}\nType: ${d.docType || 'Unknown'}\n` +
    `Content excerpt:\n${d.extractedText.slice(0, 8000)}`
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
Respond in JSON only — include exact evidence citations:
{
  "status": "meets" | "partial" | "does_not_meet" | "missing_information",
  "reasoning": "Concise evidence-based explanation (1-3 sentences). Reference the document and page.",
  "evidence_document": "exact filename from the documents listed above, or null if no evidence found",
  "evidence_page": page_number_integer_from_[PAGE_N]_marker_or_null,
  "evidence_quote": "verbatim quote of up to 150 chars from the document that supports your decision, or null",
  "gaps_identified": ["specific gap 1", "specific gap 2"],
  "actions_required": [{ "action": "...", "owner": "...", "effort": "S|M|L" }]
}
For evidence_page: look for [PAGE N] markers in the document text and return the page number where the key evidence appears.`;

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
      pack_evidence: {
        found: parsed.status === 'meets' || parsed.status === 'partial',
        document: parsed.evidence_document || null,
        page: typeof parsed.evidence_page === 'number' ? parsed.evidence_page : null,
        quote: parsed.evidence_quote || null,
      },
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
      reasoning: `Assessment failed to parse response: ${responseText.slice(0, 200)}`,
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

export type ProgressEvent = {
  criterionId: string;
  criterionName: string;
  phase: 'deterministic' | 'llm';
  total: number;
  current: number;
  /** 'checking' = LLM call in progress; otherwise the actual result status */
  status?: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed' | 'checking';
  /** Short finding summary, populated when status is not 'meets' */
  finding?: string;
};

export async function runLangGraphAssessment(
  criteria: MatrixRow[],
  packDocs: PackDocument[],
  _context: PackContext,
  client: Anthropic,
  onProgress?: (event: ProgressEvent) => void
): Promise<AssessmentResult[]> {
  console.log(`[assess] Phase 2: ${criteria.length} criteria (sequential)`);

  const results: AssessmentResult[] = [];
  for (let i = 0; i < criteria.length; i++) {
    const row = criteria[i];
    // Emit "checking" before the LLM call so the UI can show what's in progress
    onProgress?.({
      criterionId: row.matrix_id,
      criterionName: row.matrix_title,
      phase: 'llm',
      total: criteria.length,
      current: i,
      status: 'checking',
    });
    const result = await singleCriterionCall(row, packDocs, client, 'standard');
    results.push(result);
    // Emit result after the call completes
    const finding =
      result.status !== 'meets'
        ? (result.gaps_identified?.[0] || result.reasoning || '').slice(0, 150)
        : undefined;
    onProgress?.({
      criterionId: row.matrix_id,
      criterionName: row.matrix_title,
      phase: 'llm',
      total: criteria.length,
      current: i + 1,
      status: result.status as ProgressEvent['status'],
      finding,
    });
  }

  console.log(`[assess] Phase 2 done: ${results.length} results`);

  // Critique: re-examine high-severity partials
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
