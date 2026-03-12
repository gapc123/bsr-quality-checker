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
import type { ConfidenceTag } from '../types/confidence.js';
import { determineConfidence } from './confidence-analyzer.js';
import type {
  EffortAssessment,
  CostImpactAssessment,
  RejectionAssessment,
} from '../types/impact.js';
import { analyzeImpacts } from './impact-analyzer.js';
import type { TriageAssessment } from '../types/triage.js';
import { analyzeTriageForIssue } from './triage-analyzer.js';
import { vectorStore } from './vector-store.js';

// ============================================
// PROPOSED CHANGE VALIDATION
// Filters out generic/weak proposed_changes that require human intervention
// ============================================

interface ProposedChangeValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validates a proposed_change to ensure it's specific, actionable, and insertable.
 * Returns { valid: false } for generic prompts that require human intervention.
 */
function validateProposedChange(change: string | null): ProposedChangeValidation {
  if (!change) {
    return { valid: false, reason: 'no_change' };
  }

  const changeLower = change.toLowerCase();

  // Too short = probably generic (need at least ~150 chars for substantive content)
  if (change.length < 120) {
    return { valid: false, reason: 'too_short' };
  }

  // Starts with generic directive phrases
  const genericStarts = [
    /^add\s+(documentation|information|details|evidence|text|content|section)/i,
    /^provide\s+(documentation|information|details|evidence|text|content)/i,
    /^include\s+(documentation|information|details|evidence|text|content)/i,
    /^document\s+(the|how|what|when|where|why)/i,
    /^ensure\s+(that|the|compliance)/i,
    /^update\s+(the|documentation|to)/i,
    /^address\s+(the|this|gap|issue)/i,
    /^specify\s+(the|how|what)/i,
  ];
  if (genericStarts.some(p => p.test(change))) {
    return { valid: false, reason: 'generic_directive' };
  }

  // Contains "Add documentation addressing" pattern (common generic output)
  if (/add documentation addressing/i.test(change)) {
    return { valid: false, reason: 'generic_addressing_pattern' };
  }

  // Contains placeholders that need to be filled in
  if (/\[.*?\]/.test(change) || /\{.*?\}/.test(change)) {
    return { valid: false, reason: 'has_placeholders' };
  }

  // Contains TBC/TBA/XXX markers
  if (/\b(tbc|tba|xxx|to be confirmed|to be advised|to be determined)\b/i.test(change)) {
    return { valid: false, reason: 'has_tbc_markers' };
  }

  // Asks for things that require human input
  const humanRequiredPatterns = [
    /obtain.*from/i,
    /commission\s+(a|an|the)/i,
    /engage\s+(a|an|the).*specialist/i,
    /prepare\s+(a|an|the).*report/i,
    /provide\s+(a|an|the).*certification/i,
    /confirm\s+(with|that the)/i,
    /appoint\s+(a|an|the)/i,
    /create\s+(a|an|the|new)/i,
    /produce\s+(a|an|the)/i,
    /undertake\s+(a|an|the)/i,
    /carry out\s+(a|an|the)/i,
  ];
  if (humanRequiredPatterns.some(p => p.test(change))) {
    return { valid: false, reason: 'requires_human_action' };
  }

  // Keywords indicating human intervention needed
  const humanKeywords = [
    'principal contractor',
    'principal designer',
    'fire engineer',
    'structural engineer',
    'specialist',
    'competence evidence',
    'appointment',
    'certification',
    'test result',
    'calculation',
    'assessment by',
    'review by',
    'sign off',
    'sign-off',
    'approval from',
  ];
  if (humanKeywords.some(kw => changeLower.includes(kw))) {
    return { valid: false, reason: 'references_human_role' };
  }

  // If it's just telling you what to do rather than providing text
  const imperativeOnly = [
    /^(you should|should|must|need to|please|consider)/i,
  ];
  if (imperativeOnly.some(p => p.test(change))) {
    return { valid: false, reason: 'imperative_instruction' };
  }

  return { valid: true };
}

/**
 * Filters proposed_change: returns the change if valid, null otherwise
 */
function filterProposedChange(change: string | null): string | null {
  const validation = validateProposedChange(change);
  if (!validation.valid) {
    // Log for debugging during development
    if (change && process.env.NODE_ENV !== 'production') {
      console.log(`    [Filtered proposed_change] Reason: ${validation.reason}, Text: "${change.slice(0, 80)}..."`);
    }
    return null;
  }
  return change;
}

// In Docker, process.cwd() is /app. In dev, it's /packages/backend
const isProduction = process.env.NODE_ENV === 'production';
const MATRIX_PATH = isProduction
  ? path.join(process.cwd(), 'knowledge', 'success_matrix.json')
  : path.join(process.cwd(), '..', '..', 'knowledge', 'success_matrix.json');

// ============================================
// TWO-STAGE ASSESSMENT: FACT EXTRACTION + COMPLIANCE LOGIC
// TASK #15: Separate fact extraction from compliance judgement
// ============================================

/**
 * Stage 1: Structured facts extracted by LLM (no judgement)
 */
interface FactExtractionResult {
  // Evidence found
  evidence_found: boolean;
  evidence_document: string | null;
  evidence_page: number | null; // TASK #21: Now tracked with RAG
  evidence_quote: string | null;
  evidence_quality: 'explicit' | 'implicit' | 'ambiguous' | 'absent'; // TASK #17

  // Cross-document evidence (if info found elsewhere)
  cross_document_evidence: {
    found: boolean;
    source_document: string | null;
    quote: string | null;
  };

  // Extracted facts (criterion-specific)
  facts: {
    key: string;           // Fact identifier (e.g., "building_height", "compartmentation_rating")
    value: string | null;  // Extracted value (e.g., "24.5m", "60 minutes")
    confidence: 'high' | 'medium' | 'low'; // LLM's confidence in extraction
  }[];

  // What's missing (no judgement, just what's not stated)
  missing_information: string[];

  // Ambiguities or contradictions
  ambiguities: string[];
}

/**
 * Stage 2: Deterministic compliance logic (maps facts → status)
 */
interface ComplianceJudgement {
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed' | 'missing_information';
  reasoning: string;
  decision_logic: string; // Explain the rule applied (e.g., "Building height >= 18m AND residential → HRB")
  gaps_identified: string[];
  actions_required: Array<{
    action: string;
    owner: string;
    effort: 'S' | 'M' | 'L';
    expected_benefit: string;
  }>;
}

