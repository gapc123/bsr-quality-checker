/**
 * Document Integrity Checker
 *
 * Detects structural issues in submitted documents that indicate template
 * re-use, copy-paste errors, or misclassified files:
 *
 *  WRONG_DOCUMENT_TITLE   — filename/docType doesn't match internal content
 *  REPEATED_PARAGRAPH     — same substantial block appears ≥2× in one document
 *  CROSS_DOCUMENT_DUPLICATION — same substantial block appears in ≥2 documents
 *  CONTENT_MISMATCH       — document lacks the substantive keywords expected
 *                           for its declared type
 */

export type IntegrityCheckType =
  | 'WRONG_DOCUMENT_TITLE'
  | 'REPEATED_PARAGRAPH'
  | 'CROSS_DOCUMENT_DUPLICATION'
  | 'CONTENT_MISMATCH';

export interface IntegrityIssue {
  type: IntegrityCheckType;
  severity: 'high' | 'medium' | 'low';
  document: string;
  otherDocument?: string; // only for CROSS_DOCUMENT_DUPLICATION
  detail: string;
  excerpt?: string;       // the offending text snippet (≤200 chars)
}

// ============================================
// INTERNAL HELPERS
// ============================================

function normalise(text: string): string {
  return text
    .replace(/\[PAGE \d+\]\n?/g, '')  // strip page markers
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract substantial text blocks from a document.
 * Splits on double-newlines and filters to blocks with ≥MIN_BLOCK_CHARS chars.
 */
const MIN_BLOCK_CHARS = 120;
const MIN_CROSS_DOC_CHARS = 180; // higher bar for cross-doc comparison

function extractBlocks(text: string, minChars: number = MIN_BLOCK_CHARS): string[] {
  const clean = text.replace(/\[PAGE \d+\]\n?/g, '');
  return clean
    .split(/\n{2,}/)
    .map(b => b.replace(/\s+/g, ' ').trim())
    .filter(b => b.length >= minChars);
}

// ============================================
// KEYWORD MAPS FOR CONTENT MATCHING
// ============================================

/**
 * For each docType, the minimum number of keywords that must appear in
 * the document's first 5000 chars for it to be considered a genuine match.
 */
const DOC_TYPE_KEYWORDS: Record<string, { required: string[]; minMatches: number }> = {
  fire_strategy: {
    required: [
      'fire strategy', 'fire safety', 'means of escape', 'compartmentation',
      'fire resistance', 'sprinkler', 'detection', 'evacuation', 'fire engineer',
      'approved document b', 'ad b', 'fire suppression', 'structural fire',
    ],
    minMatches: 3,
  },
  structural: {
    required: [
      'structural', 'structure', 'foundation', 'load', 'concrete', 'steel',
      'reinforcement', 'eurocode', 'bearing', 'disproportionate collapse',
      'structural engineer', 'ground investigation',
    ],
    minMatches: 3,
  },
  mep: {
    required: [
      'mechanical', 'electrical', 'hvac', 'ventilation', 'plumbing',
      'drainage', 'heating', 'cooling', 'mep', 'services engineer',
    ],
    minMatches: 2,
  },
  drawings: {
    required: [
      'drawing', 'plan', 'elevation', 'section', 'scale', 'floor plan',
      'layout', 'general arrangement', 'ga drawing',
    ],
    minMatches: 2,
  },
  specifications: {
    required: [
      'specification', 'schedule', 'performance', 'standard', 'clause',
      'requirement', 'material', 'product',
    ],
    minMatches: 2,
  },
};

/**
 * Expected content keywords in the HEADER / TITLE area (first 500 chars)
 * when a filename implies a particular document type.
 */
const TITLE_AREA_KEYWORDS: Record<string, string[]> = {
  fire_strategy: ['fire', 'strategy', 'safety'],
  structural:    ['structural', 'structure', 'engineering', 'foundation'],
  mep:           ['mechanical', 'electrical', 'services', 'hvac', 'mep'],
  drawings:      ['drawing', 'plan', 'elevation', 'layout'],
  specifications:['specification', 'schedule', 'spec'],
};

// ============================================
// CHECK 1: WRONG_DOCUMENT_TITLE
// ============================================

function checkWrongDocumentTitle(
  doc: { filename: string; docType: string | null; extractedText: string }
): IntegrityIssue | null {
  const { docType, filename, extractedText } = doc;
  if (!docType) return null; // can't assess if unclassified

  const expectedKeywords = TITLE_AREA_KEYWORDS[docType];
  if (!expectedKeywords) return null;

  // Look at first 500 chars of content (title / header area)
  const headerArea = normalise(extractedText.slice(0, 500));
  const matches = expectedKeywords.filter(kw => headerArea.includes(kw));

  if (matches.length === 0) {
    return {
      type: 'WRONG_DOCUMENT_TITLE',
      severity: 'high',
      document: filename,
      detail:
        `File "${filename}" is classified as "${docType}" based on its name, ` +
        `but the document header contains none of the expected keywords: ` +
        `${expectedKeywords.join(', ')}.`,
      excerpt: extractedText.replace(/\[PAGE \d+\]\n?/g, '').slice(0, 200).trim(),
    };
  }

  return null;
}

// ============================================
// CHECK 2: REPEATED_PARAGRAPH
// ============================================

function checkRepeatedParagraphs(
  doc: { filename: string; extractedText: string }
): IntegrityIssue[] {
  const blocks = extractBlocks(doc.extractedText);
  const seen = new Map<string, number>(); // normalised → count

  for (const block of blocks) {
    const key = normalise(block);
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  const issues: IntegrityIssue[] = [];
  for (const [key, count] of seen) {
    if (count >= 2) {
      issues.push({
        type: 'REPEATED_PARAGRAPH',
        severity: 'medium',
        document: doc.filename,
        detail:
          `A text block of ${key.length} characters appears ${count} times in ` +
          `"${doc.filename}". This may indicate template copy-paste.`,
        excerpt: key.slice(0, 200),
      });
    }
  }

  return issues;
}

// ============================================
// CHECK 3: CROSS_DOCUMENT_DUPLICATION
// ============================================

function checkCrossDocumentDuplication(
  docs: Array<{ filename: string; extractedText: string }>
): IntegrityIssue[] {
  if (docs.length < 2) return [];

  // Build a map: normalised block → list of doc filenames that contain it
  const blockToFiles = new Map<string, Set<string>>();

  for (const doc of docs) {
    const blocks = extractBlocks(doc.extractedText, MIN_CROSS_DOC_CHARS);
    for (const block of blocks) {
      const key = normalise(block);
      if (!blockToFiles.has(key)) blockToFiles.set(key, new Set());
      blockToFiles.get(key)!.add(doc.filename);
    }
  }

  // Find blocks appearing in ≥2 distinct documents
  // Group by document pair to avoid an explosion of issues
  const pairIssues = new Map<string, { count: number; excerpt: string }>();

  for (const [key, files] of blockToFiles) {
    if (files.size < 2) continue;
    const sorted = [...files].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const pairKey = `${sorted[i]}||${sorted[j]}`;
        const existing = pairIssues.get(pairKey);
        if (!existing) {
          pairIssues.set(pairKey, { count: 1, excerpt: key.slice(0, 200) });
        } else {
          existing.count++;
        }
      }
    }
  }

  const issues: IntegrityIssue[] = [];
  for (const [pairKey, { count, excerpt }] of pairIssues) {
    // Only flag if ≥2 blocks match (reduces false positives from shared legal text)
    if (count < 2) continue;
    const [docA, docB] = pairKey.split('||');
    issues.push({
      type: 'CROSS_DOCUMENT_DUPLICATION',
      severity: 'medium',
      document: docA,
      otherDocument: docB,
      detail:
        `"${docA}" and "${docB}" share ${count} identical substantial text block(s). ` +
        `This may indicate template re-use or copy-paste without customisation.`,
      excerpt,
    });
  }

  return issues;
}

