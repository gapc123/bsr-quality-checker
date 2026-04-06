/**
 * Test PDF Download Functionality
 *
 * This script tests the PDF download endpoint directly
 */

const fs = require('fs');
const path = require('path');

// Minimal assessment payload for testing
const testAssessment = {
  pack_id: 'test-pack-123',
  version_id: 'test-version-456',
  readiness_score: 65,
  assessment_date: new Date().toISOString(),
  pack_context: {
    buildingType: 'Test Building',
    isLondon: false,
    isHRB: true
  },
  results: [
    {
      matrix_id: 'M1',
      matrix_title: 'Building Classification',
      category: 'Building Safety Act',
      status: 'meets',
      severity: 'high',
      reasoning: 'Building is properly classified as HRB',
      success_definition: 'Building classification documented',
      pack_evidence: {
        found: true,
        document: 'Fire_Strategy.pdf',
        page: 1,
        quote: 'This is a Higher-Risk Building'
      },
      reference_evidence: {
        found: true,
        doc_id: 'BSA-001',
        doc_title: 'Building Safety Act 2022',
        page: null,
        quote: 'Buildings over 18m or 7 storeys'
      },
      gaps_identified: [],
      actions_required: [],
      evidence_quality: 'explicit'
    },
    {
      matrix_id: 'M2',
      matrix_title: 'Fire Strategy Documentation',
      category: 'Fire Safety',
      status: 'partial',
      severity: 'high',
      reasoning: 'Fire strategy present but missing evacuation details',
      success_definition: 'Complete fire strategy with evacuation plan',
      pack_evidence: {
        found: true,
        document: 'Fire_Strategy.pdf',
        page: 2,
        quote: 'Fire strategy overview provided'
      },
      reference_evidence: {
        found: true,
        doc_id: 'ADB-001',
        doc_title: 'Approved Document B',
        page: null,
        quote: 'Fire strategy must include evacuation procedures'
      },
      gaps_identified: ['Missing evacuation procedures', 'No assembly point specified'],
      actions_required: [
        {
          action: 'Add evacuation procedures to fire strategy',
          owner: 'Fire Engineer',
          effort: 'M',
          expected_benefit: 'Complete fire safety documentation'
        }
      ],
      evidence_quality: 'implicit',
      triage: {
        urgency: 'HIGH_PRIORITY',
        blocks_submission: false,
        quick_win: false
      }
    },
    {
      matrix_id: 'M3',
      matrix_title: 'Structural Fire Resistance',
      category: 'Structural',
      status: 'does_not_meet',
      severity: 'high',
      reasoning: 'No structural fire resistance documentation found',
      success_definition: 'Structural elements rated for fire resistance',
      pack_evidence: {
        found: false,
        document: null,
        page: null,
        quote: null
      },
      reference_evidence: {
        found: true,
        doc_id: 'ADB-002',
        doc_title: 'Approved Document B',
        page: null,
        quote: 'Structural fire resistance required'
      },
      gaps_identified: ['No structural calculations', 'No fire resistance ratings'],
      actions_required: [
        {
          action: 'Provide structural fire resistance calculations',
          owner: 'Structural Engineer',
          effort: 'L',
          expected_benefit: 'Demonstrate structural safety in fire'
        }
      ],
      evidence_quality: 'absent',
      triage: {
        urgency: 'CRITICAL_BLOCKER',
        blocks_submission: true,
        quick_win: false
      }
    }
  ]
};

async function testPDFDownload() {
  console.log('\n🧪 Testing PDF Download Functionality\n');
  console.log('='.repeat(60));

  try {
    console.log('1. Testing backend API endpoint...');

    const response = await fetch('http://localhost:3001/api/packs/test-pack/versions/test-version/submission-readiness/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assessment: testAssessment })
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Error response:', errorText);
      return false;
    }

    console.log('   ✓ Response received');

    // Save the PDF to test file
    const buffer = await response.arrayBuffer();
    const outputPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    const stats = fs.statSync(outputPath);
    console.log(`   ✓ PDF saved: ${outputPath}`);
    console.log(`   ✓ File size: ${(stats.size / 1024).toFixed(2)} KB`);

    // Basic PDF validation
    const pdfHeader = fs.readFileSync(outputPath, { encoding: 'utf8', start: 0, end: 4 });
    if (pdfHeader === '%PDF') {
      console.log('   ✓ Valid PDF format');
    } else {
      console.log('   ⚠️  Warning: File may not be a valid PDF');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ PDF DOWNLOAD TEST PASSED');
    console.log('='.repeat(60));
    console.log(`\nTest PDF generated at: ${outputPath}`);
    console.log('You can open this file to verify the content.\n');

    return true;

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ PDF DOWNLOAD TEST FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server not running on http://localhost:3001');
      console.error('   Start it with: cd packages/backend && npm run dev\n');
    }

    return false;
  }
}

// Run the test
testPDFDownload().then(success => {
  process.exit(success ? 0 : 1);
});
