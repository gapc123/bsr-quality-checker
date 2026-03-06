/**
 * Document Revision Dashboard
 *
 * Shows which documents need updates based on AI-amendable issues
 * Groups changes by document with confidence indicators
 * Allows selective document regeneration
 */

import React, { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface DocumentRevision {
  documentName: string;
  documentType: string;
  changesCount: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  humanReviewCount: number;
  issues: AssessmentResult[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface DocumentRevisionDashboardProps {
  issues: AssessmentResult[];
  onGenerateRevisions?: (documentName: string, issues: AssessmentResult[]) => void;
  onViewChanges?: (documentName: string, issues: AssessmentResult[]) => void;
  onBulkGenerate?: (documents: string[]) => void;
}

export const DocumentRevisionDashboard: React.FC<DocumentRevisionDashboardProps> = ({
  issues,
  onGenerateRevisions,
  onViewChanges,
  onBulkGenerate
}) => {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Group issues by document
  const documentRevisions = useMemo((): DocumentRevision[] => {
    const docMap = new Map<string, DocumentRevision>();

    // Filter for AI-amendable and quick win issues
    const amendableIssues = issues.filter(issue =>
      issue.triage?.engagement_type === 'AI_AMENDABLE' ||
      issue.triage?.quick_win === true
    );

    amendableIssues.forEach(issue => {
      // Determine which document needs updating
      let documentName = 'Unknown Document';
      let documentType = 'Document';

      // Try to extract from pack evidence
      if (issue.pack_evidence.found && issue.pack_evidence.document) {
        documentName = issue.pack_evidence.document;
      }

      // Determine document type from name
      const nameLower = documentName.toLowerCase();
      if (nameLower.includes('fire')) {
        documentType = 'Fire Safety Strategy';
      } else if (nameLower.includes('structural')) {
        documentType = 'Structural Design Statement';
      } else if (nameLower.includes('building') && nameLower.includes('reg')) {
        documentType = 'Building Regulations Application';
      } else if (nameLower.includes('principal') || nameLower.includes('designer')) {
        documentType = 'Principal Designer Declaration';
      } else if (nameLower.includes('change')) {
        documentType = 'Change Control Plan';
      } else if (nameLower.includes('drawing')) {
        documentType = 'Architectural Drawings';
      }

      // Get or create document entry
      if (!docMap.has(documentName)) {
        docMap.set(documentName, {
          documentName,
          documentType,
          changesCount: 0,
          highConfidenceCount: 0,
          mediumConfidenceCount: 0,
          humanReviewCount: 0,
          issues: [],
          priority: 'medium'
        });
      }

      const doc = docMap.get(documentName)!;
      doc.issues.push(issue);
      doc.changesCount++;

      // Categorize by confidence level
      if (issue.confidence?.level === 'HIGH') {
        doc.highConfidenceCount++;
      } else if (issue.confidence?.level === 'MEDIUM') {
        doc.mediumConfidenceCount++;
      } else {
        doc.humanReviewCount++;
      }

      // Determine priority
      if (issue.triage?.urgency === 'CRITICAL_BLOCKER') {
        doc.priority = 'critical';
      } else if (issue.triage?.urgency === 'HIGH_PRIORITY' && doc.priority !== 'critical') {
        doc.priority = 'high';
      }
    });

    // Convert to array and sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return Array.from(docMap.values()).sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }, [issues]);

  // Handle document selection
  const handleSelectDoc = (docName: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docName)) {
        next.delete(docName);
      } else {
        next.add(docName);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocs.size === documentRevisions.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(documentRevisions.map(d => d.documentName)));
    }
  };

  const handleBulkGenerate = () => {
    if (selectedDocs.size > 0) {
      onBulkGenerate?.(Array.from(selectedDocs));
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    return documentRevisions.reduce(
      (acc, doc) => ({
        documents: acc.documents + 1,
        changes: acc.changes + doc.changesCount,
        highConfidence: acc.highConfidence + doc.highConfidenceCount,
        mediumConfidence: acc.mediumConfidence + doc.mediumConfidenceCount,
        humanReview: acc.humanReview + doc.humanReviewCount
      }),
      { documents: 0, changes: 0, highConfidence: 0, mediumConfidence: 0, humanReview: 0 }
    );
  }, [documentRevisions]);

  // Get priority styling
  const getPriorityStyles = (priority: DocumentRevision['priority']) => {
    switch (priority) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', badge: 'bg-red-100 text-red-800' };
      case 'high':
        return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' };
      case 'medium':
        return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-900', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  if (documentRevisions.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-8 text-center">
        <p className="text-lg text-slate-600">No AI-amendable documents found</p>
        <p className="text-sm text-slate-500 mt-2">
          All issues require specialist or manual intervention
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-500 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
              <span>📝</span>
              Document Revisions
            </h2>
            <p className="text-sm text-emerald-700 mt-1">
              AI-generated document updates with track changes
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-emerald-900">{totals.documents}</div>
            <div className="text-sm text-emerald-700">Documents</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-emerald-300 rounded p-3">
            <div className="text-2xl font-bold text-slate-900">{totals.changes}</div>
            <div className="text-xs text-slate-600">Total Changes</div>
          </div>
          <div className="bg-white border border-green-300 rounded p-3">
            <div className="text-2xl font-bold text-green-600">{totals.highConfidence}</div>
            <div className="text-xs text-green-700">High Confidence</div>
          </div>
          <div className="bg-white border border-amber-300 rounded p-3">
            <div className="text-2xl font-bold text-amber-600">{totals.mediumConfidence}</div>
            <div className="text-xs text-amber-700">Medium Confidence</div>
          </div>
          <div className="bg-white border border-red-300 rounded p-3">
            <div className="text-2xl font-bold text-red-600">{totals.humanReview}</div>
            <div className="text-xs text-red-700">Human Review</div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocs.size > 0 && (
          <div className="mt-4 p-4 bg-emerald-600 text-white rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold">{selectedDocs.size} document{selectedDocs.size > 1 ? 's' : ''} selected</span>
            </div>
            <button
              onClick={handleBulkGenerate}
              className="px-6 py-2 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Generate All Revisions →
            </button>
          </div>
        )}
      </div>

      {/* Select All */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedDocs.size === documentRevisions.length}
            onChange={handleSelectAll}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm font-semibold text-slate-900">
            Select All Documents
          </span>
        </label>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documentRevisions.map((doc) => {
          const isSelected = selectedDocs.has(doc.documentName);
          const styles = getPriorityStyles(doc.priority);

          return (
            <div
              key={doc.documentName}
              className={`border-2 ${styles.border} ${styles.bg} rounded-lg overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectDoc(doc.documentName)}
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />

                  {/* Document Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-bold ${styles.text}`}>
                        {doc.documentName}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles.badge}`}>
                        {doc.priority.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 mb-3">{doc.documentType}</p>

                    {/* Change Breakdown */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-900">{doc.changesCount}</span>
                        <span className="text-slate-600">total changes</span>
                      </div>
                      {doc.highConfidenceCount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600">✓</span>
                          <span className="font-semibold text-green-900">{doc.highConfidenceCount}</span>
                          <span className="text-green-700">high confidence</span>
                        </div>
                      )}
                      {doc.mediumConfidenceCount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-600">⚠️</span>
                          <span className="font-semibold text-amber-900">{doc.mediumConfidenceCount}</span>
                          <span className="text-amber-700">needs review</span>
                        </div>
                      )}
                      {doc.humanReviewCount > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-red-600">🔴</span>
                          <span className="font-semibold text-red-900">{doc.humanReviewCount}</span>
                          <span className="text-red-700">human judgment</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {onViewChanges && (
                      <button
                        onClick={() => onViewChanges(doc.documentName, doc.issues)}
                        className="px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition-colors text-sm"
                      >
                        Preview Changes
                      </button>
                    )}
                    {onGenerateRevisions && (
                      <button
                        onClick={() => onGenerateRevisions(doc.documentName, doc.issues)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        Generate DOCX →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          How Document Revisions Work
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>Select documents to regenerate with AI-proposed changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>Preview shows all changes with confidence indicators (green = high, amber = review, red = needs human judgment)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>Generate branded DOCX with Microsoft Word track changes enabled</span>
          </li>
          <li className="flex items-start gap-2">
            <span>4.</span>
            <span>Open in Word, review each change, accept/reject systematically</span>
          </li>
          <li className="flex items-start gap-2">
            <span>5.</span>
            <span>Red-flagged changes require your professional judgment to resolve</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentRevisionDashboard;
