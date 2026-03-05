/**
 * Triage Analysis for Assessment Results
 *
 * Stage 3: Determines urgency levels and action priorities
 * Helps consultants make clear 1-week delivery decisions
 */

import type { AssessmentResult } from './matrix-assessment.js';
import type {
  UrgencyLevel,
  ActionType,
  EngagementType,
  DependencyStatus,
  TriageAssessment,
  SubmissionGate,
} from '../types/triage.js';

/**
 * Determine urgency level for an issue
 */
export function determineUrgency(result: AssessmentResult): {
  urgency: UrgencyLevel;
  reasoning: string;
  blocks_submission: boolean;
} {
  const severity = result.severity?.toLowerCase() || '';
  const status = result.status;
  const category = result.category?.toLowerCase() || '';

  // CRITICAL_BLOCKER: High severity complete failure on mandatory topics
  if (severity === 'high' && status === 'does_not_meet') {
    // Fire safety = always critical blocker
    if (category.includes('fire')) {
      return {
        urgency: 'CRITICAL_BLOCKER',
        reasoning: 'Missing mandatory fire safety documentation - BSR will reject immediately',
        blocks_submission: true
      };
    }

    // Structural = critical blocker
    if (category.includes('structural')) {
      return {
        urgency: 'CRITICAL_BLOCKER',
        reasoning: 'Missing critical structural documentation - mandatory for HRB',
        blocks_submission: true
      };
    }

    // Other high severity failures = critical blocker
    return {
      urgency: 'CRITICAL_BLOCKER',
      reasoning: 'High severity gap - BSR will reject or issue stop notice',
      blocks_submission: true
    };
  }

  // HIGH_PRIORITY: High severity partial or medium severity failure
  if ((severity === 'high' && status === 'partial') ||
      (severity === 'medium' && status === 'does_not_meet')) {
    return {
      urgency: 'HIGH_PRIORITY',
      reasoning: 'Significant gap - BSR likely to reject or request significant revisions',
      blocks_submission: false
    };
  }

  // MEDIUM_PRIORITY: Medium severity partial or low severity failure
  if ((severity === 'medium' && status === 'partial') ||
      (severity === 'low' && status === 'does_not_meet')) {
    return {
      urgency: 'MEDIUM_PRIORITY',
      reasoning: 'Moderate issue - may trigger BSR queries but unlikely to block submission',
      blocks_submission: false
    };
  }

  // LOW_PRIORITY: Low severity partial
  if (severity === 'low' && status === 'partial') {
    return {
      urgency: 'LOW_PRIORITY',
      reasoning: 'Minor issue - best practice improvement',
      blocks_submission: false
    };
  }

  // Default to medium
  return {
    urgency: 'MEDIUM_PRIORITY',
    reasoning: 'Standard priority issue requiring attention',
    blocks_submission: false
  };
}

/**
 * Determine action type based on issue characteristics
 */
export function determineActionType(result: AssessmentResult): ActionType {
  const reasoning = result.reasoning?.toLowerCase() || '';
  const gaps = result.gaps_identified?.join(' ').toLowerCase() || '';
  const text = `${reasoning} ${gaps}`;

  // Document completely missing
  if (text.includes('document missing') ||
      text.includes('document not found') ||
      text.includes('no document') ||
      text.includes('document absent')) {
    return 'DOCUMENT_MISSING';
  }

  // Cross-document inconsistency
  if (text.includes('inconsistent') ||
      text.includes('conflicting') ||
      text.includes('contradictory') ||
      text.includes('mismatch') ||
      text.includes('varies between')) {
    return 'CROSS_DOC_ALIGNMENT';
  }

  // Information missing from existing document
  if (text.includes('section missing') ||
      text.includes('information missing') ||
      text.includes('details absent') ||
      text.includes('not specified') ||
      text.includes('no mention')) {
    return 'INFORMATION_MISSING';
  }

  // Formatting/structure issue
  if (text.includes('version') ||
      text.includes('header') ||
      text.includes('footer') ||
      text.includes('numbering') ||
      text.includes('format')) {
    return 'FORMAT_FIX';
  }

  // Ambiguous/unclear content
  if (text.includes('unclear') ||
      text.includes('ambiguous') ||
      text.includes('vague') ||
      text.includes('clarification needed')) {
    return 'CLARIFICATION';
  }

  // Default to document update
  return 'DOCUMENT_UPDATE';
}

/**
 * Determine engagement type based on who needs to do the work
 */
