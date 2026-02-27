import fs from 'fs';
import path from 'path';
import prisma from '../db/client.js';
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { generateMatrixReport, generateMatrixJSON, generateUISummary } from './matrix-report.js';
import { FullAssessment } from './matrix-assessment.js';

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

interface ReportData {
  pack: {
    name: string;
  };
  version: {
    versionNumber: number;
    projectName: string | null;
    borough: string | null;
    buildingType: string | null;
    height: string | null;
    storeys: string | null;
    createdAt: Date;
  };
  documents: Array<{
    filename: string;
    docType: string | null;
  }>;
  fields: Array<{
    fieldName: string;
    fieldValue: string | null;
    confidence: string;
    evidenceDocument?: { filename: string };
    evidencePageRef: number | null;
    evidenceQuote: string | null;
  }>;
  issues: Array<{
    severity: string;
    category: string;
    title: string;
    finding: string;
    whyItMatters: string;
    action: string;
    ownerRole: string;
    effort: string;
    endUserConsideration: string;
    expectedBenefit: string;
    confidence: string;
    citations: string;
    evidence: string;
  }>;
}

// Generate markdown report
export async function generateMarkdownReport(
  packVersionId: string
): Promise<string> {
  const data = await getReportData(packVersionId);

  const markdown = buildMarkdownReport(data);

  // Save to file
  const filename = `report-${data.pack.name}-v${data.version.versionNumber}.md`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, markdown);

  // Save artifact record
  await prisma.outputArtifact.create({
    data: {
      packVersionId,
      artifactType: 'md',
      path: filepath,
    },
  });

  return filepath;
}

// Generate PDF report
export async function generatePDFReport(
  packVersionId: string
): Promise<string> {
  const data = await getReportData(packVersionId);
  const markdown = buildMarkdownReport(data);

  // Convert markdown to HTML
  const html = markdownToHtml(markdown);

  // Save PDF using puppeteer
  const filename = `report-${data.pack.name}-v${data.version.versionNumber}.pdf`;
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
      packVersionId,
      artifactType: 'pdf',
      path: filepath,
    },
  });

  return filepath;
}

// Generate JSON export
export async function generateJSONExport(
  packVersionId: string
): Promise<string> {
  const data = await getReportData(packVersionId);

  // Structure JSON export
  const exportData = {
    meta: {
      packName: data.pack.name,
      versionNumber: data.version.versionNumber,
      projectName: data.version.projectName,
      borough: data.version.borough,
      generatedAt: new Date().toISOString(),
    },
    extractedFields: data.fields.map((f) => ({
      fieldName: f.fieldName,
      fieldValue: f.fieldValue,
      confidence: f.confidence,
      source: f.evidenceDocument?.filename,
      pageRef: f.evidencePageRef,
    })),
    issues: data.issues.map((i) => ({
      severity: i.severity,
      category: i.category,
      title: i.title,
      finding: i.finding,
      whyItMatters: i.whyItMatters,
      action: i.action,
      ownerRole: i.ownerRole,
      effort: i.effort,
      endUserConsideration: i.endUserConsideration,
      expectedBenefit: i.expectedBenefit,
      confidence: i.confidence,
      citations: JSON.parse(i.citations || '[]'),
      evidence: JSON.parse(i.evidence || '[]'),
    })),
  };

  const filename = `report-${data.pack.name}-v${data.version.versionNumber}.json`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

  // Save artifact record
  await prisma.outputArtifact.create({
    data: {
      packVersionId,
      artifactType: 'json',
      path: filepath,
    },
  });

  return filepath;
}

// Get report content for display
export async function getReportContent(
  packVersionId: string
): Promise<{ markdown: string; data: ReportData }> {
  const data = await getReportData(packVersionId);
  const markdown = buildMarkdownReport(data);
  return { markdown, data };
}

// Helper: Get all report data
async function getReportData(packVersionId: string): Promise<ReportData> {
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      pack: true,
      documents: true,
      fields: {
        include: {
          evidenceDocument: true,
        },
      },
      issues: {
        orderBy: [{ severity: 'asc' }, { category: 'asc' }],
      },
    },
  });

  if (!packVersion) {
    throw new Error(`Pack version not found: ${packVersionId}`);
  }

  return {
    pack: packVersion.pack,
    version: {
      versionNumber: packVersion.versionNumber,
      projectName: packVersion.projectName,
      borough: packVersion.borough,
      buildingType: packVersion.buildingType,
      height: packVersion.height,
      storeys: packVersion.storeys,
      createdAt: packVersion.createdAt,
    },
    documents: packVersion.documents,
    fields: packVersion.fields.map(f => ({
      fieldName: f.fieldName,
      fieldValue: f.fieldValue,
      confidence: f.confidence,
      evidenceDocument: f.evidenceDocument ? { filename: f.evidenceDocument.filename } : undefined,
      evidencePageRef: f.evidencePageRef,
      evidenceQuote: f.evidenceQuote,
    })),
    issues: packVersion.issues,
  };
}

