/**
 * Comprehensive Test Scenarios for System Validation
 *
 * Stage 4: Real-world assessment cases to validate all systems
 * Tests Stages 1-3: Confidence, Impact Categories, Action Prioritization
 */

import type { AssessmentResult } from './matrix-assessment.js';

/**
 * Scenario 1: Critical Blocker - Missing Fire Strategy
 * Should produce: CRITICAL_BLOCKER urgency, HIGH cost impact, ALMOST_CERTAIN rejection
 */
export const criticalFireStrategy: AssessmentResult = {
  matrix_id: 'FIRE_001',
  matrix_title: 'Fire strategy document present and comprehensive',
  category: 'FIRE_SAFETY',
  status: 'does_not_meet',
  severity: 'high',
  reasoning: 'No comprehensive fire strategy document identified in submission pack',
  success_definition: 'Comprehensive fire strategy document covering all required elements',
  pack_evidence: {
    found: false,
    document: null,
    page: null,
    quote: null
  },
  reference_evidence: {
    found: true,
    doc_id: 'ADB',
    doc_title: 'Approved Document B',
    page: 12,
    quote: 'Volume 2, Section 1 - Fire Strategy Requirements'
  },
  gaps_identified: [
    'Fire strategy document missing',
    'Evacuation strategy not documented',
    'Fire compartmentation details absent'
  ],
  actions_required: [
    {
      action: 'Commission fire engineer to prepare comprehensive fire strategy',
      owner: 'FIRE_ENGINEER',
      effort: 'L',
      expected_benefit: 'Meets BSR requirements for fire safety documentation'
    }
  ],
  proposed_change: null
};

/**
 * Scenario 2: High Priority - Structural Calculations Incomplete
 * Should produce: HIGH_PRIORITY urgency, MEDIUM cost impact, VERY_LIKELY rejection
 */
export const structuralCalcsPartial: AssessmentResult = {
  matrix_id: 'STRUCT_002',
  matrix_title: 'Structural calculations complete and signed',
  category: 'STRUCTURAL',
  status: 'partial',
  severity: 'high',
  reasoning: 'Structural calculations present but missing load transfer analysis and some signatures',
  success_definition: 'Complete structural calculations signed by chartered engineer',
  pack_evidence: {
    found: true,
    document: 'Structural Calculations Report',
    page: 1,
    quote: 'Calculations provided for floors 1-10, but floors 11-15 incomplete'
  },
  reference_evidence: {
    found: true,
    doc_id: 'ADA',
    doc_title: 'Approved Document A',
    page: 15,
    quote: 'Section 2C - Structural Design'
  },
  gaps_identified: [
    'Load transfer analysis missing for upper floors',
    'Missing chartered engineer signature on pages 20-30',
    'Foundation design calculations incomplete'
  ],
  actions_required: [
    {
      action: 'Structural engineer to complete missing calculations and sign all pages',
      owner: 'STRUCTURAL_ENGINEER',
      effort: 'M',
      expected_benefit: 'Full compliance with structural requirements'
    }
  ],
  proposed_change: null
};

/**
 * Scenario 3: Cross-Document Inconsistency - Building Height Mismatch
 * Should produce: HIGH_PRIORITY urgency, LOW cost impact, LIKELY rejection
 * Should be flagged as CROSS_DOC_ALIGNMENT action type
 */
export const crossDocInconsistency: AssessmentResult = {
  matrix_id: 'CONS_003',
  matrix_title: 'Building height consistent across all documents',
  category: 'CONSISTENCY',
  status: 'does_not_meet',
  severity: 'high',
  reasoning: 'Building height varies between 45m (fire strategy) and 48m (architectural drawings)',
  success_definition: 'All documents report the same building height measurement',
  pack_evidence: {
    found: true,
    document: 'Fire Strategy & Architectural Drawings',
    page: 5,
    quote: '45m stated in fire strategy document, 48m shown on architectural elevations'
  },
  reference_evidence: {
    found: true,
    doc_id: 'BSA_2022',
    doc_title: 'Building Safety Act 2022',
    page: null,
    quote: 'Section 75 - Information requirements must be consistent'
  },
  gaps_identified: [
    'Inconsistent height measurements across documents',
    'Unclear which measurement is correct'
  ],
  actions_required: [
    {
      action: 'Architect to confirm accurate building height and update all documents',
      owner: 'ARCHITECT',
      effort: 'M',
      expected_benefit: 'Ensures consistency and avoids BSR queries'
    }
  ],
  proposed_change: null
};

/**
 * Scenario 4: AI-Amendable Quick Win - Missing Version Control
 * Should produce: LOW_PRIORITY urgency, NEGLIGIBLE cost impact, QUICK_WIN = true
 */
