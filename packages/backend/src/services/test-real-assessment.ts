/**
 * Test script to run real assessment with enhanced reporting
 */

import { PrismaClient } from '@prisma/client';
import { runMatrixAssessment } from './analysis.js';
import { getMatrixReportContent } from './report.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function testRealAssessment() {
  try {
    console.log('Loading real pack data from database...\n');

    const versionId = 'cd2de6d7-85f7-4675-97e2-2689d4f819dc';

    // Load pack version with documents
    const version = await prisma.packVersion.findUnique({
      where: { id: versionId },
      include: {
        documents: true,
        pack: true
      }
    });

    if (!version) {
      throw new Error('Pack version not found');
    }

    console.log(`Pack: ${version.pack.name}`);
    console.log(`Version: ${version.versionNumber}`);
    console.log(`Documents: ${version.documents.length}\n`);

    version.documents.forEach(doc => {
      console.log(`  - ${doc.filename} (${doc.docType})`);
    });

    console.log('\n========================================');
    console.log('Running matrix assessment...');
    console.log('========================================\n');

    // Run assessment (this will process documents, run assessment, and store results)
    const assessment = await runMatrixAssessment(versionId);

    console.log('Assessment complete!');
    console.log(`Results: ${assessment.results.length} criteria assessed`);
    console.log(`Passed: ${assessment.criteria_summary.meets}`);
    console.log(`Partial: ${assessment.criteria_summary.partial}`);
    console.log(`Failed: ${assessment.criteria_summary.does_not_meet}`);
    console.log(`Readiness score: ${assessment.readiness_score}%\n`);

    console.log('========================================');
    console.log('Generating enhanced report...');
    console.log('========================================\n');

    // Generate report
    const result = await getMatrixReportContent(versionId);

    // Save report
    const reportsDir = path.join(process.cwd(), '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `enhanced-report-${version.pack.name}-v${version.versionNumber}.md`);
    fs.writeFileSync(reportPath, result.markdown);

    console.log(`✅ Report saved to: ${reportPath}\n`);
    console.log('========================================');
    console.log('ENHANCED REPORT PREVIEW (first 3000 chars)');
    console.log('========================================\n');
    console.log(result.markdown.substring(0, 3000));
    console.log('\n... (report continues)\n');
    console.log('========================================');
    console.log(`Full report: ${reportPath}`);
    console.log('========================================');

  } catch (error) {
    console.error('Error running assessment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testRealAssessment().catch(console.error);
