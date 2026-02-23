/**
 * Matrix-Based Assessment Engine
 *
 * Assesses submission packs against the Regulatory Success Matrix,
 * using corpus retrieval to provide evidence-backed findings.
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
  assessment_date: string;
  guardrail_stats: {
    corpus_backed_criteria: number;
    criteria_with_reference_anchors: number;
    reference_anchor_rate: number;
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
  // Build pack context for the prompt
  const packContext = packDocs.map(d =>
    `Document: ${d.filename}\nType: ${d.docType || 'Unknown'}\nContent excerpt:\n${d.extractedText.slice(0, 3000)}`
  ).join('\n\n---\n\n');

  const referenceContext = referenceEvidence
    ? `Reference from ${referenceEvidence.doc_title} (page ${referenceEvidence.page_number}):\n"${referenceEvidence.snippet}"`
    : 'No specific reference excerpt available for this criterion.';

  const prompt = `You are assessing a Gateway 2 submission pack against a specific regulatory success criterion.

## Criterion Being Assessed
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
Assess whether the pack meets this criterion. You must:
1. Determine status: "meets", "partial", "does_not_meet", or "not_assessed"
2. Provide clear reasoning
3. Quote specific evidence from the pack if found
4. Identify gaps between expectation and reality
5. Recommend specific actions if gaps exist

Respond in JSON format:
{
  "status": "meets" | "partial" | "does_not_meet" | "not_assessed",
  "reasoning": "Clear explanation of assessment",
  "pack_evidence_found": true | false,
  "pack_evidence_document": "filename or null",
  "pack_evidence_quote": "direct quote from pack or null",
  "gaps": ["gap 1", "gap 2"],
  "actions": [
    {
      "action": "what to do",
      "owner": "who should do it",
      "effort": "S" | "M" | "L",
      "benefit": "expected benefit"
    }
  ],
  "confidence": "high" | "medium" | "low"
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
 * Assesses a submission pack against the Regulatory Success Matrix
 */
export async function assessPackAgainstMatrix(
  packDocs: PackDocument[],
  context: PackContext
): Promise<FullAssessment> {
  const client = new Anthropic();
  const matrix = loadMatrix();

  // Filter to applicable criteria
  const applicableCriteria = filterApplicableCriteria(matrix.matrix, context);

  console.log(`[Matrix Assessment] Pack context: London=${context.isLondon}, HRB=${context.isHRB}, Type=${context.buildingType}`);
  console.log(`[Matrix Assessment] Applicable criteria: ${applicableCriteria.length} of ${matrix.matrix.length}`);

  // Build reference standards summary
  const referenceStandards = buildReferenceStandardsSummary(applicableCriteria, context);

  // Assess each criterion
  const results: AssessmentResult[] = [];
  let corpusBackedCount = 0;
  let withReferenceAnchor = 0;

  for (const row of applicableCriteria) {
    console.log(`[Matrix Assessment] Assessing ${row.matrix_id}: ${row.matrix_title}`);

    // Get corpus evidence
    const referenceEvidence = getCorpusEvidence(row);

    if (row.reference_sources.length > 0) {
      corpusBackedCount++;
      if (referenceEvidence) {
        withReferenceAnchor++;
      }
    }

    // Assess the criterion
    const result = await assessCriterion(row, packDocs, referenceEvidence, client);
    results.push(result);
  }

  // Calculate summary statistics
  const assessed = results.filter(r => r.status !== 'not_assessed').length;
  const notAssessed = results.filter(r => r.status === 'not_assessed').length;
  const meets = results.filter(r => r.status === 'meets').length;
  const partial = results.filter(r => r.status === 'partial').length;
  const doesNotMeet = results.filter(r => r.status === 'does_not_meet').length;

  const flaggedHigh = results.filter(r =>
    r.status !== 'meets' && r.severity === 'high'
  ).length;
  const flaggedMedium = results.filter(r =>
    r.status !== 'meets' && r.severity === 'medium'
  ).length;
  const flaggedLow = results.filter(r =>
    r.status !== 'meets' && r.severity === 'low'
  ).length;

  // Calculate guardrail stats
  const referenceAnchorRate = corpusBackedCount > 0
    ? (withReferenceAnchor / corpusBackedCount) * 100
    : 0;

  console.log(`[Matrix Assessment] Guardrail stats:`);
  console.log(`  - Corpus-backed criteria: ${corpusBackedCount}`);
  console.log(`  - With reference anchors: ${withReferenceAnchor}`);
  console.log(`  - Reference anchor rate: ${referenceAnchorRate.toFixed(1)}%`);

  return {
    pack_context: context,
    reference_standards_applied: referenceStandards,
    criteria_summary: {
      total_applicable: applicableCriteria.length,
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
    results,
    assessment_date: new Date().toISOString(),
    guardrail_stats: {
      corpus_backed_criteria: corpusBackedCount,
      criteria_with_reference_anchors: withReferenceAnchor,
      reference_anchor_rate: referenceAnchorRate
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