export const aiAmendableQuickWin: AssessmentResult = {
  matrix_id: 'DOC_004',
  matrix_title: 'Document version control metadata present',
  category: 'TRACEABILITY',
  status: 'does_not_meet',
  severity: 'low',
  reasoning: 'Document version numbers missing from headers',
  success_definition: 'All documents include version control metadata in headers',
  pack_evidence: {
    found: false,
    document: 'All documents',
    page: 1,
    quote: 'Headers lack version information'
  },
  reference_evidence: {
    found: true,
    doc_id: 'BSR_G2',
    doc_title: 'BSR Gateway 2 Guidance',
    page: 23,
    quote: 'Document version control recommended for traceability'
  },
  gaps_identified: ['Version numbers not in document headers'],
  actions_required: [
    {
      action: 'Add version control metadata to document headers',
      owner: 'AI_AMENDABLE',
      effort: 'S',
      expected_benefit: 'Improved document traceability'
    }
  ],
  proposed_change: `Add version control metadata to all document headers:
- Version: 1.0
- Date: 2025-01-15
- Author: [Name]
- Approved by: [Name]

This should be added to the top right corner of each document's first page.`
};

/**
 * Scenario 5: Medium Priority - MEP Specs Incomplete
 * Should produce: MEDIUM_PRIORITY urgency, MEDIUM cost impact, POSSIBLE rejection
 */
export const mepSpecsIncomplete: AssessmentResult = {
  matrix_id: 'MEP_005',
  matrix_title: 'MEP systems adequately specified',
  category: 'VENTILATION',
  status: 'partial',
  severity: 'medium',
  reasoning: 'MEP specifications present but missing ventilation system details',
  success_definition: 'Complete MEP specifications including ventilation and smoke control',
  pack_evidence: {
    found: true,
    document: 'MEP Specifications',
    page: 12,
    quote: 'Partial specifications provided, ventilation section incomplete'
  },
  reference_evidence: {
    found: true,
    doc_id: 'ADF',
    doc_title: 'Approved Document F',
    page: 45,
    quote: 'Section 2 - Ventilation Requirements'
  },
  gaps_identified: [
    'Ventilation system not fully specified',
    'Smoke control system details incomplete'
  ],
  actions_required: [
    {
      action: 'MEP engineer to complete ventilation and smoke control specifications',
      owner: 'MEP_ENGINEER',
      effort: 'M',
      expected_benefit: 'Complete compliance with ventilation requirements'
    }
  ],
  proposed_change: null
};

/**
 * Scenario 6: Passed Criterion - Good Example
 * Should produce: No triage (meets status)
 */
export const passedCriterion: AssessmentResult = {
  matrix_id: 'ACCESS_006',
  matrix_title: 'Accessibility provisions comply with Part M',
  category: 'ACCESSIBILITY',
  status: 'meets',
  severity: 'low',
  reasoning: 'Comprehensive accessibility statement provided with compliant design',
  success_definition: 'Design meets Building Regulations Part M requirements',
  pack_evidence: {
    found: true,
    document: 'Accessibility Statement',
    page: 1,
    quote: 'Full compliance demonstrated with wheelchair access, lift provisions, and refuge areas'
  },
  reference_evidence: {
    found: true,
    doc_id: 'ADM',
    doc_title: 'Approved Document M',
    page: 8,
    quote: 'Section 1 - Access Requirements'
  },
  gaps_identified: [],
  actions_required: [],
  proposed_change: null
};

/**
 * Scenario 7: Blocked Issue - Depends on Fire Strategy
 * Should produce: BLOCKED_BY dependency status
 */
export const blockedByFireStrategy: AssessmentResult = {
  matrix_id: 'EVAC_007',
  matrix_title: 'Evacuation strategy details provided',
  category: 'FIRE_SAFETY',
  status: 'does_not_meet',
  severity: 'medium',
  reasoning: 'Evacuation strategy details inconsistent with overall fire strategy approach',
  success_definition: 'Clear evacuation strategy aligned with fire strategy',
  pack_evidence: {
    found: true,
    document: 'Evacuation Plan',
    page: 3,
    quote: 'Evacuation approach documented but conflicts with fire compartmentation'
  },
  reference_evidence: {
    found: true,
    doc_id: 'ADB',
    doc_title: 'Approved Document B',
    page: 18,
    quote: 'Section 3 - Means of Escape'
  },
  gaps_identified: [
    'Evacuation strategy mismatch with fire strategy',
    'Timing assumptions unclear'
  ],
  actions_required: [
    {
      action: 'Align evacuation strategy with updated fire strategy document',
      owner: 'FIRE_ENGINEER',
      effort: 'S',
      expected_benefit: 'Consistent fire safety approach'
    }
  ],
  proposed_change: null
};

