/**
 * Cost estimation for remediation actions
 * Based on typical UK construction consultancy rates 2025
 */

export const OWNER_TYPE_COSTS = {
  // No cost (AI can fix)
  AI_AMENDABLE: { min: 0, max: 0, unit: 'fixed' },

  // Specialist engineers
  FIRE_ENGINEER: { min: 2500, max: 8000, unit: 'per_task' },
  STRUCTURAL_ENGINEER: { min: 3000, max: 10000, unit: 'per_task' },
  MEP_ENGINEER: { min: 2000, max: 6000, unit: 'per_task' },
  FACADE_ENGINEER: { min: 3000, max: 8000, unit: 'per_task' },
  ACOUSTIC_CONSULTANT: { min: 1500, max: 4000, unit: 'per_task' },

  // Design team
  ARCHITECT: { min: 1000, max: 3000, unit: 'per_task' },
  PRINCIPAL_DESIGNER: { min: 500, max: 2000, unit: 'per_task' },

  // Project management
  PROJECT_MANAGER: { min: 300, max: 1000, unit: 'per_task' },
  BUILDING_CONTROL: { min: 500, max: 2000, unit: 'per_task' },

  // Testing & certification
  TESTING_REQUIRED: { min: 2000, max: 8000, unit: 'per_task' },
  THIRD_PARTY_CERTIFICATION: { min: 1000, max: 5000, unit: 'per_task' },

  // Legal/compliance
  LEGAL_REVIEW: { min: 2000, max: 6000, unit: 'per_task' },

  // Surveys & assessments
  SITE_SURVEY: { min: 1500, max: 5000, unit: 'per_task' },

  // Unknown/unclear
  UNCLEAR_OWNER: { min: 500, max: 2000, unit: 'per_task' },
} as const;

export const EFFORT_TIME_ESTIMATES = {
  // AI fixes
  'AI_instant': { days: 0, description: '<1 hour' },

  // Small tasks
  'S': { days: 1, description: '1-2 days' },

  // Medium tasks
  'M': { days: 7, description: '1 week' },
  'M+': { days: 14, description: '2 weeks' },

  // Large tasks
  'L': { days: 21, description: '3 weeks' },
  'L+': { days: 28, description: '4 weeks' },

  // Extra large (new document creation)
  'XL': { days: 42, description: '6 weeks' },
} as const;

export const SEVERITY_REJECTION_RISK = {
  'high': {
    rejection_probability: 0.85,
    description: 'Very likely to cause BSR rejection',
    priority: 1
  },
  'medium': {
    rejection_probability: 0.50,
    description: 'May cause BSR rejection or queries',
    priority: 2
  },
  'low': {
    rejection_probability: 0.15,
    description: 'Minor issue, unlikely to block submission',
    priority: 3
  },
} as const;

export const READINESS_THRESHOLDS = {
  GREEN: {
    min_score: 85,
    max_critical_issues: 0,
    max_high_issues: 2,
    verdict: 'READY FOR SUBMISSION',
    description: 'Your pack meets BSR requirements. Minor improvements recommended but not blocking.',
  },
  AMBER: {
    min_score: 60,
    max_critical_issues: 2,
    max_high_issues: 8,
    verdict: 'NEEDS WORK BEFORE SUBMISSION',
    description: 'Significant gaps identified. Recommend fixing critical issues before submitting to avoid rejection.',
  },
  RED: {
    min_score: 0,
    verdict: 'NOT READY FOR SUBMISSION',
    description: 'Critical gaps that will cause BSR rejection. Do not submit until these are resolved.',
  },
} as const;

/**
 * Calculate cost estimate for a given issue
 */
export function estimateIssueCost(ownerType: string, effort: string): { min: number; max: number } {
  const ownerCost = OWNER_TYPE_COSTS[ownerType as keyof typeof OWNER_TYPE_COSTS] || OWNER_TYPE_COSTS.UNCLEAR_OWNER;

  // Adjust cost based on effort
  const effortMultiplier = {
    'AI_instant': 0,
    'S': 0.5,
    'M': 1.0,
    'M+': 1.5,
    'L': 2.0,
    'L+': 2.5,
    'XL': 3.5,
  }[effort] || 1.0;

  return {
    min: Math.round(ownerCost.min * effortMultiplier),
    max: Math.round(ownerCost.max * effortMultiplier),
  };
}

/**
 * Calculate timeline estimate considering parallel workstreams
 */
export function estimateTimeline(issues: Array<{ effort: string; owner: string }>): {
  total_days: number;
  critical_path_owner: string;
  can_parallelize: boolean;
} {
  // Group by owner
  const byOwner = issues.reduce((acc, issue) => {
    const owner = issue.owner || 'UNCLEAR_OWNER';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(issue);
    return acc;
  }, {} as Record<string, typeof issues>);

  // Calculate max days per owner (assumes sequential within owner)
  const ownerTimelines = Object.entries(byOwner).map(([owner, ownerIssues]) => {
    const totalDays = ownerIssues.reduce((sum, issue) => {
      const effort = issue.effort || 'M';
      const days = EFFORT_TIME_ESTIMATES[effort as keyof typeof EFFORT_TIME_ESTIMATES]?.days || 7;
      return sum + days;
    }, 0);
    return { owner, days: totalDays };
  });

  // Critical path = longest owner timeline (if parallel)
  const criticalPath = ownerTimelines.sort((a, b) => b.days - a.days)[0];

  return {
    total_days: criticalPath?.days || 0,
    critical_path_owner: criticalPath?.owner || 'Unknown',
    can_parallelize: Object.keys(byOwner).length > 1,
  };
}
