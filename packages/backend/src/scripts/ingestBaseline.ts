import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../db/client.js';
import { ingestDocument } from '../services/ingestion.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_DIR = path.join(__dirname, '..', '..', '..', '..', 'data', 'reference');

async function ingestBaselineDocuments() {
  console.log('Ingesting baseline reference documents...');
  console.log(`Looking in: ${REFERENCE_DIR}`);

  // Ensure directory exists
  if (!fs.existsSync(REFERENCE_DIR)) {
    console.log('Reference directory does not exist. Creating it...');
    fs.mkdirSync(REFERENCE_DIR, { recursive: true });
    console.log('Place your baseline PDF documents in: data/reference/');
    return;
  }

  // Get all PDFs in the reference directory
  const files = fs.readdirSync(REFERENCE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.log('No PDF files found in data/reference/');
    console.log('Place your baseline documents (Approved Document B, BS 9991, etc.) there.');
    return;
  }

  console.log(`Found ${files.length} PDF files`);

  // Check which are already ingested
  const existingDocs = await prisma.document.findMany({
    where: { libraryType: 'baseline' },
    select: { filename: true },
  });
  const existingFilenames = new Set(existingDocs.map(d => d.filename));

  let ingested = 0;
  let skipped = 0;

  for (const file of files) {
    if (existingFilenames.has(file)) {
      console.log(`  Skipping (already exists): ${file}`);
      skipped++;
      continue;
    }

    const filepath = path.join(REFERENCE_DIR, file);
    console.log(`  Ingesting: ${file}`);

    try {
      await ingestDocument(filepath, 'baseline');
      ingested++;
    } catch (error) {
      console.error(`  Error ingesting ${file}:`, error);
    }
  }

  console.log(`\nDone. Ingested: ${ingested}, Skipped: ${skipped}`);
}

// Run if called directly
ingestBaselineDocuments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
