import { useState, useEffect } from 'react';
import PackStatusBadge from './PackStatusBadge';

interface StatusChange {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedByName: string;
  notes: string | null;
  createdAt: string;
}

interface PackTimelineProps {
  packId: string;
  packCreatedAt: string;
  startedAt: string | null;
  targetCompletionDate: string | null;
  actualCompletionDate: string | null;
}

export default function PackTimeline({
  packId,
  packCreatedAt,
  startedAt,
  targetCompletionDate,
  actualCompletionDate,
}: PackTimelineProps) {
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatusHistory();
  }, [packId]);

  const loadStatusHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/packs/${packId}/status-history`);
      const data = await response.json();
      setStatusHistory(data);
    } catch (error) {
      console.error('Error loading status history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (targetDate: string) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-sm text-slate-500">Loading timeline...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Timeline</h3>
      </div>

      <div className="p-6">
        {/* Key Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-500 mb-1">Created</p>
            <p className="text-sm font-medium text-slate-900">{formatDateShort(packCreatedAt)}</p>
          </div>
          {startedAt && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Started</p>
              <p className="text-sm font-medium text-slate-900">{formatDateShort(startedAt)}</p>
            </div>
          )}
          {targetCompletionDate && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Target Completion</p>
              <p className="text-sm font-medium text-slate-900">
                {formatDateShort(targetCompletionDate)}
                {!actualCompletionDate && (
                  <span
                    className={`ml-2 text-xs ${
                      getDaysRemaining(targetCompletionDate) < 0
                        ? 'text-red-600'
                        : getDaysRemaining(targetCompletionDate) <= 7
                        ? 'text-yellow-600'
                        : 'text-slate-500'
                    }`}
                  >
                    ({getDaysRemaining(targetCompletionDate)} days
                    {getDaysRemaining(targetCompletionDate) < 0 ? ' overdue' : ' remaining'})
                  </span>
                )}
              </p>
            </div>
          )}
          {actualCompletionDate && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Completed</p>
              <p className="text-sm font-medium text-green-700">
                {formatDateShort(actualCompletionDate)}
              </p>
            </div>
          )}
        </div>

        {/* Status History */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-4">Status Changes</h4>
          {statusHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No status changes yet</p>
          ) : (
            <div className="space-y-4">
              {statusHistory.map((change, index) => (
                <div key={change.id} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 'bg-slate-300'
                      }`}
                    />
                    {index < statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {change.fromStatus && (
                        <>
                          <PackStatusBadge status={change.fromStatus} size="sm" />
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                      <PackStatusBadge status={change.toStatus} size="sm" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Changed by <span className="font-medium">{change.changedByName}</span>
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(change.createdAt)}</p>
                    {change.notes && (
                      <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded p-2 border border-slate-200">
                        {change.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
