/**
 * Engagement Brief Modal
 *
 * Display generated engagement brief with options to:
 * - View formatted brief
 * - Edit content
 * - Copy to clipboard
 * - Send via email
 * - Export as PDF
 */

import React, { useState } from 'react';
import type { EngagementBrief } from '../types/assessment';

interface EngagementBriefModalProps {
  brief: EngagementBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onSend?: (brief: EngagementBrief) => void;
  onExport?: (brief: EngagementBrief) => void;
  projectName?: string;
}

export const EngagementBriefModal: React.FC<EngagementBriefModalProps> = ({
  brief,
  isOpen,
  onClose,
  onSend,
  onExport,
  projectName = 'Your Project'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (brief) {
      setEditedText(brief.brief_text);
    }
  }, [brief]);

  if (!isOpen || !brief) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editedText : brief.brief_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSend = () => {
    const finalBrief = isEditing ? { ...brief, brief_text: editedText } : brief;
    onSend?.(finalBrief);
  };

  const handleExport = () => {
    const finalBrief = isEditing ? { ...brief, brief_text: editedText } : brief;
    onExport?.(finalBrief);
  };

  const handleSave = () => {
    // Update brief with edited text
    brief.brief_text = editedText;
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(brief.brief_text);
    setIsEditing(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b-2 border-indigo-500 bg-indigo-50 p-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
                  <span>📋</span>
                  Engagement Brief: {brief.specialist_type}
                </h2>
                <p className="text-sm text-indigo-700 mt-1">
                  {projectName} • {brief.issues_to_address.length} issues • {brief.estimated_duration}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 rounded transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3 mt-4">
              <div className="px-3 py-1 bg-white border border-indigo-300 rounded text-sm">
                <span className="font-semibold text-indigo-900">
                  {brief.issues_to_address.filter(i => i.urgency === 'CRITICAL_BLOCKER').length}
                </span>
                <span className="text-indigo-700 ml-1">Critical</span>
              </div>
              <div className="px-3 py-1 bg-white border border-indigo-300 rounded text-sm">
                <span className="font-semibold text-indigo-900">
                  {brief.deliverables.length}
                </span>
                <span className="text-indigo-700 ml-1">Deliverables</span>
              </div>
              <div className="px-3 py-1 bg-white border border-indigo-300 rounded text-sm">
                <span className="font-semibold text-indigo-900">{brief.estimated_duration}</span>
                <span className="text-indigo-700 ml-1">Duration</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Edit Brief Content
                </label>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full h-[500px] p-4 border-2 border-indigo-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{ resize: 'vertical' }}
                />
                <p className="text-xs text-slate-600 mt-2">
                  💡 Edit the brief to customize it for your specific needs
                </p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                    {brief.brief_text}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t-2 border-slate-300 bg-slate-50 p-4 rounded-b-lg">
            {isEditing ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {/* Left Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>✏️</span>
                    Edit
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex gap-2">
                  {onExport && (
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span>📄</span>
                      Export PDF
                    </button>
                  )}
                  {onSend && (
                    <button
                      onClick={handleSend}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                      <span>📧</span>
                      Send Email
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-3 text-xs text-slate-600 text-center">
              💡 This brief is ready to send to your {brief.specialist_type}. You can copy, edit, or export as needed.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EngagementBriefModal;
