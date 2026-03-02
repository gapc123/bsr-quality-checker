/**
 * TEST RUNNER - Phase 0 Baseline Measurement
 *
 * Executes all 55 deterministic rules on a test pack and returns results.
 * This is used to measure baseline accuracy before Phase 1 improvements.
 */

import { runDeterministicChecks, DeterministicAssessment } from '../packages/backend/src/services/deterministic-rules';
import { generateMockDocuments } from './mock-document-generator';

export interface TestPack {
  pack_id: string;
  pack_name: string;
  quality: 'good' | 'borderline' | 'poor';
  gateway_2_outcome?: 'passed' | 'passed_with_conditions' | 'failed' | 'not_submitted';
  documents_path: string;
}

export interface RuleExpectation {
  expected_status: 'pass' | 'fail' | 'not_applicable';
  confidence: 'definitive' | 'high' | 'needs_review';
  reasoning: string;
  critical?: boolean;
  document_reference?: string;
}

export interface GroundTruth {
  pack_id: string;
  pack_name: string;
  quality: 'good' | 'borderline' | 'poor';
  gateway_2_outcome?: string;
  notes?: string;
  rule_expectations: Record<string, RuleExpectation>;
}

export interface TestResult {
  rule_id: string;
  expected_status: 'pass' | 'fail' | 'not_applicable';
  actual_status: 'pass' | 'fail' | 'not_applicable';
  match: boolean;
  expected_confidence: string;
  actual_confidence: string;
  critical: boolean;
  failure_type?: 'false_positive' | 'false_negative' | null;
  expected_reasoning: string;
  actual_reasoning: string;
}

export interface PackTestReport {
  pack_id: string;
  pack_name: string;
  quality: 'good' | 'borderline' | 'poor';
  total_rules: number;
  correct_predictions: number;
  incorrect_predictions: number;
  accuracy: number;
  false_positives: number;  // System says PASS, should be FAIL (DANGEROUS)
  false_negatives: number;  // System says FAIL, should be PASS (wastes time)
  critical_misses: number;   // False positives on critical safety rules
  results: TestResult[];
}

/**
 * Run all 55 deterministic rules on a test pack
 */
export async function runTestPack(
  testPack: TestPack,
  groundTruth: GroundTruth
): Promise<PackTestReport> {
  console.log(`\n🧪 Testing pack: ${testPack.pack_name} (${testPack.pack_id})`);
  console.log(`   Quality: ${testPack.quality}`);
  console.log(`   Running 55 deterministic rules...`);

  // Generate mock documents from pack characteristics
  const mockDocuments = generateMockDocuments(testPack.documents_path);
  console.log(`   Generated ${mockDocuments.length} mock documents`);

  // Run actual deterministic rules on mock documents
  const ruleResults: DeterministicAssessment[] = runDeterministicChecks(mockDocuments);
  console.log(`   Executed ${ruleResults.length} rules`);

  // Create lookup map for actual results
  const actualResultsMap = new Map<string, DeterministicAssessment>();
  for (const result of ruleResults) {
    actualResultsMap.set(result.matrixId, result);
  }

  const results: TestResult[] = [];
  let correctPredictions = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let criticalMisses = 0;

  // Compare each rule's expected vs actual result
  for (const [ruleId, expectation] of Object.entries(groundTruth.rule_expectations)) {
    const actualAssessment = actualResultsMap.get(ruleId);

    if (!actualAssessment) {
      console.warn(`   ⚠️  Warning: Rule ${ruleId} not found in actual results`);
      continue;
    }

    // Map rule result to our test format
    const actualStatus: 'pass' | 'fail' | 'not_applicable' = actualAssessment.result.passed ? 'pass' : 'fail';
    const actualResult = {
      status: actualStatus,
      confidence: actualAssessment.result.confidence,
      reasoning: actualAssessment.result.reasoning
    };

    const match = expectation.expected_status === actualResult.status;
    if (match) correctPredictions++;

    // Determine failure type
    let failureType: 'false_positive' | 'false_negative' | null = null;
    if (!match) {
      if (expectation.expected_status === 'fail' && actualResult.status === 'pass') {
        failureType = 'false_positive';  // DANGEROUS - missed a real issue
        falsePositives++;
        if (expectation.critical) {
          criticalMisses++;
        }
      } else if (expectation.expected_status === 'pass' && actualResult.status === 'fail') {
        failureType = 'false_negative';  // Wastes time on non-issue
        falseNegatives++;
      }
    }

    results.push({
      rule_id: ruleId,
      expected_status: expectation.expected_status,
      actual_status: actualResult.status,
      match,
      expected_confidence: expectation.confidence,
      actual_confidence: actualResult.confidence,
      critical: expectation.critical || false,
      failure_type: failureType,
      expected_reasoning: expectation.reasoning,
      actual_reasoning: actualResult.reasoning
    });
  }

  const totalRules = results.length;
  const accuracy = (correctPredictions / totalRules) * 100;

  const report: PackTestReport = {
    pack_id: testPack.pack_id,
    pack_name: testPack.pack_name,
    quality: testPack.quality,
    total_rules: totalRules,
    correct_predictions: correctPredictions,
    incorrect_predictions: totalRules - correctPredictions,
    accuracy,
    false_positives: falsePositives,
    false_negatives: falseNegatives,
    critical_misses: criticalMisses,
    results
  };

  console.log(`   ✓ Complete - Accuracy: ${accuracy.toFixed(1)}%`);
  console.log(`   False Positives: ${falsePositives} (Critical misses: ${criticalMisses})`);
  console.log(`   False Negatives: ${falseNegatives}`);

  return report;
}

/**
 * INTEGRATION NOTES:
 *
 * To make this work with real data, you need to:
 *
 * 1. Upload test pack documents to the system
 *    - Use the existing upload endpoint
 *    - Create a pack in the database
 *    - Process documents through ingestion pipeline
 *
 * 2. Call runDeterministicChecks() with the pack
 *    - This returns the actual rule results
 *    - Extract status, confidence, reasoning for each rule
 *
 * 3. Compare actual vs expected
 *    - Match rule IDs between ground truth and actual results
 *    - Calculate metrics
 *
 * 4. Generate report
 *    - Save to reports/ directory
 *    - Use for baseline measurement
 */

export default runTestPack;
