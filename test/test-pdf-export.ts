/**
 * Test PDF Export with Mock Assessment Data
 *
 * Creates realistic assessment data covering all categories:
 * - Rejection Risks
 * - Missing Information
 * - Requires Clarification
 * - Can Be Addressed
 */

import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001';

// Mock assessment data with all issue categories
const mockAssessment = {
  pack_id: 'test-pack-001',
  version_id: 'v1',
  readiness_score: 62,
  pack_context: {
    buildingType: 'Residential Tower',
    isLondon: true,
    isHRB: true,
    floors: 18,
    height: 54
  },
  results: [
    // REJECTION RISKS (Critical blockers)
    {
      matrix_id: 'FS-001',
      matrix_title: 'Fire Strategy Document',
      category: 'Fire Safety',
      status: 'does_not_meet',
      severity: 'high',
      reasoning: 'Fire strategy document is incomplete and does not address external wall system fire performance. Critical regulatory requirement missing.',
      gaps_identified: ['External wall fire performance assessment', 'Compartmentation strategy for residential units'],
      triage: {
        urgency: 'CRITICAL_BLOCKER',
        blocks_submission: true,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'HIGH'
      },
      actions_required: [{
        action: 'Engage fire engineer to complete comprehensive fire strategy covering external wall system',
        owner: 'Fire Safety Engineer',
        effort: 'High (2-3 weeks)',
        expected_benefit: 'Addresses primary rejection risk'
      }],
      pack_evidence: {
        document: 'Fire Strategy Draft v0.2.pdf',
        page: 12,
        quote: 'External wall system analysis: TBC'
      }
    },
    {
      matrix_id: 'ST-003',
      matrix_title: 'Structural Calculations - Wind Loading',
      category: 'Structural',
      status: 'does_not_meet',
      severity: 'high',
      reasoning: 'Wind loading calculations are not signed off by chartered structural engineer. BSR requires professional certification.',
      gaps_identified: ['Professional engineer sign-off', 'IStructE certification'],
      triage: {
        urgency: 'CRITICAL_BLOCKER',
        blocks_submission: true,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'HIGH'
      },
      actions_required: [{
        action: 'Obtain chartered structural engineer certification and sign-off',
        owner: 'Structural Engineer',
        effort: 'Medium (1 week)',
        expected_benefit: 'Meets regulatory certification requirement'
      }],
      pack_evidence: {
        document: 'Structural Calcs Vol 2.pdf',
        page: 45
      }
    },
    {
      matrix_id: 'AC-002',
      matrix_title: 'Acoustic Performance - Party Walls',
      category: 'Acoustic',
      status: 'does_not_meet',
      severity: 'high',
      reasoning: 'Acoustic testing methodology does not comply with Approved Document E. Critical for HRB submissions.',
      gaps_identified: ['Compliant testing methodology', 'Pre-completion testing plan'],
      triage: {
        urgency: 'CRITICAL_BLOCKER',
        blocks_submission: false,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'MEDIUM'
      },
      actions_required: [{
        action: 'Revise acoustic testing plan to comply with Part E requirements',
        owner: 'Acoustic Consultant',
        effort: 'Medium (1-2 weeks)',
        expected_benefit: 'Ensures compliance with building regulations'
      }]
    },

    // MISSING INFORMATION (TBC items)
    {
      matrix_id: 'MEP-005',
      matrix_title: 'Smoke Control System Specification',
      category: 'MEP',
      status: 'partial',
      reasoning: 'Smoke control system manufacturer and model are listed as TBC. Product specifications not provided.',
      gaps_identified: ['Manufacturer details', 'Product certifications', 'Performance specifications'],
      triage: {
        urgency: 'HIGH_PRIORITY',
        blocks_submission: false,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'HIGH'
      },
      actions_required: [{
        action: 'Request final smoke control system specifications from MEP consultant',
        owner: 'MEP Engineer',
        effort: 'Low (2-3 days)',
        expected_benefit: 'Completes technical specification'
      }],
      pack_evidence: {
        document: 'MEP Schedule.pdf',
        page: 8,
        quote: 'Smoke control: Manufacturer TBC, Model TBC'
      }
    },
    {
      matrix_id: 'AR-007',
      matrix_title: 'External Cladding Material Certificates',
      category: 'Architecture',
      status: 'does_not_meet',
      reasoning: 'Material certificates for external cladding system not provided. Document states "certificates to be confirmed".',
      gaps_identified: ['Fire performance certificates', 'Product test reports', 'BBA certification'],
      triage: {
        urgency: 'HIGH_PRIORITY',
        blocks_submission: false,
        engagement_type: 'INTERNAL_FIX',
        quick_win: true
      },
      confidence: {
        level: 'HIGH'
      },
      actions_required: [{
        action: 'Obtain and include manufacturer fire certificates for cladding system',
        owner: 'Architect',
        effort: 'Low (1 week)',
        expected_benefit: 'Demonstrates material compliance'
      }],
      pack_evidence: {
        document: 'Design and Access Statement.pdf',
        page: 23,
        quote: 'Material certifications to be confirmed prior to submission'
      }
    },
    {
      matrix_id: 'FS-009',
      matrix_title: 'Fire Door Schedule',
      category: 'Fire Safety',
      status: 'partial',
      reasoning: 'Fire door schedule is incomplete. Several door types missing FD ratings and manufacturer information listed as "to be confirmed".',
      gaps_identified: ['Complete FD ratings for all door types', 'Manufacturer certifications'],
      triage: {
        urgency: 'MEDIUM_PRIORITY',
        blocks_submission: false,
        engagement_type: 'INTERNAL_FIX',
        quick_win: true
      },
      confidence: {
        level: 'HIGH'
      },
      actions_required: [{
        action: 'Complete fire door schedule with all FD ratings and certifications',
        owner: 'Fire Safety Consultant',
        effort: 'Low (3-4 days)',
        expected_benefit: 'Completes critical safety documentation'
      }],
      pack_evidence: {
        document: 'Fire Door Schedule v1.pdf',
        page: 3
      }
    },

    // REQUIRES CLARIFICATION (Ambiguous/uncertain)
    {
      matrix_id: 'ST-008',
      matrix_title: 'Foundation Design - Soil Conditions',
      category: 'Structural',
      status: 'partial',
      reasoning: 'Foundation design references soil report but assumptions are unclear. Professional review required to verify compliance with site conditions.',
      gaps_identified: ['Soil condition verification', 'Foundation design confirmation'],
      triage: {
        urgency: 'MEDIUM_PRIORITY',
        blocks_submission: false,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'REQUIRES_HUMAN_JUDGEMENT'
      },
      actions_required: [{
        action: 'Structural engineer to verify foundation design against site investigation',
        owner: 'Structural Engineer',
        effort: 'Medium (1 week)',
        expected_benefit: 'Confirms structural adequacy'
      }],
      pack_evidence: {
        document: 'Foundation Design Report.pdf',
        page: 15
      }
    },
    {
      matrix_id: 'EN-004',
      matrix_title: 'Energy Performance - Thermal Bridging',
      category: 'Energy',
      status: 'partial',
      reasoning: 'Thermal bridging calculations are present but methodology is unclear and may not align with SAP requirements. Requires specialist verification.',
      gaps_identified: ['SAP compliance confirmation'],
      triage: {
        urgency: 'MEDIUM_PRIORITY',
        blocks_submission: false,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'REQUIRES_HUMAN_JUDGEMENT'
      },
      actions_required: [{
        action: 'SAP assessor to review and confirm thermal bridging methodology',
        owner: 'Energy Consultant',
        effort: 'Low (2-3 days)',
        expected_benefit: 'Validates energy calculations'
      }]
    },
    {
      matrix_id: 'AC-005',
      matrix_title: 'Sound Insulation - Floor Assemblies',
      category: 'Acoustic',
      status: 'partial',
      reasoning: 'Floor assembly details are ambiguous regarding acoustic performance. Documentation does not clearly demonstrate compliance with Part E.',
      gaps_identified: ['Clear acoustic performance data', 'Compliance demonstration'],
      triage: {
        urgency: 'LOW_PRIORITY',
        blocks_submission: false,
        engagement_type: 'SPECIALIST_REQUIRED',
        quick_win: false
      },
      confidence: {
        level: 'REQUIRES_HUMAN_JUDGEMENT'
      },
      actions_required: [{
        action: 'Clarify floor assembly acoustic specifications with consultant',
        owner: 'Acoustic Consultant',
        effort: 'Low (3-5 days)',
        expected_benefit: 'Demonstrates regulatory compliance'
      }]
    },

    // CAN BE ADDRESSED (Lower priority)
    {
      matrix_id: 'AR-012',
      matrix_title: 'Accessibility Statement - Level Access',
      category: 'Architecture',
      status: 'partial',
      reasoning: 'Accessibility statement addresses most requirements but level access details could be more comprehensive.',
      gaps_identified: ['Enhanced level access description'],
      triage: {
        urgency: 'MEDIUM_PRIORITY',
        blocks_submission: false,
        engagement_type: 'INTERNAL_FIX',
        quick_win: true
      },
      confidence: {
        level: 'MEDIUM'
      },
      actions_required: [{
        action: 'Enhance accessibility statement with detailed level access information',
        owner: 'Architect',
        effort: 'Low (1-2 days)',
        expected_benefit: 'Improves documentation quality'
      }]
    },
    {
      matrix_id: 'FS-015',
      matrix_title: 'Fire Safety Management Plan',
      category: 'Fire Safety',
      status: 'partial',
      reasoning: 'Fire safety management plan is adequate but could benefit from more detail on resident communication procedures.',
      gaps_identified: ['Enhanced resident communication procedures'],
      triage: {
        urgency: 'LOW_PRIORITY',
        blocks_submission: false,
        engagement_type: 'INTERNAL_FIX',
        quick_win: true
      },
      confidence: {
        level: 'MEDIUM'
      },
      actions_required: [{
        action: 'Add detailed resident communication procedures to fire safety plan',
        owner: 'Building Safety Manager',
        effort: 'Low (2-3 days)',
        expected_benefit: 'Strengthens safety management documentation'
      }]
    },
    {
      matrix_id: 'MEP-011',
      matrix_title: 'Drainage System - Maintenance Schedule',
      category: 'MEP',
      status: 'partial',
      reasoning: 'Drainage maintenance schedule provided but could be more detailed for long-term building management.',
      gaps_identified: ['Enhanced maintenance procedures'],
      triage: {
        urgency: 'LOW_PRIORITY',
        blocks_submission: false,
        engagement_type: 'INTERNAL_FIX',
        quick_win: false
      },
      confidence: {
        level: 'MEDIUM'
      },
      actions_required: [{
        action: 'Expand drainage maintenance schedule with detailed procedures',
        owner: 'MEP Engineer',
        effort: 'Low (2-3 days)',
        expected_benefit: 'Improves building management documentation'
      }]
    },

    // Some passing items for context
    {
      matrix_id: 'ST-001',
      matrix_title: 'Structural Integrity - Load Calculations',
      category: 'Structural',
      status: 'meets',
      reasoning: 'Comprehensive load calculations provided with professional certification.',
      triage: {
        urgency: 'LOW_PRIORITY',
        blocks_submission: false,
        engagement_type: 'NONE',
        quick_win: false
      },
      confidence: {
        level: 'HIGH'
      }
    },
    {
      matrix_id: 'AR-001',
      matrix_title: 'Site Plan and Boundaries',
      category: 'Architecture',
      status: 'meets',
      reasoning: 'Site plans clearly show boundaries and are professionally prepared.',
      triage: {
        urgency: 'LOW_PRIORITY',
        blocks_submission: false,
        engagement_type: 'NONE',
        quick_win: false
      },
      confidence: {
        level: 'HIGH'
      }
    }
  ]
};

