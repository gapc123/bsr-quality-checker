/**
 * Test script to generate PDF and Excel exports
 */
import fs from 'fs';
import { generateSubmissionReadinessHTML } from './dist/templates/submission-readiness-report.js';
import { generateComplianceMatrix } from './dist/services/compliance-matrix.js';
import { generateComplianceMatrixExcel } from './dist/services/excel-export.js';
import { generatePDFFromHTML } from './dist/utils/pdf-generator.js';

async function test() {
  console.log('📊 Testing export generation...\n');

  // Load sample assessment
  const rawData = JSON.parse(
    fs.readFileSync('temp-uploads/9d6109ba-8367-4e03-9848-4e2ae8f527b3.json', 'utf8')
  );

  // Extract the actual assessment structure
  const assessmentData = rawData.results;

  console.log(`✓ Loaded assessment with ${assessmentData.results.length} results\n`);

  // Test 1: Generate Submission Readiness PDF
  console.log('1️⃣  Generating Submission Readiness PDF...');
  try {
    const html = generateSubmissionReadinessHTML(assessmentData);
    console.log(`   ✓ HTML generated (${html.length} chars)`);

    const pdfPath = await generatePDFFromHTML(html, 'test-submission-readiness');
    console.log(`   ✓ PDF saved: ${pdfPath}\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }

  // Test 2: Generate Excel Matrix
  console.log('2️⃣  Generating Evidence Matrix Excel...');
  try {
    const matrix = generateComplianceMatrix(assessmentData, 'Test Project');
    console.log(`   ✓ Matrix generated:`);
    console.log(`     - Total requirements: ${matrix.totalRequirements}`);
    console.log(`     - Met: ${matrix.met}`);
    console.log(`     - Partial: ${matrix.partial}`);
    console.log(`     - Not Met: ${matrix.notMet}`);
    console.log(`     - Compliance rate: ${matrix.complianceRate}%`);

    const buffer = await generateComplianceMatrixExcel(matrix);
    const excelPath = 'test-evidence-matrix.xlsx';
    fs.writeFileSync(excelPath, buffer);
    console.log(`   ✓ Excel saved: ${excelPath} (${buffer.length} bytes)\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }

  console.log('✅ Export test complete!');
}

test().catch(console.error);
