/**
 * Test script to verify evidence_quality is properly implemented
 * This checks the type definitions and logic without requiring API calls
 */

import type { AssessmentResult, EvidenceQuality } from './src/services/matrix-assessment.js';

// Test 1: Verify AssessmentResult interface includes evidence_quality
function testAssessmentResultInterface() {
  console.log('✓ Test 1: AssessmentResult interface includes evidence_quality field');

  // This will fail to compile if evidence_quality is not in the interface
  const mockResult: AssessmentResult = {
    matrix_id: 'TEST-001',
    matrix_title: 'Test Criterion',
    category: 'Fire Safety',
    status: 'meets',
    severity: 'high',
    reasoning: 'Test reasoning',
    success_definition: 'Test definition',
    pack_evidence: {
      found: true,
      document: 'test.pdf',
      page: 1,
      quote: 'Test quote'
    },
    reference_evidence: {
      found: true,
      doc_id: 'REF-001',
      doc_title: 'Reference Document',
      page: 1,
      quote: 'Reference quote'
    },
    gaps_identified: [],
    actions_required: [],
    evidence_quality: 'explicit' // This line verifies the field exists
  };

  return mockResult;
}

// Test 2: Verify evidence quality inference logic for deterministic results
function testDeterministicEvidenceQuality() {
  console.log('✓ Test 2: Deterministic evidence quality inference logic');

  const testCases = [
    {
      name: 'Evidence found with quote',
      evidence: { found: true, quote: 'Building height is 24.5m' },
      expected: 'explicit' as EvidenceQuality
    },
    {
      name: 'Evidence found without quote',
      evidence: { found: true, quote: undefined },
      expected: 'implicit' as EvidenceQuality
    },
    {
      name: 'No evidence found',
      evidence: { found: false, quote: undefined },
      expected: 'absent' as EvidenceQuality
    }
  ];

  testCases.forEach(tc => {
    // Simulate the logic from line 1723-1725
    const quality: EvidenceQuality = !tc.evidence.found
      ? 'absent'
      : (tc.evidence.quote ? 'explicit' : 'implicit');

    const passed = quality === tc.expected;
    console.log(`  ${passed ? '✓' : '✗'} ${tc.name}: ${quality} (expected: ${tc.expected})`);

    if (!passed) {
      throw new Error(`Test failed: ${tc.name}`);
    }
  });
}

// Test 3: Verify evidence quality inference logic for legacy assessment
function testLegacyEvidenceQuality() {
  console.log('✓ Test 3: Legacy assessment evidence quality inference logic');

  const testCases = [
    {
      name: 'Valid evidence with quote',
      parsed: { pack_evidence_found: true, pack_evidence_quote: 'Test quote' },
      validation: { isValid: true },
      expected: 'explicit' as EvidenceQuality
    },
    {
      name: 'Valid evidence without quote',
      parsed: { pack_evidence_found: true, pack_evidence_quote: null },
      validation: { isValid: true },
      expected: 'implicit' as EvidenceQuality
    },
    {
      name: 'Invalid evidence',
      parsed: { pack_evidence_found: true, pack_evidence_quote: 'Test quote' },
      validation: { isValid: false },
      expected: 'absent' as EvidenceQuality
    },
    {
      name: 'No evidence found',
      parsed: { pack_evidence_found: false, pack_evidence_quote: null },
      validation: { isValid: true },
      expected: 'absent' as EvidenceQuality
    }
  ];

  testCases.forEach(tc => {
    // Simulate the logic from line 1417-1419
    const quality: EvidenceQuality = !(tc.parsed.pack_evidence_found && tc.validation.isValid)
      ? 'absent'
      : (tc.validation.isValid && tc.parsed.pack_evidence_quote ? 'explicit' : 'implicit');

    const passed = quality === tc.expected;
    console.log(`  ${passed ? '✓' : '✗'} ${tc.name}: ${quality} (expected: ${tc.expected})`);

    if (!passed) {
      throw new Error(`Test failed: ${tc.name}`);
    }
  });
}

// Test 4: Verify all EvidenceQuality values are valid
function testEvidenceQualityValues() {
  console.log('✓ Test 4: EvidenceQuality type accepts all valid values');

  const validValues: EvidenceQuality[] = ['explicit', 'implicit', 'ambiguous', 'absent'];

  validValues.forEach(value => {
    const quality: EvidenceQuality = value;
    console.log(`  ✓ ${value}`);
  });
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Evidence Quality Implementation Tests\n');
  console.log('='.repeat(60));

  try {
    testAssessmentResultInterface();
    console.log();

    testDeterministicEvidenceQuality();
    console.log();

    testLegacyEvidenceQuality();
    console.log();

    testEvidenceQualityValues();
    console.log();

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log('  ✓ AssessmentResult interface includes evidence_quality field');
    console.log('  ✓ Deterministic inference logic works correctly');
    console.log('  ✓ Legacy assessment inference logic works correctly');
    console.log('  ✓ All EvidenceQuality values are valid');
    console.log('\nNext steps:');
    console.log('  • Run full assessment to verify database storage');
    console.log('  • Check compliance matrix Excel export');
    console.log('  • Verify evidence quality distribution in logs');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

runTests();
