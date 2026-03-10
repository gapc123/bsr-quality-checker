/**
 * Debug script to check if matrixAssessment data exists in database
 */
import prisma from './db/client.js';

async function checkAssessments() {
  console.log('🔍 Checking for saved assessments in database...\n');

  // Get all pack versions
  const versions = await prisma.packVersion.findMany({
    include: {
      pack: {
        include: {
          client: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${versions.length} pack versions\n`);

  for (const version of versions) {
    console.log(`📦 Pack: ${version.pack.name}`);
    console.log(`   Client: ${version.pack.client?.name || 'No client'}`);
    console.log(`   Version: ${version.versionNumber}`);
    console.log(`   Created: ${version.createdAt.toISOString()}`);
    console.log(`   Has matrixAssessment: ${version.matrixAssessment ? 'YES ✅' : 'NO ❌'}`);

    if (version.matrixAssessment) {
      try {
        const assessment = JSON.parse(version.matrixAssessment);
        console.log(`   Assessment structure:`);
        console.log(`     - has results: ${assessment.results ? 'YES' : 'NO'}`);
        console.log(`     - results count: ${assessment.results?.length || 0}`);
        console.log(`     - has pack_context: ${assessment.pack_context ? 'YES' : 'NO'}`);
      } catch (error) {
        console.log(`   ⚠️  Error parsing matrixAssessment: ${error}`);
      }
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkAssessments().catch(console.error);
