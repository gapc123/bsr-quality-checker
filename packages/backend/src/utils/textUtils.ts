/**
 * Shared text utilities
 *
 * Single source of truth for patterns and functions used across multiple
 * modules. Import from here rather than duplicating inline.
 */

// ============================================
// PAGE MARKER UTILITIES
// ============================================

/**
 * Regex that matches a [PAGE N] marker plus an optional trailing newline,
 * as injected by the pdf-parse pagerender callback in quick-assess.ts.
 */
export const PAGE_MARKER_RE = /\[PAGE \d+\]\n?/g;

/**
 * Regex that CAPTURES the page number from a [PAGE N] marker.
 * Use with matchAll() to extract page numbers.
 */
export const PAGE_MARKER_CAPTURE_RE = /\[PAGE (\d+)\]/g;

/**
 * Strip all [PAGE N] markers from a text string.
 */
export function stripPageMarkers(text: string): string {
  return text.replace(PAGE_MARKER_RE, '');
}

// ============================================
// DOCUMENT TYPE CLASSIFICATION
// ============================================

/**
 * Map a document filename + content to a canonical docType string.
 * Returns null if no pattern matches.
 *
 * This is the canonical, most-complete version — 10 document types.
 * Previously duplicated between services/ingestion.ts (10 types) and
 * routes/quick-assess.ts (5 types, missing risk_assessment, compliance,
 * evacuation, smoke_control, facade).
 */
export function classifyDocType(filename: string, text: string): string | null {
  const lowerFilename = filename.toLowerCase();
  const lowerText = text.toLowerCase().slice(0, 5000);

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