/**
 * Complete test assessment with all scenarios
 */
export const comprehensiveTestAssessment = {
  pack_context: {
    isLondon: true,
    isHRB: true,
    buildingType: 'residential',
    heightMeters: 48,
    storeys: 15
  },
  reference_standards_applied: [
    {
      doc_id: 'ADB',
      title: 'Approved Document B (Fire Safety)',
      why_applicable: 'HRB with residential units requires fire safety compliance'
    },
    {
      doc_id: 'ADA',
      title: 'Approved Document A (Structure)',
      why_applicable: 'Structural requirements for HRB'
    }
  ],
  results: [
    criticalFireStrategy,
    structuralCalcsPartial,
    crossDocInconsistency,
    aiAmendableQuickWin,
    mepSpecsIncomplete,
    passedCriterion,
    blockedByFireStrategy
  ],
  criteria_summary: {
    total_applicable: 7,
    assessed: 7,
    not_assessed: 0,
    meets: 1,
    partial: 2,
    does_not_meet: 4
  },
  flagged_by_severity: {
    high: 3,
    medium: 2,
    low: 1
  },
  assessment_phases: {
    deterministic: {
      total_rules: 55,
      passed: 45,
      failed: 7,
      needs_review: 3,
      results: []
    },
    llm_analysis: {
      total_criteria: 30,
      assessed: 7,
      results_count: 7
    }
  },
  readiness_score: 42,
  assessment_date: new Date().toISOString(),
  guardrail_stats: {
    corpus_backed_criteria: 30,
    criteria_with_reference_anchors: 28,
    reference_anchor_rate: 0.93,
    deterministic_rule_count: 55,
    llm_criteria_count: 30
  }
};

/**
 * Expected outcomes for validation
 */
export const expectedOutcomes = {
  criticalFireStrategy: {
    confidence: 'HIGH',  // Deterministic - detecting missing document is structural check
    urgency: 'CRITICAL_BLOCKER',
    action_type: 'DOCUMENT_MISSING',
    engagement_type: 'SPECIALIST_REQUIRED',
    specialist: 'Fire Safety Engineer',
    effort_level: 'MONTHS',
    cost_impact: 'HIGH',
    rejection_likelihood: 'ALMOST_CERTAIN',
    blocks_submission: true,
    quick_win: false
  },
  structuralCalcsPartial: {
    confidence: 'MEDIUM',
    urgency: 'HIGH_PRIORITY',
    action_type: 'DOCUMENT_UPDATE',
    engagement_type: 'SPECIALIST_REQUIRED',
    specialist: 'Structural Engineer',
    effort_level: 'WEEKS',
    cost_impact: 'MEDIUM',
    rejection_likelihood: 'LIKELY',  // High severity + partial → LIKELY
    blocks_submission: false,
    quick_win: false
  },
  crossDocInconsistency: {
    confidence: 'REQUIRES_HUMAN_JUDGEMENT',  // Contains 'strategy' keyword - deciding correct value requires judgement
    urgency: 'HIGH_PRIORITY',
    action_type: 'CROSS_DOC_ALIGNMENT',
    engagement_type: 'SPECIALIST_REQUIRED',
    specialist: 'Architect',
    effort_level: 'WEEKS',
    cost_impact: 'LOW',
    rejection_likelihood: 'VERY_LIKELY',  // High severity + does_not_meet → VERY_LIKELY
    blocks_submission: false,
    quick_win: false
  },
  aiAmendableQuickWin: {
    confidence: 'MEDIUM',  // Version number detection requires AI interpretation
    urgency: 'LOW_PRIORITY',
    action_type: 'FORMAT_FIX',
    engagement_type: 'AI_AMENDABLE',
    effort_level: 'QUICK_FIX',
    cost_impact: 'NEGLIGIBLE',
    rejection_likelihood: 'UNLIKELY',
    blocks_submission: false,
    quick_win: true
  },
  mepSpecsIncomplete: {
    confidence: 'MEDIUM',
    urgency: 'MEDIUM_PRIORITY',
    action_type: 'INFORMATION_MISSING',
    engagement_type: 'SPECIALIST_REQUIRED',
    specialist: 'MEP Consultant',
    effort_level: 'WEEKS',
    cost_impact: 'MEDIUM',
    rejection_likelihood: 'POSSIBLE',
    blocks_submission: false,
    quick_win: false
  },
  submissionGate: {
    can_submit: false,
    gate_status: 'RED',
    blockers_count: 1,  // Critical fire strategy
    high_priority_count: 2  // Structural + cross-doc
  }
};
