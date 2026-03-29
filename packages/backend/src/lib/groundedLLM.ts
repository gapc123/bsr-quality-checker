/**
 * groundedLLM.ts — Grounded Output Enforcement Layer
 *
 * All user-facing LLM calls must route through groundedCall().
 * Direct anthropic.messages.create() calls are not permitted for user-facing output.
 *
 * Enforcement:
 *   1. Source passages are injected verbatim into every prompt.
 *   2. The LLM is instructed to cite every factual claim as [filename, p.N, §Section].
 *   3. Post-processing flags sentences with factual content but no citation.
 *   4. One automatic retry is issued for any uncited sentences found.
 */

import { callClaude } from '../services/claude';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface SourcePassage {
  filename: string;
  page: number;
  section: string;
  text: string;
}

export interface GroundedResponse {
  content: string;
  uncitedSentences: string[];
  isClean: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUNDING_SYSTEM_INSTRUCTION = `Every factual claim in your response must be followed immediately by a citation in the format [filename, p.N, §Section]. If you cannot cite a claim from the provided source passages, write "Not found in submitted documents" instead of the claim. Do not summarise — quote the relevant passage directly.`;

/**
 * Matches the required citation format: [filename, p.N, §Section]
 * Allows any text for filename and section, digits for page number.
 */
const CITATION_REGEX = /\[[^\],]+,\s*p\.\d+,\s*§[^\]]+\]/;

/**
 * Heuristic: a sentence is "factual" if it contains a number, a proper noun
 * (word starting with a capital letter mid-sentence), or a known technical term.
 * Technical terms relevant to BSR/building safety are listed below.
 */
const BSR_TECHNICAL_TERMS = [
  'HRB', 'higher-risk building', 'principal accountable person', 'accountable person',
  'building safety case', 'safety case report', 'golden thread', 'residents panel',
  'building assessment certificate', 'mandatory occurrence', 'prescribed fire risk',
  'Regulation', 'Section', 'Act', 'BSA', 'BSR', 'HSE', 'gateway', 'competence',
  'fire risk assessment', 'structural risk', 'remediation', 'cladding',
];
const TECHNICAL_TERM_PATTERN = new RegExp(BSR_TECHNICAL_TERMS.join('|'), 'i');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the SOURCE PASSAGES block appended to the user message.
 */
function buildPassagesBlock(passages: SourcePassage[]): string {
  if (passages.length === 0) return '';

  const numbered = passages
    .map(
      (p, i) =>
        `[${i + 1}] ${p.filename} | p.${p.page} | §${p.section}\n${p.text}`
    )
    .join('\n\n');

  return `\n\n---\nSOURCE PASSAGES (cite using [filename, p.N, §Section]):\n\n${numbered}\n---`;
}

/**
 * Split text into sentences on . ! ? boundaries, preserving the delimiter.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Returns true if a sentence contains factual content that requires a citation.
 * Heuristic: contains a digit, a mid-sentence capital word, or a BSR technical term.
 */
function isFactualSentence(sentence: string): boolean {
  if (TECHNICAL_TERM_PATTERN.test(sentence)) return true;
  if (/\d/.test(sentence)) return true;
  // Mid-sentence proper noun: capital letter after a space (not at sentence start)
  if (/\s[A-Z][a-z]/.test(sentence)) return true;
  return false;
}

/**
 * Validate citations in a response. Returns sentences that appear factual
 * but carry no [filename, p.N, §Section] citation.
 */
function validateCitations(response: string): string[] {
  const sentences = splitSentences(response);
  return sentences.filter(
    (s) => isFactualSentence(s) && !CITATION_REGEX.test(s)
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * groundedCall — the single entry point for all user-facing LLM calls.
 *
 * @param userPrompt   The core user-facing prompt (without passages).
 * @param passages     Source passages retrieved for this query.
 * @param systemPrompt Optional additional system instructions. The grounding
 *                     instruction is always prepended.
 * @param maxTokens    Forwarded to the underlying callClaude wrapper.
 */
export async function groundedCall(
  userPrompt: string,
  passages: SourcePassage[],
  systemPrompt: string = '',
  maxTokens: number = 4096
): Promise<GroundedResponse> {
  const groundedSystem = systemPrompt
    ? `${GROUNDING_SYSTEM_INSTRUCTION}\n\n${systemPrompt}`
    : GROUNDING_SYSTEM_INSTRUCTION;

  const fullUserMessage = userPrompt + buildPassagesBlock(passages);

  // --- First attempt ---
  const firstResponse = await callClaude(
    groundedSystem,
    [{ role: 'user', content: fullUserMessage }],
    maxTokens
  );

  const uncitedFirst = validateCitations(firstResponse);

  if (uncitedFirst.length === 0) {
    return { content: firstResponse, uncitedSentences: [], isClean: true };
  }

  // --- Single retry with uncited sentences flagged ---
  const retryPrefix =
    `Your previous response had uncited claims: ${uncitedFirst.join(' | ')}. ` +
    `Cite each from the SOURCE PASSAGES using [filename, p.N, §Section], or replace with "Not found in submitted documents".`;

  const retryUserMessage = retryPrefix + '\n\n' + fullUserMessage;

  const retryResponse = await callClaude(
    groundedSystem,
    [{ role: 'user', content: retryUserMessage }],
    maxTokens
  );

  const uncitedRetry = validateCitations(retryResponse);

  return {
    content: retryResponse,
    uncitedSentences: uncitedRetry,
    isClean: uncitedRetry.length === 0,
  };
}
