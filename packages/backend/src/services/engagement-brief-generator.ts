/**
 * Specialist Engagement Brief Generator
 *
 * Stage 3: Generates ready-to-use briefs for engaging consultants
 * Saves time for project teams by providing templated scopes of work
 */

import type { AssessmentResult } from './matrix-assessment.js';

/**
 * Engagement brief for a specialist
 */
export interface EngagementBrief {
  specialist_type: string;
  issues_to_address: Array<{
    id: string;
    title: string;
    urgency: string;
  }>;
  scope_of_work: string;
  deliverables: string[];
  estimated_duration: string;
  regulatory_context: string[];
  brief_text: string;  // Ready-to-send email/RFQ text
}

/**
 * Generate engagement brief for fire engineer
 */
function generateFireEngineerBrief(issues: AssessmentResult[]): EngagementBrief {
  const issueList = issues.map(i => ({
    id: i.matrix_id,
    title: i.matrix_title,
    urgency: i.triage?.urgency || 'UNKNOWN'
  }));

  const hasStrategyGap = issues.some(i =>
    i.matrix_title.toLowerCase().includes('strategy')
  );

  const scopeItems = [];
  if (hasStrategyGap) {
    scopeItems.push('Prepare comprehensive fire strategy document');
  }

  issues.forEach(i => {
    if (i.actions_required && i.actions_required.length > 0) {
      scopeItems.push(i.actions_required[0].action);
    }
  });

  const deliverables = [
    'Fire strategy document signed by competent fire engineer',
    'Detailed fire safety calculations and justifications',
    'Compliance matrix showing how design meets Building Regulations Part B',
    'Recommendations for any design improvements'
  ];

  const regulatoryRefs = [
    'Building Safety Act 2022',
    'Approved Document B (Fire Safety) 2019 edition with 2020 amendments',
    'BS 9991:2015 (residential buildings) or BS 9999:2017 (other buildings)',
    'The Building (Higher-Risk Buildings Procedures) (England) Regulations 2023'
  ];

  const brief = `Subject: Fire Engineering Services Required for Gateway 2 BSR Submission

Dear Fire Engineering Team,

We require fire engineering services for a Gateway 2 BSR submission. Our pre-submission assessment has identified ${issues.length} fire safety ${issues.length === 1 ? 'issue' : 'issues'} that must be addressed before submission.

SCOPE OF WORK:
${scopeItems.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DELIVERABLES REQUIRED:
${deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

REGULATORY CONTEXT:
This is for a Higher-Risk Building (HRB) Gateway 2 submission to the Building Safety Regulator. All work must comply with:
${regulatoryRefs.map(r => `- ${r}`).join('\n')}

TIMELINE:
We require completion within ${issues.length <= 2 ? '2-3 weeks' : '4-6 weeks'} to meet our submission deadline.

ISSUES IDENTIFIED:
${issueList.map(i => `- ${i.id}: ${i.title} [${i.urgency}]`).join('\n')}

Please confirm your availability and provide a fee proposal at your earliest convenience.

Best regards`;

  return {
    specialist_type: 'Fire Safety Engineer',
    issues_to_address: issueList,
    scope_of_work: scopeItems.join('; '),
    deliverables,
    estimated_duration: issues.length <= 2 ? '2-3 weeks' : '4-6 weeks',
    regulatory_context: regulatoryRefs,
    brief_text: brief
  };
}

/**
 * Generate engagement brief for structural engineer
 */
function generateStructuralEngineerBrief(issues: AssessmentResult[]): EngagementBrief {
  const issueList = issues.map(i => ({
    id: i.matrix_id,
    title: i.matrix_title,
    urgency: i.triage?.urgency || 'UNKNOWN'
  }));

  const scopeItems = issues.map(i =>
    i.actions_required?.[0]?.action || `Address ${i.matrix_title}`
  );

  const deliverables = [
    'Structural calculations signed by chartered structural engineer',
    'Structural design drawings',
    'Material specifications and justifications',
    'Compliance statement for Building Regulations Part A'
  ];

  const brief = `Subject: Structural Engineering Services Required for Gateway 2 BSR Submission

Dear Structural Engineering Team,

We require structural engineering services for a Gateway 2 BSR submission. Our pre-submission assessment has identified ${issues.length} structural ${issues.length === 1 ? 'issue' : 'issues'}.

SCOPE OF WORK:
${scopeItems.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DELIVERABLES:
${deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

TIMELINE:
${issues.length <= 2 ? '2-3 weeks' : '3-4 weeks'}

Please confirm availability and provide fee proposal.`;

  return {
    specialist_type: 'Structural Engineer',
    issues_to_address: issueList,
    scope_of_work: scopeItems.join('; '),
    deliverables,
    estimated_duration: issues.length <= 2 ? '2-3 weeks' : '3-4 weeks',
    regulatory_context: ['Building Regulations Part A', 'BSR Gateway 2 requirements'],
    brief_text: brief
  };
}

