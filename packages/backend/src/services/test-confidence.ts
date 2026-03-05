/**
 * Test Confidence Framework Accuracy
 *
 * Stage 4.2: Validates that confidence levels are correctly determined
 * Ensures no hallucinated data is produced
 */

import type { AssessmentResult } from './matrix-assessment.js';
import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import { determineConfidence } from './confidence-analyzer.js';
import {
  criticalFireStrategy,
  structuralCalcsPartial,
  crossDocInconsistency,
  aiAmendableQuickWin,
  mepSpecsIncomplete,
  passedCriterion,
  blockedByFireStrategy,
  expectedOutcomes
} from './test-scenarios.js';

interface TestCase {
  name: string;
  input: AssessmentResult;
  expectedConfidence: string;
  expectedReasoning: string;
}

const testCases: TestCase[] = [
  {
    name: 'Critical Fire Strategy',
    input: criticalFireStrategy,
    expectedConfidence: 'HIGH',
    expectedReasoning: 'Deterministic - detecting missing document is structural check'
  },
  {
    name: 'Structural Calcs Partial',
    input: structuralCalcsPartial,
    expectedConfidence: 'MEDIUM',
    expectedReasoning: 'AI interpretation of completeness'
  },
  {
    name: 'Cross-Doc Inconsistency',
    input: crossDocInconsistency,
    expectedConfidence: 'REQUIRES_HUMAN_JUDGEMENT',
    expectedReasoning: 'Deciding correct height value requires professional judgement'
  },
  {
    name: 'AI-Amendable Quick Win',
    input: aiAmendableQuickWin,
    expectedConfidence: 'MEDIUM',
    expectedReasoning: 'Version number detection requires AI interpretation'
  },
  {
    name: 'MEP Specs Incomplete',
    input: mepSpecsIncomplete,
    expectedConfidence: 'MEDIUM',
    expectedReasoning: 'AI interpretation of specification completeness'
  },
  {
    name: 'Passed Criterion',
    input: passedCriterion,
    expectedConfidence: 'MEDIUM',
    expectedReasoning: 'AI verification of compliance'
  },
  {
    name: 'Blocked By Fire Strategy',
    input: blockedByFireStrategy,
    expectedConfidence: 'REQUIRES_HUMAN_JUDGEMENT',
    expectedReasoning: 'Strategy alignment requires professional judgement'
  }
];

interface TestResult {
  testName: string;
  passed: boolean;
  confidenceMatch: boolean;
  actualConfidence: string | undefined;
  expectedConfidence: string;
  hasHallucinatedData: boolean;
  hallucinationDetails: string[];
}

/**
 * Check for hallucinated data in enriched result
 */
function detectHallucinations(
  original: AssessmentResult,
  enriched: AssessmentResult
): { found: boolean; details: string[] } {
  const details: string[] = [];

  // Confidence should be added, not hallucinated from thin air
  if (enriched.confidence && !enriched.confidence.level) {
    details.push('Confidence level is undefined');
  }

  // Triage should be based on actual assessment data
  if (enriched.triage) {
    // Check urgency is valid
    const validUrgencies = ['CRITICAL_BLOCKER', 'HIGH_PRIORITY', 'MEDIUM_PRIORITY', 'LOW_PRIORITY'];
    if (!validUrgencies.includes(enriched.triage.urgency)) {
      details.push(`Invalid urgency: ${enriched.triage.urgency}`);
    }

    // Check blocks_submission aligns with urgency
    if (enriched.triage.urgency === 'CRITICAL_BLOCKER' && !enriched.triage.blocks_submission) {
      details.push('CRITICAL_BLOCKER should block submission');
    }

    // Check quick_win logic
    if (enriched.triage.quick_win) {
      // Quick wins should be low severity OR have proposed_change OR have small effort
      const hasSmallEffort = original.actions_required?.some(a => a.effort === 'S');
      const hasProposedChange = original.proposed_change && original.proposed_change.length > 50;
      const isLowSeverity = original.severity === 'low';

      if (!hasSmallEffort && !hasProposedChange && !isLowSeverity) {
        details.push('Quick win flag set without supporting data');
      }
    }
  }

  // Cost estimate should be based on effort and category
  if (enriched.cost_estimate) {
    if (enriched.cost_estimate.min < 0 || enriched.cost_estimate.max < enriched.cost_estimate.min) {
      details.push('Invalid cost estimate range');
    }

    // CRITICAL: Passed criteria should have zero cost
    if (original.status === 'meets' && enriched.cost_estimate.max !== 0) {
      details.push('Passed criterion has non-zero cost estimate');
    }
  }

  // Effort assessment should align with actions_required
  if (enriched.effort_assessment) {
    const actions = original.actions_required || [];
    if (actions.length === 0 && original.status !== 'meets') {
      details.push('Effort assessment provided but no actions required');
    }
  }

  // Rejection risk should be based on severity and status
  if (enriched.rejection_risk) {
    if (enriched.rejection_risk.probability < 0 || enriched.rejection_risk.probability > 1) {
      details.push('Rejection probability out of range [0, 1]');
    }

    // Passed criteria should have zero rejection risk
    if (original.status === 'meets' && enriched.rejection_risk.probability !== 0) {
      details.push('Passed criterion has non-zero rejection risk');
    }

    // Critical blockers should have high rejection probability
    if (enriched.triage?.urgency === 'CRITICAL_BLOCKER' && enriched.rejection_risk.probability < 0.7) {
      details.push('CRITICAL_BLOCKER has low rejection probability');
    }
  }

  return {
    found: details.length > 0,
    details
  };
}

/**
 * Run confidence framework tests
 */
export function testConfidenceFramework(): {
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: TestResult[];
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.2: CONFIDENCE FRAMEWORK VALIDATION                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('─'.repeat(60));

    // Enrich the criterion with metadata and add confidence
    const enriched = enrichCriterionWithMetadata(testCase.input);
    const confidence = determineConfidence(enriched);
    const fullyEnriched = { ...enriched, confidence };

    // Check confidence level
    const actualConfidence = fullyEnriched.confidence?.level;
    const confidenceMatch = actualConfidence === testCase.expectedConfidence;

    console.log(`Expected confidence: ${testCase.expectedConfidence}`);
    console.log(`Actual confidence:   ${actualConfidence || 'UNDEFINED'}`);
    console.log(`Match: ${confidenceMatch ? '✅' : '❌'}`);

    // Check for hallucinations
    const hallucinationCheck = detectHallucinations(testCase.input, fullyEnriched);

    if (hallucinationCheck.found) {
      console.log(`\n⚠️  HALLUCINATION DETECTED:`);
      hallucinationCheck.details.forEach(detail => {
        console.log(`   - ${detail}`);
      });
    } else {
      console.log(`\n✅ No hallucinations detected`);
    }

    // Overall test result
    const testPassed = confidenceMatch && !hallucinationCheck.found;

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
      confidenceMatch,
      actualConfidence,
      expectedConfidence: testCase.expectedConfidence,
      hasHallucinatedData: hallucinationCheck.found,
      hallucinationDetails: hallucinationCheck.details
    });
  }

  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Total tests:  ${testCases.length}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n   ${r.testName}:`);
      if (!r.confidenceMatch) {
        console.log(`   - Confidence mismatch: expected ${r.expectedConfidence}, got ${r.actualConfidence}`);
      }
      if (r.hasHallucinatedData) {
        r.hallucinationDetails.forEach(detail => {
          console.log(`   - ${detail}`);
        });
      }
    });
  }

  return {
    summary: {
      total: testCases.length,
      passed,
      failed
    },
    results
  };
}
