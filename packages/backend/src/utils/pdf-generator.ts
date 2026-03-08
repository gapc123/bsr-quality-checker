/**
 * PDF Generation Utility
 *
 * Centralized PDF generation using Puppeteer
 * Avoids code duplication across multiple export routes
 */

import puppeteer from 'puppeteer';
import path from 'path';
import os from 'os';
import fs from 'fs';

const PUPPETEER_OPTIONS = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

export interface PDFOptions {
  format?: 'A4' | 'Letter';
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
}

/**
 * Generate PDF from HTML string
 *
 * @param html - HTML content to convert to PDF
 * @param filename - Output filename (used for temp file)
 * @param options - PDF generation options
 * @returns Path to generated PDF file
 */
export async function generatePDFFromHTML(
  html: string,
  filename: string,
  options: PDFOptions = {}
): Promise<string> {
  const {
    format = 'A4',
    marginTop = '0.75in',
    marginBottom = '0.75in',
    marginLeft = '0.75in',
    marginRight = '0.75in',
  } = options;

  // Create temporary PDF file
  const tempFile = path.join(os.tmpdir(), `${filename}-${Date.now()}.pdf`);

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: tempFile,
      format,
      margin: {
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight,
      },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  return tempFile;
}

/**
 * Stream PDF file to HTTP response and cleanup
 *
 * @param tempFilePath - Path to temporary PDF file
 * @param res - Express response object
 * @param downloadFilename - Filename for download
 */
export function streamPDFToResponse(
  tempFilePath: string,
  res: any, // Express Response
  downloadFilename: string
): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${downloadFilename}"`
  );

  const fileStream = fs.createReadStream(tempFilePath);
  fileStream.pipe(res);

  // Cleanup after sending
  fileStream.on('end', () => {
    fs.unlinkSync(tempFilePath);
  });
}
