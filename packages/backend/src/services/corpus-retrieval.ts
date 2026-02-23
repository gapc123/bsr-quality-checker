/**
 * Corpus Retrieval Service
 *
 * Provides search functionality over extracted BSR reference documents.
 * Uses BM25-like keyword scoring to find relevant snippets.
 */

import fs from 'fs';
import path from 'path';

// In Docker, process.cwd() is /app. In dev, it's /packages/backend
const isProduction = process.env.NODE_ENV === 'production';
const EXTRACTED_DIR = isProduction
  ? path.join(process.cwd(), 'data', 'extracted')
  : path.join(process.cwd(), '..', '..', 'data', 'extracted');
const CATALOGUE_PATH = isProduction
  ? path.join(process.cwd(), 'knowledge', 'catalogue.json')
  : path.join(process.cwd(), '..', '..', 'knowledge', 'catalogue.json');

interface Catalogue {
  documents: Array<{
    doc_id: string;
    filename: string;
    title: string;
    topic_tags: string[];
    london_specific?: boolean;
    obligations: {
      must: Array<{ text: string; section: string; page: number | null }>;
      should: Array<{ text: string; section: string; page: number | null }>;
      may: Array<{ text: string; section: string; page: number | null }>;
    };
    summary_bullets: string[];
  }>;
}

export interface RetrievalResult {
  doc_id: string;
  doc_title: string;
  page_number: number | null;
  snippet: string;
  score: number;
  section?: string;
}

export interface ObligationResult {
  doc_id: string;
  doc_title: string;
  obligation_type: 'must' | 'should' | 'may';
  text: string;
  section: string;
  page: number | null;
}

// Load catalogue
let catalogue: Catalogue | null = null;

function loadCatalogue(): Catalogue {
  if (!catalogue) {
    const data = fs.readFileSync(CATALOGUE_PATH, 'utf-8');
    catalogue = JSON.parse(data);
  }
  return catalogue!;
}

// Get all page files for a document
function getDocumentPages(docId: string): Array<{ page: number; content: string }> {
  const cat = loadCatalogue();
  const doc = cat.documents.find(d => d.doc_id === docId);
  if (!doc) return [];

  const docDir = path.join(EXTRACTED_DIR, doc.filename);
  if (!fs.existsSync(docDir)) return [];

  const pages: Array<{ page: number; content: string }> = [];
  const files = fs.readdirSync(docDir).filter(f => f.endsWith('.txt')).sort();

  for (const file of files) {
    const match = file.match(/page_(\d+)\.txt/);
    if (match) {
      const pageNum = parseInt(match[1], 10);
      const content = fs.readFileSync(path.join(docDir, file), 'utf-8');
      pages.push({ page: pageNum, content });
    }
  }

  return pages;
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Simple BM25-like scoring
function scoreText(text: string, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const textLower = text.toLowerCase();

  let score = 0;
  for (const term of queryTerms) {
    try {
      const escapedTerm = escapeRegex(term);
      const regex = new RegExp(escapedTerm, 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        // BM25-like: diminishing returns for repeated terms
        score += Math.log(1 + matches.length) * (1 / Math.sqrt(queryTerms.length));
      }
    } catch {
      // Skip invalid regex terms
      continue;
    }
  }

  // Boost for exact phrase match
  if (textLower.includes(query.toLowerCase())) {
    score *= 2;
  }

  return score;
}

// Extract best snippet around matches
function extractSnippet(text: string, query: string, maxLength: number = 300): string {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const textLower = text.toLowerCase();

  // Find first occurrence of any query term
  let bestPos = -1;
  for (const term of queryTerms) {
    const pos = textLower.indexOf(term);
    if (pos !== -1 && (bestPos === -1 || pos < bestPos)) {
      bestPos = pos;
    }
  }

  if (bestPos === -1) {
    return text.slice(0, maxLength) + '...';
  }

  // Extract context around match
  const start = Math.max(0, bestPos - 100);
  const end = Math.min(text.length, bestPos + maxLength - 100);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet.replace(/\s+/g, ' ').trim();
}

/**
 * Search corpus for relevant snippets
 */
export function searchCorpus(
  query: string,
  options: {
    docIds?: string[];  // Limit to specific documents
    maxResults?: number;
    minScore?: number;
  } = {}
): RetrievalResult[] {
  const { docIds, maxResults = 5, minScore = 0.1 } = options;
  const cat = loadCatalogue();
  const results: RetrievalResult[] = [];

  const docsToSearch = docIds
    ? cat.documents.filter(d => docIds.includes(d.doc_id))
    : cat.documents;

  for (const doc of docsToSearch) {
    const pages = getDocumentPages(doc.doc_id);

    for (const { page, content } of pages) {
      const score = scoreText(content, query);

      if (score >= minScore) {
        results.push({
          doc_id: doc.doc_id,
          doc_title: doc.title,
          page_number: page,
          snippet: extractSnippet(content, query),
          score
        });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Get obligations from catalogue for specific documents
 */
export function getObligations(
  docIds: string[],
  obligationType?: 'must' | 'should' | 'may'
): ObligationResult[] {
  const cat = loadCatalogue();
  const results: ObligationResult[] = [];

  for (const docId of docIds) {
    const doc = cat.documents.find(d => d.doc_id === docId);
    if (!doc || !doc.obligations) continue;

    const types: Array<'must' | 'should' | 'may'> = obligationType
      ? [obligationType]
      : ['must', 'should', 'may'];

    for (const type of types) {
      for (const obl of doc.obligations[type] || []) {
        results.push({
          doc_id: doc.doc_id,
          doc_title: doc.title,
          obligation_type: type,
          text: obl.text,
          section: obl.section,
          page: obl.page
        });
      }
    }
  }

  return results;
}

/**
 * Get document summary bullets from catalogue
 */
export function getDocumentSummary(docId: string): string[] {
  const cat = loadCatalogue();
  const doc = cat.documents.find(d => d.doc_id === docId);
  return doc?.summary_bullets || [];
}

/**
 * Get document metadata from catalogue
 */
export function getDocumentMetadata(docId: string): Catalogue['documents'][0] | null {
  const cat = loadCatalogue();
  return cat.documents.find(d => d.doc_id === docId) || null;
}

/**
 * Search for specific requirement in corpus
 * Returns best matching snippet with citation
 */
export function findRequirementEvidence(
  requirement: string,
  docIds: string[]
): RetrievalResult | null {
  const results = searchCorpus(requirement, { docIds, maxResults: 1 });
  return results.length > 0 ? results[0] : null;
}

/**
 * Get all available document IDs from corpus
 */
export function getAvailableDocIds(): string[] {
  const cat = loadCatalogue();
  return cat.documents.map(d => d.doc_id);
}

/**
 * Check if a document exists in extracted corpus
 */
export function hasExtractedContent(docId: string): boolean {
  const cat = loadCatalogue();
  const doc = cat.documents.find(d => d.doc_id === docId);
  if (!doc) return false;

  const docDir = path.join(EXTRACTED_DIR, doc.filename);
  return fs.existsSync(docDir);
}

export default {
  searchCorpus,
  getObligations,
  getDocumentSummary,
  getDocumentMetadata,
  findRequirementEvidence,
  getAvailableDocIds,
  hasExtractedContent
};