async function testPDFExport() {
  console.log('🧪 Testing PDF Export with Mock Assessment Data\n');
  console.log('📊 Mock Assessment Summary:');

  const issues = mockAssessment.results.filter(r =>
    r.status === 'does_not_meet' || r.status === 'partial'
  );

  const rejectionRisks = issues.filter(i =>
    i.triage?.urgency === 'CRITICAL_BLOCKER' ||
    i.triage?.blocks_submission ||
    i.severity === 'high'
  );

  const missingInfo = issues.filter(i => {
    const reasoning = (i.reasoning || '').toLowerCase();
    const gaps = (i.gaps_identified || []).join(' ').toLowerCase();
    return (
      reasoning.includes('missing') ||
      reasoning.includes('not provided') ||
      reasoning.includes('tbc') ||
      reasoning.includes('to be confirmed') ||
      gaps.includes('missing')
    ) && !rejectionRisks.includes(i);
  });

  const requiresClarification = issues.filter(i => {
    const isLowConfidence = i.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT';
    const reasoning = (i.reasoning || '').toLowerCase();
    const isAmbiguous = reasoning.includes('unclear') || reasoning.includes('ambiguous');
    return (isLowConfidence || isAmbiguous) && !rejectionRisks.includes(i) && !missingInfo.includes(i);
  });

  const canBeAddressed = issues.filter(i =>
    !rejectionRisks.includes(i) &&
    !missingInfo.includes(i) &&
    !requiresClarification.includes(i)
  );

  console.log(`  Total Issues: ${issues.length}`);
  console.log(`  ⚠️  Rejection Risks: ${rejectionRisks.length}`);
  console.log(`  📋 Missing Information: ${missingInfo.length}`);
  console.log(`  ❓ Requires Clarification: ${requiresClarification.length}`);
  console.log(`  ✓  Can Be Addressed: ${canBeAddressed.length}\n`);

  try {
    console.log('📤 Sending request to compliance report endpoint...');

    const response = await fetch(
      `${API_BASE}/api/packs/${mockAssessment.pack_id}/versions/${mockAssessment.version_id}/compliance-report/download`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessment: mockAssessment })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Response received successfully');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    // Save the PDF
    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(process.cwd(), 'test', 'output-compliance-report.pdf');

    // Ensure test directory exists
    const testDir = path.join(process.cwd(), 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);

    console.log(`\n✅ PDF Generated Successfully!`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);

    console.log('\n📋 Expected PDF Structure:');
    console.log('   1. Headline Verdict (RED/AMBER/GREEN)');
    console.log('   2. Quick Stats (4 color-coded cards)');
    console.log('   3. ⚠️  REJECTION RISKS section (red) - 3 issues');
    console.log('   4. 📋 MISSING INFORMATION section (orange) - 3 issues');
    console.log('   5. ❓ REQUIRES CLARIFICATION section (purple) - 3 issues');
    console.log('   6. ✓  CAN BE ADDRESSED section (blue) - 3 issues');
    console.log('   7. → NEXT ACTIONS section');

    console.log('\n✅ Test completed successfully!');
    console.log(`\n👉 Open the PDF to verify: ${outputPath}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPDFExport();
