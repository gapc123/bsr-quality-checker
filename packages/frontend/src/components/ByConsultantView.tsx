/**
 * By Consultant View
 *
 * Groups issues by specialist/consultant type for easy delegation
 * Shows which specialist needs to address which issues
 *
 * UI Fix 4: "By Consultant" grouped view
 */

import React, { useState, useMemo } from 'react';
import { TargetIcon, CircleDotIcon, ZapIcon } from './Icons';
import type { AssessmentResult } from '../types/assessment';

interface ByConsultantViewProps {
  issues: AssessmentResult[];
  onViewIssue?: (issue: AssessmentResult) => void;
  onGenerateBrief?: (specialist: string, issues: AssessmentResult[]) => void;
}

export const ByConsultantView: React.FC<ByConsultantViewProps> = ({
  issues,
  onViewIssue,
  onGenerateBrief
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));

  // Group issues by category/specialist type
  const groupedIssues = useMemo(() => {
    const groups: Record<string, AssessmentResult[]> = {};

    issues.forEach(issue => {
      const category = issue.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
    });

    // Sort groups by number of issues (descending)
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, AssessmentResult[]>);
  }, [issues]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Map categories to consultant types
  const getCategoryInfo = (category: string) => {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes('fire')) {
      return {
        specialist: 'Fire Safety Engineer',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-900'
      };
    } else if (lowerCategory.includes('structural')) {
      return {
        specialist: 'Structural Engineer',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-900'
      };
    } else if (lowerCategory.includes('mep') || lowerCategory.includes('mechanical') || lowerCategory.includes('electrical')) {
      return {
        specialist: 'MEP Engineer',
        color: 'amber',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-900'
      };
    } else if (lowerCategory.includes('architect')) {
      return {
        specialist: 'Architect',
        color: 'purple',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-900'
      };
    } else if (lowerCategory.includes('environmental')) {
      return {
        specialist: 'Environmental Consultant',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-900'
      };
    } else {
      return {
        specialist: category,
        color: 'slate',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-300',
        textColor: 'text-slate-900'
      };
    }
  };

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border-2 border-slate-300 bg-white p-12 text-center">
        <p className="text-slate-600 text-lg">No issues requiring specialist attention</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border-2 border-purple-300 bg-purple-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <TargetIcon size={20} color="#9333ea" />
              Issues Grouped by Specialist
            </h3>
            <p className="text-sm text-purple-700 mt-1">
              {Object.keys(groupedIssues).length} specialist categories • {issues.length} total issues
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Issues */}
      <div className="space-y-3">
        {Object.entries(groupedIssues).map(([category, categoryIssues]) => {
          const isExpanded = expandedGroups.has(category);
          const info = getCategoryInfo(category);
          const criticalCount = categoryIssues.filter(i => i.triage?.urgency === 'CRITICAL_BLOCKER').length;
          const quickWinCount = categoryIssues.filter(i => i.triage?.quick_win).length;

          return (
            <div
              key={category}
              className={`rounded-lg border-2 ${info.borderColor} ${info.bgColor} overflow-hidden`}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(category)}
                className={`w-full p-4 text-left flex items-center justify-between hover:opacity-80 transition-opacity ${info.bgColor}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className={`text-lg font-bold ${info.textColor}`}>
                      {info.specialist}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${info.bgColor} border ${info.borderColor} ${info.textColor}`}>
                      {categoryIssues.length} {categoryIssues.length === 1 ? 'issue' : 'issues'}
                    </span>
                    {criticalCount > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                        <CircleDotIcon size={8} color="#dc2626" />
                        {criticalCount} critical
                      </span>
                    )}
                    {quickWinCount > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <ZapIcon size={10} color="#059669" />
                        {quickWinCount} quick win{quickWinCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${info.textColor} opacity-75 mt-1`}>
                    {category}
                  </p>
                </div>
                <div className="ml-4">
                  <svg
                    className={`w-6 h-6 ${info.textColor} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="border-t-2 border-current">
                  {/* Action Row */}
                  {onGenerateBrief && (
                    <div className="p-3 bg-white border-b border-current">
                      <button
                        onClick={() => onGenerateBrief(info.specialist, categoryIssues)}
                        className={`px-4 py-2 bg-${info.color}-600 hover:bg-${info.color}-700 text-white text-sm font-semibold rounded transition-colors`}
                        style={{
                          backgroundColor: `var(--${info.color})`,
                        }}
                      >
                        Generate Engagement Brief ({categoryIssues.length} issues)
                      </button>
                    </div>
                  )}

                  {/* Issues List */}
                  <div className="bg-white">
                    {categoryIssues.map((issue, idx) => (
                      <div
                        key={issue.matrix_id}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                          idx !== categoryIssues.length - 1 ? 'border-b border-slate-200' : ''
                        }`}
                        onClick={() => onViewIssue?.(issue)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-700 rounded">
                                {issue.matrix_id}
                              </span>
                              {issue.triage?.urgency === 'CRITICAL_BLOCKER' && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 flex items-center gap-1">
                                  <CircleDotIcon size={8} color="#dc2626" />
                                  CRITICAL
                                </span>
                              )}
                              {issue.triage?.quick_win && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <ZapIcon size={10} color="#059669" />
                                  Quick Win
                                </span>
                              )}
                            </div>
                            <div className="text-base font-semibold text-slate-900 mb-1">
                              {issue.matrix_title}
                            </div>
                            {issue.reasoning && (
                              <div className="text-sm text-slate-600 line-clamp-2">
                                {issue.reasoning}
                              </div>
                            )}
                          </div>
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
    </div>
  );
};

export default ByConsultantView;
