/**
 * Matrix-Based Assessment Engine
 *
 * Two-phase assessment:
 * 1. DETERMINISTIC PHASE: 55 proprietary rules with explicit if-then logic
 * 2. LLM ANALYSIS PHASE: Nuanced assessment requiring human-like judgement
 *
 * Uses corpus retrieval to provide evidence-backed findings.
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import {
  searchCorpus,
  getObligations,
  getDocumentMetadata,
  hasExtractedContent,
  RetrievalResult
} from './corpus-retrieval.js';
import {
  runDeterministicChecks,
  DeterministicAssessment,
  DocumentEvidence
} from './deterministic-rules.js';

// In Docker, process.cwd() is /app. In dev, it's /packages/backend
const isProduction = process.env.NODE_ENV === 'production';
const MATRIX_PATH = isProduction
  ? path.join(process.cwd(), 'knowledge', 'success_matrix.json')
  : path.join(process.cwd(), '..', '..', 'knowledge', 'success_matrix.json');

// Types
interface MatrixRow {
  matrix_id: string;
  matrix_title: string;
  matrix_description: string;
  success_definition: string;
  failure_modes: string[];
  applicability_rules: {
    geography: string;
    building_types: string[];
    hrb_only: boolean;
    height_threshold: string | null;
  };
  reference_sources: string[];
  evidence_expected: string[];
  category: string;
  severity_if_unmet: string;
}

interface SuccessMatrix {
  matrix: MatrixRow[];
  statistics: {
    total_criteria: number;
    corpus_backed_count: number;
    llm_only_count: number;
  };
}

interface PackContext {
  isLondon: boolean;
  isHRB: boolean;
  buildingType: string; // residential, non-residential, mixed
  heightMeters: number | null;
  storeys: number | null;
}

interface PackDocument {
  filename: string;
  docType: string | null;
  extractedText: string;
}

export interface AssessmentResult {
  matrix_id: string;
  matrix_title: string;
  category: string;
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed';
  severity: string;
  reasoning: string;
  success_definition: string;
  pack_evidence: {
    found: boolean;
    document: string | null;
    page: number | null;
    quote: string | null;
  };
  reference_evidence: {
    found: boolean;
    doc_id: string | null;
    doc_title: string | null;
    page: number | null;
    quote: string | null;
  };
  gaps_identified: string[];
  actions_required: Array<{
    action: string;
    owner: string;
    effort: 'S' | 'M' | 'L';
    expected_benefit: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
}

export interface FullAssessment {
  pack_context: PackContext;
  reference_standards_applied: Array<{
    doc_id: string;
    title: string;
    why_applicable: string;
  }>;
  criteria_summary: {
    total_applicable: number;
    assessed: number;
    not_assessed: number;
    meets: number;
    partial: number;
    does_not_meet: number;
  };
  flagged_by_severity: {
    high: number;
    medium: number;
    low: number;
  };
  results: AssessmentResult[];
  // New: Two-phase assessment tracking
  assessment_phases: {
    deterministic: {
      total_rules: number;
      passed: number;
      failed: number;
      needs_review: number;
      results: DeterministicAssessment[];
    };
    llm_analysis: {
      total_criteria: number;
      assessed: number;
      results_count: number;
    };
  };
  readiness_score: number; // 0-100 percentage
  assessment_date: string;
  guardrail_stats: {
    corpus_backed_criteria: number;
    criteria_with_reference_anchors: number;
    reference_anchor_rate: number;
    deterministic_rule_count: number;
    llm_criteria_count: number;
  };
}

// Load the success matrix
function loadMatrix(): SuccessMatrix {
  const data = fs.readFileSync(MATRIX_PATH, 'utf-8');
  return JSON.parse(data);
}

// Determine which matrix rows apply to this pack
function filterApplicableCriteria(matrix: MatrixRow[], context: PackContext): MatrixRow[] {
  return matrix.filter(row => {
    const rules = row.applicability_rules;

    // Geography check
    if (rules.geography === 'london' && !context.isLondon) {
      return false;
    }

    // HRB check
    if (rules.hrb_only && !context.isHRB) {
      return false;
    }

    // Building type check
    if (rules.building_types.length > 0 && !rules.building_types.includes('all')) {
      if (!rules.building_types.includes(context.buildingType)) {
        return false;
      }
    }

    // Height threshold check
    if (rules.height_threshold && context.heightMeters) {
      const threshold = parseFloat(rules.height_threshold.replace('m', ''));
      if (context.heightMeters < threshold) {
        return false;
      }
    }

    return true;
  });
}

// Get reference evidence for a criterion
function getCorpusEvidence(row: MatrixRow): RetrievalResult | null {
  if (row.reference_sources.length === 0) {
    return null; // LLM-only criterion
  }

  // Search for evidence using the success definition as query
  const searchTerms = [
    row.matrix_title,
    ...row.evidence_expected.slice(0, 2)
  ].join(' ');

  const results = searchCorpus(searchTerms, {
    docIds: row.reference_sources,
    maxResults: 1,
    minScore: 0.05
  });

  return results.length > 0 ? results[0] : null;
}

// Build reference standards summary
function buildReferenceStandardsSummary(
  applicableCriteria: MatrixRow[],
  context: PackContext
): FullAssessment['reference_standards_applied'] {
  const usedDocIds = new Set<string>();
  for (const row of applicableCriteria) {
    for (const docId of row.reference_sources) {
      usedDocIds.add(docId);
    }
  }

  const standards: FullAssessment['reference_standards_applied'] = [];

  for (const docId of usedDocIds) {
    const meta = getDocumentMetadata(docId);
    if (!meta) continue;

    let whyApplicable = 'England-wide building safety requirements';
    if (meta.london_specific) {
      whyApplicable = 'London-specific planning requirement (Policy D12)';
    } else if (docId.includes('hrb') || docId.includes('909')) {
      whyApplicable = 'Higher-risk building procedures (Building Safety Act)';
    } else if (docId.includes('golden_thread')) {
      whyApplicable = 'Golden thread information management (HRB requirement)';
    } else if (docId.includes('adb')) {
      whyApplicable = 'Fire safety (Approved Document B)';
    } else if (docId.includes('adf')) {
      whyApplicable = 'Ventilation (Approved Document F)';
    } else if (docId.includes('gateway2')) {
      whyApplicable = 'Gateway 2 application guidance';
    }

    standards.push({
      doc_id: docId,
      title: meta.title,
      why_applicable: whyApplicable
    });
  }

  return standards;
}

// Use LLM to assess a single criterion
async function assessCriterion(
  row: MatrixRow,
  packDocs: PackDocument[],
  referenceEvidence: RetrievalResult | null,
  client: Anthropic
): Promise<AssessmentResult> {
  // Sort documents alphabetically by filename for consistent ordering
  const sortedDocs = [...packDocs].sort((a, b) => a.filename.localeCompare(b.filename));

  // Build pack context for the prompt
  const packContext = sortedDocs.map(d =>
    `Document: ${d.filename}\nType: ${d.docType || 'Unknown'}\nContent excerpt:\n${d.extractedText.slice(0, 3000)}`
  ).join('\n\n---\n\n');

  const referenceContext = referenceEvidence
    ? `Reference from ${referenceEvidence.doc_title} (page ${referenceEvidence.page_number}):\n"${referenceEvidence.snippet}"`
    : 'No specific reference excerpt available for this criterion.';

  const systemPrompt = `You are a deterministic regulatory compliance assessor. Your assessments must be:
1. EVIDENCE-BASED: Only assess based on explicit evidence present in the documents. Do not infer or assume.
2. CONSISTENT: Given the same documents and criterion, you must always produce the same assessment.
3. BINARY LOGIC: Use clear decision rules - if specific evidence exists, status is "meets". If evidence is missing or unclear, status is "partial" or "does_not_meet".
4. QUOTE-DRIVEN: Always cite specific text from documents when available.

Assessment Rules:
- "meets": Direct, explicit evidence satisfies the criterion completely
- "partial": Some evidence exists but is incomplete, vague, or only partially addresses the criterion
- "does_not_meet": No evidence found or evidence contradicts the criterion
- "not_assessed": Cannot be evaluated (e.g., criterion doesn't apply)`;

  const prompt = `## Criterion Being Assessed
ID: ${row.matrix_id}
Title: ${row.matrix_title}
Description: ${row.matrix_description}

## What Success Looks Like
${row.success_definition}

## Common Failure Modes
${row.failure_modes.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Reference Standard (from corpus)
${referenceContext}

## Documents to Assess
${packContext}

## Your Task
Assess whether the pack meets this criterion using ONLY the evidence provided. Apply the following decision logic:

1. Search for explicit evidence that addresses the criterion
2. If found: quote it directly and assess if it fully or partially satisfies requirements
3. If not found: mark as "does_not_meet" with clear explanation
4. Do NOT speculate about what might exist elsewhere

Respond in JSON format:
{
  "status": "meets" | "partial" | "does_not_meet" | "not_assessed",
  "reasoning": "Clear explanation citing specific evidence or lack thereof",
  "pack_evidence_found": true | false,
  "pack_evidence_document": "exact filename or null",
  "pack_evidence_quote": "exact quote from document or null",
  "gaps": ["specific gap 1", "specific gap 2"],
  "actions": [
    {
      "action": "specific action to address gap",
      "owner": "responsible role",
      "effort": "S" | "M" | "L",
      "benefit": "expected outcome"
    }
  ],
  "confidence": "high" | "medium" | "low"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0, // Deterministic responses for consistency
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      matrix_id: row.matrix_id,
      matrix_title: row.matrix_title,
      category: row.category,
      status: parsed.status,
      severity: row.severity_if_unmet,
      reasoning: parsed.reasoning,
      success_definition: row.success_definition,
      pack_evidence: {
        found: parsed.pack_evidence_found,
        document: parsed.pack_evidence_document,
        page: null,
        quote: parsed.pack_evidence_quote
      },
      reference_evidence: {
        found: referenceEvidence !== null,
        doc_id: referenceEvidence?.doc_id || null,
        doc_title: referenceEvidence?.doc_title || null,
        page: referenceEvidence?.page_number || null,
        quote: referenceEvidence?.snippet || null
      },
      gaps_identified: parsed.gaps || [],
      actions_required: parsed.actions || [],
      confidence: parsed.confidence || 'medium'
    };
  } catch (error) {
    console.error(`Error assessing ${row.matrix_id}:`, error);

    return {
      matrix_id: row.matrix_id,
      matrix_title: row.matrix_title,
      category: row.category,
      status: 'not_assessed',
      severity: row.severity_if_unmet,
      reasoning: 'Assessment failed due to processing error',
      success_definition: row.success_definition,
      pack_evidence: { found: false, document: null, page: null, quote: null },
      reference_evidence: {
        found: referenceEvidence !== null,
        doc_id: referenceEvidence?.doc_id || null,
        doc_title: referenceEvidence?.doc_title || null,
        page: referenceEvidence?.page_number || null,
        quote: referenceEvidence?.snippet || null
      },
      gaps_identified: [],
      actions_required: [],
      confidence: 'low'
    };
  }
}

/**
 * Main assessment function
 *
 * TWO-PHASE ASSESSMENT:
 * Phase 1: Deterministic Rules (55 proprietary checks with if-then logic)
 * Phase 2: LLM Analysis (nuanced criteria requiring human-like judgement)
 */
