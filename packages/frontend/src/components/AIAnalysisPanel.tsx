import { useState, useEffect } from 'react';

interface TopPriority { matrix_id: string; title: string; why: string; action: string; }
interface BSRFocus { area: string; reason: string; }
interface NextStep { step: string; owner: string; effort: 'Quick fix' | 'Days' | 'Weeks'; }
interface AIAnalysis { summary: string; top_priorities: TopPriority[]; bsr_focus: BSRFocus[]; next_steps: NextStep[]; generated_at: string; }
interface AIAnalysisPanelProps { packId: string; versionId: string; }

const effortColour: Record<string, string> = {
  'Quick fix': 'bg-emerald-100 text-emerald-800',
  'Days': 'bg-amber-100 text-amber-800',
  'Weeks': 'bg-red-100 text-red-800',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AIAnalysisPanel({ packId, versionId }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/packs/${packId}/versions/${versionId}/ai-analysis`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: AIAnalysis = await res.json();
        if (!cancelled) setAnalysis(data);
      } catch { if (!cancelled) setError('failed'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [packId, versionId]);

  if (error) return null;

  return (
    <div className="mb-6 border border-indigo-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 border-b border-indigo-200 cursor-pointer select-none" onClick={() => setCollapsed(c => !c)}>
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 text-lg">✦</span>
          <span className="font-semibold text-indigo-900 text-sm">AI Analysis</span>
          <span className="text-xs text-indigo-500 font-normal">— generated instantly from your results</span>
        </div>
        <button className="text-indigo-400 hover:text-indigo-600 text-xs transition-colors">{collapsed ? 'Show ▾' : 'Hide ▴'}</button>
      </div>
      {!collapsed && (
        <div className="bg-white p-5 space-y-6">
          <section>
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-4/6" /></div>
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{analysis?.summary}</p>
            )}
          </section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Top Priorities</h3>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="border border-slate-200 rounded p-3 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>)}</div>
              ) : (
                <div className="space-y-3">
                  {analysis?.top_priorities.map((p, i) => (
                    <div key={p.matrix_id} className="border border-slate-200 rounded p-3 hover:border-indigo-300 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">#{i + 1}</span>
                        <span className="text-xs font-mono text-slate-400">{p.matrix_id}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-1">{p.title}</p>
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">{p.why}</p>
                      <div className="flex items-start gap-1.5">
                        <span className="text-xs text-emerald-600 mt-0.5 shrink-0">→</span>
                        <p className="text-xs text-emerald-700 font-medium leading-relaxed">{p.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">What the BSR Will Focus On</h3>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="border border-amber-200 rounded p-3 space-y-2"><Skeleton className="h-3 w-2/5" /><Skeleton className="h-3 w-full" /></div>)}</div>
              ) : (
                <div className="space-y-3">
                  {analysis?.bsr_focus.map((f, i) => (
                    <div key={i} className="border border-amber-200 bg-amber-50 rounded p-3">
                      <p className="text-sm font-semibold text-amber-900 mb-1">{f.area}</p>
                      <p className="text-xs text-amber-800 leading-relaxed">{f.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Next Steps</h3>
              {loading ? (
                <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="flex gap-2 py-2 border-b border-slate-100"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/4" /></div>)}</div>
              ) : (
                <div className="space-y-2">
                  {analysis?.next_steps.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 leading-snug">{s.step}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.owner}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${effortColour[s.effort] ?? 'bg-slate-100 text-slate-700'}`}>{s.effort}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
