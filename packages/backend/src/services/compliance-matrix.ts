/**
 * Compliance Matrix Generator
 *
 * Generates BSR compliance traceability matrices showing:
 * - BSR Requirement | Evidence Location | Status | Notes
 *
 * Similar to patent claim charts - maps requirements to evidence
 *
 * UPDATED (GitHub Issues #4, #5): Uses enrichment service for actionable Request text
 * and regulatory-specific "Why It Matters" content
 */

import { formatOwnerRole } from '../config/owner-roles.js';
import { enrichRequestText, enrichWhyItMatters } from './compliance-enrichment.js';

export interface ComplianceMatrixRow {
  requirementId: string;
  requirement: string;
  category: string;
  status: 'Blocker' | 'Review Required' | 'Missing Info' | 'Met';
  priority?: string;
  whatsWrong?: string;
  whyItMatters?: string;
  request?: string;
  owner?: string;
  evidenceDocument?: string;
  evidencePage?: number | string;
  evidenceQuote?: string;
  evidenceQuality?: string;
  notes?: string;
}

export interface ComplianceMatrix {
  projectName: string;
  generatedDate: string;
  totalRequirements: number;
  met: number;
  partial: number;
  notMet: number;
  complianceRate: number;
  rows: ComplianceMatrixRow[];
}

/**
 * Generate compliance matrix from assessment results
 */
export function generateComplianceMatrix(
  assessment: any,
  projectName: string = 'BSR Submission'
): ComplianceMatrix {
  const rows: ComplianceMatrixRow[] = [];

  // Process each assessment result
  for (const result of assessment.results || []) {
    const status = mapStatus(result);

    // Extract evidence (GitHub Issue #2: Ensure page numbers are properly formatted)
    const evidence = result.pack_evidence || result.evidence || {};
    const evidenceDocument = evidence.document || evidence.doc_title || '';
    const evidencePage = evidence.page || evidence.page_ref || null;
    const evidenceQuote = evidence.quote || '';

    // Extract action info
    const action = result.actions_required?.[0];

    // What's Wrong: First gap or summary
    const whatsWrong = result.gaps_identified?.[0] ||
                       (status === 'Missing Info' ? 'Information not provided' : undefined);

    // Why It Matters: Enriched with regulatory context (GitHub Issue #5)
    const whyItMatters = enrichWhyItMatters(result);

    // Request: Enriched with actionable, specific instructions (GitHub Issue #4)
    const request = enrichRequestText(result);

    // Evidence Quality: Map to readable label
    const evidenceQuality = result.evidence_quality ?
      formatEvidenceQuality(result.evidence_quality) : undefined;

    // Owner: Format using centralized config (GitHub Issue #3)
    const ownerType = result.owner_type || action?.owner_type || result.triage?.owner_type;
    const formattedOwner = formatOwnerRole(ownerType);

    const row: ComplianceMatrixRow = {
      requirementId: result.matrix_id || '',
      requirement: result.matrix_title || result.requirement || '',
      category: result.category || determineCategory(result.matrix_id),
      status,
      priority: determinePriority(result),
      whatsWrong,
      whyItMatters,
      request,
      owner: formattedOwner,
      evidenceDocument: evidenceDocument || undefined,
      evidencePage: evidencePage || undefined,
      evidenceQuote: evidenceQuote || undefined,
      evidenceQuality,
      notes: result.reasoning || undefined
    };

    rows.push(row);
  }

  // Calculate summary stats with new status values
  const met = rows.filter(r => r.status === 'Met').length;
  const partial = rows.filter(r => r.status === 'Review Required').length;
  const notMet = rows.filter(r => r.status === 'Blocker' || r.status === 'Missing Info').length;
  const complianceRate = Math.round((met / rows.length) * 100);

  return {
    projectName,
    generatedDate: new Date().toISOString(),
    totalRequirements: rows.length,
    met,
    partial,
    notMet,
    complianceRate,
    rows: sortRows(rows)
  };
}

/**
 * Map assessment status to matrix status
 * Uses new triage-based classification
 *
 * FIXED (GitHub Issue #1): Properly promotes partial status with explicit evidence to "Met"
 */
function mapStatus(result: any): 'Blocker' | 'Review Required' | 'Missing Info' | 'Met' {
  const status = result.status?.toLowerCase();
  const severity = result.severity?.toLowerCase();
  const evidenceQuality = result.evidence_quality;

  // Blocker: High severity failures
  if (status === 'does_not_meet' && severity === 'high') {
    return 'Blocker';
  }

  // Missing Info: Missing information or absent evidence
  if (status === 'missing_information' || evidenceQuality === 'absent') {
    return 'Missing Info';
  }

  // Review Required: Ambiguous or implicit evidence
  if (evidenceQuality === 'ambiguous' || evidenceQuality === 'implicit') {
    return 'Review Required';
  }

  // Met: Fully met, or partial with explicit evidence
  if (status === 'meets' || (status === 'partial' && evidenceQuality === 'explicit')) {
    return 'Met';
  }

  // Default to Review Required for partial/unclear cases
  return 'Review Required';
}

/**
 * Format evidence quality for Excel display
 */
function formatEvidenceQuality(quality: string): string {
  const map: Record<string, string> = {
    'explicit': 'Explicit',
    'implicit': 'Implicit',
    'ambiguous': 'Ambiguous',
    'absent': 'Absent'
  };
  return map[quality] || quality;
}

/**
 * Determine category from requirement ID
 */
function determineCategory(matrixId: string): string {
  if (!matrixId) return 'General';

  const prefix = matrixId.split('-')[0];

  const categoryMap: Record<string, string> = {
    'FS': 'Fire Safety',
    'ST': 'Structural',
    'MEP': 'MEP Systems',
    'ARCH': 'Architectural',
    'SM': 'Submission',
    'DAS': 'Design & Access',
    'ENV': 'Environmental',
    'ACC': 'Accessibility'
  };

  return categoryMap[prefix] || 'General';
}

/**
 * Determine priority based on assessment data
 */
function determinePriority(result: any): string {
  if (result.triage?.urgency === 'CRITICAL_BLOCKER' || result.triage?.blocks_submission) {
    return 'Critical';
  }
  if (result.triage?.urgency === 'HIGH_PRIORITY' || result.severity === 'high') {
    return 'High';
  }
  if (result.status === 'does_not_meet') {
    return 'Medium';
  }
  return 'Low';
}

/**
 * Sort matrix rows for optimal presentation
 * Order: Critical issues first, then by category, then by ID
 */
function sortRows(rows: ComplianceMatrixRow[]): ComplianceMatrixRow[] {
  return rows.sort((a, b) => {
    // Priority first (Critical > High > Medium > Low)
    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    const aPriority = priorityOrder[a.priority || 'Low'] ?? 999;
    const bPriority = priorityOrder[b.priority || 'Low'] ?? 999;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Then by status (Blocker > Missing Info > Review Required > Met)
    const statusOrder = { 'Blocker': 0, 'Missing Info': 1, 'Review Required': 2, 'Met': 3 };
    const aStatus = statusOrder[a.status] ?? 999;
    const bStatus = statusOrder[b.status] ?? 999;

    if (aStatus !== bStatus) {
      return aStatus - bStatus;
    }

    // Then by category
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }

    // Finally by requirement ID
    return a.requirementId.localeCompare(b.requirementId);
  });
}
