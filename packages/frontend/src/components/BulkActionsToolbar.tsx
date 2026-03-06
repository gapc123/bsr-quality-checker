/**
 * Bulk Actions Toolbar
 *
 * Appears when issues are selected in the table
 * Provides bulk operations: accept quick wins, generate briefs, export, etc.
 */

import React, { useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface BulkActionsToolbarProps {
  selectedIssues: AssessmentResult[];
  onAcceptQuickWins?: () => void;
  onGenerateBrief?: () => void;
  onExportSelection?: () => void;
  onMarkReviewed?: () => void;
  onClearSelection?: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedIssues,
  onAcceptQuickWins,
  onGenerateBrief,
  onExportSelection,
  onMarkReviewed,
  onClearSelection
}) => {
  // Calculate selection metrics
  const metrics = useMemo(() => {
    const quickWinCount = selectedIssues.filter(i => i.triage?.quick_win).length;
    const blockerCount = selectedIssues.filter(i => i.triage?.blocks_submission).length;
    const criticalCount = selectedIssues.filter(i => i.triage?.urgency === 'CRITICAL_BLOCKER').length;
    const specialistCount = selectedIssues.filter(i => i.triage?.engagement_type === 'SPECIALIST_REQUIRED').length;
    const aiAmendableCount = selectedIssues.filter(i => i.triage?.engagement_type === 'AI_AMENDABLE').length;

    return {
      total: selectedIssues.length,
      quickWinCount,
      blockerCount,
      criticalCount,
      specialistCount,
      aiAmendableCount
    };
  }, [selectedIssues]);

  if (metrics.total === 0) {
    return null;
  }

  return (
    <div className="bg-indigo-600 text-white shadow-lg rounded-lg border-2 border-indigo-700">
      <div className="px-4 py-3">
        {/* Selection Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{metrics.total}</span>
              <span className="text-sm">
                {metrics.total === 1 ? 'issue' : 'issues'} selected
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 text-sm border-l border-indigo-400 pl-4">
              {metrics.criticalCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold">
                    🔴 {metrics.criticalCount}
                  </span>
                  Critical
                </span>
              )}
              {metrics.blockerCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">
                    🚫 {metrics.blockerCount}
                  </span>
                  Blocker{metrics.blockerCount > 1 ? 's' : ''}
                </span>
              )}
              {metrics.quickWinCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-emerald-500 text-white rounded text-xs font-semibold">
                    ⚡ {metrics.quickWinCount}
                  </span>
                  Quick Win{metrics.quickWinCount > 1 ? 's' : ''}
                </span>
              )}
              {metrics.aiAmendableCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-semibold">
                    🤖 {metrics.aiAmendableCount}
                  </span>
                  AI-Fixable
                </span>
              )}
              {metrics.specialistCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-semibold">
                    🎯 {metrics.specialistCount}
                  </span>
                  Specialist{metrics.specialistCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Clear Selection */}
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="p-2 hover:bg-indigo-700 rounded transition-colors"
              aria-label="Clear selection"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Accept Quick Wins */}
          {metrics.quickWinCount > 0 && onAcceptQuickWins && (
            <button
              onClick={onAcceptQuickWins}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded transition-colors shadow-sm flex items-center gap-2"
            >
              <span>⚡</span>
              Accept {metrics.quickWinCount} Quick Win{metrics.quickWinCount > 1 ? 's' : ''}
            </button>
          )}

          {/* Generate Brief */}
          {metrics.specialistCount > 0 && onGenerateBrief && (
            <button
              onClick={onGenerateBrief}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded transition-colors shadow-sm flex items-center gap-2"
            >
              <span>📋</span>
              Generate Brief
            </button>
          )}

          {/* Export Selection */}
          {onExportSelection && (
            <button
              onClick={onExportSelection}
              className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 font-semibold rounded transition-colors shadow-sm flex items-center gap-2"
            >
              <span>📄</span>
              Export Selection
            </button>
          )}

          {/* Mark Reviewed */}
          {onMarkReviewed && (
            <button
              onClick={onMarkReviewed}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded transition-colors shadow-sm flex items-center gap-2"
            >
              <span>✓</span>
              Mark Reviewed
            </button>
          )}
        </div>

        {/* Contextual Help */}
        {metrics.quickWinCount > 0 && metrics.quickWinCount === metrics.total && (
          <div className="mt-3 p-2 bg-emerald-500 bg-opacity-20 border border-emerald-400 rounded text-sm">
            <strong>💡 All selected issues are quick wins!</strong> Accept them to apply automatic fixes.
          </div>
        )}

        {metrics.blockerCount > 0 && (
          <div className="mt-3 p-2 bg-red-500 bg-opacity-20 border border-red-400 rounded text-sm">
            <strong>⚠️ {metrics.blockerCount} blocker{metrics.blockerCount > 1 ? 's' : ''} selected.</strong> These must be resolved before submission.
          </div>
        )}

        {metrics.specialistCount === metrics.total && metrics.total > 1 && (
          <div className="mt-3 p-2 bg-purple-500 bg-opacity-20 border border-purple-400 rounded text-sm">
            <strong>🎯 All selected issues require specialists.</strong> Generate a brief for easy delegation.
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
