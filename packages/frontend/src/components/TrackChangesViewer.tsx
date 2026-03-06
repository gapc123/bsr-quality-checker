/**
 * Track Changes Viewer
 *
 * Word-style track changes interface for reviewing AI-proposed document edits
 * Shows original text, proposed change, and confidence level
 * Allows accept/reject decisions with systematic checklist workflow
 */

import React, { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface ProposedChange {
  id: string;
  issueId: string;
  issueTitle: string;
  changeType: 'addition' | 'deletion' | 'modification' | 'replacement';
  section: string;
  originalText: string;
  proposedText: string;
  reasoning: string;
  confidence: 'HIGH' | 'MEDIUM' | 'REQUIRES_HUMAN_JUDGEMENT';
  canSystemAct: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  page?: number;
}

interface TrackChangesViewerProps {
  documentName: string;
  issues: AssessmentResult[];
  onClose: () => void;
  onExportWithChanges?: (changes: ProposedChange[]) => void;
  onAcceptAll?: (changes: ProposedChange[]) => void;
}

export const TrackChangesViewer: React.FC<TrackChangesViewerProps> = ({
  documentName,
  issues,
  onClose,
  onExportWithChanges,
  onAcceptAll
}) => {
  // Generate proposed changes from issues
  const allChanges = useMemo((): ProposedChange[] => {
    const changes: ProposedChange[] = [];

    issues.forEach((issue, idx) => {
      // Extract change information
      const section = issue.matrix_title;
      const originalText = issue.pack_evidence.quote || '[No existing text found]';
      const proposedText = issue.proposed_change || '[Change to be determined by specialist]';
      const confidence = issue.confidence?.level || 'REQUIRES_HUMAN_JUDGEMENT';
      const canSystemAct = issue.confidence?.can_system_act || false;

      // Determine change type
      let changeType: ProposedChange['changeType'] = 'modification';
      if (issue.triage?.action_type === 'DOCUMENT_MISSING') {
        changeType = 'addition';
      } else if (originalText.includes('[No existing text]')) {
        changeType = 'addition';
      } else if (proposedText && originalText) {
        changeType = 'replacement';
      }

      changes.push({
        id: `${issue.matrix_id}-${idx}`,
        issueId: issue.matrix_id,
        issueTitle: issue.matrix_title,
        changeType,
        section,
        originalText,
        proposedText,
        reasoning: issue.reasoning,
        confidence,
        canSystemAct,
        status: 'pending',
        page: issue.pack_evidence.page || undefined
      });
    });

    return changes;
  }, [issues]);

  const [changes, setChanges] = useState<ProposedChange[]>(allChanges);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  // Filter changes
  const filteredChanges = useMemo(() => {
    if (filterStatus === 'all') return changes;
    return changes.filter(c => c.status === filterStatus);
  }, [changes, filterStatus]);

  const currentChange = filteredChanges[currentChangeIndex];

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: changes.length,
      pending: changes.filter(c => c.status === 'pending').length,
      accepted: changes.filter(c => c.status === 'accepted').length,
      rejected: changes.filter(c => c.status === 'rejected').length,
      highConfidence: changes.filter(c => c.confidence === 'HIGH').length,
      mediumConfidence: changes.filter(c => c.confidence === 'MEDIUM').length,
      humanReview: changes.filter(c => c.confidence === 'REQUIRES_HUMAN_JUDGEMENT').length
    };
  }, [changes]);

  // Handle change decision
  const handleAccept = () => {
    setChanges(prev =>
      prev.map(c =>
        c.id === currentChange.id ? { ...c, status: 'accepted' as const } : c
      )
    );
    handleNext();
  };

  const handleReject = () => {
    setChanges(prev =>
      prev.map(c =>
        c.id === currentChange.id ? { ...c, status: 'rejected' as const } : c
      )
    );
    handleNext();
  };

  const handleNext = () => {
    if (currentChangeIndex < filteredChanges.length - 1) {
      setCurrentChangeIndex(currentChangeIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentChangeIndex > 0) {
      setCurrentChangeIndex(currentChangeIndex - 1);
    }
  };

  const handleAcceptAllPending = () => {
    setChanges(prev =>
      prev.map(c =>
        c.status === 'pending' && c.confidence === 'HIGH'
          ? { ...c, status: 'accepted' as const }
          : c
      )
    );
    onAcceptAll?.(changes.filter(c => c.confidence === 'HIGH'));
  };

  const handleExport = () => {
    onExportWithChanges?.(changes);
  };

  // Get confidence styling
  const getConfidenceStyles = (confidence: ProposedChange['confidence']) => {
    switch (confidence) {
      case 'HIGH':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          text: 'text-green-900',
          badge: 'bg-green-100 text-green-800',
          icon: '✓'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-500',
          text: 'text-amber-900',
          badge: 'bg-amber-100 text-amber-800',
          icon: '⚠️'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800',
          icon: '🔴'
        };
    }
  };

  if (!currentChange) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">All Changes Reviewed!</h2>
          <p className="text-slate-600 mb-6">
            You've reviewed all {filterStatus !== 'all' ? filterStatus : ''} changes.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
            {onExportWithChanges && (
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                Export DOCX with Track Changes
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const styles = getConfidenceStyles(currentChange.confidence);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className={`${styles.bg} border-b-2 ${styles.border} p-6 rounded-t-lg`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${styles.text} flex items-center gap-2`}>
                <span>📝</span>
                Track Changes: {documentName}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Change {currentChangeIndex + 1} of {filteredChanges.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 ${styles.text} hover:bg-opacity-80 rounded transition-colors`}
              aria-label="Close viewer"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentChangeIndex + 1) / filteredChanges.length) * 100}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <div className="px-3 py-1 bg-white border border-slate-300 rounded text-xs">
              <span className="font-semibold">{stats.pending}</span> Pending
            </div>
            <div className="px-3 py-1 bg-green-100 border border-green-300 rounded text-xs">
              <span className="font-semibold">{stats.accepted}</span> Accepted
            </div>
            <div className="px-3 py-1 bg-red-100 border border-red-300 rounded text-xs">
              <span className="font-semibold">{stats.rejected}</span> Rejected
            </div>
            <div className="border-l border-slate-300 pl-3 ml-3 flex gap-3">
              <span className="text-xs">
                <span className="text-green-600">✓</span> {stats.highConfidence} high
              </span>
              <span className="text-xs">
                <span className="text-amber-600">⚠️</span> {stats.mediumConfidence} medium
              </span>
              <span className="text-xs">
                <span className="text-red-600">🔴</span> {stats.humanReview} review
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Change Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-700 rounded">
                  {currentChange.issueId}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded ${styles.badge}`}>
                  {styles.icon} {currentChange.confidence.replace(/_/g, ' ')}
                </span>
                {currentChange.page && (
                  <span className="text-xs text-slate-600">Page {currentChange.page}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{currentChange.issueTitle}</h3>
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setCurrentChangeIndex(0);
              }}
              className="px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Changes ({changes.length})</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="accepted">Accepted ({stats.accepted})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>
          </div>

          {/* Reasoning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-900 mb-2">Why This Change?</h4>
            <p className="text-sm text-blue-800">{currentChange.reasoning}</p>
          </div>

          {/* Change Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Original Text */}
            <div className="border-2 border-red-300 rounded-lg overflow-hidden">
              <div className="bg-red-100 border-b-2 border-red-300 px-4 py-2">
                <h4 className="text-sm font-bold text-red-900">Original Text (Delete)</h4>
              </div>
              <div className="p-4 bg-red-50">
                <p className="text-sm text-red-900 line-through decoration-red-500 decoration-2">
                  {currentChange.originalText}
                </p>
              </div>
            </div>

            {/* Proposed Text */}
            <div className="border-2 border-green-300 rounded-lg overflow-hidden">
              <div className="bg-green-100 border-b-2 border-green-300 px-4 py-2">
                <h4 className="text-sm font-bold text-green-900">Proposed Text (Insert)</h4>
              </div>
              <div className="p-4 bg-green-50">
                <p className="text-sm text-green-900 font-semibold">
                  {currentChange.proposedText}
                </p>
              </div>
            </div>
          </div>

          {/* Confidence Explanation */}
          <div className={`${styles.bg} border-2 ${styles.border} rounded-lg p-4`}>
            <h4 className={`text-sm font-bold ${styles.text} mb-2`}>
              {styles.icon} Confidence Level: {currentChange.confidence.replace(/_/g, ' ')}
            </h4>
            {currentChange.confidence === 'HIGH' && (
              <p className="text-sm text-green-800">
                AI is highly confident this change is correct and complies with BSR requirements. Safe to accept with quick review.
              </p>
            )}
            {currentChange.confidence === 'MEDIUM' && (
              <p className="text-sm text-amber-800">
                AI believes this change is likely correct but recommends human review. Verify against source regulations before accepting.
              </p>
            )}
            {currentChange.confidence === 'REQUIRES_HUMAN_JUDGEMENT' && (
              <p className="text-sm text-red-800">
                <strong>⚠️ Human judgment required.</strong> This change involves professional interpretation, design decisions, or context-specific requirements. AI cannot determine the correct approach - your expertise is needed.
              </p>
            )}
          </div>

          {/* Section Context */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Document Section</h4>
            <p className="text-sm text-slate-700">{currentChange.section}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t-2 border-slate-300 bg-slate-50 p-6 rounded-b-lg">
          <div className="flex items-center justify-between mb-4">
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentChangeIndex === 0}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentChangeIndex === filteredChanges.length - 1}
                className="px-4 py-2 border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>

            {/* Decision Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                ✗ Reject Change
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
              >
                ✓ Accept Change
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={handleAcceptAllPending}
              disabled={stats.highConfidence === 0 || stats.pending === 0}
              className="text-green-700 hover:text-green-900 font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept All High Confidence ({stats.highConfidence})
            </button>
            {onExportWithChanges && (
              <button
                onClick={handleExport}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline"
              >
                Export DOCX with Track Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackChangesViewer;