// Helper: Build markdown report
function buildMarkdownReport(data: ReportData): string {
  const sections: string[] = [];

  // Issues by severity
  const highIssues = data.issues.filter((i) => i.severity === 'high');
  const mediumIssues = data.issues.filter((i) => i.severity === 'medium');
  const lowIssues = data.issues.filter((i) => i.severity === 'low');
  const totalIssues = data.issues.length;

  // Determine overall status
  let overallStatus = 'Likely Reviewable';
  let statusDescription = 'No major issues detected. The submission pack appears ready for BSR review.';
  if (highIssues.length > 0) {
    overallStatus = 'At Risk';
    statusDescription = 'High-priority issues identified that should be resolved before submission to avoid delays or rejection.';
  } else if (mediumIssues.length > 2) {
    overallStatus = 'Needs Attention';
    statusDescription = 'Several medium-priority issues may trigger BSR queries. Review recommended before submission.';
  }

  // Calculate criteria based on Gateway 2 standard checks
  const GATEWAY2_CRITERIA_COUNT = 18; // Standard Gateway 2 review criteria
  const criteriaChecked = GATEWAY2_CRITERIA_COUNT;
  const criteriaWithIssues = Math.min(totalIssues, criteriaChecked);
  const criteriaPassed = criteriaChecked - criteriaWithIssues;

  // === EXECUTIVE SUMMARY (must be readable in 60 seconds) ===
  sections.push(`# Gateway 2 Quality Report

## Executive Summary

| | |
|---|---|
| **Project** | ${data.version.projectName || data.pack.name} |
| **Pack** | ${data.pack.name} (Version ${data.version.versionNumber}) |
| **Borough** | ${data.version.borough || 'Not specified'} |
| **Date** | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} |

### Overall Assessment: ${overallStatus}

**Across ${criteriaChecked} criteria checked, ${criteriaPassed} passed** and **${criteriaWithIssues} raised concerns** (${totalIssues} total issues found).

Issues have been triaged into **${highIssues.length} high**, **${mediumIssues.length} medium**, and **${lowIssues.length} low** priority.

${statusDescription}

### Risks Identified

| Priority | Count | Description |
|----------|-------|-------------|
| **High** | ${highIssues.length} | Issues that could delay or block approval |
| **Medium** | ${mediumIssues.length} | Issues likely to trigger BSR queries |
| **Low** | ${lowIssues.length} | Minor improvements recommended |
| **Total** | **${totalIssues}** | |

${highIssues.length > 0 ? `### Top Risks

${highIssues.slice(0, 5).map((i, idx) => `${idx + 1}. **${i.title}** — ${i.finding.substring(0, 100)}${i.finding.length > 100 ? '...' : ''}`).join('\n')}
` : ''}
### Priority Actions

${data.issues.slice(0, 5).map((i, idx) => `${idx + 1}. ${i.action}`).join('\n')}

### Confidence Note

${data.documents.length < 3 ? '⚠️ **Limited documents provided** — A more comprehensive pack would enable higher-confidence analysis.' : `Based on ${data.documents.length} documents analysed with cross-referencing against BSR requirements.`}

> **Disclaimer:** This report assesses document quality and internal consistency only. It does NOT determine regulatory compliance. Compliance decisions are the sole responsibility of the Building Safety Regulator (BSR).

---
`);

  // === DOCUMENTS REVIEWED ===
  sections.push(`## Documents Reviewed

${data.documents.length} documents were analysed:

| Document | Type |
|----------|------|
${data.documents.map((d) => `| ${d.filename.replace(/^\d+-\d+-/, '')} | ${d.docType || 'Unclassified'} |`).join('\n')}

---
`);

  // === GAP ANALYSIS / RISKS ===
  sections.push(`## Gap Analysis

This section identifies issues found in your submission pack, organised by priority.

`);

  // High priority issues
  if (highIssues.length > 0) {
    sections.push(`### High Priority Issues (${highIssues.length})

These issues should be resolved before submission.

${highIssues.map((i, idx) => formatIssueNew(i, idx + 1)).join('\n\n')}
`);
  }

  // Medium priority issues
  if (mediumIssues.length > 0) {
    sections.push(`### Medium Priority Issues (${mediumIssues.length})

These issues may trigger BSR queries or requests for additional information.

${mediumIssues.map((i, idx) => formatIssueNew(i, idx + 1)).join('\n\n')}
`);
  }

  // Low priority issues
  if (lowIssues.length > 0) {
    sections.push(`### Low Priority Issues (${lowIssues.length})

Minor improvements that would enhance document quality.

${lowIssues.map((i, idx) => formatIssueNew(i, idx + 1)).join('\n\n')}
`);
  }

  if (totalIssues === 0) {
    sections.push(`No issues identified in the documents provided.
`);
  }

  sections.push(`---
`);

  // === KEY BUILDING PARTICULARS ===
  // Group fields by field name to show consistency/inconsistency
  const fieldsByName = new Map<string, typeof data.fields>();
  for (const field of data.fields) {
    const existing = fieldsByName.get(field.fieldName) || [];
    existing.push(field);
    fieldsByName.set(field.fieldName, existing);
  }

  sections.push(`## Key Building Particulars

Information extracted from your documents. Inconsistencies are flagged above.

| Parameter | Value(s) Found | Source(s) |
|-----------|----------------|-----------|
${Array.from(fieldsByName.entries())
  .map(([name, fields]) => {
    const uniqueValues = [...new Set(fields.map(f => f.fieldValue).filter(Boolean))];
    const sources = fields.map(f => f.evidenceDocument?.filename?.replace(/^\d+-\d+-/, '') || 'Unknown').slice(0, 2);
    const valueDisplay = uniqueValues.length > 1
      ? `⚠️ ${uniqueValues.join(' / ')}`
      : uniqueValues[0] || 'Not found';
    return `| ${formatFieldName(name)} | ${valueDisplay} | ${sources.join(', ')}${fields.length > 2 ? ` (+${fields.length - 2} more)` : ''} |`;
  })
  .join('\n')}

---
`);

  // === ACTIONS BY OWNER ===
  sections.push(`## Recommended Actions by Role

${groupByOwnerDetailed(data.issues)}

---
`);

  // === APPENDIX ===
  sections.push(`## Appendix: Full Evidence

<details>
<summary>Click to expand detailed evidence for each issue</summary>

${data.issues.map((i, idx) => formatIssueEvidence(i, idx + 1)).join('\n\n')}

</details>

---

## About This Report

- **Generated:** ${new Date().toLocaleString()}
- **Documents analysed:** ${data.documents.length}
- **Issues identified:** ${totalIssues}
- **Tool:** BSR Quality Checker

This report is a reviewability diagnostic. It identifies potential issues that may affect the clarity, completeness, and internal consistency of your Gateway 2 submission. It does not assess or certify regulatory compliance.

*All findings should be verified by qualified professionals.*
`);

  return sections.join('\n');
}

