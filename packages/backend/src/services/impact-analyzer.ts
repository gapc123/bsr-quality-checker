/**
 * Impact Analysis for Assessment Results
 *
 * Determines appropriate qualitative impact categories based on
 * assessment characteristics. Replaces fake numerical estimates
 * with honest categorical assessments.
 *
 * Stage 2: Moving from precision theater to transparent assessment.
 */

import type { AssessmentResult } from './matrix-assessment.js';
import type {
  EffortLevel,
  CostImpact,
  RejectionLikelihood,
  EffortAssessment,
  CostImpactAssessment,
  RejectionAssessment,
} from '../types/impact.js';

/**
 * Determine effort level required to address an issue
 */
export function determineEffortLevel(result: AssessmentResult): EffortAssessment {
  // AI amendable = quick fix
  if (result.proposed_change && result.proposed_change.length > 50) {
    return {
      level: 'QUICK_FIX',
      description: 'Text addition or document amendment (< 1 day)'
    };
  }

  // Check actions_required for effort hints
  const actions = result.actions_required || [];

  // Look for effort indicators in actions
  for (const action of actions) {
    if (action.effort === 'S') {
      return {
        level: 'DAYS',
        description: 'Minor document update or review (1-5 days)'
      };
    }
    if (action.effort === 'M') {
      return {
        level: 'WEEKS',
        description: 'Consultant engagement or design work (1-4 weeks)'
      };
    }
    if (action.effort === 'L') {
      return {
        level: 'MONTHS',
        description: 'Major redesign, commissioning, or testing (1-3 months)'
      };
    }
  }

  // Look for keywords in action descriptions
  const actionText = actions.map(a => a.action.toLowerCase()).join(' ');

  if (actionText.includes('commission') || actionText.includes('appoint') || actionText.includes('engage')) {
    // Commissioning specialists = weeks
    return {
      level: 'WEEKS',
      description: 'Requires specialist appointment (typically 2-4 weeks)'
    };
  }

  if (actionText.includes('redesign') || actionText.includes('re-engineer') || actionText.includes('testing')) {
    return {
      level: 'MONTHS',
      description: 'Major design revision or testing (1-3 months)'
    };
  }

  // Default based on severity
  if (result.severity === 'high' && result.status === 'does_not_meet') {
    return {
      level: 'WEEKS',
      description: 'Critical gap requiring specialist input (typically 2-6 weeks)'
    };
  }

  return {
    level: 'DAYS',
    description: 'Standard document review or update (few days)'
  };
}

/**
 * Determine cost impact category
 */
export function determineCostImpact(result: AssessmentResult): CostImpactAssessment {
  // AI amendable = negligible cost
  if (result.proposed_change && result.proposed_change.length > 50) {
    return {
      impact: 'NEGLIGIBLE',
      description: 'AI amendable or internal fix',
      typical_range: '~£0'
    };
  }

  // Check action owners
  const actions = result.actions_required || [];
  const ownerText = actions.map(a => a.owner?.toLowerCase() || '').join(' ');

  // Fire engineer = high cost (complex, specialized)
  if (ownerText.includes('fire')) {
    return {
      impact: 'HIGH',
      description: 'Requires fire engineering specialist',
      typical_range: 'typically £5K-£20K depending on scope'
    };
  }

  // Structural engineer = medium-high cost
  if (ownerText.includes('structural')) {
    return {
      impact: 'MEDIUM',
      description: 'Requires structural engineering work',
      typical_range: 'typically £5K-£15K'
    };
  }

  // MEP consultant = medium cost
  if (ownerText.includes('mep') || ownerText.includes('m&e')) {
    return {
      impact: 'MEDIUM',
      description: 'Requires M&E consultant input',
      typical_range: 'typically £3K-£12K'
    };
  }

  // Architect = low-medium cost
  if (ownerText.includes('architect')) {
    return {
      impact: 'LOW',
      description: 'Requires architectural review/update',
      typical_range: 'typically £1K-£5K'
    };
  }

  // Project team/manager = low cost
  if (ownerText.includes('project') || ownerText.includes('manager') || ownerText.includes('team')) {
    return {
      impact: 'LOW',
      description: 'Internal project team action',
      typical_range: 'typically £1K-£3K'
    };
  }

  // Multiple specialists = very high cost
  if (actions.length > 2 && result.severity === 'high') {
    return {
      impact: 'VERY_HIGH',
      description: 'Multiple specialists or major redesign required',
      typical_range: 'typically £20K-£50K+'
    };
  }

  // Default based on severity
  if (result.severity === 'high' && result.status === 'does_not_meet') {
    return {
      impact: 'MEDIUM',
      description: 'Specialist input likely required',
      typical_range: 'typically £5K-£15K'
    };
  }

  return {
    impact: 'LOW',
    description: 'Minor update or review',
    typical_range: 'typically £1K-£5K'
  };
}

/**
 * Determine BSR rejection likelihood
 */
export function determineRejectionLikelihood(result: AssessmentResult): RejectionAssessment {
  const severity = result.severity?.toLowerCase() || '';
  const status = result.status;
  const category = result.category?.toLowerCase() || '';

  // Definite rejection: High severity complete failure on critical topics
  if (severity === 'high' && status === 'does_not_meet') {
    // Fire safety issues = almost certain rejection
    if (category.includes('fire')) {
      return {
        likelihood: 'ALMOST_CERTAIN',
        reasoning: 'Missing critical fire safety documentation - mandatory BSR requirement'
      };
    }

    // Structural issues = very likely rejection
    if (category.includes('structural')) {
      return {
        likelihood: 'VERY_LIKELY',
        reasoning: 'Critical structural documentation gap'
      };
    }

    // Other high severity = very likely
    return {
      likelihood: 'VERY_LIKELY',
      reasoning: 'High severity gap - BSR likely to reject or issue significant queries'
    };
  }

  // High severity partial = likely rejection
  if (severity === 'high' && status === 'partial') {
    return {
      likelihood: 'LIKELY',
      reasoning: 'Incomplete critical documentation - may cause rejection or delays'
    };
  }

  // Medium severity complete failure = possible rejection
  if (severity === 'medium' && status === 'does_not_meet') {
    return {
      likelihood: 'POSSIBLE',
      reasoning: 'Moderate gap - may trigger BSR queries or request for additional information'
    };
  }

  // Medium severity partial or low severity failure = unlikely rejection
  if (severity === 'medium' && status === 'partial') {
    return {
      likelihood: 'POSSIBLE',
      reasoning: 'Partial compliance - BSR may request clarification'
    };
  }

  if (severity === 'low') {
    return {
      likelihood: 'UNLIKELY',
      reasoning: 'Minor issue - unlikely to block submission but may be noted'
    };
  }

  // Default
  return {
    likelihood: 'POSSIBLE',
    reasoning: 'Gap identified that may trigger BSR review queries'
  };
}

/**
 * Analyze all impacts for a result
 */
export function analyzeImpacts(result: AssessmentResult): {
  effort: EffortAssessment;
  cost: CostImpactAssessment;
  rejection: RejectionAssessment;
} {
  return {
    effort: determineEffortLevel(result),
    cost: determineCostImpact(result),
    rejection: determineRejectionLikelihood(result)
  };
}
