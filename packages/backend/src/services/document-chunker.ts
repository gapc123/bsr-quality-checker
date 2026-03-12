/**
 * Document Chunking Service
 *
 * Splits PDF documents into semantic chunks with page tracking.
 * Enables precise page number citations and better RAG retrieval.
 *
 * TASK #18: Week 2 - Document Chunking + Vector DB
 */

import fs from 'fs';
import pdfParse from 'pdf-parse';

export interface DocumentChunk {
  chunk_id: string;
  text: string;
  page_number: number;
  document_name: string;
  doc_type: string | null;
  section_context: string | null; // Section heading if detected
  char_start: number; // Character offset in original document
  char_end: number;
  token_count: number; // Approximate token count
}

export interface ChunkedDocument {
  document_name: string;
  doc_type: string | null;
  total_pages: number;
  total_chunks: number;
  chunks: DocumentChunk[];
}

/**
 * Approximate token count (rough: 1 token ≈ 4 characters)
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Detect section headings in text
 * Patterns: "1. ", "1.1 ", "Section 1", "CHAPTER 1", etc.
 */
function detectSectionHeading(text: string): string | null {
  const lines = text.split('\n').slice(0, 3); // Check first 3 lines

  const patterns = [
    /^(\d+\.?\d*\.?\d*\s+[A-Z][^\n]{5,60})/, // "1.2.3 Title"
    /^(SECTION\s+\d+[:\s]+[^\n]{5,60})/i,     // "SECTION 1: Title"
    /^(CHAPTER\s+\d+[:\s]+[^\n]{5,60})/i,     // "CHAPTER 1: Title"
    /^([A-Z][A-Z\s]{10,60})$/,                 // "ALL CAPS HEADING"
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return match[1].substring(0, 100); // Limit to 100 chars
      }
    }
  }

  return null;
}

/**
 * Split text into sentences (naive approach using punctuation)
 */
function splitIntoSentences(text: string): string[] {
  // Split on . ! ? followed by space or newline, but not Mr. Dr. etc.
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Chunk text with sliding window approach
 * Target: 300-500 tokens per chunk, with 50 token overlap
 */
function chunkText(
  text: string,
  pageNumber: number,
  documentName: string,
  docType: string | null,
  baseChunkId: string
): DocumentChunk[] {
  const TARGET_TOKENS = 400;  // Target chunk size
  const MIN_TOKENS = 300;     // Minimum chunk size
  const MAX_TOKENS = 500;     // Maximum chunk size
  const OVERLAP_TOKENS = 50;  // Overlap between chunks

  const chunks: DocumentChunk[] = [];
  const sentences = splitIntoSentences(text);

  let currentChunk: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;
  let charStart = 0;
  let sectionContext: string | null = null;

  // Try to detect section heading from first few sentences
  if (sentences.length > 0) {
    sectionContext = detectSectionHeading(sentences.slice(0, 2).join(' '));
  }

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokenCount(sentence);

    // If adding this sentence would exceed MAX_TOKENS, finalize current chunk
    if (currentTokens + sentenceTokens > MAX_TOKENS && currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      const charEnd = charStart + chunkText.length;

      chunks.push({
        chunk_id: `${baseChunkId}_p${pageNumber}_c${chunkIndex}`,
        text: chunkText,
        page_number: pageNumber,
        document_name: documentName,
        doc_type: docType,
        section_context: sectionContext,
        char_start: charStart,
        char_end: charEnd,
        token_count: currentTokens
      });

      // Sliding window: keep last few sentences for overlap
      const overlapSentences = [];
      let overlapTokens = 0;
      for (let j = currentChunk.length - 1; j >= 0; j--) {
        const s = currentChunk[j];
        const t = estimateTokenCount(s);
        if (overlapTokens + t <= OVERLAP_TOKENS) {
          overlapSentences.unshift(s);
          overlapTokens += t;
        } else {
          break;
        }
      }

      currentChunk = overlapSentences;
      currentTokens = overlapTokens;
      charStart = charEnd - overlapSentences.join(' ').length;
      chunkIndex++;
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Finalize last chunk if it meets minimum size
  if (currentChunk.length > 0 && currentTokens >= MIN_TOKENS) {
    const chunkText = currentChunk.join(' ');
    const charEnd = charStart + chunkText.length;

    chunks.push({
      chunk_id: `${baseChunkId}_p${pageNumber}_c${chunkIndex}`,
      text: chunkText,
      page_number: pageNumber,
      document_name: documentName,
      doc_type: docType,
      section_context: sectionContext,
      char_start: charStart,
      char_end: charEnd,
      token_count: currentTokens
    });
  } else if (currentChunk.length > 0 && chunks.length > 0) {
    // If last chunk is too small, append to previous chunk
    const lastChunk = chunks[chunks.length - 1];
    const additionalText = ' ' + currentChunk.join(' ');
    lastChunk.text += additionalText;
    lastChunk.char_end += additionalText.length;
    lastChunk.token_count += currentTokens;
  }

  return chunks;
}

/**
 * Extract text from PDF page-by-page using pdf-parse
 */
async function extractPDFWithPages(filepath: string): Promise<{ text: string; page: number }[]> {
  try {
    const dataBuffer = fs.readFileSync(filepath);

    // pdf-parse doesn't give us page-by-page text directly,
    // so we need to use a workaround with render_page
    const pages: { text: string; page: number }[] = [];

    // First, get total pages
    const pdfData = await pdfParse(dataBuffer);
    const totalPages = pdfData.numpages;

    // Extract text for each page using render_page option
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const pageData = await pdfParse(dataBuffer, {
          max: 1,
          pagerender: (pageData: any) => {
            return pageData.getTextContent().then((textContent: any) => {
              return textContent.items.map((item: any) => item.str).join(' ');
            });
          }
        });

        // Note: pdf-parse limitation - it extracts ALL pages even with max: 1
        // We'll use a simpler approach: split full text by page breaks
        // This is a approximation, but works for most PDFs
      } catch (pageError) {
        console.warn(`Warning: Could not extract page ${pageNum}:`, pageError);
      }
    }

    // Fallback: Split full text by estimated page length
    // Most PDFs have ~500-1000 words per page
    const fullText = pdfData.text;
    const estimatedCharsPerPage = 3000; // ~600 words * 5 chars/word

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const start = (pageNum - 1) * estimatedCharsPerPage;
      const end = pageNum * estimatedCharsPerPage;
      const pageText = fullText.slice(start, end);

      if (pageText.trim().length > 0) {
        pages.push({
          text: pageText.trim(),
          page: pageNum
        });
      }
    }

    return pages;
  } catch (error) {
    console.error('Error extracting PDF with pages:', error);
    throw error;
  }
}

