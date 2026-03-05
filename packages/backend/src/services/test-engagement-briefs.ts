/**
 * Test Engagement Brief Generation
 *
 * Stage 4.6: Validates that specialist engagement briefs are generated correctly
 * Tests that briefs include proper scope, deliverables, and regulatory context
 */

import { generateEngagementBriefs } from './engagement-brief-generator.js';
import type { EngagementBrief } from './engagement-brief-generator.js';
import { enrichCriterionWithMetadata } from './matrix-assessment.js';
import {
  criticalFireStrategy,
  structuralCalcsPartial,
  mepSpecsIncomplete,
  crossDocInconsistency,
  aiAmendableQuickWin
} from './test-scenarios.js';

/**
 * Run engagement brief generation tests
 */
export function testEngagementBriefs(): {
  success: boolean;
  summary: string;
  briefsGenerated: number;
} {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STAGE 4.6: ENGAGEMENT BRIEF GENERATION VALIDATION          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Enrich test scenarios
  console.log('Enriching test scenarios...');
  const enrichedScenarios = [
    criticalFireStrategy,
    structuralCalcsPartial,
    mepSpecsIncomplete,
    crossDocInconsistency,
    aiAmendableQuickWin
  ].map(scenario => enrichCriterionWithMetadata(scenario));

  console.log(`✅ Enriched ${enrichedScenarios.length} scenarios\n`);

  // Generate engagement briefs
  console.log('Generating engagement briefs...');
  const briefs = generateEngagementBriefs(enrichedScenarios);

  console.log(`✅ Generated ${briefs.length} engagement briefs\n`);

  console.log('─'.repeat(60));
  console.log('VALIDATION CHECKS');
  console.log('─'.repeat(60) + '\n');

  let allChecksPassed = true;
  const issues: string[] = [];

  // Check 1: Should generate briefs for specialist work
  const expectedSpecialists = ['Fire Safety Engineer', 'Structural Engineer', 'MEP Consultant', 'Architect'];
  const actualSpecialists = briefs.map(b => b.specialist_type);

  // Should have at least Fire, Structural, and MEP briefs from our test scenarios
  if (actualSpecialists.includes('Fire Safety Engineer')) {
    console.log('✅ Fire Safety Engineer brief generated');
  } else {
    console.log('❌ Missing Fire Safety Engineer brief');
    allChecksPassed = false;
    issues.push('Missing Fire Safety Engineer brief');
  }

  if (actualSpecialists.includes('Structural Engineer')) {
    console.log('✅ Structural Engineer brief generated');
  } else {
    console.log('❌ Missing Structural Engineer brief');
    allChecksPassed = false;
    issues.push('Missing Structural Engineer brief');
  }

  if (actualSpecialists.includes('MEP Consultant')) {
    console.log('✅ MEP Consultant brief generated');
  } else {
    console.log('❌ Missing MEP Consultant brief');
    allChecksPassed = false;
    issues.push('Missing MEP Consultant brief');
  }

  if (actualSpecialists.includes('Architect')) {
    console.log('✅ Architect brief generated');
  } else {
    console.log('⚠️  No Architect brief (may be expected if no architect issues)');
  }

  // Check 2: Each brief should have all required fields
  console.log('\nValidating brief completeness:');
  briefs.forEach((brief, index) => {
    const briefIssues: string[] = [];

    if (!brief.specialist_type || brief.specialist_type.length < 3) {
      briefIssues.push('Missing or invalid specialist_type');
    }

    if (!brief.issues_to_address || brief.issues_to_address.length === 0) {
      briefIssues.push('No issues listed');
    }

    if (!brief.scope_of_work || brief.scope_of_work.length < 10) {
      briefIssues.push('Scope of work missing or too short');
    }

    if (!brief.deliverables || brief.deliverables.length === 0) {
      briefIssues.push('No deliverables listed');
    }

    if (!brief.estimated_duration || brief.estimated_duration.length < 3) {
      briefIssues.push('Missing duration estimate');
    }

    if (!brief.regulatory_context || brief.regulatory_context.length === 0) {
      briefIssues.push('No regulatory context provided');
    }

    if (!brief.brief_text || brief.brief_text.length < 50) {
      briefIssues.push('Brief text missing or too short');
    }

    // Check that brief text contains key elements
    const briefText = brief.brief_text.toLowerCase();
    if (!briefText.includes('scope')) {
      briefIssues.push('Brief text missing scope section');
    }
    if (!briefText.includes('deliverable')) {
      briefIssues.push('Brief text missing deliverables section');
    }

    if (briefIssues.length === 0) {
      console.log(`  ✅ ${brief.specialist_type}: Complete`);
    } else {
      console.log(`  ❌ ${brief.specialist_type}: ${briefIssues.join(', ')}`);
      allChecksPassed = false;
      issues.push(...briefIssues);
    }
  });

  // Check 3: Fire brief should mention Building Safety Act/BSR
  const fireBrief = briefs.find(b => b.specialist_type.includes('Fire'));
  if (fireBrief) {
    console.log('\nValidating Fire Safety Engineer brief content:');

    const hasRegulatoryContext = fireBrief.regulatory_context.some(r =>
      r.includes('Building Safety Act') || r.includes('Approved Document B')
    );

    if (hasRegulatoryContext) {
      console.log('  ✅ Includes appropriate regulatory references');
    } else {
      console.log('  ❌ Missing key regulatory references');
      allChecksPassed = false;
      issues.push('Fire brief missing regulatory context');
    }

    if (fireBrief.deliverables.length >= 3) {
      console.log(`  ✅ Lists ${fireBrief.deliverables.length} deliverables`);
    } else {
      console.log(`  ⚠️  Only ${fireBrief.deliverables.length} deliverables (expected 3+)`);
    }

    console.log('\n  Brief preview (first 200 chars):');
    console.log('  ' + fireBrief.brief_text.substring(0, 200) + '...');
  }

  // Display all generated briefs
  console.log('\n' + '─'.repeat(60));
  console.log('GENERATED BRIEFS SUMMARY');
  console.log('─'.repeat(60) + '\n');

  briefs.forEach((brief, index) => {
    console.log(`${index + 1}. ${brief.specialist_type}`);
    console.log(`   Issues: ${brief.issues_to_address.length}`);
    console.log(`   Deliverables: ${brief.deliverables.length}`);
    console.log(`   Duration: ${brief.estimated_duration}`);
    console.log(`   Regulatory refs: ${brief.regulatory_context.length}`);
    console.log(`   Brief length: ${brief.brief_text.length} chars`);
    console.log();
  });

  // Final result
  console.log('─'.repeat(60));
  if (allChecksPassed) {
    console.log('✅ ALL ENGAGEMENT BRIEF VALIDATION CHECKS PASSED');
    console.log('─'.repeat(60) + '\n');
    return {
      success: true,
      summary: `Generated ${briefs.length} complete engagement briefs with proper scope, deliverables, and regulatory context`,
      briefsGenerated: briefs.length
    };
  } else {
    console.log('❌ SOME ENGAGEMENT BRIEF VALIDATION CHECKS FAILED');
    console.log('─'.repeat(60));
    console.log('\nIssues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log();
    return {
      success: false,
      summary: `Engagement briefs have validation issues: ${issues.length} problems found`,
      briefsGenerated: briefs.length
    };
  }
}
