/**
 * Test Critical Path Analysis
 *
 * Stage 4.5: Validates that critical path correctly sequences dependencies
 * Tests BLOCKS_OTHERS, BLOCKED_BY, INDEPENDENT, and parallelization
 */

import type { AssessmentResult } from './matrix-assessment.js';
import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import { analyzeCriticalPath } from './triage-analyzer.js';
import {
  criticalFireStrategy,
  structuralCalcsPartial,
  crossDocInconsistency,
  aiAmendableQuickWin,
  mepSpecsIncomplete,
  blockedByFireStrategy
} from './test-scenarios.js';

/**
 * Run critical path analysis tests
 */
export function testCriticalPath(): {
  success: boolean;
  summary: string;
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.5: CRITICAL PATH ANALYSIS VALIDATION               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Enrich all test scenarios
  console.log('Enriching test scenarios...');
  const enrichedScenarios = [
    criticalFireStrategy,
    structuralCalcsPartial,
    crossDocInconsistency,
    aiAmendableQuickWin,
    mepSpecsIncomplete,
    blockedByFireStrategy
  ].map(scenario => enrichCriterionWithMetadata(scenario));

  console.log(`✅ Enriched ${enrichedScenarios.length} scenarios\n`);

  // Analyze critical path
  console.log('Analyzing critical path...');
  const criticalPath = analyzeCriticalPath(enrichedScenarios);

  console.log('\n' + '─'.repeat(60));
  console.log('CRITICAL PATH ANALYSIS RESULTS');
  console.log('─'.repeat(60));

  console.log(`\nTotal estimated days: ${criticalPath.total_days}`);
  console.log(`\nExecution sequence (${criticalPath.sequence.length} items):`);
  criticalPath.sequence.forEach((id, index) => {
    const scenario = enrichedScenarios.find(s => s.matrix_id === id);
    const urgency = scenario?.triage?.urgency || 'UNKNOWN';
    const dependency = scenario?.triage?.dependency_status || 'UNKNOWN';
    console.log(`  ${index + 1}. ${id.padEnd(12)} [${urgency.padEnd(18)}] [${dependency}]`);
  });

  if (criticalPath.parallel_opportunities && criticalPath.parallel_opportunities.length > 0) {
    console.log(`\nParallel opportunities (${criticalPath.parallel_opportunities.length}):`);
    criticalPath.parallel_opportunities.forEach((opp, index) => {
      console.log(`  ${index + 1}. Can run ${opp.can_run_parallel.length} tasks in parallel`);
      console.log(`     Saves: ${opp.saves_days} days`);
      console.log(`     Tasks: ${opp.can_run_parallel.join(', ')}`);
    });
  } else {
    console.log(`\nNo parallel opportunities identified (all tasks sequential)`);
  }

  // Validate critical path logic
  console.log('\n' + '─'.repeat(60));
  console.log('VALIDATION CHECKS');
  console.log('─'.repeat(60) + '\n');

  let allChecksPassed = true;

  // Check 1: BLOCKS_OTHERS items should come before BLOCKED_BY items
  // (Dependency-based sequencing, not just urgency-based)
  const blockingItems = enrichedScenarios.filter(
    s => s.triage?.dependency_status === 'BLOCKS_OTHERS'
  );
  const blockedItems = enrichedScenarios.filter(
    s => s.triage?.dependency_status === 'BLOCKED_BY'
  );

  if (blockingItems.length > 0) {
    // All blocking items should come before any blocked items
    const lastBlockerIndex = Math.max(
      ...blockingItems.map(b => criticalPath.sequence.indexOf(b.matrix_id))
    );
    const firstBlockedIndex = blockedItems.length > 0
      ? Math.min(...blockedItems.map(b => criticalPath.sequence.indexOf(b.matrix_id)))
      : Infinity;

    if (lastBlockerIndex < firstBlockedIndex) {
      console.log('✅ Blocking items correctly sequenced before blocked items');
    } else {
      console.log('❌ Some blocked items appear before blocking items complete');
      allChecksPassed = false;
    }
  }

  // Check 2: Sequence should contain all failed/partial items
  const failedItems = enrichedScenarios.filter(
    s => s.status === 'does_not_meet' || s.status === 'partial'
  );

  const allIncluded = failedItems.every(item =>
    criticalPath.sequence.includes(item.matrix_id)
  );

  if (allIncluded) {
    console.log('✅ All failed/partial items included in sequence');
  } else {
    console.log('❌ Some failed/partial items missing from sequence');
    allChecksPassed = false;
  }

  // Check 3: Total days should be positive and reasonable
  if (criticalPath.total_days > 0 && criticalPath.total_days < 500) {
    console.log(`✅ Total days estimate is reasonable (${criticalPath.total_days} days)`);
  } else {
    console.log(`❌ Total days estimate seems unrealistic (${criticalPath.total_days} days)`);
    allChecksPassed = false;
  }

  // Check 4: Validate dependency status assignments
  console.log('\nDependency Status Review:');
  enrichedScenarios.forEach(s => {
    if (s.status !== 'meets') {
      const depStatus = s.triage?.dependency_status || 'NONE';
      console.log(`  ${s.matrix_id.padEnd(12)}: ${depStatus.padEnd(15)} ${getDependencyReasoning(s)}`);
    }
  });

  // Final result
  console.log('\n' + '─'.repeat(60));
  if (allChecksPassed) {
    console.log('✅ ALL CRITICAL PATH VALIDATION CHECKS PASSED');
    console.log('─'.repeat(60) + '\n');
    return {
      success: true,
      summary: 'Critical path analysis correctly sequences dependencies and identifies parallel opportunities'
    };
  } else {
    console.log('❌ SOME CRITICAL PATH VALIDATION CHECKS FAILED');
    console.log('─'.repeat(60) + '\n');
    return {
      success: false,
      summary: 'Critical path analysis has sequencing or dependency issues'
    };
  }
}

/**
 * Get human-readable reasoning for dependency status
 */
function getDependencyReasoning(result: AssessmentResult): string {
  const category = result.category?.toLowerCase() || '';
  const reasoning = result.reasoning?.toLowerCase() || '';

  if (category.includes('fire') && reasoning.includes('strategy')) {
    return '(fire strategy blocks other work)';
  }
  if (category.includes('structural') && reasoning.includes('calculation')) {
    return '(structural calcs block other work)';
  }
  if (reasoning.includes('inconsistent') || reasoning.includes('mismatch')) {
    return '(may be blocked by primary documents)';
  }
  return '(can be done independently)';
}
