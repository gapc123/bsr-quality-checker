/**
 * classifier.ts — Document-to-Approved-Document-Part classifier
 *
 * Three-tier classification strategy; stops at first match.
 * Per CLC Guidance Note 04 §3.4 (p.13): every document maps to exactly one
 * primary Approved Document Part — never multiple.
 *
 * Tier 1 — folder name  → confidence: high
 * Tier 2 — filename     → confidence: medium
 * Tier 3 — LLM fallback → confidence: low
 *
 * Source citations:
 *   Sub-folder naming rules: CLC GN06 §3.7, p.21
 *     "Sub-folder names should only use letters, numbers, spaces, hyphens
 *      and underscores. Do not use special characters."
 *   Statutory file titles: CLC GN06 §4.6, p.22
 *   Single-primary-part rule: CLC GN04 §3.4, p.13
 */

import path from 'path';
import { DocumentChunk } from './ingest';
import { ApprovedDocumentPart } from '../types';
import { groundedCall, SourcePassage } from './groundedLLM';

// ---------------------------------------------------------------------------
// Tier 1 / Tier 2 keyword lookup
// Keys are lowercased; longest-key-wins substring match applied at runtime.
// Per CLC GN06 §3.7 (p.21), sub-folder names use letters, numbers, spaces,
// hyphens, and underscores — this table covers common conventions.
// ---------------------------------------------------------------------------

const FOLDER_SIGNALS: Record<string, ApprovedDocumentPart> = {
  'structure':     'A',
  'structural':    'A',
  'fire':          'B',
  'fire safety':   'B',
  'drainage':      'H',
  'acoustic':      'E',
  'sound':         'E',
  'ventilation':   'F1',
  'energy':        'L',
  'access':        'M',
  'accessibility': 'M',
  'combustion':    'J',
  'waterproof':    'C',
  'cladding':      'C',
  'glazing':       'N',
  'security':      'Q',
  'electrical':    'P',
  'sanitation':    'G',
  'overheating':   'O',
  'ev charging':   'S',
  'infrastructure':'R',
  'toilet':        'T',
};

// ---------------------------------------------------------------------------
// Tier 2 — CLC statutory title matching
// Source: CLC GN06 §4.6, p.22 — "File Titles – Statutory Documents"
// Maps exact statutory file titles to their primary Approved Document Part.
// 'Building Regulations Compliance Statement' is cross-cutting and carries
// no single-part assignment — it is excluded from this map.
// ---------------------------------------------------------------------------

const STATUTORY_TITLE_SIGNALS: Record<string, ApprovedDocumentPart> = {
  'fire and emergency file': 'B',
};

// ---------------------------------------------------------------------------
// Valid ApprovedDocumentPart values (for LLM response validation)
// ---------------------------------------------------------------------------

const VALID_PARTS = new Set<string>([
  'A', 'B', 'C', 'D', 'E', 'F1', 'F2',
  'G', 'H', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Substring-match `target` against a signals map.
 * Longest key wins to prevent short keys (e.g. 'access') incorrectly
 * matching longer strings (e.g. 'accessibility').
 */
function matchAgainst(
  target: string,
  signals: Record<string, ApprovedDocumentPart>
): ApprovedDocumentPart | null {
  const lower = target.toLowerCase();
  let bestPart: ApprovedDocumentPart | null = null;
  let bestKeyLen = 0;

  for (const [key, part] of Object.entries(signals)) {
    if (lower.includes(key) && key.length > bestKeyLen) {
      bestPart = part;
      bestKeyLen = key.length;
    }
  }

  return bestPart;
}

/**
 * Parse and validate the LLM's single-token response.
 * Maps bare "F" to "F1" (ventilation dwellings as default).
 * Returns null if the token is not a valid ApprovedDocumentPart.
 */
function parseLlmPartResponse(raw: string): ApprovedDocumentPart | null {
  const token = raw.trim().toUpperCase().split(/\s+/)[0];
  if (token === 'F') return 'F1';
  if (VALID_PARTS.has(token)) return token as ApprovedDocumentPart;
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a document (represented as DocumentChunk[]) to a single primary
 * Approved Document Part.
 *
 * Per CLC Guidance Note 04 §3.4 (p.13): "Each file should be allocated only
 * once to the primary Approved Document and not to multiple Approved Documents."
 */
export async function classifyDocument(
  chunks: DocumentChunk[]
): Promise<{ part: ApprovedDocumentPart; confidence: 'high' | 'medium' | 'low' }> {
  if (chunks.length === 0) {
    throw new Error('classifyDocument: chunks array is empty');
  }

  const filename = chunks[0].filename;

  // -------------------------------------------------------------------------
  // Tier 1 — folder name (confidence: high)
  // Per CLC GN06 §3.7 (p.21), sub-folder names use only letters, numbers,
  // spaces, hyphens, and underscores — this lookup is safe for those names.
  // path.dirname returns '.' for plain basenames with no directory component;
  // in that case Tier 1 cannot fire and we fall through immediately.
  // -------------------------------------------------------------------------
  const folder = path.dirname(filename);
  if (folder && folder !== '.') {
    const folderName = path.basename(folder);
    const match = matchAgainst(folderName, FOLDER_SIGNALS);
    if (match) {
      return { part: match, confidence: 'high' };
    }
  }

  // -------------------------------------------------------------------------
  // Tier 2 — filename stem (confidence: medium)
  // Two signals applied in order:
  //   (a) FOLDER_SIGNALS keyword lookup on the filename stem
  //   (b) Exact CLC statutory title match (GN06 §4.6, p.22)
  // -------------------------------------------------------------------------
  const ext = path.extname(filename);
  const stem = path.basename(filename, ext);

  const stemMatch = matchAgainst(stem, FOLDER_SIGNALS);
  if (stemMatch) {
    return { part: stemMatch, confidence: 'medium' };
  }

  const statutoryMatch = matchAgainst(stem, STATUTORY_TITLE_SIGNALS);
  if (statutoryMatch) {
    return { part: statutoryMatch, confidence: 'medium' };
  }

  // -------------------------------------------------------------------------
  // Tier 3 — LLM fallback (confidence: low)
  // Pass the first 3 chunks as source passages.
  // If the response is not a valid ApprovedDocumentPart, default to 'A'
  // and log a warning.
  // -------------------------------------------------------------------------
  const passages: SourcePassage[] = chunks.slice(0, 3).map((chunk) => ({
    filename: chunk.filename,
    page: chunk.pageNumber,
    section: chunk.sectionHeading || 'Unknown section',
    text: chunk.text,
  }));

  const prompt =
    'Which single Building Regulations Schedule 1 Part (A–T) does this document ' +
    'primarily address? Reply with the Part letter only.';

  let llmResponse: string;
  try {
    const result = await groundedCall(prompt, passages, '', 64);
    llmResponse = result.content;
  } catch (err) {
    console.warn('[classifier] LLM fallback failed:', err);
    return { part: 'A', confidence: 'low' };
  }

  const parsed = parseLlmPartResponse(llmResponse);
  if (!parsed) {
    console.warn(
      `[classifier] LLM returned unrecognised part "${llmResponse}" for "${filename}" — defaulting to 'A'.`
    );
    return { part: 'A', confidence: 'low' };
  }

  return { part: parsed, confidence: 'low' };
}
