/**
 * Export Routes
 *
 * Handles document exports for new FullAssessment format
 * Provides PDF generation for reports, briefs, and summaries
 */

import express, { Request, Response } from 'express';
import { generatePDFFromHTML, streamPDFToResponse } from '../utils/pdf-generator';
import { generateClientGapAnalysisHTML } from '../templates/client-gap-analysis';
import { generateConsultantActionPlanHTML } from '../templates/consultant-action-plan';
import prisma from '../db/client.js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import puppeteer from 'puppeteer';

const router = express.Router();

const PUPPETEER_OPTIONS = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

/**
 * POST /api/packs/:packId/versions/:versionId/compliance-report/download
 *
 * Generate simplified compliance report PDF (PRIMARY EXPORT)
 * - Executive summary with verdict
 * - Critical issues first
 * - Issues grouped by responsible party
 * - Clear action items
 */
router.post(
  '/packs/:packId/versions/:versionId/compliance-report/download',
  async (req: Request, res: Response) => {
    try {
      const { assessment } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      // Generate simplified compliance report HTML
      const html = generateComplianceReportHTML(assessment);

      // Generate PDF using utility
      const tempFile = await generatePDFFromHTML(html, 'compliance-report');

      // Stream to response and cleanup
      const filename = `bsr-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/client-gap-analysis/download
 *
 * Generate client-facing gap analysis (what they need to provide)
 * Simple checklist format, plain language, immediately actionable
 */
router.post(
  '/packs/:packId/versions/:versionId/client-gap-analysis/download',
  async (req: Request, res: Response) => {
    try {
      const { assessment } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      console.log('[Export] Generating client gap analysis...');
      const html = generateClientGapAnalysisHTML(assessment);

      // Generate PDF
      const tempFile = await generatePDFFromHTML(html, 'client-gap-analysis');

      // Stream to response
      const filename = `client-gap-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);
    } catch (error) {
      console.error('Error generating client gap analysis:', error);
      res.status(500).json({ error: 'Failed to generate client gap analysis' });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/consultant-action-plan/download
 *
 * Generate consultant working document (internal technical action plan)
 * Detailed analysis, specialist requirements, work breakdown, timeline
 */
router.post(
  '/packs/:packId/versions/:versionId/consultant-action-plan/download',
  async (req: Request, res: Response) => {
    try {
      const { assessment } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      console.log('[Export] Generating consultant action plan...');
      const html = generateConsultantActionPlanHTML(assessment);

      // Generate PDF
      const tempFile = await generatePDFFromHTML(html, 'consultant-action-plan');

      // Stream to response
      const filename = `consultant-action-plan-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);
    } catch (error) {
      console.error('Error generating consultant action plan:', error);
      res.status(500).json({ error: 'Failed to generate consultant action plan' });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/matrix-report/download/pdf
 *
 * Generate PDF from FullAssessment data
 * @deprecated Use /compliance-report/download instead
 */
router.post(
  '/packs/:packId/versions/:versionId/matrix-report/download/pdf',
  async (req: Request, res: Response) => {
    try {
      const { assessment, submissionGate, settings } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      // Generate HTML from assessment
      const html = generateAssessmentHTML(assessment, submissionGate, settings);

      // Create temporary PDF
      const tempFile = path.join(os.tmpdir(), `assessment-${Date.now()}.pdf`);

      const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: tempFile,
        format: 'A4',
        margin: { top: '1in', bottom: '1in', left: '0.75in', right: '0.75in' },
        printBackground: true,
      });
      await browser.close();

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="assessment-report-${new Date().toISOString().split('T')[0]}.pdf"`
      );

      const fileStream = fs.createReadStream(tempFile);
      fileStream.pipe(res);

      // Cleanup after sending
      fileStream.on('end', () => {
        fs.unlinkSync(tempFile);
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/executive-summary/download
 *
 * Generate executive summary PDF
 */
router.post(
  '/packs/:packId/versions/:versionId/executive-summary/download',
  async (req: Request, res: Response) => {
    try {
      const { assessment, submissionGate } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      // Generate executive summary HTML
      const html = generateExecutiveSummaryHTML(assessment, submissionGate);

      // Create temporary PDF
      const tempFile = path.join(os.tmpdir(), `executive-summary-${Date.now()}.pdf`);

      const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: tempFile,
        format: 'A4',
        margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
        printBackground: true,
      });
      await browser.close();

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="executive-summary-${new Date().toISOString().split('T')[0]}.pdf"`
      );

      const fileStream = fs.createReadStream(tempFile);
      fileStream.pipe(res);

      // Cleanup after sending
      fileStream.on('end', () => {
        fs.unlinkSync(tempFile);
      });
    } catch (error) {
      console.error('Error generating executive summary:', error);
      res.status(500).json({ error: 'Failed to generate executive summary' });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/engagement-brief/download
 *
 * Generate engagement brief PDF
 */
router.post(
  '/packs/:packId/versions/:versionId/engagement-brief/download',
  async (req: Request, res: Response) => {
    try {
      const { brief } = req.body;

      if (!brief) {
        res.status(400).json({ error: 'Brief data required' });
        return;
      }

      // Generate brief HTML
      const html = generateEngagementBriefHTML(brief);

      // Create temporary PDF
      const tempFile = path.join(os.tmpdir(), `engagement-brief-${Date.now()}.pdf`);

      const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: tempFile,
        format: 'A4',
        margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
        printBackground: true,
      });
      await browser.close();

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="engagement-brief-${brief.specialist_type.replace(/\s+/g, '-')}.pdf"`
      );

      const fileStream = fs.createReadStream(tempFile);
      fileStream.pipe(res);

      // Cleanup after sending
      fileStream.on('end', () => {
        fs.unlinkSync(tempFile);
      });
    } catch (error) {
      console.error('Error generating engagement brief:', error);
      res.status(500).json({ error: 'Failed to generate engagement brief' });
    }
  }
);

/**
 * POST /api/packs/:packId/versions/:versionId/outstanding-issues/download
 *
 * Generate Outstanding Issues Report PDF (human-required items only)
 */
router.post(
  '/packs/:packId/versions/:versionId/outstanding-issues/download',
  async (req: Request, res: Response) => {
    try {
      const { assessment } = req.body;

      if (!assessment) {
        res.status(400).json({ error: 'Assessment data required' });
        return;
      }

      // Filter to human-required issues only
      const humanRequired = assessment.results.filter((issue: any) => {
        const canAIFix =
          issue.proposed_change &&
          issue.proposed_change.length > 100 &&
          issue.confidence?.level !== 'REQUIRES_HUMAN_JUDGEMENT';
        return !canAIFix;
      });

      // Generate HTML
      const html = generateOutstandingIssuesHTML(assessment, humanRequired);

      // Create temporary PDF
      const tempFile = path.join(os.tmpdir(), `outstanding-issues-${Date.now()}.pdf`);

      const browser = await puppeteer.launch(PUPPETEER_OPTIONS);
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: tempFile,
        format: 'A4',
        margin: { top: '1in', bottom: '1in', left: '0.75in', right: '0.75in' },
        printBackground: true,
      });
      await browser.close();

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="outstanding-issues-${new Date().toISOString().split('T')[0]}.pdf"`
      );

      const fileStream = fs.createReadStream(tempFile);
      fileStream.pipe(res);

      // Cleanup after sending
      fileStream.on('end', () => {
        fs.unlinkSync(tempFile);
      });
    } catch (error) {
      console.error('Error generating outstanding issues report:', error);
      res.status(500).json({ error: 'Failed to generate outstanding issues report' });
    }
  }
);

/**
 * Transform reasoning into action-oriented plain English
 */
function transformRationale(issue: any): string {
  const reasoning = issue.reasoning || '';
  const gaps = issue.gaps_identified || [];
  const action = issue.actions_required?.[0];

  // Build plain English summary
  let summary = '';

  // What should be addressed (from success definition or title)
  const requirement = issue.success_definition || issue.matrix_title;
  summary += `This section should address: ${requirement}. `;

  // Current status (transform from reasoning, removing quotes)
  if (reasoning) {
    // Remove quote markers and clean up
    const cleanReasoning = reasoning
      .replace(/["']([^"']+)["']/g, '$1')
      .replace(/The document states?:?\s*/gi, 'Current submission: ')
      .replace(/According to.+?,\s*/gi, '')
      .trim();

    summary += `${cleanReasoning} `;
  }

  // Regulatory context (if available)
  if (issue.reference_evidence?.doc_title) {
    summary += `Regulatory requirement: ${issue.reference_evidence.doc_title}. `;
  }

  // Recommended action
  if (action) {
    summary += `Recommended action: ${action.action} (Owner: ${action.owner}, Effort: ${action.effort}).`;
  } else if (gaps.length > 0) {
    summary += `Address the following gaps: ${gaps.join('; ')}.`;
  }

  return summary;
}

/**
 * Group issues by responsible party
 */
function groupIssuesByResponsible(issues: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();

  issues.forEach(issue => {
    let responsible = 'General Issues';

    // Determine responsible party from category or actions
    const category = issue.category?.toLowerCase() || '';
    const actionOwner = issue.actions_required?.[0]?.owner?.toLowerCase() || '';

    if (category.includes('fire') || actionOwner.includes('fire engineer')) {
      responsible = 'Fire Safety (Fire Engineer Review)';
    } else if (category.includes('structural') || actionOwner.includes('structural')) {
      responsible = 'Structural (Structural Engineer Review)';
    } else if (category.includes('mep') || category.includes('mechanical') || category.includes('electrical')) {
      responsible = 'MEP Systems (MEP Engineer Review)';
    } else if (category.includes('architect') || actionOwner.includes('architect')) {
      responsible = 'Architectural (Architect Review)';
    } else if (issue.triage?.quick_win) {
      responsible = 'Quick Wins (Internal Team)';
    } else if (issue.triage?.engagement_type === 'SPECIALIST_REQUIRED') {
      responsible = 'Specialist Review Required';
    } else if (issue.triage?.engagement_type === 'INTERNAL_FIX') {
      responsible = 'Internal Team';
    }

    if (!groups.has(responsible)) {
      groups.set(responsible, []);
    }
    groups.get(responsible)!.push(issue);
  });

  // Sort groups: Quick Wins first, then by count descending
  const sortedGroups = new Map(
    Array.from(groups.entries()).sort((a, b) => {
      if (a[0].includes('Quick Wins')) return -1;
      if (b[0].includes('Quick Wins')) return 1;
      return b[1].length - a[1].length;
    })
  );

  return sortedGroups;
}

/**
 * Generate full assessment report HTML
 */
function generateAssessmentHTML(assessment: any, submissionGate?: any, settings?: any): string {
  const failedResults = assessment.results.filter(
    (r: any) => r.status === 'does_not_meet' || r.status === 'partial'
  );

  const criticalIssues = failedResults.filter(
    (r: any) => r.triage?.urgency === 'CRITICAL_BLOCKER'
  );
  const highPriorityIssues = failedResults.filter(
    (r: any) => r.triage?.urgency === 'HIGH_PRIORITY'
  );
  const quickWins = failedResults.filter((r: any) => r.triage?.quick_win);

  // Group issues by responsible party
  const groupedIssues = groupIssuesByResponsible(failedResults);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Assessment Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #0f172a;
      font-size: 28px;
      margin-bottom: 8px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 12px;
    }
    h2 {
      color: #1e293b;
      font-size: 22px;
      margin-top: 32px;
      margin-bottom: 16px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    h3 {
      color: #334155;
      font-size: 18px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .meta {
      color: #64748b;
      font-size: 14px;
      margin-top: 8px;
    }
    .gate-box {
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
      border-left: 5px solid;
    }
    .gate-red {
      background: #fef2f2;
      border-left-color: #dc2626;
    }
    .gate-amber {
      background: #fffbeb;
      border-left-color: #f59e0b;
    }
    .gate-green {
      background: #f0fdf4;
      border-left-color: #10b981;
    }
    .gate-status {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 24px 0;
    }
    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #0f172a;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .issue {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .issue-id {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 4px;
      color: #475569;
    }
    .issue-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-critical {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-high {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-quick-win {
      background: #d1fae5;
      color: #065f46;
    }
    .issue-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .issue-reasoning {
      color: #475569;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .evidence {
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      padding: 12px;
      margin: 12px 0;
      font-size: 13px;
    }
    .evidence-quote {
      font-style: italic;
      color: #334155;
    }
    .evidence-source {
      color: #64748b;
      font-size: 12px;
      margin-top: 8px;
    }
    .action {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      padding: 12px;
      margin: 8px 0;
      font-size: 13px;
    }
    .action-owner {
      font-weight: 600;
      color: #1e40af;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Building Safety Assessment Report</h1>
    <div class="meta">
      ${assessment.pack_context.buildingType} ${assessment.pack_context.isLondon ? '• London' : ''}
      ${assessment.pack_context.isHRB ? '• HRB' : ''}<br>
      Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </div>

  ${submissionGate ? `
  <h2>Submission Gate Status</h2>
  <div class="gate-box gate-${submissionGate.gate_status.toLowerCase()}">
    <div class="gate-status">${submissionGate.gate_status} - ${submissionGate.can_submit ? 'Ready for Submission' : 'Not Ready'}</div>
    <p><strong>Critical Blockers:</strong> ${submissionGate.blockers_count}</p>
    <p><strong>High Priority Issues:</strong> ${submissionGate.high_priority_count}</p>
    <p>${submissionGate.recommendation}</p>
  </div>
  ` : ''}

  <h2>Assessment Summary</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${assessment.readiness_score}</div>
      <div class="stat-label">Readiness Score</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${criticalIssues.length}</div>
      <div class="stat-label">Critical Issues</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${quickWins.length}</div>
      <div class="stat-label">Quick Wins</div>
    </div>
  </div>

  <div class="page-break"></div>
  <h2>Issues by Responsible Party</h2>
  <p style="color: #64748b; margin-bottom: 24px;">
    Issues are grouped by the team or specialist responsible for resolution.
    Each section includes recommended actions and regulatory context.
  </p>

  ${Array.from(groupedIssues.entries()).map(([responsible, issues], idx) => `
    ${idx > 0 ? '<div class="page-break"></div>' : ''}
    <h2 style="color: #1e40af; border-left: 5px solid #3b82f6; padding-left: 16px; margin-top: 40px;">
      ${responsible} (${issues.length} item${issues.length !== 1 ? 's' : ''})
    </h2>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>Responsible:</strong> ${responsible.split('(')[0].trim()}<br>
        <strong>Items:</strong> ${issues.length}<br>
        <strong>Critical:</strong> ${issues.filter((i: any) => i.triage?.urgency === 'CRITICAL_BLOCKER').length}
      </p>
    </div>
    ${issues.map((issue: any) => generateIssueHTMLGrouped(issue)).join('\n')}
  `).join('\n')}

  <div class="footer">
    <p><strong>BSR Quality Checker</strong> • Automated Building Safety Assessment</p>
    <p>This report was generated automatically. All findings should be reviewed by qualified professionals.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate issue HTML block (legacy - kept for compatibility)
 */
function generateIssueHTML(issue: any): string {
  const urgencyBadge =
    issue.triage?.urgency === 'CRITICAL_BLOCKER'
      ? '<span class="issue-badge badge-critical">🔴 Critical</span>'
      : issue.triage?.urgency === 'HIGH_PRIORITY'
      ? '<span class="issue-badge badge-high">🟡 High</span>'
      : '';

  const quickWinBadge = issue.triage?.quick_win
    ? '<span class="issue-badge badge-quick-win">⚡ Quick Win</span>'
    : '';

  const action = issue.actions_required?.[0];

  return `
  <div class="issue">
    <div class="issue-header">
      <span class="issue-id">${issue.matrix_id}</span>
      <div>
        ${urgencyBadge}
        ${quickWinBadge}
      </div>
    </div>
    <div class="issue-title">${issue.matrix_title}</div>
    <div class="issue-reasoning">${issue.reasoning}</div>

    ${issue.pack_evidence?.quote ? `
    <div class="evidence">
      <div class="evidence-quote">"${issue.pack_evidence.quote}"</div>
      <div class="evidence-source">
        ${issue.pack_evidence.document}${issue.pack_evidence.page ? `, Page ${issue.pack_evidence.page}` : ''}
      </div>
    </div>
    ` : ''}

    ${action ? `
    <div class="action">
      <strong>Action Required:</strong> ${action.action}<br>
      <span class="action-owner">Owner:</span> ${action.owner} •
      <strong>Effort:</strong> ${action.effort}
      ${action.expected_benefit ? `<br><strong>Benefit:</strong> ${action.expected_benefit}` : ''}
    </div>
    ` : ''}
  </div>
  `;
}

/**
 * Generate issue HTML block with improved rationale (grouped format)
 */
function generateIssueHTMLGrouped(issue: any): string {
  const urgencyBadge =
    issue.triage?.urgency === 'CRITICAL_BLOCKER'
      ? '<span class="issue-badge badge-critical">🔴 Critical</span>'
      : issue.triage?.urgency === 'HIGH_PRIORITY'
      ? '<span class="issue-badge badge-high">🟡 High</span>'
      : '';

  const quickWinBadge = issue.triage?.quick_win
    ? '<span class="issue-badge badge-quick-win">⚡ Quick Win</span>'
    : '';

  const blocksSubmission = issue.triage?.blocks_submission
    ? '<span class="issue-badge" style="background: #fee2e2; color: #991b1b;">🚫 BLOCKS SUBMISSION</span>'
    : '';

  // Use transformed rationale
  const rationale = transformRationale(issue);

  return `
  <div class="issue">
    <div class="issue-header">
      <span class="issue-id">${issue.matrix_id}</span>
      <div style="display: flex; gap: 4px;">
        ${blocksSubmission}
        ${urgencyBadge}
        ${quickWinBadge}
      </div>
    </div>
    <div class="issue-title">${issue.matrix_title}</div>

    <div style="background: #f8fafc; border-left: 3px solid #3b82f6; padding: 12px; margin: 12px 0; font-size: 14px; color: #334155;">
      ${rationale}
    </div>

    ${issue.pack_evidence?.document ? `
    <div style="margin-top: 12px; padding: 8px; background: #fef9c3; border-left: 3px solid #eab308;">
      <div style="font-size: 12px; color: #92400e; font-weight: 600; margin-bottom: 4px;">
        Current Submission Reference:
      </div>
      <div style="font-size: 13px; color: #78350f;">
        ${issue.pack_evidence.document}${issue.pack_evidence.page ? `, Page ${issue.pack_evidence.page}` : ''}
      </div>
    </div>
    ` : ''}
  </div>
  `;
}

/**
 * Generate executive summary HTML (simplified report)
 */
function generateExecutiveSummaryHTML(assessment: any, submissionGate?: any): string {
  const failedResults = assessment.results.filter(
    (r: any) => r.status === 'does_not_meet' || r.status === 'partial'
  );

  const criticalIssues = failedResults.filter(
    (r: any) => r.triage?.urgency === 'CRITICAL_BLOCKER'
  );
  const highPriorityIssues = failedResults.filter(
    (r: any) => r.triage?.urgency === 'HIGH_PRIORITY'
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Executive Summary</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 32px; color: #0f172a; margin-bottom: 16px; }
    h2 { font-size: 24px; color: #1e293b; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .gate-box { padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 5px solid; }
    .gate-red { background: #fef2f2; border-left-color: #dc2626; }
    .gate-amber { background: #fffbeb; border-left-color: #f59e0b; }
    .gate-green { background: #f0fdf4; border-left-color: #10b981; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 32px 0; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: bold; color: #0f172a; }
    .stat-label { font-size: 13px; color: #64748b; text-transform: uppercase; margin-top: 8px; }
    .key-finding { background: #fef9c3; border-left: 4px solid #eab308; padding: 16px; margin: 12px 0; }
    ul { margin: 12px 0; padding-left: 24px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>Executive Summary</h1>
  <p><strong>${assessment.pack_context.buildingType}</strong> ${assessment.pack_context.isLondon ? '• London' : ''} ${assessment.pack_context.isHRB ? '• HRB' : ''}</p>
  <p>Assessment Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

  ${submissionGate ? `
  <h2>Submission Recommendation</h2>
  <div class="gate-box gate-${submissionGate.gate_status.toLowerCase()}">
    <h3 style="margin-top:0;">${submissionGate.gate_status}: ${submissionGate.can_submit ? 'Ready for Submission' : 'Not Ready for Submission'}</h3>
    <p>${submissionGate.recommendation}</p>
    <p><strong>Critical Blockers:</strong> ${submissionGate.blockers_count} | <strong>High Priority:</strong> ${submissionGate.high_priority_count}</p>
  </div>
  ` : ''}

  <h2>Key Metrics</h2>
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${assessment.readiness_score}</div>
      <div class="stat-label">Readiness Score</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${failedResults.length}</div>
      <div class="stat-label">Total Issues</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${criticalIssues.length}</div>
      <div class="stat-label">Critical</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${highPriorityIssues.length}</div>
      <div class="stat-label">High Priority</div>
    </div>
  </div>

  <h2>Key Findings</h2>
  ${criticalIssues.slice(0, 5).map((issue: any) => `
    <div class="key-finding">
      <strong>${issue.matrix_id}:</strong> ${issue.matrix_title}<br>
      <small>${issue.reasoning}</small>
    </div>
  `).join('\n')}

  <h2>Recommended Next Steps</h2>
  <ul>
    ${criticalIssues.length > 0 ? '<li><strong>Address critical blockers immediately</strong> - These prevent submission</li>' : ''}
    ${highPriorityIssues.length > 0 ? '<li>Review and plan remediation for high priority issues</li>' : ''}
    <li>Consult with relevant specialists where required</li>
    <li>Review full assessment report for complete details</li>
  </ul>

  <div style="margin-top:40px; padding-top:20px; border-top:2px solid #e2e8f0; text-align:center; color:#64748b; font-size:12px;">
    <p><strong>BSR Quality Checker</strong> • Executive Summary</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate engagement brief HTML
 */
function generateEngagementBriefHTML(brief: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Engagement Brief - ${brief.specialist_type}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; }
    h2 { font-size: 20px; color: #1e293b; margin-top: 28px; margin-bottom: 12px; }
    .header-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; }
    .issue-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .issue-item { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .issue-item:last-child { border-bottom: none; }
    ul { margin: 12px 0; padding-left: 24px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>Specialist Engagement Brief</h1>
  <div class="header-box">
    <p><strong>Specialist Type:</strong> ${brief.specialist_type}</p>
    <p><strong>Issues to Address:</strong> ${brief.issues_to_address.length}</p>
    <p><strong>Estimated Duration:</strong> ${brief.estimated_duration}</p>
  </div>

  <h2>Scope of Work</h2>
  <p>${brief.scope_of_work}</p>

  <h2>Issues Requiring Attention</h2>
  <div class="issue-list">
    ${brief.issues_to_address.map((issue: any) => `
      <div class="issue-item">
        <strong>${issue.id}:</strong> ${issue.title}
        ${issue.urgency ? ` <span style="color:#dc2626;">[${issue.urgency}]</span>` : ''}
      </div>
    `).join('\n')}
  </div>

  <h2>Deliverables Expected</h2>
  <ul>
    ${brief.deliverables.map((d: string) => `<li>${d}</li>`).join('\n')}
  </ul>

  <h2>Regulatory Context</h2>
  <ul>
    ${brief.regulatory_context.map((c: string) => `<li>${c}</li>`).join('\n')}
  </ul>

  <h2>Detailed Brief</h2>
  <div style="white-space: pre-wrap;">${brief.brief_text}</div>

  <div style="margin-top:40px; padding-top:20px; border-top:2px solid #e2e8f0; text-align:center; color:#64748b; font-size:12px;">
    <p><strong>BSR Quality Checker</strong> • Specialist Engagement Brief</p>
    <p>Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate Outstanding Issues Report HTML
 * Shows only human-required items grouped by responsible party
 */
function generateOutstandingIssuesHTML(assessment: any, humanRequired: any[]): string {
  // Group by responsible party
  const groupedIssues = groupIssuesByResponsible(humanRequired);

  // Count by urgency
  const criticalCount = humanRequired.filter((i: any) => i.triage?.urgency === 'CRITICAL_BLOCKER').length;
  const highCount = humanRequired.filter((i: any) => i.triage?.urgency === 'HIGH_PRIORITY').length;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Outstanding Issues Report</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }
    .header {
      border-bottom: 4px solid #f59e0b;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 300;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-top: 8px;
    }
    .summary-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin-bottom: 30px;
    }
    .summary-box h2 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #92400e;
    }
    .summary-box p {
      margin: 8px 0;
      color: #78350f;
      font-size: 14px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin: 20px 0 30px 0;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      text-align: center;
    }
    .stat-card .number {
      font-size: 32px;
      font-weight: 600;
      color: #0f172a;
      display: block;
    }
    .stat-card .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .section {
      page-break-inside: avoid;
      margin-bottom: 40px;
    }
    .section-header {
      background: #f59e0b;
      color: white;
      padding: 12px 20px;
      margin-bottom: 20px;
      font-size: 18px;
      font-weight: 600;
    }
    .issue {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }
    .issue-id {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 11px;
      background: #f1f5f9;
      color: #475569;
      padding: 4px 8px;
      border-radius: 3px;
    }
    .issue-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin: 8px 0;
    }
    .issue-description {
      color: #475569;
      font-size: 14px;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 3px;
      letter-spacing: 0.05em;
    }
    .badge-critical {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
    .badge-high {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
    .badge-medium {
      background: #f0f9ff;
      color: #075985;
      border: 1px solid #bae6fd;
    }
    .action-box {
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      padding: 12px 16px;
      margin-top: 12px;
      font-size: 13px;
    }
    .action-box strong {
      color: #1e40af;
    }
    .page-break {
      page-break-before: always;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Outstanding Issues Report</h1>
    <div class="subtitle">Items Requiring Human Review &amp; Professional Judgement</div>
    <div class="subtitle">Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <div class="summary-box">
    <h2>Executive Summary</h2>
    <p><strong>${humanRequired.length}</strong> items require human attention and cannot be resolved automatically.</p>
    <p>These issues require professional judgement, missing information, or physical evidence that must be provided by the appropriate specialists.</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <span class="number">${humanRequired.length}</span>
      <span class="label">Total Issues</span>
    </div>
    <div class="stat-card">
      <span class="number">${criticalCount}</span>
      <span class="label">Critical</span>
    </div>
    <div class="stat-card">
      <span class="number">${highCount}</span>
      <span class="label">High Priority</span>
    </div>
  </div>

  ${Array.from(groupedIssues.entries()).map(([responsible, issues], idx) => `
    ${idx > 0 ? '<div class="page-break"></div>' : ''}
    <div class="section">
      <div class="section-header">
        ${responsible} (${issues.length} ${issues.length === 1 ? 'item' : 'items'})
      </div>
      ${issues.map((issue: any, issueIdx: number) => {
        const urgency = issue.triage?.urgency || 'MEDIUM_PRIORITY';
        const badgeClass =
          urgency === 'CRITICAL_BLOCKER' ? 'badge-critical' :
          urgency === 'HIGH_PRIORITY' ? 'badge-high' : 'badge-medium';
        const badgeText =
          urgency === 'CRITICAL_BLOCKER' ? 'Critical' :
          urgency === 'HIGH_PRIORITY' ? 'High' : 'Medium';

        const action = issue.actions_required?.[0];
        const transformedRationale = transformRationale(issue);

        return `
        <div class="issue">
          <div class="issue-header">
            <div>
              <div class="issue-id">${issue.matrix_id}</div>
              <div class="issue-title">${issue.matrix_title}</div>
            </div>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>

          <div class="issue-description">
            ${transformedRationale}
          </div>

          ${action ? `
          <div class="action-box">
            <strong>Required Action:</strong> ${action.action}<br>
            <strong>Owner:</strong> ${action.owner} • <strong>Estimated Effort:</strong> ${action.effort}
          </div>
          ` : ''}

          ${issue.gaps_identified && issue.gaps_identified.length > 0 ? `
          <div style="margin-top: 12px; font-size: 13px; color: #64748b;">
            <strong>Gaps Identified:</strong>
            <ul style="margin: 4px 0 0 20px;">
              ${issue.gaps_identified.map((gap: string) => `<li>${gap}</li>`).join('\n')}
            </ul>
          </div>
          ` : ''}
        </div>
        `;
      }).join('\n')}
    </div>
  `).join('\n')}

  <div class="footer">
    <p><strong>BSR Quality Checker</strong> • Outstanding Issues Report</p>
    <p>This report contains items requiring human review and professional judgement.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate Simplified Compliance Report HTML
 * Clean, consultant-friendly format focused on actionable insights
 * Prioritized for time-pressured consultants
 */
function generateComplianceReportHTML(assessment: any): string {
  // Filter to only issues (partial or does_not_meet)
  const allIssues = assessment.results.filter((r: any) =>
    r.status === 'does_not_meet' || r.status === 'partial'
  );

  // CATEGORIZE ISSUES BY PRIORITY
  // 1. REJECTION RISKS: Critical issues that block submission
  const rejectionRisks = allIssues.filter((i: any) =>
    i.triage?.urgency === 'CRITICAL_BLOCKER' ||
    i.triage?.blocks_submission ||
    i.severity === 'high'
  );

  // 2. MISSING INFORMATION: Issues with missing/TBC content
  const missingInfo = allIssues.filter((i: any) => {
    const reasoning = (i.reasoning || '').toLowerCase();
    const gaps = (i.gaps_identified || []).join(' ').toLowerCase();
    const hasMissingContent =
      reasoning.includes('missing') ||
      reasoning.includes('not provided') ||
      reasoning.includes('tbc') ||
      reasoning.includes('to be confirmed') ||
      gaps.includes('missing');
    return hasMissingContent && !rejectionRisks.includes(i);
  });

  // 3. REQUIRES CLARIFICATION: Low confidence or ambiguous
  const requiresClarification = allIssues.filter((i: any) => {
    const isLowConfidence = i.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT';
    const reasoning = (i.reasoning || '').toLowerCase();
    const isAmbiguous = reasoning.includes('unclear') || reasoning.includes('ambiguous');
    return (isLowConfidence || isAmbiguous) && !rejectionRisks.includes(i) && !missingInfo.includes(i);
  });

  // 4. CAN BE ADDRESSED: Everything else
  const canBeAddressed = allIssues.filter((i: any) =>
    !rejectionRisks.includes(i) &&
    !missingInfo.includes(i) &&
    !requiresClarification.includes(i)
  );

  // Determine verdict
  let verdict = 'GREEN';
  let verdictText = 'Submission Nearly Ready';
  let verdictColor = '#10b981';
  let verdictDetail = 'Minor issues remain but submission can proceed with minor corrections.';

  if (rejectionRisks.length > 5 || allIssues.length > 50) {
    verdict = 'RED';
    verdictText = 'Submission Not Ready';
    verdictColor = '#ef4444';
    verdictDetail = 'Critical issues present that will likely result in rejection. Address rejection risks before submitting.';
  } else if (rejectionRisks.length > 0 || allIssues.length > 20) {
    verdict = 'AMBER';
    verdictText = 'Submission Requires Work';
    verdictColor = '#f59e0b';
    verdictDetail = 'Some critical issues identified. Review and address highlighted items before submission.';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BSR Compliance Report</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid ${verdictColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      color: #0f172a;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-top: 8px;
    }
    .verdict-box {
      background: ${verdictColor}15;
      border-left: 4px solid ${verdictColor};
      padding: 24px;
      margin-bottom: 30px;
    }
    .verdict-box h2 {
      margin: 0 0 12px 0;
      font-size: 24px;
      color: ${verdictColor};
      font-weight: 600;
    }
    .verdict-box p {
      margin: 8px 0;
      color: #475569;
      font-size: 15px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 20px;
      text-align: center;
    }
    .stat-card .number {
      font-size: 36px;
      font-weight: 700;
      display: block;
    }
    .stat-card .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .stat-card.red { border-left: 4px solid #ef4444; }
    .stat-card.red .number { color: #dc2626; }
    .stat-card.orange { border-left: 4px solid #f59e0b; }
    .stat-card.orange .number { color: #d97706; }
    .stat-card.purple { border-left: 4px solid #a855f7; }
    .stat-card.purple .number { color: #9333ea; }
    .stat-card.blue { border-left: 4px solid #3b82f6; }
    .stat-card.blue .number { color: #2563eb; }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #0f172a;
      margin: 40px 0 16px 0;
      padding: 12px 16px;
      border-left: 4px solid;
    }
    .section-title.red {
      background: #fef2f2;
      border-left-color: #ef4444;
      color: #991b1b;
    }
    .section-title.orange {
      background: #fffbeb;
      border-left-color: #f59e0b;
      color: #92400e;
    }
    .section-title.purple {
      background: #faf5ff;
      border-left-color: #a855f7;
      color: #6b21a8;
    }
    .section-title.blue {
      background: #eff6ff;
      border-left-color: #3b82f6;
      color: #1e40af;
    }
    .what-to-request-box {
      background: #fffbeb;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .what-to-request-box h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #92400e;
      font-weight: 600;
    }
    .what-to-request-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .what-to-request-box li {
      margin: 6px 0;
      color: #78350f;
      font-size: 14px;
    }
    .issue {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 8px;
    }
    .issue-id {
      font-family: 'Monaco', monospace;
      font-size: 10px;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 6px;
      border-radius: 3px;
    }
    .issue-title {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin: 4px 0;
    }
    .issue-description {
      color: #475569;
      font-size: 13px;
      margin: 8px 0;
      line-height: 1.5;
    }
    .action-box {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      padding: 10px 12px;
      margin-top: 8px;
      font-size: 12px;
    }
    .action-box strong {
      color: #1e40af;
    }
    .page-break {
      page-break-before: always;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
    }
    .next-actions {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .next-actions h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #0f172a;
    }
    .next-actions ol {
      margin: 0;
      padding-left: 24px;
    }
    .next-actions li {
      margin: 10px 0;
      font-size: 14px;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BSR Compliance Report</h1>
    <div class="subtitle">Gateway 2 Submission Assessment</div>
    <div class="subtitle">Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <!-- HEADLINE VERDICT -->
  <div class="verdict-box">
    <h2>${verdict}: ${verdictText}</h2>
    <p>${verdictDetail}</p>
    <p style="margin-top: 12px;"><strong>${allIssues.length}</strong> ${allIssues.length === 1 ? 'item requires' : 'items require'} attention before submission.</p>
  </div>

  <!-- QUICK STATS -->
  <div class="stats">
    <div class="stat-card red">
      <span class="number">${rejectionRisks.length}</span>
      <span class="label">Rejection Risks</span>
    </div>
    <div class="stat-card orange">
      <span class="number">${missingInfo.length}</span>
      <span class="label">Missing Info</span>
    </div>
    <div class="stat-card purple">
      <span class="number">${requiresClarification.length}</span>
      <span class="label">Needs Clarification</span>
    </div>
    <div class="stat-card blue">
      <span class="number">${canBeAddressed.length}</span>
      <span class="label">Can Be Addressed</span>
    </div>
  </div>

  <!-- 1. REJECTION RISKS -->
  ${rejectionRisks.length > 0 ? `
  <div class="section-title red">⚠️ REJECTION RISKS (${rejectionRisks.length})</div>
  <p style="margin: 12px 0 20px 0; color: #64748b; font-size: 14px;">
    <strong>Critical issues that will likely cause submission rejection.</strong> These must be addressed before submitting.
  </p>
  ${rejectionRisks.map((issue: any) => {
    const action = issue.actions_required?.[0];
    const rationale = transformRationale(issue);
    return `
      <div class="issue">
        <div class="issue-header">
          <div>
            <div class="issue-id">${issue.matrix_id}</div>
            <div class="issue-title">${issue.matrix_title}</div>
          </div>
        </div>
        <div class="issue-description">${rationale}</div>
        ${action ? `
        <div class="action-box">
          <strong>Required Action:</strong> ${action.action}<br>
          <strong>Owner:</strong> ${action.owner} • <strong>Effort:</strong> ${action.effort}
        </div>
        ` : ''}
      </div>
    `;
  }).join('\n')}
  ` : ''}

  <!-- 2. MISSING INFORMATION -->
  ${missingInfo.length > 0 ? `
  <div class="page-break"></div>
  <div class="section-title orange">📋 MISSING INFORMATION (${missingInfo.length})</div>
  <p style="margin: 12px 0 20px 0; color: #64748b; font-size: 14px;">
    <strong>Information not provided in current submission.</strong> Request these items from the client or responsible parties.
  </p>

  <div class="what-to-request-box">
    <h3>📋 What to Request from Client:</h3>
    <ul>
      ${Array.from(new Set(missingInfo.map((issue: any) => {
        const reasoning = (issue.reasoning || '').toLowerCase();
        const gaps = issue.gaps_identified || [];

        // Extract what's missing
        if (reasoning.includes('tbc') || reasoning.includes('to be confirmed')) {
          return issue.matrix_title.replace('does not meet', '').replace('partial', '').trim();
        }
        if (gaps.length > 0) {
          return gaps[0];
        }
        return issue.matrix_title.substring(0, 80) + (issue.matrix_title.length > 80 ? '...' : '');
      }))).slice(0, 8).map(item => `<li>${item}</li>`).join('\n')}
    </ul>
  </div>

  ${missingInfo.map((issue: any) => {
    const action = issue.actions_required?.[0];
    const rationale = transformRationale(issue);
    return `
      <div class="issue">
        <div class="issue-header">
          <div>
            <div class="issue-id">${issue.matrix_id}</div>
            <div class="issue-title">${issue.matrix_title}</div>
          </div>
        </div>
        <div class="issue-description">${rationale}</div>
        ${action ? `
        <div class="action-box">
          <strong>Action:</strong> ${action.action}<br>
          <strong>Owner:</strong> ${action.owner} • <strong>Effort:</strong> ${action.effort}
        </div>
        ` : ''}
      </div>
    `;
  }).join('\n')}
  ` : ''}

  <!-- 3. REQUIRES CLARIFICATION -->
  ${requiresClarification.length > 0 ? `
  <div class="page-break"></div>
  <div class="section-title purple">❓ REQUIRES CLARIFICATION (${requiresClarification.length})</div>
  <p style="margin: 12px 0 20px 0; color: #64748b; font-size: 14px;">
    <strong>Ambiguous or uncertain areas requiring professional judgement.</strong> Review with specialists to determine compliance status.
  </p>
  ${requiresClarification.map((issue: any) => {
    const action = issue.actions_required?.[0];
    const rationale = transformRationale(issue);
    return `
      <div class="issue">
        <div class="issue-header">
          <div>
            <div class="issue-id">${issue.matrix_id}</div>
            <div class="issue-title">${issue.matrix_title}</div>
          </div>
        </div>
        <div class="issue-description">${rationale}</div>
        ${action ? `
        <div class="action-box">
          <strong>Action:</strong> ${action.action}<br>
          <strong>Owner:</strong> ${action.owner} • <strong>Effort:</strong> ${action.effort}
        </div>
        ` : ''}
      </div>
    `;
  }).join('\n')}
  ` : ''}

  <!-- 4. CAN BE ADDRESSED -->
  ${canBeAddressed.length > 0 ? `
  <div class="page-break"></div>
  <div class="section-title blue">✓ CAN BE ADDRESSED (${canBeAddressed.length})</div>
  <p style="margin: 12px 0 20px 0; color: #64748b; font-size: 14px;">
    <strong>Lower priority items that can be resolved with moderate effort.</strong> Address these to improve submission quality.
  </p>
  ${canBeAddressed.map((issue: any) => {
    const action = issue.actions_required?.[0];
    const rationale = transformRationale(issue);
    return `
      <div class="issue">
        <div class="issue-header">
          <div>
            <div class="issue-id">${issue.matrix_id}</div>
            <div class="issue-title">${issue.matrix_title}</div>
          </div>
        </div>
        <div class="issue-description">${rationale}</div>
        ${action ? `
        <div class="action-box">
          <strong>Action:</strong> ${action.action}<br>
          <strong>Owner:</strong> ${action.owner} • <strong>Effort:</strong> ${action.effort}
        </div>
        ` : ''}
      </div>
    `;
  }).join('\n')}
  ` : ''}

  <!-- NEXT ACTIONS -->
  <div class="next-actions">
    <h3>→ Next Actions</h3>
    <ol>
      ${rejectionRisks.length > 0 ? '<li><strong>Immediately address Rejection Risks</strong> - These will cause submission to be rejected</li>' : ''}
      ${missingInfo.length > 0 ? '<li><strong>Request missing information from client</strong> - See "What to Request" summary above</li>' : ''}
      ${requiresClarification.length > 0 ? '<li><strong>Review unclear items with specialists</strong> - Professional judgement required</li>' : ''}
      ${canBeAddressed.length > 0 ? '<li><strong>Plan remediation for remaining items</strong> - Improve submission quality</li>' : ''}
      <li><strong>Re-run assessment after updates</strong> - Verify corrections before final submission</li>
    </ol>
  </div>

  <div class="footer">
    <p><strong>BSR Quality Checker</strong> • Compliance Report</p>
    <p>This report identifies potential compliance gaps for Gateway 2 submission review.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * GET /api/packs/:packId/versions/:versionId/saved-assessment/client-gap-analysis
 *
 * Download client gap analysis from SAVED assessment (matrixAssessment field)
 */
router.get(
  '/packs/:packId/versions/:versionId/saved-assessment/client-gap-analysis',
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params;

      // Fetch the pack version with matrixAssessment
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        select: { matrixAssessment: true },
      });

      if (!version || !version.matrixAssessment) {
        res.status(404).json({ error: 'No saved assessment found for this version' });
        return;
      }

      // Parse the saved assessment
      const assessment = JSON.parse(version.matrixAssessment);

      console.log('[Export] Generating client gap analysis from saved assessment...');
      const html = generateClientGapAnalysisHTML(assessment);

      // Generate PDF
      const tempFile = await generatePDFFromHTML(html, 'client-gap-analysis');

      // Stream to response
      const filename = `client-gap-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);
    } catch (error) {
      console.error('Error generating saved client gap analysis:', error);
      res.status(500).json({ error: 'Failed to generate client gap analysis' });
    }
  }
);

/**
 * GET /api/packs/:packId/versions/:versionId/saved-assessment/consultant-action-plan
 *
 * Download consultant action plan from SAVED assessment (matrixAssessment field)
 */
router.get(
  '/packs/:packId/versions/:versionId/saved-assessment/consultant-action-plan',
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params;

      // Fetch the pack version with matrixAssessment
      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        select: { matrixAssessment: true },
      });

      if (!version || !version.matrixAssessment) {
        res.status(404).json({ error: 'No saved assessment found for this version' });
        return;
      }

      // Parse the saved assessment
      const assessment = JSON.parse(version.matrixAssessment);

      console.log('[Export] Generating consultant action plan from saved assessment...');
      const html = generateConsultantActionPlanHTML(assessment);

      // Generate PDF
      const tempFile = await generatePDFFromHTML(html, 'consultant-action-plan');

      // Stream to response
      const filename = `consultant-action-plan-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);
    } catch (error) {
      console.error('Error generating saved consultant action plan:', error);
      res.status(500).json({ error: 'Failed to generate consultant action plan' });
    }
  }
);

export default router;
