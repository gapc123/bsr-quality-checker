/**
 * Results Dashboard
 *
 * Main dashboard showing assessment results with:
 * - Submission gate decision
 * - Quick wins
 * - Specialist actions
 * - Filterable issues table
 *
 * Replaces carousel-first approach with dashboard-first
 */

import React, { useState, useMemo } from 'react';
import SubmissionGateCard from './SubmissionGateCard';
import QuickWinsSection from './QuickWinsSection';
import SpecialistActionsCard from './SpecialistActionsCard';
import IssuesTable from './IssuesTable';
import IssueDetailPanel from './IssueDetailPanel';
import BulkActionsToolbar from './BulkActionsToolbar';
import EngagementBriefGenerator from './EngagementBriefGenerator';
import EngagementBriefModal from './EngagementBriefModal';
import ExportOptionsModal from './ExportOptionsModal';
import ActionItemsTracker from './ActionItemsTracker';
import DocumentRevisionDashboard from './DocumentRevisionDashboard';
import TrackChangesViewer from './TrackChangesViewer';
import HumanReviewTable from './HumanReviewTable';
import type { AssessmentResult, SubmissionGate, FullAssessment, EngagementBrief } from '../types/assessment';

interface ResultsDashboardProps {
  assessment: FullAssessment;
  submissionGate?: SubmissionGate;
  onGenerateBrief?: (specialist: string, issues: AssessmentResult[]) => void;
  onExportReport?: () => void;
  onViewIssue?: (issue: AssessmentResult) => void;
}

