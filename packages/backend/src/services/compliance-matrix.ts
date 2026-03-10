/**
 * Compliance Matrix Generator
 *
 * Generates BSR compliance traceability matrices showing:
 * - BSR Requirement | Evidence Location | Status | Notes
 *
 * Similar to patent claim charts - maps requirements to evidence
 */

export interface ComplianceMatrixRow {
  requirementId: string;
  requirement: string;
  category: string;
  status: 'Met' | 'Partial' | 'Not Met' | 'N/A';
  evidenceDocument?: string;
  evidencePage?: number | string;
  evidenceQuote?: string;
  gaps?: string[];
  action?: string;
  owner?: string;
  priority?: string;
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
    const status = mapStatus(result.status);

    // Extract evidence
    const evidence = result.pack_evidence || result.evidence || {};
    const evidenceDocument = evidence.document || evidence.doc_title || '';
    const evidencePage = evidence.page || evidence.page_ref || '';
    const evidenceQuote = evidence.quote || '';

    // Extract action info
    const action = result.actions_required?.[0];

    const row: ComplianceMatrixRow = {
      requirementId: result.matrix_id || '',
      requirement: result.matrix_title || result.requirement || '',
      category: result.category || determineCategory(result.matrix_id),
      status,
      evidenceDocument: evidenceDocument || undefined,
      evidencePage: evidencePage || undefined,
      evidenceQuote: evidenceQuote || undefined,
      gaps: result.gaps_identified || [],
      action: action?.action || undefined,
      owner: action?.owner || undefined,
      priority: determinePriority(result),
      notes: result.reasoning || undefined
    };

    rows.push(row);
  }

  // Calculate summary stats
  const met = rows.filter(r => r.status === 'Met').length;
  const partial = rows.filter(r => r.status === 'Partial').length;
  const notMet = rows.filter(r => r.status === 'Not Met').length;
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
 */
function mapStatus(status: string): 'Met' | 'Partial' | 'Not Met' | 'N/A' {
  switch (status?.toLowerCase()) {
    case 'meets':
    case 'met':
      return 'Met';
    case 'partial':
    case 'partially_meets':
      return 'Partial';
    case 'does_not_meet':
    case 'fail':
      return 'Not Met';
    case 'not_applicable':
    case 'n/a':
      return 'N/A';
    default:
      return 'Not Met';
  }
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

    // Then by status (Not Met > Partial > Met)
    const statusOrder = { 'Not Met': 0, 'Partial': 1, 'Met': 2, 'N/A': 3 };
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