export async function assessPackAgainstMatrix(
  packDocs: PackDocument[],
  context: PackContext
): Promise<FullAssessment> {
  const client = new Anthropic();
  const matrix = loadMatrix();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[ASSESSMENT ENGINE] Starting two-phase regulatory assessment`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Pack context: London=${context.isLondon}, HRB=${context.isHRB}, Type=${context.buildingType}`);

  // ============================================
  // PHASE 1: DETERMINISTIC RULES (55 checks)
  // ============================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`PHASE 1: DETERMINISTIC RULES`);
  console.log(`${'─'.repeat(40)}`);

  // Convert packDocs to DocumentEvidence format for deterministic rules
  const docEvidence: DocumentEvidence[] = packDocs.map(d => ({
    filename: d.filename,
    docType: d.docType,
    extractedText: d.extractedText
  }));

  // Debug: Log document content availability
  console.log(`  Documents for analysis: ${docEvidence.length}`);
  for (const doc of docEvidence) {
    console.log(`    - ${doc.filename}: ${doc.extractedText?.length || 0} chars`);
  }

  // Run all 55 deterministic rules
  const deterministicResults = runDeterministicChecks(docEvidence);

  const deterministicPassed = deterministicResults.filter(r => r.result.passed).length;
  const deterministicFailed = deterministicResults.filter(r => !r.result.passed).length;
  const deterministicNeedsReview = deterministicResults.filter(r => r.requiresLLMReview).length;

  console.log(`  ✓ Ran ${deterministicResults.length} deterministic rules`);
  console.log(`  ✓ Passed: ${deterministicPassed}, Failed: ${deterministicFailed}, Needs Review: ${deterministicNeedsReview}`);

  // Convert deterministic results to AssessmentResult format
  const deterministicAssessmentResults: AssessmentResult[] = deterministicResults.map(dr => ({
    matrix_id: dr.matrixId,
    matrix_title: dr.ruleName,
    category: dr.category,
    status: dr.result.passed ? 'meets' : (dr.result.confidence === 'needs_review' ? 'partial' : 'does_not_meet'),
    severity: dr.severity,
    reasoning: dr.result.reasoning,
    success_definition: `Deterministic check: ${dr.ruleName}`,
    pack_evidence: {
      found: dr.result.evidence.found,
      document: dr.result.evidence.document,
      page: null,
      quote: dr.result.evidence.quote
    },
    reference_evidence: {
      found: false,
      doc_id: null,
      doc_title: null,
      page: null,
      quote: null
    },
    gaps_identified: dr.result.failureMode ? [dr.result.failureMode] : [],
    actions_required: dr.result.failureMode ? [{
      action: `Address: ${dr.result.failureMode}`,
      owner: 'Project Team',
      effort: dr.severity === 'high' ? 'L' : (dr.severity === 'medium' ? 'M' : 'S'),
      expected_benefit: `Resolve ${dr.category} compliance gap`
    }] : [],
    confidence: dr.result.confidence === 'definitive' ? 'high' : (dr.result.confidence === 'high' ? 'high' : 'medium')
  }));

  // ============================================
  // PHASE 2: LLM ANALYSIS (Nuanced criteria)
  // ============================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`PHASE 2: LLM ANALYSIS`);
  console.log(`${'─'.repeat(40)}`);

  // Filter to applicable criteria from the matrix (these are the LLM-based criteria)
  const applicableCriteria = filterApplicableCriteria(matrix.matrix, context);
  console.log(`  Applicable LLM criteria: ${applicableCriteria.length} of ${matrix.matrix.length}`);

  // Build reference standards summary
  const referenceStandards = buildReferenceStandardsSummary(applicableCriteria, context);

  // Assess each LLM criterion
  const llmResults: AssessmentResult[] = [];
  let corpusBackedCount = 0;
  let withReferenceAnchor = 0;

  for (const row of applicableCriteria) {
    console.log(`  [LLM] Assessing ${row.matrix_id}: ${row.matrix_title}`);

    // Get corpus evidence
    const referenceEvidence = getCorpusEvidence(row);

    if (row.reference_sources.length > 0) {
      corpusBackedCount++;
      if (referenceEvidence) {
        withReferenceAnchor++;
      }
    }

    // Assess the criterion using LLM
    const result = await assessCriterion(row, packDocs, referenceEvidence, client);
    llmResults.push(result);
  }

  console.log(`  ✓ Completed ${llmResults.length} LLM assessments`);

  // ============================================
  // COMBINE RESULTS
  // ============================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`COMBINING RESULTS`);
  console.log(`${'─'.repeat(40)}`);

  // Combine both result sets
  const allResults = [...deterministicAssessmentResults, ...llmResults];

  // Calculate summary statistics
  const assessed = allResults.filter(r => r.status !== 'not_assessed').length;
  const notAssessed = allResults.filter(r => r.status === 'not_assessed').length;
  const meets = allResults.filter(r => r.status === 'meets').length;
  const partial = allResults.filter(r => r.status === 'partial').length;
  const doesNotMeet = allResults.filter(r => r.status === 'does_not_meet').length;

  const flaggedHigh = allResults.filter(r =>
    r.status !== 'meets' && r.severity === 'high'
  ).length;
  const flaggedMedium = allResults.filter(r =>
    r.status !== 'meets' && r.severity === 'medium'
  ).length;
  const flaggedLow = allResults.filter(r =>
    r.status !== 'meets' && r.severity === 'low'
  ).length;

  // Calculate readiness score (weighted: full pass = 1, partial = 0.5, fail = 0)
  const totalCriteria = allResults.length;
  const weightedScore = meets + (partial * 0.5);
  const readinessScore = totalCriteria > 0 ? Math.round((weightedScore / totalCriteria) * 100) : 0;

  // Calculate guardrail stats
  const referenceAnchorRate = corpusBackedCount > 0
    ? (withReferenceAnchor / corpusBackedCount) * 100
    : 0;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`ASSESSMENT COMPLETE`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total criteria: ${allResults.length} (${deterministicResults.length} deterministic + ${llmResults.length} LLM)`);
  console.log(`  Readiness score: ${readinessScore}%`);
  console.log(`  Pass: ${meets}, Partial: ${partial}, Fail: ${doesNotMeet}`);
  console.log(`  High severity issues: ${flaggedHigh}`);

  return {
    pack_context: context,
    reference_standards_applied: referenceStandards,
    criteria_summary: {
      total_applicable: allResults.length,
      assessed,
      not_assessed: notAssessed,
      meets,
      partial,
      does_not_meet: doesNotMeet
    },
    flagged_by_severity: {
      high: flaggedHigh,
      medium: flaggedMedium,
      low: flaggedLow
    },
    results: allResults,
    assessment_phases: {
      deterministic: {
        total_rules: deterministicResults.length,
        passed: deterministicPassed,
        failed: deterministicFailed,
        needs_review: deterministicNeedsReview,
        results: deterministicResults
      },
      llm_analysis: {
        total_criteria: applicableCriteria.length,
        assessed: llmResults.length,
        results_count: llmResults.length
      }
    },
    readiness_score: readinessScore,
    assessment_date: new Date().toISOString(),
    guardrail_stats: {
      corpus_backed_criteria: corpusBackedCount,
      criteria_with_reference_anchors: withReferenceAnchor,
      reference_anchor_rate: referenceAnchorRate,
      deterministic_rule_count: deterministicResults.length,
      llm_criteria_count: llmResults.length
    }
  };
}

/**
 * Determine pack context from extracted fields
 */
export function determinePackContext(
  borough: string | null,
  buildingType: string | null,
  height: string | null,
  storeys: string | null
): PackContext {
  // Check if London
  const londonBoroughs = [
    'westminster', 'camden', 'islington', 'hackney', 'tower hamlets',
    'greenwich', 'lewisham', 'southwark', 'lambeth', 'wandsworth',
    'hammersmith', 'fulham', 'kensington', 'chelsea', 'city of london',
    'barking', 'dagenham', 'barnet', 'bexley', 'brent', 'bromley',
    'croydon', 'ealing', 'enfield', 'haringey', 'harrow', 'havering',
    'hillingdon', 'hounslow', 'kingston', 'merton', 'newham', 'redbridge',
    'richmond', 'sutton', 'waltham forest'
  ];

  const isLondon = borough
    ? londonBoroughs.some(b => borough.toLowerCase().includes(b))
    : false;

  // Parse height
  let heightMeters: number | null = null;
  if (height) {
    const match = height.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (match) {
      heightMeters = parseFloat(match[1]);
    }
  }

  // Parse storeys
  let storeyCount: number | null = null;
  if (storeys) {
    const match = storeys.match(/(\d+)/);
    if (match) {
      storeyCount = parseInt(match[1], 10);
    }
  }

  // Determine if HRB (18m+ or 7+ storeys with residential)
  const isHRB = (heightMeters !== null && heightMeters >= 18) ||
    (storeyCount !== null && storeyCount >= 7);

  // Determine building type
  let type = 'residential'; // default
  if (buildingType) {
    const lower = buildingType.toLowerCase();
    if (lower.includes('office') || lower.includes('commercial') || lower.includes('retail')) {
      type = 'non-residential';
    } else if (lower.includes('mixed')) {
      type = 'mixed';
    }
  }

  return {
    isLondon,
    isHRB,
    buildingType: type,
    heightMeters,
    storeys: storeyCount
  };
}

export default {
  assessPackAgainstMatrix,
  determinePackContext
};
