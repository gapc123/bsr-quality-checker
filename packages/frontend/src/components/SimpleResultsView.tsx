/**
 * SimpleResultsView - Immediately Clear Results Display
 *
 * Optimized for time-pressured consultants who need to instantly understand:
 * - What's wrong?
 * - What's missing?
 * - What do I do next?
 *
 * Priority order:
 * 1. Rejection Risks (blockers, critical issues)
 * 2. Missing Information (what to request from client)
 * 3. Requires Clarification (ambiguous/uncertain areas)
 * 4. Can Be Addressed (lower priority items)
 * 5. Next Actions (clear steps)
 */

import React, { useMemo } from 'react';
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

export const SimpleResultsView: React.FC<SimpleResultsViewProps> = ({
  assessment,
  onDownloadReport,
  onClose,
  onSaveToClient
}) => {
  // Categorize all issues
  const categorizedIssues = useMemo(() => {
    const allIssues = assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );

    // 1. REJECTION RISKS: Critical issues that block submission
    const rejectionRisks = allIssues.filter(i =>
      i.triage?.urgency === 'CRITICAL_BLOCKER' ||
      i.triage?.blocks_submission ||
      i.severity === 'high'
    );

    // 2. MISSING INFORMATION: Issues with missing/TBC content
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

    // 3. REQUIRES CLARIFICATION: Low confidence or ambiguous
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

    // 4. CAN BE ADDRESSED: Everything else (medium/low priority)
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
      total: allIssues.length
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
        textColor: 'text-red-900',
        message: `This submission has ${rejectionRisks.length} critical ${rejectionRisks.length === 1 ? 'issue' : 'issues'} that will likely result in rejection if not resolved.`
      };
    } else if (rejectionRisks.length > 0 || total > 20) {
      return {
        level: 'AMBER' as const,
        icon: '🟡',
        title: 'Moderate Risk - Requires Attention',
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500',
        textColor: 'text-amber-900',
        message: `This submission has ${total} ${total === 1 ? 'issue' : 'issues'} that should be addressed before submission.`
      };
    } else {
      return {
        level: 'GREEN' as const,
        icon: '🟢',
        title: 'Low Risk - Minor Issues Only',
        color: 'emerald',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500',
        textColor: 'text-emerald-900',
        message: `This submission is in good shape with only ${total} minor ${total === 1 ? 'issue' : 'issues'}.`
      };
    }
  }, [categorizedIssues]);

  const IssueItem = ({ issue, showId = true }: { issue: AssessmentResult; showId?: boolean }) => (
    <div className="border-l-4 border-slate-300 pl-4 py-2">
      {showId && <div className="text-xs font-mono text-slate-500 mb-1">{issue.matrix_id}</div>}
      <div className="font-semibold text-slate-900 mb-1">{issue.matrix_title}</div>
      <div className="text-sm text-slate-700 mb-2">{issue.reasoning}</div>
      {issue.actions_required?.[0] && (
        <div className="text-sm bg-blue-50 border-l-2 border-blue-500 pl-3 py-1">
          <strong className="text-blue-900">Action needed:</strong>{' '}
          <span className="text-blue-800">{issue.actions_required[0].action}</span>
          {' '}
          <span className="text-blue-700 text-xs">
            (Owner: {issue.actions_required[0].owner})
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-lg">
        {/* Header */}
        <div className="bg-slate-800 text-white p-6">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* HEADLINE VERDICT */}
          <div className={`${verdict.bgColor} border-l-4 ${verdict.borderColor} p-6 rounded-r-lg`}>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{verdict.icon}</div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${verdict.textColor}`}>
                  {verdict.title}
                </h3>
                <p className={`text-base ${verdict.textColor}`}>
                  {verdict.message}
                </p>
              </div>
            </div>
          </div>

          {/* 1. REJECTION RISKS */}
          {categorizedIssues.rejectionRisks.length > 0 && (
            <div className="border-2 border-red-500 rounded-lg overflow-hidden">
              <div className="bg-red-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>REJECTION RISKS</span>
                  <span className="ml-auto bg-red-700 px-3 py-1 rounded-full text-sm">
                    {categorizedIssues.rejectionRisks.length}
                  </span>
                </h3>
                <p className="text-red-100 text-sm mt-1">
                  Critical issues that will likely cause rejection if not resolved
                </p>
              </div>
              <div className="p-6 bg-red-50 space-y-4">
                {categorizedIssues.rejectionRisks.map((issue, idx) => (
                  <div key={issue.matrix_id}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <IssueItem issue={issue} showId={false} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. MISSING INFORMATION */}
          {categorizedIssues.missingInfo.length > 0 && (
            <div className="border-2 border-orange-500 rounded-lg overflow-hidden">
              <div className="bg-orange-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>📋</span>
                  <span>MISSING INFORMATION</span>
                  <span className="ml-auto bg-orange-700 px-3 py-1 rounded-full text-sm">
                    {categorizedIssues.missingInfo.length}
                  </span>
                </h3>
                <p className="text-orange-100 text-sm mt-1">
                  Information that needs to be requested from the client or team
                </p>
              </div>
              <div className="p-6 bg-orange-50 space-y-4">
                <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
                  <p className="text-sm font-semibold text-orange-900 mb-2">
                    What to ask for:
                  </p>
                  <ul className="text-sm text-orange-800 space-y-1">
                    {categorizedIssues.missingInfo.slice(0, 5).map(issue => (
                      <li key={issue.matrix_id} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">•</span>
                        <span>{issue.matrix_title}</span>
                      </li>
                    ))}
                    {categorizedIssues.missingInfo.length > 5 && (
                      <li className="text-orange-700 italic">
                        ...and {categorizedIssues.missingInfo.length - 5} more items
                      </li>
                    )}
                  </ul>
                </div>
                {categorizedIssues.missingInfo.map(issue => (
                  <IssueItem key={issue.matrix_id} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* 3. REQUIRES CLARIFICATION */}
          {categorizedIssues.requiresClarification.length > 0 && (
            <div className="border-2 border-purple-500 rounded-lg overflow-hidden">
              <div className="bg-purple-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>❓</span>
                  <span>REQUIRES CLARIFICATION</span>
                  <span className="ml-auto bg-purple-700 px-3 py-1 rounded-full text-sm">
                    {categorizedIssues.requiresClarification.length}
                  </span>
                </h3>
                <p className="text-purple-100 text-sm mt-1">
                  Areas where evidence is unclear or may require expert review
                </p>
              </div>
              <div className="p-6 bg-purple-50 space-y-4">
                {categorizedIssues.requiresClarification.map(issue => (
                  <IssueItem key={issue.matrix_id} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* 4. CAN BE ADDRESSED */}
          {categorizedIssues.canBeAddressed.length > 0 && (
            <div className="border-2 border-blue-300 rounded-lg overflow-hidden">
              <div className="bg-blue-500 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>✓</span>
                  <span>CAN BE ADDRESSED</span>
                  <span className="ml-auto bg-blue-600 px-3 py-1 rounded-full text-sm">
                    {categorizedIssues.canBeAddressed.length}
                  </span>
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Lower priority items that can be resolved with standard processes
                </p>
              </div>
              <div className="p-6 bg-blue-50 space-y-4">
                {categorizedIssues.canBeAddressed.map(issue => (
                  <IssueItem key={issue.matrix_id} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* NEXT ACTIONS */}
          <div className="bg-slate-100 border-2 border-slate-400 rounded-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>→</span>
              <span>NEXT ACTIONS</span>
            </h3>
            <div className="space-y-3">
              {categorizedIssues.rejectionRisks.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-slate-800">
                    <strong className="text-slate-900">Address {categorizedIssues.rejectionRisks.length} critical {categorizedIssues.rejectionRisks.length === 1 ? 'issue' : 'issues'}</strong> immediately to avoid rejection
                  </p>
                </div>
              )}
              {categorizedIssues.missingInfo.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {categorizedIssues.rejectionRisks.length > 0 ? '2' : '1'}
                  </div>
                  <p className="text-sm text-slate-800">
                    <strong className="text-slate-900">Request {categorizedIssues.missingInfo.length} missing {categorizedIssues.missingInfo.length === 1 ? 'item' : 'items'}</strong> from client/team
                  </p>
                </div>
              )}
              {categorizedIssues.requiresClarification.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {(categorizedIssues.rejectionRisks.length > 0 ? 1 : 0) + (categorizedIssues.missingInfo.length > 0 ? 1 : 0) + 1}
                  </div>
                  <p className="text-sm text-slate-800">
                    <strong className="text-slate-900">Review {categorizedIssues.requiresClarification.length} ambiguous {categorizedIssues.requiresClarification.length === 1 ? 'area' : 'areas'}</strong> with relevant specialists
                  </p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {[
                    categorizedIssues.rejectionRisks.length > 0,
                    categorizedIssues.missingInfo.length > 0,
                    categorizedIssues.requiresClarification.length > 0
                  ].filter(Boolean).length + 1}
                </div>
                <p className="text-sm text-slate-800">
                  <strong className="text-slate-900">Download compliance report</strong> for detailed findings and action items
                </p>
              </div>
            </div>
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
