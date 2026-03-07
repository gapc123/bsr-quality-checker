/**
 * Issue Detail Panel
 *
 * Contextual detail view for selected issue (no modal overlay)
 * Displays comprehensive information about a single assessment result
 * Replaces modal-based carousel detail view
 */

import React from 'react';
import type { AssessmentResult } from '../types/assessment';

interface IssueDetailPanelProps {
  issue: AssessmentResult | null;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({
  issue,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  if (!issue) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-lg mb-2">No issue selected</p>
          <p className="text-sm">Select an issue from the table to view details</p>
        </div>
      </div>
    );
  }

  // Get status styling
  const getStatusStyles = () => {
    switch (issue.status) {
      case 'meets':
        return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', badge: 'bg-green-100 text-green-800' };
      case 'partial':
        return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' };
      case 'does_not_meet':
        return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', badge: 'bg-red-100 text-red-800' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-900', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  const styles = getStatusStyles();

  // Get priority badge
  const getPriorityBadge = () => {
    const urgency = issue.triage?.urgency;
    switch (urgency) {
      case 'CRITICAL_BLOCKER':
        return <span className="px-3 py-1 text-sm font-semibold rounded bg-red-100 text-red-800">🔴 CRITICAL BLOCKER</span>;
      case 'HIGH_PRIORITY':
        return <span className="px-3 py-1 text-sm font-semibold rounded bg-amber-100 text-amber-800">🟡 HIGH PRIORITY</span>;
      case 'MEDIUM_PRIORITY':
        return <span className="px-3 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-800">🔵 MEDIUM PRIORITY</span>;
      case 'LOW_PRIORITY':
        return <span className="px-3 py-1 text-sm font-semibold rounded bg-slate-100 text-slate-800">⚪ LOW PRIORITY</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l-2 border-slate-300">
      {/* Header */}
      <div className={`${styles.bg} border-b-2 ${styles.border} p-4`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded">
                {issue.matrix_id}
              </span>
              {getPriorityBadge()}
              {issue.triage?.blocks_submission && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-600 text-white">
                  🚫 BLOCKS SUBMISSION
                </span>
              )}
              {issue.triage?.quick_win && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 text-white">
                  ⚡ QUICK WIN
                </span>
              )}
            </div>
            <h2 className={`text-xl font-bold ${styles.text}`}>
              {issue.matrix_title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {issue.category}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              aria-label="Close detail panel"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Buttons */}
        {(onNext || onPrevious) && (
          <div className="flex gap-2">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="px-3 py-1 text-sm font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="px-3 py-1 text-sm font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Status</h3>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded ${styles.badge}`}>
              {issue.status.toUpperCase().replace('_', ' ')}
            </span>
            <span className="px-3 py-1 text-sm font-semibold rounded bg-slate-100 text-slate-700">
              Severity: {issue.severity.toUpperCase()}
            </span>
          </div>
        </section>

        {/* Reasoning */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Assessment Reasoning</h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
            {issue.reasoning}
          </p>
        </section>

        {/* Success Definition */}
        {issue.success_definition && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Success Criteria</h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-blue-50 p-3 rounded border border-blue-200">
              {issue.success_definition}
            </p>
          </section>
        )}

        {/* Triage Assessment */}
        {issue.triage && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Triage Assessment</h3>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-600 font-medium">Action Type:</span>
                  <div className="text-indigo-900 font-semibold mt-1">
                    {issue.triage.action_type ? issue.triage.action_type.replace(/_/g, ' ') : 'Not specified'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Engagement:</span>
                  <div className="text-indigo-900 font-semibold mt-1">
                    {issue.triage.engagement_type.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Dependency:</span>
                  <div className="text-indigo-900 font-semibold mt-1">
                    {issue.triage.dependency_status ? issue.triage.dependency_status.replace(/_/g, ' ') : 'Independent'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Quick Win:</span>
                  <div className="text-indigo-900 font-semibold mt-1">
                    {issue.triage.quick_win ? '✓ Yes' : '✗ No'}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-indigo-200">
                <span className="text-slate-600 font-medium text-sm">Urgency Reasoning:</span>
                <p className="text-sm text-indigo-900 mt-1">
                  {issue.triage.urgency_reasoning}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Effort & Impact */}
        {(issue.effort_assessment || issue.cost_impact_assessment) && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Effort & Impact</h3>
            <div className="space-y-3">
              {issue.effort_assessment && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-emerald-900">Effort:</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">
                      {issue.effort_assessment.level}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-900">
                    {issue.effort_assessment.description}
                  </p>
                </div>
              )}

              {issue.cost_impact_assessment && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-amber-900">Cost Impact:</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                      {issue.cost_impact_assessment.impact}
                    </span>
                  </div>
                  <p className="text-sm text-amber-900">
                    {issue.cost_impact_assessment.description}
                  </p>
                  {issue.cost_impact_assessment.typical_range && (
                    <p className="text-xs text-amber-700 mt-1">
                      Typical range: {issue.cost_impact_assessment.typical_range}
                    </p>
                  )}
                </div>
              )}

              {issue.rejection_assessment && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-red-900">Rejection Risk:</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                      {issue.rejection_assessment.likelihood}
                    </span>
                  </div>
                  <p className="text-sm text-red-900">
                    {issue.rejection_assessment.reasoning}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Gaps Identified */}
        {issue.gaps_identified.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Gaps Identified</h3>
            <ul className="space-y-2">
              {issue.gaps_identified.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Actions Required */}
        {issue.actions_required.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Actions Required</h3>
            <div className="space-y-3">
              {issue.actions_required.map((action, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-blue-900">{action.owner}</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {action.effort}
                    </span>
                  </div>
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Action:</strong> {action.action}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Benefit:</strong> {action.expected_benefit}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Proposed Change */}
        {issue.proposed_change && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Proposed Change</h3>
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
              <p className="text-sm text-emerald-900 whitespace-pre-wrap">
                {issue.proposed_change}
              </p>
            </div>
          </section>
        )}

        {/* Evidence - Pack */}
        {issue.pack_evidence.found && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Pack Evidence</h3>
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-slate-600 font-medium">Document:</span>
                  <span className="text-slate-900 ml-2">{issue.pack_evidence.document}</span>
                </div>
                {issue.pack_evidence.page && (
                  <div>
                    <span className="text-slate-600 font-medium">Page:</span>
                    <span className="text-slate-900 ml-2">{issue.pack_evidence.page}</span>
                  </div>
                )}
                {issue.pack_evidence.quote && (
                  <div className="mt-2">
                    <span className="text-slate-600 font-medium">Quote:</span>
                    <p className="text-slate-700 italic mt-1 pl-3 border-l-2 border-slate-300">
                      "{issue.pack_evidence.quote}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Evidence - Reference */}
        {issue.reference_evidence.found && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Reference Evidence</h3>
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-slate-600 font-medium">Document:</span>
                  <span className="text-slate-900 ml-2">{issue.reference_evidence.doc_title}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Doc ID:</span>
                  <span className="text-slate-900 ml-2 font-mono text-xs">{issue.reference_evidence.doc_id}</span>
                </div>
                {issue.reference_evidence.page && (
                  <div>
                    <span className="text-slate-600 font-medium">Page:</span>
                    <span className="text-slate-900 ml-2">{issue.reference_evidence.page}</span>
                  </div>
                )}
                {issue.reference_evidence.quote && (
                  <div className="mt-2">
                    <span className="text-slate-600 font-medium">Quote:</span>
                    <p className="text-slate-700 italic mt-1 pl-3 border-l-2 border-slate-300">
                      "{issue.reference_evidence.quote}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Confidence */}
        {issue.confidence && (
          <section>
            <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">Confidence Assessment</h3>
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                  {issue.confidence.level}
                </span>
                <span className={`text-sm font-semibold ${issue.confidence.can_system_act ? 'text-green-600' : 'text-amber-600'}`}>
                  {issue.confidence.can_system_act ? '✓ System can act' : '⚠ Human review needed'}
                </span>
              </div>
              <p className="text-sm text-purple-900">
                {issue.confidence.reasoning}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default IssueDetailPanel;