/**
 * Generate engagement brief for MEP consultant
 */
function generateMEPBrief(issues: AssessmentResult[]): EngagementBrief {
  const issueList = issues.map(i => ({
    id: i.matrix_id,
    title: i.matrix_title,
    urgency: i.triage?.urgency || 'UNKNOWN'
  }));

  const scopeItems = issues.map(i =>
    i.actions_required?.[0]?.action || `Address ${i.matrix_title}`
  );

  const deliverables = [
    'Completed MEP specifications',
    'Ventilation and smoke control system details',
    'Energy performance calculations',
    'Compliance with Approved Documents F & L'
  ];

  const brief = `Subject: MEP Engineering Services Required for Gateway 2 BSR Submission

Dear MEP Team,

We require MEP engineering input for Gateway 2 BSR submission. ${issues.length} ${issues.length === 1 ? 'issue has' : 'issues have'} been identified.

SCOPE:
${scopeItems.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DELIVERABLES:
${deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

TIMELINE: ${issues.length <= 2 ? '1-2 weeks' : '2-3 weeks'}`;

  return {
    specialist_type: 'MEP Consultant',
    issues_to_address: issueList,
    scope_of_work: scopeItems.join('; '),
    deliverables,
    estimated_duration: issues.length <= 2 ? '1-2 weeks' : '2-3 weeks',
    regulatory_context: ['Approved Document F', 'Approved Document L'],
    brief_text: brief
  };
}

/**
 * Generate engagement brief for architect
 */
function generateArchitectBrief(issues: AssessmentResult[]): EngagementBrief {
  const issueList = issues.map(i => ({
    id: i.matrix_id,
    title: i.matrix_title,
    urgency: i.triage?.urgency || 'UNKNOWN'
  }));

  const scopeItems = issues.map(i =>
    i.actions_required?.[0]?.action || `Address ${i.matrix_title}`
  );

  const deliverables = ['Updated architectural drawings', 'Design revisions', 'Coordination with other disciplines'];

  const brief = `Subject: Architectural Services Required for Gateway 2 BSR Submission

Dear Architectural Team,

We require architectural input for Gateway 2 submission. ${issues.length} ${issues.length === 1 ? 'issue requires' : 'issues require'} attention.

SCOPE:
${scopeItems.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DELIVERABLES:
${deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

TIMELINE: ${issues.length <= 2 ? '1 week' : '1-2 weeks'}`;

  return {
    specialist_type: 'Architect',
    issues_to_address: issueList,
    scope_of_work: scopeItems.join('; '),
    deliverables,
    estimated_duration: issues.length <= 2 ? '1 week' : '1-2 weeks',
    regulatory_context: ['Building Regulations', 'BSR Gateway 2 requirements'],
    brief_text: brief
  };
}

/**
 * Generate all engagement briefs from assessment results
 */
export function generateEngagementBriefs(
  results: AssessmentResult[]
): EngagementBrief[] {
  const failedIssues = results.filter(r =>
    r.status === 'does_not_meet' || r.status === 'partial'
  );

  // Group by specialist type
  const bySpecialist: Record<string, AssessmentResult[]> = {};

  for (const issue of failedIssues) {
    const actions = issue.actions_required || [];
    if (actions.length === 0) continue;

    const owner = actions[0].owner?.toUpperCase() || '';

    if (owner.includes('FIRE')) {
      if (!bySpecialist['FIRE']) bySpecialist['FIRE'] = [];
      bySpecialist['FIRE'].push(issue);
    } else if (owner.includes('STRUCTURAL')) {
      if (!bySpecialist['STRUCTURAL']) bySpecialist['STRUCTURAL'] = [];
      bySpecialist['STRUCTURAL'].push(issue);
    } else if (owner.includes('MEP') || owner.includes('M&E')) {
      if (!bySpecialist['MEP']) bySpecialist['MEP'] = [];
      bySpecialist['MEP'].push(issue);
    } else if (owner.includes('ARCHITECT')) {
      if (!bySpecialist['ARCHITECT']) bySpecialist['ARCHITECT'] = [];
      bySpecialist['ARCHITECT'].push(issue);
    }
  }

  const briefs: EngagementBrief[] = [];

  if (bySpecialist['FIRE']) {
    briefs.push(generateFireEngineerBrief(bySpecialist['FIRE']));
  }

  if (bySpecialist['STRUCTURAL']) {
    briefs.push(generateStructuralEngineerBrief(bySpecialist['STRUCTURAL']));
  }

  if (bySpecialist['MEP']) {
    briefs.push(generateMEPBrief(bySpecialist['MEP']));
  }

  if (bySpecialist['ARCHITECT']) {
    briefs.push(generateArchitectBrief(bySpecialist['ARCHITECT']));
  }

  return briefs;
}
