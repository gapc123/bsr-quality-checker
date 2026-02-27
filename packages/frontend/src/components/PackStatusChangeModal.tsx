import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import PackStatusBadge from './PackStatusBadge';

interface PackStatusChangeModalProps {
  packId: string;
  currentStatus: string;
  onClose: () => void;
  onStatusChanged: () => void;
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['in_progress', 'archived'],
  in_progress: ['under_review', 'revision_needed', 'archived'],
  under_review: ['client_review', 'revision_needed', 'in_progress'],
  client_review: ['revision_needed', 'completed'],
  revision_needed: ['in_progress'],
  completed: ['archived'],
  archived: ['in_progress'],
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  under_review: 'Under Review',
  client_review: 'Client Review',
  revision_needed: 'Revision Needed',
  completed: 'Completed',
  archived: 'Archived',
};

export default function PackStatusChangeModal({
  packId,
  currentStatus,
  onClose,
  onStatusChanged,
}: PackStatusChangeModalProps) {
  const { user } = useUser();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  const handleSave = async () => {
    if (!selectedStatus || !user) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/packs/${packId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          notes: notes.trim() || undefined,
          userId: user.id,
          userName: user.fullName || user.primaryEmailAddress?.emailAddress || 'Unknown',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change status');
      }

      onStatusChanged();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Change Pack Status</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Status</label>
            <PackStatusBadge status={currentStatus} size="md" />
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            {validTransitions.length === 0 ? (
              <p className="text-sm text-slate-500">No valid status transitions available</p>
            ) : (
              <div className="space-y-2">
                {validTransitions.map((status) => (
                  <label
                    key={status}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedStatus === status
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={selectedStatus === status}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4"
                    />
                    <PackStatusBadge status={status} size="sm" />
                    <span className="flex-1 text-sm text-slate-600">
                      {STATUS_LABELS[status]}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this status change..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStatus || saving || validTransitions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Changing...' : 'Change Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
