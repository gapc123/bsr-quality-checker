/**
 * Export Options Modal
 *
 * Provides multiple export formats:
 * - Full assessment report (PDF)
 * - Issues summary (Excel/CSV)
 * - Specialist briefs (PDF/Email)
 * - Action items list
 */

import React, { useState } from 'react';
import type { FullAssessment, SubmissionGate } from '../types/assessment';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  format: string;
  recommended?: boolean;
}

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (format: string, options: ExportSettings) => void;
  assessment?: FullAssessment;
  submissionGate?: SubmissionGate;
}

interface ExportSettings {
  includeEvidence: boolean;
  includeDashboard: boolean;
  includeActionPlan: boolean;
  includeBriefs: boolean;
  filterLevel?: 'all' | 'critical' | 'high_priority';
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  assessment,
  submissionGate
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('full_report');
  const [settings, setSettings] = useState<ExportSettings>({
    includeEvidence: true,
    includeDashboard: true,
    includeActionPlan: true,
    includeBriefs: false,
    filterLevel: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const exportOptions: ExportOption[] = [
    {
      id: 'full_report',
      name: 'Full Assessment Report',
      description: 'Complete PDF with submission gate, all issues, evidence, and action plan',
      icon: '📄',
      format: 'PDF',
      recommended: true
    },
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level overview with key findings and submission recommendation',
      icon: '📊',
      format: 'PDF'
    },
    {
      id: 'issues_list',
      name: 'Issues List',
      description: 'Sortable spreadsheet of all issues with priority, effort, and actions',
      icon: '📋',
      format: 'Excel/CSV'
    },
    {
      id: 'specialist_briefs',
      name: 'Specialist Briefs Pack',
      description: 'Individual engagement briefs for each specialist (PDF)',
      icon: '🎯',
      format: 'PDF Bundle'
    },
    {
      id: 'action_items',
      name: 'Action Items Tracker',
      description: 'Checklist format for tracking remediation progress',
      icon: '✓',
      format: 'Excel'
    },
    {
      id: 'client_presentation',
      name: 'Client Presentation',
      description: 'Slide deck with key findings and recommendations',
      icon: '📽️',
      format: 'PowerPoint'
    }
  ];

  const handleExport = async () => {
    if (!onExport) return;

    setIsExporting(true);

    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    onExport(selectedFormat, settings);
    setIsExporting(false);
  };

  const selectedOption = exportOptions.find(opt => opt.id === selectedFormat);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b-2 border-slate-300 p-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>📤</span>
                  Export Assessment
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Choose format and customize export options
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Export Format Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Choose Export Format</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exportOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFormat(option.id)}
                    className={`
                      relative p-4 border-2 rounded-lg text-left transition-all
                      ${selectedFormat === option.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-indigo-25'
                      }
                    `}
                  >
                    {option.recommended && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 mb-1">
                          {option.name}
                        </div>
                        <p className="text-xs text-slate-600 mb-2">
                          {option.description}
                        </p>
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          {option.format}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Settings */}
            {selectedOption && (
              <div className="border-t-2 border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Export Settings</h3>

                {/* Include sections */}
                {selectedFormat === 'full_report' && (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeDashboard}
                        onChange={(e) => setSettings({ ...settings, includeDashboard: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Dashboard Summary</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Submission gate, quick wins, and specialist actions overview
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeEvidence}
                        onChange={(e) => setSettings({ ...settings, includeEvidence: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Evidence Quotes</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Pack and reference document quotes for each issue
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeActionPlan}
                        onChange={(e) => setSettings({ ...settings, includeActionPlan: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Action Plan</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Detailed remediation actions with owners and timelines
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.includeBriefs}
                        onChange={(e) => setSettings({ ...settings, includeBriefs: e.target.checked })}
                        className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-900">Include Specialist Briefs</span>
                        <p className="text-xs text-slate-600 mt-1">
                          Appendix with engagement briefs for each specialist
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Filter level */}
                {(selectedFormat === 'issues_list' || selectedFormat === 'action_items') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Filter Issues
                    </label>
                    <select
                      value={settings.filterLevel}
                      onChange={(e) => setSettings({ ...settings, filterLevel: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Issues</option>
                      <option value="critical">Critical Blockers Only</option>
                      <option value="high_priority">Critical + High Priority</option>
                    </select>
                    <p className="text-xs text-slate-600 mt-2">
                      Choose which issues to include in the export
                    </p>
                  </div>
                )}

                {/* Summary Stats */}
                {assessment && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <span>📊</span>
                      Export Preview
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>
                        <strong>Readiness Score:</strong> {assessment.readiness_score}/100
                      </p>
                      <p>
                        <strong>Total Issues:</strong> {assessment.results.filter(r => r.status !== 'meets').length}
                      </p>
                      {submissionGate && (
                        <p>
                          <strong>Submission Gate:</strong> {submissionGate.gate_status} ({submissionGate.blockers_count} blockers)
                        </p>
                      )}
                      <p>
                        <strong>Assessment Date:</strong> {assessment.assessment_date ? new Date(assessment.assessment_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-slate-300 bg-slate-50 p-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-2 text-slate-700 hover:text-slate-900 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <span className="animate-spin">⚙️</span>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Export {selectedOption?.format}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 text-center mt-3">
              💡 Exports are generated in real-time and include the latest assessment data
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportOptionsModal;
