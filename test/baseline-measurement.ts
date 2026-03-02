/**
 * BASELINE MEASUREMENT - Phase 0 Main Script
 *
 * Runs all test packs, calculates accuracy, generates baseline report.
 *
 * Usage:
 *   npm run test:baseline
 *
 * Prerequisites:
 *   1. 10 test packs placed in test/packs/ directories
 *   2. Each pack has ground-truth.json with expected results
 *   3. Documents uploaded and processed in the system
 */

import fs from 'fs/promises';
import path from 'path';
import runTestPack, { TestPack, GroundTruth, PackTestReport } from './test-runner';
import calculateAccuracy, { BaselineAccuracyReport } from './accuracy-calculator';

const PACKS_DIR = path.join(__dirname, 'packs');
const REPORTS_DIR = path.join(__dirname, 'reports');

/**
 * Discover all test packs
 */
async function discoverTestPacks(): Promise<Array<{ pack: TestPack; groundTruth: GroundTruth }>> {
  const qualities: Array<'good' | 'borderline' | 'poor'> = ['good', 'borderline', 'poor'];
  const testPacks: Array<{ pack: TestPack; groundTruth: GroundTruth }> = [];

  for (const quality of qualities) {
    const qualityDir = path.join(PACKS_DIR, quality);

    try {
      const packDirs = await fs.readdir(qualityDir);

      for (const packDir of packDirs) {
        if (!packDir.startsWith('pack-')) continue;

        const packPath = path.join(qualityDir, packDir);
        const groundTruthPath = path.join(packPath, 'ground-truth.json');
        const documentsPath = path.join(packPath, 'documents');

        // Check if ground truth exists
        try {
          await fs.access(groundTruthPath);
        } catch {
          console.warn(`⚠️  Skipping ${packDir}: No ground-truth.json found`);
          continue;
        }

        // Load ground truth
        const groundTruthData = await fs.readFile(groundTruthPath, 'utf-8');
        const groundTruth: GroundTruth = JSON.parse(groundTruthData);

        // Create test pack object
        const testPack: TestPack = {
          pack_id: groundTruth.pack_id,
          pack_name: groundTruth.pack_name,
          quality,
          gateway_2_outcome: groundTruth.gateway_2_outcome as any,
          documents_path: documentsPath
        };

        testPacks.push({ pack: testPack, groundTruth });
      }
    } catch (error) {
      // Quality directory doesn't exist yet
      console.warn(`⚠️  ${quality} directory not found - no packs of this quality`);
    }
  }

  return testPacks;
}

/**
 * Run baseline measurement on all test packs
 */
async function runBaselineMeasurement(): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 PHASE 0: BASELINE ACCURACY MEASUREMENT`);
  console.log(`${'='.repeat(80)}\n`);

  // Discover test packs
  console.log(`📦 Discovering test packs...`);
  const testPacks = await discoverTestPacks();

  if (testPacks.length === 0) {
    console.error(`\n❌ No test packs found!`);
    console.error(`\nTo run baseline measurement:`);
    console.error(`1. Place 10 BSR packs in test/packs/ directories`);
    console.error(`2. Create ground-truth.json for each pack`);
    console.error(`3. Run: npm run test:baseline\n`);
    console.error(`See test/README.md for detailed instructions.\n`);
    process.exit(1);
  }

  console.log(`✓ Found ${testPacks.length} test packs\n`);

  if (testPacks.length < 10) {
    console.warn(`⚠️  Warning: Only ${testPacks.length} packs found. Phase 0 requires 10 for completion.\n`);
  }

  // Run tests on each pack
  const packReports: PackTestReport[] = [];

  for (const { pack, groundTruth } of testPacks) {
    try {
      const report = await runTestPack(pack, groundTruth);
      packReports.push(report);
    } catch (error) {
      console.error(`❌ Error testing ${pack.pack_id}:`, error);
    }
  }

  // Calculate overall accuracy
  const baselineReport = calculateAccuracy(packReports);

  // Save report
  await saveReport(baselineReport);

  // Final verdict
  printFinalVerdict(baselineReport);
}

/**
 * Save baseline report to reports/ directory
 */
async function saveReport(report: BaselineAccuracyReport): Promise<void> {
  // Ensure reports directory exists
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }

  const date = new Date().toISOString().split('T')[0];
  const filename = `baseline-${date}.json`;
  const filepath = path.join(REPORTS_DIR, filename);

  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n💾 Report saved: ${filepath}\n`);
}

/**
 * Print final verdict on Phase 0 completion
 */
function printFinalVerdict(report: BaselineAccuracyReport): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 PHASE 0 VERDICT`);
  console.log(`${'='.repeat(80)}\n`);

  if (!report.phase_0_complete) {
    console.log(`❌ Phase 0 INCOMPLETE`);
    console.log(`   Need ${10 - report.total_packs} more test packs (current: ${report.total_packs}/10)\n`);
    console.log(`Next steps:`);
    console.log(`1. Collect ${10 - report.total_packs} more BSR packs`);
    console.log(`2. Label with ground truth (see test/README.md)`);
    console.log(`3. Re-run: npm run test:baseline\n`);
    return;
  }

  console.log(`✅ Phase 0 COMPLETE!\n`);
  console.log(`📊 Baseline Results:`);
  console.log(`   Overall Accuracy: ${report.overall.overall_accuracy.toFixed(1)}%`);
  console.log(`   False Positive Rate: ${report.errors.false_positive_rate.toFixed(1)}%`);
  console.log(`   Critical Misses: ${report.errors.critical_misses}\n`);

  if (report.ready_for_phase_1) {
    console.log(`✅ READY FOR PHASE 1\n`);
    console.log(`Accuracy is below 90% - Phase 1 improvements will have significant impact.\n`);
    console.log(`Recommended next steps:`);
    console.log(`1. Review worst performing rules (see report)`);
    console.log(`2. Start Phase 1 critical fixes`);
    console.log(`3. Lock this baseline - no changes until Phase 1 complete`);
    console.log(`4. After Phase 1: re-run to measure improvement\n`);
  } else {
    console.log(`⚠️  Accuracy is already ${report.overall.overall_accuracy.toFixed(1)}%`);
    console.log(`   System may not need extensive Phase 1 improvements.\n`);
    console.log(`Recommended:`);
    console.log(`1. Review false positives - still ${report.errors.false_positives} dangerous misses`);
    console.log(`2. Focus Phase 1 on reducing critical misses only`);
    console.log(`3. May skip to Phase 2 (coverage expansion) instead\n`);
  }

  console.log(`${'='.repeat(80)}\n`);
}

// Run if called directly
if (require.main === module) {
  runBaselineMeasurement().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default runBaselineMeasurement;