export function determineEngagementType(result: AssessmentResult): {
  engagement_type: EngagementType;
  specialist_type?: string;
} {
  // Check if AI amendable
  if (result.proposed_change && result.proposed_change.length > 50) {
    return {
      engagement_type: 'AI_AMENDABLE'
    };
  }

  // Check actions for specialist requirements
  const actions = result.actions_required || [];
  const ownerText = actions.map(a => a.owner?.toLowerCase() || '').join(' ');

  if (ownerText.includes('fire')) {
    return {
      engagement_type: 'SPECIALIST_REQUIRED',
      specialist_type: 'Fire Safety Engineer'
    };
  }

  if (ownerText.includes('structural')) {
    return {
      engagement_type: 'SPECIALIST_REQUIRED',
      specialist_type: 'Structural Engineer'
    };
  }

  if (ownerText.includes('mep') || ownerText.includes('m&e')) {
    return {
      engagement_type: 'SPECIALIST_REQUIRED',
      specialist_type: 'MEP Consultant'
    };
  }

  if (ownerText.includes('architect')) {
    return {
      engagement_type: 'SPECIALIST_REQUIRED',
      specialist_type: 'Architect'
    };
  }

  if (ownerText.includes('client')) {
    return {
      engagement_type: 'CLIENT_INPUT'
    };
  }

  // Default to internal fix
  return {
    engagement_type: 'INTERNAL_FIX'
  };
}

/**
 * Determine dependency status
 */
export function determineDependencyStatus(result: AssessmentResult): DependencyStatus {
  const category = result.category?.toLowerCase() || '';
  const reasoning = result.reasoning?.toLowerCase() || '';

  // Fire strategy often blocks other work
  if (category.includes('fire') && reasoning.includes('strategy')) {
    return 'BLOCKS_OTHERS';
  }

  // Structural calcs often block other work
  if (category.includes('structural') && reasoning.includes('calculation')) {
    return 'BLOCKS_OTHERS';
  }

  // Cross-document issues might be blocked by primary documents
  if (reasoning.includes('inconsistent') || reasoning.includes('mismatch')) {
    return 'BLOCKED_BY';
  }

  // Most issues can be done independently
  return 'INDEPENDENT';
}

/**
 * Determine if this is a quick win (< 2 days work)
 */
export function isQuickWin(result: AssessmentResult): boolean {
  // AI amendable = quick win
  if (result.proposed_change && result.proposed_change.length > 50) {
    return true;
  }

  // Check effort in actions
  const actions = result.actions_required || [];
  const hasSmallEffort = actions.some(a => a.effort === 'S');

  if (hasSmallEffort) {
    return true;
  }

  // Check if it's a format fix
  const reasoning = result.reasoning?.toLowerCase() || '';
  if (reasoning.includes('format') ||
      reasoning.includes('version') ||
      reasoning.includes('header')) {
    return true;
  }

  return false;
}

/**
 * Perform complete triage analysis
 */
export function analyzeTriageForIssue(result: AssessmentResult): TriageAssessment {
  const urgencyAnalysis = determineUrgency(result);
  const actionType = determineActionType(result);
  const engagementAnalysis = determineEngagementType(result);
  const dependencyStatus = determineDependencyStatus(result);
  const quickWin = isQuickWin(result);

  return {
    urgency: urgencyAnalysis.urgency,
    urgency_reasoning: urgencyAnalysis.reasoning,
    action_type: actionType,
    engagement_type: engagementAnalysis.engagement_type,
    dependency_status: dependencyStatus,
    blocks_submission: urgencyAnalysis.blocks_submission,
    quick_win: quickWin,
  };
}

/**
 * Analyze submission readiness gate
 */
export function analyzeSubmissionGate(
  results: Array<AssessmentResult & { triage?: TriageAssessment }>
): SubmissionGate {
  const blockers = results.filter(r => r.triage?.blocks_submission);
  const highPriority = results.filter(r => r.triage?.urgency === 'HIGH_PRIORITY');

  const blockersCount = blockers.length;
  const highPriorityCount = highPriority.length;

  let canSubmit = false;
  let gateStatus: 'GREEN' | 'AMBER' | 'RED' = 'RED';
  let recommendation = '';

  if (blockersCount === 0 && highPriorityCount === 0) {
    canSubmit = true;
    gateStatus = 'GREEN';
    recommendation = 'SUBMIT NOW - Pack meets BSR requirements for Gateway 2 submission';
  } else if (blockersCount === 0 && highPriorityCount <= 2) {
    canSubmit = false;
    gateStatus = 'AMBER';
    recommendation = `PROCEED WITH CAUTION - ${highPriorityCount} high priority issue${highPriorityCount > 1 ? 's' : ''} remain. Consider fixing before submission to avoid BSR queries.`;
  } else if (blockersCount > 0) {
    canSubmit = false;
    gateStatus = 'RED';
    recommendation = `DO NOT SUBMIT - ${blockersCount} critical blocker${blockersCount > 1 ? 's' : ''} will cause immediate BSR rejection. Fix these first.`;
  }

  return {
    can_submit: canSubmit,
    gate_status: gateStatus,
    blockers_count: blockersCount,
    high_priority_count: highPriorityCount,
    recommendation,
    blocking_issues: blockers.map(b => b.matrix_id),
  };
}

