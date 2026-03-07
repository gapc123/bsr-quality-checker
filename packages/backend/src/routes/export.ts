/**
 * Export Routes
 *
 * Handles document exports for new FullAssessment format
 * Provides PDF generation for reports, briefs, and summaries
 */

import express, { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router = express.Router();

const PUPPETEER_OPTIONS = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

/**
 * POST /api/packs/:packId/versions/:versionId/matrix-report/download/pdf
 *
 * Generate PDF from FullAssessment data
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

export default router;
