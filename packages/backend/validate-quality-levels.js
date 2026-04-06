/**
 * Validation Script: Test GOOD/MEDIUM/POOR documents produce different results
 */
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'https://www.attlee.ai';

async function runAssessment(pdfPath, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${label}`);
  console.log('='.repeat(60));

  try {
    // Create pack
    const packRes = await fetch(`${API_BASE}/api/packs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test ${label}`,
        description: `Validation test for ${label} quality`,
      }),
    });
    const pack = await packRes.json();
    console.log(`✓ Pack created: ${pack.id}`);

    // Create version
    const versionRes = await fetch(`${API_BASE}/api/packs/${pack.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionNumber: '1.0',
        description: `${label} test`,
      }),
    });
    const version = await versionRes.json();
    console.log(`✓ Version created: ${version.id}`);

    // Upload document
    const formData = new FormData();
    formData.append('files', fs.createReadStream(pdfPath));

    const uploadRes = await fetch(
      `${API_BASE}/api/packs/${pack.id}/versions/${version.id}/documents`,
      {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      }
    );
    await uploadRes.json();
    console.log(`✓ Document uploaded`);

    // Run assessment
    console.log(`⏳ Running assessment (this takes 2-3 minutes)...`);
    const assessRes = await fetch(
      `${API_BASE}/api/packs/${pack.id}/versions/${version.id}/assess`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLondon: false,
          isHRB: true,
          buildingType: 'residential',
        }),
      }
    );
    const assessment = await assessRes.json();

    // Extract key metrics
    const results = assessment.results || [];
    const met = results.filter(r => r.status === 'meets').length;
    const partial = results.filter(r => r.status === 'partial').length;
    const doesNotMeet = results.filter(r => r.status === 'does_not_meet').length;
    const missingInfo = results.filter(r => r.status === 'missing_information').length;
    const highSeverity = results.filter(r => r.severity === 'high').length;
    const criticalBlockers = results.filter(r =>
      r.status === 'does_not_meet' && r.severity === 'high'
    ).length;

    const readinessScore = assessment.readiness_score ||
      Math.round((met / results.length) * 100);

    console.log(`\n📊 RESULTS:`);
    console.log(`  Total criteria: ${results.length}`);
    console.log(`  Readiness score: ${readinessScore}%`);
    console.log(`  Met: ${met}`);
    console.log(`  Partial: ${partial}`);
    console.log(`  Does not meet: ${doesNotMeet}`);
    console.log(`  Missing info: ${missingInfo}`);
    console.log(`  High severity issues: ${highSeverity}`);
    console.log(`  Critical blockers: ${criticalBlockers}`);

    return {
      label,
      readinessScore,
      met,
      partial,
      doesNotMeet,
      missingInfo,
      highSeverity,
      criticalBlockers,
      totalCriteria: results.length,
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🧪 BSR Quality Level Validation Test\n');
  console.log('Testing that GOOD/MEDIUM/POOR documents produce different results...\n');

  const results = [];

  // Test each document
  results.push(await runAssessment('test-docs/GOOD-Riverside-Tower.pdf', 'GOOD'));
  results.push(await runAssessment('test-docs/MEDIUM-Victoria-Court.pdf', 'MEDIUM'));
  results.push(await runAssessment('test-docs/POOR-Skyline-Apartments.pdf', 'POOR'));

  // Summary comparison
  console.log(`\n${'='.repeat(60)}`);
  console.log('COMPARISON SUMMARY');
  console.log('='.repeat(60));

  console.log('\n📈 Readiness Scores:');
  results.forEach(r => {
    if (r) console.log(`  ${r.label.padEnd(10)}: ${r.readinessScore}%`);
  });

  console.log('\n🎯 Met Requirements:');
  results.forEach(r => {
    if (r) console.log(`  ${r.label.padEnd(10)}: ${r.met}/${r.totalCriteria}`);
  });

  console.log('\n⚠️  Critical Blockers:');
  results.forEach(r => {
    if (r) console.log(`  ${r.label.padEnd(10)}: ${r.criticalBlockers}`);
  });

  // Validation checks
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALIDATION');
  console.log('='.repeat(60));

  const goodScore = results[0]?.readinessScore || 0;
  const mediumScore = results[1]?.readinessScore || 0;
  const poorScore = results[2]?.readinessScore || 0;

  const goodMet = results[0]?.met || 0;
  const mediumMet = results[1]?.met || 0;
  const poorMet = results[2]?.met || 0;

  console.log(`\n✓ GOOD > MEDIUM? ${goodScore > mediumScore ? '✅ PASS' : '❌ FAIL'} (${goodScore}% vs ${mediumScore}%)`);
  console.log(`✓ MEDIUM > POOR? ${mediumScore > poorScore ? '✅ PASS' : '❌ FAIL'} (${mediumScore}% vs ${poorScore}%)`);
  console.log(`✓ GOOD > POOR? ${goodScore > poorScore ? '✅ PASS' : '❌ FAIL'} (${goodScore}% vs ${poorScore}%)`);
  console.log(`\n✓ GOOD met > MEDIUM met? ${goodMet > mediumMet ? '✅ PASS' : '❌ FAIL'} (${goodMet} vs ${mediumMet})`);
  console.log(`✓ MEDIUM met > POOR met? ${mediumMet > poorMet ? '✅ PASS' : '❌ FAIL'} (${mediumMet} vs ${poorMet})`);

  const allPass = goodScore > mediumScore && mediumScore > poorScore &&
                  goodMet > mediumMet && mediumMet > poorMet;

  console.log(`\n${'='.repeat(60)}`);
  console.log(allPass ? '✅ ALL VALIDATIONS PASSED' : '⚠️  SOME VALIDATIONS FAILED');
  console.log('='.repeat(60));
}

main().catch(console.error);
