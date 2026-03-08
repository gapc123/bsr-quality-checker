/**
 * Test Impact Analysis Logic
 *
 * Stage 4.3: Validates that impact assessments are honest and qualitative
 * Ensures Stage 2 outputs avoid fake numerical precision
 */

import type { AssessmentResult } from './matrix-assessment.js';
import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import {
  criticalFireStrategy,
  structuralCalcsPartial,
  crossDocInconsistency,
  aiAmendableQuickWin,
  mepSpecsIncomplete,
  passedCriterion,
  blockedByFireStrategy
} from './test-scenarios.js';

interface ImpactTestCase {
  name: string;
  input: AssessmentResult;
  expectedEffortLevel: string;
  expectedCostImpact: string;
  expectedRejectionLikelihood: string;
}

const impactTestCases: ImpactTestCase[] = [
  {
    name: 'Critical Fire Strategy',
    input: criticalFireStrategy,
    expectedEffortLevel: 'MONTHS',
    expectedCostImpact: 'HIGH',
    expectedRejectionLikelihood: 'ALMOST_CERTAIN'
  },
  {
    name: 'Structural Calcs Partial',
    input: structuralCalcsPartial,
    expectedEffortLevel: 'WEEKS',
    expectedCostImpact: 'MEDIUM',
    expectedRejectionLikelihood: 'LIKELY'  // High severity + partial → LIKELY
  },
  {
    name: 'Cross-Doc Inconsistency',
    input: crossDocInconsistency,
    expectedEffortLevel: 'WEEKS',
    expectedCostImpact: 'LOW',
    expectedRejectionLikelihood: 'VERY_LIKELY'  // High severity + does_not_meet → VERY_LIKELY
  },
  {
    name: 'AI-Amendable Quick Win',
    input: aiAmendableQuickWin,
    expectedEffortLevel: 'QUICK_FIX',
    expectedCostImpact: 'NEGLIGIBLE',
    expectedRejectionLikelihood: 'UNLIKELY'
  },
  {
    name: 'MEP Specs Incomplete',
    input: mepSpecsIncomplete,
    expectedEffortLevel: 'WEEKS',
    expectedCostImpact: 'MEDIUM',
    expectedRejectionLikelihood: 'POSSIBLE'
  }
];

interface ImpactTestResult {
  testName: string;
  passed: boolean;
  effortMatch: boolean;
  costMatch: boolean;
  rejectionMatch: boolean;
  actualEffort: string | undefined;
  actualCost: string | undefined;
  actualRejection: string | undefined;
  issues: string[];
}

/**
 * Validate impact assessments are qualitative, not fake numbers
 */