// ============================================
// EVIDENCE VALIDATION (TASK #14: Anti-hallucination)
// Post-extraction validation to catch LLM hallucinations
// ============================================

interface EvidenceValidation {
  isValid: boolean;
  issues: string[];
  similarityScore?: number;
}

/**
 * Calculate fuzzy match score between quote and document text
 * Uses Levenshtein-like similarity (0-1, higher = more similar)
 */
function calculateSimilarity(quote: string, documentText: string): number {
  if (!quote || !documentText) return 0;

  // Normalize: lowercase, remove extra whitespace, remove punctuation
  const normalize = (str: string) =>
    str.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?()[\]{}'"]/g, '')
      .trim();

  const normalizedQuote = normalize(quote);
  const normalizedDoc = normalize(documentText);

  // Simple substring match (good enough for quotes)
  if (normalizedDoc.includes(normalizedQuote)) {
    return 1.0;
  }

  // Check for partial matches (at least 80% of quote appears consecutively)
  const quoteLength = normalizedQuote.length;
  const threshold = Math.floor(quoteLength * 0.8);

  for (let i = 0; i <= normalizedDoc.length - threshold; i++) {
    const substring = normalizedDoc.substring(i, i + quoteLength);
    let matches = 0;

    for (let j = 0; j < normalizedQuote.length && j < substring.length; j++) {
      if (normalizedQuote[j] === substring[j]) matches++;
    }

    const similarity = matches / quoteLength;
    if (similarity >= 0.8) return similarity;
  }

  return 0;
}

/**
 * Validate evidence extracted by LLM
 * Returns validation result with issues list
 */
function validateEvidence(
  evidence: {
    found: boolean;
    document: string | null;
    page: number | null;
    quote: string | null;
  },
  packDocs: PackDocument[]
): EvidenceValidation {
  const issues: string[] = [];

  // If no evidence claimed, validation passes
  if (!evidence.found || !evidence.document) {
    return { isValid: true, issues: [] };
  }

  // Check 1: Document exists in pack
  const referencedDoc = packDocs.find(d => d.filename === evidence.document);
  if (!referencedDoc) {
    issues.push(`Document '${evidence.document}' not found in pack`);
    return { isValid: false, issues };
  }

  // Check 2: Quote fuzzy-match to document text (if quote provided)
  if (evidence.quote) {
    const similarity = calculateSimilarity(evidence.quote, referencedDoc.extractedText);

    if (similarity < 0.8) {
      issues.push(`Quote similarity too low (${Math.round(similarity * 100)}%). Possible hallucination.`);
      return { isValid: false, issues, similarityScore: similarity };
    }

    return { isValid: true, issues: [], similarityScore: similarity };
  }

  // If document exists but no quote, that's acceptable (general reference)
  return { isValid: true, issues: [] };
}

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

// Owner type taxonomy for clear responsibility assignment
export type OwnerType =
  | 'AI_AMENDABLE'           // Can be automatically inserted by AI
  | 'FIRE_ENGINEER'          // Requires fire engineering expertise
  | 'STRUCTURAL_ENGINEER'    // Requires structural engineering expertise
  | 'ARCHITECT'              // Requires architectural expertise
  | 'MEP_CONSULTANT'         // Requires M&E/services expertise
  | 'PRINCIPAL_DESIGNER'     // Principal Designer responsibility
  | 'PRINCIPAL_CONTRACTOR'   // Principal Contractor responsibility
  | 'CLIENT_INFO'            // Client must provide information
  | 'PROJECT_TEAM';          // Generic project team (fallback)

// Evidence quality taxonomy (TASK #17)
export type EvidenceQuality =
  | 'explicit'     // Direct, unambiguous statement (e.g., "Building height is 24.5m")
  | 'implicit'     // Can be inferred from context (e.g., "8 storeys above ground" implies HRB)
  | 'ambiguous'    // Present but unclear or contradictory
  | 'absent';      // Not mentioned in any document

export interface AssessmentResult {
  matrix_id: string;
  matrix_title: string;
  category: string;
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed' | 'missing_information';
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
  confidence_old?: 'high' | 'medium' | 'low'; // Legacy field, deprecated
  proposed_change?: string | null;  // Suggested text to add/modify in the submission
  proposed_change_source?: string | null;  // Source document if info came from cross-document search

  // NEW: Confidence framework (Stage 1)
  confidence?: ConfidenceTag;  // Structured confidence with reasoning

  // NEW: Impact assessments (Stage 2) - honest qualitative categories
  effort_assessment?: EffortAssessment;           // How long to fix (QUICK_FIX, DAYS, WEEKS, MONTHS)
  cost_impact_assessment?: CostImpactAssessment;  // Cost impact category (NEGLIGIBLE, LOW, MEDIUM, HIGH, VERY_HIGH)
  rejection_assessment?: RejectionAssessment;     // Rejection likelihood (UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY, ALMOST_CERTAIN)

  // NEW: Triage assessment (Stage 3) - action prioritization for decision-making
  triage?: TriageAssessment;  // Urgency, action type, engagement type, dependencies, quick wins

  // DEPRECATED: Old numerical estimates (fake precision - being phased out in Stage 2)
  // These presented guesses as facts. Use impact assessments above instead.
  /** @deprecated Use effort_assessment instead */
  cost_estimate?: {
    min: number;
    max: number;
    currency: 'GBP';
  };
  /** @deprecated Use effort_assessment instead */
  timeline_estimate?: {
    days: number;
    description: string;
  };
  /** @deprecated Use rejection_assessment instead */
  rejection_risk?: {
    probability: number; // 0-1
    description: string;
  };
  priority_score?: number; // 1-100, higher = more urgent

  // NEW: Document location for precise markup
  insertion_location?: {
    document: string;           // Target document filename
    section: string;            // Section heading (e.g., "3.2 Compartmentation")
    paragraph_number: number;   // Paragraph number within section (1-indexed)
    anchor_text: string;        // Unique text snippet to find insertion point
    context_before: string;     // Text appearing before insertion point
    context_after: string;      // Text appearing after insertion point
  };

  // NEW: Structured owner taxonomy (replaces generic "Project Team")
  owner_type?: OwnerType;

  // NEW: Evidence quality scoring (TASK #17)
  evidence_quality?: EvidenceQuality;

