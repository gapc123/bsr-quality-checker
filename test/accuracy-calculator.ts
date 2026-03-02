/**
 * ACCURACY CALCULATOR - Phase 0 Baseline Measurement
 *
 * Aggregates test results across all packs and calculates comprehensive metrics.
 */

import { PackTestReport, TestResult } from './test-runner';

export interface PerRuleAccuracy {
  rule_id: string;
  rule_name: string;
  total_tests: number;
  correct: number;
  accuracy: number;
  false_positives: number;
  false_negatives: number;
  critical_misses: number;
}

export interface ConfidenceCalibration {
  confidence_level: 'definitive' | 'high' | 'needs_review';
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
  note: string;
}

export interface BaselineAccuracyReport {
  test_date: string;
  total_packs: number;
  packs_by_quality: {
    good: number;
    borderline: number;
    poor: number;
  };

  // Overall metrics
  overall: {
    total_rule_evaluations: number;
    correct_predictions: number;
    incorrect_predictions: number;
    overall_accuracy: number;
  };

  // Error analysis
  errors: {
    false_positives: number;       // Says PASS, should be FAIL (CRITICAL)
    false_negatives: number;       // Says FAIL, should be PASS
    false_positive_rate: number;   // As percentage
    false_negative_rate: number;   // As percentage
    critical_misses: number;       // False positives on critical safety rules
  };

  // Per-rule breakdown
  per_rule_accuracy: PerRuleAccuracy[];
  worst_performing_rules: PerRuleAccuracy[];  // Bottom 10
  best_performing_rules: PerRuleAccuracy[];   // Top 10

  // Confidence calibration
  confidence_calibration: ConfidenceCalibration[];

  // Quality-based accuracy
  accuracy_by_quality: {
    good: number;
    borderline: number;
    poor: number;
  };

  // Validation
  phase_0_complete: boolean;
  ready_for_phase_1: boolean;
  baseline_locked: boolean;
}

/**
 * Calculate comprehensive accuracy metrics from all pack test reports
 */
export function calculateAccuracy(packReports: PackTestReport[]): BaselineAccuracyReport {
  console.log(`\n📊 Calculating baseline accuracy metrics...`);
  console.log(`   Analyzing ${packReports.length} test packs\n`);

  // Count packs by quality
  const packsByQuality = {
    good: packReports.filter(p => p.quality === 'good').length,
    borderline: packReports.filter(p => p.quality === 'borderline').length,
    poor: packReports.filter(p => p.quality === 'poor').length
  };

  // Overall metrics
  const totalRuleEvaluations = packReports.reduce((sum, p) => sum + p.total_rules, 0);
  const correctPredictions = packReports.reduce((sum, p) => sum + p.correct_predictions, 0);
  const incorrectPredictions = totalRuleEvaluations - correctPredictions;
  const overallAccuracy = (correctPredictions / totalRuleEvaluations) * 100;

  // Error analysis
  const totalFalsePositives = packReports.reduce((sum, p) => sum + p.false_positives, 0);
  const totalFalseNegatives = packReports.reduce((sum, p) => sum + p.false_negatives, 0);
  const criticalMisses = packReports.reduce((sum, p) => sum + p.critical_misses, 0);

  // Calculate false positive rate and false negative rate
  const totalNegatives = packReports.reduce((sum, p) =>
    sum + p.results.filter(r => r.expected_status === 'fail').length, 0
  );
  const totalPositives = packReports.reduce((sum, p) =>
    sum + p.results.filter(r => r.expected_status === 'pass').length, 0
  );

  const falsePositiveRate = totalNegatives > 0 ? (totalFalsePositives / totalNegatives) * 100 : 0;
  const falseNegativeRate = totalPositives > 0 ? (totalFalseNegatives / totalPositives) * 100 : 0;

  // Per-rule accuracy
  const ruleResults = new Map<string, TestResult[]>();
  for (const pack of packReports) {
    for (const result of pack.results) {
      if (!ruleResults.has(result.rule_id)) {
        ruleResults.set(result.rule_id, []);
      }
      ruleResults.get(result.rule_id)!.push(result);
    }
  }

  const perRuleAccuracy: PerRuleAccuracy[] = Array.from(ruleResults.entries()).map(([ruleId, results]) => {
    const correct = results.filter(r => r.match).length;
    const fps = results.filter(r => r.failure_type === 'false_positive').length;
    const fns = results.filter(r => r.failure_type === 'false_negative').length;
    const criticals = results.filter(r => r.failure_type === 'false_positive' && r.critical).length;

    return {
      rule_id: ruleId,
      rule_name: getRuleName(ruleId),  // Would lookup from rules-inventory.json
      total_tests: results.length,
      correct,
      accuracy: (correct / results.length) * 100,
      false_positives: fps,
      false_negatives: fns,
      critical_misses: criticals
    };
  });

  // Sort by accuracy to get best/worst
  const sortedByAccuracy = [...perRuleAccuracy].sort((a, b) => a.accuracy - b.accuracy);
  const worstPerforming = sortedByAccuracy.slice(0, 10);
  const bestPerforming = sortedByAccuracy.slice(-10).reverse();

  // Confidence calibration
  const allResults = packReports.flatMap(p => p.results);
  const confidenceLevels: ('definitive' | 'high' | 'needs_review')[] = ['definitive', 'high', 'needs_review'];

  const confidenceCalibration: ConfidenceCalibration[] = confidenceLevels.map(level => {
    const predictions = allResults.filter(r => r.actual_confidence === level);
    const correct = predictions.filter(r => r.match).length;
    const accuracy = predictions.length > 0 ? (correct / predictions.length) * 100 : 0;

    let note = '';
    if (level === 'definitive' && accuracy < 95) {
      note = '⚠️ "Definitive" confidence should be >95% accurate';
    } else if (level === 'high' && accuracy < 85) {
      note = '⚠️ "High" confidence should be >85% accurate';
    }

    return {
      confidence_level: level,
      total_predictions: predictions.length,
      correct_predictions: correct,
      accuracy,
      note
    };
  });

  // Accuracy by pack quality
  const accuracyByQuality = {
    good: calculateQualityAccuracy(packReports, 'good'),
    borderline: calculateQualityAccuracy(packReports, 'borderline'),
    poor: calculateQualityAccuracy(packReports, 'poor')
  };

  // Validation checks
  const phase0Complete = packReports.length >= 10;
  const readyForPhase1 = phase0Complete && overallAccuracy < 90;  // If >90%, maybe don't need Phase 1
  const baselineLocked = phase0Complete;  // Once measured, lock it

  const report: BaselineAccuracyReport = {
    test_date: new Date().toISOString(),
    total_packs: packReports.length,
    packs_by_quality: packsByQuality,
    overall: {
      total_rule_evaluations: totalRuleEvaluations,
      correct_predictions: correctPredictions,
      incorrect_predictions: incorrectPredictions,
      overall_accuracy: overallAccuracy
    },
    errors: {
      false_positives: totalFalsePositives,
      false_negatives: totalFalseNegatives,
      false_positive_rate: falsePositiveRate,
      false_negative_rate: falseNegativeRate,
      critical_misses: criticalMisses
    },
    per_rule_accuracy: perRuleAccuracy,
    worst_performing_rules: worstPerforming,
    best_performing_rules: bestPerforming,
    confidence_calibration: confidenceCalibration,
    accuracy_by_quality: accuracyByQuality,
    phase_0_complete: phase0Complete,
    ready_for_phase_1: readyForPhase1,
    baseline_locked: baselineLocked
  };

  // Print summary
  printSummary(report);

  return report;
}