// ============================================
// CHECK 4: CONTENT_MISMATCH
// ============================================

function checkContentMismatch(
  doc: { filename: string; docType: string | null; extractedText: string }
): IntegrityIssue | null {
  const { docType, filename, extractedText } = doc;
  if (!docType) return null;

  const spec = DOC_TYPE_KEYWORDS[docType];
  if (!spec) return null;

  // Search full document (up to first 5000 chars) for expected keywords
  const searchArea = normalise(extractedText.slice(0, 5000));
  const matchedKeywords = spec.required.filter(kw => searchArea.includes(kw));

  if (matchedKeywords.length < spec.minMatches) {
    return {
      type: 'CONTENT_MISMATCH',
      severity: 'high',
      document: filename,
      detail:
        `"${filename}" is classified as "${docType}" but only contains ` +
        `${matchedKeywords.length} of the minimum ${spec.minMatches} expected ` +
        `substantive keywords. Found: [${matchedKeywords.join(', ') || 'none'}]. ` +
        `Missing examples: [${spec.required.filter(k => !matchedKeywords.includes(k)).slice(0, 4).join(', ')}].`,
    };
  }

  return null;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Run all four integrity checks against the provided document set.
 * Returns an array of issues (empty = all clear).
 */
export function checkDocumentIntegrity(
  docs: Array<{ filename: string; docType: string | null; extractedText: string }>
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  for (const doc of docs) {
    const titleIssue = checkWrongDocumentTitle(doc);
    if (titleIssue) issues.push(titleIssue);

    const mismatchIssue = checkContentMismatch(doc);
    if (mismatchIssue) issues.push(mismatchIssue);

    const repeatIssues = checkRepeatedParagraphs(doc);
    issues.push(...repeatIssues);
  }

  const crossDocIssues = checkCrossDocumentDuplication(docs);
  issues.push(...crossDocIssues);

  return issues;
}
