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
 *
 * UPDATED (GitHub Issue #3): Uses centralized owner role config
 * UPDATED (GitHub Issues #7, #8): Consistent branding and project metadata cover page
 */

import type { FullAssessment, AssessmentResult } from '../services/matrix-assessment.js';
import { formatOwnerRole, mapOwnerToConsultantGroup } from '../config/owner-roles.js';
import {
  getPDFStyles,
  formatProjectMetadata,
  DEFAULT_PROJECT_METADATA,
  type ProjectMetadata
} from '../config/branding.js';

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
 * GitHub Issue #10: Deduplicate by matrix_id to prevent duplicate entries
 */
function classifyResults(results: AssessmentResult[]): ClassifiedResults {
  const classified: ClassifiedResults = {
    blockers: [],
    reviewRequired: [],
    missingInfo: [],
    met: []
  };

  // Deduplicate by matrix_id (GitHub Issue #10)
  const seenIds = new Set<string>();
  const uniqueResults: AssessmentResult[] = [];

  for (const result of results) {
    if (!seenIds.has(result.matrix_id)) {
      seenIds.add(result.matrix_id);
      uniqueResults.push(result);
    }
  }

  // Classify unique results
  for (const result of uniqueResults) {
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
    const what = blocker.gaps_identified[0] || blocker.reasoning.split('.')[0];
    const why = extractWhyItMatters(blocker);
    const request = extractSpecificRequest(blocker);
    const owner = formatOwnerRole(blocker.owner_type);
    const ev = blocker.pack_evidence;
    const evidenceCitation = ev?.found && (ev.document || ev.quote)
      ? `<p class="evidence-citation">
           <strong>Source:</strong>
           ${ev.document || 'document'}${ev.page ? `, page ${ev.page}` : ''}
           ${ev.quote ? `<br><em class="evidence-quote">"${ev.quote.slice(0, 150)}${ev.quote.length > 150 ? '…' : ''}"</em>` : ''}
         </p>`
      : '';

    return `
      <div class="blocker">
        <h4>${index + 1}. ${formatTitle(blocker.matrix_title)}</h4>
        <div class="blocker-details">
          <p><strong>What:</strong> ${what}</p>
          <p><strong>Why:</strong> ${why}</p>
          <p><strong>Request:</strong> ${request}</p>
          <p><strong>Owner:</strong> ${owner}</p>
          ${evidenceCitation}
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
          const ev = item.pack_evidence;
          const docRef = ev?.document ? ` — ${ev.document}${ev.page ? `, p.${ev.page}` : ''}` : (ev?.page ? ` (Page ${ev.page})` : '');
          const quote = ev?.quote ? `<br><em class="evidence-quote">"${ev.quote.slice(0, 120)}${ev.quote.length > 120 ? '…' : ''}"</em>` : '';
          const action = item.actions_required[0];
          return `
            <li>
              ${item.gaps_identified[0] || item.reasoning.split('.')[0]}${docRef}
              ${quote}
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
 * GitHub Issue #10: Gaps already deduplicated in classifyResults
 */
function generateMissingInfo(missingItems: AssessmentResult[]): string {
  const top10 = missingItems.slice(0, 10);

  if (top10.length === 0) {
    return '<p class="no-missing">No missing information identified.</p>';
  }

  // Split into document gaps vs specification gaps
  // Use Set to further deduplicate gap descriptions
  const documentGaps = new Set<string>();
  const specificationGaps = new Set<string>();

  for (const item of top10) {
    const gap = item.gaps_identified[0] || item.matrix_title;

    if (gap.toLowerCase().includes('document') || gap.toLowerCase().includes('report') || gap.toLowerCase().includes('strategy')) {
      documentGaps.add(gap);
    } else {
      specificationGaps.add(gap);
    }
  }

  let html = '';

  if (documentGaps.size > 0) {
    html += `
      <h4>Document Gaps</h4>
      <ul class="missing-list">
        ${Array.from(documentGaps).map(gap => `<li>${gap}</li>`).join('')}
      </ul>
    `;
  }

  if (specificationGaps.size > 0) {
    html += `
      <h4>Specification Gaps</h4>
      <ul class="missing-list">
        ${Array.from(specificationGaps).map(gap => `<li>${gap}</li>`).join('')}
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
 * GitHub Issue #10: Deduplicate by matrix_id to prevent duplicate entries
 */
function groupRequestsByOwner(results: AssessmentResult[]): ConsultantGroup[] {
  const groups: Record<string, Map<string, string>> = {
    'FIRE ENGINEER': new Map(),
    'STRUCTURAL ENGINEER': new Map(),
    'MEP CONSULTANT': new Map(),
    'ARCHITECT': new Map(),
    'PRINCIPAL DESIGNER': new Map(),
    'CLIENT / DEVELOPER': new Map()
  };

  // Deduplicate by matrix_id first (GitHub Issue #10)
  const seenIds = new Set<string>();

  for (const result of results) {
    if (classifyIssue(result) === 'Met') continue; // Skip satisfied requirements

    // Deduplicate: skip if we've already seen this matrix_id
    if (seenIds.has(result.matrix_id)) continue;
    seenIds.add(result.matrix_id);

    const groupKey = mapOwnerToConsultantGroup(result.owner_type);
    const request = extractSpecificRequest(result);

    if (groups[groupKey] && request) {
      // Use matrix_id as key to ensure uniqueness
      groups[groupKey].set(result.matrix_id, request);
    }
  }

  // Convert to array and limit to 6 per group
  const consultantGroups: ConsultantGroup[] = [];
  for (const [name, requestMap] of Object.entries(groups)) {
    if (requestMap.size > 0) {
      consultantGroups.push({
        name,
        requests: Array.from(requestMap.values()).slice(0, 6)
      });
    }
  }

  return consultantGroups;
}

// REMOVED: mapOwnerToGroup - now using centralized config (GitHub Issue #3)

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

// REMOVED: formatOwner - now using centralized config (GitHub Issue #3)

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
 * Generate document integrity issues section
 */
function generateIntegritySection(issues: import('../lib/integrityChecker.js').IntegrityIssue[]): string {
  if (!issues || issues.length === 0) return '';

  const rows = issues.map(issue => {
    const severityColour = issue.severity === 'high' ? '#dc2626' : issue.severity === 'medium' ? '#d97706' : '#2563eb';
    const badge = `<span style="font-size:8.5pt;font-weight:600;color:${severityColour};text-transform:uppercase;">${issue.severity}</span>`;
    const typeLabel = issue.type.replace(/_/g, ' ');
    const doc = issue.otherDocument
      ? `${issue.document} ↔ ${issue.otherDocument}`
      : issue.document;
    const excerpt = issue.excerpt
      ? `<div style="margin-top:6px;font-size:9pt;color:#64748b;font-style:italic;border-left:2px solid #e2e8f0;padding-left:8px;">&ldquo;${issue.excerpt.slice(0, 180)}&rdquo;</div>`
      : '';
    return `
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;margin:8px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong style="font-size:9.5pt;">${typeLabel}</strong>
          ${badge}
        </div>
        <div style="font-size:9.5pt;color:#374151;">${doc}</div>
        <div style="font-size:9pt;color:#64748b;margin-top:4px;">${issue.detail}</div>
        ${excerpt}
      </div>`;
  }).join('');

  return `
    <h3>DOCUMENT INTEGRITY WARNINGS</h3>
    <p style="font-size:10pt;color:#64748b;margin-bottom:16px;">
      The following structural issues were detected in the submitted documents and should be resolved before submission:
    </p>
    ${rows}
  `;
}

interface DomainReviews {
  fire_safety: string;
  documentation: string;
  regulatory: string;
  quality: string;
  synthesis: string;
}

// Which assessment categories belong to each specialist domain
const DOMAIN_CATEGORIES: Record<keyof Omit<DomainReviews, 'synthesis'>, string[]> = {
  fire_safety:   ['FIRE_SAFETY', 'VENTILATION'],
  documentation: ['PACK_COMPLETENESS', 'GOLDEN_THREAD', 'TRACEABILITY'],
  regulatory:    ['HRB_DUTIES', 'LONDON_SPECIFIC'],
  quality:       ['CONSISTENCY'],
};

const AGENT_CONFIG: Record<keyof Omit<DomainReviews, 'synthesis'>, { icon: string; title: string; role: string }> = {
  fire_safety:   { icon: '🔥', title: 'Fire Safety Engineer', role: 'Chartered Fire Engineer · Approved Document B · BS 9991' },
  documentation: { icon: '📋', title: 'Documentation Specialist', role: 'Principal Designer · Building Safety Act 2022 · Golden Thread' },
  regulatory:    { icon: '⚖️', title: 'Regulatory Consultant', role: 'BSR Specialist · HRB Duties · Regulation 38 · London Plan D12' },
  quality:       { icon: '🔍', title: 'Quality & Consistency Reviewer', role: 'Technical Auditor · Cross-document coordination' },
};

function generateSpecialistReviewSection(reviews: DomainReviews, results: AssessmentResult[]): string {
  // Build category-grouped failing items for each domain
  function domainIssues(categories: string[]): AssessmentResult[] {
    return results.filter(r =>
      categories.includes(r.category) &&
      (r.status === 'does_not_meet' || r.status === 'partial')
    );
  }

  // Executive synthesis block
  const synthesisHtml = `
    <div style="background:#eef2ff;border-left:4px solid #4f46e5;padding:20px 24px;margin:0 0 28px 0;border-radius:0 6px 6px 0;">
      <div style="font-size:10pt;font-weight:700;color:#4f46e5;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">
        🏛️ Lead BSR Consultant — Executive Summary
      </div>
      <div style="font-size:10pt;color:#1e1b4b;white-space:pre-wrap;line-height:1.7;">${reviews.synthesis}</div>
    </div>`;

  // Individual agent blocks
  const agentBlocks = (Object.keys(DOMAIN_CATEGORIES) as Array<keyof typeof DOMAIN_CATEGORIES>).map(domain => {
    const cfg = AGENT_CONFIG[domain];
    const issues = domainIssues(DOMAIN_CATEGORIES[domain]);
    const reviewText = reviews[domain];

    const issueRows = issues.length > 0
      ? `<div style="margin-top:14px;">
          <div style="font-size:8.5pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">
            Criteria flagged in this domain (${issues.length})
          </div>
          ${issues.map(r => {
            const statusColour = r.status === 'does_not_meet' ? '#dc2626' : '#d97706';
            const statusLabel  = r.status === 'does_not_meet' ? 'NOT MET' : 'PARTIAL';
            const gap = r.gaps_identified?.[0] || r.reasoning?.slice(0, 100) || '';
            return `<div style="display:flex;align-items:baseline;gap:8px;padding:5px 0;border-bottom:1px solid #f1f5f9;">
              <span style="font-size:8pt;font-weight:700;color:${statusColour};min-width:52px;">${statusLabel}</span>
              <span style="font-size:8.5pt;font-weight:600;color:#1e293b;min-width:60px;">${r.matrix_id}</span>
              <span style="font-size:8.5pt;color:#374151;flex:1;">${r.matrix_title}${gap ? ` — <span style="color:#6b7280;font-style:italic;">${gap.slice(0, 120)}</span>` : ''}</span>
            </div>`;
          }).join('')}
        </div>`
      : `<div style="margin-top:10px;font-size:9pt;color:#16a34a;font-style:italic;">✓ No issues found in this domain</div>`;

    return `
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;page-break-inside:avoid;">
        <div style="background:#f8fafc;padding:14px 18px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18pt;line-height:1;">${cfg.icon}</span>
          <div>
            <div style="font-size:10.5pt;font-weight:700;color:#1e293b;">${cfg.title}</div>
            <div style="font-size:8.5pt;color:#64748b;margin-top:2px;">${cfg.role}</div>
          </div>
        </div>
        <div style="padding:16px 18px;">
          <div style="font-size:10pt;color:#374151;white-space:pre-wrap;line-height:1.7;">${reviewText}</div>
          ${issueRows}
        </div>
      </div>`;
  }).join('');

  return `
    <h3>SPECIALIST PANEL REVIEW</h3>
    <p style="font-size:10pt;color:#64748b;margin-bottom:20px;">
      Four AI specialist agents independently reviewed different domains of this submission.
      Their findings are compiled below, followed by an executive synthesis.
    </p>
    ${agentBlocks}
    <h4 style="font-size:11pt;font-weight:700;color:#4f46e5;margin:28px 0 12px 0;padding-top:20px;border-top:2px solid #e0e7ff;">
      🏛️ Executive Synthesis
    </h4>
    ${synthesisHtml}
  `;
}

/**
 * Generate complete HTML for submission readiness report
 * Updated (GitHub Issues #7, #8): Includes cover page and project metadata
 */
export function generateSubmissionReadinessHTML(
  assessment: FullAssessment,
  projectMetadata?: ProjectMetadata,
  specialistReviews?: DomainReviews
): string {
  const classified = classifyResults(assessment.results);
  const verdict = generateVerdict(classified);
  const blockers = generateBlockers(classified.blockers);
  const reviewItems = generateReviewItems(classified.reviewRequired);
  const consultantRequests = generateConsultantRequests(assessment.results);
  const missingInfo = generateMissingInfo(classified.missingInfo);
  const integritySection = generateIntegritySection(assessment.integrity_issues ?? []);
  const specialistSection = specialistReviews
    ? generateSpecialistReviewSection(specialistReviews, assessment.results)
    : '';

  // Use provided metadata, or extract from assessment (project_name from document headers),
  // or fall back to a generic title — never use buildingType as a project name
  const metadata = projectMetadata || {
    ...DEFAULT_PROJECT_METADATA,
    projectName: (assessment as any).project_name || 'Gateway 2 Submission'
  };

  const formatted = formatProjectMetadata(metadata);

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
  <title>Submission Readiness Report - ${formatted.title}</title>
  <style>
    ${getPDFStyles()}

    /* Additional styles specific to this report */
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

    .evidence-citation {
      margin-top: 10px;
      padding: 8px 12px;
      background: #fff7ed;
      border-left: 3px solid #f59e0b;
      font-size: 9pt;
      color: #92400e;
    }

    .evidence-quote {
      display: block;
      margin-top: 4px;
      font-style: italic;
      color: #78350f;
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
      Project: ${(assessment as any).project_name || 'Gateway 2 Submission'} |
      Generated: ${today} |
      AI-Powered Analysis
    </div>
  </div>

  <h3>SUBMISSION VERDICT</h3>
  ${verdict}

  <h3>TOP BLOCKERS (must fix before submission)</h3>
  ${blockers}

  ${integritySection ? `<div style="page-break-before: always;"></div>\n  ${integritySection}` : ''}

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

  ${specialistSection ? `<div style="page-break-before: always;"></div>\n  ${specialistSection}` : ''}

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
