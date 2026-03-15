/**
 * Compliance Matrix Enrichment Service
 *
 * Provides check-specific regulatory context and actionable requests
 * to replace boilerplate text in compliance matrix outputs.
 *
 * Addresses GitHub Issues #4, #5, #6:
 * - #4: Actionable Request text (not just restating check name)
 * - #5: Check-specific "Why It Matters" with regulatory references
 * - #6: Detailed gap descriptions for gap analysis PDF
 */

import type { AssessmentResult } from './matrix-assessment.js';

/**
 * Regulatory context mapping for "Why It Matters"
 * Maps check categories to specific regulatory/risk consequences
 */
const REGULATORY_CONTEXT: Record<string, string> = {
  'Fire Safety': 'Without compliant fire safety documentation, the BSR will reject the Gateway 2 application immediately. Fire safety is the highest priority regulatory requirement under the Building Safety Act 2022 s.78.',
  'Structural': 'Missing structural documentation will result in automatic BSR rejection. Structural integrity must be demonstrated for all higher-risk buildings under the Building Regulations 2010 Part A.',
  'MEP Systems': 'MEP documentation gaps create liability under Building Safety Act 2022 s.83 (Golden Thread). Without proper systems documentation, you cannot demonstrate competence throughout the building lifecycle.',
  'Architectural': 'Incomplete architectural documentation prevents the BSR from assessing compliance with Approved Document B (Fire Safety) and will trigger information requests or rejection at Gateway 2.',
  'Submission': 'Gateway 2 submission documentation is mandatory under the Building Safety (Higher-Risk Buildings Procedures) Regulations 2023. Missing submission documents will block the entire application.',
  'Design & Access': 'Design and access documentation is required under the Planning (Listed Buildings and Conservation Areas) Act 1990. Without this, the planning authority may refuse the application.',
  'Environmental': 'Environmental documentation is required under Environmental Impact Assessment regulations. Missing reports may trigger statutory consultation delays or planning refusal.',
  'Accessibility': 'Accessibility compliance is mandatory under Approved Document M and the Equality Act 2010. Non-compliance creates legal liability and will require costly post-construction remediation.',
  'Golden Thread': 'Missing Golden Thread documentation violates Building Safety Act 2022 s.83. This creates ongoing liability for the accountable person and prevents handover to the building owner at Gateway 3.',
  'Competence': 'The BSR requires evidence of competent persons under the Building Safety Act 2022 s.85. Without competence documentation, the application will be rejected immediately.'
};

/**
 * Action templates for specific check types
 * Provides concrete, actionable instructions based on check category and status
 */
const ACTION_TEMPLATES: Record<string, {
  missing: string;
  partial: string;
  unclear: string;
}> = {
  'Fire Safety': {
    missing: 'Commission a chartered fire engineer to prepare a comprehensive fire strategy report covering evacuation routes, compartmentation, suppression systems, and smoke control. The report must be signed off by a competent fire safety professional.',
    partial: 'Have your fire engineer review and update the existing fire strategy to explicitly address: {gaps}. Ensure all sections are complete with specific design details, not generic statements.',
    unclear: 'Clarify the fire safety documentation to resolve ambiguities in: {gaps}. Have your fire engineer provide explicit statements with calculations and regulatory cross-references.'
  },
  'Structural': {
    missing: 'Engage a chartered structural engineer to prepare structural calculations and drawings demonstrating compliance with Approved Document A. Include load analysis, foundation design, and structural stability assessment.',
    partial: 'Have your structural engineer complete the structural documentation to address: {gaps}. Provide specific calculations, material specifications, and design justifications.',
    unclear: 'Obtain clarification from your structural engineer regarding: {gaps}. Ensure calculations are clearly presented with assumptions and safety factors stated.'
  },
  'MEP Systems': {
    missing: 'Commission an M&E consultant to prepare detailed MEP documentation covering electrical systems, mechanical ventilation, plumbing, drainage, and fire suppression. Include system specifications, calculations, and commissioning plans.',
    partial: 'Have your M&E consultant update the MEP documentation to include: {gaps}. Provide system schematics, equipment specifications, and maintenance schedules.',
    unclear: 'Request your M&E consultant to clarify: {gaps}. Ensure all system designs are fully specified with performance criteria and compliance statements.'
  },
  'Architectural': {
    missing: 'Prepare complete architectural drawings and specifications including floor plans, elevations, sections, and detail drawings at 1:50 or 1:20 scale. Include material specifications and construction details.',
    partial: 'Update the architectural drawings to include: {gaps}. Ensure all construction details are fully dimensioned and specified.',
    unclear: 'Clarify the architectural documentation to resolve: {gaps}. Provide explicit dimensions, materials, and construction methods.'
  },
  'Submission': {
    missing: 'Prepare the mandatory Gateway 2 submission documentation as specified in BSR guidance. Include completed application forms, fee payment confirmation, and document register.',
    partial: 'Complete the submission documentation by adding: {gaps}. Ensure all forms are signed, dated, and include required declarations.',
    unclear: 'Clarify the submission documentation to address: {gaps}. Ensure all information is consistent across submission documents.'
  },
  'Golden Thread': {
    missing: 'Establish a Golden Thread information management system capturing all design decisions, changes, and competence evidence. Appoint a responsible person to maintain the Golden Thread throughout the project.',
    partial: 'Update the Golden Thread documentation to include: {gaps}. Ensure all design changes are logged with dates, approvers, and justifications.',
    unclear: 'Clarify the Golden Thread documentation regarding: {gaps}. Ensure traceability from initial design through to current revision status.'
  },
  'Competence': {
    missing: 'Provide competence evidence for all appointed persons including CVs, professional qualifications, insurance certificates, and competence declarations under Building Safety Act 2022 s.85.',
    partial: 'Complete the competence documentation by adding: {gaps}. Ensure all required evidence is provided for each appointed person.',
    unclear: 'Clarify the competence documentation to address: {gaps}. Provide explicit evidence of qualifications and relevant experience.'
  }
};

