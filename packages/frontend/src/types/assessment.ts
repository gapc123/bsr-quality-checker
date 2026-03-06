/**
 * Frontend types for assessment results
 * Mirrors backend types from Stages 1-4
 */

// Stage 1: Confidence Framework
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'REQUIRES_HUMAN_JUDGEMENT';

export interface ConfidenceTag {
  level: ConfidenceLevel;
  reasoning: string;
  can_system_act: boolean;
}

// Stage 2: Impact Analysis
export type EffortLevel = 'QUICK_FIX' | 'DAYS' | 'WEEKS' | 'MONTHS';
export type CostImpact = 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type RejectionLikelihood = 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY' | 'ALMOST_CERTAIN';

export interface EffortAssessment {
  level: EffortLevel;
  description: string;
}

export interface CostImpactAssessment {
  impact: CostImpact;
  description: string;
  typical_range?: string;
}

export interface RejectionAssessment {
  likelihood: RejectionLikelihood;
  reasoning: string;
}

// Stage 3: Triage & Prioritization
export type UrgencyLevel = 'CRITICAL_BLOCKER' | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY';
export type ActionType = 'DOCUMENT_MISSING' | 'DOCUMENT_UPDATE' | 'CROSS_DOC_ALIGNMENT' |
                         'INFORMATION_MISSING' | 'FORMAT_FIX' | 'CLARIFICATION';
export type EngagementType = 'SPECIALIST_REQUIRED' | 'INTERNAL_FIX' | 'AI_AMENDABLE' | 'CLIENT_INPUT';
export type DependencyStatus = 'BLOCKS_OTHERS' | 'BLOCKED_BY' | 'INDEPENDENT';

export interface TriageAssessment {
  urgency: UrgencyLevel;
  urgency_reasoning: string;
  action_type: ActionType;
  engagement_type: EngagementType;
  dependency_status: DependencyStatus;
  blocks_submission: boolean;
  quick_win: boolean;
}

export interface SubmissionGate {
  can_submit: boolean;
  gate_status: 'GREEN' | 'AMBER' | 'RED';
  blockers_count: number;
  high_priority_count: number;
  recommendation: string;
  blocking_issues: string[];
}

export interface CriticalPath {
  sequence: string[];
  total_days: number;
  parallel_opportunities: Array<{
    can_run_parallel: string[];
    saves_days: number;
  }>;
}

// Assessment Result (enhanced with Stages 1-3)
export interface AssessmentResult {
  matrix_id: string;
  matrix_title: string;
  category: string;
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed';
  severity: 'high' | 'medium' | 'low';
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
    effort: string;
    expected_benefit: string;
  }>;
  proposed_change: string | null;

  // Stage 1: Confidence
  confidence?: ConfidenceTag;

  // Stage 2: Impact Analysis
  effort_assessment?: EffortAssessment;
  cost_impact_assessment?: CostImpactAssessment;
  rejection_assessment?: RejectionAssessment;

  // Stage 3: Triage
  triage?: TriageAssessment;

  // Deprecated fields (kept for backward compatibility)
  confidence_old?: 'high' | 'medium' | 'low';
  cost_estimate?: { min: number; max: number; currency: string };
  timeline_estimate?: { days: number; description: string };
  rejection_risk?: { probability: number; description: string };
  priority_score?: number;
}

// Engagement Brief
export interface EngagementBrief {
  specialist_type: string;
  issues_to_address: Array<{
    id: string;
    title: string;
    urgency: string;
  }>;
  scope_of_work: string;
  deliverables: string[];
  estimated_duration: string;
  regulatory_context: string[];
  brief_text: string;
}

// Full Assessment
export interface FullAssessment {
  pack_context: {
    isLondon: boolean;
    isHRB: boolean;
    buildingType: string;
    heightMeters: number | null;
    storeys: number | null;
  };
  reference_standards_applied: Array<{
    doc_id: string;
    title: string;
    why_applicable: string;
  }>;
  results: AssessmentResult[];
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
  assessment_phases: {
    deterministic: {
      total_rules: number;
      passed: number;
      failed: number;
      needs_review: number;
      results: any[];
    };
    llm_analysis: {
      total_criteria: number;
      assessed: number;
      results_count: number;
    };
  };
  readiness_score: number;
  assessment_date: string;
  guardrail_stats: {
    corpus_backed_criteria: number;
    criteria_with_reference_anchors: number;
    reference_anchor_rate: number;
    deterministic_rule_count: number;
    llm_criteria_count: number;
  };
}
