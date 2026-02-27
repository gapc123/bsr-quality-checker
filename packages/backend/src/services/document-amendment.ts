/**
 * Document Amendment Service
 *
 * Generates amended documents based on user-accepted changes from the carousel.
 * Produces:
 * 1. Amended Word document with changes highlighted
 * 2. PDF version of the amended document
 * 3. Outstanding Issues report for skipped criteria
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
  LevelFormat,
  CheckBox,
} from 'docx';
import prisma from '../db/client.js';
import { FullAssessment, AssessmentResult } from './matrix-assessment.js';

// In Docker, process.cwd() is /app. In dev, it's /packages/backend
const isProduction = process.env.NODE_ENV === 'production';
const REPORTS_DIR = isProduction
  ? path.join(process.cwd(), 'reports')
  : path.join(process.cwd(), '..', '..', 'reports');

// Puppeteer configuration for Docker
const PUPPETEER_OPTIONS = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  executablePath: isProduction ? '/usr/bin/chromium' : undefined
};

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

interface AcceptedChange {
  matrix_id: string;
  proposed_change: string;
}

// Keywords that indicate human intervention is required even if proposed_change exists
const HUMAN_INTERVENTION_KEYWORDS = [
  'new document',
  'new report',
  'new drawing',
  'create a',
  'prepare a',
  'commission',
  'engage',
  'specialist',
  'expert',
  'professional',
  'engineer',
  'consultant',
  'surveyor',
  'fire safety',
  'structural',
  'certification',
  'certificate',
  'testing',
  'test result',
  'physical',
  'site visit',
  'inspection',
  'independent',
  'third party',
  'third-party',
  'assessment by',
  'review by',
  'sign-off',
  'sign off',
  'approval from',
  'missing document',
  'document not provided',
  'not included',
  'not found',
  'absent',
  'no evidence',
  'tbc',
  'to be confirmed',
  'to be determined',
  'not specified',
  'competence',
  'competency',
  'qualification',
  'appointment',
  'appoint',
  'principal contractor',
  'principal designer',
  'dutyholder',
  'responsible person',
];

// Patterns that indicate the proposed_change is NOT a real actionable text change
const GENERIC_CHANGE_PATTERNS = [
  /^add documentation addressing/i,
  /^add documentation for/i,
  /^add information about/i,
  /^provide documentation/i,
  /^include documentation/i,
  /^document the/i,
  /^provide evidence/i,
  /^include evidence/i,
  /^add evidence/i,
  /states? ["']?tbc["']?/i,
  /without explaining/i,
  /needs to be provided/i,
  /should be provided/i,
  /must be provided/i,
  /requires additional/i,
];

/**
 * Check if a criterion requires human intervention based on its content
 */
function requiresHumanIntervention(criterion: AssessmentResult): boolean {
  // No proposed change = definitely human intervention
  if (!criterion.proposed_change) {
    return true;
  }

  const proposedChange = criterion.proposed_change;
  const proposedChangeLower = proposedChange.toLowerCase();

  // Check if the proposed change is a generic "add documentation" prompt
  // rather than actual text that can be inserted
  for (const pattern of GENERIC_CHANGE_PATTERNS) {
    if (pattern.test(proposedChange)) {
      return true;
    }
  }

  // Check if the proposed change is too short to be meaningful text
  // Real actionable changes should have substantial content
  if (proposedChange.length < 100 && proposedChangeLower.includes('add')) {
    return true;
  }

  const reasoningLower = criterion.reasoning?.toLowerCase() || '';
  const gapsLower = criterion.gaps_identified.map(g => g.toLowerCase()).join(' ');
  const actionsLower = criterion.actions_required.map(a => a.action.toLowerCase()).join(' ');

  // Check if the proposed change or reasoning contains human intervention keywords
  const combinedText = `${proposedChangeLower} ${reasoningLower} ${gapsLower} ${actionsLower}`;

  for (const keyword of HUMAN_INTERVENTION_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      return true;
    }
  }

  // Check if pack evidence was not found AND no document exists to modify
  if (!criterion.pack_evidence.found && !criterion.pack_evidence.document) {
    return true;
  }

  return false;
}

interface AmendmentRequest {
  packVersionId: string;
  acceptedChanges: AcceptedChange[];
  skippedCriteriaIds: string[];
}

interface AmendmentResult {
  amendedDocx: { filename: string; downloadUrl: string };
  amendedPdf: { filename: string; downloadUrl: string };
  outstandingIssues: { filename: string; downloadUrl: string };
}

// Color palette
const COLORS = {
  primary: '1e40af',      // Deep blue
  secondary: '475569',    // Slate
  accent: '0ea5e9',       // Sky blue
  success: '16a34a',      // Green
  warning: 'd97706',      // Amber
  danger: 'dc2626',       // Red
  muted: '64748b',        // Gray
  highlight: 'FEF08A',    // Yellow highlight
  lightBg: 'F8FAFC',      // Light background
  border: 'E2E8F0',       // Border gray
};

