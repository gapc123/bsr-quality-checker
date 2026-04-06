import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getRecentAssessments() {
  const versions = await prisma.packVersion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      pack: { select: { name: true } },
      documents: { select: { filename: true } }
    }
  });

  for (const version of versions) {
    console.log('\n' + '='.repeat(60));
    console.log(`Pack: ${version.pack.name}`);
    console.log(`Documents: ${version.documents.map(d => d.filename).join(', ')}`);

    if (version.matrixAssessment) {
      const assessment = typeof version.matrixAssessment === 'string'
        ? JSON.parse(version.matrixAssessment)
        : version.matrixAssessment;

      const results = assessment.results || [];
      const met = results.filter(r => r.status === 'meets').length;
      const partial = results.filter(r => r.status === 'partial').length;
      const doesNotMeet = results.filter(r => r.status === 'does_not_meet').length;
      const missing = results.filter(r => r.status === 'missing_information').length;

      console.log(`\nAssessment Results:`);
      console.log(`  Total: ${results.length}`);
      console.log(`  Met: ${met}`);
      console.log(`  Partial: ${partial}`);
      console.log(`  Does Not Meet: ${doesNotMeet}`);
      console.log(`  Missing Info: ${missing}`);
      console.log(`  Readiness: ${assessment.readiness_score || Math.round((met/results.length)*100)}%`);

      // Check for hallucination indicators
      console.log(`\nEvidence Quality Check:`);
      const hasEvidence = results.filter(r => r.pack_evidence?.found).length;
      const hasQuotes = results.filter(r => r.pack_evidence?.quote).length;
      const explicitEvidence = results.filter(r => r.evidence_quality === 'explicit').length;
      const absentEvidence = results.filter(r => r.evidence_quality === 'absent').length;

      console.log(`  Results with evidence found: ${hasEvidence}/${results.length}`);
      console.log(`  Results with quotes: ${hasQuotes}/${results.length}`);
      console.log(`  Explicit evidence: ${explicitEvidence}`);
      console.log(`  Absent evidence: ${absentEvidence}`);

      // Sample key results
      console.log(`\nKey Sample Results:`);
      const keyResults = results.filter(r =>
        r.status === 'meets' || (r.status === 'does_not_meet' && r.severity === 'high')
      ).slice(0, 3);

      for (const r of keyResults) {
        console.log(`\n  ${r.matrix_id}: ${r.matrix_title}`);
        console.log(`    Status: ${r.status}`);
        console.log(`    Evidence Quality: ${r.evidence_quality}`);
        console.log(`    Pack Evidence Found: ${r.pack_evidence?.found ? 'YES' : 'NO'}`);
        if (r.pack_evidence?.quote) {
          console.log(`    Quote: "${r.pack_evidence.quote.substring(0, 100)}..."`);
        }
        console.log(`    Reasoning: ${r.reasoning.substring(0, 200)}...`);
      }
    }
  }

  await prisma.$disconnect();
}

getRecentAssessments().catch(console.error);
