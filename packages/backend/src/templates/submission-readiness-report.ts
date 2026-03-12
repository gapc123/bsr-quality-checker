/**
 * Submission Readiness Report Template
 *
 * Generates a 3-5 page PDF with:
 * - Page 1: Verdict + Top 5 Blockers
 * - Page 2: Review-Required Items (max 15)
 * - Page 3: Consultant Request List
 * - Page 4: Missing Information
 * - Page 5: Next Steps & Caveats
 *
 * Spec: Keep short, actionable, scannable
 */

import type { FullAssessment, AssessmentResult } from '../services/matrix-assessment.js';

// Triage categories
type TriageCategory = 'Blocker' | 'Review' | 'Missing' | 'Met';

interface ClassifiedResults {
  blockers: AssessmentResult[];
  reviewRequired: AssessmentResult[];
  missingInfo: AssessmentResult[];
  met: AssessmentResult[];
}

interface ConsultantGroup {
  name: string;
  requests: string[];
}

/**
 * Classify assessment results into triage categories
 */
function classifyResults(results: AssessmentResult[]): ClassifiedResults {
  const classified: ClassifiedResults = {
    blockers: [],
    reviewRequired: [],
    missingInfo: [],
    met: []
  };

  for (const result of results) {
    const category = classifyIssue(result);

    if (category === 'Blocker') classified.blockers.push(result);
    else if (category === 'Review') classified.reviewRequired.push(result);
    else if (category === 'Missing') classified.missingInfo.push(result);
    else classified.met.push(result);
  }

  // Sort blockers by severity
  classified.blockers.sort((a, b) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (a.severity !== 'high' && b.severity === 'high') return 1;
    return a.matrix_title.localeCompare(b.matrix_title);
  });

  return classified;
}

/**
 * Classify a single result
 */
function classifyIssue(result: AssessmentResult): TriageCategory {
  // Blocker: critical failures
  if (result.status === 'does_not_meet' && result.severity === 'high') {
    return 'Blocker';
  }

  // Review: ambiguous or implicit evidence
  if (result.evidence_quality === 'ambiguous' || result.evidence_quality === 'implicit') {
    return 'Review';
  }

  // Missing: information not found
  if (result.status === 'missing_information' || result.evidence_quality === 'absent') {
    return 'Missing';
  }

  // Met: requirement satisfied
  return 'Met';
}

/**
 * Generate submission verdict
 */
