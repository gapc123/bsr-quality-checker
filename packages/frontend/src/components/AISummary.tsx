import { useState, useEffect } from 'react';

interface AISummaryProps {
  entityType: 'pack' | 'client';
  entityId: string;
  entityName: string;
}

export default function AISummary({ entityType, entityId, entityName }: AISummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url =
        entityType === 'pack'
          ? `/api/packs/${entityId}/summary${refresh ? '?refresh=true' : ''}`
          : `/api/clients/${entityId}/summary${refresh ? '?refresh=true' : ''}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await res.json();
      setSummary(data.summary);
      setUpdatedAt(data.updatedAt ? new Date(data.updatedAt) : null);
    } catch (err) {
      setError('Unable to generate summary');
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [entityId, entityType]);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Summary</h3>
            <p className="text-slate-400 text-sm">{entityName}</p>
          </div>
        </div>
        <button
          onClick={() => fetchSummary(true)}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh summary"
        >
          <svg
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {loading && !summary ? (
        <div className="flex items-center gap-3 py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
          <span className="text-slate-400">Generating summary...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 py-2">{error}</div>
      ) : summary ? (
        <>
          <p className="text-slate-200 leading-relaxed">{summary}</p>
          {updatedAt && (
            <p className="text-slate-500 text-xs mt-4">
              Last updated: {updatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </>
      ) : (
        <p className="text-slate-400 py-2">No summary available yet. Click refresh to generate one.</p>
      )}
    </div>
  );
}
