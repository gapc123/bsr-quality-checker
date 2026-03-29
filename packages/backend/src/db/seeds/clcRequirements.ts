/**
 * clcRequirements.ts — CLC Guidance Suite seeded reference constants
 *
 * Source document:
 *   "Building Control for a New Higher-Risk Building — Guidance Suite"
 *   Construction Leadership Council (CLC) / Building Safety Regulator
 *
 * Every constant includes a `source` field tracing to the exact page and
 * section of the ingested document. No data in this file is inferred or
 * extrapolated — all values are quoted or paraphrased directly from the
 * cited passages.
 *
 * VERSION KEYS
 *   guidanceSuiteVersion: composite string of the individual note versions
 *   present at the time of ingestion. Update when a new note version is published.
 */

import prisma from '../client';

// ---------------------------------------------------------------------------
// Guidance suite version identifier
// ---------------------------------------------------------------------------

export const GUIDANCE_SUITE_VERSION =
  'GN04-v1.0-21/07/25_GN06-v2.0-18/12/25';

// ---------------------------------------------------------------------------
// 1. ICJ Framework — Guidance Note 04 §1.3, page 12
// ---------------------------------------------------------------------------

/**
 * Source: CLC Guidance Suite — Guidance Note 04 "Application Information Schedule"
 *         Version 1.0 (21/07/25), page 12, §1.3
 *
 * Verbatim passage:
 *   "An application for Building Control Approval should provide quality, detailed
 *    information that clearly and comprehensively demonstrates how the design and
 *    construction of the HRB will comply with the Building Regulations 2010 (as
 *    amended). This should be done through:
 *    • Identifying – every aspect of the project that requires compliance with
 *      Building Regulations, including structural and fire safety.
 *    • Clarifying – which standard, code or approach will be used to demonstrate
 *      compliance, with an explanation of why it is the most appropriate.
 *    • Justifying – how the functional requirements have been met, with clear and
 *      comprehensible narrative referring to suitably labelled plans and drawings."
 */