/**
 * Enrich "Request" field with actionable, specific instructions
 * Addresses GitHub Issue #4
 */
export function enrichRequestText(result: AssessmentResult): string {
  const category = result.category || 'General';
  const status = result.status;
  const gaps = result.gaps_identified || [];

  // Get category-specific template
  const template = ACTION_TEMPLATES[category];
  if (!template) {
    // Fallback for unmapped categories
    return generateFallbackRequest(result);
  }

  // Select appropriate template based on status
  let baseRequest = '';
  if (status === 'missing_information') {
    baseRequest = template.missing;
  } else if (status === 'partial') {
    baseRequest = template.partial;
  } else if (result.evidence_quality === 'ambiguous' || result.evidence_quality === 'implicit') {
    baseRequest = template.unclear;
  } else {
    baseRequest = template.partial; // Default to partial template
  }

  // Replace {gaps} placeholder with actual gaps
  const gapsList = gaps
    .filter(g => g && g.length > 0)
    .slice(0, 4) // Limit to 4 items for readability
    .join('; ');

  if (gapsList) {
    baseRequest = baseRequest.replace('{gaps}', gapsList);
  } else {
    // Remove {gaps} placeholder if no gaps available
    baseRequest = baseRequest.replace(/to (?:address|include|resolve|regarding|covering): \{gaps\}\.?\s*/gi, '');
  }

  return baseRequest;
}

/**
 * Enrich "Why It Matters" field with regulatory context
 * Addresses GitHub Issue #5
 */
export function enrichWhyItMatters(result: AssessmentResult): string {
  const category = result.category || 'General';
  const severity = result.severity || 'medium';

  // Get category-specific regulatory context
  const regulatoryContext = REGULATORY_CONTEXT[category];
  if (!regulatoryContext) {
    // Fallback for unmapped categories
    return generateFallbackWhyItMatters(result);
  }

  // Add severity-specific context
  if (severity === 'high') {
    return `CRITICAL: ${regulatoryContext} This is a submission blocker.`;
  }

  return regulatoryContext;
}

/**
 * Generate detailed gap description for Gap Analysis PDF
 * Addresses GitHub Issue #6
 */
export function generateGapDescription(result: AssessmentResult): {
  whatWasFound: string;
  whatIsMissing: string;
  whatIsNeeded: string;
} {
  const status = result.status;
  const evidenceQuality = result.evidence_quality;
  const evidenceDoc = result.pack_evidence?.document;
  const evidencePage = result.pack_evidence?.page;
  const gaps = result.gaps_identified || [];

  // What was found
  let whatWasFound = '';
  if (status === 'missing_information' || evidenceQuality === 'absent') {
    whatWasFound = 'No documentation found';
  } else if (evidenceDoc) {
    const pageRef = evidencePage ? ` (page ${evidencePage})` : '';
    if (evidenceQuality === 'explicit') {
      whatWasFound = `${evidenceDoc}${pageRef} contains explicit information but is incomplete`;
    } else if (evidenceQuality === 'implicit') {
      whatWasFound = `${evidenceDoc}${pageRef} contains implicit references but lacks explicit statements`;
    } else if (evidenceQuality === 'ambiguous') {
      whatWasFound = `${evidenceDoc}${pageRef} contains ambiguous or contradictory information`;
    } else {
      whatWasFound = `${evidenceDoc}${pageRef} present`;
    }
  } else {
    whatWasFound = 'Document status unclear';
  }

  // What is missing
  const whatIsMissing = gaps.length > 0
    ? gaps.join('; ')
    : 'Specific gaps not identified';

  // What is needed
  const whatIsNeeded = enrichRequestText(result);

  return {
    whatWasFound,
    whatIsMissing,
    whatIsNeeded
  };
}

/**
 * Fallback request generator for unmapped categories
 */
function generateFallbackRequest(result: AssessmentResult): string {
  const gaps = result.gaps_identified || [];

  if (gaps.length > 0) {
    return `Provide documentation addressing: ${gaps.slice(0, 4).join('; ')}. Ensure all required information is explicitly stated with supporting evidence.`;
  }

  if (result.status === 'missing_information') {
    return `Provide complete documentation for ${result.matrix_title}. Ensure all regulatory requirements are addressed with explicit evidence.`;
  }

  return `Review and update documentation to ensure ${result.matrix_title} is fully addressed with explicit, unambiguous statements.`;
}

/**
 * Fallback why it matters generator for unmapped categories
 */
function generateFallbackWhyItMatters(result: AssessmentResult): string {
  if (result.severity === 'high') {
    return 'This is a critical requirement for BSR Gateway 2 approval. Missing or incomplete documentation will result in application rejection and project delays.';
  }

  return 'Required for BSR Gateway 2 compliance. Gaps may result in information requests, delays, or rejection.';
}

/**
 * Batch enrich multiple assessment results
 */
export function enrichAssessmentResults(results: AssessmentResult[]): AssessmentResult[] {
  return results.map(result => ({
    ...result,
    enriched_request: enrichRequestText(result),
    enriched_why_it_matters: enrichWhyItMatters(result),
    enriched_gap_description: generateGapDescription(result)
  }));
}
