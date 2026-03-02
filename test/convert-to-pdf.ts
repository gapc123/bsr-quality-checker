/**
 * Convert text files to PDFs
 * Uses a simple approach with PDFKit or similar
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SAMPLE_DIR = path.join(__dirname, 'sample-documents');

async function convertToPDF() {
  const txtFiles = fs.readdirSync(SAMPLE_DIR).filter(f => f.endsWith('.txt'));

  console.log(`\n📄 Converting ${txtFiles.length} text files to PDF...\n`);

  for (const txtFile of txtFiles) {
    const txtPath = path.join(SAMPLE_DIR, txtFile);
    const pdfFile = txtFile.replace('.txt', '.pdf');
    const pdfPath = path.join(SAMPLE_DIR, pdfFile);

    try {
      // Use macOS textutil to convert (built-in on macOS)
      await execAsync(`textutil -convert html "${txtPath}" -output "${txtPath}.html"`);
      await execAsync(`/System/Library/Printers/Libraries/convert -f "${txtPath}.html" -o "${pdfPath}" || cupsfilter "${txtPath}.html" > "${pdfPath}"`);

      // Clean up HTML
      fs.unlinkSync(`${txtPath}.html`);

      console.log(`✓ ${txtFile} → ${pdfFile}`);
    } catch (error) {
      console.log(`✗ Failed with textutil, trying alternative method for ${txtFile}...`);

      // Alternative: Try enscript + ps2pdf if available
      try {
        const psPath = txtPath.replace('.txt', '.ps');
        await execAsync(`enscript -B -f Courier10 -o "${psPath}" "${txtPath}"`);
        await execAsync(`ps2pdf "${psPath}" "${pdfPath}"`);
        fs.unlinkSync(psPath);
        console.log(`✓ ${txtFile} → ${pdfFile} (using enscript)`);
      } catch (error2) {
        console.log(`✗ Could not convert ${txtFile}. Install dependencies or use Python method.`);
      }
    }
  }

  console.log('\n✅ Conversion complete!\n');
}

convertToPDF().catch(console.error);