type FilterType = 'all' | 'blockers' | 'quick_wins' | 'specialist';

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  assessment,
  submissionGate,
  onGenerateBrief,
  onExportReport,
  onViewIssue
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [_acceptedQuickWins, setAcceptedQuickWins] = useState<Set<string>>(new Set());
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [viewedIssue, setViewedIssue] = useState<AssessmentResult | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Stage 4: Action-oriented outputs state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<EngagementBrief | null>(null);
  const [briefSpecialist, setBriefSpecialist] = useState<string>('');
  const [briefIssues, setBriefIssues] = useState<AssessmentResult[]>([]);
  const [showActionTracker, setShowActionTracker] = useState(false);

  // Stage 4B: Document revision state
  const [showRevisionDashboard, setShowRevisionDashboard] = useState(false);
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [revisionDocument, setRevisionDocument] = useState<string>('');
  const [revisionIssues, setRevisionIssues] = useState<AssessmentResult[]>([]);

  // Human review state
  const [showHumanReview, setShowHumanReview] = useState(false);

  // Calculate metrics
  const { results } = assessment;

  const failedResults = useMemo(() =>
    results.filter(r => r.status === 'does_not_meet' || r.status === 'partial'),
    [results]
  );

  const quickWins = useMemo(() =>
    failedResults.filter(r => r.triage?.quick_win),
    [failedResults]
  );

  const blockers = useMemo(() =>
    failedResults.filter(r => r.triage?.blocks_submission),
    [failedResults]
  );

  const criticalIssues = useMemo(() =>
    failedResults.filter(r => r.triage?.urgency === 'CRITICAL_BLOCKER'),
    [failedResults]
  );

  const highPriorityIssues = useMemo(() =>
    failedResults.filter(r => r.triage?.urgency === 'HIGH_PRIORITY'),
    [failedResults]
  );

  // Filter results based on active filter
  const filteredResults = useMemo(() => {
    switch (activeFilter) {
      case 'blockers':
        return blockers;
      case 'quick_wins':
        return quickWins;
      case 'specialist':
        return failedResults.filter(r => r.triage?.engagement_type === 'SPECIALIST_REQUIRED');
      default:
        return failedResults;
    }
  }, [activeFilter, blockers, quickWins, failedResults]);

  // Handlers
  const handleAcceptAllQuickWins = () => {
    const allIds = new Set(quickWins.map(qw => qw.matrix_id));
    setAcceptedQuickWins(allIds);
    // TODO: Call backend to apply changes
    console.log('Accepting all quick wins:', allIds);
  };

  const handleAcceptQuickWin = (issueId: string) => {
    setAcceptedQuickWins(prev => new Set([...prev, issueId]));
    // TODO: Call backend to apply change
    console.log('Accepting quick win:', issueId);
  };

  const handleViewBlockers = () => {
    setActiveFilter('blockers');
    // Scroll to issues table
    document.getElementById('issues-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewAllIssues = () => {
    setActiveFilter('all');
    document.getElementById('issues-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Table handlers
  const handleRowClick = (issue: AssessmentResult) => {
    setViewedIssue(issue);
    setShowDetailPanel(true);
    onViewIssue?.(issue);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedIssueIds(selectedIds);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setViewedIssue(null);
  };

  const handleNextIssue = () => {
    if (!viewedIssue) return;
    const currentIndex = filteredResults.findIndex(i => i.matrix_id === viewedIssue.matrix_id);
    if (currentIndex < filteredResults.length - 1) {
      const nextIssue = filteredResults[currentIndex + 1];
      setViewedIssue(nextIssue);
      onViewIssue?.(nextIssue);
    }
  };

  const handlePreviousIssue = () => {
    if (!viewedIssue) return;
    const currentIndex = filteredResults.findIndex(i => i.matrix_id === viewedIssue.matrix_id);
    if (currentIndex > 0) {
      const previousIssue = filteredResults[currentIndex - 1];
      setViewedIssue(previousIssue);
      onViewIssue?.(previousIssue);
    }
  };

  const hasNextIssue = useMemo(() => {
    if (!viewedIssue) return false;
    const currentIndex = filteredResults.findIndex(i => i.matrix_id === viewedIssue.matrix_id);
    return currentIndex < filteredResults.length - 1;
  }, [viewedIssue, filteredResults]);

  const hasPreviousIssue = useMemo(() => {
    if (!viewedIssue) return false;
    const currentIndex = filteredResults.findIndex(i => i.matrix_id === viewedIssue.matrix_id);
    return currentIndex > 0;
  }, [viewedIssue, filteredResults]);

  // Bulk action handlers
  const selectedIssues = useMemo(() => {
    return filteredResults.filter(issue => selectedIssueIds.includes(issue.matrix_id));
  }, [filteredResults, selectedIssueIds]);

  const handleBulkAcceptQuickWins = () => {
    const quickWinIds = selectedIssues
      .filter(i => i.triage?.quick_win)
      .map(i => i.matrix_id);
    setAcceptedQuickWins(prev => new Set([...prev, ...quickWinIds]));
    // TODO: Call backend to apply changes
    console.log('Bulk accepting quick wins:', quickWinIds);
    setSelectedIssueIds([]);
  };

  const handleBulkGenerateBrief = () => {
    // Group selected specialist issues
    const specialistIssues = selectedIssues.filter(i => i.triage?.engagement_type === 'SPECIALIST_REQUIRED');
    if (specialistIssues.length > 0 && onGenerateBrief) {
      onGenerateBrief('Multiple Specialists', specialistIssues);
    }
    setSelectedIssueIds([]);
  };

  const handleBulkExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting selected issues:', selectedIssues);
  };

  const handleBulkMarkReviewed = () => {
    // TODO: Implement mark reviewed functionality
    console.log('Marking as reviewed:', selectedIssueIds);
    setSelectedIssueIds([]);
  };

  const handleClearSelection = () => {
    setSelectedIssueIds([]);
  };

  // Stage 4: Action-oriented handlers
  const handleGenerateBriefClick = (specialist: string, issues: AssessmentResult[]) => {
    setBriefSpecialist(specialist);
    setBriefIssues(issues);
    // Brief will be generated by EngagementBriefGenerator
    setShowBriefModal(true);
    onGenerateBrief?.(specialist, issues);
  };

  const handleBriefGenerated = (brief: EngagementBrief) => {
    setCurrentBrief(brief);
  };

  const handleSendBrief = (brief: EngagementBrief) => {
    // TODO: Implement email sending
    console.log('Sending brief:', brief);
    alert(`Brief for ${brief.specialist_type} ready to send!\n\nIn production, this would open your email client with the brief pre-filled.`);
  };

  const handleExportBrief = (brief: EngagementBrief) => {
    // TODO: Implement PDF export
    console.log('Exporting brief:', brief);
    alert(`Exporting brief for ${brief.specialist_type} as PDF...`);
  };

  const handleExport = (format: string, options: any) => {
    // TODO: Implement export functionality
    console.log('Exporting:', format, options);
    alert(`Exporting ${format} with options...`);
    setShowExportModal(false);
  };

  const handleOpenExportModal = () => {
    setShowExportModal(true);
    onExportReport?.();
  };

  // Stage 4B: Document revision handlers
  const handleViewRevisions = () => {
    setShowRevisionDashboard(!showRevisionDashboard);
  };

  const handleViewChanges = (documentName: string, issues: AssessmentResult[]) => {
    setRevisionDocument(documentName);
    setRevisionIssues(issues);
    setShowTrackChanges(true);
  };

  const handleGenerateRevisions = (documentName: string, issues: AssessmentResult[]) => {
    console.log('Generating revisions for:', documentName);
    alert(`Generating revised ${documentName} with ${issues.length} changes...\n\nIn production, this would generate a DOCX with track changes.`);
  };

  const handleBulkGenerateRevisions = (documentNames: string[]) => {
    console.log('Bulk generating revisions for:', documentNames);
    alert(`Generating ${documentNames.length} revised documents with track changes...\n\nIn production, this would generate a ZIP file with all DOCXs.`);
  };

  const handleExportWithTrackChanges = (changes: any[]) => {
    console.log('Exporting with track changes:', changes);
    alert(`Exporting ${revisionDocument} with ${changes.filter(c => c.status === 'accepted').length} accepted changes...\n\nIn production, this would generate a branded DOCX with Microsoft Word track changes.`);
  };

  // Human review handlers
  const handleExportHumanReviewPdf = async () => {
    try {
      // TODO: Replace with actual API call
      console.log('Exporting Human Review PDF...');

      // In production:
      // const response = await fetch(`/api/packs/${packId}/versions/${versionId}/export/human-review`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ groupBy: 'urgency', includeAppendices: true })
      // });
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `Human-Review-Required-${assessment.pack_context.buildingType}.pdf`;
      // a.click();

      alert('Human Review PDF export initiated!\n\nThis PDF will contain only items requiring professional judgment, formatted for specialist review and sign-off.');
    } catch (error) {
      console.error('Failed to export Human Review PDF:', error);
      alert('Failed to export Human Review PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Submission Gate */}
      {submissionGate && (
        <SubmissionGateCard
          gate={submissionGate}
          onViewBlockers={handleViewBlockers}
          onViewAllIssues={handleViewAllIssues}
        />
      )}

      {/* Assessment Summary Card */}
      <div className="rounded-lg border-2 border-slate-300 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="text-3xl">📊</span>
          ASSESSMENT SUMMARY
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Readiness Score */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-3xl font-bold text-slate-900">
              {assessment.readiness_score}/100
            </div>
            <div className="text-sm text-slate-600">Readiness Score</div>
          </div>

          {/* Issues Breakdown */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-red-600 font-semibold">🔴 Critical:</span>
                <span className="text-red-600 font-bold">{criticalIssues.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-600 font-semibold">🟡 High:</span>
                <span className="text-amber-600 font-bold">{highPriorityIssues.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">🟢 Medium/Low:</span>
                <span className="text-slate-600 font-bold">
                  {failedResults.length - criticalIssues.length - highPriorityIssues.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 font-semibold">⚡ Quick Wins:</span>
                <span className="text-emerald-600 font-bold">{quickWins.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-600 font-semibold">🎯 Specialists:</span>
                <span className="text-indigo-600 font-bold">
                  {failedResults.filter(r => r.triage?.engagement_type === 'SPECIALIST_REQUIRED').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleViewRevisions}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            📝 {showRevisionDashboard ? 'Hide' : 'View'} Document Revisions
          </button>
          <button
            onClick={() => setShowHumanReview(!showHumanReview)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            🔴 {showHumanReview ? 'Hide' : 'View'} Human Review Required
          </button>
          <button
            onClick={() => setShowActionTracker(!showActionTracker)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            ✓ {showActionTracker ? 'Hide' : 'View'} Action Tracker
          </button>
          <button
            onClick={handleOpenExportModal}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            📄 Export Report
          </button>
          <button
            onClick={() => setActiveFilter('quick_wins')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            ⚡ Quick Wins ({quickWins.length})
          </button>
        </div>
      </div>

      {/* Document Revision Dashboard */}
      {showRevisionDashboard && (
        <DocumentRevisionDashboard
          issues={failedResults}
          onViewChanges={handleViewChanges}
          onGenerateRevisions={handleGenerateRevisions}
          onBulkGenerate={handleBulkGenerateRevisions}
        />
      )}

      {/* Action Items Tracker */}
      {showActionTracker && (
        <ActionItemsTracker
          issues={failedResults}
          onExport={() => setShowExportModal(true)}
        />
      )}

      {/* Human Review Table */}
      {showHumanReview && (
        <HumanReviewTable
          issues={results}
          onExportPdf={handleExportHumanReviewPdf}
        />
      )}

      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <QuickWinsSection
          quickWins={quickWins}
          onAcceptAll={handleAcceptAllQuickWins}
          onAcceptSingle={handleAcceptQuickWin}
          onViewAll={() => setActiveFilter('quick_wins')}
        />
      )}

      {/* Specialist Actions */}
      <SpecialistActionsCard
        results={results}
        onGenerateBrief={handleGenerateBriefClick}
        onViewIssues={(issues) => {
          if (issues.length > 0 && onViewIssue) {
            onViewIssue(issues[0]);
          }
        }}
      />

      {/* Issues Section Anchor */}
      <div id="issues-section" className="scroll-mt-4">
        {/* Bulk Actions Toolbar */}
        {selectedIssueIds.length > 0 && (
          <div className="mb-4">
            <BulkActionsToolbar
              selectedIssues={selectedIssues}
              onAcceptQuickWins={handleBulkAcceptQuickWins}
              onGenerateBrief={handleBulkGenerateBrief}
              onExportSelection={handleBulkExport}
              onMarkReviewed={handleBulkMarkReviewed}
              onClearSelection={handleClearSelection}
            />
          </div>
        )}

        {/* Issues Table & Detail Panel Container */}
        <div className="rounded-lg border-2 border-slate-300 bg-white shadow-sm overflow-hidden">
          {/* Header with Filters */}
          <div className="bg-white border-b-2 border-slate-300 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                📋 ALL ISSUES ({filteredResults.length} items)
              </h2>

              {/* Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({failedResults.length})
                </button>
                <button
                  onClick={() => setActiveFilter('blockers')}
                  className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                    activeFilter === 'blockers'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Blockers ({blockers.length})
                </button>
                <button
                  onClick={() => setActiveFilter('quick_wins')}
                  className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                    activeFilter === 'quick_wins'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Quick Wins ({quickWins.length})
                </button>
                <button
                  onClick={() => setActiveFilter('specialist')}
                  className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                    activeFilter === 'specialist'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Specialists
                </button>
              </div>
            </div>
          </div>

          {/* Table + Detail Panel Layout */}
          <div className="flex">
            {/* Issues Table */}
            <div className={`${showDetailPanel ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
              <IssuesTable
                issues={filteredResults}
                onRowClick={handleRowClick}
                onSelectionChange={handleSelectionChange}
                selectedIds={selectedIssueIds}
              />
            </div>

            {/* Detail Panel (slides in from right) */}
            {showDetailPanel && (
              <div className="w-1/3 min-w-[400px] h-[600px] overflow-hidden">
                <IssueDetailPanel
                  issue={viewedIssue}
                  onClose={handleCloseDetailPanel}
                  onNext={handleNextIssue}
                  onPrevious={handlePreviousIssue}
                  hasNext={hasNextIssue}
                  hasPrevious={hasPreviousIssue}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage 4: Modals */}
      {/* Brief Generator (hidden component that generates brief data) */}
      {showBriefModal && briefIssues.length > 0 && (
        <EngagementBriefGenerator
          specialist={briefSpecialist}
          issues={briefIssues}
          projectName={assessment.pack_context.buildingType || 'Your Project'}
          onBriefGenerated={handleBriefGenerated}
        />
      )}

      {/* Engagement Brief Modal */}
      <EngagementBriefModal
        brief={currentBrief}
        isOpen={showBriefModal}
        onClose={() => setShowBriefModal(false)}
        onSend={handleSendBrief}
        onExport={handleExportBrief}
        projectName={assessment.pack_context.buildingType || 'Your Project'}
      />

      {/* Export Options Modal */}
      <ExportOptionsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        assessment={assessment}
        submissionGate={submissionGate}
      />

      {/* Stage 4B: Track Changes Viewer */}
      {showTrackChanges && revisionIssues.length > 0 && (
        <TrackChangesViewer
          documentName={revisionDocument}
          issues={revisionIssues}
          onClose={() => setShowTrackChanges(false)}
          onExportWithChanges={handleExportWithTrackChanges}
        />
      )}
    </div>
  );
};

export default ResultsDashboard;
