/**
 * Triage and Action Prioritization Types
 *
 * Stage 3: Action-oriented output redesign
 * Helps consultants make clear 1-week delivery decisions
 */

/**
 * Urgency level - how critical is this issue for submission?
 */
export type UrgencyLevel =
  | 'CRITICAL_BLOCKER'   // Must fix before submission - BSR will definitely reject
  | 'HIGH_PRIORITY'      // Should fix before submission - BSR likely to reject/query
  | 'MEDIUM_PRIORITY'    // Fix if time allows - improves submission quality
  | 'LOW_PRIORITY';      // Nice to have - minor improvements

/**
 * Action type - what kind of work is needed?
 */
export type ActionType =
  | 'DOCUMENT_MISSING'      // Need to commission/create entirely new document
  | 'DOCUMENT_UPDATE'       // Need to revise existing document substantially
  | 'CROSS_DOC_ALIGNMENT'   // Need to align information across documents
  | 'INFORMATION_MISSING'   // Need to add specific information/section
  | 'FORMAT_FIX'            // Simple formatting/structure fix
  | 'CLARIFICATION';        // Need to clarify ambiguous content

/**
 * Dependency status - how does this relate to other work?
 */
export type DependencyStatus =
  | 'BLOCKS_OTHERS'    // This must be fixed first - other work depends on it
  | 'BLOCKED_BY'       // This depends on other fixes being completed first
  | 'INDEPENDENT';     // Can be done in parallel with other work

/**
 * Engagement type - who needs to be involved?
 */
export type EngagementType =
  | 'SPECIALIST_REQUIRED'  // Need to engage external consultant (fire engineer, etc.)
  | 'INTERNAL_FIX'         // Project team can handle with existing resources
  | 'AI_AMENDABLE'         // System can potentially fix automatically
  | 'CLIENT_INPUT';        // Requires client to provide information

/**
 * Complete triage assessment for an issue
 */
export interface TriageAssessment {
  urgency: UrgencyLevel;
  urgency_reasoning: string;
  action_type: ActionType;
  engagement_type: EngagementType;
  dependency_status: DependencyStatus;
  blocks_submission: boolean;  // True if this prevents submission entirely
  quick_win: boolean;          // True if this is easy/fast to fix (< 2 days)
}

/**
 * Submission readiness gate
 */
export interface SubmissionGate {
  can_submit: boolean;
  gate_status: 'GREEN' | 'AMBER' | 'RED';
  blockers_count: number;
  high_priority_count: number;
  recommendation: string;  // Clear action: "Submit now", "Fix X first", "Do not submit"
  blocking_issues: string[];  // IDs of issues that must be resolved
}

/**
 * Action with full triage context
 */
export interface TriagedAction {
  id: string;
  criterion_id: string;
  description: string;
  owner_role: string;
  triage: TriageAssessment;
  estimated_days: number;  // Rough estimate for planning
  specialist_type?: string; // If specialist needed, what type?
}

/**
 * Critical path analysis
 */
export interface CriticalPath {
  sequence: string[];  // Ordered list of criterion IDs that must be done in order
  total_days: number;  // Minimum time if done sequentially
  parallel_opportunities: Array<{
    can_run_parallel: string[];  // Criterion IDs that can be done at same time
    saves_days: number;           // Time saved by parallelizing
  }>;
}

/**
 * Helper: Get urgency level description
 */
export function describeUrgencyLevel(level: UrgencyLevel): string {
  const descriptions = {
    'CRITICAL_BLOCKER': 'Must fix before submission - BSR will reject',
    'HIGH_PRIORITY': 'Should fix before submission - significant rejection risk',
    'MEDIUM_PRIORITY': 'Fix if time allows - improves quality',
    'LOW_PRIORITY': 'Nice to have - minor improvement'
  };
  return descriptions[level];
}

/**
 * Helper: Get urgency emoji
 */
export function getUrgencyEmoji(level: UrgencyLevel): string {
  const emojis = {
    'CRITICAL_BLOCKER': '🚨',
    'HIGH_PRIORITY': '⚠️',
    'MEDIUM_PRIORITY': '📋',
    'LOW_PRIORITY': '💡'
  };
  return emojis[level];
}

/**
 * Helper: Get action type description
 */
export function describeActionType(type: ActionType): string {
  const descriptions = {
    'DOCUMENT_MISSING': 'Commission new document',
    'DOCUMENT_UPDATE': 'Revise existing document',
    'CROSS_DOC_ALIGNMENT': 'Align information across documents',
    'INFORMATION_MISSING': 'Add missing information',
    'FORMAT_FIX': 'Fix formatting/structure',
    'CLARIFICATION': 'Clarify ambiguous content'
  };
  return descriptions[type];
}

/**
 * Helper: Get engagement type description
 */
export function describeEngagementType(type: EngagementType): string {
  const descriptions = {
    'SPECIALIST_REQUIRED': 'Engage external specialist',
    'INTERNAL_FIX': 'Internal team can handle',
    'AI_AMENDABLE': 'Can be automated',
    'CLIENT_INPUT': 'Client must provide information'
  };
  return descriptions[type];
}

/**
 * Helper: Get dependency status description
 */
export function describeDependencyStatus(status: DependencyStatus): string {
  const descriptions = {
    'BLOCKS_OTHERS': 'Must do first - blocks other work',
    'BLOCKED_BY': 'Depends on other work being completed',
    'INDEPENDENT': 'Can be done in parallel'
  };
  return descriptions[status];
}
