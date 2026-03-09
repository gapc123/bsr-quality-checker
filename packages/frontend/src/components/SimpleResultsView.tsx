/**
 * SimpleResultsView - Single Screen, Maximum Clarity, Action-Focused
 *
 * Design Principles:
 * - Single screen (no navigation needed)
 * - Action-oriented (what to DO is front and center)
 * - Scannable in 10 seconds
 * - Clear: Client actions vs Internal actions
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
  onDownloadReport: () => void | Promise<void>;
  onClose?: () => void;
  onSaveToClient?: () => void;
}

export const SimpleResultsView: React.FC<SimpleResultsViewProps> = ({
  assessment,
  onDownloadReport,
  onClose,
  onSaveToClient
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Categorize issues
  const analysis = useMemo(() => {
    const allIssues = assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );
    const passing = assessment.results.filter(r => r.status === 'meets');

    // Critical blockers
    const blockers = allIssues.filter(i =>
      i.triage?.urgency === 'CRITICAL_BLOCKER' ||
      i.triage?.blocks_submission
    );

    // Missing info (client needs to provide)
    const clientActions = allIssues.filter(i => {
      const reasoning = (i.reasoning || '').toLowerCase();
      const gaps = (i.gaps_identified || []).join(' ').toLowerCase();
      return (
        reasoning.includes('missing') ||
        reasoning.includes('not provided') ||
        reasoning.includes('tbc') ||
        reasoning.includes('to be confirmed') ||
        gaps.includes('missing')
      );
    });

    // Internal actions (we need specialists/work)
    const internalActions = allIssues.filter(i => !clientActions.includes(i));

    // Verdict
    let status: 'ready' | 'needs-work' | 'not-ready' = 'ready';
    let statusColor = '#10b981';
    let statusIcon = '✅';
    let statusText = 'Ready to Submit';

    if (blockers.length > 0) {
      status = 'not-ready';
      statusColor = '#ef4444';
      statusIcon = '❌';
      statusText = 'Not Ready';
    } else if (allIssues.length > 10) {
      status = 'needs-work';
      statusColor = '#f59e0b';
      statusIcon = '⚠️';
      statusText = 'Needs Work';
    }

    return {
      passing: passing.length,
      total: assessment.results.length,
      blockers,
      clientActions,
      internalActions,
      allIssues,
      status,
      statusColor,
      statusIcon,
      statusText
    };
  }, [assessment.results]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = onDownloadReport();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-lg">

        {/* Header with Verdict */}
        <div className="p-8 text-center border-b-4" style={{ borderColor: analysis.statusColor }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="text-6xl mb-4">{analysis.statusIcon}</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: analysis.statusColor }}>
            {analysis.statusText}
          </h2>

          {analysis.blockers.length > 0 ? (
            <p className="text-lg text-slate-700 mb-4">
              <strong className="text-red-600">{analysis.blockers.length}</strong> critical {analysis.blockers.length === 1 ? 'item blocks' : 'items block'} submission
            </p>
          ) : (
            <p className="text-lg text-slate-700 mb-4">
              {analysis.allIssues.length === 0
                ? 'All criteria met!'
                : `${analysis.allIssues.length} ${analysis.allIssues.length === 1 ? 'item' : 'items'} to address before submission`
              }
            </p>
          )}

          {/* Quick Stats Bar */}
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span className="font-bold text-2xl text-emerald-600">{analysis.passing}</span>
              <span className="text-slate-600 ml-2">passing</span>
            </div>
            <div className="text-slate-400">•</div>
            <div>
              <span className="font-bold text-2xl text-orange-600">{analysis.allIssues.length}</span>
              <span className="text-slate-600 ml-2">need attention</span>
            </div>
          </div>
        </div>

        {/* Main Content - Action Required */}
        <div className="flex-1 overflow-y-auto p-8">

          {analysis.allIssues.length > 0 ? (
            <>
              <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                → What to Do Next
              </h3>

              <div className="grid grid-cols-2 gap-6 mb-8">

                {/* LEFT: Client Actions */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-500 text-white p-3 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-orange-900">Tell Client to Provide</h4>
                      <p className="text-xs text-orange-700">{analysis.clientActions.length} {analysis.clientActions.length === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>

                  {analysis.clientActions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysis.clientActions.slice(0, 8).map((issue, idx) => (
                        <li key={issue.matrix_id} className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold mt-0.5">{idx + 1}.</span>
                          <span className="text-slate-800 leading-tight">{issue.matrix_title}</span>
                        </li>
                      ))}
                      {analysis.clientActions.length > 8 && (
                        <li className="text-orange-700 italic text-xs">
                          + {analysis.clientActions.length - 8} more items...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-orange-700 italic">No missing information</p>
                  )}
                </div>

                {/* RIGHT: Internal Actions */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500 text-white p-3 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-blue-900">We Need to Address</h4>
                      <p className="text-xs text-blue-700">{analysis.internalActions.length} {analysis.internalActions.length === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>

                  {analysis.internalActions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysis.internalActions.slice(0, 8).map((issue, idx) => (
                        <li key={issue.matrix_id} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-slate-800 leading-tight">{issue.matrix_title}</span>
                            {issue.actions_required?.[0]?.owner && (
                              <span className="block text-xs text-blue-700 mt-1">
                                → {issue.actions_required[0].owner}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                      {analysis.internalActions.length > 8 && (
                        <li className="text-blue-700 italic text-xs">
                          + {analysis.internalActions.length - 8} more items...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-blue-700 italic">No internal actions needed</p>
                  )}
                </div>
              </div>

              {/* Critical Blockers Alert */}
              {analysis.blockers.length > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🚨</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-red-900 mb-2">
                        Critical Blockers ({analysis.blockers.length})
                      </h4>
                      <p className="text-sm text-red-800 mb-3">
                        These items MUST be resolved before submission:
                      </p>
                      <ul className="space-y-1 text-sm">
                        {analysis.blockers.map((issue) => (
                          <li key={issue.matrix_id} className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span className="text-red-900 font-medium">{issue.matrix_title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Expandable Details */}
              <button
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="w-full text-center py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 mb-6"
              >
                {showAllDetails ? '▼ Hide Details' : '▶ Show All Details'}
              </button>

              {showAllDetails && (
                <div className="bg-slate-50 rounded-lg p-6 space-y-3 max-h-96 overflow-y-auto">
                  {analysis.allIssues.map((issue) => (
                    <div key={issue.matrix_id} className="bg-white border border-slate-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500">{issue.matrix_id}</span>
                        {issue.triage?.urgency === 'CRITICAL_BLOCKER' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <h5 className="font-semibold text-slate-900 mb-2">{issue.matrix_title}</h5>
                      <p className="text-sm text-slate-700 mb-2">{issue.reasoning}</p>
                      {issue.actions_required?.[0] && (
                        <div className="text-xs bg-blue-50 border-l-2 border-blue-500 pl-3 py-2">
                          <strong>Action:</strong> {issue.actions_required[0].action}
                          <br />
                          <strong>Owner:</strong> {issue.actions_required[0].owner}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-emerald-600 mb-2">Perfect!</h3>
              <p className="text-slate-600">All criteria met. Ready for submission.</p>
            </div>
          )}
        </div>

        {/* Footer - Download Buttons */}
        <div className="border-t-2 border-slate-200 bg-slate-50 p-6">
          <div className="flex gap-4 justify-center items-center">
            {onSaveToClient && (
              <button
                onClick={onSaveToClient}
                className="px-6 py-3 border-2 border-slate-400 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                💾 Save to Client
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-lg rounded-lg transition-colors shadow-lg flex items-center gap-3"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Reports (2 PDFs)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 mt-3">
            Two documents: Client Gap Analysis + Consultant Action Plan
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleResultsView;