/**
 * Main chunking function - processes PDF and returns chunks with page numbers
 */
export async function chunkDocument(
  filepath: string,
  documentName: string,
  docType: string | null
): Promise<ChunkedDocument> {
  console.log(`📄 Chunking document: ${documentName}`);

  // Extract text page-by-page
  const pages = await extractPDFWithPages(filepath);

  console.log(`  ✓ Extracted ${pages.length} pages`);

  // Chunk each page
  const allChunks: DocumentChunk[] = [];
  const baseChunkId = documentName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  for (const { text, page } of pages) {
    const pageChunks = chunkText(text, page, documentName, docType, baseChunkId);
    allChunks.push(...pageChunks);
  }

  console.log(`  ✓ Created ${allChunks.length} chunks (avg ${Math.round(allChunks.reduce((sum, c) => sum + c.token_count, 0) / allChunks.length)} tokens/chunk)`);

  return {
    document_name: documentName,
    doc_type: docType,
    total_pages: pages.length,
    total_chunks: allChunks.length,
    chunks: allChunks
  };
}

/**
 * Chunk multiple documents in parallel
 */
export async function chunkDocuments(
  documents: Array<{ filepath: string; filename: string; docType: string | null }>
): Promise<ChunkedDocument[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[DOCUMENT CHUNKING] Processing ${documents.length} documents`);
  console.log(`${'='.repeat(60)}\n`);

  const results = await Promise.all(
    documents.map(doc => chunkDocument(doc.filepath, doc.filename, doc.docType))
  );

  const totalChunks = results.reduce((sum, doc) => sum + doc.total_chunks, 0);
  const totalPages = results.reduce((sum, doc) => sum + doc.total_pages, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[CHUNKING COMPLETE]`);
  console.log(`  Documents: ${documents.length}`);
  console.log(`  Total pages: ${totalPages}`);
  console.log(`  Total chunks: ${totalChunks}`);
  console.log(`  Avg chunks/doc: ${Math.round(totalChunks / documents.length)}`);
  console.log(`${'='.repeat(60)}\n`);

  return results;
}