function validateImpactQuality(result: AssessmentResult): string[] {
  const issues: string[] = [];

  // Stage 2: Should have qualitative assessments
  if (result.effort_assessment) {
    // Should use qualitative levels
    const validLevels = ['QUICK_FIX', 'DAYS', 'WEEKS', 'MONTHS'];
    if (!validLevels.includes(result.effort_assessment.level)) {
      issues.push(`Invalid effort level: ${result.effort_assessment.level}`);
    }

    // Should have description
    if (!result.effort_assessment.description || result.effort_assessment.description.length < 10) {
      issues.push('Effort assessment lacks sufficient description');
    }
  } else if (result.status !== 'meets') {
    issues.push('Missing effort assessment for failed criterion');
  }

  if (result.cost_impact_assessment) {
    // Should use qualitative categories
    const validCategories = ['NEGLIGIBLE', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
    if (!validCategories.includes(result.cost_impact_assessment.impact)) {
      issues.push(`Invalid cost impact: ${result.cost_impact_assessment.impact}`);
    }

    // Should have description
    if (!result.cost_impact_assessment.description || result.cost_impact_assessment.description.length < 10) {
      issues.push('Cost assessment lacks sufficient description');
    }
  } else if (result.status !== 'meets') {
    issues.push('Missing cost impact assessment for failed criterion');
  }

  if (result.rejection_assessment) {
    // Should use qualitative likelihood
    const validLikelihoods = ['UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY', 'ALMOST_CERTAIN'];
    if (!validLikelihoods.includes(result.rejection_assessment.likelihood)) {
      issues.push(`Invalid rejection likelihood: ${result.rejection_assessment.likelihood}`);
    }

    // Should have reasoning
    if (!result.rejection_assessment.reasoning || result.rejection_assessment.reasoning.length < 10) {
      issues.push('Rejection assessment lacks sufficient reasoning');
    }
  } else if (result.status !== 'meets') {
    issues.push('Missing rejection assessment for failed criterion');
  }

  // DEPRECATED fields should exist but are marked as guesses
  if (result.status !== 'meets') {
    // These are old fake numbers - should exist for backward compat but not be trusted
    if (!result.cost_estimate) {
      issues.push('Missing deprecated cost_estimate (backward compat)');
    }
    if (!result.timeline_estimate) {
      issues.push('Missing deprecated timeline_estimate (backward compat)');
    }
    if (!result.rejection_risk) {
      issues.push('Missing deprecated rejection_risk (backward compat)');
    }
  }

  // Passed criteria should have zero/minimal impacts
  if (result.status === 'meets') {
    if (result.effort_assessment) {
      issues.push('Passed criterion should not have effort assessment');
    }
    if (result.cost_impact_assessment) {
      issues.push('Passed criterion should not have cost assessment');
    }
    if (result.rejection_assessment) {
      issues.push('Passed criterion should not have rejection assessment');
    }
  }

  return issues;
}

/**
 * Run impact analysis tests
 */
export function testImpactAnalysis(): {
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: ImpactTestResult[];
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.3: IMPACT ANALYSIS VALIDATION                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results: ImpactTestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of impactTestCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('─'.repeat(60));

    // Enrich the criterion to add impact assessments
    const enriched = enrichCriterionWithMetadata(testCase.input);

    // Extract actual values
    const actualEffort = enriched.effort_assessment?.level;
    const actualCost = enriched.cost_impact_assessment?.impact;
    const actualRejection = enriched.rejection_assessment?.likelihood;

    // Check matches
    const effortMatch = actualEffort === testCase.expectedEffortLevel;
    const costMatch = actualCost === testCase.expectedCostImpact;
    const rejectionMatch = actualRejection === testCase.expectedRejectionLikelihood;

    console.log(`Effort:    ${testCase.expectedEffortLevel} → ${actualEffort || 'UNDEFINED'} ${effortMatch ? '✅' : '❌'}`);
    console.log(`Cost:      ${testCase.expectedCostImpact} → ${actualCost || 'UNDEFINED'} ${costMatch ? '✅' : '❌'}`);
    console.log(`Rejection: ${testCase.expectedRejectionLikelihood} → ${actualRejection || 'UNDEFINED'} ${rejectionMatch ? '✅' : '❌'}`);

    // Validate quality of assessments
    const qualityIssues = validateImpactQuality(enriched);

    if (qualityIssues.length > 0) {
      console.log(`\n⚠️  QUALITY ISSUES:`);
      qualityIssues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    } else {
      console.log(`\n✅ Impact assessment quality validated`);
    }

    // Overall test result
    const testPassed = effortMatch && costMatch && rejectionMatch && qualityIssues.length === 0;

    if (testPassed) {
      console.log(`\n✅ TEST PASSED`);
      passed++;
    } else {
      console.log(`\n❌ TEST FAILED`);
      failed++;
    }

    results.push({
      testName: testCase.name,
      passed: testPassed,
      effortMatch,
      costMatch,
      rejectionMatch,
      actualEffort,
      actualCost,
      actualRejection,
      issues: qualityIssues
    });
  }

  // Test passed criterion separately
  console.log(`\nTesting: Passed Criterion (Should Have No Impacts)`);
  console.log('─'.repeat(60));

  const enrichedPassed = enrichCriterionWithMetadata(passedCriterion);
  const passedIssues = validateImpactQuality(enrichedPassed);

  const passedTestPassed = passedIssues.length === 0;

  if (passedTestPassed) {
    console.log('✅ Passed criterion correctly has no impact assessments');
    console.log(`\n✅ TEST PASSED`);
    passed++;
  } else {
    console.log('❌ Passed criterion incorrectly has impact assessments');
    passedIssues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
    console.log(`\n❌ TEST FAILED`);
    failed++;
  }

  results.push({
    testName: 'Passed Criterion',
    passed: passedTestPassed,
    effortMatch: true,
    costMatch: true,
    rejectionMatch: true,
    actualEffort: undefined,
    actualCost: undefined,
    actualRejection: undefined,
    issues: passedIssues
  });

  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Total tests:  ${impactTestCases.length + 1}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Success rate: ${((passed / (impactTestCases.length + 1)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n   ${r.testName}:`);
      if (!r.effortMatch) {
        console.log(`   - Effort mismatch: expected vs actual ${r.actualEffort}`);
      }
      if (!r.costMatch) {
        console.log(`   - Cost mismatch: expected vs actual ${r.actualCost}`);
      }
      if (!r.rejectionMatch) {
        console.log(`   - Rejection mismatch: expected vs actual ${r.actualRejection}`);
      }
      if (r.issues.length > 0) {
        r.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      }
    });
  }

  return {
    summary: {
      total: impactTestCases.length + 1,
      passed,
      failed
    },
    results
  };
}