function calculateQualityAccuracy(reports: PackTestReport[], quality: 'good' | 'borderline' | 'poor'): number {
  const qualityPacks = reports.filter(p => p.quality === quality);
  if (qualityPacks.length === 0) return 0;

  const totalCorrect = qualityPacks.reduce((sum, p) => sum + p.correct_predictions, 0);
  const totalRules = qualityPacks.reduce((sum, p) => sum + p.total_rules, 0);

  return (totalCorrect / totalRules) * 100;
}

function getRuleName(ruleId: string): string {
  // Would lookup from rules-inventory.json in real implementation
  // For now, return placeholder
  return `Rule ${ruleId}`;
}

function printSummary(report: BaselineAccuracyReport) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 BASELINE ACCURACY REPORT - ${new Date(report.test_date).toLocaleDateString()}`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`📦 Test Packs: ${report.total_packs} total`);
  console.log(`   Good: ${report.packs_by_quality.good}, Borderline: ${report.packs_by_quality.borderline}, Poor: ${report.packs_by_quality.poor}\n`);

  console.log(`🎯 Overall Accuracy: ${report.overall.overall_accuracy.toFixed(1)}%`);
  console.log(`   Correct: ${report.overall.correct_predictions} / ${report.overall.total_rule_evaluations}`);
  console.log(`   Incorrect: ${report.overall.incorrect_predictions}\n`);

  console.log(`⚠️  Error Analysis:`);
  console.log(`   False Positives: ${report.errors.false_positives} (${report.errors.false_positive_rate.toFixed(1)}%)`);
  console.log(`   └─ Critical Misses: ${report.errors.critical_misses} ⚠️ DANGEROUS`);
  console.log(`   False Negatives: ${report.errors.false_negatives} (${report.errors.false_negative_rate.toFixed(1)}%)\n`);

  console.log(`📉 Worst Performing Rules (Bottom 5):`);
  report.worst_performing_rules.slice(0, 5).forEach((rule, i) => {
    console.log(`   ${i + 1}. ${rule.rule_id}: ${rule.accuracy.toFixed(1)}% (${rule.false_positives} FP, ${rule.false_negatives} FN)`);
  });

  console.log(`\n📈 Best Performing Rules (Top 5):`);
  report.best_performing_rules.slice(0, 5).forEach((rule, i) => {
    console.log(`   ${i + 1}. ${rule.rule_id}: ${rule.accuracy.toFixed(1)}%`);
  });

  console.log(`\n🎓 Confidence Calibration:`);
  report.confidence_calibration.forEach(cal => {
    console.log(`   ${cal.confidence_level}: ${cal.accuracy.toFixed(1)}% (${cal.correct_predictions}/${cal.total_predictions})`);
    if (cal.note) console.log(`      ${cal.note}`);
  });

  console.log(`\n📊 Accuracy by Pack Quality:`);
  console.log(`   Good packs: ${report.accuracy_by_quality.good.toFixed(1)}%`);
  console.log(`   Borderline packs: ${report.accuracy_by_quality.borderline.toFixed(1)}%`);
  console.log(`   Poor packs: ${report.accuracy_by_quality.poor.toFixed(1)}%`);

  console.log(`\n✅ Phase 0 Status:`);
  console.log(`   Complete: ${report.phase_0_complete ? '✓' : '✗'} (need 10+ packs)`);
  console.log(`   Ready for Phase 1: ${report.ready_for_phase_1 ? '✓' : '✗'}`);
  console.log(`   Baseline locked: ${report.baseline_locked ? '✓' : '✗'}`);

  console.log(`\n${'='.repeat(80)}\n`);
}

export default calculateAccuracy;
