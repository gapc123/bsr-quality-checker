/**
 * Human Review Table
 *
 * Filterable table showing all issues requiring human judgment
 * Allows tracking of professional review items
 * Export to separate PDF for specialist review
 */

import React, { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface HumanReviewTableProps {
  issues: AssessmentResult[];
  onExportPdf?: () => void;
  onMarkReviewed?: (issueId: string, reviewer: string, notes: string) => void;
  onAssignReviewer?: (issueId: string, reviewer: string) => void;
}

interface ReviewStatus {
  issueId: string;
  status: 'pending' | 'in_review' | 'reviewed';
  reviewer?: string;
  reviewDate?: Date;
  notes?: string;
}

export const HumanReviewTable: React.FC<HumanReviewTableProps> = ({
  issues,
  onExportPdf,
  onAssignReviewer
}) => {
  const [reviewStatuses, setReviewStatuses] = useState<Map<string, ReviewStatus>>(new Map());
  const [filterDocument, setFilterDocument] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_review' | 'reviewed'>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  // Filter issues requiring human judgment
  const humanReviewIssues = useMemo(() => {
    return issues.filter(issue =>
      issue.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT' ||
      issue.confidence?.can_system_act === false
    );
  }, [issues]);

  // Get unique documents
  const documents = useMemo(() => {
    const docs = new Set<string>();
    humanReviewIssues.forEach(issue => {
      if (issue.pack_evidence.document) {
        docs.add(issue.pack_evidence.document);
      }
    });
    return Array.from(docs).sort();
  }, [humanReviewIssues]);

  // Apply filters
  const filteredIssues = useMemo(() => {
    return humanReviewIssues.filter(issue => {
      // Document filter
      if (filterDocument !== 'all' && issue.pack_evidence.document !== filterDocument) {
        return false;
      }

      // Status filter
      const status = reviewStatuses.get(issue.matrix_id)?.status || 'pending';
      if (filterStatus !== 'all' && status !== filterStatus) {
        return false;
      }

      // Urgency filter
      if (filterUrgency !== 'all' && issue.triage?.urgency !== filterUrgency) {
        return false;
      }

      // Search filter
      if (searchQuery && !issue.matrix_title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !issue.matrix_id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [humanReviewIssues, filterDocument, filterStatus, filterUrgency, searchQuery, reviewStatuses]);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = filteredIssues.filter(i =>
      (reviewStatuses.get(i.matrix_id)?.status || 'pending') === 'pending'
    ).length;

    const inReview = filteredIssues.filter(i =>
      reviewStatuses.get(i.matrix_id)?.status === 'in_review'
    ).length;

    const reviewed = filteredIssues.filter(i =>
      reviewStatuses.get(i.matrix_id)?.status === 'reviewed'
    ).length;

    const critical = filteredIssues.filter(i =>
      i.triage?.urgency === 'CRITICAL_BLOCKER'
    ).length;

    return { total: filteredIssues.length, pending, inReview, reviewed, critical };
  }, [filteredIssues, reviewStatuses]);

  const handleStatusChange = (issueId: string, newStatus: ReviewStatus['status']) => {
    setReviewStatuses(prev => {
      const next = new Map(prev);
      const current = next.get(issueId) || { issueId, status: 'pending' };
      next.set(issueId, {
        ...current,
        status: newStatus,
        reviewDate: newStatus === 'reviewed' ? new Date() : current.reviewDate
      });
      return next;
    });
  };

  const handleAddNote = (issueId: string, note: string) => {
    setReviewStatuses(prev => {
      const next = new Map(prev);
      const current = next.get(issueId) || { issueId, status: 'pending' };
      next.set(issueId, {
        ...current,
        notes: note
      });
      return next;
    });
  };

  const handleAssignReviewer = (issueId: string, reviewer: string) => {
    setReviewStatuses(prev => {
      const next = new Map(prev);
      const current = next.get(issueId) || { issueId, status: 'pending' };
      next.set(issueId, {
        ...current,
        reviewer,
        status: 'in_review'
      });
      return next;
    });
    onAssignReviewer?.(issueId, reviewer);
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'CRITICAL_BLOCKER':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">🔴 CRITICAL</span>;
      case 'HIGH_PRIORITY':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-800">🟡 HIGH</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">🔵 MEDIUM</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-500 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
              <span className="text-3xl">🔴</span>
              Human Review Required
            </h2>
            <p className="text-sm text-red-700 mt-1">
              {humanReviewIssues.length} items need professional judgment
            </p>
          </div>

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>📄</span>
              Export Human Review PDF
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-red-300 rounded p-3">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-600">Total</div>
          </div>
          <div className="bg-white border border-slate-300 rounded p-3">
            <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
            <div className="text-xs text-slate-600">Pending</div>
          </div>
          <div className="bg-white border border-blue-300 rounded p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
            <div className="text-xs text-blue-700">In Review</div>
          </div>
          <div className="bg-white border border-green-300 rounded p-3">
            <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
            <div className="text-xs text-green-700">Reviewed</div>
          </div>
          <div className="bg-white border border-red-400 rounded p-3">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-xs text-red-700">Critical</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-slate-300 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Document Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document</label>
            <select
              value={filterDocument}
              onChange={(e) => setFilterDocument(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Documents ({humanReviewIssues.length})</option>
              {documents.map(doc => {
                const count = humanReviewIssues.filter(i => i.pack_evidence.document === doc).length;
                return (
                  <option key={doc} value={doc}>{doc} ({count})</option>
                );
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Review Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="in_review">In Review ({stats.inReview})</option>
              <option value="reviewed">Reviewed ({stats.reviewed})</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Urgencies</option>
              <option value="CRITICAL_BLOCKER">Critical Only</option>
              <option value="HIGH_PRIORITY">High Priority</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID or title..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-red-100 border-b-2 border-red-300">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Issue</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Document</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Urgency</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Reviewer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredIssues.map((issue) => {
                const isExpanded = expandedIssue === issue.matrix_id;
                const reviewStatus = reviewStatuses.get(issue.matrix_id);

                return (
                  <React.Fragment key={issue.matrix_id}>
                    <tr className="hover:bg-red-50 transition-colors">
                      {/* ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-mono px-2 py-1 bg-red-100 text-red-800 rounded">
                          {issue.matrix_id}
                        </span>
                      </td>

                      {/* Issue */}
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <div className="text-sm font-semibold text-slate-900">{issue.matrix_title}</div>
                          {issue.triage?.blocks_submission && (
                            <span className="text-xs text-red-600 font-semibold">🚫 Blocks Submission</span>
                          )}
                        </div>
                      </td>

                      {/* Document */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-slate-700 max-w-[150px] truncate">
                          {issue.pack_evidence.document || 'Unknown'}
                        </div>
                        {issue.pack_evidence.page && (
                          <div className="text-xs text-slate-500">Page {issue.pack_evidence.page}</div>
                        )}
                      </td>

                      {/* Urgency */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getUrgencyBadge(issue.triage?.urgency)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={reviewStatus?.status || 'pending'}
                          onChange={(e) => handleStatusChange(issue.matrix_id, e.target.value as any)}
                          className="text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_review">In Review</option>
                          <option value="reviewed">Reviewed</option>
                        </select>
                      </td>

                      {/* Reviewer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          placeholder="Assign..."
                          value={reviewStatus?.reviewer || ''}
                          onChange={(e) => handleAssignReviewer(issue.matrix_id, e.target.value)}
                          className="text-xs border border-slate-300 rounded px-2 py-1 w-full max-w-[120px] focus:ring-2 focus:ring-red-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setExpandedIssue(isExpanded ? null : issue.matrix_id)}
                          className="text-xs text-red-700 hover:text-red-900 font-semibold"
                        >
                          {isExpanded ? '▲ Less' : '▼ Details'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-red-25">
                          <div className="space-y-4">
                            {/* Why Human Review */}
                            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                              <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                                <span>🔴</span>
                                Why Human Judgment Required
                              </h4>
                              <p className="text-sm text-red-800">
                                {issue.confidence?.reasoning || 'Professional expertise needed to determine correct approach.'}
                              </p>
                            </div>

                            {/* Reasoning */}
                            <div className="bg-slate-50 border border-slate-300 rounded p-3">
                              <h5 className="text-xs font-bold text-slate-900 mb-1">Issue Reasoning:</h5>
                              <p className="text-sm text-slate-700">{issue.reasoning}</p>
                            </div>

                            {/* Regulatory Context */}
                            {issue.reference_evidence.found && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <h5 className="text-xs font-bold text-blue-900 mb-1">Regulatory Context:</h5>
                                <p className="text-sm text-blue-800">
                                  {issue.reference_evidence.doc_title}
                                  {issue.reference_evidence.page && ` (Page ${issue.reference_evidence.page})`}
                                </p>
                                {issue.reference_evidence.quote && (
                                  <p className="text-sm text-blue-700 italic mt-2">"{issue.reference_evidence.quote}"</p>
                                )}
                              </div>
                            )}

                            {/* Notes */}
                            <div>
                              <label className="block text-xs font-bold text-slate-900 mb-1">Review Notes:</label>
                              <textarea
                                value={reviewStatus?.notes || ''}
                                onChange={(e) => handleAddNote(issue.matrix_id, e.target.value)}
                                placeholder="Add notes from your professional review..."
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-600">
                    <p className="text-lg">No items found matching filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-red-900 mb-2">💡 About Human Review Items</h4>
        <p className="text-sm text-red-800">
          These items require professional judgment because they involve context-specific design decisions,
          regulatory interpretation, or trade-offs that AI cannot determine. Each item should be reviewed
          by the appropriate specialist (Fire Engineer, Structural Engineer, etc.) before finalizing documents.
        </p>
      </div>
    </div>
  );
};

export default HumanReviewTable;
