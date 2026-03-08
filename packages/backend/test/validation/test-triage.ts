/**
 * Test Triage Prioritization Logic
 *
 * Stage 4.4: Validates that Stage 3 triage correctly prioritizes actions
 * Tests urgency, action types, engagement types, and quick win identification
 */

import type { AssessmentResult } from './matrix-assessment.js';
import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import { analyzeTriageForIssue } from './triage-analyzer.js';
import {
  criticalFireStrategy,
  structuralCalcsPartial,
  crossDocInconsistency,
  aiAmendableQuickWin,
  mepSpecsIncomplete,
  blockedByFireStrategy
} from './test-scenarios.js';

interface TriageTestCase {
  name: string;
  input: AssessmentResult;
  expectedUrgency: string;
  expectedActionType: string;
  expectedEngagementType: string;
  expectedBlocksSubmission: boolean;
  expectedQuickWin: boolean;
}

const triageTestCases: TriageTestCase[] = [
  {
    name: 'Critical Fire Strategy',
    input: criticalFireStrategy,
    expectedUrgency: 'CRITICAL_BLOCKER',
    expectedActionType: 'DOCUMENT_MISSING',
    expectedEngagementType: 'SPECIALIST_REQUIRED',
    expectedBlocksSubmission: true,
    expectedQuickWin: false
  },
  {
    name: 'Structural Calcs Partial',
    input: structuralCalcsPartial,
    expectedUrgency: 'HIGH_PRIORITY',
    expectedActionType: 'DOCUMENT_UPDATE',
    expectedEngagementType: 'SPECIALIST_REQUIRED',
    expectedBlocksSubmission: false,
    expectedQuickWin: false
  },
  {
    name: 'Cross-Doc Inconsistency',
    input: crossDocInconsistency,
    expectedUrgency: 'CRITICAL_BLOCKER',  // high severity + does_not_meet → CRITICAL_BLOCKER
    expectedActionType: 'CROSS_DOC_ALIGNMENT',
    expectedEngagementType: 'SPECIALIST_REQUIRED',
    expectedBlocksSubmission: true,  // CRITICAL_BLOCKER blocks submission
    expectedQuickWin: false
  },
  {
    name: 'AI-Amendable Quick Win',
    input: aiAmendableQuickWin,
    expectedUrgency: 'MEDIUM_PRIORITY',  // low severity + does_not_meet → MEDIUM_PRIORITY
    expectedActionType: 'FORMAT_FIX',
    expectedEngagementType: 'AI_AMENDABLE',
    expectedBlocksSubmission: false,
    expectedQuickWin: true
  },
  {
    name: 'MEP Specs Incomplete',
    input: mepSpecsIncomplete,
    expectedUrgency: 'MEDIUM_PRIORITY',
    expectedActionType: 'DOCUMENT_UPDATE',  // "not fully specified" doesn't match INFORMATION_MISSING keywords
    expectedEngagementType: 'SPECIALIST_REQUIRED',
    expectedBlocksSubmission: false,
    expectedQuickWin: false
  },
  {
    name: 'Blocked By Fire Strategy',
    input: blockedByFireStrategy,
    expectedUrgency: 'HIGH_PRIORITY',  // medium severity + does_not_meet → HIGH_PRIORITY
    expectedActionType: 'CROSS_DOC_ALIGNMENT',  // Contains "inconsistent"
    expectedEngagementType: 'SPECIALIST_REQUIRED',
    expectedBlocksSubmission: false,
    expectedQuickWin: true  // effort='S' → quick_win
  }
];

interface TriageTestResult {
  testName: string;
  passed: boolean;
  urgencyMatch: boolean;
  actionTypeMatch: boolean;
  engagementMatch: boolean;
  blocksMatch: boolean;
  quickWinMatch: boolean;
  actualValues: {
    urgency?: string;
    actionType?: string;
    engagementType?: string;
    blocksSubmission?: boolean;
    quickWin?: boolean;
  };
}

/**
 * Run triage prioritization tests
 */
export function testTriagePrioritization(): {
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: TriageTestResult[];
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.4: TRIAGE PRIORITIZATION VALIDATION                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results: TriageTestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of triageTestCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('─'.repeat(60));

    // Enrich the criterion to add triage
    const enriched = enrichCriterionWithMetadata(testCase.input);

    // Extract actual triage values
    const triage = enriched.triage;
    const actualUrgency = triage?.urgency;
    const actualActionType = triage?.action_type;
    const actualEngagementType = triage?.engagement_type;
    const actualBlocksSubmission = triage?.blocks_submission;
    const actualQuickWin = triage?.quick_win;

    // Check matches
    const urgencyMatch = actualUrgency === testCase.expectedUrgency;
    const actionTypeMatch = actualActionType === testCase.expectedActionType;
    const engagementMatch = actualEngagementType === testCase.expectedEngagementType;
    const blocksMatch = actualBlocksSubmission === testCase.expectedBlocksSubmission;
    const quickWinMatch = actualQuickWin === testCase.expectedQuickWin;

    console.log(`Urgency:      ${testCase.expectedUrgency.padEnd(20)} → ${(actualUrgency || 'UNDEFINED').padEnd(20)} ${urgencyMatch ? '✅' : '❌'}`);
    console.log(`Action Type:  ${testCase.expectedActionType.padEnd(20)} → ${(actualActionType || 'UNDEFINED').padEnd(20)} ${actionTypeMatch ? '✅' : '❌'}`);
    console.log(`Engagement:   ${testCase.expectedEngagementType.padEnd(20)} → ${(actualEngagementType || 'UNDEFINED').padEnd(20)} ${engagementMatch ? '✅' : '❌'}`);
    console.log(`Blocks Sub:   ${String(testCase.expectedBlocksSubmission).padEnd(20)} → ${String(actualBlocksSubmission).padEnd(20)} ${blocksMatch ? '✅' : '❌'}`);
    console.log(`Quick Win:    ${String(testCase.expectedQuickWin).padEnd(20)} → ${String(actualQuickWin).padEnd(20)} ${quickWinMatch ? '✅' : '❌'}`);

    // Overall test result
    const testPassed = urgencyMatch && actionTypeMatch && engagementMatch && blocksMatch && quickWinMatch;

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
      urgencyMatch,
      actionTypeMatch,
      engagementMatch,
      blocksMatch,
      quickWinMatch,
      actualValues: {
        urgency: actualUrgency,
        actionType: actualActionType,
        engagementType: actualEngagementType,
        blocksSubmission: actualBlocksSubmission,
        quickWin: actualQuickWin
      }
    });
  }

  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`Total tests:  ${triageTestCases.length}`);
  console.log(`Passed:       ${passed} ✅`);
  console.log(`Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Success rate: ${((passed / triageTestCases.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n   ${r.testName}:`);
      if (!r.urgencyMatch) {
        console.log(`   - Urgency: expected vs actual ${r.actualValues.urgency}`);
      }
      if (!r.actionTypeMatch) {
        console.log(`   - Action Type: expected vs actual ${r.actualValues.actionType}`);
      }
      if (!r.engagementMatch) {
        console.log(`   - Engagement: expected vs actual ${r.actualValues.engagementType}`);
      }
      if (!r.blocksMatch) {
        console.log(`   - Blocks Submission: expected vs actual ${r.actualValues.blocksSubmission}`);
      }
      if (!r.quickWinMatch) {
        console.log(`   - Quick Win: expected vs actual ${r.actualValues.quickWin}`);
      }
    });
  }

  return {
    summary: {
      total: triageTestCases.length,
      passed,
      failed
    },
    results
  };
}
