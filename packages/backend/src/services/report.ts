import fs from 'fs';
import path from 'path';
import prisma from '../db/client.js';
import puppeteer from 'puppeteer';

const REPORTS_DIR = path.join(process.cwd(), '..', '..', 'reports');

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

  const browser = await puppeteer.launch({ headless: true });
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
    fields: packVersion.fields,
    issues: packVersion.issues,
  };
}

// Helper: Build markdown report
function buildMarkdownReport(data: ReportData): string {
  const sections: string[] = [];

  // Header
  sections.push(`# BSR Gateway 2 Pack Quality Review

**Pack:** ${data.pack.name}
**Version:** ${data.version.versionNumber}
${data.version.projectName ? `**Project:** ${data.version.projectName}  ` : ''}
${data.version.borough ? `**Borough:** ${data.version.borough}  ` : ''}
**Generated:** ${new Date().toLocaleString()}

---

> **DISCLAIMER:** This report assesses document quality, clarity, and internal consistency only. It does NOT assess regulatory compliance. Compliance determinations are the sole responsibility of the Building Safety Regulator (BSR).

---
`);

  // Documents analyzed
  sections.push(`## Documents Analyzed

${data.documents.map((d) => `- **${d.filename}** (${d.docType || 'unclassified'})`).join('\n')}

---
`);

  // Extracted fields
  sections.push(`## Extracted Building Information

| Field | Value | Confidence | Source |
|-------|-------|------------|--------|
${data.fields
  .map(
    (f) =>
      `| ${formatFieldName(f.fieldName)} | ${f.fieldValue || '-'} | ${f.confidence} | ${f.evidenceDocument?.filename || '-'} p.${f.evidencePageRef || '-'} |`
  )
  .join('\n')}

---
`);

  // Issues by severity
  const highIssues = data.issues.filter((i) => i.severity === 'high');
  const mediumIssues = data.issues.filter((i) => i.severity === 'medium');
  const lowIssues = data.issues.filter((i) => i.severity === 'low');

  sections.push(`## Quality Issues Summary

- **High Priority:** ${highIssues.length} issues
- **Medium Priority:** ${mediumIssues.length} issues
- **Low Priority:** ${lowIssues.length} issues

---
`);

  // High priority issues
  if (highIssues.length > 0) {
    sections.push(`## High Priority Issues

${highIssues.map((i, idx) => formatIssue(i, idx + 1)).join('\n\n')}

---
`);
  }

  // Medium priority issues
  if (mediumIssues.length > 0) {
    sections.push(`## Medium Priority Issues

${mediumIssues.map((i, idx) => formatIssue(i, idx + 1)).join('\n\n')}

---
`);
  }

  // Low priority issues
  if (lowIssues.length > 0) {
    sections.push(`## Low Priority Issues

${lowIssues.map((i, idx) => formatIssue(i, idx + 1)).join('\n\n')}

---
`);
  }

  // Recommendations summary
  sections.push(`## Recommendations Summary

### By Owner Role

${groupByOwner(data.issues)}

### By Effort

- **Small (S):** ${data.issues.filter((i) => i.effort === 'S').length} actions
- **Medium (M):** ${data.issues.filter((i) => i.effort === 'M').length} actions
- **Large (L):** ${data.issues.filter((i) => i.effort === 'L').length} actions

---
`);

  // Footer
  sections.push(`## Notes

- Confidence ratings indicate the AI's certainty in each finding
- All findings should be verified by qualified professionals
- This report focuses on document quality, not regulatory compliance

*Generated by BSR Quality Checker*
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

// Helper: Format issue
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

// Helper: Convert markdown to HTML (basic)
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // Lists
    .replace(/^- (.*)/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/---/g, '<hr>')
    // Tables (basic)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match
        .split('|')
        .filter((c) => c.trim())
        .map((c) => `<td>${c.trim()}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.5rem; }
    h2 { color: #333; margin-top: 2rem; }
    h3 { color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    blockquote { background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; margin: 1rem 0; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 2rem 0; }
    li { margin: 0.25rem 0; }
  </style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
}

export default {
  generateMarkdownReport,
  generatePDFReport,
  generateJSONExport,
  getReportContent,
};