  // NEW: Cost estimation for budgeting
  estimated_cost?: {
    hours: number;              // Estimated hours of work
    rate_per_hour: number;      // Rate in GBP per hour
    total: number;              // Total cost (hours × rate)
    currency: 'GBP';
  };
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
    missing_information: number;
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

// ============================================
// OWNER TYPE AND COST ESTIMATION HELPERS
// ============================================

/**
 * Map owner string from actions_required to structured OwnerType
 */
function determineOwnerType(
  ownerString: string | undefined,
  hasProposedChange: boolean,
  reasoning: string,
  gaps: string[]
): OwnerType {
  // If valid proposed_change exists, it's AI-amendable
  if (hasProposedChange) {
    return 'AI_AMENDABLE';
  }

  const ownerLower = (ownerString || '').toLowerCase();
  const textToCheck = `${ownerLower} ${reasoning.toLowerCase()} ${gaps.join(' ').toLowerCase()}`;

  // Fire Engineer
  if (
    textToCheck.includes('fire engineer') ||
    textToCheck.includes('fire safety') ||
    textToCheck.includes('compartment') ||
    textToCheck.includes('sprinkler') ||
    textToCheck.includes('means of escape') ||
    textToCheck.includes('evacuation')
  ) {
    return 'FIRE_ENGINEER';
  }

  // Structural Engineer
  if (
    textToCheck.includes('structural engineer') ||
    textToCheck.includes('structural design') ||
    textToCheck.includes('load') ||
    textToCheck.includes('disproportionate collapse') ||
    textToCheck.includes('structural fire')
  ) {
    return 'STRUCTURAL_ENGINEER';
  }

  // MEP Consultant
  if (
    textToCheck.includes('mep') ||
    textToCheck.includes('m&e') ||
    textToCheck.includes('mechanical') ||
    textToCheck.includes('electrical') ||
    textToCheck.includes('ventilation') ||
    textToCheck.includes('services')
  ) {
    return 'MEP_CONSULTANT';
  }

  // Principal Designer
  if (
    textToCheck.includes('principal designer') ||
    textToCheck.includes('pd competence') ||
    textToCheck.includes('design coordination') ||
    textToCheck.includes('golden thread')
  ) {
    return 'PRINCIPAL_DESIGNER';
  }

  // Principal Contractor
  if (
    textToCheck.includes('principal contractor') ||
    textToCheck.includes('construction phase')
  ) {
    return 'PRINCIPAL_CONTRACTOR';
  }

  // Client Info
  if (
    textToCheck.includes('client must provide') ||
    textToCheck.includes('missing document') ||
    textToCheck.includes('not provided') ||
    textToCheck.includes('obtain from client') ||
    textToCheck.includes('competence evidence') ||
    textToCheck.includes('appointment letter')
  ) {
    return 'CLIENT_INFO';
  }

  // Architect (less specific patterns)
  if (
    textToCheck.includes('architect') ||
    textToCheck.includes('drawing') ||
    textToCheck.includes('layout')
  ) {
    return 'ARCHITECT';
  }

  // Default fallback
  return 'PROJECT_TEAM';
}

/**
 * Estimate cost based on owner type and effort
 * Returns null for AI_AMENDABLE and CLIENT_INFO (no cost)
 */
function estimateCost(
  ownerType: OwnerType,
  effort: 'S' | 'M' | 'L'
): AssessmentResult['estimated_cost'] {
  // No cost for AI or client-provided info
  if (ownerType === 'AI_AMENDABLE' || ownerType === 'CLIENT_INFO') {
    return undefined;
  }

  // Hourly rates by consultant type (typical UK market rates 2025)
  const rates: Record<Exclude<OwnerType, 'AI_AMENDABLE' | 'CLIENT_INFO'>, number> = {
    FIRE_ENGINEER: 150,
    STRUCTURAL_ENGINEER: 140,
    ARCHITECT: 120,
    MEP_CONSULTANT: 130,
    PRINCIPAL_DESIGNER: 150,
    PRINCIPAL_CONTRACTOR: 130,
    PROJECT_TEAM: 100, // Generic rate
  };

  // Effort to hours mapping
  const hoursMap: Record<'S' | 'M' | 'L', number> = {
    S: 0.5,  // 30 minutes
    M: 2,    // 2 hours
    L: 8,    // 1 day
  };

  const hours = hoursMap[effort];
  const ratePerHour = rates[ownerType as Exclude<OwnerType, 'AI_AMENDABLE' | 'CLIENT_INFO'>] || 100;
  const total = hours * ratePerHour;

  return {
    hours,
    rate_per_hour: ratePerHour,
    total,
    currency: 'GBP',
  };
}

// ============================================
// STAGE 1: FACT EXTRACTION (LLM extracts facts, no judgement)
// ============================================

/**
 * Extract structured facts from documents using LLM
 * No compliance judgement - just fact extraction
 */
async function extractFacts(
  row: MatrixRow,
  packDocs: PackDocument[],
  referenceEvidence: RetrievalResult | null,
  client: Anthropic
): Promise<FactExtractionResult> {
  // TASK #21: Use RAG to retrieve relevant chunks instead of full documents
  let packContext: string;

  if (vectorStore.isReady()) {
    // Build search queries from requirement
    const queries = [
      row.matrix_title,
      row.matrix_description,
      ...row.evidence_expected.slice(0, 2)
    ];

    // Retrieve top 5 most relevant chunks using multi-query search
    const relevantChunks = await vectorStore.multiSearch(queries, {
      top_k: 5,
      min_similarity: 0.65 // Lower threshold to catch more possibilities
    });

    if (relevantChunks.length > 0) {
      // Build context from retrieved chunks (with page numbers!)
      packContext = relevantChunks.map(chunk =>
        `Document: ${chunk.document_name} (Page ${chunk.page_number})\n` +
        `Type: ${chunk.doc_type || 'Unknown'}\n` +
        `${chunk.section_context ? `Section: ${chunk.section_context}\n` : ''}` +
        `Content:\n${chunk.text}\n` +
        `[Relevance: ${Math.round(chunk.similarity_score * 100)}%]`
      ).join('\n\n---\n\n');
    } else {
      // No relevant chunks found - use fallback
      packContext = 'No relevant document sections found for this criterion.';
    }
  } else {
    // Fallback to old approach if vector store not ready
    const sortedDocs = [...packDocs].sort((a, b) => a.filename.localeCompare(b.filename));
    packContext = sortedDocs.map(d =>
      `Document: ${d.filename}\nType: ${d.docType || 'Unknown'}\nContent excerpt:\n${d.extractedText.slice(0, 3000)}`
    ).join('\n\n---\n\n');
  }

  const referenceContext = referenceEvidence
    ? `Reference from ${referenceEvidence.doc_title} (page ${referenceEvidence.page_number}):\n"${referenceEvidence.snippet}"`
    : 'No specific reference excerpt available.';

  const systemPrompt = `You are a fact extraction specialist. Your ONLY job is to extract factual information from documents - DO NOT make compliance judgements.

CRITICAL RULES:
1. Extract ONLY what is explicitly stated in the documents
2. DO NOT judge whether information is sufficient or compliant
3. DO NOT infer or assume information not present
4. Quote exact text when possible
5. Mark confidence level for each extracted fact
6. List what information is missing (but don't judge if that's good or bad)`;

  const prompt = `## Criterion Context
ID: ${row.matrix_id}
Title: ${row.matrix_title}
Description: ${row.matrix_description}

## What Information to Extract
${row.success_definition}

Expected evidence types:
${row.evidence_expected.map((e, i) => `${i + 1}. ${e}`).join('\n')}

## Reference Standard
${referenceContext}

## Documents to Analyze
${packContext}

## Your Task
Extract factual information relevant to this criterion. DO NOT judge compliance.

For each piece of expected evidence:
1. Search ALL documents for relevant information
2. If found: extract the fact, quote the source, note which document
3. If not found in primary document but found elsewhere: note the cross-reference
4. If not found anywhere: list as missing information
5. If ambiguous or contradictory: note the ambiguity
6. Score evidence quality:
   - "explicit": Direct, unambiguous statement (e.g., "Building height is 24.5m")
   - "implicit": Can be inferred from context (e.g., "8 storeys" implies height)
   - "ambiguous": Present but unclear, vague, or contradictory
   - "absent": Not mentioned in any document

Respond in JSON format:
{
  "evidence_found": true | false,
  "evidence_document": "exact filename or null",
  "evidence_page": page_number or null,
  "evidence_quote": "exact quote from primary document or null",
  "evidence_quality": "explicit" | "implicit" | "ambiguous" | "absent",
  "cross_document_evidence": {
    "found": true | false,
    "source_document": "filename or null",
    "quote": "exact quote or null"
  },
  "facts": [
    {
      "key": "descriptive_identifier",
      "value": "extracted value or null",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "missing_information": ["specific info not found 1", "specific info not found 2"],
  "ambiguities": ["contradiction or unclear statement 1"]
}

Example for building height criterion:
{
  "evidence_found": true,
  "evidence_document": "Fire_Strategy.pdf",
  "evidence_page": 3,
  "evidence_quote": "The building has a height of 24.5 metres",
  "evidence_quality": "explicit",
  "cross_document_evidence": {
    "found": true,
    "source_document": "Planning_Application.pdf",
    "quote": "Total building height: 24.5m above ground level"
  },
  "facts": [
    {
      "key": "building_height_meters",
      "value": "24.5",
      "confidence": "high"
    },
    {
      "key": "measurement_method",
      "value": "above ground level",
      "confidence": "high"
    }
  ],
  "missing_information": [],
  "ambiguities": []
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`Error extracting facts for ${row.matrix_id}:`, error);
    return {
      evidence_found: false,
      evidence_document: null,
      evidence_page: null,
      evidence_quote: null,
      evidence_quality: 'absent',
      cross_document_evidence: {
        found: false,
        source_document: null,
        quote: null
      },
      facts: [],
      missing_information: ['Failed to extract facts due to processing error'],
      ambiguities: []
    };
  }
}

// ============================================
// STAGE 2: COMPLIANCE LOGIC (Deterministic judgement)
// ============================================

/**
 * Apply deterministic compliance logic to extracted facts
 * Same facts → same verdict (reproducible)
 */
function applyComplianceLogic(
  row: MatrixRow,
  facts: FactExtractionResult
): ComplianceJudgement {
  // Default: not enough information
  let status: ComplianceJudgement['status'] = 'missing_information';
  let reasoning = '';
  let decisionLogic = '';
  const gaps: string[] = [];
  const actions: ComplianceJudgement['actions_required'] = [];

  // Logic: If no evidence found → missing_information (TASK #16)
  // This distinguishes "not mentioned" from "mentioned but wrong"
  if (!facts.evidence_found && !facts.cross_document_evidence.found) {
    status = 'missing_information';
    reasoning = `Required information not found in any document for ${row.matrix_title}. Missing: ${facts.missing_information.join('; ')}`;
    decisionLogic = 'RULE: No evidence found in any document → missing_information';
    gaps.push(...facts.missing_information);

    actions.push({
      action: `Add documentation addressing ${row.matrix_title}: ${facts.missing_information.slice(0, 2).join(', ')}`,
      owner: 'Project Team',
      effort: 'M',
      expected_benefit: 'Provide required information to meet compliance'
    });

    return { status, reasoning, decision_logic: decisionLogic, gaps_identified: gaps, actions_required: actions };
  }

  // Logic: If evidence found but has missing information → partial
  if (facts.evidence_found && facts.missing_information.length > 0) {
    status = 'partial';
    reasoning = `Partial evidence found in ${facts.evidence_document}. Missing: ${facts.missing_information.join('; ')}`;
    decisionLogic = 'RULE: Evidence present but incomplete → partial';
    gaps.push(...facts.missing_information);

    actions.push({
      action: `Add missing information: ${facts.missing_information.join(', ')}`,
      owner: 'Project Team',
      effort: 'S',
      expected_benefit: 'Complete compliance documentation'
    });

    return { status, reasoning, decision_logic: decisionLogic, gaps_identified: gaps, actions_required: actions };
  }

  // Logic: If evidence found with ambiguities or contradictions → does_not_meet (TASK #16)
  // This is different from missing_information: the document mentions it but is wrong/unclear
  if (facts.ambiguities.length > 0) {
    // Check if ambiguity indicates contradiction (evidence exists but is wrong)
    const isContradiction = facts.ambiguities.some(a =>
      a.toLowerCase().includes('contradict') ||
      a.toLowerCase().includes('conflict') ||
      a.toLowerCase().includes('incorrect') ||
      a.toLowerCase().includes('does not meet')
    );

    if (isContradiction) {
      status = 'does_not_meet';
      reasoning = `Evidence found but contradicts requirements: ${facts.ambiguities.join('; ')}`;
      decisionLogic = 'RULE: Evidence contradicts requirements → does_not_meet';
    } else {
      status = 'partial';
      reasoning = `Evidence found but ambiguous: ${facts.ambiguities.join('; ')}`;
      decisionLogic = 'RULE: Evidence ambiguous or unclear → partial';
    }

    gaps.push(...facts.ambiguities);

    actions.push({
      action: `Clarify or correct: ${facts.ambiguities.slice(0, 2).join(', ')}`,
      owner: 'Project Team',
      effort: 'S',
      expected_benefit: isContradiction ? 'Correct non-compliant information' : 'Remove ambiguity for clear compliance'
    });

    return { status, reasoning, decision_logic: decisionLogic, gaps_identified: gaps, actions_required: actions };
  }

  // Logic: If evidence found and complete → meets (but consider quality - TASK #17)
  if (facts.evidence_found && facts.missing_information.length === 0 && facts.ambiguities.length === 0) {
    // Check evidence quality
    if (facts.evidence_quality === 'explicit') {
      status = 'meets';
      reasoning = `Explicit evidence found in ${facts.evidence_document}: "${facts.evidence_quote?.slice(0, 100)}..."`;
      decisionLogic = 'RULE: Evidence present, complete, explicit → meets';
    } else if (facts.evidence_quality === 'implicit') {
      status = 'partial';
      reasoning = `Implicit evidence found in ${facts.evidence_document}. Information can be inferred but is not explicitly stated.`;
      decisionLogic = 'RULE: Evidence inferred but not explicit → partial';
      gaps.push('Evidence is implicit rather than explicit');
      actions.push({
        action: 'Make implicit information explicit in documentation',
        owner: 'Project Team',
        effort: 'S',
        expected_benefit: 'Provide clear, unambiguous evidence'
      });
    } else {
      // ambiguous quality handled earlier
      status = 'partial';
      reasoning = `Evidence found but quality is unclear`;
      decisionLogic = 'RULE: Evidence quality unclear → partial';
    }

    return { status, reasoning, decision_logic: decisionLogic, gaps_identified: gaps, actions_required: actions };
  }

  // Fallback (should not reach here)
  status = 'not_assessed';
  reasoning = 'Unable to determine compliance status from extracted facts';
  decisionLogic = 'FALLBACK: Insufficient information to apply compliance rules';

  return { status, reasoning, decision_logic: decisionLogic, gaps_identified: gaps, actions_required: actions };
}

// ============================================
// TWO-STAGE ASSESSMENT FUNCTION (NEW)
// TASK #15: Evidence-first, deterministic compliance logic
// ============================================

/**
 * Assess criterion using two-stage approach:
 * Stage 1: LLM extracts facts (no judgement)
 * Stage 2: Deterministic logic applies compliance rules
 */
async function assessCriterionTwoStage(
  row: MatrixRow,
  packDocs: PackDocument[],
  referenceEvidence: RetrievalResult | null,
  client: Anthropic
): Promise<AssessmentResult> {
  console.log(`  [TWO-STAGE] Assessing ${row.matrix_id}`);

  // STAGE 1: Extract facts using LLM (no judgement)
  const facts = await extractFacts(row, packDocs, referenceEvidence, client);

  // Validate extracted evidence (TASK #21: Now includes page numbers from RAG)
  const evidenceValidation = validateEvidence(
    {
      found: facts.evidence_found,
      document: facts.evidence_document,
      page: facts.evidence_page,
      quote: facts.evidence_quote
    },
    packDocs
  );

  if (!evidenceValidation.isValid) {
    console.warn(`  [VALIDATION FAILED] ${row.matrix_id}:`, evidenceValidation.issues.join('; '));
  }

  // STAGE 2: Apply deterministic compliance logic
  const judgement = applyComplianceLogic(row, facts);

  // Augment reasoning with validation warnings
  let finalReasoning = judgement.reasoning;
  if (!evidenceValidation.isValid && evidenceValidation.issues.length > 0) {
    finalReasoning += `\n\n⚠️ Evidence validation warning: ${evidenceValidation.issues.join('; ')}`;
  }
  // Append decision logic for transparency
  finalReasoning += `\n\n[Decision Logic: ${judgement.decision_logic}]`;

  // Determine owner type
  const ownerType = determineOwnerType(
    judgement.actions_required?.[0]?.owner,
    false, // No proposed_change in two-stage flow yet
    finalReasoning,
    judgement.gaps_identified
  );

  // Estimate cost
  const effort = judgement.actions_required?.[0]?.effort || 'M';
  const estimatedCost = estimateCost(ownerType, effort);

  return {
    matrix_id: row.matrix_id,
    matrix_title: row.matrix_title,
    category: row.category,
    status: judgement.status,
    severity: row.severity_if_unmet,
    reasoning: finalReasoning,
    success_definition: row.success_definition,
    pack_evidence: {
      found: facts.evidence_found && evidenceValidation.isValid,
      document: evidenceValidation.isValid ? facts.evidence_document : null,
      page: evidenceValidation.isValid ? facts.evidence_page : null, // TASK #21: Page numbers from RAG
      quote: evidenceValidation.isValid ? facts.evidence_quote : null
    },
    reference_evidence: {
      found: referenceEvidence !== null,
      doc_id: referenceEvidence?.doc_id || null,
      doc_title: referenceEvidence?.doc_title || null,
      page: referenceEvidence?.page_number || null,
      quote: referenceEvidence?.snippet || null
    },
    gaps_identified: judgement.gaps_identified,
    actions_required: judgement.actions_required,
    confidence_old: 'medium',
    proposed_change: null, // Not generated in two-stage flow yet
    proposed_change_source: null,
    insertion_location: undefined,
    owner_type: ownerType,
    estimated_cost: estimatedCost,
    evidence_quality: facts.evidence_quality, // TASK #17
  };
}

// Use LLM to assess a single criterion (LEGACY - to be replaced by assessCriterionTwoStage)
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
Assess whether the pack meets this criterion using the evidence provided. Apply the following decision logic:

1. Search for explicit evidence that addresses the criterion IN ALL DOCUMENTS
2. If found: quote it directly and assess if it fully or partially satisfies requirements
3. If not found in the primary document but found elsewhere: note the cross-reference
4. If not found anywhere: mark as "does_not_meet" with clear explanation

## CROSS-DOCUMENT INTELLIGENCE (Important!)
When assessing gaps, actively search ALL provided documents for missing information:
- If Document A is missing information about building height, check if it's stated in Document B
- If you find the information in another document, you CAN propose adding it to fill the gap
- Include SOURCE ATTRIBUTION: "Based on [source document]: [specific text to add]"
- This allows the AI to consolidate scattered information into comprehensive documentation

Example: If Fire Strategy is missing building height, but Planning Application states "24.5m":
- Gap exists in Fire Strategy
- Information exists in Planning Application
- Proposed change: "Based on Planning Application: The building height is 24.5m as measured from ground level."

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
  "confidence": "high" | "medium" | "low",
  "proposed_change_source": "If proposed_change uses info from another document, state that document's filename here. Otherwise null.",
  "owner_type": "MUST provide one of: AI_AMENDABLE, FIRE_ENGINEER, STRUCTURAL_ENGINEER, ARCHITECT, MEP_CONSULTANT, PRINCIPAL_DESIGNER, PRINCIPAL_CONTRACTOR, CLIENT_INFO, PROJECT_TEAM",
  "insertion_location": {
    "document": "Target document filename where text should be inserted",
    "section": "Section heading (e.g., '3.2 Compartmentation')",
    "paragraph_number": "Paragraph number within section (1, 2, 3...)",
    "anchor_text": "20-50 character text snippet that uniquely identifies insertion point",
    "context_before": "1-2 sentences that appear immediately before insertion point",
    "context_after": "1-2 sentences that appear immediately after insertion point"
  },
  "proposed_change": "CRITICAL INSTRUCTIONS FOR PROPOSED_CHANGE:

ONLY provide a proposed_change if ALL of these conditions are true:
1. You can write COMPLETE, SPECIFIC text (at least 2-3 sentences of substantive content)
2. The text can be DIRECTLY INSERTED into an existing document without modification
3. NO professional judgement is required (not calculations, certifications, or expert assessment)
4. NO new information needs to be gathered (you have everything needed in the documents)

Set proposed_change to NULL if ANY of these apply:
- Status is 'meets' (no change needed)
- Issue requires creating a NEW DOCUMENT (fire strategy, structural report, etc.)
- Issue requires EXPERT ANALYSIS (fire engineering, structural calculations)
- Issue requires PHYSICAL EVIDENCE (test certificates, material certifications)
- Issue requires APPOINTING someone (Principal Designer, Principal Contractor)
- Issue requires PROFESSIONAL JUDGEMENT or DESIGN DECISIONS
- You would write something generic like 'Add documentation about X' or 'Include evidence of Y'
- The text contains placeholders like [X], {Y}, or TBC

INVALID proposed_change examples (should be null):
- 'Add documentation addressing the compartmentation gap'
- 'Include evidence of Principal Designer competence'
- 'Provide fire strategy details for means of escape'
- 'Document the golden thread approach'
- 'Add information about [specific item]'

VALID proposed_change examples (specific, insertable text):
- 'The building is classified as a Higher-Risk Building under the Building Safety Act 2022, with a height of 24.5m and containing 8 residential storeys above ground level. This classification requires compliance with the enhanced regulatory requirements of Part 4 of the Act.'
- 'Horizontal compartmentation is achieved through 60-minute fire-rated separating floors constructed of 150mm reinforced concrete with intumescent seals at all service penetrations. Vertical compartmentation uses 60-minute fire-rated walls with fire-stopped service penetrations.'
- 'The evacuation strategy is simultaneous evacuation, with all occupants directed to leave the building immediately upon activation of the fire alarm. This approach is appropriate for the building height and occupancy type as assessed by the fire engineer.'

CROSS-DOCUMENT proposed_change examples (pulling info from other documents):
- 'Based on the Planning Application Form: The building has a total height of 24.5 metres and contains 8 residential storeys above ground level, meeting the threshold for classification as a Higher-Risk Building under the Building Safety Act 2022.'
- 'As stated in the Structural Engineering Report: The primary structural frame achieves 90-minute fire resistance in accordance with BS EN 1992-1-2, with all connections and junctions detailed to maintain compartmentation integrity.'
- 'Refer to Section 4.2 of the Fire Strategy Report for full compartmentation details. The separating floors achieve 60-minute fire resistance as confirmed by the fire engineer.'

When using cross-document information:
1. Always cite the SOURCE DOCUMENT by name
2. Quote or paraphrase the specific information found
3. Explain how it addresses the gap in the target document",

  "owner_type": "CRITICAL - OWNER TYPE CLASSIFICATION:

Choose the MOST SPECIFIC owner type that applies:

- AI_AMENDABLE: Use ONLY when proposed_change is provided AND text can be inserted automatically without human review
- FIRE_ENGINEER: Fire safety, means of escape, compartmentation, fire resistance, sprinklers, external walls
- STRUCTURAL_ENGINEER: Structural design, load calculations, fire resistance of structure, disproportionate collapse
- ARCHITECT: Building layout, space planning, accessibility, general coordination
- MEP_CONSULTANT: M&E systems, ventilation, electrical, plumbing, fire alarms
- PRINCIPAL_DESIGNER: Competence evidence, design coordination, CDM duties, golden thread strategy
- PRINCIPAL_CONTRACTOR: Construction phase duties, competence evidence, site safety
- CLIENT_INFO: Missing information that only the client can provide (building details, certifications, appointments)
- PROJECT_TEAM: Generic fallback (use sparingly - prefer specific owner)

Rules:
- If proposed_change exists AND is valid → AI_AMENDABLE
- If issue requires professional engineering judgment → specific engineer type
- If issue is missing document or client-side info → CLIENT_INFO
- If competence/appointment related → PRINCIPAL_DESIGNER or PRINCIPAL_CONTRACTOR",

  "insertion_location": "CRITICAL - INSERTION LOCATION (required if proposed_change is provided):

You MUST provide insertion_location if proposed_change is not null. This allows precise markup in the document.

Steps to determine insertion_location:
1. Identify which document the proposed_change should be added to
2. Find the section heading where it belongs (scan the document for section numbers/titles)
3. Count paragraphs in that section to determine paragraph_number
4. Extract 20-50 chars of unique text at the insertion point as anchor_text
5. Capture 1-2 sentences before and after the insertion point

Example:
If Fire Strategy Section 3.2 has text:
'Compartmentation is achieved through concrete floors and masonry walls. All service penetrations are fire-stopped using intumescent seals. The building is divided into residential compartments on each floor.'

And you want to insert after the second sentence, provide:
{
  'document': 'Fire_Strategy_Report.pdf',
  'section': '3.2 Compartmentation',
  'paragraph_number': 1,
  'anchor_text': 'fire-stopped using intumescent seals.',
  'context_before': 'Compartmentation is achieved through concrete floors and masonry walls. All service penetrations are fire-stopped using intumescent seals.',
  'context_after': 'The building is divided into residential compartments on each floor.'
}

Set to null if:
- proposed_change is null
- Status is 'meets' (no change needed)
- Issue requires creating a NEW document (not insertion into existing doc)"
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

    // TASK #14: Validate pack evidence to catch hallucinations
    const packEvidenceValidation = validateEvidence(
      {
        found: parsed.pack_evidence_found,
        document: parsed.pack_evidence_document,
        page: null, // Not currently extracted from LLM
        quote: parsed.pack_evidence_quote
      },
      packDocs
    );

    // Log validation failures for debugging
    if (!packEvidenceValidation.isValid) {
      console.warn(`  [VALIDATION FAILED] ${row.matrix_id}:`, packEvidenceValidation.issues.join('; '));
    }

    // Augment reasoning with validation warnings if evidence is unreliable
    let finalReasoning = parsed.reasoning || `Assessment of ${row.matrix_title} based on submitted documentation.`;
    if (!packEvidenceValidation.isValid && packEvidenceValidation.issues.length > 0) {
      finalReasoning += `\n\n⚠️ Evidence validation warning: ${packEvidenceValidation.issues.join('; ')}`;
    }

    // Filter and validate proposed_change
    const filteredProposedChange = filterProposedChange(parsed.proposed_change || null);

    // Determine owner type (use LLM suggestion or fallback to heuristic)
    const ownerType = parsed.owner_type as OwnerType || determineOwnerType(
      parsed.actions?.[0]?.owner,
      !!filteredProposedChange,
      finalReasoning,
      parsed.gaps || []
    );

    // Parse insertion_location if provided
    const insertionLocation = parsed.insertion_location && filteredProposedChange ? {
      document: parsed.insertion_location.document || '',
      section: parsed.insertion_location.section || '',
      paragraph_number: parseInt(parsed.insertion_location.paragraph_number) || 1,
      anchor_text: parsed.insertion_location.anchor_text || '',
      context_before: parsed.insertion_location.context_before || '',
      context_after: parsed.insertion_location.context_after || '',
    } : undefined;

    // Estimate cost based on owner type and effort
    const effort = parsed.actions?.[0]?.effort || 'M';
    const estimatedCost = estimateCost(ownerType, effort);

    return {
      matrix_id: row.matrix_id,
      matrix_title: row.matrix_title,
      category: row.category,
      status: parsed.status,
      severity: row.severity_if_unmet,
      reasoning: finalReasoning,
      success_definition: row.success_definition,
      pack_evidence: {
        found: parsed.pack_evidence_found && packEvidenceValidation.isValid, // Mark as not found if validation failed
        document: packEvidenceValidation.isValid ? parsed.pack_evidence_document : null,
        page: null,
        quote: packEvidenceValidation.isValid ? parsed.pack_evidence_quote : null
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
      confidence: parsed.confidence || 'medium',
      proposed_change: filteredProposedChange,
      proposed_change_source: parsed.proposed_change_source || null,
      // NEW: Enhanced fields
      insertion_location: insertionLocation,
      owner_type: ownerType,
      estimated_cost: estimatedCost,
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
      confidence_old: 'low', // Will be replaced with proper ConfidenceTag
      proposed_change: null,
      proposed_change_source: null,
      // NEW: Enhanced fields with safe defaults
      insertion_location: undefined,
      owner_type: 'PROJECT_TEAM',
      estimated_cost: undefined,
    };
  }
}

// ============================================
// PHASE 1 ENHANCEMENT: COST/RISK/TIMELINE ENRICHMENT
// ============================================

import {
  estimateIssueCost,
  SEVERITY_REJECTION_RISK,
  EFFORT_TIME_ESTIMATES
} from '../constants/cost-estimation.js';

/**
 * Determine owner type from criterion (adapter for enrichment)
 */
function determineOwnerTypeForEnrichment(criterion: AssessmentResult): string {
  // Use the existing determineOwnerType function
  const hasProposedChange = !!(criterion.proposed_change && criterion.proposed_change.length > 100);
  const ownerString = criterion.actions_required?.[0]?.owner || '';
  const reasoning = criterion.reasoning || '';
  const gaps = criterion.gaps_identified || [];

  const ownerType = determineOwnerType(ownerString, hasProposedChange, reasoning, gaps);

  // Map OwnerType to cost estimation keys
  if (ownerType === 'AI_AMENDABLE') return 'AI_AMENDABLE';
  if (ownerType === 'FIRE_ENGINEER') return 'FIRE_ENGINEER';
  if (ownerType === 'STRUCTURAL_ENGINEER') return 'STRUCTURAL_ENGINEER';
  if (ownerType === 'MEP_CONSULTANT') return 'MEP_ENGINEER';
  if (ownerType === 'ARCHITECT') return 'ARCHITECT';
  if (ownerType === 'PRINCIPAL_DESIGNER') return 'PRINCIPAL_DESIGNER';
  if (ownerType === 'PRINCIPAL_CONTRACTOR') return 'PROJECT_MANAGER';
  if (ownerType === 'CLIENT_INFO') return 'PROJECT_MANAGER';
  if (ownerType === 'PROJECT_TEAM') return 'PROJECT_MANAGER';

  return 'UNCLEAR_OWNER';
}

/**
 * Estimate effort level based on criterion complexity
 */
function estimateEffortLevel(criterion: AssessmentResult): string {
  // AI amendable = instant
  if (criterion.proposed_change && criterion.proposed_change.length > 100) {
    return 'AI_instant';
  }

  const gaps = criterion.gaps_identified || [];
  const actions = criterion.actions_required || [];

  // Check for keywords indicating large effort
  const combinedText = [...gaps, ...actions.map(a => a.action)].join(' ').toLowerCase();

  if (combinedText.includes('new document') || combinedText.includes('new report')) {
    return 'XL';
  }
  if (combinedText.includes('commission') || combinedText.includes('engage')) {
    return 'L+';
  }
  if (combinedText.includes('test') || combinedText.includes('certification')) {
    return 'L';
  }
  if (combinedText.includes('specify') || combinedText.includes('calculate')) {
    return 'M+';
  }
  if (combinedText.includes('add') || combinedText.includes('clarify')) {
    return 'M';
  }

  // Default based on severity
  if (criterion.severity === 'high') return 'M+';
  if (criterion.severity === 'medium') return 'M';
  return 'S';
}

/**
 * Calculate priority score for sorting (0-100, higher = more urgent)
 */
function calculatePriorityScore(criterion: AssessmentResult): number {
  let score = 0;

  // Severity weight (50 points max)
  if (criterion.severity === 'high') score += 50;
  else if (criterion.severity === 'medium') score += 30;
  else score += 10;

  // Status weight (30 points max)
  if (criterion.status === 'does_not_meet') score += 30;
  else if (criterion.status === 'partial') score += 20;
  else score += 5;

  // Rejection risk weight (20 points max)
  const rejectionRisk = criterion.rejection_risk?.probability || 0;
  score += rejectionRisk * 20;

  return Math.min(100, Math.round(score));
}

/**
 * Enrich criterion results with impact assessments
 * Stage 2: Uses qualitative categories instead of fake numerical estimates
 */
export function enrichCriterionWithMetadata(criterion: AssessmentResult): AssessmentResult {
  const enriched = { ...criterion };

  // Stage 2: Add honest qualitative impact assessments
  if (criterion.status === 'does_not_meet' || criterion.status === 'partial') {
    const impacts = analyzeImpacts(criterion);

    enriched.effort_assessment = impacts.effort;
    enriched.cost_impact_assessment = impacts.cost;
    enriched.rejection_assessment = impacts.rejection;

    // Stage 3: Add triage assessment for action prioritization
    enriched.triage = analyzeTriageForIssue(enriched);
  }

  // DEPRECATED: Keep old fake numbers for backward compatibility (will be removed)
  // These are guesses presented as facts and should not be relied upon
  if (criterion.status === 'does_not_meet' || criterion.status === 'partial') {
    const riskData = SEVERITY_REJECTION_RISK[criterion.severity as keyof typeof SEVERITY_REJECTION_RISK];
    if (riskData) {
      enriched.rejection_risk = {
        probability: riskData.rejection_probability,
        description: riskData.description,
      };
    }

    const ownerType = determineOwnerTypeForEnrichment(criterion);
    const effort = estimateEffortLevel(criterion);

    const costEstimate = estimateIssueCost(ownerType, effort);
    enriched.cost_estimate = {
      min: costEstimate.min,
      max: costEstimate.max,
      currency: 'GBP',
    };

    const timeEstimate = EFFORT_TIME_ESTIMATES[effort as keyof typeof EFFORT_TIME_ESTIMATES];
    if (timeEstimate) {
      enriched.timeline_estimate = {
        days: timeEstimate.days,
        description: timeEstimate.description,
      };
    }
  }

  // Calculate priority score (for sorting)
  enriched.priority_score = calculatePriorityScore(enriched);

  return enriched;
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
      found: true,
      doc_id: dr.matrixId,
      doc_title: `${dr.regulatoryRef.source} - ${dr.regulatoryRef.section}`,
      page: null,
      quote: dr.regulatoryRef.requirement
    },
    gaps_identified: dr.result.failureMode ? [dr.result.failureMode] : [],
    actions_required: dr.result.failureMode ? [{
      action: `Address: ${dr.result.failureMode}`,
      owner: 'Project Team',
      effort: dr.severity === 'high' ? 'L' : (dr.severity === 'medium' ? 'M' : 'S'),
      expected_benefit: `Resolve ${dr.category} compliance gap`
    }] : [],
    confidence_old: dr.result.confidence === 'definitive' ? 'high' : (dr.result.confidence === 'high' ? 'high' : 'medium'),
    // Deterministic rules don't generate proposed_change - they identify gaps
    // Only LLM can generate specific, insertable text. Deterministic failures
    // are either: (a) missing documents (human required), or (b) gaps that need
    // LLM to generate specific text based on document context.
    // Setting to null means these will be triaged as "Human Intervention" in the carousel.
    proposed_change: null
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

    // Assess the criterion using two-stage flow (fact extraction → deterministic logic)
    // TASK #15: Use new evidence-first approach for reproducible assessments
    const result = await assessCriterionTwoStage(row, packDocs, referenceEvidence, client);
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
  const combinedResults = [...deterministicAssessmentResults, ...llmResults];

  // ============================================
  // ENRICHMENT: Add confidence tags + cost/timeline/risk metadata
  // ============================================
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`ENRICHING RESULTS WITH CONFIDENCE & COST/RISK DATA`);
  console.log(`${'─'.repeat(40)}`);

  const allResults = combinedResults.map(criterion => {
    try {
      // First enrich with cost/timeline metadata (will be removed in Stage 2)
      const enriched = enrichCriterionWithMetadata(criterion);

      // Then add confidence tag
      const confidence = determineConfidence(enriched);

      return {
        ...enriched,
        confidence
      };
    } catch (err) {
      console.error(`Failed to enrich criterion ${criterion.matrix_id}:`, err);
      return criterion; // Return original if enrichment fails
    }
  });

  console.log(`  ✓ Enriched ${allResults.length} results with confidence levels`);

  console.log(`  ✓ Enriched ${allResults.length} results with cost/timeline/risk data`);

  // Calculate summary statistics
  const assessed = allResults.filter(r => r.status !== 'not_assessed').length;
  const notAssessed = allResults.filter(r => r.status === 'not_assessed').length;
  const meets = allResults.filter(r => r.status === 'meets').length;
  const partial = allResults.filter(r => r.status === 'partial').length;
  const doesNotMeet = allResults.filter(r => r.status === 'does_not_meet').length;
  const missingInformation = allResults.filter(r => r.status === 'missing_information').length;

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
  console.log(`  Pass: ${meets}, Partial: ${partial}, Fail: ${doesNotMeet}, Missing Info: ${missingInformation}`);
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
      does_not_meet: doesNotMeet,
      missing_information: missingInformation
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
