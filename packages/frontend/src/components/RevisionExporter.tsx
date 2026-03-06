/**
 * Revision Exporter
 *
 * Generates branded DOCX files with Microsoft Word track changes
 * Includes:
 * - Company branding and formatting
 * - Track changes for all accepted modifications
 * - Comments for human review items
 * - Acceptance checklist
 * - Change summary
 */

import React, { useState } from 'react';

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
  status: 'pending' | 'accepted' | 'rejected';
  page?: number;
}

interface RevisionExporterProps {
  documentName: string;
  changes: ProposedChange[];
  onExport: (format: 'docx' | 'pdf', settings: ExportSettings) => void;
  projectName?: string;
  companyName?: string;
}

interface ExportSettings {
  includeBranding: boolean;
  includeChecklist: boolean;
  includeChangeSummary: boolean;
  includeReasoning: boolean;
  trackChangesMode: 'all' | 'accepted_only' | 'high_confidence_only';
  addCommentsForHumanReview: boolean;
}

export const RevisionExporter: React.FC<RevisionExporterProps> = ({
  documentName,
  changes,
  onExport,
  projectName = 'Your Project',
  companyName = 'Your Company'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    includeBranding: true,
    includeChecklist: true,
    includeChangeSummary: true,
    includeReasoning: true,
    trackChangesMode: 'accepted_only',
    addCommentsForHumanReview: true
  });
  const [isExporting, setIsExporting] = useState(false);

  // Calculate stats
  const stats = React.useMemo(() => {
    const accepted = changes.filter(c => c.status === 'accepted');
    const highConfidence = accepted.filter(c => c.confidence === 'HIGH');
    const humanReview = changes.filter(c => c.confidence === 'REQUIRES_HUMAN_JUDGEMENT');

    return {
      total: changes.length,
      accepted: accepted.length,
      rejected: changes.filter(c => c.status === 'rejected').length,
      pending: changes.filter(c => c.status === 'pending').length,
      highConfidence: highConfidence.length,
      humanReview: humanReview.length
    };
  }, [changes]);

  const handleExport = async (format: 'docx' | 'pdf') => {
    setIsExporting(true);

    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    onExport(format, settings);
    setIsExporting(false);
    setIsOpen(false);
  };

  // Generate change summary text
  const generateChangeSummary = () => {
    const lines: string[] = [];

    lines.push(`# Change Summary for ${documentName}`);
    lines.push('');
    lines.push(`**Project:** ${projectName}`);
    lines.push(`**Generated:** ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push(`- **Total Changes Proposed:** ${stats.total}`);
    lines.push(`- **Accepted Changes:** ${stats.accepted}`);
    lines.push(`- **High Confidence (Auto-Applied):** ${stats.highConfidence}`);
    lines.push(`- **Requires Human Review:** ${stats.humanReview}`);
    lines.push('');

    if (stats.humanReview > 0) {
      lines.push('## ⚠️ Items Requiring Human Review');
      lines.push('');
      changes
        .filter(c => c.confidence === 'REQUIRES_HUMAN_JUDGEMENT')
        .forEach((change, idx) => {
          lines.push(`### ${idx + 1}. ${change.issueTitle} (${change.issueId})`);
          lines.push('');
          lines.push(`**Section:** ${change.section}`);
          if (change.page) lines.push(`**Page:** ${change.page}`);
          lines.push('');
          lines.push(`**Why Human Review Needed:** ${change.reasoning}`);
          lines.push('');
        });
    }

    return lines.join('\n');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
      >
        <span>📥</span>
        Export with Track Changes
      </button>

      {/* Export Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="border-b-2 border-emerald-500 bg-emerald-50 p-6 rounded-t-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
                      <span>📥</span>
                      Export Document with Track Changes
                    </h2>
                    <p className="text-sm text-emerald-700 mt-1">
                      {documentName} • {stats.accepted} changes ready for review
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stats Summary */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Export Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Total Changes:</span>
                      <span className="ml-2 font-bold text-slate-900">{stats.total}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Accepted:</span>
                      <span className="ml-2 font-bold text-green-600">{stats.accepted}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">High Confidence:</span>
                      <span className="ml-2 font-bold text-green-600">{stats.highConfidence}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Human Review:</span>
                      <span className="ml-2 font-bold text-red-600">{stats.humanReview}</span>
                    </div>
                  </div>
                </div>

                {/* Export Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Export Options</h3>

                  {/* Track Changes Mode */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Track Changes Mode
                    </label>
                    <select
                      value={settings.trackChangesMode}
                      onChange={(e) => setSettings({ ...settings, trackChangesMode: e.target.value as any })}
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All Changes (Including Rejected)</option>
                      <option value="accepted_only">Accepted Changes Only (Recommended)</option>
                      <option value="high_confidence_only">High Confidence Only (Auto-Apply)</option>
                    </select>
                    <p className="text-xs text-blue-700 mt-2">
                      Controls which changes appear as track changes in the Word document
                    </p>
                  </div>

                  {/* Include Options */}
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeBranding}
                        onChange={(e) => setSettings({ ...settings, includeBranding: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Company Branding</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Header/footer with {companyName} branding and project details
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeChangeSummary}
                        onChange={(e) => setSettings({ ...settings, includeChangeSummary: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Change Summary</span>
                        <p className="text-xs text-slate-600 mt-1">
                          First page with overview of all changes and human review items
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeChecklist}
                        onChange={(e) => setSettings({ ...settings, includeChecklist: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Acceptance Checklist</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Systematic checklist for reviewing each change
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeReasoning}
                        onChange={(e) => setSettings({ ...settings, includeReasoning: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Change Reasoning</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Add Word comments explaining why each change was made
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.addCommentsForHumanReview}
                        onChange={(e) => setSettings({ ...settings, addCommentsForHumanReview: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Flag Human Review Items</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Add highlighted comments for items requiring professional judgment
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Preview */}
                {settings.includeChangeSummary && (
                  <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 border-b-2 border-slate-300 px-4 py-2">
                      <h4 className="text-sm font-bold text-slate-900">Preview: Change Summary</h4>
                    </div>
                    <div className="p-4 bg-white max-h-48 overflow-y-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                        {generateChangeSummary()}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t-2 border-slate-300 bg-slate-50 p-6 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 text-slate-700 hover:text-slate-900 font-semibold"
                  >
                    Cancel
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isExporting ? '⚙️' : '📄'} Export PDF
                    </button>
                    <button
                      onClick={() => handleExport('docx')}
                      disabled={isExporting}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <span className="animate-spin">⚙️</span>
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <span>📥</span>
                          <span>Export DOCX</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 text-center mt-3">
                  💡 DOCX includes Microsoft Word track changes - open in Word to review and accept/reject
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RevisionExporter;