function generateVerdict(classified: ClassifiedResults): string {
  const blockerCount = classified.blockers.length;
  const reviewCount = classified.reviewRequired.length;

  if (blockerCount > 0) {
    const timeEstimate = estimateResolutionTime(blockerCount, reviewCount);
    return `
      <div class="verdict verdict-not-ready">
        <div class="verdict-icon">⚠️</div>
        <div class="verdict-content">
          <h2>NOT READY TO SUBMIT</h2>
          <p>${blockerCount} critical blocker${blockerCount > 1 ? 's' : ''} must be resolved before submission.</p>
          <p>${reviewCount} item${reviewCount > 1 ? 's' : ''} require${reviewCount === 1 ? 's' : ''} human review before final sign-off.</p>
          <p class="verdict-meta">Estimated time to resolve: ${timeEstimate}</p>
        </div>
      </div>
    `;
  }

  if (reviewCount > 0) {
    return `
      <div class="verdict verdict-ready-with-caveats">
        <div class="verdict-icon">✓</div>
        <div class="verdict-content">
          <h2>READY TO SUBMIT (with review recommendations)</h2>
          <p>No critical blockers identified.</p>
          <p>${reviewCount} item${reviewCount > 1 ? 's' : ''} flagged for expert review before lodging application.</p>
          <p class="verdict-meta">The submission appears compliant but professional sign-off is recommended.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="verdict verdict-ready">
      <div class="verdict-icon">✓</div>
      <div class="verdict-content">
        <h2>READY TO SUBMIT</h2>
        <p>All critical requirements satisfied.</p>
        <p>No blockers identified in submitted documentation.</p>
        <p class="verdict-meta">Recommend final professional review before lodging Gateway 2 application.</p>
      </div>
    </div>
  `;
}

/**
 * Estimate time to resolve blockers
 */
function estimateResolutionTime(blockers: number, reviewItems: number): string {
  const totalIssues = blockers + reviewItems;

  if (totalIssues >= 15) return '4-6 weeks';
  if (totalIssues >= 10) return '3-4 weeks';
  if (totalIssues >= 5) return '2-3 weeks';
  return '1-2 weeks';
}

/**
 * Generate top blockers section (max 5)
 */
function generateBlockers(blockers: AssessmentResult[]): string {
  const top5 = blockers.slice(0, 5);

  if (top5.length === 0) {
    return '<p class="no-blockers">No critical blockers identified.</p>';
  }

  return top5.map((blocker, index) => {
    const action = blocker.actions_required[0];
    const what = blocker.gaps_identified[0] || blocker.reasoning.split('.')[0];
    const why = extractWhyItMatters(blocker);
    const request = extractSpecificRequest(blocker);
    const owner = formatOwner(blocker.owner_type);

    return `
      <div class="blocker">
        <h4>${index + 1}. ${formatTitle(blocker.matrix_title)}</h4>
        <div class="blocker-details">
          <p><strong>What:</strong> ${what}</p>
          <p><strong>Why:</strong> ${why}</p>
          <p><strong>Request:</strong> ${request}</p>
          <p><strong>Owner:</strong> ${owner}</p>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Generate review-required items (max 15)
 */
function generateReviewItems(reviewItems: AssessmentResult[]): string {
  const top15 = reviewItems.slice(0, 15);
  const hasMore = reviewItems.length > 15;

  if (top15.length === 0) {
    return '<p class="no-items">No items require review.</p>';
  }

  // Group by category
  const grouped = groupByCategory(top15);

  let html = '';
  for (const [category, items] of Object.entries(grouped)) {
    html += `
      <h4>${category}</h4>
      <ul class="review-list">
        ${items.map(item => {
          const pageRef = item.pack_evidence.page ? ` (Page ${item.pack_evidence.page})` : '';
          const action = item.actions_required[0];
          return `
            <li>
              ${item.gaps_identified[0] || item.reasoning.split('.')[0]}${pageRef}
              <br>→ ${action?.action || 'Requires expert review'}
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  if (hasMore) {
    html += `<p class="see-excel">+ ${reviewItems.length - 15} more items. See Excel matrix for full list.</p>`;
  }

  return html;
}

/**
 * Generate consultant request list
 */
function generateConsultantRequests(results: AssessmentResult[]): string {
  const requests = groupRequestsByOwner(results);

  if (requests.length === 0) {
    return '<p class="no-requests">No consultant requests required.</p>';
  }

  return requests.map(group => `
    <div class="consultant-group">
      <h4>${group.name}</h4>
      <ul class="request-list">
        ${group.requests.map(req => `<li class="checkbox">□ ${req}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

/**
 * Generate missing information summary
 */
function generateMissingInfo(missingItems: AssessmentResult[]): string {
  const top10 = missingItems.slice(0, 10);

  if (top10.length === 0) {
    return '<p class="no-missing">No missing information identified.</p>';
  }

  // Split into document gaps vs specification gaps
  const documentGaps: string[] = [];
  const specificationGaps: string[] = [];

  for (const item of top10) {
    const gap = item.gaps_identified[0] || item.matrix_title;

    if (gap.toLowerCase().includes('document') || gap.toLowerCase().includes('report') || gap.toLowerCase().includes('strategy')) {
      documentGaps.push(gap);
    } else {
      specificationGaps.push(gap);
    }
  }

  let html = '';

  if (documentGaps.length > 0) {
    html += `
      <h4>Document Gaps</h4>
      <ul class="missing-list">
        ${documentGaps.map(gap => `<li>${gap}</li>`).join('')}
      </ul>
    `;
  }

  if (specificationGaps.length > 0) {
    html += `
      <h4>Specification Gaps</h4>
      <ul class="missing-list">
        ${specificationGaps.map(gap => `<li>${gap}</li>`).join('')}
      </ul>
    `;
  }

  html += `<p class="missing-note">These gaps prevent full compliance assessment. Provide missing documents or add information to existing submissions.</p>`;

  return html;
}

/**
 * Group results by category
 */
function groupByCategory(results: AssessmentResult[]): Record<string, AssessmentResult[]> {
  const grouped: Record<string, AssessmentResult[]> = {};

  for (const result of results) {
    const category = result.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(result);
  }

  return grouped;
}

/**
 * Group requests by owner
 */
function groupRequestsByOwner(results: AssessmentResult[]): ConsultantGroup[] {
  const groups: Record<string, Set<string>> = {
    'FIRE ENGINEER': new Set(),
    'STRUCTURAL ENGINEER': new Set(),
    'MEP CONSULTANT': new Set(),
    'ARCHITECT': new Set(),
    'PRINCIPAL DESIGNER': new Set(),
    'CLIENT / DEVELOPER': new Set()
  };

  for (const result of results) {
    if (classifyIssue(result) === 'Met') continue; // Skip satisfied requirements

    const groupKey = mapOwnerToGroup(result.owner_type);
    const request = extractSpecificRequest(result);

    if (groups[groupKey] && request) {
      groups[groupKey].add(request);
    }
  }

  // Convert to array and limit to 6 per group
  const consultantGroups: ConsultantGroup[] = [];
  for (const [name, requestSet] of Object.entries(groups)) {
    if (requestSet.size > 0) {
      consultantGroups.push({
        name,
        requests: Array.from(requestSet).slice(0, 6)
      });
    }
  }

  return consultantGroups;
}

/**
 * Map owner type to consultant group
 */
function mapOwnerToGroup(ownerType?: string): string {
  if (!ownerType) return 'CLIENT / DEVELOPER';

  const mapping: Record<string, string> = {
    'FIRE_ENGINEER': 'FIRE ENGINEER',
    'STRUCTURAL_ENGINEER': 'STRUCTURAL ENGINEER',
    'MEP_CONSULTANT': 'MEP CONSULTANT',
    'ARCHITECT': 'ARCHITECT',
    'PRINCIPAL_DESIGNER': 'PRINCIPAL DESIGNER',
    'PRINCIPAL_CONTRACTOR': 'PRINCIPAL DESIGNER',
    'CLIENT_INFO': 'CLIENT / DEVELOPER',
    'PROJECT_TEAM': 'CLIENT / DEVELOPER',
    'AI_AMENDABLE': 'CLIENT / DEVELOPER'
  };

  return mapping[ownerType] || 'CLIENT / DEVELOPER';
}

/**
 * Extract specific request from assessment result
 */
function extractSpecificRequest(result: AssessmentResult): string {
  const action = result.actions_required[0];
  if (!action) return result.matrix_title;

  // If action is already specific, use it
  if (action.action.length > 30 && !action.action.toLowerCase().includes('provide documentation')) {
    return action.action;
  }

  // Otherwise, construct from gaps and title
  const gaps = result.gaps_identified.slice(0, 2).join(', ');
  if (gaps) {
    return `${result.matrix_title}: ${gaps}`;
  }

  return result.matrix_title;
}

/**
 * Extract why it matters
 */
function extractWhyItMatters(result: AssessmentResult): string {
  // Look for regulatory reference in reasoning
  const reasoning = result.reasoning.toLowerCase();

  if (reasoning.includes('gateway 2')) {
    return 'Gateway 2 application requirement';
  }
  if (reasoning.includes('bsr') || reasoning.includes('building safety regulator')) {
    return 'BSR regulatory requirement';
  }
  if (reasoning.includes('hrb') || reasoning.includes('higher-risk')) {
    return 'Higher-Risk Building requirement';
  }
  if (reasoning.includes('approved document')) {
    return 'Building Regulations compliance';
  }

  return `${result.category} compliance requirement`;
}

/**
 * Format owner type for display
 */
function formatOwner(ownerType?: string): string {
  if (!ownerType) return 'Project Team';

  return ownerType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format title (convert to sentence case, remove prefixes)
 */
function formatTitle(title: string): string {
  // Remove matrix ID prefixes like "BSR-001"
  const cleaned = title.replace(/^[A-Z]+-\d+\s*[-:]\s*/i, '');

  // Convert to uppercase
  return cleaned.toUpperCase();
}

/**
 * Generate complete HTML for submission readiness report
 */
export function generateSubmissionReadinessHTML(assessment: FullAssessment): string {
  const classified = classifyResults(assessment.results);
  const verdict = generateVerdict(classified);
  const blockers = generateBlockers(classified.blockers);
  const reviewItems = generateReviewItems(classified.reviewRequired);
  const consultantRequests = generateConsultantRequests(assessment.results);
  const missingInfo = generateMissingInfo(classified.missingInfo);

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #1a202c;
      padding: 40px 60px;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 18pt;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 8px;
    }

    .header .meta {
      font-size: 10pt;
      color: #64748b;
    }

    .verdict {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 30px 0;
      display: flex;
      gap: 20px;
    }

    .verdict-icon {
      font-size: 32pt;
      line-height: 1;
    }

    .verdict-content h2 {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .verdict-content p {
      font-size: 11pt;
      margin-bottom: 8px;
    }

    .verdict-meta {
      font-size: 10pt;
      color: #64748b;
      margin-top: 12px !important;
    }

    .verdict-not-ready {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .verdict-not-ready h2 {
      color: #dc2626;
    }

    .verdict-ready-with-caveats {
      background: #fffbeb;
      border-color: #f59e0b;
    }

    .verdict-ready-with-caveats h2 {
      color: #d97706;
    }

    .verdict-ready {
      background: #f0fdf4;
      border-color: #22c55e;
    }

    .verdict-ready h2 {
      color: #16a34a;
    }

    h3 {
      font-size: 13pt;
      font-weight: 600;
      color: #1e40af;
      margin: 30px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      page-break-after: avoid;
    }

    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin: 20px 0 12px 0;
      page-break-after: avoid;
    }

    .blocker {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .blocker h4 {
      margin-top: 0;
      color: #dc2626;
    }

    .blocker-details p {
      margin: 6px 0;
      font-size: 10pt;
      line-height: 1.5;
    }

    .blocker-details strong {
      color: #475569;
      min-width: 70px;
      display: inline-block;
    }

    .review-list, .missing-list {
      margin: 12px 0;
      padding-left: 20px;
    }

    .review-list li, .missing-list li {
      margin: 8px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    .consultant-group {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .consultant-group h4 {
      margin-top: 0;
      color: #1e40af;
    }

    .request-list {
      list-style: none;
      padding: 0;
      margin: 12px 0 0 0;
    }

    .request-list li {
      margin: 8px 0;
      font-size: 10pt;
    }

    .checkbox {
      padding-left: 20px;
      position: relative;
    }

    .checkbox::before {
      content: '□';
      position: absolute;
      left: 0;
      font-size: 12pt;
      color: #64748b;
    }

    .see-excel {
      font-size: 10pt;
      color: #64748b;
      font-style: italic;
      margin-top: 12px;
    }

    .missing-note {
      font-size: 10pt;
      color: #64748b;
      margin-top: 16px;
    }

    .next-steps {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 24px 0;
    }

    .next-steps ol {
      margin: 12px 0;
      padding-left: 20px;
    }

    .next-steps li {
      margin: 8px 0;
      font-size: 10pt;
    }

    .caveats {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      font-size: 10pt;
    }

    .caveats h4 {
      margin-top: 0;
      margin-bottom: 12px;
    }

    .caveats p {
      margin: 8px 0;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #94a3b8;
      text-align: center;
    }

    @media print {
      body { padding: 20px 40px; }
      .blocker, .consultant-group, .next-steps, .caveats { page-break-inside: avoid; }
      h3, h4 { page-break-after: avoid; }
      .verdict { page-break-inside: avoid; }
      @page { margin: 1.5cm; }
    }

    .no-blockers, .no-items, .no-requests, .no-missing {
      font-style: italic;
      color: #64748b;
      padding: 16px;
      background: #f8fafc;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BSR GATEWAY 2 SUBMISSION READINESS REPORT</h1>
    <div class="meta">
      Project: ${assessment.pack_context?.buildingType || 'Gateway 2 Submission'} |
      Generated: ${today} |
      AI-Powered Analysis
    </div>
  </div>

  <h3>SUBMISSION VERDICT</h3>
  ${verdict}

  <h3>TOP BLOCKERS (must fix before submission)</h3>
  ${blockers}

  <div style="page-break-before: always;"></div>

  <h3>ITEMS REQUIRING HUMAN REVIEW (AI uncertain)</h3>
  <p style="font-size: 10pt; color: #64748b; margin-bottom: 20px;">
    The following require expert review before finalising submission:
  </p>
  ${reviewItems}

  <div style="page-break-before: always;"></div>

  <h3>WHAT TO REQUEST FROM EACH CONSULTANT</h3>
  ${consultantRequests}

  <div style="page-break-before: always;"></div>

  <h3>MISSING INFORMATION (not mentioned in documents)</h3>
  ${missingInfo}

  <div style="page-break-before: always;"></div>

  <h3>NEXT STEPS</h3>
  <div class="next-steps">
    <ol>
      <li>Resolve ${classified.blockers.length} critical blocker${classified.blockers.length !== 1 ? 's' : ''} listed above</li>
      <li>Obtain requested items from consultants (page 3)</li>
      <li>Address review-required items with specialists (page 2)</li>
      <li>Resubmit for final AI check before lodging Gateway 2 application</li>
    </ol>
  </div>

  <h3>CAVEATS</h3>
  <div class="caveats">
    <p>This report is based on AI-powered analysis of submitted documents.</p>
    <p style="margin-top: 12px;">
      <strong>✓ Reliable for:</strong> identifying missing information, checking document completeness<br>
      <strong>✗ Not a substitute for:</strong> professional engineering judgement, regulatory sign-off
    </p>
    <p style="margin-top: 12px;">
      The Building Safety Regulator makes the final submission decision.
      This report supports preparation but does not guarantee approval.
    </p>
    <p style="margin-top: 12px; font-weight: 600;">
      For full audit trail, see: Evidence Matrix Excel file (attached)
    </p>
  </div>

  <div class="footer">
    🤖 Generated by Attlee | AI-Powered BSR Compliance<br>
    For support: www.attlee.ai
  </div>
</body>
</html>
  `.trim();
}
