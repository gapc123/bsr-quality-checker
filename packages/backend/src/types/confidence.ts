/**
 * Confidence levels for assessment outputs
 *
 * HIGH: System can determine definitively (deterministic checks)
 * MEDIUM: AI interpretation (reasonably confident but not certain)
 * REQUIRES_HUMAN_JUDGEMENT: System cannot determine reliably
 */

export type ConfidenceLevel =
  | 'HIGH'              // Deterministic checks - system is certain
  | 'MEDIUM'            // AI interpretation - system is reasonably confident
  | 'REQUIRES_HUMAN_JUDGEMENT';  // System cannot determine reliably

/**
 * Confidence tag attached to each assessment result
 */
export interface ConfidenceTag {
  level: ConfidenceLevel;
  reasoning: string;              // Why this confidence level?
  can_system_act: boolean;        // Can AI automatically fix this?
}

/**
 * Confidence breakdown for an entire assessment
 */
export interface ConfidenceBreakdown {
  high_confidence_checks: number;
  medium_confidence_checks: number;
  requires_judgement_checks: number;
}
