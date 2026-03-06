/**
 * Quick Wins Section
 *
 * Displays AI-fixable issues that can be resolved in < 2 days
 * Allows bulk acceptance of quick wins
 */

import React, { useState } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface QuickWinsSectionProps {
  quickWins: AssessmentResult[];
  onAcceptAll?: () => void;
  onAcceptSingle?: (issueId: string) => void;
  onViewAll?: () => void;
}

export const QuickWinsSection: React.FC<QuickWinsSectionProps> = ({
  quickWins,
  onAcceptAll,
  onAcceptSingle,
  onViewAll
}) => {
  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(new Set());

  if (quickWins.length === 0) {
    return null;
  }

  const handleAcceptSingle = (issueId: string) => {
    setAcceptedItems(prev => new Set([...prev, issueId]));
    onAcceptSingle?.(issueId);
  };

  const handleAcceptAll = () => {
    const allIds = new Set(quickWins.map(qw => qw.matrix_id));
    setAcceptedItems(allIds);
    onAcceptAll?.();
  };

  const remainingCount = quickWins.length - acceptedItems.size;

  return (
    <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
            <span className="text-3xl" role="img" aria-label="Quick wins">
              ⚡
            </span>
            QUICK WINS
          </h2>
          <p className="text-sm text-emerald-700 mt-1">
            {quickWins.length} {quickWins.length === 1 ? 'issue' : 'issues'} can be fixed in less than 2 days each
          </p>
        </div>

        {/* Summary Badge */}
        <div className="bg-emerald-100 border border-emerald-500 rounded-full px-4 py-2">
          <span className="text-emerald-900 font-semibold">
            {remainingCount} remaining
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 text-emerald-800">
        <p className="text-sm">
          These items are AI-amendable or require minimal effort.
          Accept changes to automatically apply fixes or add to your report.
        </p>
      </div>

      {/* Bulk Accept Button */}
      {remainingCount > 0 && (
        <div className="mb-4">
          <button
            onClick={handleAcceptAll}
            className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>✓</span>
            Accept All {remainingCount} Quick Wins
          </button>
        </div>
      )}

      {/* Quick Wins List (Preview - first 5) */}
      <div className="space-y-2">
        {quickWins.slice(0, 5).map((quickWin) => {
          const isAccepted = acceptedItems.has(quickWin.matrix_id);

          return (
            <div
              key={quickWin.matrix_id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isAccepted
                  ? 'bg-emerald-100 border-emerald-400 opacity-60'
                  : 'bg-white border-emerald-300 hover:border-emerald-400'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-2 py-1 rounded ${
                    isAccepted ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {quickWin.matrix_id}
                  </span>
                  <span className={`text-sm ${isAccepted ? 'line-through text-emerald-700' : 'text-emerald-900'}`}>
                    {quickWin.matrix_title}
                  </span>
                </div>

                {/* Effort & Engagement Type */}
                <div className="flex items-center gap-3 mt-1 text-xs text-emerald-700">
                  {quickWin.effort_assessment && (
                    <span className="flex items-center gap-1">
                      ⚡ {quickWin.effort_assessment.level === 'QUICK_FIX' ? '< 1 day' : quickWin.effort_assessment.level}
                    </span>
                  )}
                  {quickWin.triage?.engagement_type === 'AI_AMENDABLE' && (
                    <span className="flex items-center gap-1">
                      🤖 AI-Fixable
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="ml-4">
                {isAccepted ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="text-xl">✓</span>
                    Accepted
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcceptSingle(quickWin.matrix_id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors"
                  >
                    Accept
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {quickWins.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={onViewAll}
            className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm underline"
          >
            View All {quickWins.length} Quick Wins →
          </button>
        </div>
      )}

      {/* Success Message */}
      {acceptedItems.size > 0 && (
        <div className="mt-4 p-3 bg-emerald-100 border border-emerald-400 rounded-lg">
          <p className="text-sm text-emerald-800">
            <strong>✓ {acceptedItems.size} {acceptedItems.size === 1 ? 'change' : 'changes'} accepted</strong>
            {remainingCount === 0 ?
              ' - All quick wins processed! These fixes will be applied to your documents.' :
              ` - ${remainingCount} quick ${remainingCount === 1 ? 'win' : 'wins'} remaining.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickWinsSection;
