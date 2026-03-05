/**
 * Test script to verify enhanced report generation
 */

import { generateMatrixReport } from './matrix-report.js';
import { FullAssessment, AssessmentResult } from './matrix-assessment.js';

// Create sample assessment data
const mockResults: AssessmentResult[] = [
  // Critical issue - missing fire strategy
  {
    matrix_id: 'FIRE_001',
    matrix_title: 'Fire strategy document present and comprehensive',
    success_definition: 'Comprehensive fire strategy document covering all required elements',
    status: 'does_not_meet',
    severity: 'high',
    reasoning: 'No comprehensive fire strategy document identified in submission pack',
    gaps_identified: [
      'Fire strategy document missing',
      'Evacuation strategy not documented',
      'Fire compartmentation details absent'
    ],
    proposed_change: null,
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
      quote: 'Volume 2, Section 1'
    },
    actions_required: [
      {
        action: 'Commission fire engineer to prepare comprehensive fire strategy',
        owner: 'FIRE_ENGINEER',
        effort: 'L',
        expected_benefit: 'Meets BSR requirements for fire safety documentation'
      }
    ],
    confidence_old: 'high', // Legacy field
    category: 'FIRE_SAFETY',
    cost_estimate: { min: 5000, max: 16000, currency: 'GBP' },
    timeline_estimate: { days: 28, description: '4 weeks' },
    rejection_risk: { probability: 0.85, description: 'Very likely to cause BSR rejection' },
    priority_score: 87
  },

  // High severity - inconsistent building height
  {
    matrix_id: 'CONS_002',
    matrix_title: 'Building height consistent across all documents',
    success_definition: 'All documents report the same building height measurement',
    status: 'does_not_meet',
    severity: 'high',
    reasoning: 'Building height varies between 45m (fire strategy) and 48m (architectural drawings)',
    gaps_identified: [
      'Inconsistent height measurements across documents',
      'Unclear which measurement is correct'
    ],
    proposed_change: null,
    pack_evidence: {
      found: true,
      document: 'Fire Strategy & Architectural Drawings',
      page: 5,
      quote: '45m in fire strategy, 48m in drawings'
    },
    reference_evidence: {
      found: true,
      doc_id: 'BSA_2022',
      doc_title: 'Building Safety Act 2022',
      page: null,
      quote: 's.75'
    },
    actions_required: [
      {
        action: 'Architect to confirm accurate building height and update all documents',
        owner: 'ARCHITECT',
        effort: 'M',
        expected_benefit: 'Ensures consistency and avoids BSR queries'
      }
    ],
    confidence_old: 'high', // Legacy field
    category: 'CONSISTENCY',
    cost_estimate: { min: 1500, max: 4500, currency: 'GBP' },
    timeline_estimate: { days: 7, description: '1 week' },
    rejection_risk: { probability: 0.85, description: 'Very likely to cause BSR rejection' },
    priority_score: 85
  },

  // Medium severity - incomplete MEP specs
  {
    matrix_id: 'MEP_003',
    matrix_title: 'MEP systems adequately specified',
    success_definition: 'Complete MEP specifications including ventilation and smoke control',
    status: 'partial',
    severity: 'medium',
    reasoning: 'MEP specifications present but missing ventilation system details',
    gaps_identified: [
      'Ventilation system not fully specified',
      'Smoke control system details incomplete'
    ],
    proposed_change: null,
    pack_evidence: {
      found: true,
      document: 'MEP Specifications',
      page: 12,
      quote: 'Partial specifications provided'
    },
    reference_evidence: {
      found: true,
      doc_id: 'ADF',
      doc_title: 'Approved Document F',
      page: 45,
      quote: 'Section 2'
    },
    actions_required: [
      {
        action: 'MEP engineer to complete ventilation and smoke control specifications',
        owner: 'MEP_ENGINEER',
        effort: 'M',
        expected_benefit: 'Complete compliance with ventilation requirements'
      }
    ],
    confidence_old: 'high', // Legacy field
    category: 'VENTILATION',
    cost_estimate: { min: 3000, max: 9000, currency: 'GBP' },
    timeline_estimate: { days: 14, description: '2 weeks' },
    rejection_risk: { probability: 0.50, description: 'May cause BSR rejection or queries' },
    priority_score: 60
  },

  // AI-fixable issue
  {
    matrix_id: 'DOC_004',
    matrix_title: 'Document metadata complete',
    success_definition: 'All documents include version control metadata in headers',
    status: 'does_not_meet',
    severity: 'low',
    reasoning: 'Document version numbers missing from headers',
    gaps_identified: ['Version numbers not in document headers'],
    proposed_change: 'Add version control metadata to all document headers:\n- Version: 1.0\n- Date: 2025-01-15\n- Author: [Name]',
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
      quote: 'Document Requirements'
    },
    actions_required: [
      {
        action: 'Add version control metadata to document headers',
        owner: 'AI_AMENDABLE',
        effort: 'S',
        expected_benefit: 'Improved document traceability'
      }
    ],
    confidence_old: 'high', // Legacy field
    category: 'TRACEABILITY',
    cost_estimate: { min: 0, max: 0, currency: 'GBP' },
    timeline_estimate: { days: 0, description: '<1 hour' },
    rejection_risk: { probability: 0.15, description: 'Minor issue, unlikely to block submission' },
    priority_score: 20
  },

  // Passed criterion
  {
    matrix_id: 'STRUCT_005',
    matrix_title: 'Structural calculations provided',
    success_definition: 'Comprehensive structural calculations by chartered engineer',
    status: 'meets',
    severity: 'low',
    reasoning: 'Comprehensive structural calculations provided by chartered structural engineer',
    gaps_identified: [],
    proposed_change: null,
    pack_evidence: {
      found: true,
      document: 'Structural Calculations',
      page: 1,
      quote: 'Complete calculations provided'
    },
    reference_evidence: {
      found: true,
      doc_id: 'ADA',
      doc_title: 'Approved Document A',
      page: 15,
      quote: 'Section 2C'
    },
    actions_required: [],
    confidence_old: 'high', // Legacy field
    category: 'STRUCTURAL',
    cost_estimate: { min: 0, max: 0, currency: 'GBP' },
    timeline_estimate: { days: 0, description: '<1 hour' },
    rejection_risk: { probability: 0, description: 'No risk' },
    priority_score: 0
  }
];