export const ICJ_FRAMEWORK = {
  source: {
    document: 'CLC Guidance Suite — Building Control for a New Higher-Risk Building',
    guidanceNote: '04',
    noteTitle: 'Application Information Schedule',
    version: '1.0',
    versionDate: '21/07/25',
    page: 12,
    section: '§1.3',
  },
  definitions: [
    {
      step: 'I',
      label: 'Identifying',
      description:
        'every aspect of the project that requires compliance with Building Regulations, including structural and fire safety.',
    },
    {
      step: 'C',
      label: 'Clarifying',
      description:
        'which standard, code or approach will be used to demonstrate compliance, with an explanation of why it is the most appropriate.',
    },
    {
      step: 'J',
      label: 'Justifying',
      description:
        'how the functional requirements have been met, with clear and comprehensible narrative referring to suitably labelled plans and drawings.',
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// 2. Statutory documents — Guidance Note 06 §4.6, page 22
// ---------------------------------------------------------------------------

/**
 * Source: CLC Guidance Suite — Guidance Note 06 "Application Document Management
 *         and Submission", Version 2.0 (18/12/25), page 22, §4.6
 *
 * Verbatim passage (left column of §4.6 table, "File Titles – Statutory Documents"):
 *   Site Plan | Drawings and Plans | Competence Declaration |
 *   Construction Control Plan | Change Control Plan |
 *   Mandatory Occurrence Reporting Plan | Building Regulations Compliance Statement |
 *   Fire and Emergency File | Partial Completion Strategy |
 *   Client Authorisation Statement
 *
 * Note: §4.4 states "If a document is referred to in legislation, then use this
 * exact wording as a clear file name". These titles are therefore both the
 * mandated file names AND the statutory document identifiers.
 */
export const STATUTORY_DOCUMENTS = {
  source: {
    document: 'CLC Guidance Suite — Building Control for a New Higher-Risk Building',
    guidanceNote: '06',
    noteTitle: 'Application Document Management and Submission',
    version: '2.0',
    versionDate: '18/12/25',
    page: 22,
    section: '§4.6',
  },
  titles: [
    'Site Plan',
    'Drawings and Plans',
    'Competence Declaration',
    'Construction Control Plan',
    'Change Control Plan',
    'Mandatory Occurrence Reporting Plan',
    'Building Regulations Compliance Statement',
    'Fire and Emergency File',
    'Partial Completion Strategy',
    'Client Authorisation Statement',
  ],
} as const;

// ---------------------------------------------------------------------------
// 3. Non-statutory recommended documents — Guidance Note 06 §4.6 and §5.1, page 22
// ---------------------------------------------------------------------------

/**
 * Source: CLC Guidance Suite — Guidance Note 06 "Application Document Management
 *         and Submission", Version 2.0 (18/12/25), page 22, §4.6 (right column)
 *         and §5.1
 *
 * Verbatim passage (§4.6 right column, "File Titles – Non-Statutory Documents"):
 *   Application Folder Structure and Contents Schedule |
 *   Application Information Schedule | Application Project Brief |
 *   Application Strategy
 *
 * Confirmed by §5.1:
 *   "The CLC guidance suite recommends a number of additional documents that can
 *    be used and submitted to support an application:
 *    • Application Folder Structure and Contents Schedule;
 *    • Application Information Schedule;
 *    • Application Project Brief; and
 *    • Application Strategy."
 *
 * Submission location (§5.2): sub-folder titled "General Application Information",
 * uploaded at the Drawings and Plans stage of the BSR online portal.
 */
export const NON_STATUTORY_RECOMMENDED_DOCUMENTS = {
  source: {
    document: 'CLC Guidance Suite — Building Control for a New Higher-Risk Building',
    guidanceNote: '06',
    noteTitle: 'Application Document Management and Submission',
    version: '2.0',
    versionDate: '18/12/25',
    page: 22,
    section: '§4.6 and §5.1',
  },
  titles: [
    'Application Folder Structure and Contents Schedule',
    'Application Information Schedule',
    'Application Project Brief',
    'Application Strategy',
  ],
  submissionSubFolder: 'General Application Information',
  submissionPortalStage: 'Drawings and Plans',
} as const;

// ---------------------------------------------------------------------------
// 4. AIS columns and primary-allocation rule — Guidance Note 04 §3.2–3.4, page 13
// ---------------------------------------------------------------------------

/**
 * Source: CLC Guidance Suite — Guidance Note 04 "Application Information Schedule"
 *         Version 1.0 (21/07/25), page 13, §3.2–3.4
 *
 * Verbatim passages:
 *   §3.2 "The Schedule is divided into three columns: 1) Approved Documents;
 *          2) Information provided with the application; and 3) Information
 *          provided with Approval with Requirements."
 *   §3.3 "It is key that each file listed within both columns 2 and 3 are
 *          referenced and allocated to the respective Approved Document."
 *   §3.4 "Each file should be allocated only once to the primary Approved
 *          Document and not to multiple Approved Documents."
 */
export const AIS_COLUMNS = {
  source: {
    document: 'CLC Guidance Suite — Building Control for a New Higher-Risk Building',
    guidanceNote: '04',
    noteTitle: 'Application Information Schedule',
    version: '1.0',
    versionDate: '21/07/25',
    page: 13,
    section: '§3.2–3.4',
  },
  columns: [
    {
      number: 1,
      heading: 'Approved Documents',
      description: 'The Approved Document (Schedule 1 functional requirement) to which files are allocated.',
    },
    {
      number: 2,
      heading: 'Information provided with the application',
      description: 'Files submitted as part of the main Gateway 2 Building Control Approval application.',
    },
    {
      number: 3,
      heading: 'Information provided with Approval with Requirements',
      description: 'Files to be submitted at a later date under an agreed Approval with Requirements plan.',
    },
  ],
  primaryAllocationRule:
    'Each file should be allocated only once to the primary Approved Document and not to multiple Approved Documents. (GN04 §3.4)',
  crossReferenceRule:
    'Each file listed within both columns 2 and 3 must be referenced and allocated to the respective Approved Document. (GN04 §3.3)',
} as const;

// ---------------------------------------------------------------------------
// 5. File and sub-folder naming rules — Guidance Note 06 §4, pages 21–22
// ---------------------------------------------------------------------------

/**
 * Source: CLC Guidance Suite — Guidance Note 06 "Application Document Management
 *         and Submission", Version 2.0 (18/12/25), pages 21–22, §3.7 and §4.1–4.5
 *
 * Verbatim passages:
 *   §3.7  "Sub-folder names should only use letters, numbers, spaces, hyphens and
 *           underscores. Do not use special characters."
 *   §4.1  "A file reference should be clearly identifiable."
 *   §4.2  "A file must be: PDF format; Smaller than 1GB; and Named using only
 *           letters, numbers, spaces, hyphens and underscores.
 *           Do not use special characters."
 *   §4.3  "Use a clear file title describing what a document or plan relates to.
 *           The aim is to avoid a file needing to be opened to identify what it is."
 *   §4.4  "If a document is referred to in legislation, then use this exact wording
 *           as a clear file name (e.g. Target Emissions Rating)."
 *   §4.5  "Non-statutory recommended documents (e.g. Application Project Brief)
 *           should also be clearly titled."
 */
export const FILE_NAMING_RULES = {
  source: {
    document: 'CLC Guidance Suite — Building Control for a New Higher-Risk Building',
    guidanceNote: '06',
    noteTitle: 'Application Document Management and Submission',
    version: '2.0',
    versionDate: '18/12/25',
    pages: '21–22',
    section: '§3.7 and §4.1–4.5',
  },
  fileRules: [
    {
      ref: '§4.1',
      rule: 'A file reference should be clearly identifiable.',
    },
    {
      ref: '§4.2',
      rule: 'A file must be: PDF format; smaller than 1 GB; named using only letters, numbers, spaces, hyphens and underscores. Do not use special characters.',
    },
    {
      ref: '§4.3',
      rule: 'Use a clear file title describing what a document or plan relates to. The aim is to avoid a file needing to be opened to identify what it is.',
    },
    {
      ref: '§4.4',
      rule: 'If a document is referred to in legislation, use this exact wording as the file name (e.g. "Target Emissions Rating").',
    },
    {
      ref: '§4.5',
      rule: 'Non-statutory recommended documents (e.g. Application Project Brief) should also be clearly titled.',
    },
  ],
  subFolderRules: [
    {
      ref: '§3.7',
      rule: 'Sub-folder names should only use letters, numbers, spaces, hyphens and underscores. Do not use special characters.',
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

export async function seedClcRequirements(): Promise<void> {
  await prisma.clcRequirements.upsert({
    where: { guidanceSuiteVersion: GUIDANCE_SUITE_VERSION },
    update: {
      icjFramework: JSON.stringify(ICJ_FRAMEWORK),
      statutoryDocuments: JSON.stringify(STATUTORY_DOCUMENTS),
      nonStatutoryDocuments: JSON.stringify(NON_STATUTORY_RECOMMENDED_DOCUMENTS),
      aisColumns: JSON.stringify(AIS_COLUMNS),
      fileNamingRules: JSON.stringify(FILE_NAMING_RULES),
    },
    create: {
      guidanceSuiteVersion: GUIDANCE_SUITE_VERSION,
      icjFramework: JSON.stringify(ICJ_FRAMEWORK),
      statutoryDocuments: JSON.stringify(STATUTORY_DOCUMENTS),
      nonStatutoryDocuments: JSON.stringify(NON_STATUTORY_RECOMMENDED_DOCUMENTS),
      aisColumns: JSON.stringify(AIS_COLUMNS),
      fileNamingRules: JSON.stringify(FILE_NAMING_RULES),
    },
  });

  console.log(
    `[seed] clc_requirements upserted for version: ${GUIDANCE_SUITE_VERSION}`
  );
}
