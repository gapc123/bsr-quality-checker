/**
 * Impact Categories for Assessment Results
 *
 * Replaces fake numerical estimates with honest qualitative assessments.
 * Stage 2: Moving away from presenting guesses as facts.
 */

/**
 * Effort level required to address an issue
 */
export type EffortLevel =
  | 'QUICK_FIX'    // < 1 day (document amendments, text additions)
  | 'DAYS'         // 1-5 days (document reviews, minor updates)
  | 'WEEKS'        // 1-4 weeks (consultant engagement, design work)
  | 'MONTHS';      // 1-3 months (major redesign, commissioning, testing)

/**
 * Cost impact category
 */
export type CostImpact =
  | 'NEGLIGIBLE'   // ~£0 (AI amendable, internal fixes)
  | 'LOW'          // £1K-£5K range (document review, minor consultant time)
  | 'MEDIUM'       // £5K-£20K range (single specialist engagement)
  | 'HIGH'         // £20K-£50K range (multiple specialists, significant work)
  | 'VERY_HIGH';   // £50K+ range (major redesign, re-engineering)

/**
 * Likelihood of BSR rejection
 */
export type RejectionLikelihood =
  | 'UNLIKELY'        // Minor issue, BSR may note but unlikely to reject
  | 'POSSIBLE'        // Could cause queries or delays
  | 'LIKELY'          // Significant gap, probably will cause rejection
  | 'VERY_LIKELY'     // Critical gap, almost certainly rejection
  | 'ALMOST_CERTAIN'; // Mandatory requirement missing, definite rejection

/**
 * Effort level assessment with description
 */
export interface EffortAssessment {
  level: EffortLevel;
  description: string;  // Human-readable explanation (e.g., "Typical fire engineer engagement: 2-4 weeks")
}

/**
 * Cost impact assessment with description
 */
export interface CostImpactAssessment {
  impact: CostImpact;
  description: string;  // Human-readable explanation (e.g., "Requires specialist fire engineer")
  typical_range?: string; // Optional typical range (e.g., "typically £5K-£15K" but not presented as fact)
}

/**
 * Rejection likelihood assessment with reasoning
 */
export interface RejectionAssessment {
  likelihood: RejectionLikelihood;
  reasoning: string;  // Why this likelihood? (e.g., "Missing mandatory fire strategy")
}

/**
 * Helper: Get human-readable description for effort level
 */
export function describeEffortLevel(level: EffortLevel): string {
  const descriptions = {
    'QUICK_FIX': 'Quick fix (less than 1 day)',
    'DAYS': 'Few days work (1-5 days)',
    'WEEKS': 'Consultant engagement (1-4 weeks)',
    'MONTHS': 'Major work (1-3 months)'
  };
  return descriptions[level];
}

/**
 * Helper: Get human-readable description for cost impact
 */
export function describeCostImpact(impact: CostImpact): string {
  const descriptions = {
    'NEGLIGIBLE': 'Negligible cost (internal fix or AI amendable)',
    'LOW': 'Low cost impact (minor consultant time)',
    'MEDIUM': 'Medium cost impact (single specialist engagement)',
    'HIGH': 'High cost impact (multiple specialists or significant work)',
    'VERY_HIGH': 'Very high cost impact (major redesign or re-engineering)'
  };
  return descriptions[impact];
}

/**
 * Helper: Get human-readable description for rejection likelihood
 */
export function describeRejectionLikelihood(likelihood: RejectionLikelihood): string {
  const descriptions = {
    'UNLIKELY': 'Unlikely to cause rejection (minor issue)',
    'POSSIBLE': 'Possible rejection or queries (moderate concern)',
    'LIKELY': 'Likely to cause rejection (significant gap)',
    'VERY_LIKELY': 'Very likely to cause rejection (critical gap)',
    'ALMOST_CERTAIN': 'Almost certain rejection (mandatory requirement missing)'
  };
  return descriptions[likelihood];
}

/**
 * Helper: Get emoji for effort level
 */
export function getEffortEmoji(level: EffortLevel): string {
  const emojis = {
    'QUICK_FIX': '⚡',
    'DAYS': '📅',
    'WEEKS': '📆',
    'MONTHS': '🗓️'
  };
  return emojis[level];
}

/**
 * Helper: Get emoji for cost impact
 */
export function getCostImpactEmoji(impact: CostImpact): string {
  const emojis = {
    'NEGLIGIBLE': '💚',
    'LOW': '💛',
    'MEDIUM': '🟠',
    'HIGH': '🔴',
    'VERY_HIGH': '🔥'
  };
  return emojis[impact];
}

/**
 * Helper: Get emoji for rejection likelihood
 */
export function getRejectionEmoji(likelihood: RejectionLikelihood): string {
  const emojis = {
    'UNLIKELY': '✅',
    'POSSIBLE': '⚠️',
    'LIKELY': '🚨',
    'VERY_LIKELY': '🔴',
    'ALMOST_CERTAIN': '❌'
  };
  return emojis[likelihood];
}
