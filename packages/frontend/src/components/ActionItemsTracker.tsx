/**
 * Action Items Tracker
 *
 * Track and manage remediation action items:
 * - View all action items
 * - Mark items as complete
 * - Assign to team members
 * - Filter by status/owner
 * - Track overall progress
 */

import React, { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface ActionItem {
  id: string;
  issueId: string;
  issueTitle: string;
  action: string;
  owner: string;
  effort: string;
  benefit: string;
  urgency: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  notes?: string;
  dueDate?: string;
}

interface ActionItemsTrackerProps {
  issues: AssessmentResult[];
  onActionUpdate?: (actionId: string, updates: Partial<ActionItem>) => void;
  onExport?: () => void;
}

export const ActionItemsTracker: React.FC<ActionItemsTrackerProps> = ({
  issues,
  onActionUpdate,
  onExport
}) => {
  // Generate action items from issues
  const allActionItems = useMemo((): ActionItem[] => {
    const items: ActionItem[] = [];

    issues.forEach(issue => {
      if (issue.actions_required && issue.actions_required.length > 0) {
        issue.actions_required.forEach((action, idx) => {
          items.push({
            id: `${issue.matrix_id}-${idx}`,
            issueId: issue.matrix_id,
            issueTitle: issue.matrix_title,
            action: action.action,
            owner: action.owner,
            effort: action.effort,
            benefit: action.expected_benefit,
            urgency: issue.triage?.urgency || 'MEDIUM_PRIORITY',
            status: 'pending'
          });
        });
      }
    });

    return items;
  }, [issues]);

  const [actionItems, setActionItems] = useState<ActionItem[]>(allActionItems);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'blocked'>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Get unique owners
  const owners = useMemo(() => {
    const uniqueOwners = new Set(actionItems.map(item => item.owner));
    return Array.from(uniqueOwners).sort();
  }, [actionItems]);

  // Filter action items
  const filteredItems = useMemo(() => {
    return actionItems.filter(item => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (filterOwner !== 'all' && item.owner !== filterOwner) return false;
      return true;
    });
  }, [actionItems, filterStatus, filterOwner]);

  // Calculate progress
  const progress = useMemo(() => {
    const total = actionItems.length;
    const completed = actionItems.filter(i => i.status === 'completed').length;
    const inProgress = actionItems.filter(i => i.status === 'in_progress').length;
    const blocked = actionItems.filter(i => i.status === 'blocked').length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      pending: total - completed - inProgress - blocked,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [actionItems]);

  // Handle status change
  const handleStatusChange = (itemId: string, newStatus: ActionItem['status']) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );
    onActionUpdate?.(itemId, { status: newStatus });
  };

  // Get urgency badge
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL_BLOCKER':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">🔴 CRITICAL</span>;
      case 'HIGH_PRIORITY':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">🟡 HIGH</span>;
      case 'MEDIUM_PRIORITY':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">🔵 MEDIUM</span>;
      case 'LOW_PRIORITY':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-800">⚪ LOW</span>;
      default:
        return null;
    }
  };

  // Get status badge
  const getStatusBadge = (status: ActionItem['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">✓ Complete</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">⚙️ In Progress</span>;
      case 'blocked':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">⛔ Blocked</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-800">⏳ Pending</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
              <span>✓</span>
              Action Items Tracker
            </h2>
            <p className="text-sm text-indigo-700 mt-1">
              Track remediation progress across all issues
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-indigo-900">{progress.percentage}%</div>
            <div className="text-sm text-indigo-700">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-indigo-200 rounded p-3">
            <div className="text-2xl font-bold text-slate-900">{progress.total}</div>
            <div className="text-xs text-slate-600">Total Items</div>
          </div>
          <div className="bg-white border border-blue-200 rounded p-3">
            <div className="text-2xl font-bold text-blue-600">{progress.inProgress}</div>
            <div className="text-xs text-blue-700">In Progress</div>
          </div>
          <div className="bg-white border border-green-200 rounded p-3">
            <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
            <div className="text-xs text-green-700">Completed</div>
          </div>
          <div className="bg-white border border-red-200 rounded p-3">
            <div className="text-2xl font-bold text-red-600">{progress.blocked}</div>
            <div className="text-xs text-red-700">Blocked</div>
          </div>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="bg-white border-2 border-slate-300 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All ({actionItems.length})</option>
                <option value="pending">Pending ({progress.pending})</option>
                <option value="in_progress">In Progress ({progress.inProgress})</option>
                <option value="completed">Completed ({progress.completed})</option>
                <option value="blocked">Blocked ({progress.blocked})</option>
              </select>
            </div>

            {/* Owner Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Owner</label>
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Owners</option>
                {owners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📄</span>
              Export Tracker
            </button>
          )}
        </div>
      </div>

      {/* Action Items List */}
      <div className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden">
        <div className="bg-slate-100 border-b-2 border-slate-300 px-4 py-3">
          <h3 className="font-bold text-slate-900">
            Action Items ({filteredItems.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              <p className="text-lg">No action items found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isExpanded = expandedItem === item.id;

              return (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Item Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-700 rounded">
                          {item.issueId}
                        </span>
                        {getUrgencyBadge(item.urgency)}
                        {getStatusBadge(item.status)}
                      </div>

                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        {item.action}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>👤 {item.owner}</span>
                        <span>⚡ {item.effort}</span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="bg-slate-50 border border-slate-200 rounded p-3">
                            <p className="font-semibold text-slate-900 mb-1">Issue:</p>
                            <p className="text-slate-700">{item.issueTitle}</p>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                            <p className="font-semibold text-emerald-900 mb-1">Expected Benefit:</p>
                            <p className="text-emerald-800">{item.benefit}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      {/* Status Dropdown */}
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                        className="px-3 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      >
                        {isExpanded ? '▲ Less' : '▼ More'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Update action item status as you make progress. Export the tracker to share with your team or include in reports.
        </p>
      </div>
    </div>
  );
};

export default ActionItemsTracker;
