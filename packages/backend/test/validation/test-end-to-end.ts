/**
 * End-to-End Integration Test
 *
 * Stage 4.7: Full pipeline test from assessment through enrichment to report
 * Validates that all components work together correctly
 */

import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import type { FullAssessment } from './matrix-assessment.js';
import { determineConfidence } from './confidence-analyzer.js';
import { generateMatrixReport } from './matrix-report.js';
import { generateEngagementBriefs } from './engagement-brief-generator.js';
import { analyzeSubmissionGate, analyzeCriticalPath } from './triage-analyzer.js';
import {
  criticalFireStrategy,
  structuralCalcsPartial,
  crossDocInconsistency,
  aiAmendableQuickWin,
  mepSpecsIncomplete,
  passedCriterion,
  blockedByFireStrategy,
  comprehensiveTestAssessment
} from './test-scenarios.js';

/**
 * Run end-to-end integration test
 */
export function testEndToEnd(): {
  success: boolean;
  summary: string;
  details: {
    enrichedResults: number;
    reportGenerated: boolean;
    reportLength: number;
    briefsGenerated: number;
    submissionGateStatus: string;
    criticalPathDays: number;
  };
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.7: END-TO-END INTEGRATION TEST                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let allChecksPassed = true;
  const issues: string[] = [];

  // PHASE 1: Enrichment Pipeline
  console.log('PHASE 1: ENRICHMENT PIPELINE');
  console.log('─'.repeat(60));

  const testResults = [
    criticalFireStrategy,
    structuralCalcsPartial,
    crossDocInconsistency,
    aiAmendableQuickWin,
    mepSpecsIncomplete,
    passedCriterion,
    blockedByFireStrategy
  ];

  console.log(`Starting with ${testResults.length} assessment results...`);

  // Step 1: Enrich with metadata (Stage 2 + Stage 3)
  const enrichedResults = testResults.map(result => enrichCriterionWithMetadata(result));
  console.log(`✅ Step 1: Enriched ${enrichedResults.length} results with impact + triage data`);

  // Step 2: Add confidence tags (Stage 1)
  const fullyEnrichedResults = enrichedResults.map(result => ({
    ...result,
    confidence: determineConfidence(result)
  }));
  console.log(`✅ Step 2: Added confidence tags to ${fullyEnrichedResults.length} results`);

  // Validate enrichment
  const hasConfidence = fullyEnrichedResults.every(r => r.confidence);
  const failedHaveTriage = fullyEnrichedResults
    .filter(r => r.status !== 'meets')
    .every(r => r.triage);
  const failedHaveImpacts = fullyEnrichedResults
    .filter(r => r.status !== 'meets')
    .every(r => r.effort_assessment && r.cost_impact_assessment && r.rejection_assessment);

  if (!hasConfidence) {
    console.log('❌ Some results missing confidence tags');
    allChecksPassed = false;
    issues.push('Enrichment incomplete: missing confidence');
  } else {
    console.log('✅ All results have confidence tags');
  }

  if (!failedHaveTriage) {
    console.log('❌ Some failed results missing triage data');
    allChecksPassed = false;
    issues.push('Enrichment incomplete: missing triage');
  } else {
    console.log('✅ All failed results have triage data');
  }

  if (!failedHaveImpacts) {
    console.log('❌ Some failed results missing impact assessments');
    allChecksPassed = false;
    issues.push('Enrichment incomplete: missing impacts');
  } else {
    console.log('✅ All failed results have impact assessments');
  }

  // PHASE 2: Analysis Functions
  console.log('\n\nPHASE 2: ANALYSIS FUNCTIONS');
  console.log('─'.repeat(60));

  // Step 3: Submission gate analysis
  const submissionGate = analyzeSubmissionGate(fullyEnrichedResults);
  console.log(`✅ Step 3: Submission gate analyzed - Status: ${submissionGate.gate_status}`);
  console.log(`   ${submissionGate.recommendation}`);

  // Validate submission gate
  if (submissionGate.blockers_count > 0 && submissionGate.can_submit) {
    console.log('❌ Submission gate logic error: has blockers but can_submit=true');
    allChecksPassed = false;
    issues.push('Submission gate: blockers present but can_submit=true');
  } else {
    console.log('✅ Submission gate logic correct');
  }

  // Step 4: Critical path analysis
  const criticalPath = analyzeCriticalPath(fullyEnrichedResults);
  console.log(`✅ Step 4: Critical path analyzed - ${criticalPath.total_days} days, ${criticalPath.sequence.length} tasks`);

  if (criticalPath.parallel_opportunities && criticalPath.parallel_opportunities.length > 0) {
    console.log(`   Found ${criticalPath.parallel_opportunities.length} parallel opportunities`);
  }

  // Step 5: Engagement briefs
  const briefs = generateEngagementBriefs(fullyEnrichedResults);
  console.log(`✅ Step 5: Generated ${briefs.length} engagement briefs`);

  // PHASE 3: Report Generation
  console.log('\n\nPHASE 3: REPORT GENERATION');
  console.log('─'.repeat(60));

  // Create full assessment structure
  const fullAssessment: FullAssessment = {
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
    results: fullyEnrichedResults,
    criteria_summary: {
      total_applicable: testResults.length,
      assessed: testResults.length,
      not_assessed: 0,
      meets: testResults.filter(r => r.status === 'meets').length,
      partial: testResults.filter(r => r.status === 'partial').length,
      does_not_meet: testResults.filter(r => r.status === 'does_not_meet').length
    },
    flagged_by_severity: {
      high: fullyEnrichedResults.filter(r => r.status !== 'meets' && r.severity === 'high').length,
      medium: fullyEnrichedResults.filter(r => r.status !== 'meets' && r.severity === 'medium').length,
      low: fullyEnrichedResults.filter(r => r.status !== 'meets' && r.severity === 'low').length
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
        assessed: testResults.length,
        results_count: testResults.length
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

  // Step 6: Generate report
  console.log('Generating comprehensive report...');
  const report = generateMatrixReport({
    assessment: fullAssessment,
    packName: 'Test Assessment Pack',
    projectName: 'End-to-End Integration Test',
    versionNumber: 1,
    documentCount: 8
  });

  console.log(`✅ Step 6: Generated report (${report.length} characters)`);

  // Validate report content
  const reportLower = report.toLowerCase();
  const hasExecutiveSummary = reportLower.includes('executive summary');
  const hasSubmissionGate = reportLower.includes('submission decision gate') || reportLower.includes('gate_status');
  const hasConfidenceBreakdown = reportLower.includes('confidence') && reportLower.includes('high confidence');
  const hasIssueDetails = reportLower.includes('does not meet') || reportLower.includes('partial');

  if (!hasExecutiveSummary) {
    console.log('❌ Report missing executive summary');
    allChecksPassed = false;
    issues.push('Report missing executive summary');
  } else {
    console.log('✅ Report includes executive summary');
  }

  if (!hasSubmissionGate) {
    console.log('⚠️  Report may be missing submission gate section');
  } else {
    console.log('✅ Report includes submission decision gate');
  }

  if (!hasConfidenceBreakdown) {
    console.log('❌ Report missing confidence breakdown');
    allChecksPassed = false;
    issues.push('Report missing confidence breakdown');
  } else {
    console.log('✅ Report includes confidence breakdown');
  }

  if (!hasIssueDetails) {
    console.log('❌ Report missing issue details');
    allChecksPassed = false;
    issues.push('Report missing issue details');
  } else {
    console.log('✅ Report includes detailed issue information');
  }

  // Final Summary
  console.log('\n\n' + '─'.repeat(60));
  console.log('INTEGRATION TEST SUMMARY');
  console.log('─'.repeat(60) + '\n');

  console.log(`Pipeline Steps: 6/6 completed ✅`);
  console.log(`Enriched Results: ${fullyEnrichedResults.length}`);
  console.log(`Submission Gate: ${submissionGate.gate_status} (${submissionGate.blockers_count} blockers)`);
  console.log(`Critical Path: ${criticalPath.total_days} days`);
  console.log(`Engagement Briefs: ${briefs.length} generated`);
  console.log(`Report Length: ${report.length} characters`);

  console.log('\n' + '─'.repeat(60));

  if (allChecksPassed) {
    console.log('✅ END-TO-END INTEGRATION TEST PASSED');
    console.log('─'.repeat(60) + '\n');
    return {
      success: true,
      summary: 'Full pipeline functioning correctly: Assessment → Enrichment → Analysis → Report',
      details: {
        enrichedResults: fullyEnrichedResults.length,
        reportGenerated: true,
        reportLength: report.length,
        briefsGenerated: briefs.length,
        submissionGateStatus: submissionGate.gate_status,
        criticalPathDays: criticalPath.total_days
      }
    };
  } else {
    console.log('❌ END-TO-END INTEGRATION TEST FAILED');
    console.log('─'.repeat(60));
    console.log('\nIssues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log();
    return {
      success: false,
      summary: `Integration test failed: ${issues.length} issues found`,
      details: {
        enrichedResults: fullyEnrichedResults.length,
        reportGenerated: report.length > 0,
        reportLength: report.length,
        briefsGenerated: briefs.length,
        submissionGateStatus: submissionGate.gate_status,
        criticalPathDays: criticalPath.total_days
      }
    };
  }
}
