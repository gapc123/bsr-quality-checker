import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import pdfParse from 'pdf-parse';
import prisma from '../db/client.js';

const execFileAsync = promisify(execFile);

/**
 * Use pdftotext (poppler) to extract text from a PDF.
 * Returns null if pdftotext is not available (e.g. local dev without poppler).
 * Handles all standard PDF encodings including FlateDecode and ASCII85.
 */
async function extractTextViaPdftotext(filepath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('pdftotext', ['-q', filepath, '-']);
    return stdout;
  } catch {
    return null;
  }
}
import { classifyDocType } from '../utils/textUtils.js';

type LibraryType = 'pack' | 'baseline' | 'butler';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export interface ChunkData {
  text: string;
  pageRef: number;
  chunkIndex: number;
}

export interface DocumentInfo {
  filename: string;
  filepath: string;
  docType: string | null;
  isScanned: boolean;
  pageCount: number;
  chunks: ChunkData[];
}

// classifyDocType imported from ../utils/textUtils.js (canonical 10-type version)

// Split text into chunks with overlap
function chunkText(text: string, pageRef: number): ChunkData[] {
  const chunks: ChunkData[] = [];
  let index = 0;
  let chunkIndex = 0;

  while (index < text.length) {
    const end = Math.min(index + CHUNK_SIZE, text.length);
    const chunkText = text.slice(index, end).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        pageRef,
        chunkIndex,
      });
      chunkIndex++;
    }

    index += CHUNK_SIZE - CHUNK_OVERLAP;
    if (index >= text.length) break;
  }

  return chunks;
}

// Process text by page and create chunks
function processTextByPage(pdfData: pdfParse.Result): ChunkData[] {
  const allChunks: ChunkData[] = [];
  const text = pdfData.text;

  // Simple page detection - split by form feeds or estimate by content length
  const pages = text.split(/\f/);

  if (pages.length > 1) {
    // PDF has form feed page markers
    pages.forEach((pageText, pageIndex) => {
      const pageChunks = chunkText(pageText, pageIndex + 1);
      allChunks.push(...pageChunks);
    });
  } else {
    // Estimate pages based on character count (avg ~2000 chars per page)
    const charsPerPage = 2000;
    const estimatedPages = Math.ceil(text.length / charsPerPage);

    for (let i = 0; i < estimatedPages; i++) {
      const start = i * charsPerPage;
      const end = Math.min((i + 1) * charsPerPage, text.length);
      const pageText = text.slice(start, end);
      const pageChunks = chunkText(pageText, i + 1);
      allChunks.push(...pageChunks);
    }
  }

  // Re-index chunks globally
  allChunks.forEach((chunk, index) => {
    chunk.chunkIndex = index;
  });

  return allChunks;
}

// Extract text and create chunks from a PDF file
export async function processPDF(filepath: string): Promise<DocumentInfo> {
  const filename = path.basename(filepath);
  const dataBuffer = fs.readFileSync(filepath);

  let text: string;
  let pageCount = 1;

  // pdftotext (poppler) handles all standard encodings incl. FlateDecode/ASCII85.
  // Falls back to pdf-parse in environments where poppler is not installed (local dev).
  const pdftotextOutput = await extractTextViaPdftotext(filepath);
  if (pdftotextOutput !== null) {
    text = pdftotextOutput.trim();
    try {
      const meta = await pdfParse(dataBuffer, { max: 0 });
      pageCount = meta.numpages;
    } catch { /* page count unavailable — not critical */ }
  } else {
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text.trim();
    pageCount = pdfData.numpages;
  }

  if (text.length < 100) {
    const err = new Error(
      'This PDF appears to be image-only (e.g. a scanned document). ' +
      'Please provide a searchable PDF, or use OCR software to add a text layer before uploading.'
    ) as NodeJS.ErrnoException;
    err.code = 'SCANNED_PDF';
    throw err;
  }

  const chunks = processTextByPage({ text, numpages: pageCount } as pdfParse.Result);
  const docType = classifyDocType(filename, text);

  return {
    filename,
    filepath,
    docType,
    isScanned: false,
    pageCount,
    chunks,
  };
}

// Ingest a PDF and store in database
export async function ingestDocument(
  filepath: string,
  libraryType: LibraryType,
  packVersionId?: string,
  source?: string
): Promise<string> {
  const docInfo = await processPDF(filepath);

  // Create document record
  const document = await prisma.document.create({
    data: {
      filename: docInfo.filename,
      filepath: docInfo.filepath,
      docType: docInfo.docType,
      libraryType,
      packVersionId,
      source,
      chunks: {
        create: docInfo.chunks.map((chunk) => ({
          text: chunk.text,
          pageRef: chunk.pageRef,
          chunkIndex: chunk.chunkIndex,
        })),
      },
    },
  });

  return document.id;
}

// Search chunks by keyword
export async function searchChunks(
  keywords: string[],
  libraryTypes?: LibraryType[]
): Promise<
  Array<{
    documentId: string;
    filename: string;
    docType: string | null;
    text: string;
    pageRef: number;
  }>
> {
  const results: Array<{
    documentId: string;
    filename: string;
    docType: string | null;
    text: string;
    pageRef: number;
  }> = [];

  // Build where clause for library types
  const whereClause = libraryTypes
    ? { document: { libraryType: { in: libraryTypes } } }
    : {};

  // Get all chunks (in production, use full-text search or embeddings)
  const chunks = await prisma.chunk.findMany({
    where: whereClause,
    include: {
      document: true,
    },
  });

  // Simple keyword matching
  for (const chunk of chunks) {
    const lowerText = chunk.text.toLowerCase();
    const matches = keywords.some((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (matches) {
      results.push({
        documentId: chunk.documentId,
        filename: chunk.document.filename,
        docType: chunk.document.docType,
        text: chunk.text,
        pageRef: chunk.pageRef,
      });
    }
  }

  return results;
}

export default {
  processPDF,
  ingestDocument,
  searchChunks,
};