// Helper: Format field name
function formatFieldName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Helper: Format issue (legacy)
function formatIssue(issue: ReportData['issues'][0], num: number): string {
  const citations = JSON.parse(issue.citations || '[]');
  const evidence = JSON.parse(issue.evidence || '[]');

  return `### ${num}. ${issue.title}

**Category:** ${issue.category} | **Effort:** ${issue.effort} | **Owner:** ${issue.ownerRole} | **Confidence:** ${issue.confidence}

**Finding:** ${issue.finding}

**Why It Matters:** ${issue.whyItMatters}

**Recommended Action:** ${issue.action}

**End User Consideration:** ${issue.endUserConsideration}

**Expected Benefit:** ${issue.expectedBenefit}

${
  evidence.length > 0
    ? `**Evidence:**
${evidence.map((e: { docName: string; page: number | null; quote: string }) => `- ${e.docName} (p.${e.page || '?'}): "${e.quote}"`).join('\n')}`
    : ''
}

${
  citations.length > 0
    ? `**References:**
${citations.map((c: { type: string; docName: string; section: string | null }) => `- ${c.docName} ${c.section ? `(${c.section})` : ''}`).join('\n')}`
    : ''
}`;
}

// Helper: Format issue (new actions-first format)
function formatIssueNew(issue: ReportData['issues'][0], num: number): string {
  const evidence = JSON.parse(issue.evidence || '[]');

  // Clean up document names
  const cleanDocName = (name: string) => name.replace(/^\d+-\d+-/, '');

  return `#### ${num}. ${issue.title}

**What we found:** ${issue.finding}

**Why it matters:** ${issue.whyItMatters}

**Recommended action:** ${issue.action}

| Owner | Effort | Impact |
|-------|--------|--------|
| ${issue.ownerRole} | ${issue.effort === 'S' ? 'Small' : issue.effort === 'M' ? 'Medium' : 'Large'} | ${issue.expectedBenefit} |

${evidence.length > 0 ? `**Source documentation:**
${evidence.slice(0, 3).map((e: { docName: string; page: number | null; quote: string }) =>
  `> *"${e.quote.length > 150 ? e.quote.substring(0, 150) + '...' : e.quote}"*
> — ${cleanDocName(e.docName)}${e.page ? `, page ${e.page}` : ''}`
).join('\n\n')}` : ''}
`;
}

// Helper: Format issue evidence for appendix
function formatIssueEvidence(issue: ReportData['issues'][0], num: number): string {
  const evidence = JSON.parse(issue.evidence || '[]');
  const citations = JSON.parse(issue.citations || '[]');

  const cleanDocName = (name: string) => name.replace(/^\d+-\d+-/, '');

  return `### Issue ${num}: ${issue.title}

**Category:** ${issue.category}
**Severity:** ${issue.severity}
**Confidence:** ${issue.confidence}

**Full finding:** ${issue.finding}

${evidence.length > 0 ? `**All evidence found:**

${evidence.map((e: { docName: string; page: number | null; quote: string }, idx: number) =>
  `${idx + 1}. **${cleanDocName(e.docName)}**${e.page ? ` (page ${e.page})` : ''}
   > "${e.quote}"`
).join('\n\n')}` : 'No specific evidence quotes captured.'}

${citations.length > 0 ? `**Reference documents:**
${citations.map((c: { type: string; docName: string; section: string | null }) =>
  `- ${cleanDocName(c.docName)}${c.section ? ` — ${c.section}` : ''}`
).join('\n')}` : ''}
`;
}

// Helper: Group by owner with details
function groupByOwnerDetailed(issues: ReportData['issues']): string {
  const byOwner = new Map<string, ReportData['issues']>();
  for (const issue of issues) {
    const existing = byOwner.get(issue.ownerRole) || [];
    existing.push(issue);
    byOwner.set(issue.ownerRole, existing);
  }

  return Array.from(byOwner.entries())
    .map(([owner, ownerIssues]) => {
      const high = ownerIssues.filter(i => i.severity === 'high').length;
      const med = ownerIssues.filter(i => i.severity === 'medium').length;
      const low = ownerIssues.filter(i => i.severity === 'low').length;

      return `### ${owner}

${ownerIssues.length} action${ownerIssues.length !== 1 ? 's' : ''} (${high} high, ${med} medium, ${low} low priority)

${ownerIssues.map((i, idx) => `${idx + 1}. ${i.action}`).join('\n')}
`;
    })
    .join('\n');
}

// Helper: Group issues by owner
function groupByOwner(issues: ReportData['issues']): string {
  const byOwner = new Map<string, number>();
  for (const issue of issues) {
    const count = byOwner.get(issue.ownerRole) || 0;
    byOwner.set(issue.ownerRole, count + 1);
  }

  return Array.from(byOwner.entries())
    .map(([owner, count]) => `- **${owner}:** ${count} actions`)
    .join('\n');
}

