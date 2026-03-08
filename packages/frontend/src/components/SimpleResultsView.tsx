/**
 * SimpleResultsView - Single-screen results display
 *
 * Shows assessment results clearly and concisely:
 * - Overall submission verdict (RED/AMBER/GREEN)
 * - Summary statistics
 * - Issues grouped by responsible party
 * - Single download button
 *
 * Replaces complex multi-screen carousel flows.
 */

import React, { useMemo, useState } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface SimpleResultsViewProps {
  assessment: {
    results: AssessmentResult[];
    pack_context?: {
      buildingType: string;
      isHRB: boolean;
      isLondon: boolean;
    };
  };
  onDownloadReport: () => void;
  onClose?: () => void;
  onSaveToClient?: () => void;
}

interface GroupedIssues {
  [responsible: string]: AssessmentResult[];
}

export const SimpleResultsView: React.FC<SimpleResultsViewProps> = ({
  assessment,
  onDownloadReport,
  onClose,
  onSaveToClient
}) => {
  // Filter to only issues (partial or does_not_meet)
  const issues = useMemo(() => {
    return assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );
  }, [assessment.results]);

  // Count by severity
  const severityCounts = useMemo(() => {
    const critical = issues.filter(i => i.triage?.urgency === 'CRITICAL_BLOCKER').length;
    const high = issues.filter(i => i.triage?.urgency === 'HIGH_PRIORITY').length;
    const medium = issues.filter(i => i.triage?.urgency === 'MEDIUM_PRIORITY').length;
    const low = issues.filter(i => i.triage?.urgency === 'LOW_PRIORITY' || !i.triage?.urgency).length;
    const blocksSubmission = issues.filter(i => i.triage?.blocks_submission).length;

    return { critical, high, medium, low, blocksSubmission };
  }, [issues]);

  // Determine overall verdict
  const verdict = useMemo(() => {
    if (severityCounts.critical > 10 || issues.length > 50) return 'RED';
    if (severityCounts.critical > 0 || issues.length > 20) return 'AMBER';
    return 'GREEN';
  }, [severityCounts.critical, issues.length]);

  // Group issues by responsible party
  const groupedIssues = useMemo((): GroupedIssues => {
    const groups: GroupedIssues = {};

    issues.forEach(issue => {
      const category = issue.category?.toLowerCase() || '';
      const actionOwner = issue.actions_required?.[0]?.owner?.toLowerCase() || '';

      let responsible = 'General Review';

      if (category.includes('fire') || actionOwner.includes('fire')) {
        responsible = 'Fire Engineer';
      } else if (category.includes('structural')) {
        responsible = 'Structural Engineer';
      } else if (category.includes('mep') || category.includes('mechanical') || category.includes('electrical')) {
        responsible = 'MEP Engineer';
      } else if (category.includes('architect')) {
        responsible = 'Architect';
      } else if (issue.triage?.quick_win) {
        responsible = 'Quick Wins';
      }

      if (!groups[responsible]) {
        groups[responsible] = [];
      }
      groups[responsible].push(issue);
    });

    // Sort groups: Quick Wins first, then by count descending
    const sortedEntries = Object.entries(groups).sort((a, b) => {
      if (a[0] === 'Quick Wins') return -1;
      if (b[0] === 'Quick Wins') return 1;
      return b[1].length - a[1].length;
    });

    return Object.fromEntries(sortedEntries);
  }, [issues]);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const getSeverityBadge = (issue: AssessmentResult) => {
    const urgency = issue.triage?.urgency || 'MEDIUM_PRIORITY';

    if (urgency === 'CRITICAL_BLOCKER') {
      return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded">CRITICAL</span>;
    } else if (urgency === 'HIGH_PRIORITY') {
      return <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded">HIGH</span>;
    } else if (urgency === 'MEDIUM_PRIORITY') {
      return <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded">MEDIUM</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded">LOW</span>;
    }
  };

  const verdictConfig = {
    RED: {
      color: 'bg-red-500',
      text: 'text-red-900',
      bgLight: 'bg-red-50',
      border: 'border-red-500',
      icon: '🔴',
      title: 'Submission Not Ready',
      message: `Your submission has ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} that must be resolved before proceeding to Gateway 2.`
    },
    AMBER: {
      color: 'bg-amber-500',
      text: 'text-amber-900',
      bgLight: 'bg-amber-50',
      border: 'border-amber-500',
      icon: '🟡',
      title: 'Submission Requires Work',
      message: `Your submission has ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} that should be addressed before submission.`
    },
    GREEN: {
      color: 'bg-emerald-500',
      text: 'text-emerald-900',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-500',
      icon: '🟢',
      title: 'Submission Nearly Ready',
      message: `Your submission is in good shape with only ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to address.`
    }
  }[verdict];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-lg">
        {/* Header */}
        <div className="border-b-2 border-slate-300 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">BSR Compliance Assessment</h2>
              <p className="text-sm text-slate-600 mt-1">
                {assessment.results.length} criteria assessed
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overall Verdict */}
          <div className={`border-l-4 ${verdictConfig.border} ${verdictConfig.bgLight} p-6 mb-6 rounded-r-lg`}>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 ${verdictConfig.color} rounded-full flex items-center justify-center text-3xl`}>
                {verdictConfig.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${verdictConfig.text}`}>
                  {verdictConfig.title}
                </h3>
                <p className={`text-base ${verdictConfig.text}`}>
                  {verdictConfig.message}
                </p>
                {severityCounts.blocksSubmission > 0 && (
                  <p className={`text-sm mt-2 font-semibold ${verdictConfig.text}`}>
                    ⚠️ {severityCounts.blocksSubmission} {severityCounts.blocksSubmission === 1 ? 'issue blocks' : 'issues block'} submission
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-900">{severityCounts.critical}</div>
              <div className="text-sm text-red-700 font-medium">Critical</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-amber-900">{severityCounts.high}</div>
              <div className="text-sm text-amber-700 font-medium">High Priority</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-900">{severityCounts.medium}</div>
              <div className="text-sm text-blue-700 font-medium">Medium</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-slate-900">{severityCounts.low}</div>
              <div className="text-sm text-slate-700 font-medium">Low</div>
            </div>
          </div>

          {/* Issues Grouped by Responsible Party */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Issues by Responsible Party</h3>

            {Object.entries(groupedIssues).map(([responsible, groupIssues]) => (
              <div key={responsible} className="border-2 border-slate-300 rounded-lg overflow-hidden">
                <div
                  className="bg-slate-100 p-4 cursor-pointer hover:bg-slate-200 transition-colors"
                  onClick={() => setExpandedGroup(expandedGroup === responsible ? null : responsible)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {responsible === 'Fire Engineer' ? '🔥' :
                         responsible === 'Structural Engineer' ? '🏗️' :
                         responsible === 'MEP Engineer' ? '⚡' :
                         responsible === 'Architect' ? '📐' :
                         responsible === 'Quick Wins' ? '⚡' : '📋'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{responsible}</div>
                        <div className="text-sm text-slate-600">
                          {groupIssues.length} {groupIssues.length === 1 ? 'issue' : 'issues'}
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-600 transition-transform ${expandedGroup === responsible ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedGroup === responsible && (
                  <div className="p-4 bg-white space-y-3">
                    {groupIssues.map((issue) => (
                      <div key={issue.matrix_id} className="border border-slate-200 rounded p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="text-xs font-mono text-slate-500 mb-1">{issue.matrix_id}</div>
                            <div className="font-semibold text-slate-900">{issue.matrix_title}</div>
                          </div>
                          {getSeverityBadge(issue)}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{issue.reasoning}</p>
                        {issue.actions_required && issue.actions_required[0] && (
                          <div className="bg-blue-50 border-l-2 border-blue-500 p-2 text-sm">
                            <strong className="text-blue-900">Action:</strong>{' '}
                            <span className="text-blue-800">{issue.actions_required[0].action}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-slate-300 bg-slate-50 p-6">
          <div className="flex gap-3 justify-end">
            {onSaveToClient && (
              <button
                onClick={onSaveToClient}
                className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Save to Client
              </button>
            )}
            <button
              onClick={onDownloadReport}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Compliance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleResultsView;
