/**
 * Confidence Analysis for Assessment Results
 *
 * Determines confidence level for each assessment output:
 * - HIGH: Deterministic checks (document present/absent, cross-doc inconsistencies)
 * - MEDIUM: AI interpretation (content assessment)
 * - REQUIRES_HUMAN_JUDGEMENT: Strategic, financial, or design decisions
 */

import type { AssessmentResult } from './matrix-assessment.js';
import type { ConfidenceTag, ConfidenceLevel } from '../types/confidence.js';

/**
 * Determines confidence level for an assessment result
 */
export function determineConfidence(result: AssessmentResult): ConfidenceTag {
  // HIGH: Deterministic checks (document structure, presence/absence)
  if (isDeterministicCheck(result)) {
    return {
      level: 'HIGH',
      reasoning: 'Deterministic rule check (document structure analysis)',
      can_system_act: isFormatFixable(result)
    };
  }

  // REQUIRES_HUMAN_JUDGEMENT: Financial, strategic, or design decisions
  if (requiresProfessionalJudgement(result)) {
    return {
      level: 'REQUIRES_HUMAN_JUDGEMENT',
      reasoning: 'Requires professional engineering or commercial judgement',
      can_system_act: false
    };
  }

  // MEDIUM: AI interpretation (default for LLM assessments)
  return {
    level: 'MEDIUM',
    reasoning: 'AI interpretation of document content',
    can_system_act: false
  };
}

/**
 * Check if this is a deterministic rule
 */
function isDeterministicCheck(result: AssessmentResult): boolean {
  // Deterministic checks have specific ID prefixes
  if (result.matrix_id?.startsWith('DCHECK-')) {
    return true;
  }

  // Check for deterministic patterns in reasoning
  const deterministicKeywords = [
    'document not found',
    'document missing',
    'section missing',
    'section not found',
    'not present',
    'absent',
    'no mention of',
    'inconsistent values',
    'cross-document mismatch',
    'contradictory information',
    'conflicting values',
    'discrepancy between'
  ];

  const text = (result.reasoning?.toLowerCase() || '') +
                ' ' +
                (result.gaps_identified?.join(' ').toLowerCase() || '');

  return deterministicKeywords.some(keyword => text.includes(keyword));
}

/**
 * Check if result requires professional judgement
 */
function requiresProfessionalJudgement(result: AssessmentResult): boolean {
  const judgementKeywords = [
    'appropriate',
    'adequate',
    'sufficient',
    'reasonable',
    'strategy',
    'design decision',
    'engineering judgement',
    'cost',
    'timeline',
    'budget',
    'commercial',
    'risk assessment',
    'proportionate',
    'suitable',
    'acceptable',
    'preferred',
    'recommended approach',
    'design choice',
    'waiver',
    'alternative measures',
    'equivalent protection'
  ];

  const text = `${result.reasoning || ''} ${result.gaps_identified?.join(' ') || ''}`.toLowerCase();

  return judgementKeywords.some(keyword => text.includes(keyword));
}

/**
 * Check if system can automatically fix this issue
 *
 * Only simple formatting/text additions qualify:
 * - Version numbers
 * - Headers/footers
 * - Standard compliance statements
 * - Section numbering
 */
function isFormatFixable(result: AssessmentResult): boolean {
  // Must be HIGH confidence to be fixable
  if (!isDeterministicCheck(result)) {
    return false;
  }

  // Must have a proposed change
  if (!result.proposed_change || result.proposed_change.length === 0) {
    return false;
  }

  // Check if the proposed change is simple formatting
  const formatKeywords = [
    'add version',
    'add header',
    'add footer',
    'add date',
    'add section',
    'add reference',
    'format',
    'numbering',
    'add document control',
    'add revision',
    'add author',
    'add approval',
    'add compliance statement',
    'add regulatory reference'
  ];

  const proposed = result.proposed_change.toLowerCase();

  // Also check it's not too long (simple text additions only)
  const isSimpleAddition = result.proposed_change.length < 500;

  return isSimpleAddition && formatKeywords.some(keyword => proposed.includes(keyword));
}

/**
 * Calculate confidence breakdown for entire assessment
 */
export function calculateConfidenceBreakdown(
  results: Array<AssessmentResult & { confidence?: ConfidenceTag }>
): { high: number; medium: number; requires_judgement: number } {
  return {
    high: results.filter(r => r.confidence?.level === 'HIGH').length,
    medium: results.filter(r => r.confidence?.level === 'MEDIUM').length,
    requires_judgement: results.filter(r => r.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT').length
  };
}

/**
 * Get human-readable explanation of what each confidence level means
 */
export function getConfidenceLevelDescription(level: ConfidenceLevel): string {
  const descriptions = {
    'HIGH': 'System can determine this definitively through document structure analysis',
    'MEDIUM': 'AI has interpreted document content with reasonable confidence',
    'REQUIRES_HUMAN_JUDGEMENT': 'System cannot determine this reliably - requires expert professional judgement'
  };

  return descriptions[level];
}
