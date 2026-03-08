/**
 * Export Service
 *
 * Handles all document export operations
 * Connects frontend to backend export endpoints
 */

import type { FullAssessment, SubmissionGate, EngagementBrief } from '../types/assessment';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ExportSettings {
  includeEvidence: boolean;
  includeDashboard: boolean;
  includeActionPlan: boolean;
  includeBriefs: boolean;
  filterLevel?: 'all' | 'critical' | 'high_priority';
}

/**
 * Download assessment report as PDF
 */
export async function exportAssessmentPDF(
  packId: string,
  versionId: string,
  assessment: FullAssessment,
  submissionGate?: SubmissionGate,
  settings?: ExportSettings
): Promise<void> {
  try {
    // Use the matrix-report endpoint for new assessment format
    const response = await fetch(
      `${API_BASE}/api/packs/${packId}/versions/${versionId}/matrix-report/download/pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment,
          submissionGate,
          settings
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-report-${assessment.pack_context.buildingType}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}

/**
 * Export issues as CSV for tracking/importing into project tools
 */
export async function exportIssuesCSV(
  assessment: FullAssessment,
  filterLevel?: 'all' | 'critical' | 'high_priority'
): Promise<void> {
  try {
    let issues = assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );

    // Apply filter
    if (filterLevel === 'critical') {
      issues = issues.filter(r => r.triage?.urgency === 'CRITICAL_BLOCKER');
    } else if (filterLevel === 'high_priority') {
      issues = issues.filter(r =>
        r.triage?.urgency === 'CRITICAL_BLOCKER' || r.triage?.urgency === 'HIGH_PRIORITY'
      );
    }

    // Build CSV
    const headers = [
      'ID',
      'Title',
      'Category',
      'Status',
      'Urgency',
      'Blocks Submission',
      'Engagement Type',
      'Quick Win',
      'Effort Level',
      'Action Required',
      'Owner',
      'Expected Benefit'
    ];

    const rows = issues.map(issue => {
      const action = issue.actions_required?.[0];
      return [
        issue.matrix_id,
        issue.matrix_title,
        issue.category,
        issue.status,
        issue.triage?.urgency || 'Not Set',
        issue.triage?.blocks_submission ? 'YES' : 'NO',
        issue.triage?.engagement_type || 'Unknown',
        issue.triage?.quick_win ? 'YES' : 'NO',
        issue.effort_assessment?.level || action?.effort || 'Unknown',
        action?.action || 'No action specified',
        action?.owner || 'TBD',
        action?.expected_benefit || ''
      ].map(cell => {
        // Escape CSV values
        const str = String(cell || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw error;
  }
}

/**
 * Export engagement brief as PDF
 */
export async function exportEngagementBrief(
  packId: string,
  versionId: string,
  brief: EngagementBrief
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE}/api/packs/${packId}/versions/${versionId}/engagement-brief/download`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brief })
      }
    );

    if (!response.ok) {
      throw new Error(`Brief export failed: ${response.statusText}`);
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagement-brief-${brief.specialist_type.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export engagement brief:', error);
    throw error;
  }
}

/**
 * Export assessment as JSON (for archiving/processing)
 */
export async function exportAssessmentJSON(
  assessment: FullAssessment,
  submissionGate?: SubmissionGate
): Promise<void> {
  try {
    const exportData = {
      meta: {
        exportDate: new Date().toISOString(),
        packId: assessment.pack_id,
        versionId: assessment.version_id,
        readinessScore: assessment.readiness_score
      },
      assessment,
      submissionGate
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw error;
  }
}

/**
 * Generate executive summary (simplified report)
 */
export async function exportExecutiveSummary(
  packId: string,
  versionId: string,
  assessment: FullAssessment,
  submissionGate?: SubmissionGate
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE}/api/packs/${packId}/versions/${versionId}/executive-summary/download`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment,
          submissionGate
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Executive summary export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-summary-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export executive summary:', error);
    throw error;
  }
}

/**
 * Generate outstanding issues report (human-required items only)
 */
export async function exportOutstandingIssues(
  packId: string,
  versionId: string,
  assessment: FullAssessment
): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE}/api/packs/${packId}/versions/${versionId}/outstanding-issues/download`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Outstanding issues export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outstanding-issues-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export outstanding issues:', error);
    throw error;
  }
}
