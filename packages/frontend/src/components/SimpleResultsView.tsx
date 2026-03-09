/**
 * SimpleResultsView - Multi-Screen Results Flow
 *
 * 5 screens for clear, focused review:
 * 1. Executive Summary - Overall status
 * 2. Critical Issues - Must-fix items (Rejection Risks + Missing Info)
 * 3. Review Items - Needs professional judgement
 * 4. Improvements - Lower priority enhancements
 * 5. Next Steps - Download report and save
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

type Screen = 'summary' | 'critical' | 'review' | 'improvements' | 'next-steps';

export const SimpleResultsView: React.FC<SimpleResultsViewProps> = ({
  assessment,
  onDownloadReport,
  onClose,
  onSaveToClient
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('summary');
  const [isDownloading, setIsDownloading] = useState(false);

  // Categorize all issues
  const categorizedIssues = useMemo(() => {
    const allIssues = assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );

    // REJECTION RISKS: Critical blockers
    const rejectionRisks = allIssues.filter(i =>
      i.triage?.urgency === 'CRITICAL_BLOCKER' ||
      i.triage?.blocks_submission ||
      i.severity === 'high'
    );

    // MISSING INFORMATION: TBC items
    const missingInfo = allIssues.filter(i => {
      const reasoning = i.reasoning?.toLowerCase() || '';
      const gaps = i.gaps_identified?.join(' ').toLowerCase() || '';
      return (
        reasoning.includes('missing') ||
        reasoning.includes('not provided') ||
        reasoning.includes('tbc') ||
        reasoning.includes('to be confirmed') ||
        gaps.includes('missing') ||
        gaps.includes('not provided')
      ) && !rejectionRisks.includes(i);
    });

    // REQUIRES CLARIFICATION: Low confidence or ambiguous
    const requiresClarification = allIssues.filter(i => {
      const isLowConfidence =
        i.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT' ||
        i.confidence?.can_system_act === false;
      const reasoning = i.reasoning?.toLowerCase() || '';
      const isAmbiguous =
        reasoning.includes('unclear') ||
        reasoning.includes('ambiguous') ||
        reasoning.includes('may not') ||
        reasoning.includes('insufficient');

      return (isLowConfidence || isAmbiguous) &&
        !rejectionRisks.includes(i) &&
        !missingInfo.includes(i);
    });

    // CAN BE ADDRESSED: Everything else
    const canBeAddressed = allIssues.filter(i =>
      !rejectionRisks.includes(i) &&
      !missingInfo.includes(i) &&
      !requiresClarification.includes(i)
    );

    return {
      rejectionRisks,
      missingInfo,
      requiresClarification,
      canBeAddressed,
      total: allIssues.length,
      criticalTotal: rejectionRisks.length + missingInfo.length
    };
  }, [assessment.results]);

  // Determine overall verdict
  const verdict = useMemo(() => {
    const { rejectionRisks, total } = categorizedIssues;

    if (rejectionRisks.length > 10 || total > 50) {
      return {
        level: 'RED' as const,
        icon: '🔴',
        title: 'High Risk of Rejection',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-900'
      };
    } else if (rejectionRisks.length > 0 || total > 20) {
      return {
        level: 'AMBER' as const,
        icon: '🟡',
        title: 'Moderate Risk',
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500',
        textColor: 'text-amber-900'
      };
    } else {
      return {
        level: 'GREEN' as const,
        icon: '🟢',
        title: 'Low Risk',
        color: 'emerald',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-900'
      };
    }
  }, [categorizedIssues]);

  const screens: { id: Screen; label: string; badge?: number }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'critical', label: 'Critical Issues', badge: categorizedIssues.criticalTotal },
    { id: 'review', label: 'Review Items', badge: categorizedIssues.requiresClarification.length },
    { id: 'improvements', label: 'Improvements', badge: categorizedIssues.canBeAddressed.length },
    { id: 'next-steps', label: 'Next Steps' }
  ];

  const currentIndex = screens.findIndex(s => s.id === currentScreen);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < screens.length - 1;

  const handleDownload = async () => {
    console.log('[SimpleResultsView] Download button clicked');
    setIsDownloading(true);
    try {
      const result = onDownloadReport();
      if (result instanceof Promise) {
        await result;
      }
      console.log('[SimpleResultsView] Download completed');
    } catch (error) {
      console.error('[SimpleResultsView] Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const IssueItem = ({ issue, showId = true }: { issue: AssessmentResult; showId?: boolean }) => (
    <div className="border-l-4 border-slate-300 pl-4 py-3 bg-white">
      {showId && <div className="text-xs font-mono text-slate-500 mb-1">{issue.matrix_id}</div>}
      <div className="font-semibold text-slate-900 mb-2">{issue.matrix_title}</div>
      <div className="text-sm text-slate-700 mb-2">{issue.reasoning}</div>
      {issue.actions_required?.[0] && (
        <div className="text-sm bg-blue-50 border-l-2 border-blue-500 pl-3 py-2 mt-2">
          <strong className="text-blue-900">Action:</strong>{' '}
          <span className="text-blue-800">{issue.actions_required[0].action}</span>
          <span className="text-blue-700 text-xs ml-2">
            ({issue.actions_required[0].owner})
          </span>
        </div>
      )}
    </div>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'summary':
        return (
          <div className="space-y-6">
            {/* Headline Verdict */}
            <div className={`${verdict.bgColor} border-l-4 ${verdict.borderColor} p-6 rounded-r-lg`}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">{verdict.icon}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${verdict.textColor}`}>
                    {verdict.title}
                  </h3>
                  <p className={`text-base ${verdict.textColor}`}>
                    {categorizedIssues.total} {categorizedIssues.total === 1 ? 'item requires' : 'items require'} attention before submission
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {assessment.results.filter(r => r.status === 'meets').length}
                </div>
                <div className="text-sm font-semibold text-emerald-900 mb-1">
                  ✅ Criteria Met
                </div>
                <div className="text-xs text-emerald-700">
                  {Math.round((assessment.results.filter(r => r.status === 'meets').length / assessment.results.length) * 100)}% compliant
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {categorizedIssues.total}
                </div>
                <div className="text-sm font-semibold text-red-900 mb-1">
                  ⚠️ Items to Address
                </div>
                <div className="text-xs text-red-700">
                  {categorizedIssues.rejectionRisks.length} critical blockers
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h4 className="font-semibold text-slate-900 mb-4">Issue Breakdown</h4>
              <div className="space-y-2">
                {categorizedIssues.rejectionRisks.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-700">🔴 Rejection Risks</span>
                    <span className="font-bold text-red-600">{categorizedIssues.rejectionRisks.length}</span>
                  </div>
                )}
                {categorizedIssues.missingInfo.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-700">🟠 Missing Information</span>
                    <span className="font-bold text-orange-600">{categorizedIssues.missingInfo.length}</span>
                  </div>
                )}
                {categorizedIssues.requiresClarification.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-700">🟣 Needs Clarification</span>
                    <span className="font-bold text-purple-600">{categorizedIssues.requiresClarification.length}</span>
                  </div>
                )}
                {categorizedIssues.canBeAddressed.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-700">🔵 Can Be Addressed</span>
                    <span className="font-bold text-blue-600">{categorizedIssues.canBeAddressed.length}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Navigate through the screens to review each category in detail, then download your compliance report.
              </p>
            </div>
          </div>
        );

      case 'critical':
        const criticalIssues = [...categorizedIssues.rejectionRisks, ...categorizedIssues.missingInfo];
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
              <h3 className="text-xl font-bold text-red-900 mb-2">
                🚨 Critical Issues ({criticalIssues.length})
              </h3>
              <p className="text-red-800">
                These items MUST be addressed before submission. They will likely cause rejection if not resolved.
              </p>
            </div>

            {categorizedIssues.rejectionRisks.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-900 mb-3">⚠️ Rejection Risks</h4>
                <div className="space-y-3">
                  {categorizedIssues.rejectionRisks.map((issue) => (
                    <IssueItem key={issue.matrix_id} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {categorizedIssues.missingInfo.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-900 mb-3">📋 Missing Information</h4>
                <div className="bg-orange-50 border border-orange-200 rounded p-4 mb-3">
                  <p className="text-sm font-semibold text-orange-900 mb-2">What to request:</p>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {categorizedIssues.missingInfo.slice(0, 5).map(issue => (
                      <li key={issue.matrix_id} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">•</span>
                        <span>{issue.matrix_title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  {categorizedIssues.missingInfo.map((issue) => (
                    <IssueItem key={issue.matrix_id} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {criticalIssues.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-emerald-900 font-semibold">No critical issues found!</p>
                <p className="text-sm text-emerald-700 mt-1">Your submission is in good shape.</p>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
              <h3 className="text-xl font-bold text-purple-900 mb-2">
                ❓ Review Items ({categorizedIssues.requiresClarification.length})
              </h3>
              <p className="text-purple-800">
                These items require professional judgement or have ambiguous information that should be clarified.
              </p>
            </div>

            {categorizedIssues.requiresClarification.length > 0 ? (
              <div className="space-y-3">
                {categorizedIssues.requiresClarification.map((issue) => (
                  <IssueItem key={issue.matrix_id} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-emerald-900 font-semibold">No items need clarification</p>
                <p className="text-sm text-emerald-700 mt-1">All requirements are clear.</p>
              </div>
            )}
          </div>
        );

      case 'improvements':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                ✨ Improvements ({categorizedIssues.canBeAddressed.length})
              </h3>
              <p className="text-blue-800">
                Lower priority items that can improve submission quality but are not critical for approval.
              </p>
            </div>

            {categorizedIssues.canBeAddressed.length > 0 ? (
              <div className="space-y-3">
                {categorizedIssues.canBeAddressed.map((issue) => (
                  <IssueItem key={issue.matrix_id} issue={issue} />
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-emerald-900 font-semibold">No improvements needed</p>
                <p className="text-sm text-emerald-700 mt-1">Submission quality is excellent.</p>
              </div>
            )}
          </div>
        );

      case 'next-steps':
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
              <h3 className="text-xl font-bold text-indigo-900 mb-2">
                📋 Next Steps
              </h3>
              <p className="text-indigo-800">
                Download your compliance report and save the assessment to continue working on it later.
              </p>
            </div>

            {/* Download Section */}
            <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-2">BSR Compliance Report</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Professional PDF report with all findings organized by priority. Ready to share with your team or submit to BSR.
                  </p>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Section */}
            {onSaveToClient && (
              <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">Save to Client</h4>
                    <p className="text-sm text-slate-600 mb-4">
                      Save this assessment to a client project to track progress and generate updated reports later.
                    </p>
                    <button
                      onClick={onSaveToClient}
                      className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Save Assessment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Checklist */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="font-semibold text-amber-900 mb-3">📝 Recommended Actions</h4>
              <ul className="space-y-2 text-sm text-amber-800">
                {categorizedIssues.rejectionRisks.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">1.</span>
                    <span><strong>Address {categorizedIssues.rejectionRisks.length} rejection {categorizedIssues.rejectionRisks.length === 1 ? 'risk' : 'risks'}</strong> immediately</span>
                  </li>
                )}
                {categorizedIssues.missingInfo.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">2.</span>
                    <span><strong>Request {categorizedIssues.missingInfo.length} missing {categorizedIssues.missingInfo.length === 1 ? 'item' : 'items'}</strong> from client/team</span>
                  </li>
                )}
                {categorizedIssues.requiresClarification.length > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">3.</span>
                    <span><strong>Review {categorizedIssues.requiresClarification.length} {categorizedIssues.requiresClarification.length === 1 ? 'item' : 'items'}</strong> with specialists</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">{categorizedIssues.total > 0 ? '4' : '1'}.</span>
                  <span><strong>Re-run assessment</strong> after updates to verify fixes</span>
                </li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-lg">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">BSR Compliance Assessment</h2>
              <p className="text-slate-300 text-sm mt-1">
                {assessment.results.length} criteria assessed • {categorizedIssues.total} {categorizedIssues.total === 1 ? 'issue' : 'issues'} identified
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Screen Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {screens.map((screen, idx) => (
              <button
                key={screen.id}
                onClick={() => setCurrentScreen(screen.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  currentScreen === screen.id
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {idx + 1}. {screen.label}
                {screen.badge !== undefined && screen.badge > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    currentScreen === screen.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-600 text-white'
                  }`}>
                    {screen.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderScreen()}
        </div>

        {/* Footer Navigation */}
        <div className="border-t-2 border-slate-300 bg-slate-50 p-4">
          <div className="flex gap-3 justify-between items-center">
            <button
              onClick={() => setCurrentScreen(screens[currentIndex - 1].id)}
              disabled={!canGoBack}
              className="px-6 py-2 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="text-sm text-slate-600">
              Screen {currentIndex + 1} of {screens.length}
            </div>

            <button
              onClick={() => setCurrentScreen(screens[currentIndex + 1].id)}
              disabled={!canGoNext}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleResultsView;
