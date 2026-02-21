/**
 * Matrix-Based Report Generation
 *
 * Compact visual format:
 * - Answer first (Executive Summary with visual stats)
 * - Severity-first ordering with color coding
 * - Condensed findings (key gaps + actions only)
 * - Top 20 actions, not all
 */

import { FullAssessment, AssessmentResult } from './matrix-assessment.js';

interface ReportData {
  assessment: FullAssessment;
  packName: string;
  versionNumber: number;
  projectName: string | null;
  documentCount: number;
}

/**
 * Generate markdown report from matrix assessment
 */
export function generateMatrixReport(data: ReportData): string {
  const { assessment, packName, projectName, versionNumber, documentCount } = data;
  const sections: string[] = [];

  const passResults = assessment.results.filter(r => r.status === 'meets');
  const failResults = assessment.results.filter(r => r.status === 'does_not_meet');
  const partialResults = assessment.results.filter(r => r.status === 'partial');

  const highSeverity = assessment.results.filter(r => r.status !== 'meets' && r.severity === 'high');
  const mediumSeverity = assessment.results.filter(r => r.status !== 'meets' && r.severity === 'medium');
  const lowSeverity = assessment.results.filter(r => r.status !== 'meets' && r.severity === 'low');

  const topActions = getTopActions(assessment.results, 5);
  const riskThemes = getRiskThemes(assessment.results);
  const allActions = consolidateActions(assessment.results).slice(0, 20); // Limit to top 20

  const statusBanner = getStatusBanner(assessment);
  const passPercent = Math.round(passResults.length / assessment.criteria_summary.total_applicable * 100);
  const partialPercent = Math.round(partialResults.length / assessment.criteria_summary.total_applicable * 100);
  const failPercent = Math.round(failResults.length / assessment.criteria_summary.total_applicable * 100);

  // ============================================
  // TITLE PAGE
  // ============================================
  sections.push(`<div class="title-page">
<img class="title-bg-img" src="data:image/jpeg;base64,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" alt="Modern residential buildings"/>
<div class="title-overlay"></div>
<div class="title-content">
<div class="title-badge">GATEWAY 2</div>
<h1 class="title-main">Quality Assessment Report</h1>
<div class="title-project">${projectName || packName}</div>
<div class="title-meta">Version ${versionNumber} | ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

<div class="title-stats">
<div class="title-stat ${statusBanner.statusClass}">
<div class="stat-big">${statusBanner.headline}</div>
<div class="stat-label">Overall Status</div>
</div>
</div>

<div class="title-donut">
<svg viewBox="0 0 100 100" class="donut-chart">
<circle class="donut-bg" cx="50" cy="50" r="40"/>
<circle class="donut-pass" cx="50" cy="50" r="40" stroke-dasharray="${passPercent * 2.51} 251" transform="rotate(-90 50 50)"/>
<circle class="donut-partial" cx="50" cy="50" r="40" stroke-dasharray="${partialPercent * 2.51} 251" transform="rotate(${-90 + passPercent * 3.6} 50 50)"/>
<circle class="donut-fail" cx="50" cy="50" r="40" stroke-dasharray="${failPercent * 2.51} 251" transform="rotate(${-90 + (passPercent + partialPercent) * 3.6} 50 50)"/>
<text x="50" y="45" class="donut-number">${assessment.criteria_summary.total_applicable}</text>
<text x="50" y="58" class="donut-label">criteria</text>
</svg>
<div class="donut-legend">
<div class="legend-row"><span class="dot pass"></span> ${passResults.length} Pass</div>
<div class="legend-row"><span class="dot partial"></span> ${partialResults.length} Partial</div>
<div class="legend-row"><span class="dot fail"></span> ${failResults.length} Fail</div>
</div>
</div>

<div class="title-footer">
<div>BSR Quality Checker</div>
<div class="footer-sub">Building Safety Act 2022 Compliance Assessment</div>
</div>
</div>
</div>

<div class="page-break"></div>

## Executive Summary

<div class="${statusBanner.boxClass}">
<div class="status-headline">${statusBanner.icon} ${statusBanner.headline}</div>
${statusBanner.description}
</div>

### Results at a Glance

| Outcome | Count | | Severity | Count |
|---------|:-----:|---|----------|:-----:|
| <span class="badge pass">PASS</span> | ${passResults.length} | | <span class="sev-high">HIGH</span> | ${highSeverity.length} |
| <span class="badge partial">PARTIAL</span> | ${partialResults.length} | | <span class="sev-med">MEDIUM</span> | ${mediumSeverity.length} |
| <span class="badge fail">FAIL</span> | ${failResults.length} | | <span class="sev-low">LOW</span> | ${lowSeverity.length} |
| **Total** | **${assessment.criteria_summary.total_applicable}** | | | |

## Top 5 Priority Actions

| # | Action | Owner | Effort |
|:-:|--------|-------|:------:|
${topActions.map((a, i) => `| ${i + 1} | ${a.action} | ${a.owner} | ${effortBadge(a.effort)} |`).join('\n')}

---

`);

  // ============================================
  // MATRIX OVERVIEW (Compact Table)
  // ============================================
  sections.push(`## Criteria Matrix

| ID | Criterion | Result | Severity |
|:---|-----------|:------:|:--------:|
${assessment.results.map(r =>
  `| ${r.matrix_id} | ${r.matrix_title} | ${statusBadge(r.status)} | ${r.status !== 'meets' ? sevBadge(r.severity) : '-'} |`
).join('\n')}

---

`);

  // ============================================
  // RISK THEMES (Visual Summary)
  // ============================================
  sections.push(`## Risk Themes

| Category | Issues | Impact |
|----------|:------:|--------|
${riskThemes.slice(0, 5).map(t =>
  `| **${t.theme}** | ${t.fails > 0 ? `<span class="fail-count">${t.fails} fail</span>` : ''} ${t.partials > 0 ? `<span class="partial-count">${t.partials} partial</span>` : ''} | ${t.impact} |`
).join('\n')}

---

`);

  // ============================================
  // HIGH SEVERITY FINDINGS (Compact Cards)
  // ============================================
  if (highSeverity.length > 0) {
    sections.push(`## High Severity Issues

<div class="severity-section high">

${highSeverity.map(r => formatFindingCompact(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // MEDIUM SEVERITY FINDINGS
  // ============================================
  if (mediumSeverity.length > 0) {
    sections.push(`## Medium Severity Issues

<div class="severity-section medium">

${mediumSeverity.map(r => formatFindingCompact(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // LOW SEVERITY FINDINGS
  // ============================================
  if (lowSeverity.length > 0) {
    sections.push(`## Low Severity Issues

<div class="severity-section low">

${lowSeverity.map(r => formatFindingCompact(r)).join('\n')}

</div>

---

`);
  }

  // ============================================
  // PASSED CRITERIA (Compact List)
  // ============================================
  if (passResults.length > 0) {
    sections.push(`## Passed Criteria

${passResults.map(r => `- **${r.matrix_id}:** ${r.matrix_title}`).join('\n')}

---

`);
  }

  // ============================================
  // CONSOLIDATED ACTION PLAN (Top 20)
  // ============================================
  sections.push(`## Action Plan (Top 20 Priority Actions)

| # | Action | Criterion | Owner | Effort |
|:-:|--------|:---------:|-------|:------:|
${allActions.map((a, i) =>
  `| ${i + 1} | ${a.action} | ${a.criterion} | ${a.owner} | ${effortBadge(a.effort)} |`
).join('\n')}

---

`);

  // ============================================
  // METHODOLOGY
  // ============================================
  sections.push(`## Assessment Methodology

<div class="methodology-section">

<div class="algorithm-header">
<div class="algorithm-badge">THE ALGORITHM</div>
<h3 class="algorithm-title">How This Report Was Generated</h3>
</div>

<p class="algorithm-intro">This quality assessment uses a <strong>Regulatory Success Matrix</strong> - a structured framework of ${assessment.criteria_summary.total_applicable} criteria derived from Building Safety Act 2022 requirements and BSR review patterns.</p>

<div class="methodology-grid">

<div class="method-card">
<div class="method-icon">1</div>
<div class="method-title">Document Analysis</div>
<div class="method-desc">Each uploaded document is parsed, classified by type (fire strategy, structural calculations, etc.), and indexed for cross-referencing.</div>
</div>

<div class="method-card">
<div class="method-icon">2</div>
<div class="method-title">Criteria Assessment</div>
<div class="method-desc">AI evaluates each matrix criterion against your document corpus, identifying specific evidence or gaps with direct document citations.</div>
</div>

<div class="method-card">
<div class="method-icon">3</div>
<div class="method-title">Severity Classification</div>
<div class="method-desc">Issues are classified as High (likely to cause rejection), Medium (may trigger queries), or Low (recommended improvements).</div>
</div>

<div class="method-card">
<div class="method-icon">4</div>
<div class="method-title">Action Prioritisation</div>
<div class="method-desc">Actions are ranked by impact and effort, helping teams focus on the most critical improvements first.</div>
</div>

</div>

### Quality Indicators

| Indicator | Value | Meaning |
|-----------|:-----:|---------|
| **Reference Anchor Rate** | ${assessment.guardrail_stats.reference_anchor_rate.toFixed(0)}% | Percentage of findings backed by specific document citations |
| **Corpus-Backed Criteria** | ${assessment.guardrail_stats.corpus_backed_criteria}/${assessment.criteria_summary.total_applicable} | Criteria with evidence found in your documents |
| **Documents Analysed** | ${data.documentCount} | Number of documents included in this assessment |

A higher reference anchor rate indicates greater confidence in findings. Rates above 80% suggest well-documented assessments.

</div>

---

`);

  // ============================================
  // FOOTER
  // ============================================
  sections.push(`## Report Information

| | |
|---|---|
| **Assessment confidence** | ${assessment.guardrail_stats.reference_anchor_rate >= 90 ? 'High' : 'Moderate'} (${assessment.guardrail_stats.reference_anchor_rate.toFixed(0)}% reference anchor rate) |
| **Methodology** | AI-assisted assessment against ${assessment.criteria_summary.total_applicable}-criteria Regulatory Success Matrix |
| **Regulatory basis** | Building Safety Act 2022, HRB Procedures Regulations 2023, Approved Document B |

<div class="disclaimer">
This report assesses submission quality against regulatory success criteria. It does not determine compliance, replace professional review, or guarantee approval. Final decisions rest with the Building Safety Regulator.
</div>

*Generated by BSR Quality Checker*
`);

  return sections.join('\n').replace(/\u2014/g, '-');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFindingCompact(result: AssessmentResult): string {
  const gaps = result.gaps_identified.slice(0, 2);
  const topAction = result.actions_required[0];

  // Very compact: ID, title, status on one line, brief reasoning, one key action
  return `<div class="finding ${result.severity}">
<div class="finding-header">
<span class="finding-id">${result.matrix_id}</span>
<span class="finding-title">${result.matrix_title}</span>
${statusBadge(result.status)}
</div>

${truncateText(result.reasoning, 180)}

${gaps.length > 0 ? `**Gaps:** ${gaps.map(g => truncateText(g, 60)).join(' - ')}` : ''}

${topAction ? `**Action:** ${topAction.action} *(${topAction.owner})*` : ''}
</div>

`;
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '...';
}

function statusBadge(status: string): string {
  switch (status) {
    case 'meets': return '<span class="badge pass">PASS</span>';
    case 'partial': return '<span class="badge partial">PARTIAL</span>';
    case 'does_not_meet': return '<span class="badge fail">FAIL</span>';
    default: return '<span class="badge">N/A</span>';
  }
}

function sevBadge(severity: string): string {
  switch (severity) {
    case 'high': return '<span class="sev-high">HIGH</span>';
    case 'medium': return '<span class="sev-med">MED</span>';
    case 'low': return '<span class="sev-low">LOW</span>';
    default: return '-';
  }
}

function effortBadge(effort: string): string {
  switch (effort.toUpperCase()) {
    case 'S': return '<span class="effort-s">S</span>';
    case 'M': return '<span class="effort-m">M</span>';
    case 'L': return '<span class="effort-l">L</span>';
    default: return effort;
  }
}

function getStatusBanner(assessment: FullAssessment): { headline: string; description: string; boxClass: string; icon: string; statusClass: string } {
  const { flagged_by_severity, criteria_summary } = assessment;

  if (flagged_by_severity.high >= 5) {
    return {
      headline: 'AT RISK',
      description: `${flagged_by_severity.high} high-severity gaps across ${criteria_summary.total_applicable} criteria. Substantial remediation required.`,
      boxClass: 'status-box risk',
      icon: '!',
      statusClass: 'status-risk'
    };
  }
  if (flagged_by_severity.high >= 1) {
    return {
      headline: 'NEEDS ATTENTION',
      description: `${flagged_by_severity.high} high-severity and ${flagged_by_severity.medium} medium-severity gaps. Address before submission.`,
      boxClass: 'status-box attention',
      icon: '!',
      statusClass: 'status-attention'
    };
  }
  if (criteria_summary.partial > criteria_summary.meets) {
    return {
      headline: 'PARTIALLY READY',
      description: 'Most criteria partially met. Strengthen evidence before submission.',
      boxClass: 'status-box attention',
      icon: '~',
      statusClass: 'status-attention'
    };
  }
  return {
    headline: 'LIKELY REVIEWABLE',
    description: `${criteria_summary.meets} of ${criteria_summary.total_applicable} criteria met. Minor improvements recommended.`,
    boxClass: 'status-box good',
    icon: '+',
    statusClass: 'status-good'
  };
}

function getTopActions(results: AssessmentResult[], n: number): Array<{action: string; owner: string; effort: string}> {
  const actions: Array<{action: string; owner: string; effort: string; sortKey: number}> = [];

  for (const result of results) {
    if (result.status === 'meets') continue;
    const severityKey = { high: 0, medium: 1, low: 2 }[result.severity] || 3;

    for (const action of result.actions_required.slice(0, 1)) {
      actions.push({
        action: action.action,
        owner: action.owner,
        effort: action.effort,
        sortKey: severityKey
      });
    }
  }

  return actions.sort((a, b) => a.sortKey - b.sortKey).slice(0, n);
}

function getRiskThemes(results: AssessmentResult[]): Array<{theme: string; fails: number; partials: number; impact: string}> {
  const themes: Record<string, {fails: number; partials: number}> = {};

  for (const result of results) {
    const theme = formatCategory(result.category);
    if (!themes[theme]) themes[theme] = { fails: 0, partials: 0 };
    if (result.status === 'does_not_meet') themes[theme].fails++;
    if (result.status === 'partial') themes[theme].partials++;
  }

  const impacts: Record<string, string> = {
    'Fire Safety': 'Core BSR focus area',
    'Pack Completeness': 'Foundation for validation',
    'HRB Duties': 'Statutory requirement',
    'Golden Thread': 'Lifecycle information requirement',
    'Consistency': 'Professional coordination indicator',
    'Traceability': 'Review efficiency factor',
  };

  return Object.entries(themes)
    .filter(([_, v]) => v.fails > 0 || v.partials > 0)
    .map(([theme, v]) => ({
      theme,
      fails: v.fails,
      partials: v.partials,
      impact: impacts[theme] || 'Reviewability factor'
    }))
    .sort((a, b) => (b.fails * 2 + b.partials) - (a.fails * 2 + a.partials));
}

function formatCategory(category: string): string {
  const titles: Record<string, string> = {
    'PACK_COMPLETENESS': 'Pack Completeness',
    'FIRE_SAFETY': 'Fire Safety',
    'HRB_DUTIES': 'HRB Duties',
    'GOLDEN_THREAD': 'Golden Thread',
    'VENTILATION': 'Ventilation',
    'LONDON_SPECIFIC': 'London Specific',
    'TRACEABILITY': 'Traceability',
    'CONSISTENCY': 'Consistency'
  };
  return titles[category] || category;
}

function consolidateActions(results: AssessmentResult[]): Array<{
  priority: string;
  action: string;
  criterion: string;
  owner: string;
  effort: string;
}> {
  const actions: Array<{
    priority: string;
    action: string;
    criterion: string;
    owner: string;
    effort: string;
    sortKey: number;
  }> = [];

  for (const result of results) {
    if (result.status === 'meets') continue;
    const priority = result.severity.toUpperCase();
    const sortKey = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 }[priority] || 3;

    for (const action of result.actions_required) {
      actions.push({
        priority,
        action: action.action,
        criterion: result.matrix_id,
        owner: action.owner,
        effort: action.effort,
        sortKey
      });
    }
  }

  return actions.sort((a, b) => a.sortKey - b.sortKey).map(({ sortKey, ...rest }) => rest);
}

/**
 * Generate JSON export of assessment
 */
export function generateMatrixJSON(data: ReportData): object {
  const passResults = data.assessment.results.filter(r => r.status === 'meets');
  const failResults = data.assessment.results.filter(r => r.status === 'does_not_meet');
  const partialResults = data.assessment.results.filter(r => r.status === 'partial');

  return {
    meta: {
      packName: data.packName,
      versionNumber: data.versionNumber,
      projectName: data.projectName,
      documentCount: data.documentCount,
      generatedAt: new Date().toISOString()
    },
    summary: {
      criteria: {
        total: data.assessment.criteria_summary.total_applicable,
        pass: passResults.length,
        partial: partialResults.length,
        fail: failResults.length
      },
      severity: data.assessment.flagged_by_severity,
      topActions: getTopActions(data.assessment.results, 5)
    },
    pack_context: data.assessment.pack_context,
    results: data.assessment.results,
    actions: consolidateActions(data.assessment.results),
    guardrails: data.assessment.guardrail_stats
  };
}

/**
 * Generate UI summary data (for compact display)
 */
export function generateUISummary(data: ReportData): object {
  const passResults = data.assessment.results.filter(r => r.status === 'meets');
  const failResults = data.assessment.results.filter(r => r.status === 'does_not_meet');
  const partialResults = data.assessment.results.filter(r => r.status === 'partial');
  const riskThemes = getRiskThemes(data.assessment.results);

  return {
    overallStatus: getOverallStatusLabel(data.assessment),
    criteria: {
      total: data.assessment.criteria_summary.total_applicable,
      pass: passResults.length,
      partial: partialResults.length,
      fail: failResults.length,
      notAssessed: data.assessment.criteria_summary.not_assessed
    },
    severity: data.assessment.flagged_by_severity,
    riskThemes: riskThemes.slice(0, 5),
    topActions: getTopActions(data.assessment.results, 5),
    confidence: {
      documentsAnalysed: data.documentCount,
      referenceAnchorRate: data.assessment.guardrail_stats.reference_anchor_rate,
      corpusBackedCriteria: data.assessment.guardrail_stats.corpus_backed_criteria
    }
  };
}

function getOverallStatusLabel(assessment: FullAssessment): { label: string; color: string; description: string } {
  const { flagged_by_severity, criteria_summary } = assessment;

  if (flagged_by_severity.high >= 3) {
    return {
      label: 'At Risk',
      color: 'red',
      description: 'Multiple high-severity gaps. Significant work required.'
    };
  }
  if (flagged_by_severity.high >= 1 || flagged_by_severity.medium >= 4) {
    return {
      label: 'Needs Attention',
      color: 'amber',
      description: 'High-priority gaps present. Address before submission.'
    };
  }
  if (criteria_summary.does_not_meet === 0 && criteria_summary.partial <= 3) {
    return {
      label: 'Likely Reviewable',
      color: 'green',
      description: 'Pack substantially meets expectations.'
    };
  }
  return {
    label: 'Review Recommended',
    color: 'amber',
    description: 'Several criteria partially met.'
  };
}

export default {
  generateMatrixReport,
  generateMatrixJSON,
  generateUISummary
};