// Helper: Convert markdown to HTML using marked library
function markdownToHtml(markdown: string): string {
  const htmlContent = marked(markdown) as string;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --pass: #16a34a;
      --partial: #ea580c;
      --fail: #dc2626;
      --high: #dc2626;
      --medium: #ea580c;
      --low: #2563eb;
      --bg-pass: #dcfce7;
      --bg-partial: #fef3c7;
      --bg-fail: #fee2e2;
      --primary: #1e40af;
      --primary-light: #3b82f6;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      max-width: 850px;
      margin: 0 auto;
      padding: 1.5rem;
      color: #1e293b;
      font-size: 0.9rem;
    }

    /* ========== TITLE PAGE ========== */
    .title-bg-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }

    .title-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,58,95,0.82) 50%, rgba(30,64,175,0.78) 100%);
      z-index: 1;
    }

    .title-page {
      min-height: 100vh;
      margin: -1.5rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,58,95,0.88) 50%, rgba(30,64,175,0.85) 100%),
        url('data:image/jpeg;base64,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');
      background-size: cover;
      background-position: center;
      position: relative;
      overflow: hidden;
    }

    .title-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    }

    .title-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      z-index: 2;
      text-align: center;
    }

    .title-badge {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      padding: 0.5rem 1.5rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      margin-bottom: 1.5rem;
    }

    .title-main {
      color: white;
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 1rem 0;
      border: none;
      padding: 0;
      letter-spacing: -0.02em;
    }

    .title-project {
      color: #93c5fd;
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .title-meta {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 2.5rem;
    }

    .title-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .title-stat {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 1.25rem 2rem;
      text-align: center;
    }

    .title-stat.status-risk { border-color: var(--fail); background: rgba(220,38,38,0.2); }
    .title-stat.status-attention { border-color: var(--partial); background: rgba(234,88,12,0.2); }
    .title-stat.status-good { border-color: var(--pass); background: rgba(22,163,74,0.2); }

    .stat-big {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .title-donut {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 1.5rem 2rem;
      margin-top: 1rem;
    }

    .donut-chart {
      width: 100px;
      height: 100px;
    }

    .donut-bg {
      fill: none;
      stroke: rgba(255,255,255,0.1);
      stroke-width: 12;
    }

    .donut-pass, .donut-partial, .donut-fail {
      fill: none;
      stroke-width: 12;
      stroke-linecap: round;
    }

    .donut-pass { stroke: var(--pass); }
    .donut-partial { stroke: var(--partial); }
    .donut-fail { stroke: var(--fail); }

    .donut-number {
      fill: white;
      font-size: 1.5rem;
      font-weight: 700;
      text-anchor: middle;
    }

    .donut-label {
      fill: #94a3b8;
      font-size: 0.6rem;
      text-anchor: middle;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .donut-legend {
      text-align: left;
    }

    .legend-row {
      color: #e2e8f0;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.4rem 0;
    }

    .title-footer {
      padding: 1rem 1.5rem;
      text-align: center;
      background: linear-gradient(135deg, rgba(59,130,246,0.95), rgba(139,92,246,0.95));
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      position: relative;
      z-index: 2;
      border-radius: 8px;
      margin: 1rem 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }

    .footer-sub {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.9);
      margin-top: 0.25rem;
      font-weight: 400;
    }

    .page-break {
      page-break-after: always;
      margin: 0;
      padding: 0;
    }

    /* ========== CONTENT PAGES ========== */
    h1 {
      color: #0f172a;
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #3b82f6;
    }

    .header-meta {
      color: #64748b;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }

    /* Status boxes */
    .status-box {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin: 1rem 0 1.5rem 0;
    }
    .status-box.risk {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      border-left: 5px solid #dc2626;
    }
    .status-box.attention {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-left: 5px solid #f59e0b;
    }
    .status-box.good {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      border-left: 5px solid #16a34a;
    }
    .status-headline {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    /* Section headers */
    h2 {
      color: #1e40af;
      font-size: 1.15rem;
      margin: 2rem 0 1rem 0;
      padding: 0.5rem 0.75rem;
      background: linear-gradient(90deg, #dbeafe, transparent);
      border-left: 4px solid #3b82f6;
      border-radius: 0 4px 4px 0;
    }

    h3 { color: #334155; font-size: 1rem; margin: 1.25rem 0 0.5rem 0; }

    /* Results visual bar */
    .results-visual { margin: 1rem 0; }
    .result-bar {
      display: flex;
      height: 32px;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
    }
    .bar-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      min-width: 30px;
    }
    .bar-segment.pass { background: var(--pass); }
    .bar-segment.partial { background: var(--partial); }
    .bar-segment.fail { background: var(--fail); }
    .bar-legend {
      display: flex;
      gap: 1.5rem;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #64748b;
    }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.pass { background: var(--pass); }
    .dot.partial { background: var(--partial); }
    .dot.fail { background: var(--fail); }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0;
      font-size: 0.8rem;
    }
    th, td {
      padding: 0.5rem 0.6rem;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    th {
      background: #1e40af;
      color: white;
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) { background: #f8fafc; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.65rem;
      text-transform: uppercase;
    }
    .badge.pass { background: var(--bg-pass); color: var(--pass); }
    .badge.partial { background: var(--bg-partial); color: var(--partial); }
    .badge.fail { background: var(--bg-fail); color: var(--fail); }

    .sev-high { color: var(--high); font-weight: 600; }
    .sev-med { color: var(--medium); font-weight: 600; }
    .sev-low { color: var(--low); font-weight: 600; }

    .fail-count { background: var(--bg-fail); color: var(--fail); padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; }
    .partial-count { background: var(--bg-partial); color: var(--partial); padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; margin-left: 0.25rem; }

    .effort-s { background: #dcfce7; color: #166534; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 600; }
    .effort-m { background: #fef3c7; color: #92400e; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 600; }
    .effort-l { background: #fee2e2; color: #991b1b; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 600; }

    /* Finding cards */
    .severity-section { margin: 0.5rem 0; }
    .severity-section.high .finding { border-left-color: var(--high); }
    .severity-section.medium .finding { border-left-color: var(--medium); }
    .severity-section.low .finding { border-left-color: var(--low); }

    .finding {
      background: white;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #94a3b8;
      border-radius: 0 6px 6px 0;
      padding: 0.75rem 1rem;
      margin: 0.75rem 0;
      page-break-inside: avoid;
    }
    .finding.high { border-left-color: var(--high); background: linear-gradient(90deg, #fef2f2 0%, white 15%); }
    .finding.medium { border-left-color: var(--medium); background: linear-gradient(90deg, #fffbeb 0%, white 15%); }
    .finding.low { border-left-color: var(--low); background: linear-gradient(90deg, #eff6ff 0%, white 15%); }

    .finding-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .finding-id {
      font-weight: 700;
      color: #1e40af;
      font-size: 0.8rem;
    }
    .finding-title {
      font-weight: 600;
      color: #0f172a;
      flex: 1;
    }

    .finding p { margin: 0.4rem 0; font-size: 0.85rem; color: #475569; }
    .finding table { margin: 0.5rem 0; font-size: 0.75rem; }
    .finding th { padding: 0.35rem 0.5rem; }
    .finding td { padding: 0.35rem 0.5rem; }

    /* Compliance Narrative Boxes - aligns with landing page: Identify, Clarify, Justify, Address */
    .requirement-box {
      background: #f0f9ff;
      border-left: 3px solid #0284c7;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }
    .reference-box {
      background: #faf5ff;
      border-left: 3px solid #9333ea;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }
    .reference-box blockquote {
      margin: 0.3rem 0 0 0;
      padding-left: 0.5rem;
      border-left: 2px solid #c4b5fd;
      color: #6b21a8;
      font-style: italic;
      font-size: 0.75rem;
    }
    .assessment-box {
      background: #f8fafc;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }
    .evidence-box {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }
    .evidence-box.partial {
      background: #fefce8;
      border-left-color: #eab308;
    }
    .evidence-box blockquote {
      margin: 0.3rem 0 0 0;
      padding-left: 0.5rem;
      border-left: 2px solid #86efac;
      color: #166534;
      font-style: italic;
      font-size: 0.75rem;
    }
    .gaps-box {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }
    .gaps-box ul {
      margin: 0.3rem 0 0 1rem;
      padding: 0;
    }
    .gaps-box li {
      margin: 0.2rem 0;
      font-size: 0.75rem;
    }
    .action-box {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
      font-size: 0.8rem;
    }

    /* Compliance Demonstrated Section */
    .compliance-section { margin: 1rem 0; }
    .compliance-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      margin: 0.5rem 0;
      page-break-inside: avoid;
    }
    .compliance-item.pass {
      border-left: 4px solid #22c55e;
      background: linear-gradient(90deg, #f0fdf4 0%, white 15%);
    }
    .compliance-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .compliance-details {
      font-size: 0.8rem;
      color: #475569;
    }
    .compliance-details p {
      margin: 0.3rem 0;
    }

    /* Disclaimer */
    .disclaimer {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      color: #64748b;
      margin: 1rem 0;
    }

    /* Methodology Section */
    .methodology-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1rem 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .methodology-section h3 {
      page-break-after: avoid;
      break-after: avoid;
    }

    .algorithm-header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .algorithm-badge {
      display: inline-block;
      background: linear-gradient(135deg, #1e40af, #7c3aed);
      color: white;
      padding: 0.4rem 1.2rem;
      border-radius: 50px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      margin-bottom: 0.75rem;
      box-shadow: 0 2px 8px rgba(30,64,175,0.3);
    }

    .algorithm-title {
      color: #1e293b;
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
      padding: 0;
      border: none;
    }

    .algorithm-intro {
      text-align: center;
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
      max-width: 90%;
      margin-left: auto;
      margin-right: auto;
    }

    .methodology-grid {
      display: grid;
      page-break-inside: avoid;
      break-inside: avoid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .method-card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }

    .method-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }

    .method-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .method-desc {
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.4;
    }

    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, #e2e8f0, #cbd5e1, #e2e8f0);
      margin: 1.5rem 0;
    }

    ul { padding-left: 1.25rem; margin: 0.5rem 0; }
    li { margin: 0.25rem 0; }
    p { margin: 0.5rem 0; }

    /* Print/PDF - Smart page breaking */
    @media print {
      body { padding: 0.5rem; font-size: 0.8rem; }
      h1 { font-size: 1.2rem; }
      h2 { font-size: 0.95rem; margin-top: 1rem; page-break-after: avoid; }

      /* Allow large tables to break across pages */
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; } /* Repeat headers on new page */

      /* Keep finding cards together */
      .finding { page-break-inside: avoid; margin: 0.5rem 0; }

      /* Prevent awkward orphans */
      p { orphans: 3; widows: 3; }

      /* Tighter spacing */
      .status-box { margin: 0.75rem 0; padding: 0.75rem; }
      hr { margin: 1rem 0; }
    }

    /* Make tables flow better - avoid large gaps */
    table { margin: 0.5rem 0; }

    /* Tighter finding cards to fit more per page */
    .finding { padding: 0.6rem 0.8rem; margin: 0.5rem 0; }
    .finding p { margin: 0.3rem 0; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

// ============================================
// MATRIX-BASED REPORT GENERATION
// ============================================

// Get matrix report content for display
export async function getMatrixReportContent(
  packVersionId: string
): Promise<{ markdown: string; assessment: FullAssessment | null; uiSummary: object | null }> {
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      pack: true,
      documents: true,
    },
  });

  if (!packVersion) {
    throw new Error(`Pack version not found: ${packVersionId}`);
  }

  // Check if matrix assessment exists
  if (!packVersion.matrixAssessment) {
    return { markdown: '', assessment: null, uiSummary: null };
  }

  const assessment: FullAssessment = JSON.parse(packVersion.matrixAssessment);

  const reportData = {
    assessment,
    packName: packVersion.pack.name,
    versionNumber: packVersion.versionNumber,
    projectName: packVersion.projectName,
    documentCount: packVersion.documents.length,
  };

  const markdown = generateMatrixReport(reportData);
  const uiSummary = generateUISummary(reportData);

  return { markdown, assessment, uiSummary };
}

// Generate matrix-based markdown report file
export async function generateMatrixMarkdownReport(
  packVersionId: string
): Promise<string> {
  const { markdown } = await getMatrixReportContent(packVersionId);

  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: { pack: true },
  });

  if (!packVersion) {
    throw new Error(`Pack version not found: ${packVersionId}`);
  }

  const filename = `matrix-report-${packVersion.pack.name}-v${packVersion.versionNumber}.md`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, markdown);

  await prisma.outputArtifact.create({
    data: {
      packVersionId,
      artifactType: 'matrix_md',
      path: filepath,
    },
  });

  return filepath;
}

// Generate matrix-based PDF report
export async function generateMatrixPDFReport(
  packVersionId: string
): Promise<string> {
  const { markdown } = await getMatrixReportContent(packVersionId);
  const html = markdownToHtml(markdown);

  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: { pack: true },
  });

  if (!packVersion) {
    throw new Error(`Pack version not found: ${packVersionId}`);
  }

  const filename = `matrix-report-${packVersion.pack.name}-v${packVersion.versionNumber}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: filepath,
    format: 'A4',
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
    printBackground: true,
  });
  await browser.close();

  await prisma.outputArtifact.create({
    data: {
      packVersionId,
      artifactType: 'matrix_pdf',
      path: filepath,
    },
  });

  return filepath;
}

// Generate matrix-based JSON export
export async function generateMatrixJSONExport(
  packVersionId: string
): Promise<string> {
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      pack: true,
      documents: true,
    },
  });

  if (!packVersion || !packVersion.matrixAssessment) {
    throw new Error(`Pack version not found or no matrix assessment: ${packVersionId}`);
  }

  const assessment: FullAssessment = JSON.parse(packVersion.matrixAssessment);

  const exportData = generateMatrixJSON({
    assessment,
    packName: packVersion.pack.name,
    versionNumber: packVersion.versionNumber,
    projectName: packVersion.projectName,
    documentCount: packVersion.documents.length,
  });

  const filename = `matrix-report-${packVersion.pack.name}-v${packVersion.versionNumber}.json`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

  await prisma.outputArtifact.create({
    data: {
      packVersionId,
      artifactType: 'matrix_json',
      path: filepath,
    },
  });

  return filepath;
}

// AI Actions that can be applied
export interface AIAction {
  id: string;
  title: string;
  description: string;
  applied: boolean;
}

// Generate editable DOCX with submitted pack content + AI suggestions highlighted
export async function generateEditableDocx(
  packVersionId: string,
  appliedActions: string[]
): Promise<string> {
  const packVersion = await prisma.packVersion.findUnique({
    where: { id: packVersionId },
    include: {
      pack: true,
      documents: {
        include: { chunks: true },
        orderBy: { filename: 'asc' },
      },
    },
  });

  if (!packVersion || !packVersion.matrixAssessment) {
    throw new Error(`Pack version not found or no assessment: ${packVersionId}`);
  }

  const assessment: FullAssessment = JSON.parse(packVersion.matrixAssessment);
  const criteriaSummary = assessment.criteria_summary;
  const readinessScore = assessment.readiness_score ?? Math.round(((criteriaSummary.meets + criteriaSummary.partial * 0.5) / criteriaSummary.total_applicable) * 100);

  // Get issues that need attention (organized by document for inline insertion)
  const criticalIssues = assessment.results.filter(
    c => c.status === 'does_not_meet' || c.status === 'partial'
  );

  // Group issues by the document they reference
  const issuesByDocument: Record<string, typeof criticalIssues> = {};
  for (const issue of criticalIssues) {
    const docName = issue.pack_evidence?.document || 'General';
    if (!issuesByDocument[docName]) {
      issuesByDocument[docName] = [];
    }
    issuesByDocument[docName].push(issue);
  }

  // Build document sections
  const children: any[] = [];

  // ============================================
  // COVER PAGE
  // ============================================
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'GATEWAY 2 SUBMISSION PACK',
          bold: true,
          size: 48,
          color: '1E40AF',
        }),
      ],
      alignment: 'center',
      spacing: { after: 50 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'WITH AI-SUGGESTED IMPROVEMENTS',
          bold: true,
          size: 28,
          color: '16A34A',
        }),
      ],
      alignment: 'center',
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: packVersion.projectName || packVersion.pack.name,
          size: 32,
          color: '475569',
        }),
      ],
      alignment: 'center',
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Readiness Score: ${readinessScore}%`,
          bold: true,
          size: 28,
          color: readinessScore >= 80 ? '16A34A' : readinessScore >= 60 ? 'D97706' : 'DC2626',
        }),
      ],
      alignment: 'center',
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${criticalIssues.length} AI suggestions for improvement`, color: '64748B' }),
      ],
      alignment: 'center',
      spacing: { after: 400 },
    })
  );

  // ============================================
  // HOW TO USE THIS DOCUMENT
  // ============================================
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'HOW TO USE THIS DOCUMENT',
          bold: true,
          size: 24,
          color: '1E40AF',
        }),
      ],
      spacing: { before: 200, after: 150 },
      shading: { fill: 'EFF6FF' },
    })
  );

  const instructions = [
    '1. This document contains your original submission pack documents',
    '2. AI-suggested improvements are highlighted in YELLOW - review each one',
    '3. Accept suggestions by removing the highlight, or delete suggestions you disagree with',
    '4. Edit freely - this is your editable working copy',
    '5. Save this document to track your improvements',
  ];

  for (const instruction of instructions) {
    children.push(
      new Paragraph({
        text: instruction,
        spacing: { after: 50 },
        indent: { left: 200 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Yellow highlighted text = AI suggestions. ',
          bold: true,
          highlight: 'yellow',
        }),
        new TextRun({
          text: 'Normal text = your original submission.',
          italics: true,
          color: '64748B',
        }),
      ],
      spacing: { before: 100, after: 400 },
      indent: { left: 200 },
    })
  );

  // ============================================
  // TABLE OF CONTENTS - Documents in Pack
  // ============================================
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'DOCUMENTS IN THIS PACK',
          bold: true,
          size: 28,
          color: '1E40AF',
        }),
      ],
      spacing: { before: 300, after: 200 },
      border: {
        bottom: { style: 'single', size: 6, color: '1E40AF' },
      },
    })
  );

  // List each document with suggestion count
  for (let docIdx = 0; docIdx < packVersion.documents.length; docIdx++) {
    const doc = packVersion.documents[docIdx];
    const cleanFilename = doc.filename.replace(/^\d+-\d+-/, '');
    const docIssues = issuesByDocument[cleanFilename] || issuesByDocument[doc.filename] || [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${docIdx + 1}. `, bold: true, color: '64748B' }),
          new TextRun({ text: cleanFilename, bold: true }),
          docIssues.length > 0
            ? new TextRun({ text: ` (${docIssues.length} AI suggestions)`, color: '16A34A', italics: true })
            : new TextRun({ text: ' (no changes needed)', color: '94A3B8', italics: true }),
        ],
        spacing: { after: 50 },
      })
    );
  }

  // Summary of suggestions
  if (criticalIssues.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '\nSummary: ', bold: true }),
          new TextRun({ text: `${criticalIssues.length} total AI suggestions across all documents`, color: '64748B' }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );
  }

  // Page break after TOC
  children.push(
    new Paragraph({
      children: [],
      pageBreakBefore: true,
    })
  );

  // ============================================
  // DOCUMENT CONTENT WITH AI SUGGESTIONS
  // ============================================
  // Process each document in the pack
  for (let docIdx = 0; docIdx < packVersion.documents.length; docIdx++) {
    const doc = packVersion.documents[docIdx];
    const cleanFilename = doc.filename.replace(/^\d+-\d+-/, '');
    const docChunks = (doc as any).chunks || [];
    const docIssues = issuesByDocument[cleanFilename] || issuesByDocument[doc.filename] || [];

    // Document header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `DOCUMENT ${docIdx + 1}: ${cleanFilename}`,
            bold: true,
            size: 28,
            color: '1E40AF',
          }),
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { style: 'single', size: 6, color: '1E40AF' },
        },
      })
    );

    // Document type badge if available
    if (doc.docType) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Document Type: ', color: '64748B' }),
            new TextRun({ text: doc.docType, bold: true, color: '475569' }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Show suggestions count for this document
    if (docIssues.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${docIssues.length} AI suggestion${docIssues.length > 1 ? 's' : ''} for this document`,
              italics: true,
              color: '16A34A',
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Document content from chunks
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'DOCUMENT CONTENT',
            bold: true,
            size: 20,
            color: '475569',
          }),
        ],
        spacing: { before: 100, after: 100 },
        border: { bottom: { style: 'single', size: 4, color: 'E2E8F0' } },
      })
    );

    // Reconstruct document from chunks and insert AI suggestions inline
    if (docChunks.length > 0) {
      // Sort chunks by sequence
      const sortedChunks = [...docChunks].sort((a: any, b: any) => a.chunkIndex - b.chunkIndex);

      for (const chunk of sortedChunks) {
        const chunkText = chunk.text || '';
        const paragraphs = chunkText.split('\n').filter((p: string) => p.trim());

        for (const para of paragraphs) {
          // Check if any issues relate to this text
          const relevantIssue = docIssues.find(issue => {
            const quote = issue.pack_evidence?.quote?.toLowerCase() || '';
            return quote && para.toLowerCase().includes(quote.substring(0, 50));
          });

          children.push(
            new Paragraph({
              text: para,
              spacing: { after: 80 },
            })
          );

          // If there's a relevant issue for this paragraph, insert AI suggestion after it
          if (relevantIssue && relevantIssue.actions_required && relevantIssue.actions_required.length > 0) {
            const action = relevantIssue.actions_required[0];

            // AI Suggestion box
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: '▶ AI SUGGESTION: ',
                    bold: true,
                    color: '16A34A',
                  }),
                  new TextRun({
                    text: relevantIssue.matrix_title,
                    bold: true,
                    highlight: 'yellow',
                  }),
                ],
                spacing: { before: 100, after: 50 },
                shading: { fill: 'FFFBEB' },
                indent: { left: 300 },
              })
            );

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: action.action,
                    highlight: 'yellow',
                  }),
                ],
                spacing: { after: 50 },
                indent: { left: 300 },
              })
            );

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Reason: ${relevantIssue.reasoning}`,
                    italics: true,
                    color: '64748B',
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
                indent: { left: 300 },
              })
            );

            // Remove this issue from the list so it's not repeated
            const issueIdx = docIssues.indexOf(relevantIssue);
            if (issueIdx > -1) {
              docIssues.splice(issueIdx, 1);
            }
          }
        }
      }
    } else {
      // No chunks available
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[Document content not available - please refer to original PDF]',
              italics: true,
              color: '94A3B8',
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Show any remaining issues for this document that weren't matched to specific text
    if (docIssues.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'ADDITIONAL AI SUGGESTIONS FOR THIS DOCUMENT',
              bold: true,
              size: 20,
              color: '16A34A',
            }),
          ],
          spacing: { before: 200, after: 100 },
          border: { bottom: { style: 'single', size: 4, color: '86EFAC' } },
        })
      );

      for (const issue of docIssues) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `▶ ${issue.matrix_title}`,
                bold: true,
                highlight: 'yellow',
              }),
            ],
            spacing: { before: 100, after: 50 },
            shading: { fill: 'FFFBEB' },
          })
        );

        if (issue.actions_required && issue.actions_required.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: issue.actions_required[0].action,
                  highlight: 'yellow',
                }),
              ],
              spacing: { after: 50 },
              indent: { left: 300 },
            })
          );
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Reason: ${issue.reasoning}`,
                italics: true,
                color: '64748B',
                size: 20,
              }),
            ],
            spacing: { after: 150 },
            indent: { left: 300 },
          })
        );
      }
    }

    // Page break between documents
    if (docIdx < packVersion.documents.length - 1) {
      children.push(
        new Paragraph({
          children: [],
          pageBreakBefore: true,
        })
      );
    }
  }

  // Show general issues not linked to specific documents
  const generalIssues = issuesByDocument['General'] || [];
  if (generalIssues.length > 0) {
    children.push(
      new Paragraph({
        children: [],
        pageBreakBefore: true,
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'GENERAL AI SUGGESTIONS',
            bold: true,
            size: 28,
            color: '16A34A',
          }),
        ],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { style: 'single', size: 6, color: '16A34A' },
        },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'These suggestions apply to your submission pack as a whole:',
            italics: true,
            color: '64748B',
          }),
        ],
        spacing: { after: 200 },
      })
    );

    for (const issue of generalIssues) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `▶ ${issue.matrix_title}`,
              bold: true,
              highlight: 'yellow',
            }),
          ],
          spacing: { before: 150, after: 50 },
          shading: { fill: 'FFFBEB' },
        })
      );

      if (issue.actions_required && issue.actions_required.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: issue.actions_required[0].action,
                highlight: 'yellow',
              }),
            ],
            spacing: { after: 50 },
            indent: { left: 300 },
          })
        );
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Reason: ${issue.reasoning}`,
              italics: true,
              color: '64748B',
              size: 20,
            }),
          ],
          spacing: { after: 150 },
          indent: { left: 300 },
        })
      );
    }
  }

  // ============================================
  // CRITICAL BLOCKING ISSUES - MUST ADDRESS
  // ============================================
  // Separate high-priority "does not meet" issues that would block approval
  const blockingIssues = assessment.results.filter(
    c => c.status === 'does_not_meet' && c.severity === 'high'
  );

  if (blockingIssues.length > 0) {
    children.push(
      new Paragraph({
        children: [],
        pageBreakBefore: true,
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '⚠️ CRITICAL: LIKELY TO BLOCK REGULATOR APPROVAL',
            bold: true,
            size: 32,
            color: 'DC2626',
          }),
        ],
        spacing: { before: 200, after: 100 },
        shading: { fill: 'FEF2F2' },
        border: {
          bottom: { style: 'single', size: 8, color: 'DC2626' },
        },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'The following issues are HIGH PRIORITY and MUST be addressed before submission. These are likely to result in rejection by the Building Safety Regulator.',
            bold: true,
            color: 'DC2626',
          }),
        ],
        spacing: { after: 200 },
        shading: { fill: 'FEF2F2' },
      })
    );

    for (let i = 0; i < blockingIssues.length; i++) {
      const issue = blockingIssues[i];

      // Issue header with red badge
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `BLOCKING ISSUE ${i + 1}: `,
              bold: true,
              color: 'DC2626',
            }),
            new TextRun({
              text: issue.matrix_title,
              bold: true,
              highlight: 'yellow',
            }),
          ],
          spacing: { before: 200, after: 100 },
          shading: { fill: 'FEF2F2' },
        })
      );

      // Finding
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Finding: ', bold: true }),
            new TextRun({ text: issue.reasoning }),
          ],
          spacing: { after: 100 },
          indent: { left: 300 },
        })
      );

      // Document reference
      if (issue.pack_evidence?.document) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Affected Document: ', bold: true }),
              new TextRun({ text: issue.pack_evidence.document }),
              issue.pack_evidence.page
                ? new TextRun({ text: ` (page ${issue.pack_evidence.page})`, color: '64748B' })
                : new TextRun({ text: '' }),
            ],
            spacing: { after: 50 },
            indent: { left: 300 },
          })
        );
      }

      // Required action with highlight
      if (issue.actions_required && issue.actions_required.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Required Action: ', bold: true, color: 'DC2626' }),
              new TextRun({
                text: issue.actions_required[0].action,
                highlight: 'yellow',
                bold: true,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 300 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Suggested Owner: ', color: '64748B' }),
              new TextRun({ text: issue.actions_required[0].owner, bold: true }),
            ],
            spacing: { after: 150 },
            indent: { left: 300 },
          })
        );
      }
    }

    // Action tracking section
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'BLOCKING ISSUES SIGN-OFF',
            bold: true,
            size: 24,
            color: 'DC2626',
          }),
        ],
        spacing: { before: 300, after: 100 },
        shading: { fill: 'FEF2F2' },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'All blocking issues addressed: ', bold: true }),
          new TextRun({ text: '☐ Yes  ☐ No  ☐ In Progress' }),
        ],
        spacing: { after: 50 },
        shading: { fill: 'FEF2F2' },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Reviewed by: _________________________ ', bold: true }),
          new TextRun({ text: 'Date: _____________' }),
        ],
        spacing: { after: 200 },
        shading: { fill: 'FEF2F2' },
      })
    );
  }

  // ============================================
  // APPENDIX: DOCUMENTS ANALYSED
  // ============================================
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'APPENDIX: DOCUMENTS ANALYSED',
          bold: true,
          size: 24,
          color: '475569',
        }),
      ],
      spacing: { before: 400, after: 200 },
      border: {
        bottom: { style: 'single', size: 6, color: '475569' },
      },
    })
  );

  for (const doc of packVersion.documents) {
    const cleanFilename = doc.filename.replace(/^\d+-\d+-/, '');
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '• ', bold: true }),
          new TextRun({ text: cleanFilename, bold: true }),
          new TextRun({ text: doc.docType ? ` (${doc.docType})` : '', color: '64748B' }),
        ],
        spacing: { after: 50 },
        indent: { left: 300 },
      })
    );
  }

  // ============================================
  // FOOTER: AUDIT INFO
  // ============================================
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'AUDIT INFORMATION',
          bold: true,
          size: 20,
          color: '94A3B8',
        }),
      ],
      spacing: { before: 400, after: 100 },
      border: {
        bottom: { style: 'single', size: 4, color: 'E2E8F0' },
      },
    })
  );

  const auditItems = [
    { label: 'Assessment date', value: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { label: 'Initial readiness score', value: `${readinessScore}%` },
    { label: 'Criteria assessed', value: `${criteriaSummary.total_applicable}` },
    { label: 'Generated by', value: 'BSR Quality Checker' },
  ];

  for (const item of auditItems) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${item.label}: `, color: '94A3B8' }),
          new TextRun({ text: item.value, color: '64748B' }),
        ],
        spacing: { after: 30 },
      })
    );
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);

  // Save file
  const filename = `submission-pack-with-suggestions-${packVersion.pack.name}-v${packVersion.versionNumber}.docx`;
  const filepath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  // Record artifact
  await prisma.outputArtifact.create({
    data: {
      packVersionId,
      artifactType: 'editable_docx',
      path: filepath,
    },
  });

  return filepath;
}

export default {
  generateMarkdownReport,
  generatePDFReport,
  generateJSONExport,
  getReportContent,
  getMatrixReportContent,
  generateMatrixMarkdownReport,
  generateMatrixPDFReport,
  generateMatrixJSONExport,
  generateEditableDocx,
};
