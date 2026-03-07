/**
 * Mobile Dashboard View
 *
 * Simplified, mobile-optimized version of the main dashboard
 * Uses cards, bottom navigation, and swipe gestures
 * Optimized for touch interaction and small screens
 */

import React, { useState } from 'react';
import { useResponsive } from './ResponsiveContainer';
import { MobileNavigationBar, MobileActionMenu, MobileFilterPills, TouchableCard } from './MobileNavigationBar';
import { useA11y } from './AccessibilityEnhancements';
import type { AssessmentResult, SubmissionGate, FullAssessment } from '../types/assessment';

interface MobileDashboardViewProps {
  assessment: FullAssessment;
  submissionGate?: SubmissionGate;
  onIssueSelect?: (issue: AssessmentResult) => void;
  onExport?: () => void;
  onGenerateBrief?: (specialist: string, issues: AssessmentResult[]) => void;
}

type MobileView = 'overview' | 'issues' | 'actions' | 'reports';

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  assessment,
  submissionGate,
  onIssueSelect,
  onExport
}) => {
  const { isMobile } = useResponsive();
  const { announce } = useA11y();

  const [activeView, setActiveView] = useState<MobileView>('overview');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'critical' | 'high' | 'quick_wins'>('all');

  if (!isMobile) {
    return null; // Desktop uses normal dashboard
  }

  const { results } = assessment;
  const failedResults = results.filter(r => r.status === 'does_not_meet' || r.status === 'partial');

  const criticalIssues = failedResults.filter(r => r.triage?.urgency === 'CRITICAL_BLOCKER');
  const highPriorityIssues = failedResults.filter(r => r.triage?.urgency === 'HIGH_PRIORITY');
  const quickWins = failedResults.filter(r => r.triage?.quick_win);

  // Filter issues based on active filter
  const filteredIssues = React.useMemo(() => {
    switch (issueFilter) {
      case 'critical':
        return criticalIssues;
      case 'high':
        return highPriorityIssues;
      case 'quick_wins':
        return quickWins;
      default:
        return failedResults;
    }
  }, [issueFilter, criticalIssues, highPriorityIssues, quickWins, failedResults]);

  const handleViewChange = (view: MobileView) => {
    setActiveView(view);
    announce(`Switched to ${view} view`, 'polite');
  };

  const handleIssueSelect = (issue: AssessmentResult) => {
    onIssueSelect?.(issue);
    announce(`Viewing issue ${issue.matrix_id}: ${issue.matrix_title}`, 'polite');
  };

  // Navigation items
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      badge: undefined,
      onClick: () => handleViewChange('overview')
    },
    {
      id: 'issues',
      label: 'Issues',
      icon: '📋',
      badge: failedResults.length,
      onClick: () => handleViewChange('issues')
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: '✓',
      badge: quickWins.length,
      onClick: () => handleViewChange('actions')
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📄',
      badge: undefined,
      onClick: () => handleViewChange('reports')
    }
  ];

  // Action menu items
  const actionMenuItems = [
    {
      id: 'export',
      label: 'Export Report',
      icon: '📄',
      description: 'Generate PDF or Excel report',
      onClick: () => onExport?.(),
      variant: 'primary' as const
    },
    {
      id: 'generate_briefs',
      label: 'Generate Briefs',
      icon: '📋',
      description: 'Create specialist engagement briefs',
      onClick: () => {
        announce('Opening brief generator', 'polite');
      },
      variant: 'default' as const
    },
    {
      id: 'accept_quick_wins',
      label: 'Accept Quick Wins',
      icon: '⚡',
      description: `Accept ${quickWins.length} quick fix items`,
      onClick: () => {
        announce(`Accepting ${quickWins.length} quick wins`, 'assertive');
      },
      variant: 'success' as const
    }
  ];

  // Render Overview
  const renderOverview = () => (
    <div className="space-y-4 pb-20">
      {/* Submission Gate */}
      {submissionGate && (
        <TouchableCard
          className={`rounded-lg border-2 p-4 ${
            submissionGate.gate_status === 'RED'
              ? 'bg-red-50 border-red-500'
              : submissionGate.gate_status === 'AMBER'
              ? 'bg-amber-50 border-amber-500'
              : 'bg-green-50 border-green-500'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="text-2xl">
                  {submissionGate.gate_status === 'RED' ? '🚨' : submissionGate.gate_status === 'AMBER' ? '⚠️' : '✅'}
                </span>
                Submission Gate
              </h2>
              <p className="text-sm mt-1 font-semibold">
                {submissionGate.gate_status}: {submissionGate.can_submit ? 'Ready' : 'Not Ready'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white bg-opacity-70 rounded p-2">
              <div className="text-xl font-bold">{submissionGate.blockers_count}</div>
              <div className="text-xs">Critical</div>
            </div>
            <div className="bg-white bg-opacity-70 rounded p-2">
              <div className="text-xl font-bold">{submissionGate.high_priority_count}</div>
              <div className="text-xs">High Priority</div>
            </div>
          </div>

          <p className="text-sm">{submissionGate.recommendation}</p>
        </TouchableCard>
      )}

      {/* Quick Stats */}
      <div className="bg-white rounded-lg border-2 border-slate-300 p-4">
        <h3 className="font-bold text-lg mb-3">Assessment Summary</h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{assessment.readiness_score}</div>
            <div className="text-xs text-slate-600">Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalIssues.length}</div>
            <div className="text-xs text-red-700">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{quickWins.length}</div>
            <div className="text-xs text-emerald-700">Quick Wins</div>
          </div>
        </div>

        <button
          onClick={() => setShowActionMenu(true)}
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
        >
          Quick Actions
        </button>
      </div>

      {/* Quick Wins Preview */}
      {quickWins.length > 0 && (
        <div className="bg-emerald-50 rounded-lg border-2 border-emerald-500 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Quick Wins
            </h3>
            <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
              {quickWins.length}
            </span>
          </div>
          <p className="text-sm text-emerald-800 mb-3">
            {quickWins.length} issues can be fixed in &lt; 2 days each
          </p>
          <button
            onClick={() => handleViewChange('actions')}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            View All Quick Wins →
          </button>
        </div>
      )}
    </div>
  );

  // Render Issues List
  const renderIssues = () => (
    <div className="space-y-4 pb-20">
      {/* Filters */}
      <MobileFilterPills
        filters={[
          { id: 'all', label: 'All', count: failedResults.length },
          { id: 'critical', label: 'Critical', count: criticalIssues.length },
          { id: 'high', label: 'High', count: highPriorityIssues.length },
          { id: 'quick_wins', label: 'Quick Wins', count: quickWins.length }
        ]}
        activeFilter={issueFilter}
        onFilterChange={(id) => setIssueFilter(id as any)}
      />

      {/* Issues List */}
      <div className="space-y-2">
        {filteredIssues.map((issue) => (
          <TouchableCard
            key={issue.matrix_id}
            onTap={() => handleIssueSelect(issue)}
            className="bg-white rounded-lg border-2 border-slate-300 p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-700 rounded">
                {issue.matrix_id}
              </span>
              {issue.triage?.urgency === 'CRITICAL_BLOCKER' && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                  🔴 CRITICAL
                </span>
              )}
              {issue.triage?.urgency === 'HIGH_PRIORITY' && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                  🟡 HIGH
                </span>
              )}
            </div>

            <h4 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">
              {issue.matrix_title}
            </h4>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              {issue.triage?.quick_win && <span className="text-emerald-600">⚡ Quick Win</span>}
              {issue.effort_assessment && (
                <span>• {issue.effort_assessment.level}</span>
              )}
            </div>
          </TouchableCard>
        ))}

        {filteredIssues.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <p>No {issueFilter !== 'all' ? issueFilter : ''} issues found</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Actions View
  const renderActions = () => (
    <div className="space-y-4 pb-20">
      <div className="bg-white rounded-lg border-2 border-slate-300 p-4">
        <h3 className="font-bold text-lg mb-3">Quick Actions</h3>

        {actionMenuItems.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`w-full flex items-center gap-3 p-3 mb-2 border-2 rounded-lg transition-colors ${
              action.variant === 'primary'
                ? 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100'
                : action.variant === 'success'
                ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span className="text-2xl">{action.icon}</span>
            <div className="flex-1 text-left">
              <div className="font-semibold">{action.label}</div>
              {action.description && (
                <div className="text-xs text-slate-600">{action.description}</div>
              )}
            </div>
            <span className="text-slate-400">→</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Render Reports View
  const renderReports = () => (
    <div className="space-y-4 pb-20">
      <div className="bg-white rounded-lg border-2 border-slate-300 p-4">
        <h3 className="font-bold text-lg mb-3">Export Options</h3>
        <p className="text-sm text-slate-600 mb-4">
          Generate reports and briefs for your team
        </p>

        <button
          onClick={onExport}
          className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors mb-2"
        >
          📄 Export Full Report
        </button>

        <button
          onClick={() => announce('Feature coming soon', 'polite')}
          className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
        >
          📝 Generate Document Revisions
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-slate-300 p-4 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-slate-900">Assessment Results</h1>
        <p className="text-sm text-slate-600">
          {assessment.assessment_date ? new Date(assessment.assessment_date).toLocaleDateString() : 'Recent'}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'issues' && renderIssues()}
        {activeView === 'actions' && renderActions()}
        {activeView === 'reports' && renderReports()}
      </div>

      {/* Bottom Navigation */}
      <MobileNavigationBar items={navItems} activeItem={activeView} />

      {/* Action Menu */}
      <MobileActionMenu
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        title="Quick Actions"
        actions={actionMenuItems}
      />
    </div>
  );
};

export default MobileDashboardView;
