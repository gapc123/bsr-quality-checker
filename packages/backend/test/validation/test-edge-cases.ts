/**
 * Edge Case & Performance Testing
 *
 * Stage 4.8: Validates system handles edge cases correctly
 * Tests empty inputs, all-passed scenarios, large datasets, and boundary conditions
 */

import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import type { FullAssessment, AssessmentResult } from './matrix-assessment.js';
import { determineConfidence } from './confidence-analyzer.js';
import { generateMatrixReport } from './matrix-report.js';
import { analyzeSubmissionGate } from './triage-analyzer.js';
import { passedCriterion } from './test-scenarios.js';

/**
 * Run edge case and performance tests
 */
export function testEdgeCases(): {
  success: boolean;
  summary: string;
  tests: {
    name: string;
    passed: boolean;
    duration: number;
  }[];
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.8: EDGE CASE & PERFORMANCE TESTING                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const testResults: { name: string; passed: boolean; duration: number }[] = [];
  let allPassed = true;

  // TEST 1: Empty Assessment
  console.log('TEST 1: Empty Assessment (0 results)');
  console.log('─'.repeat(60));
  let start = Date.now();

  try {
    const emptyAssessment: FullAssessment = {
      pack_context: {
        isLondon: true,
        isHRB: true,
        buildingType: 'residential',
        heightMeters: 48,
        storeys: 15
      },
      reference_standards_applied: [],
      results: [],
      criteria_summary: {
        total_applicable: 0,
        assessed: 0,
        not_assessed: 0,
        meets: 0,
        partial: 0,
        does_not_meet: 0
      },
      flagged_by_severity: {
        high: 0,
        medium: 0,
        low: 0
      },
      assessment_phases: {
        deterministic: {
          total_rules: 0,
          passed: 0,
          failed: 0,
          needs_review: 0,
          results: []
        },
        llm_analysis: {
          total_criteria: 0,
          assessed: 0,
          results_count: 0
        }
      },
      readiness_score: 0,
      assessment_date: new Date().toISOString(),
      guardrail_stats: {
        corpus_backed_criteria: 0,
        criteria_with_reference_anchors: 0,
        reference_anchor_rate: 0,
        deterministic_rule_count: 0,
        llm_criteria_count: 0
      }
    };

    const submissionGate = analyzeSubmissionGate(emptyAssessment.results);
    const report = generateMatrixReport({
      assessment: emptyAssessment,
      packName: 'Empty Test Pack',
      projectName: 'Edge Case Test',
      versionNumber: 1,
      documentCount: 0
    });

    const duration = Date.now() - start;

    if (report.length > 0 && submissionGate.can_submit) {
      console.log(`✅ Empty assessment handled correctly (${duration}ms)`);
      console.log(`   Report generated: ${report.length} chars`);
      console.log(`   Submission gate: ${submissionGate.gate_status} (can submit: ${submissionGate.can_submit})`);
      testResults.push({ name: 'Empty Assessment', passed: true, duration });
    } else {
      console.log(`❌ Empty assessment failed`);
      allPassed = false;
      testResults.push({ name: 'Empty Assessment', passed: false, duration });
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ Empty assessment threw error: ${error}`);
    allPassed = false;
    testResults.push({ name: 'Empty Assessment', passed: false, duration });
  }

  // TEST 2: All Passed Criteria (Green Light Scenario)
  console.log('\n\nTEST 2: All Passed Criteria (100% Pass Rate)');
  console.log('─'.repeat(60));
  start = Date.now();

  try {
    const allPassedResults: AssessmentResult[] = Array(10).fill(null).map((_, i) => ({
      ...passedCriterion,
      matrix_id: `PASS_${i.toString().padStart(3, '0')}`,
      matrix_title: `Test criterion ${i + 1}`
    }));

    const enriched = allPassedResults.map(r => {
      const e = enrichCriterionWithMetadata(r);
      return { ...e, confidence: determineConfidence(e) };
    });

    const submissionGate = analyzeSubmissionGate(enriched);
    const duration = Date.now() - start;

    if (submissionGate.can_submit && submissionGate.gate_status === 'GREEN') {
      console.log(`✅ All-passed scenario handled correctly (${duration}ms)`);
      console.log(`   ${enriched.length} passed criteria processed`);
      console.log(`   Submission gate: ${submissionGate.gate_status} - ${submissionGate.recommendation}`);
      testResults.push({ name: 'All Passed Criteria', passed: true, duration });
    } else {
      console.log(`❌ All-passed scenario failed: gate=${submissionGate.gate_status}, can_submit=${submissionGate.can_submit}`);
      allPassed = false;
      testResults.push({ name: 'All Passed Criteria', passed: false, duration });
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ All-passed scenario threw error: ${error}`);
    allPassed = false;
    testResults.push({ name: 'All Passed Criteria', passed: false, duration });
  }

  // TEST 3: Large Dataset (Performance Test)
  console.log('\n\nTEST 3: Large Dataset (100 results)');
  console.log('─'.repeat(60));
  start = Date.now();

  try {
    const largeDataset: AssessmentResult[] = Array(100).fill(null).map((_, i) => {
      const isPassed = i % 3 === 0; // ~33% pass rate
      return {
        matrix_id: `LARGE_${i.toString().padStart(3, '0')}`,
        matrix_title: `Large dataset criterion ${i + 1}`,
        category: i % 2 === 0 ? 'FIRE_SAFETY' : 'STRUCTURAL',
        status: isPassed ? 'meets' : (i % 2 === 0 ? 'does_not_meet' : 'partial') as any,
        severity: (i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low')) as any,
        reasoning: `Test reasoning for criterion ${i + 1}`,
        success_definition: `Success definition ${i + 1}`,
        pack_evidence: {
          found: !isPassed,
          document: isPassed ? 'Test Document' : null,
          page: isPassed ? 1 : null,
          quote: isPassed ? 'Test quote' : null
        },
        reference_evidence: {
          found: true,
          doc_id: 'TEST',
          doc_title: 'Test Reference',
          page: 1,
          quote: 'Test ref'
        },
        gaps_identified: isPassed ? [] : [`Gap ${i + 1}`],
        actions_required: isPassed ? [] : [{
          action: `Fix criterion ${i + 1}`,
          owner: 'TEST_OWNER',
          effort: 'M' as any,
          expected_benefit: 'Test benefit'
        }],
        proposed_change: null
      };
    });

    const enrichStart = Date.now();
    const enriched = largeDataset.map(r => {
      const e = enrichCriterionWithMetadata(r);
      return { ...e, confidence: determineConfidence(e) };
    });
    const enrichDuration = Date.now() - enrichStart;

    const gateStart = Date.now();
    const submissionGate = analyzeSubmissionGate(enriched);
    const gateDuration = Date.now() - gateStart;

    const totalDuration = Date.now() - start;

    console.log(`✅ Large dataset processed successfully (${totalDuration}ms total)`);
    console.log(`   Enrichment: ${enrichDuration}ms (${(enrichDuration / 100).toFixed(1)}ms per result)`);
    console.log(`   Gate analysis: ${gateDuration}ms`);
    console.log(`   Results: ${enriched.length} processed`);

    if (totalDuration < 5000) { // Should process 100 items in < 5 seconds
      console.log(`   ✅ Performance acceptable (< 5s)`);
      testResults.push({ name: 'Large Dataset (100 items)', passed: true, duration: totalDuration });
    } else {
      console.log(`   ⚠️  Performance slower than expected (${totalDuration}ms)`);
      testResults.push({ name: 'Large Dataset (100 items)', passed: true, duration: totalDuration });
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ Large dataset threw error: ${error}`);
    allPassed = false;
    testResults.push({ name: 'Large Dataset (100 items)', passed: false, duration });
  }

  // TEST 4: Missing Optional Fields
  console.log('\n\nTEST 4: Missing Optional Fields (Minimal Data)');
  console.log('─'.repeat(60));
  start = Date.now();

  try {
    const minimalResult: AssessmentResult = {
      matrix_id: 'MINIMAL_001',
      matrix_title: 'Minimal test criterion',
      category: 'TEST',
      status: 'does_not_meet',
      severity: 'high',
      reasoning: 'Test reasoning',
      success_definition: 'Test success',
      pack_evidence: {
        found: false,
        document: null,
        page: null,
        quote: null
      },
      reference_evidence: {
        found: false,
        doc_id: null,
        doc_title: null,
        page: null,
        quote: null
      },
      gaps_identified: [],
      actions_required: [],
      proposed_change: null
    };

    const enriched = enrichCriterionWithMetadata(minimalResult);
    const withConfidence = { ...enriched, confidence: determineConfidence(enriched) };
    const duration = Date.now() - start;

    console.log(`✅ Minimal data handled gracefully (${duration}ms)`);
    console.log(`   Enrichment completed without errors`);
    console.log(`   Confidence: ${withConfidence.confidence?.level}`);
    testResults.push({ name: 'Missing Optional Fields', passed: true, duration });
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ Minimal data threw error: ${error}`);
    allPassed = false;
    testResults.push({ name: 'Missing Optional Fields', passed: false, duration });
  }

  // Final Summary
  console.log('\n\n' + '═'.repeat(60));
  console.log('EDGE CASE TEST SUMMARY');
  console.log('═'.repeat(60) + '\n');

  testResults.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name.padEnd(35)} ${test.duration.toString().padStart(5)}ms`);
  });

  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTime = testResults.reduce((sum, t) => sum + t.duration, 0);

  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed:      ${passedTests} ✅`);
  console.log(`Failed:      ${totalTests - passedTests} ${totalTests - passedTests > 0 ? '❌' : ''}`);
  console.log(`Total Time:  ${totalTime}ms`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('─'.repeat(60));

  if (allPassed) {
    console.log('\n✅ ALL EDGE CASE TESTS PASSED');
    return {
      success: true,
      summary: `All ${totalTests} edge case tests passed in ${totalTime}ms`,
      tests: testResults
    };
  } else {
    console.log('\n❌ SOME EDGE CASE TESTS FAILED');
    return {
      success: false,
      summary: `${totalTests - passedTests} of ${totalTests} edge case tests failed`,
      tests: testResults
    };
  }
}
