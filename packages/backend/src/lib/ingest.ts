/**
 * ingest.ts — PDF Ingestion Pipeline
 *
 * Converts an uploaded PDF into DocumentChunk[], one chunk per page.
 * This is the sole entry point for raw PDF text into the pipeline.
 * All downstream functions must consume DocumentChunk[] — no raw PDF
 * text is permitted beyond this module.
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DocumentChunk {
  /** Basename of the source file, e.g. "fire-strategy-rev-b.pdf" */
  filename: string;
  /** Revision string extracted from the cover page or filename, e.g. "Rev B", "P03". Empty if not found. */
  revision: string;
  /** 1-based page number */
  pageNumber: number;
  /** Nearest preceding heading-style line on this page. Empty if none found. */
  sectionHeading: string;
  /** Raw extracted text for this page */
  text: string;
}

// ---------------------------------------------------------------------------
// Revision detection
// ---------------------------------------------------------------------------

/**
 * Revision patterns:
 *   Rev A / RevA / Rev 1 / Rev B2 / REV-C  → captured group 0
 *   P01 / P03 / P12                         → captured group 1
 */
const REVISION_PATTERNS: RegExp[] = [
  /Rev\s?[-–]?\s?([A-Z0-9]+)/i,
  /\bP(\d{2})\b/,
];

/**
 * Scan the first two pages of text for a revision identifier.
 * Also falls back to checking the filename itself.
 */
function detectRevision(coverText: string, filename: string): string {
  const searchTargets = [coverText, filename];

  for (const target of searchTargets) {
    for (const pattern of REVISION_PATTERNS) {
      const match = target.match(pattern);
      if (match) {
        // Reconstruct canonical form
        const raw = match[0].trim();
        return raw;
      }
    }
  }

  return '';
}

// ---------------------------------------------------------------------------
// Section heading detection
// ---------------------------------------------------------------------------

/**
 * A line is treated as a section heading if it is:
 *   - ALL CAPS with ≥ 4 words and no trailing sentence punctuation, OR
 *   - Title Case with ≥ 4 words and no trailing sentence punctuation
 *
 * "No trailing sentence punctuation" means the line does not end with . ! ? : ;
 */
const TRAILING_PUNCTUATION = /[.!?:;]$/;

function isTitleCase(line: string): boolean {
  // Every word starts with a capital letter (ignoring short stop-words ≤ 3 chars)
  const words = line.split(/\s+/);
  return words.every((w) => w.length <= 3 || /^[A-Z]/.test(w));
}

function isAllCaps(line: string): boolean {
  return line === line.toUpperCase() && /[A-Z]/.test(line);
}

/**
 * Scan lines top-to-bottom and return the last heading-style line found
 * before (or at) the current position.  Returns empty string if none found.
 */
function detectSectionHeading(pageText: string): string {
  const lines = pageText.split('\n');
  let lastHeading = '';

  for (const raw of lines) {
    const line = raw.trim();
    const words = line.split(/\s+/).filter(Boolean);

    if (words.length < 4) continue;
    if (TRAILING_PUNCTUATION.test(line)) continue;

    if (isAllCaps(line) || isTitleCase(line)) {
      lastHeading = line;
    }
  }

  return lastHeading;
}

// ---------------------------------------------------------------------------
// Per-page PDF extraction
// ---------------------------------------------------------------------------

/**
 * Extract text for every page using pdf-parse's pagerender callback.
 * Returns an array indexed 0 … (n-1), where index 0 = page 1.
 */
async function extractPages(buffer: Buffer): Promise<string[]> {
  const pages: string[] = [];

  await pdfParse(buffer, {
    pagerender(pageData: any): Promise<string> {
      return pageData.getTextContent().then((content: any) => {
        const pageText: string = content.items
          .map((item: any) => item.str as string)
          .join(' ');
        pages.push(pageText);
        return pageText;
      });
    },
  });

  return pages;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ingest a PDF file and return one DocumentChunk per page.
 *
 * @param filePath  Absolute or relative path to the uploaded PDF.
 */
export async function ingestPDF(filePath: string): Promise<DocumentChunk[]> {
  const filename = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);

  const pageTexts = await extractPages(buffer);

  if (pageTexts.length === 0) {
    throw new Error(`ingestPDF: no pages extracted from "${filename}"`);
  }

  // Detect revision from first two pages combined + filename
  const coverText = pageTexts.slice(0, 2).join('\n');
  const revision = detectRevision(coverText, filename);

  const chunks: DocumentChunk[] = pageTexts.map((text, idx) => ({
    filename,
    revision,
    pageNumber: idx + 1,
    sectionHeading: detectSectionHeading(text),
    text: text.trim(),
  }));

  return chunks;
}
