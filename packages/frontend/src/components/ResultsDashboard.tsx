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
import ByConsultantView from './ByConsultantView';
import { useToast } from './Toast';
import { BarChartIcon, CircleDotIcon, ZapIcon, TargetIcon, PencilIcon, AlertCircleIcon, CheckIcon, ClipboardIcon, FileTextIcon } from './Icons';
import type { AssessmentResult, SubmissionGate, FullAssessment, EngagementBrief } from '../types/assessment';
import * as exportService from '../services/exportService';

interface ResultsDashboardProps {
  assessment: FullAssessment;
  submissionGate?: SubmissionGate;
  onGenerateBrief?: (specialist: string, issues: AssessmentResult[]) => void;
  onExportReport?: () => void;
  onViewIssue?: (issue: AssessmentResult) => void;
}

type FilterType = 'all' | 'blockers' | 'quick_wins' | 'specialist';

type ViewTab = 'overview' | 'by-consultant' | 'revisions' | 'human-review' | 'action-tracker';

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  assessment,
  submissionGate,
  onGenerateBrief,
  onExportReport,
  onViewIssue
}) => {
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
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

  // Stage 4B: Document revision state
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [revisionDocument, setRevisionDocument] = useState<string>('');
  const [revisionIssues, setRevisionIssues] = useState<AssessmentResult[]>([]);

  // Calculate metrics
  const { results } = assessment;

  const failedResults = useMemo(() =>
    results.filter(r => r.status === 'does_not_meet' || r.status === 'partial'),
    [results]
  );

  const passingResults = useMemo(() =>
    results.filter(r => r.status === 'meets'),
    [results]
  );

  const complianceRate = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round((passingResults.length / results.length) * 100);
  }, [passingResults, results]);

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
  const handleAcceptAllQuickWins = async () => {
    const allIds = quickWins.map(qw => qw.matrix_id);

    try {
      // TODO: Replace with actual backend API call
      // await fetch(`/api/packs/${assessment.pack_id}/versions/${assessment.version_id}/quick-wins/accept`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ issueIds: allIds })
      // });

      // Simulate backend processing
      await new Promise(resolve => setTimeout(resolve, 500));

      setAcceptedQuickWins(new Set(allIds));
      showToast(`Accepted ${allIds.length} quick win${allIds.length === 1 ? '' : 's'}! Changes will be applied to documents.`, 'success');
    } catch (error) {
      console.error('Failed to accept quick wins:', error);
      showToast('Failed to accept quick wins. Please try again.', 'error');
    }
  };

  const handleAcceptQuickWin = async (issueId: string) => {
    try {
      // TODO: Replace with actual backend API call
      // await fetch(`/api/packs/${assessment.pack_id}/versions/${assessment.version_id}/quick-wins/${issueId}/accept`, {
      //   method: 'POST'
      // });

      // Simulate backend processing
      await new Promise(resolve => setTimeout(resolve, 300));

      setAcceptedQuickWins(prev => new Set([...prev, issueId]));
      showToast('Quick win accepted! Change will be applied to document.', 'success');
    } catch (error) {
      console.error('Failed to accept quick win:', error);
      showToast('Failed to accept quick win. Please try again.', 'error');
    }
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

  const handleBulkAcceptQuickWins = async () => {
    const quickWinIds = selectedIssues
      .filter(i => i.triage?.quick_win)
      .map(i => i.matrix_id);

    if (quickWinIds.length === 0) {
      showToast('No quick wins selected', 'warning');
      return;
    }

    try {
      // TODO: Replace with actual backend API call
      // await fetch(`/api/packs/${assessment.pack_id}/versions/${assessment.version_id}/quick-wins/accept-bulk`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ issueIds: quickWinIds })
      // });

      // Simulate backend processing
      await new Promise(resolve => setTimeout(resolve, 500));

      setAcceptedQuickWins(prev => new Set([...prev, ...quickWinIds]));
      showToast(`Accepted ${quickWinIds.length} quick win${quickWinIds.length === 1 ? '' : 's'} from selection!`, 'success');
      setSelectedIssueIds([]);
    } catch (error) {
      console.error('Failed to bulk accept quick wins:', error);
      showToast('Failed to accept quick wins. Please try again.', 'error');
    }
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
    // Generate email content
    const subject = `Engagement Brief: ${brief.specialist_type} - ${assessment.pack_context.buildingType}`;

    const body = `Dear ${brief.specialist_type},

We would like to engage your services for the following project:

Project: ${assessment.pack_context.buildingType}
${assessment.pack_context.isHRB ? 'Classification: Higher-Risk Building (HRB)' : ''}
${assessment.pack_context.isLondon ? 'Location: London' : ''}

SCOPE OF WORK:
${brief.scope_of_work}

KEY ISSUES TO ADDRESS (${brief.issues.length} items):
${brief.issues.map((issue, idx) => `${idx + 1}. ${issue.matrix_id}: ${issue.matrix_title}`).join('\n')}

DELIVERABLES REQUIRED:
${brief.deliverables_required}

ESTIMATED EFFORT:
${brief.estimated_effort}

ESTIMATED COST:
${brief.estimated_cost}

TIMELINE:
${brief.timeline_expectations}

Please review and confirm your availability for this engagement.

Best regards`;

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;

    // Also copy to clipboard as a fallback
    navigator.clipboard.writeText(`${subject}\n\n${body}`)
      .then(() => {
        showToast('Brief copied to clipboard and email client opened!', 'success');
      })
      .catch(() => {
        showToast('Email client opened with brief', 'success');
      });
  };

  const handleExportBrief = async (brief: EngagementBrief) => {
    try {
      await exportService.exportEngagementBrief(
        assessment.pack_id,
        assessment.version_id,
        brief
      );
    } catch (error) {
      console.error('Failed to export brief:', error);
      showToast('Failed to export engagement brief. Please try again.', 'error');
    }
  };

  const handleExport = async (format: string, options: any) => {
    try {
      switch (format) {
        case 'full_report':
          await exportService.exportAssessmentPDF(
            assessment.pack_id,
            assessment.version_id,
            assessment,
            submissionGate,
            options
          );
          break;

        case 'executive_summary':
          await exportService.exportExecutiveSummary(
            assessment.pack_id,
            assessment.version_id,
            assessment,
            submissionGate
          );
          break;

        case 'issues_list':
          await exportService.exportIssuesCSV(assessment, options.filterLevel);
          break;

        case 'action_items':
          await exportService.exportIssuesCSV(assessment, options.filterLevel);
          break;

        case 'specialist_briefs':
          // Generate briefs for all specialists with issues
          showToast('Specialist Briefs Pack: Generate individual briefs from the Specialist Actions card, then export each one.', 'info');
          break;

        case 'client_presentation':
          showToast('PowerPoint export coming soon. For now, use Executive Summary PDF.', 'info');
          break;

        default:
          await exportService.exportAssessmentJSON(assessment, submissionGate);
      }

      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export:', error);
      showToast('Failed to export document. Please try again.', 'error');
    }
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
    showToast(`Generating revised ${documentName} with ${issues.length} changes... In production, this would generate a DOCX with track changes.`, 'info');
  };

  const handleBulkGenerateRevisions = (documentNames: string[]) => {
    console.log('Bulk generating revisions for:', documentNames);
    showToast(`Generating ${documentNames.length} revised documents with track changes... In production, this would generate a ZIP file with all DOCXs.`, 'info');
  };

  const handleExportWithTrackChanges = (changes: any[]) => {
    console.log('Exporting with track changes:', changes);
    showToast(`Exporting ${revisionDocument} with ${changes.filter(c => c.status === 'accepted').length} accepted changes... In production, this would generate a branded DOCX with Microsoft Word track changes.`, 'info');
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

      showToast('Human Review PDF export initiated! This PDF will contain only items requiring professional judgment, formatted for specialist review and sign-off.', 'success');
    } catch (error) {
      console.error('Failed to export Human Review PDF:', error);
      showToast('Failed to export Human Review PDF. Please try again.', 'error');
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
          <BarChartIcon size={28} color="var(--navy)" />
          ASSESSMENT SUMMARY
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Readiness Score & Compliance Rate */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-bold text-slate-900">
                  {assessment.readiness_score}/100
                </div>
                <div className="text-sm text-slate-600">Readiness Score</div>
              </div>
              <div className="pt-2 border-t border-slate-300">
                <div className="flex items-baseline gap-2">
                  <div className={`text-2xl font-bold ${
                    complianceRate >= 80 ? 'text-green-600' :
                    complianceRate >= 60 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {complianceRate}%
                  </div>
                  <div className="text-xs text-slate-600">
                    ({passingResults.length}/{results.length} passing)
                  </div>
                </div>
                <div className="text-sm text-slate-600">Compliance Rate</div>
              </div>
            </div>
          </div>

          {/* Issues Breakdown */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex justify-between text-sm items-center">
                <span className="text-red-600 font-semibold flex items-center gap-1.5">
                  <CircleDotIcon size={12} color="#dc2626" />
                  Critical:
                </span>
                <span className="text-red-600 font-bold">{criticalIssues.length}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                  <CircleDotIcon size={12} color="#f59e0b" />
                  High:
                </span>
                <span className="text-amber-600 font-bold">{highPriorityIssues.length}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <CircleDotIcon size={12} color="#10b981" />
                  Medium/Low:
                </span>
                <span className="text-slate-600 font-bold">
                  {failedResults.length - criticalIssues.length - highPriorityIssues.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex justify-between text-sm items-center">
                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                  <ZapIcon size={14} color="#10b981" />
                  Quick Wins:
                </span>
                <span className="text-emerald-600 font-bold">{quickWins.length}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-indigo-600 font-semibold flex items-center gap-1.5">
                  <TargetIcon size={14} color="#4f46e5" />
                  Specialists:
                </span>
                <span className="text-indigo-600 font-bold">
                  {failedResults.filter(r => r.triage?.engagement_type === 'SPECIALIST_REQUIRED').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b-2 border-slate-300">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-4 ${
                activeTab === 'overview'
                  ? 'border-slate-700 text-slate-900 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardIcon size={18} color={activeTab === 'overview' ? 'var(--navy)' : '#64748b'} />
              Overview & Issues
            </button>
            <button
              onClick={() => setActiveTab('by-consultant')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-4 ${
                activeTab === 'by-consultant'
                  ? 'border-purple-600 text-purple-900 bg-purple-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TargetIcon size={18} color={activeTab === 'by-consultant' ? '#9333ea' : '#64748b'} />
              By Consultant
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-4 ${
                activeTab === 'revisions'
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PencilIcon size={18} color={activeTab === 'revisions' ? '#047857' : '#64748b'} />
              Document Revisions
            </button>
            <button
              onClick={() => setActiveTab('human-review')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-4 ${
                activeTab === 'human-review'
                  ? 'border-red-600 text-red-900 bg-red-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <AlertCircleIcon size={18} color={activeTab === 'human-review' ? '#dc2626' : '#64748b'} />
              Human Review Required
            </button>
            <button
              onClick={() => setActiveTab('action-tracker')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 border-b-4 ${
                activeTab === 'action-tracker'
                  ? 'border-indigo-600 text-indigo-900 bg-indigo-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckIcon size={18} color={activeTab === 'action-tracker' ? '#4f46e5' : '#64748b'} />
              Action Tracker
            </button>
            <div className="flex-1"></div>
            {/* Explicit Download Buttons */}
            <div className="flex gap-2 my-1 mr-1">
              <button
                onClick={async () => {
                  try {
                    await exportService.exportComplianceMatrixExcel(assessment.pack_id, assessment.version_id, assessment);
                    showToast('Excel compliance matrix downloaded', 'success');
                  } catch (error) {
                    showToast('Failed to export Excel matrix', 'error');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5 rounded-t-lg"
                title="Download compliance matrix as Excel spreadsheet"
              >
                <FileTextIcon size={16} color="white" />
                Excel
              </button>
              <button
                onClick={async () => {
                  try {
                    await exportService.exportClientGapAnalysis(assessment.pack_id, assessment.version_id, assessment);
                    showToast('Gap Analysis PDF downloaded', 'success');
                  } catch (error) {
                    showToast('Failed to export Gap Analysis PDF', 'error');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5 rounded-t-lg"
                title="Download Gap Analysis PDF for client review"
              >
                <FileTextIcon size={16} color="white" />
                Gap PDF
              </button>
              <button
                onClick={async () => {
                  try {
                    await exportService.exportComplianceReport(assessment.pack_id, assessment.version_id, assessment);
                    showToast('Submission Readiness PDF downloaded', 'success');
                  } catch (error) {
                    showToast('Failed to export Readiness PDF', 'error');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5 rounded-t-lg"
                title="Download Submission Readiness Report PDF"
              >
                <FileTextIcon size={16} color="white" />
                Readiness PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'by-consultant' && (
        <ByConsultantView
          issues={failedResults}
          onViewIssue={onViewIssue}
          onGenerateBrief={handleGenerateBriefClick}
        />
      )}

      {activeTab === 'revisions' && (
        <DocumentRevisionDashboard
          issues={failedResults}
          onViewChanges={handleViewChanges}
          onGenerateRevisions={handleGenerateRevisions}
          onBulkGenerate={handleBulkGenerateRevisions}
        />
      )}

      {activeTab === 'action-tracker' && (
        <ActionItemsTracker
          issues={failedResults}
          onExport={() => setShowExportModal(true)}
        />
      )}

      {activeTab === 'human-review' && (
        <HumanReviewTable
          issues={results}
          onExportPdf={handleExportHumanReviewPdf}
        />
      )}

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
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
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardIcon size={24} color="var(--navy)" />
                ALL ISSUES ({filteredResults.length} items)
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
        </>
      )}

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
