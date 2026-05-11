/**
 * AssessmentProgressScreen
 *
 * Rich live-feed shown while an assessment is running.
 * Displays a scrolling log of criteria results as they stream in via SSE.
 */

import { useEffect, useRef } from 'react';

export interface CriterionResult {
  criterionId: string;
  criterionName: string;
  phase: 'deterministic' | 'llm';
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed';
  finding?: string;
}

interface Props {
  /** Criteria that have completed (have a real result status) */
  completed: CriterionResult[];
  /** Criterion currently being processed by the LLM (no result yet) */
  pending: { criterionId: string; criterionName: string } | null;
  /** Overall progress across both phases */
  phase: 'deterministic' | 'llm' | null;
  deterministicTotal: number;
  deterministicDone: number;
  llmTotal: number;
  llmDone: number;
}

const STATUS_CONFIG = {
  meets: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    label: 'Pass',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  partial: {
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    label: 'Partial',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  does_not_meet: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    label: 'Fail',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
  not_assessed: {
    dot: 'bg-slate-400',
    text: 'text-slate-500',
    label: 'N/A',
    bg: 'bg-slate-50',
    border: 'border-slate-100',
  },
};

export default function AssessmentProgressScreen({
  completed,
  pending,
  phase,
  deterministicTotal,
  deterministicDone,
  llmTotal,
  llmDone,
}: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the feed to the bottom as new items arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [completed.length, pending]);

  const passes = completed.filter(c => c.status === 'meets').length;
  const partials = completed.filter(c => c.status === 'partial').length;
  const fails = completed.filter(c => c.status === 'does_not_meet').length;

  const phase1Done = deterministicTotal > 0 && deterministicDone >= deterministicTotal;
  const phase2Active = phase === 'llm';
  const phase2Pct = llmTotal > 0 ? Math.round((llmDone / llmTotal) * 100) : 0;
  const phase1Pct = deterministicTotal > 0
    ? Math.round((deterministicDone / deterministicTotal) * 100)
    : 0;

  // Show last 12 completed items in the feed
  const feedItems = completed.slice(-12);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-indigo-300 text-sm font-semibold uppercase tracking-widest">
              Assessment in progress
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Reviewing your building safety pack
          </h1>
          <p className="text-slate-400 text-sm">
            Checking {deterministicTotal + llmTotal} regulatory criteria across your documents
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-900/40 border border-emerald-700/40 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{passes}</div>
            <div className="text-xs text-emerald-300 mt-0.5">Passing</div>
          </div>
          <div className="bg-amber-900/30 border border-amber-700/30 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-amber-400">{partials}</div>
            <div className="text-xs text-amber-300 mt-0.5">Partial</div>
          </div>
          <div className="bg-red-900/30 border border-red-700/30 rounded-xl px-4 py-3 text-center">
            <div className="text-2xl font-bold text-red-400">{fails}</div>
            <div className="text-xs text-red-300 mt-0.5">Issues found</div>
          </div>
        </div>

        {/* Phase progress */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-4">
          <div className="space-y-4">
            {/* Phase 1 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {phase1Done ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </span>
                  ) : (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="text-sm font-semibold text-slate-200">
                    Phase 1 — Deterministic rules
                  </span>
                </div>
                <span className="text-xs text-slate-400 tabular-nums">
                  {deterministicDone} / {deterministicTotal || '…'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${phase1Pct}%` }}
                />
              </div>
            </div>

            {/* Phase 2 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {phase2Active ? (
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                  )}
                  <span className={`text-sm font-semibold ${phase2Active ? 'text-slate-200' : 'text-slate-500'}`}>
                    Phase 2 — AI analysis
                  </span>
                </div>
                {phase2Active && (
                  <span className="text-xs text-slate-400 tabular-nums">
                    {llmDone} / {llmTotal || '…'}
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${phase2Pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Currently checking */}
          {pending && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Currently checking</p>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-mono text-indigo-400">{pending.criterionId}</p>
                  <p className="text-sm text-slate-200 leading-snug">{pending.criterionName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live results feed */}
        {feedItems.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/40">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Live findings
              </p>
            </div>
            <div
              ref={feedRef}
              className="max-h-56 overflow-y-auto divide-y divide-slate-700/30 scroll-smooth"
            >
              {feedItems.map((item) => {
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.not_assessed;
                return (
                  <div key={item.criterionId} className="px-4 py-2.5 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-slate-500">{item.criterionId}</span>
                        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug truncate">
                        {item.criterionName}
                      </p>
                      {item.finding && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {item.finding}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-600 mt-6">
          This typically takes 5–10 minutes. You can leave this tab open — results will appear automatically.
        </p>
      </div>
    </div>
  );
}
