/**
 * Submission Decision Gate Card
 *
 * Displays RED/AMBER/GREEN submission readiness with clear reasoning
 * Uses backend submission gate analysis from triage-analyzer
 */

import React from 'react';
import type { SubmissionGate } from '../types/assessment';

interface SubmissionGateCardProps {
  gate: SubmissionGate;
  onViewBlockers?: () => void;
  onViewAllIssues?: () => void;
}

export const SubmissionGateCard: React.FC<SubmissionGateCardProps> = ({
  gate,
  onViewBlockers,
  onViewAllIssues
}) => {
  const getGateStyles = () => {
    switch (gate.gate_status) {
      case 'GREEN':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          iconColor: 'text-green-600',
          icon: '✅',
          textColor: 'text-green-900'
        };
      case 'AMBER':
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-500',
          iconColor: 'text-amber-600',
          icon: '⚠️',
          textColor: 'text-amber-900'
        };
      case 'RED':
      default:
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          iconColor: 'text-red-600',
          icon: '🚨',
          textColor: 'text-red-900'
        };
    }
  };

  const styles = getGateStyles();

  return (
    <div
      className={`rounded-lg border-2 ${styles.borderColor} ${styles.bgColor} p-6 shadow-sm`}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold ${styles.textColor} flex items-center gap-2`}>
            <span className="text-3xl" role="img" aria-label={gate.gate_status}>
              {styles.icon}
            </span>
            SUBMISSION DECISION GATE
          </h2>
          <p className={`text-sm ${styles.textColor} opacity-80 mt-1`}>
            Based on comprehensive assessment of {gate.blockers_count + gate.high_priority_count} critical items
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${styles.textColor} ${styles.bgColor} border ${styles.borderColor}`}>
          {gate.gate_status}: {gate.can_submit ? 'READY TO SUBMIT' : 'DO NOT SUBMIT YET'}
        </span>
      </div>

      {/* Recommendation */}
      <div className={`text-lg ${styles.textColor} mb-4 leading-relaxed`}>
        {gate.recommendation}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded ${styles.bgColor} border ${styles.borderColor}`}>
          <div className={`text-3xl font-bold ${styles.textColor}`}>
            {gate.blockers_count}
          </div>
          <div className={`text-sm ${styles.textColor} opacity-80`}>
            Critical Blockers
          </div>
        </div>
        <div className={`p-3 rounded ${styles.bgColor} border ${styles.borderColor}`}>
          <div className={`text-3xl font-bold ${styles.textColor}`}>
            {gate.high_priority_count}
          </div>
          <div className={`text-sm ${styles.textColor} opacity-80`}>
            High Priority Issues
          </div>
        </div>
      </div>

      {/* Blocking Issues List */}
      {gate.blocking_issues && gate.blocking_issues.length > 0 && (
        <div className="mb-4">
          <h3 className={`font-semibold ${styles.textColor} mb-2`}>
            Blocking Issues:
          </h3>
          <ul className={`list-disc list-inside ${styles.textColor} space-y-1`}>
            {gate.blocking_issues.slice(0, 5).map((issueId) => (
              <li key={issueId} className="text-sm">
                {issueId}
              </li>
            ))}
            {gate.blocking_issues.length > 5 && (
              <li className="text-sm font-semibold">
                + {gate.blocking_issues.length - 5} more blockers
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {gate.blockers_count > 0 && onViewBlockers && (
          <button
            onClick={onViewBlockers}
            className={`px-4 py-2 rounded font-semibold ${styles.textColor} bg-white border-2 ${styles.borderColor} hover:bg-opacity-80 transition-colors`}
          >
            View Blockers ({gate.blockers_count})
          </button>
        )}
        {onViewAllIssues && (
          <button
            onClick={onViewAllIssues}
            className={`px-4 py-2 rounded font-semibold ${styles.textColor} bg-white border-2 ${styles.borderColor} hover:bg-opacity-80 transition-colors`}
          >
            View All Issues
          </button>
        )}
      </div>

      {/* Help Text */}
      {gate.gate_status === 'RED' && (
        <div className="mt-4 pt-4 border-t border-red-300">
          <p className="text-sm text-red-700">
            <strong>What this means:</strong> Submitting now will result in immediate BSR rejection.
            Fix critical blockers before proceeding with submission.
          </p>
        </div>
      )}

      {gate.gate_status === 'AMBER' && (
        <div className="mt-4 pt-4 border-t border-amber-300">
          <p className="text-sm text-amber-700">
            <strong>What this means:</strong> You can submit but expect queries from BSR.
            Consider fixing high priority issues to avoid delays in approval process.
          </p>
        </div>
      )}

      {gate.gate_status === 'GREEN' && (
        <div className="mt-4 pt-4 border-t border-green-300">
          <p className="text-sm text-green-700">
            <strong>What this means:</strong> Your submission pack meets BSR requirements for Gateway 2.
            You're ready to proceed with submission.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubmissionGateCard;
