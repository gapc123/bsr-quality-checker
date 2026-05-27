/**
 * Regulatory Context Constants (NEW-03)
 *
 * Maps matrix IDs and categories to the specific statutory clause that makes
 * the requirement mandatory and the consequence of non-compliance.
 *
 * Sources:
 *   BSA 2022  — Building Safety Act 2022
 *   CDM 2015  — Construction (Design and Management) Regulations 2015
 *   ADB       — Approved Document B (Fire Safety), Volume 2, 2019 ed. + amendments
 *   ADF       — Approved Document F (Ventilation), 2021 ed.
 *   BSR TGN   — BSR Technical Guidance Note
 *   PAS 8671  — PAS 8671:2022 Fire safety of external wall systems
 *   T&CPA     — Town and Country Planning Act 1990
 */

export interface RegulatoryContext {
  clause: string;       // Short citation shown on issue cards
  consequence: string;  // Why the BSR will reject or flag without this
}

// ---------------------------------------------------------------------------
// Per matrix-ID overrides (highest specificity)
// ---------------------------------------------------------------------------

export const MATRIX_ID_CONTEXT: Record<string, RegulatoryContext> = {
  // Principal Designer
  'SM-010': {
    clause: 'BSA 2022 s.36 · CDM Regulations 2015 reg.5',
    consequence: 'A legally competent Principal Designer must be appointed and evidenced before the BSR can process a Gateway 2 application.',
  },
  // Principal Contractor
  'SM-011': {
    clause: 'BSA 2022 s.36 · CDM Regulations 2015 reg.5',
    consequence: 'A legally competent Principal Contractor must be appointed and evidenced before the BSR can process a Gateway 2 application.',
  },
  // Golden Thread / information management strategy
  'SM-012': {
    clause: 'BSA 2022 s.85 · PAS 8671:2022',
    consequence: 'The accountable person must demonstrate a functioning golden thread information management system. Absence blocks Gateway 2 and Gateway 3 handover.',
  },
  // Design & Access Statement
  'SM-014': {
    clause: 'T&CPA 1990 s.77 · DMPO 2010 Art.9',
    consequence: 'A Design & Access Statement is a mandatory planning condition for higher-risk buildings. Its absence will be flagged as a missing statutory document.',
  },
  // Structural fire resistance
  'SM-009': {
    clause: 'ADB Vol 2 Table A2 · Building Regulations 2010 Part B',
    consequence: 'Structural elements must achieve the minimum fire resistance period. Missing or unspecified ratings are a principal cause of BSR rejection.',
  },
  // Height consistency
  'SM-020': {
    clause: 'BSR TGN-3 · ADB Vol 2 s.3',
    consequence: 'The BSR cross-checks the declared building height against Approved Document B thresholds. Contradictory values across documents trigger immediate information requests.',
  },
  // Fire Risk Assessment
  'SM-022': {
    clause: 'BSA 2022 s.85 · Fire Safety (England) Regulations 2022',
    consequence: 'A current Fire Risk Assessment is a mandatory submission document. The BSR will not progress an application without it.',
  },
  // Draft watermarks / document status
  'SM-027': {
    clause: 'BSR Submission Guidance v2.1 para 4.2',
    consequence: 'All submitted documents must be at issue-for-construction or final-for-submission status. Draft watermarks invalidate the document for BSR purposes.',
  },
  // Ventilation
  'SM-016': {
    clause: 'ADF 2010 s.4 · Building Regulations 2010 Part F',
    consequence: 'Ventilation rates and strategy type must be explicitly stated to demonstrate Approved Document F compliance.',
  },
};

// ---------------------------------------------------------------------------
// Category-level fallbacks (lower specificity — used when no ID match)
// ---------------------------------------------------------------------------

export const CATEGORY_CONTEXT: Record<string, RegulatoryContext> = {
  'Fire Safety': {
    clause: 'Building Regulations 2010 Part B · ADB Vol 2',
    consequence: 'Fire safety compliance is the primary BSR assessment criterion. Gaps in fire safety documentation are the most common cause of Gateway 2 rejection.',
  },
  'Structural': {
    clause: 'Building Regulations 2010 Part A · BS EN 1990',
    consequence: 'Structural design must be fully evidenced for all higher-risk buildings. Missing structural documentation results in automatic BSR rejection.',
  },
  'MEP Systems': {
    clause: 'Building Regulations 2010 Parts F, G, J · BSA 2022 s.83',
    consequence: 'MEP system documentation forms part of the Golden Thread. Without it, the accountable person cannot demonstrate lifecycle competence.',
  },
  'Submission': {
    clause: 'HRB Procedures Regulations 2023 · BSR Submission Guidance v2.1',
    consequence: 'Gateway 2 submission documents are mandatory under the Higher-Risk Buildings Procedures Regulations 2023. Missing items block the entire application.',
  },
  'Golden Thread': {
    clause: 'BSA 2022 s.83–85',
    consequence: 'Golden Thread obligations run from design through occupation. Absence of information management documentation prevents BSR sign-off and Gateway 3 handover.',
  },
  'HRB Duties': {
    clause: 'BSA 2022 s.36 · CDM Regulations 2015',
    consequence: 'Duty-holder appointments are a legal prerequisite. The BSR will not register an application without evidence of competent appointees.',
  },
  'Accessibility': {
    clause: 'Building Regulations 2010 Part M · Equality Act 2010',
    consequence: 'Non-compliance with accessibility requirements creates legal liability and will require costly post-construction remediation.',
  },
  'Design & Access': {
    clause: 'T&CPA 1990 s.77',
    consequence: 'A Design & Access Statement is a mandatory planning condition for higher-risk buildings.',
  },
  'CONSISTENCY': {
    clause: 'BSR TGN-3 · BSR Submission Guidance v2.1 para 3.1',
    consequence: 'The BSR cross-references values across all submitted documents. Contradictions trigger information requests and can halt the assessment.',
  },
};

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

/**
 * Returns the most specific regulatory context available for a given result.
 * Falls back from matrix ID → category → generic.
 */
export function getRegulatoryContext(matrixId: string, category: string): RegulatoryContext {
  return (
    MATRIX_ID_CONTEXT[matrixId] ??
    CATEGORY_CONTEXT[category] ?? {
      clause: 'Building Regulations 2010 · BSA 2022',
      consequence: 'Required for BSR Gateway 2 compliance.',
    }
  );
}
