import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import prisma from '../db/client.js';

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

// Classify document type based on filename and content keywords
function classifyDocType(filename: string, text: string): string | null {
  const lowerFilename = filename.toLowerCase();
  const lowerText = text.toLowerCase().slice(0, 5000); // Check first 5000 chars

  const typePatterns: { type: string; patterns: string[] }[] = [
    {
      type: 'fire_strategy',
      patterns: ['fire strategy', 'fire safety strategy', 'fire engineering'],
    },
    {
      type: 'drawings',
      patterns: ['drawing', 'plan', 'elevation', 'section', 'layout'],
    },
    {
      type: 'structural',
      patterns: ['structural', 'structure', 'load', 'foundation'],
    },
    {
      type: 'mep',
      patterns: ['mechanical', 'electrical', 'plumbing', 'mep', 'hvac'],
    },
    {
      type: 'specifications',
      patterns: ['specification', 'spec', 'schedule'],
    },
    {
      type: 'risk_assessment',
      patterns: ['risk assessment', 'risk register', 'hazard'],
    },
    {
      type: 'compliance',
      patterns: ['compliance', 'building regulations', 'approved document'],
    },
    {
      type: 'evacuation',
      patterns: ['evacuation', 'egress', 'escape', 'exit'],
    },
    {
      type: 'smoke_control',
      patterns: ['smoke control', 'smoke ventilation', 'smoke extract'],
    },
    {
      type: 'facade',
      patterns: ['facade', 'cladding', 'external wall', 'curtain wall'],
    },
  ];

  for (const { type, patterns } of typePatterns) {
    for (const pattern of patterns) {
      if (lowerFilename.includes(pattern) || lowerText.includes(pattern)) {
        return type;
      }
    }
  }

  return null;
}

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

  const pdfData = await pdfParse(dataBuffer);

  const text = pdfData.text.trim();
  const isScanned = text.length < 100; // Very little text = likely scanned

  const chunks = isScanned ? [] : processTextByPage(pdfData);
  const docType = classifyDocType(filename, text);

  return {
    filename,
    filepath,
    docType,
    isScanned,
    pageCount: pdfData.numpages,
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
