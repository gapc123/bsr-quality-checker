/**
 * Issues Table
 *
 * Virtualized table for displaying assessment results
 * Replaces carousel with scannable, sortable table view
 * Features:
 * - Column sorting
 * - Row selection for bulk actions
 * - Click to view details
 * - Visual priority indicators
 */

import React, { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface IssuesTableProps {
  issues: AssessmentResult[];
  onRowClick?: (issue: AssessmentResult) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedIds?: string[];
}

type SortField = 'priority' | 'id' | 'title' | 'effort' | 'category';
type SortDirection = 'asc' | 'desc';

export const IssuesTable: React.FC<IssuesTableProps> = ({
  issues,
  onRowClick,
  onSelectionChange,
  selectedIds = []
}) => {
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort issues
  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'priority': {
          const priorityOrder = {
            'CRITICAL_BLOCKER': 4,
            'HIGH_PRIORITY': 3,
            'MEDIUM_PRIORITY': 2,
            'LOW_PRIORITY': 1
          };
          const aPriority = priorityOrder[a.triage?.urgency || 'LOW_PRIORITY'];
          const bPriority = priorityOrder[b.triage?.urgency || 'LOW_PRIORITY'];
          comparison = bPriority - aPriority;
          break;
        }
        case 'id':
          comparison = a.matrix_id.localeCompare(b.matrix_id);
          break;
        case 'title':
          comparison = a.matrix_title.localeCompare(b.matrix_title);
          break;
        case 'effort': {
          const effortOrder = {
            'QUICK_FIX': 1,
            'DAYS': 2,
            'WEEKS': 3,
            'MONTHS': 4
          };
          const aEffort = effortOrder[a.effort_assessment?.level || 'DAYS'];
          const bEffort = effortOrder[b.effort_assessment?.level || 'DAYS'];
          comparison = aEffort - bEffort;
          break;
        }
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [issues, sortField, sortDirection]);

  // Handle row selection
  const handleRowSelect = (issueId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = selectedIds.includes(issueId)
      ? selectedIds.filter(id => id !== issueId)
      : [...selectedIds, issueId];
    onSelectionChange?.(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === issues.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(issues.map(i => i.matrix_id));
    }
  };

  // Get priority badge
  const getPriorityBadge = (issue: AssessmentResult) => {
    const urgency = issue.triage?.urgency;

    switch (urgency) {
      case 'CRITICAL_BLOCKER':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
            🔴 CRITICAL
          </span>
        );
      case 'HIGH_PRIORITY':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
            🟡 HIGH
          </span>
        );
      case 'MEDIUM_PRIORITY':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
            🔵 MEDIUM
          </span>
        );
      case 'LOW_PRIORITY':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-800">
            ⚪ LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-600">
            —
          </span>
        );
    }
  };

  // Get effort badge
  const getEffortBadge = (issue: AssessmentResult) => {
    const effort = issue.effort_assessment?.level;

    switch (effort) {
      case 'QUICK_FIX':
        return <span className="text-emerald-600 font-semibold">⚡ &lt; 1 day</span>;
      case 'DAYS':
        return <span className="text-blue-600 font-semibold">📅 Days</span>;
      case 'WEEKS':
        return <span className="text-amber-600 font-semibold">📆 Weeks</span>;
      case 'MONTHS':
        return <span className="text-red-600 font-semibold">📊 Months</span>;
      default:
        return <span className="text-slate-500">—</span>;
    }
  };

  // Get action type badge
  const getActionTypeBadge = (issue: AssessmentResult) => {
    const engagement = issue.triage?.engagement_type;

    switch (engagement) {
      case 'AI_AMENDABLE':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            🤖 AI-Fix
          </span>
        );
      case 'SPECIALIST_REQUIRED':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            🎯 Specialist
          </span>
        );
      case 'INTERNAL_FIX':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
            🔧 Internal
          </span>
        );
      case 'CLIENT_INPUT':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-purple-50 text-purple-700 border border-purple-200">
            👤 Client
          </span>
        );
      default:
        return null;
    }
  };

  // Sort indicator
  const SortIndicator: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return <span className="text-slate-400 ml-1">⇅</span>;
    }
    return (
      <span className="text-slate-700 ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600">
        <p className="text-lg">No issues found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
            <tr>
              {/* Select All Checkbox */}
              {onSelectionChange && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === issues.length && issues.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    aria-label="Select all issues"
                  />
                </th>
              )}

              {/* Priority */}
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center">
                  Priority
                  <SortIndicator field="priority" />
                </div>
              </th>

              {/* ID */}
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center">
                  ID
                  <SortIndicator field="id" />
                </div>
              </th>

              {/* Title */}
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Issue Title
                  <SortIndicator field="title" />
                </div>
              </th>

              {/* Category */}
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  <SortIndicator field="category" />
                </div>
              </th>

              {/* Effort */}
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => handleSort('effort')}
              >
                <div className="flex items-center">
                  Effort
                  <SortIndicator field="effort" />
                </div>
              </th>

              {/* Action Type */}
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                Action Type
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {sortedIssues.map((issue) => {
              const isSelected = selectedIds.includes(issue.matrix_id);
              const isBlocker = issue.triage?.blocks_submission;
              const isQuickWin = issue.triage?.quick_win;

              return (
                <tr
                  key={issue.matrix_id}
                  onClick={() => onRowClick?.(issue)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50'
                      : 'hover:bg-slate-50'
                  } ${isBlocker ? 'border-l-4 border-l-red-500' : ''}`}
                >
                  {/* Checkbox */}
                  {onSelectionChange && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(issue.matrix_id, e as any)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={`Select ${issue.matrix_id}`}
                      />
                    </td>
                  )}

                  {/* Priority */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getPriorityBadge(issue)}
                  </td>

                  {/* ID */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-700 rounded">
                        {issue.matrix_id}
                      </span>
                      {isBlocker && (
                        <span title="Blocks submission" className="text-red-600">
                          🚫
                        </span>
                      )}
                      {isQuickWin && (
                        <span title="Quick win" className="text-emerald-600">
                          ⚡
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {issue.matrix_title}
                      </div>
                      {issue.gaps_identified.length > 0 && (
                        <div className="text-xs text-slate-600 truncate mt-1">
                          {issue.gaps_identified[0]}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-slate-700">
                      {issue.category}
                    </span>
                  </td>

                  {/* Effort */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {getEffortBadge(issue)}
                  </td>

                  {/* Action Type */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getActionTypeBadge(issue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="bg-slate-50 border-t border-slate-300 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <div>
            Showing <strong>{sortedIssues.length}</strong> {sortedIssues.length === 1 ? 'issue' : 'issues'}
            {selectedIds.length > 0 && (
              <span className="ml-2">
                • <strong>{selectedIds.length}</strong> selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded"></span>
              <span>Blocker</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>Quick Win</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuesTable;
