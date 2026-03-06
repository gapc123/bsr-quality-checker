/**
 * Specialist Actions Card
 *
 * Groups issues by specialist type for easy delegation
 * Allows generating engagement briefs for each specialist
 */

import React, { useState } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface SpecialistGroup {
  specialist: string;
  issues: AssessmentResult[];
  totalEffort: string;
  criticalCount: number;
}

interface SpecialistActionsCardProps {
  results: AssessmentResult[];
  onGenerateBrief?: (specialist: string, issues: AssessmentResult[]) => void;
  onAssignTasks?: (specialist: string, issues: AssessmentResult[]) => void;
  onViewIssues?: (issues: AssessmentResult[]) => void;
}

export const SpecialistActionsCard: React.FC<SpecialistActionsCardProps> = ({
  results,
  onGenerateBrief,
  onAssignTasks,
  onViewIssues
}) => {
  const [expandedSpecialist, setExpandedSpecialist] = useState<string | null>(null);

  // Group issues by specialist
  const specialistGroups = React.useMemo(() => {
    const groups: Record<string, AssessmentResult[]> = {};

    results.forEach((result) => {
      if (result.status === 'meets') return; // Skip passed criteria

      // Determine specialist from actions_required or triage
      const actions = result.actions_required || [];
      if (actions.length === 0) return;

      const owner = actions[0].owner?.toLowerCase() || '';
      let specialist = 'Other';

      if (owner.includes('fire')) {
        specialist = 'Fire Safety Engineer';
      } else if (owner.includes('structural')) {
        specialist = 'Structural Engineer';
      } else if (owner.includes('mep') || owner.includes('m&e')) {
        specialist = 'MEP Consultant';
      } else if (owner.includes('architect')) {
        specialist = 'Architect';
      } else if (owner.includes('client')) {
        specialist = 'Client Input';
      }

      if (!groups[specialist]) {
        groups[specialist] = [];
      }
      groups[specialist].push(result);
    });

    // Convert to array and calculate metrics
    return Object.entries(groups).map(([specialist, issues]): SpecialistGroup => {
      const criticalCount = issues.filter(i => i.triage?.urgency === 'CRITICAL_BLOCKER').length;

      // Estimate total effort (simplified)
      const hasMonths = issues.some(i => i.effort_assessment?.level === 'MONTHS');
      const hasWeeks = issues.some(i => i.effort_assessment?.level === 'WEEKS');
      const totalEffort = hasMonths ? '1-3 months' : hasWeeks ? '2-6 weeks' : '1-2 weeks';

      return {
        specialist,
        issues,
        totalEffort,
        criticalCount
      };
    }).sort((a, b) => b.criticalCount - a.criticalCount); // Sort by critical count
  }, [results]);

  if (specialistGroups.length === 0) {
    return null;
  }

  const getSpecialistIcon = (specialist: string) => {
    if (specialist.includes('Fire')) return '🔥';
    if (specialist.includes('Structural')) return '🏗️';
    if (specialist.includes('MEP')) return '⚡';
    if (specialist.includes('Architect')) return '📐';
    if (specialist.includes('Client')) return '👤';
    return '🔧';
  };

  const getUrgencyColor = (criticalCount: number) => {
    if (criticalCount > 0) return 'text-red-600';
    return 'text-amber-600';
  };

  return (
    <div className="rounded-lg border-2 border-indigo-500 bg-indigo-50 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
          <span className="text-3xl" role="img" aria-label="Specialist actions">
            🎯
          </span>
          SPECIALIST ACTIONS REQUIRED
        </h2>
        <p className="text-sm text-indigo-700 mt-1">
          {specialistGroups.length} {specialistGroups.length === 1 ? 'specialist' : 'specialists'} needed for remediation work
        </p>
      </div>

      {/* Specialist Groups */}
      <div className="space-y-3">
        {specialistGroups.map((group) => {
          const isExpanded = expandedSpecialist === group.specialist;

          return (
            <div
              key={group.specialist}
              className="bg-white border-2 border-indigo-300 rounded-lg overflow-hidden"
            >
              {/* Group Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl" role="img">
                        {getSpecialistIcon(group.specialist)}
                      </span>
                      <h3 className="text-lg font-bold text-indigo-900">
                        {group.specialist}
                      </h3>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                        {group.issues.length} {group.issues.length === 1 ? 'issue' : 'issues'}
                      </span>
                    </div>

                    {/* Summary Info */}
                    <div className="flex flex-wrap gap-3 text-sm text-indigo-700">
                      {group.criticalCount > 0 && (
                        <span className={`font-semibold ${getUrgencyColor(group.criticalCount)}`}>
                          • Critical: {group.criticalCount}
                        </span>
                      )}
                      <span>
                        • Estimated: {group.totalEffort}
                      </span>
                    </div>

                    {/* Top Issue Preview */}
                    {!isExpanded && group.issues.length > 0 && (
                      <div className="mt-2 text-sm text-indigo-600">
                        <strong>Top issue:</strong> {group.issues[0].matrix_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {onGenerateBrief && (
                    <button
                      onClick={() => onGenerateBrief(group.specialist, group.issues)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded transition-colors"
                    >
                      Generate Brief
                    </button>
                  )}
                  {onAssignTasks && (
                    <button
                      onClick={() => onAssignTasks(group.specialist, group.issues)}
                      className="px-4 py-2 bg-white hover:bg-indigo-50 border-2 border-indigo-600 text-indigo-600 text-sm font-semibold rounded transition-colors"
                    >
                      Assign Tasks
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedSpecialist(isExpanded ? null : group.specialist)}
                    className="px-4 py-2 bg-white hover:bg-indigo-50 border-2 border-indigo-300 text-indigo-700 text-sm font-semibold rounded transition-colors"
                  >
                    {isExpanded ? 'Hide' : 'View'} Issues ({group.issues.length})
                  </button>
                </div>
              </div>

              {/* Expanded Issues List */}
              {isExpanded && (
                <div className="border-t-2 border-indigo-200 bg-indigo-25 p-4">
                  <div className="space-y-2">
                    {group.issues.map((issue) => (
                      <div
                        key={issue.matrix_id}
                        className="bg-white border border-indigo-200 rounded p-3 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                                {issue.matrix_id}
                              </span>
                              {issue.triage?.urgency === 'CRITICAL_BLOCKER' && (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 font-semibold rounded">
                                  🔴 CRITICAL
                                </span>
                              )}
                              {issue.triage?.urgency === 'HIGH_PRIORITY' && (
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 font-semibold rounded">
                                  🟡 HIGH
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-indigo-900 font-medium">
                              {issue.matrix_title}
                            </div>
                            {issue.effort_assessment && (
                              <div className="text-xs text-indigo-600 mt-1">
                                Effort: {issue.effort_assessment.level}
                              </div>
                            )}
                          </div>
                          {onViewIssues && (
                            <button
                              onClick={() => onViewIssues([issue])}
                              className="ml-2 px-3 py-1 text-indigo-600 hover:bg-indigo-50 text-sm rounded transition-colors"
                            >
                              Details →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-indigo-100 border border-indigo-300 rounded-lg">
        <p className="text-sm text-indigo-800">
          <strong>💡 Tip:</strong> Generate briefs to get ready-to-send emails with scope,
          deliverables, and timeline for each specialist.
        </p>
      </div>
    </div>
  );
};

export default SpecialistActionsCard;