/**
 * Main function to generate all amended documents
 */
export async function generateAmendedDocuments(
  request: AmendmentRequest
): Promise<AmendmentResult> {
  const { packVersionId, acceptedChanges, skippedCriteriaIds } = request;

  // Get pack version data
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      pack: true,
      documents: true,
    },
  });

  if (!packVersion || !packVersion.matrixAssessment) {
    throw new Error(`Pack version not found or no assessment: ${packVersionId}`);
  }

  const assessment: FullAssessment = JSON.parse(packVersion.matrixAssessment);
  const packName = packVersion.pack.name.replace(/[^a-zA-Z0-9]/g, '-');
  const versionNum = packVersion.versionNumber;

  // Generate all three documents
  const [docxPath, pdfPath, issuesPath] = await Promise.all([
    generateAmendedDocx(packVersion, assessment, acceptedChanges, skippedCriteriaIds),
    generateAmendedPdf(packVersion, assessment, acceptedChanges),
    generateOutstandingIssuesReport(packVersion, assessment, skippedCriteriaIds),
  ]);

  // Generate download URLs (relative to API)
  const baseUrl = `/api/packs/${packVersion.packId}/versions/${packVersionId}/download-amended`;

  return {
    amendedDocx: {
      filename: path.basename(docxPath),
      downloadUrl: `${baseUrl}/docx`,
    },
    amendedPdf: {
      filename: path.basename(pdfPath),
      downloadUrl: `${baseUrl}/pdf`,
    },
    outstandingIssues: {
      filename: path.basename(issuesPath),
      downloadUrl: `${baseUrl}/issues`,
    },
  };
}

/**
 * Create a horizontal rule paragraph
 */
function createHorizontalRule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.border },
    },
    spacing: { before: 200, after: 200 },
  });
}

/**
 * Create a section header with styling
 */
function createSectionHeader(text: string, level: 1 | 2 | 3 = 1): Paragraph {
  const sizes = { 1: 32, 2: 26, 3: 22 };
  const colors = { 1: COLORS.primary, 2: COLORS.secondary, 3: COLORS.muted };

  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizes[level],
        color: colors[level],
      }),
    ],
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 400 : 300, after: 200 },
    border: level === 1 ? {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.primary },
    } : undefined,
  });
}

/**
 * Create a callout box
 */
function createCalloutBox(title: string, content: string, type: 'info' | 'warning' | 'success' = 'info'): Paragraph[] {
  const bgColors = { info: 'EFF6FF', warning: 'FEF3C7', success: 'ECFDF5' };
  const borderColors = { info: COLORS.primary, warning: COLORS.warning, success: COLORS.success };
  const titleColors = { info: COLORS.primary, warning: COLORS.warning, success: COLORS.success };

  return [
    new Paragraph({
      children: [
        new TextRun({ text: title, bold: true, size: 22, color: titleColors[type] }),
      ],
      shading: { fill: bgColors[type], type: ShadingType.CLEAR },
      border: {
        left: { style: BorderStyle.SINGLE, size: 24, color: borderColors[type] },
        top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
      spacing: { before: 200 },
      indent: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: content, size: 20 }),
      ],
      shading: { fill: bgColors[type], type: ShadingType.CLEAR },
      border: {
        left: { style: BorderStyle.SINGLE, size: 24, color: borderColors[type] },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
      },
      spacing: { after: 200 },
      indent: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
    }),
  ];
}

/**
 * Generate Word document with accepted changes highlighted
 */