/**
 * Analyze critical path and dependencies
 */
export function analyzeCriticalPath(
  results: Array<AssessmentResult & { triage?: TriageAssessment }>
): import('../types/triage.js').CriticalPath {
  // Filter to failed/partial criteria only
  const issues = results.filter(r =>
    (r.status === 'does_not_meet' || r.status === 'partial') && r.triage
  );

  // Identify blocking issues (must be done first)
  const blockingIssues = issues.filter(
    i => i.triage?.dependency_status === 'BLOCKS_OTHERS'
  );

  // Identify blocked issues (depend on others)
  const blockedIssues = issues.filter(
    i => i.triage?.dependency_status === 'BLOCKED_BY'
  );

  // Identify independent issues (can be done in parallel)
  const independentIssues = issues.filter(
    i => i.triage?.dependency_status === 'INDEPENDENT'
  );

  // Build critical path sequence
  const sequence: string[] = [];
  let totalDays = 0;

  // 1. Blocking issues must be done first (in order of urgency)
  const sortedBlockers = blockingIssues.sort((a, b) => {
    const urgencyOrder = {
      'CRITICAL_BLOCKER': 0,
      'HIGH_PRIORITY': 1,
      'MEDIUM_PRIORITY': 2,
      'LOW_PRIORITY': 3
    };
    return (urgencyOrder[a.triage!.urgency] || 99) - (urgencyOrder[b.triage!.urgency] || 99);
  });

  for (const issue of sortedBlockers) {
    sequence.push(issue.matrix_id);
    // Estimate days based on effort assessment
    const days = estimateDaysFromEffort(issue);
    totalDays += days;
  }

  // 2. Then blocked issues (once blockers are resolved)
  for (const issue of blockedIssues) {
    sequence.push(issue.matrix_id);
    const days = estimateDaysFromEffort(issue);
    totalDays += days;
  }

  // 3. Independent issues can be done in parallel
  const parallelOpportunities = [];
  if (independentIssues.length > 0) {
    // Group independent issues by specialist type for parallel execution
    const bySpecialist: Record<string, string[]> = {};

    for (const issue of independentIssues) {
      const actions = issue.actions_required || [];
      const owner = actions[0]?.owner || 'UNKNOWN';

      if (!bySpecialist[owner]) {
        bySpecialist[owner] = [];
      }
      bySpecialist[owner].push(issue.matrix_id);
    }

    // Each specialist group can work in parallel
    const specialistGroups = Object.values(bySpecialist);
    if (specialistGroups.length > 1) {
      // Calculate time saved by parallelization
      let sequentialDays = 0;
      for (const issue of independentIssues) {
        sequentialDays += estimateDaysFromEffort(issue);
      }

      // If done in parallel, we only need the longest path
      const longestPath = Math.max(...independentIssues.map(i => estimateDaysFromEffort(i)));
      const savedDays = sequentialDays - longestPath;

      parallelOpportunities.push({
        can_run_parallel: independentIssues.map(i => i.matrix_id),
        saves_days: savedDays
      });

      totalDays += longestPath;
    } else {
      // All independent but same specialist - must be sequential
      for (const issue of independentIssues) {
        totalDays += estimateDaysFromEffort(issue);
      }
    }

    // Add independent issues to sequence
    independentIssues.forEach(i => sequence.push(i.matrix_id));
  }

  return {
    sequence,
    total_days: totalDays,
    parallel_opportunities: parallelOpportunities
  };
}

/**
 * Helper: Estimate days from effort assessment
 */
function estimateDaysFromEffort(result: AssessmentResult): number {
  if (result.effort_assessment) {
    const estimates = {
      'QUICK_FIX': 0.5,
      'DAYS': 3,
      'WEEKS': 14,
      'MONTHS': 60
    };
    return estimates[result.effort_assessment.level] || 7;
  }

  // Fallback to action effort
  const actions = result.actions_required || [];
  if (actions.length > 0) {
    const effort = actions[0].effort;
    if (effort === 'S') return 2;
    if (effort === 'M') return 7;
    if (effort === 'L') return 21;
  }

  return 7; // Default
}