const mockAssessment: FullAssessment = {
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
    }
  ],
  results: mockResults,
  criteria_summary: {
    total_applicable: 5,
    assessed: 5,
    not_assessed: 0,
    meets: 1,
    partial: 1,
    does_not_meet: 3
  },
  flagged_by_severity: {
    high: 2,
    medium: 1,
    low: 1
  },
  assessment_phases: {
    deterministic: {
      total_rules: 55,
      passed: 40,
      failed: 10,
      needs_review: 5,
      results: []
    },
    llm_analysis: {
      total_criteria: 30,
      assessed: 5,
      results_count: 5
    }
  },
  readiness_score: 45,
  assessment_date: new Date().toISOString(),
  guardrail_stats: {
    corpus_backed_criteria: 30,
    criteria_with_reference_anchors: 28,
    reference_anchor_rate: 0.93,
    deterministic_rule_count: 55,
    llm_criteria_count: 30
  }
};

const reportData = {
  assessment: mockAssessment,
  packName: 'Skyline Towers Phase 2',
  projectName: 'Skyline Towers Development',
  versionNumber: 1,
  documentCount: 8
};

// Generate report
console.log('Generating enhanced matrix report...\n');
const markdown = generateMatrixReport(reportData);

console.log('========================================');
console.log('ENHANCED REPORT OUTPUT');
console.log('========================================\n');
console.log(markdown);
console.log('\n========================================');
console.log('Report generation complete!');
console.log('========================================');