async function generateAmendedDocx(
  packVersion: any,
  assessment: FullAssessment,
  acceptedChanges: AcceptedChange[],
  skippedCriteriaIds: string[]
): Promise<string> {
  const packName = packVersion.pack.name.replace(/[^a-zA-Z0-9]/g, '-');
  const versionNum = packVersion.versionNumber;
  const projectName = packVersion.projectName || packVersion.pack.name;
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build accepted changes lookup
  const changesMap = new Map<string, string>();
  acceptedChanges.forEach(c => changesMap.set(c.matrix_id, c.proposed_change));

  // Get criteria that had changes accepted
  const amendedCriteria = assessment.results.filter(r => changesMap.has(r.matrix_id));

  // Get criteria that need human review using the same classification logic as frontend
  const humanReviewCriteria = assessment.results.filter(r =>
    (skippedCriteriaIds.includes(r.matrix_id) && requiresHumanIntervention(r)) ||
    (requiresHumanIntervention(r) && (r.status === 'does_not_meet' || r.status === 'partial'))
  );

  const children: any[] = [];

  // ============================================
  // COVER PAGE
  // ============================================
  children.push(
    new Paragraph({ spacing: { after: 1200 } }), // Top margin
    new Paragraph({
      children: [
        new TextRun({
          text: 'GATEWAY 2',
          bold: true,
          size: 28,
          color: COLORS.muted,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'AMENDED SUBMISSION',
          bold: true,
          size: 56,
          color: COLORS.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    createHorizontalRule(),
    new Paragraph({
      children: [
        new TextRun({
          text: projectName,
          bold: true,
          size: 36,
          color: COLORS.secondary,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Version ${versionNum}`,
          size: 24,
          color: COLORS.muted,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    // Summary stats table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: String(acceptedChanges.length), bold: true, size: 48, color: COLORS.success }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Changes Accepted', size: 18, color: COLORS.muted }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: 'ECFDF5', type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: String(humanReviewCriteria.length), bold: true, size: 48, color: COLORS.warning }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Require Human Review', size: 18, color: COLORS.muted }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
                right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
              },
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${generatedDate}`,
          size: 20,
          color: COLORS.muted,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Prepared by Attlee.AI | BSR Quality Checker',
          size: 18,
          color: COLORS.muted,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
  );

  // ============================================
  // TABLE OF CONTENTS
  // ============================================
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createSectionHeader('Contents'),
    new Paragraph({ spacing: { after: 200 } }),
  );

  const tocItems = [
    { num: '1', title: 'About This Document', page: '3' },
    { num: '2', title: 'How to Use This Report', page: '3' },
    { num: '3', title: 'Summary of Changes', page: '4' },
    { num: '4', title: 'Accepted Amendments', page: '5' },
    { num: '5', title: 'Items Requiring Human Review', page: String(5 + Math.ceil(amendedCriteria.length / 2)) },
  ];

  tocItems.forEach(item => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${item.num}.  `, bold: true, size: 22, color: COLORS.primary }),
          new TextRun({ text: item.title, size: 22 }),
          new TextRun({ text: ' ', size: 22 }),
          new TextRun({ text: '.'.repeat(60), size: 22, color: COLORS.border }),
          new TextRun({ text: ` ${item.page}`, size: 22, color: COLORS.muted }),
        ],
        spacing: { after: 120 },
      })
    );
  });

  // ============================================
  // ABOUT THIS DOCUMENT
  // ============================================
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createSectionHeader('1. About This Document'),
    new Paragraph({
      children: [
        new TextRun({
          text: 'This document has been generated by ',
          size: 22,
        }),
        new TextRun({
          text: 'Attlee.AI BSR Quality Checker',
          bold: true,
          size: 22,
          color: COLORS.primary,
        }),
        new TextRun({
          text: ', an AI-powered regulatory compliance tool for Gateway 2 submissions under the Building Safety Act 2022.',
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    }),
    ...createCalloutBox(
      'Purpose',
      'This report consolidates the amendments you approved during the review process. Each amendment addresses a specific regulatory gap identified in your submission pack.'
    ),
    new Paragraph({ spacing: { after: 200 } }),
    createSectionHeader('2. How to Use This Report', 2),
  );

  // How to use - formatted list
  const howToUseItems = [
    { marker: '☑', text: 'Yellow highlighted text = AI-proposed changes you accepted. Review for accuracy.', color: COLORS.success },
    { marker: '☐', text: 'Checkbox items can be ticked off as you review each amendment.', color: COLORS.muted },
    { marker: '■', text: '[HUMAN REVIEW REQUIRED] = Issues that cannot be fixed by text changes alone.', color: COLORS.warning },
  ];

  howToUseItems.forEach(item => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${item.marker}  `, bold: true, size: 24, color: item.color }),
          new TextRun({ text: item.text, size: 20 }),
        ],
        spacing: { after: 120 },
        indent: { left: convertInchesToTwip(0.3) },
      })
    );
  });

  children.push(
    new Paragraph({ spacing: { after: 200 } }),
    ...createCalloutBox(
      'Important',
      'This is a decision-support tool, not a compliance certificate. Final approval decisions rest with the Building Safety Regulator. You should verify all proposed text is accurate for your specific project.',
      'warning'
    ),
  );

  // ============================================
  // SUMMARY OF CHANGES
  // ============================================
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createSectionHeader('3. Summary of Changes'),
    new Paragraph({
      children: [
        new TextRun({
          text: `This document includes `,
          size: 22,
        }),
        new TextRun({
          text: `${acceptedChanges.length} accepted amendment${acceptedChanges.length === 1 ? '' : 's'}`,
          bold: true,
          size: 22,
          color: COLORS.success,
        }),
        new TextRun({
          text: ` addressing regulatory gaps in your submission.`,
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    }),
  );

  // Summary table
  if (amendedCriteria.length > 0) {
    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '☐', bold: true, size: 20 })] })],
            shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
            width: { size: 5, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'ID', bold: true, size: 20 })] })],
            shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Criterion', bold: true, size: 20 })] })],
            shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
            width: { size: 55, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Severity', bold: true, size: 20 })] })],
            shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Page', bold: true, size: 20 })] })],
            shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      ...amendedCriteria.map((criterion, index) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '☐', size: 20 })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: criterion.matrix_id, size: 18, color: COLORS.primary })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: criterion.matrix_title, size: 18 })] })],
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: criterion.severity.toUpperCase(),
                  size: 18,
                  bold: true,
                  color: criterion.severity === 'high' ? COLORS.danger : COLORS.warning
                })]
              })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(5 + index), size: 18, color: COLORS.muted })] })],
            }),
          ],
        })
      ),
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );
  }

  // ============================================
  // ACCEPTED AMENDMENTS (DETAILED)
  // ============================================
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createSectionHeader('4. Accepted Amendments'),
    new Paragraph({
      children: [
        new TextRun({
          text: 'The following amendments should be incorporated into your submission pack. Each section shows the proposed text with full context.',
          size: 20,
          color: COLORS.muted,
          italics: true,
        }),
      ],
      spacing: { after: 400 },
    }),
  );

  // Each accepted change with proper formatting
  amendedCriteria.forEach((criterion, index) => {
    const change = changesMap.get(criterion.matrix_id)!;

    children.push(
      // Amendment header with checkbox
      new Paragraph({
        children: [
          new TextRun({ text: '☐  ', bold: true, size: 28, color: COLORS.primary }),
          new TextRun({ text: `Amendment ${index + 1}: `, bold: true, size: 24, color: COLORS.primary }),
          new TextRun({ text: criterion.matrix_title, bold: true, size: 24 }),
        ],
        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
          left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        },
        spacing: { before: 400 },
      }),
      // Metadata row
      new Paragraph({
        children: [
          new TextRun({ text: 'Criterion: ', size: 18, color: COLORS.muted }),
          new TextRun({ text: criterion.matrix_id, size: 18, bold: true, color: COLORS.primary }),
          new TextRun({ text: '   |   ', size: 18, color: COLORS.border }),
          new TextRun({ text: 'Status: ', size: 18, color: COLORS.muted }),
          new TextRun({
            text: criterion.status === 'does_not_meet' ? 'FAIL' : 'PARTIAL',
            size: 18,
            bold: true,
            color: criterion.status === 'does_not_meet' ? COLORS.danger : COLORS.warning
          }),
          new TextRun({ text: '   |   ', size: 18, color: COLORS.border }),
          new TextRun({ text: 'Severity: ', size: 18, color: COLORS.muted }),
          new TextRun({
            text: criterion.severity.toUpperCase(),
            size: 18,
            bold: true,
            color: criterion.severity === 'high' ? COLORS.danger : COLORS.warning
          }),
        ],
        shading: { fill: COLORS.lightBg, type: ShadingType.CLEAR },
        border: {
          left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
          right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
        },
        spacing: { after: 200 },
      }),
      // Why needed
      new Paragraph({
        children: [
          new TextRun({ text: 'Why This Change Is Needed', bold: true, size: 20, color: COLORS.secondary }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: criterion.reasoning, size: 20, italics: true }),
        ],
        spacing: { after: 200 },
        indent: { left: convertInchesToTwip(0.2) },
      }),
      // Regulatory reference
      new Paragraph({
        children: [
          new TextRun({ text: 'Regulatory Reference', bold: true, size: 20, color: COLORS.secondary }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: criterion.reference_evidence.doc_title || criterion.success_definition,
            size: 20,
            color: COLORS.primary,
          }),
        ],
        spacing: { after: 200 },
        indent: { left: convertInchesToTwip(0.2) },
      }),
      // The proposed amendment - HIGHLIGHTED
      new Paragraph({
        children: [
          new TextRun({ text: 'Proposed Amendment', bold: true, size: 20, color: COLORS.success }),
          new TextRun({ text: '  (highlighted text to add to your submission)', size: 18, color: COLORS.muted }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: change,
            size: 22,
            shading: { fill: COLORS.highlight, type: ShadingType.CLEAR },
          }),
        ],
        spacing: { after: 100 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.warning },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.warning },
          left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.warning },
          right: { style: BorderStyle.SINGLE, size: 6, color: COLORS.warning },
        },
        indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '✓ Once reviewed and incorporated, tick the checkbox above to track progress.', size: 16, color: COLORS.muted, italics: true }),
        ],
        spacing: { after: 300 },
        indent: { left: convertInchesToTwip(0.2) },
      }),
    );
  });

  // ============================================
  // ITEMS REQUIRING HUMAN REVIEW
  // ============================================
  if (humanReviewCriteria.length > 0) {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      createSectionHeader('5. Items Requiring Human Review'),
      new Paragraph({
        children: [
          new TextRun({
            text: 'The following items cannot be addressed by text changes alone. They require professional judgement, new documentation, or physical evidence.',
            size: 20,
            color: COLORS.muted,
            italics: true,
          }),
        ],
        spacing: { after: 300 },
      }),
    );

    humanReviewCriteria.forEach((criterion, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '[HUMAN REVIEW REQUIRED]', bold: true, size: 22, color: COLORS.warning }),
            new TextRun({ text: `  ${criterion.matrix_id}: ${criterion.matrix_title}`, size: 20 }),
          ],
          shading: { fill: 'FEF3C7', type: ShadingType.CLEAR },
          border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.warning },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.warning },
            left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.warning },
            right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.warning },
          },
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Issue: ', bold: true, size: 18 }),
            new TextRun({ text: criterion.reasoning, size: 18 }),
          ],
          spacing: { after: 100 },
          indent: { left: convertInchesToTwip(0.3) },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Action Required: ', bold: true, size: 18, color: COLORS.danger }),
            new TextRun({
              text: criterion.actions_required[0]?.action || 'Review and address manually',
              size: 18
            }),
          ],
          spacing: { after: 200 },
          indent: { left: convertInchesToTwip(0.3) },
        }),
      );
    });
  }

  // ============================================
  // FOOTER NOTE
  // ============================================
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHorizontalRule(),
    new Paragraph({
      children: [
        new TextRun({
          text: 'End of Document',
          bold: true,
          size: 24,
          color: COLORS.muted,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `This report was generated by Attlee.AI BSR Quality Checker on ${generatedDate}. `,
          size: 18,
          color: COLORS.muted,
        }),
        new TextRun({
          text: 'For support, contact support@attlee.ai',
          size: 18,
          color: COLORS.primary,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  // Create document with proper settings
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 22,
          },
          paragraph: {
            spacing: { line: 276 },
          },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${projectName} - Amended Submission`, size: 18, color: COLORS.muted }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Attlee.AI BSR Quality Checker  |  Page ', size: 16, color: COLORS.muted }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 16,
                  color: COLORS.muted,
                }),
                new TextRun({ text: ' of ', size: 16, color: COLORS.muted }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 16,
                  color: COLORS.muted,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children,
    }],
  });

  // Save document
  const filename = `amended-${packName}-v${versionNum}.docx`;
  const filepath = path.join(REPORTS_DIR, filename);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filepath, buffer);

  // Save artifact record
  await prisma.outputArtifact.create({
    data: {
      packVersionId: packVersion.id,
      artifactType: 'amended-docx',
      path: filepath,
    },
  });

  return filepath;
}

/**
 * Generate PDF version of amended document
 */
async function generateAmendedPdf(
  packVersion: any,
  assessment: FullAssessment,
  acceptedChanges: AcceptedChange[]
): Promise<string> {
  const packName = packVersion.pack.name.replace(/[^a-zA-Z0-9]/g, '-');
  const versionNum = packVersion.versionNumber;
  const projectName = packVersion.projectName || packVersion.pack.name;

  // Build changes lookup
  const changesMap = new Map<string, string>();
  acceptedChanges.forEach(c => changesMap.set(c.matrix_id, c.proposed_change));
  const amendedCriteria = assessment.results.filter(r => changesMap.has(r.matrix_id));

  // Build HTML content
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { color: #1e40af; font-size: 28px; margin-bottom: 8px; }
    h2 { color: #334155; font-size: 22px; margin-top: 32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h3 { color: #475569; font-size: 18px; margin-top: 24px; }
    .subtitle { color: #64748b; font-size: 16px; margin-bottom: 24px; }
    .highlight { background-color: #fef08a; padding: 12px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #eab308; }
    .info-box { background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0; }
    .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }
    .criterion { margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .criterion-header { font-weight: bold; color: #1e40af; }
    .criterion-meta { font-size: 14px; color: #64748b; margin-bottom: 12px; }
    .regulation { color: #2563eb; font-style: italic; }
    .page-break { page-break-before: always; }
    .toc { margin: 32px 0; }
    .toc-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #e2e8f0; }
  </style>
</head>
<body>
  <h1>AMENDED GATEWAY 2 SUBMISSION</h1>
  <p class="subtitle">${projectName} - Version ${versionNum}</p>
  <p class="subtitle">Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

  <div class="page-break"></div>

  <h2>Table of Contents</h2>
  <div class="toc">
    <div class="toc-item"><span>1. About This Document</span><span>Page 3</span></div>
    <div class="toc-item"><span>2. Summary of Changes</span><span>Page 4</span></div>
    <div class="toc-item"><span>3. Amended Content</span><span>Page 5</span></div>
  </div>

  <div class="page-break"></div>

  <h2>1. About This Document</h2>
  <p>This document has been automatically generated by Attlee, an AI-powered regulatory compliance tool for Gateway 2 submissions.</p>

  <div class="info-box">
    <p><strong>What you are seeing:</strong></p>
    <ul>
      <li><strong style="color: #16a34a;">Amended Content:</strong> Text you reviewed and accepted, highlighted in yellow</li>
      <li><strong style="color: #2563eb;">Regulatory References:</strong> Each change cites the specific BSR criterion</li>
      <li><strong style="color: #d97706;">Outstanding Issues:</strong> A separate document lists skipped criteria</li>
    </ul>
  </div>

  <div class="warning">
    <strong>Important:</strong> This is a decision-support tool, not a compliance certificate. Final approval decisions rest with the Building Safety Regulator.
  </div>

  <div class="page-break"></div>

  <h2>2. Summary of Changes</h2>
  <p>This document includes ${acceptedChanges.length} accepted change${acceptedChanges.length === 1 ? '' : 's'}:</p>
  <ol>
    ${amendedCriteria.map(c => `<li><strong>[${c.matrix_id}]</strong> ${c.matrix_title}</li>`).join('\n')}
  </ol>

  <div class="page-break"></div>

  <h2>3. Amended Content</h2>
  <p>The following text should be incorporated into your submission pack:</p>

  ${amendedCriteria.map((criterion, index) => `
    <div class="criterion">
      <p class="criterion-header">${index + 1}. ${criterion.matrix_title}</p>
      <p class="criterion-meta">Criterion ID: ${criterion.matrix_id} | Severity: ${criterion.severity.toUpperCase()}</p>
      <p><strong>Why this change is needed:</strong> <em>${criterion.reasoning}</em></p>
      <p class="regulation"><strong>Regulatory Reference:</strong> ${criterion.reference_evidence.doc_title || criterion.success_definition}</p>
      <p><strong>Amended Text:</strong></p>
      <div class="highlight">${changesMap.get(criterion.matrix_id)}</div>
    </div>
  `).join('\n')}
</body>
</html>
  `;

  // Generate PDF
  const filename = `amended-${packName}-v${versionNum}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: filepath,
    format: 'A4',
    margin: { top: '1in', bottom: '1in', left: '0.75in', right: '0.75in' },
  });
  await browser.close();

  // Save artifact record
  await prisma.outputArtifact.create({
    data: {
      packVersionId: packVersion.id,
      artifactType: 'amended-pdf',
      path: filepath,
    },
  });

  return filepath;
}

/**
 * Generate Outstanding Issues report for skipped criteria
 */
async function generateOutstandingIssuesReport(
  packVersion: any,
  assessment: FullAssessment,
  skippedCriteriaIds: string[]
): Promise<string> {
  const packName = packVersion.pack.name.replace(/[^a-zA-Z0-9]/g, '-');
  const versionNum = packVersion.versionNumber;
  const projectName = packVersion.projectName || packVersion.pack.name;

  // Get all criteria that need attention
  const allSkippedCriteria = assessment.results.filter(r =>
    skippedCriteriaIds.includes(r.matrix_id) &&
    (r.status === 'does_not_meet' || r.status === 'partial')
  );

  // Separate into human intervention vs skipped AI changes using the same logic as frontend
  // Human intervention: no proposed_change OR contains keywords indicating human action needed
  const humanInterventionItems = allSkippedCriteria.filter(r => requiresHumanIntervention(r));
  const skippedAIChanges = allSkippedCriteria.filter(r => !requiresHumanIntervention(r));

  const totalIssues = allSkippedCriteria.length;

  // Build HTML content
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    h1 { color: #d97706; font-size: 28px; margin-bottom: 8px; }
    h2 { color: #334155; font-size: 22px; margin-top: 32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h3 { color: #475569; font-size: 18px; margin-top: 24px; }
    .subtitle { color: #64748b; font-size: 16px; margin-bottom: 24px; }
    .warning-box { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .info-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .issue { margin: 24px 0; padding: 20px; background: #fff7ed; border-radius: 8px; border: 1px solid #fed7aa; }
    .issue.human-intervention { background: #fef3c7; border: 2px solid #f59e0b; }
    .issue-header { font-weight: bold; color: #c2410c; }
    .issue-meta { font-size: 14px; color: #64748b; margin-bottom: 12px; }
    .issue-type { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
    .issue-type.human { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
    .issue-type.skipped { background: #e5e7eb; color: #374151; border: 1px solid #9ca3af; }
    .evidence { background: #f1f5f9; padding: 12px; border-radius: 6px; margin: 12px 0; font-style: italic; }
    .action { background: #ecfdf5; padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 4px solid #10b981; }
    .severity-high { color: #dc2626; font-weight: bold; }
    .severity-medium { color: #d97706; font-weight: bold; }
    .severity-low { color: #2563eb; }
    .page-break { page-break-before: always; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .summary-table th, .summary-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .summary-table th { background: #f8fafc; font-weight: 600; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .stat-card { padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card.human { background: #fef3c7; border: 1px solid #f59e0b; }
    .stat-card.skipped { background: #f3f4f6; border: 1px solid #d1d5db; }
    .stat-number { font-size: 36px; font-weight: bold; }
    .stat-label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .section-header { background: #f8fafc; padding: 12px 16px; border-radius: 6px; margin: 24px 0 16px 0; border-left: 4px solid #f59e0b; }
    .section-header.skipped { border-left-color: #9ca3af; }
  </style>
</head>
<body>
  <h1>OUTSTANDING ISSUES REPORT</h1>
  <p class="subtitle">${projectName} - Version ${versionNum}</p>
  <p class="subtitle">Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

  <div class="warning-box">
    <h3 style="margin-top: 0; color: #92400e;">[HUMAN REVIEW REQUIRED]</h3>
    <p>This report contains <strong>${totalIssues} issue${totalIssues === 1 ? '' : 's'}</strong> that require manual review by your team.</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card human">
      <div class="stat-number" style="color: #92400e;">${humanInterventionItems.length}</div>
      <div class="stat-label">Items Requiring Human Intervention</div>
      <p style="font-size: 12px; color: #78716c; margin-top: 8px;">Cannot be fixed by text changes alone. May require new documents, expert analysis, or physical evidence.</p>
    </div>
    <div class="stat-card skipped">
      <div class="stat-number" style="color: #374151;">${skippedAIChanges.length}</div>
      <div class="stat-label">Skipped AI Changes</div>
      <p style="font-size: 12px; color: #78716c; margin-top: 8px;">AI proposed text changes that you chose not to apply. Review these for manual incorporation.</p>
    </div>
  </div>

  <h2>Summary</h2>
  <table class="summary-table">
    <thead>
      <tr>
        <th>Type</th>
        <th>Criterion</th>
        <th>Status</th>
        <th>Severity</th>
        <th>Owner</th>
      </tr>
    </thead>
    <tbody>
      ${humanInterventionItems.map(c => `
        <tr>
          <td><span class="issue-type human">Human Review</span></td>
          <td><strong>${c.matrix_id}</strong> - ${c.matrix_title}</td>
          <td>${c.status === 'does_not_meet' ? 'FAIL' : 'PARTIAL'}</td>
          <td class="severity-${c.severity}">${c.severity.toUpperCase()}</td>
          <td>${c.actions_required[0]?.owner || 'Project Team'}</td>
        </tr>
      `).join('\n')}
      ${skippedAIChanges.map(c => `
        <tr>
          <td><span class="issue-type skipped">Skipped</span></td>
          <td><strong>${c.matrix_id}</strong> - ${c.matrix_title}</td>
          <td>${c.status === 'does_not_meet' ? 'FAIL' : 'PARTIAL'}</td>
          <td class="severity-${c.severity}">${c.severity.toUpperCase()}</td>
          <td>${c.actions_required[0]?.owner || 'Project Team'}</td>
        </tr>
      `).join('\n')}
    </tbody>
  </table>

  <div class="page-break"></div>

  ${humanInterventionItems.length > 0 ? `
    <div class="section-header">
      <h2 style="margin: 0; color: #92400e;">Items Requiring Human Intervention (${humanInterventionItems.length})</h2>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #78716c;">These issues cannot be resolved by text changes alone. They may require creating new documents, obtaining expert analysis, or providing physical evidence.</p>
    </div>

    ${humanInterventionItems.map((criterion, index) => `
      <div class="issue human-intervention">
        <span class="issue-type human">[HUMAN REVIEW REQUIRED]</span>
        <p class="issue-header">${index + 1}. [${criterion.matrix_id}] ${criterion.matrix_title}</p>
        <p class="issue-meta">
          Status: <span class="severity-${criterion.severity}">${criterion.status === 'does_not_meet' ? 'FAIL' : 'PARTIAL'}</span> |
          Severity: <span class="severity-${criterion.severity}">${criterion.severity.toUpperCase()}</span>
        </p>

        <h4>Assessment Finding</h4>
        <p>${criterion.reasoning}</p>

        ${criterion.pack_evidence.found && criterion.pack_evidence.quote ? `
          <h4>Evidence Found in Your Submission</h4>
          <div class="evidence">
            "${criterion.pack_evidence.quote}"
            <br><small>- ${criterion.pack_evidence.document}${criterion.pack_evidence.page ? `, Page ${criterion.pack_evidence.page}` : ''}</small>
          </div>
        ` : `
          <h4>Evidence Found in Your Submission</h4>
          <p style="color: #dc2626;"><em>No relevant evidence found</em></p>
        `}

        <h4>Regulatory Requirement</h4>
        ${criterion.reference_evidence.found && criterion.reference_evidence.quote ? `
          <div class="evidence">
            "${criterion.reference_evidence.quote}"
            <br><small>- ${criterion.reference_evidence.doc_title}${criterion.reference_evidence.page ? `, Page ${criterion.reference_evidence.page}` : ''}</small>
          </div>
        ` : `
          <p>${criterion.success_definition}</p>
        `}

        ${criterion.gaps_identified.length > 0 ? `
          <h4>Gaps Identified</h4>
          <ul>
            ${criterion.gaps_identified.map(gap => `<li>${gap}</li>`).join('\n')}
          </ul>
        ` : ''}

        ${criterion.actions_required.length > 0 ? `
          <h4>Recommended Actions</h4>
          ${criterion.actions_required.map(action => `
            <div class="action">
              <strong>${action.action}</strong><br>
              <small>Owner: ${action.owner} | Effort: ${action.effort} | Benefit: ${action.expected_benefit}</small>
            </div>
          `).join('\n')}
        ` : ''}
      </div>
    `).join('\n')}
  ` : ''}

  ${skippedAIChanges.length > 0 ? `
    <div class="section-header skipped">
      <h2 style="margin: 0; color: #374151;">Skipped AI Changes (${skippedAIChanges.length})</h2>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #78716c;">AI proposed text changes for these criteria that you chose not to apply. Review and incorporate manually if needed.</p>
    </div>

    ${skippedAIChanges.map((criterion, index) => `
      <div class="issue">
        <span class="issue-type skipped">Skipped AI Change</span>
        <p class="issue-header">${index + 1}. [${criterion.matrix_id}] ${criterion.matrix_title}</p>
        <p class="issue-meta">
          Status: <span class="severity-${criterion.severity}">${criterion.status === 'does_not_meet' ? 'FAIL' : 'PARTIAL'}</span> |
          Severity: <span class="severity-${criterion.severity}">${criterion.severity.toUpperCase()}</span>
        </p>

        <h4>Assessment Finding</h4>
        <p>${criterion.reasoning}</p>

        ${criterion.pack_evidence.found && criterion.pack_evidence.quote ? `
          <h4>Evidence Found in Your Submission</h4>
          <div class="evidence">
            "${criterion.pack_evidence.quote}"
            <br><small>- ${criterion.pack_evidence.document}${criterion.pack_evidence.page ? `, Page ${criterion.pack_evidence.page}` : ''}</small>
          </div>
        ` : `
          <h4>Evidence Found in Your Submission</h4>
          <p style="color: #dc2626;"><em>No relevant evidence found</em></p>
        `}

        <h4>Regulatory Requirement</h4>
        ${criterion.reference_evidence.found && criterion.reference_evidence.quote ? `
          <div class="evidence">
            "${criterion.reference_evidence.quote}"
            <br><small>- ${criterion.reference_evidence.doc_title}${criterion.reference_evidence.page ? `, Page ${criterion.reference_evidence.page}` : ''}</small>
          </div>
        ` : `
          <p>${criterion.success_definition}</p>
        `}

        ${criterion.gaps_identified.length > 0 ? `
          <h4>Gaps Identified</h4>
          <ul>
            ${criterion.gaps_identified.map(gap => `<li>${gap}</li>`).join('\n')}
          </ul>
        ` : ''}

        ${criterion.actions_required.length > 0 ? `
          <h4>Recommended Actions</h4>
          ${criterion.actions_required.map(action => `
            <div class="action">
              <strong>${action.action}</strong><br>
              <small>Owner: ${action.owner} | Effort: ${action.effort} | Benefit: ${action.expected_benefit}</small>
            </div>
          `).join('\n')}
        ` : ''}

        <h4>AI Suggested Change (Not Applied)</h4>
        <div class="evidence" style="background: #fef3c7; border: 1px solid #fcd34d;">${criterion.proposed_change}</div>
      </div>
    `).join('\n')}
  ` : ''}

  <div class="page-break"></div>

  <h2>Next Steps</h2>
  <ol>
    <li><strong>Address Human Intervention Items First:</strong> These require new documentation or expert input</li>
    <li><strong>Assign Owners:</strong> Distribute issues to appropriate team members based on the owner column</li>
    <li><strong>Prioritize by Severity:</strong> Items marked as HIGH severity are most likely to cause rejection</li>
    <li><strong>Review Skipped AI Changes:</strong> Consider incorporating these text changes manually</li>
    <li><strong>Re-analyse:</strong> Upload revised documents to Attlee for another assessment</li>
  </ol>

  <div class="warning-box" style="margin-top: 40px;">
    <p style="margin: 0;"><strong>Note:</strong> This report was generated by Attlee.AI BSR Quality Checker. It is a decision-support tool and does not constitute a compliance certificate. Final approval decisions rest with the Building Safety Regulator.</p>
  </div>
</body>
</html>
  `;

  // Generate PDF
  const filename = `outstanding-issues-${packName}-v${versionNum}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: filepath,
    format: 'A4',
    margin: { top: '1in', bottom: '1in', left: '0.75in', right: '0.75in' },
  });
  await browser.close();

  // Save artifact record
  await prisma.outputArtifact.create({
    data: {
      packVersionId: packVersion.id,
      artifactType: 'outstanding-issues',
      path: filepath,
    },
  });

  return filepath;
}

export { AmendmentRequest, AmendmentResult };
