/**
 * SimpleResultsView - Single Screen, Maximum Clarity, Action-Focused
 *
 * Design Principles:
 * - Single screen (no navigation needed)
 * - Action-oriented (what to DO is front and center)
 * - Scannable in 10 seconds
 * - Clear: Client actions vs Internal actions
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';
import type { AssessmentResult } from '../types/assessment';
import { useCopilotReadable } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';

interface DomainReviews {
  fire_safety: string;
  documentation: string;
  regulatory: string;
  quality: string;
  synthesis: string;
}

interface SimpleResultsViewProps {
  assessment: {
    results: AssessmentResult[];
    pack_context?: {
      buildingType: string;
      isHRB: boolean;
      isLondon: boolean;
    };
    assessmentId?: string;
  };
  onDownloadReport: () => void | Promise<void>;
  onClose?: () => void;
  onSaveToClient?: () => void;
  onSpecialistReviewDone?: (reviews: DomainReviews) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5-field Issue Card component
// ─────────────────────────────────────────────────────────────────────────────
const TIER_STYLES = {
  action:   { border: 'border-red-300',   bg: 'bg-red-50',   badge: 'bg-red-600 text-white',    idColor: 'text-red-500' },
  verify:   { border: 'border-amber-300', bg: 'bg-amber-50', badge: 'bg-amber-500 text-white',  idColor: 'text-amber-600' },
  advisory: { border: 'border-slate-200', bg: 'bg-white',    badge: 'bg-slate-400 text-white',  idColor: 'text-slate-400' },
};

interface IssueCardProps {
  issue: import('../types/assessment').AssessmentResult;
  tier: 'action' | 'verify' | 'advisory';
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, tier }) => {
  const [expanded, setExpanded] = useState(tier === 'action');
  const styles = TIER_STYLES[tier];
  const gap = issue.gaps_identified?.[0];
  const action = issue.actions_required?.[0];

  return (
    <div className={`border rounded-lg overflow-hidden ${styles.border} ${styles.bg}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-black/5 transition-colors"
      >
        <span className={`text-xs font-mono mt-0.5 w-16 shrink-0 ${styles.idColor}`}>{issue.matrix_id}</span>
        <span className="flex-1 text-sm font-semibold text-slate-900 leading-snug">{issue.matrix_title}</span>
        {gap && (
          <span className="text-xs text-slate-500 max-w-xs truncate hidden sm:block">{gap}</span>
        )}
        <span className="text-slate-400 text-xs ml-2 shrink-0">{expanded ? '▼' : '▶'}</span>
      </button>

      {/* Expanded detail — 5 fields */}
      {expanded && (
        <div className="border-t border-current border-opacity-10 px-4 pb-4 pt-3 space-y-3">
          {/* Field 1: What's wrong */}
          {gap && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What's Wrong</span>
              <p className="text-sm text-slate-800 mt-0.5">{gap}</p>
            </div>
          )}

          {/* Field 2: Reasoning */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assessment</span>
            <p className="text-sm text-slate-700 mt-0.5">{issue.reasoning}</p>
          </div>

          {/* Field 3: Evidence source */}
          {issue.pack_evidence?.found && (issue.pack_evidence.document || issue.pack_evidence.quote) && (
            <div className="bg-amber-50 border-l-2 border-amber-400 pl-3 py-2 rounded-r">
              <span className="text-xs font-semibold text-amber-800">Evidence</span>
              <p className="text-xs text-amber-700 mt-0.5">
                {issue.pack_evidence.document}
                {issue.pack_evidence.page ? `, p.${issue.pack_evidence.page}` : ''}
              </p>
              {issue.pack_evidence.quote && (
                <p className="text-xs text-amber-700 italic mt-1">
                  &ldquo;{issue.pack_evidence.quote.slice(0, 180)}{issue.pack_evidence.quote.length > 180 ? '…' : ''}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Field 4: Action */}
          {action && (
            <div className="bg-blue-50 border-l-2 border-blue-400 pl-3 py-2 rounded-r">
              <span className="text-xs font-semibold text-blue-800">Action</span>
              <p className="text-xs text-blue-900 mt-0.5">{action.action}</p>
            </div>
          )}

          {/* Field 5: Owner */}
          {action?.owner && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{action.owner}</span>
              {action.effort && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  action.effort === 'L' ? 'bg-red-100 text-red-700' :
                  action.effort === 'M' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>{action.effort === 'L' ? 'Large effort' : action.effort === 'M' ? 'Med effort' : 'Quick fix'}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export const SimpleResultsView: React.FC<SimpleResultsViewProps> = ({
  assessment,
  onDownloadReport,
  onClose,
  onSaveToClient,
  onSpecialistReviewDone,
}) => {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [crewReviews, setCrewReviews] = useState<DomainReviews | null>(null);
  const [crewStatus, setCrewStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [activeReviewTab, setActiveReviewTab] = useState<keyof DomainReviews>('synthesis');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for specialist review
  useEffect(() => {
    const assessmentId = (assessment as any).assessmentId;
    if (!assessmentId) return;
    setCrewStatus('pending');
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 5 min max (60 × 5s)
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        setCrewStatus('error');
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      try {
        const res = await fetch(`/api/assess/crew-review/${assessmentId}`);
        if (res.status === 404) return; // not yet triggered — keep polling
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'done') {
          setCrewReviews(data.domain_reviews);
          setCrewStatus('done');
          if (onSpecialistReviewDone) onSpecialistReviewDone(data.domain_reviews);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'error') {
          setCrewStatus('error');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore transient fetch errors, keep polling
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const [showVerify, setShowVerify] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);

  // Categorize issues into tiers
  const analysis = useMemo(() => {
    const allIssues = assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );
    const passing = assessment.results.filter(r => r.status === 'meets');

    // Tier classification — prefer explicit confidence_tier, fall back on heuristics
    const tierOf = (i: typeof allIssues[0]): 'action' | 'verify' | 'advisory' => {
      if (i.confidence_tier) return i.confidence_tier;
      // Heuristic: critical blocker or high severity with gaps → action
      if (i.triage?.urgency === 'CRITICAL_BLOCKER' || i.triage?.blocks_submission) return 'action';
      if (i.status === 'does_not_meet' && (i.gaps_identified?.length ?? 0) > 0) return 'action';
      if (i.status === 'partial') return 'verify';
      return 'advisory';
    };

    const actionItems  = allIssues.filter(i => tierOf(i) === 'action');
    const verifyItems  = allIssues.filter(i => tierOf(i) === 'verify');
    const advisoryItems = allIssues.filter(i => tierOf(i) === 'advisory');

    // Category heatmap: count non-passing issues per category
    const categoryCounts: Record<string, { action: number; verify: number; advisory: number }> = {};
    for (const i of allIssues) {
      const cat = i.category || 'OTHER';
      if (!categoryCounts[cat]) categoryCounts[cat] = { action: 0, verify: 0, advisory: 0 };
      categoryCounts[cat][tierOf(i)]++;
    }

    // Verdict — based only on ACTION items (VERIFY/ADVISORY don't block submission)
    let status: 'ready' | 'needs-work' | 'not-ready' = 'ready';
    let statusColor = '#10b981';
    let statusIcon = '✅';
    let statusText = 'Ready to Submit';

    if (actionItems.length > 0) {
      status = 'not-ready';
      statusColor = '#ef4444';
      statusIcon = '❌';
      statusText = 'Not Ready';
    } else if (verifyItems.length > 0) {
      status = 'needs-work';
      statusColor = '#f59e0b';
      statusIcon = '⚠️';
      statusText = 'Needs Verification';
    }

    return {
      passing: passing.length,
      total: assessment.results.length,
      actionItems,
      verifyItems,
      advisoryItems,
      allIssues,
      categoryCounts,
      status,
      statusColor,
      statusIcon,
      statusText
    };
  }, [assessment.results]);

  // Give the copilot full awareness of the assessment results
  useCopilotReadable({
    description: 'BSR compliance assessment results for this building',
    value: {
      verdict: analysis.statusText,
      totalChecks: analysis.total,
      passing: analysis.passing,
      buildingType: assessment.pack_context?.buildingType,
      isHighRiseBuilding: assessment.pack_context?.isHRB,
      isLondon: assessment.pack_context?.isLondon,
      actionItems: analysis.actionItems.map(b => ({
        check: b.matrix_title,
        reason: b.reasoning,
        gaps: b.gaps_identified,
      })),
      verifyItems: analysis.verifyItems.map(c => ({
        check: c.matrix_title,
        reason: c.reasoning,
      })),
      advisoryItems: analysis.advisoryItems.map(i => ({
        check: i.matrix_title,
        owner: i.actions_required?.[0]?.owner,
        reason: i.reasoning,
      })),
    },
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = onDownloadReport();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      showToast(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-lg">

        {/* Header with Verdict */}
        <div className="p-8 text-center border-b-4" style={{ borderColor: analysis.statusColor }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="text-6xl mb-4">{analysis.statusIcon}</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: analysis.statusColor }}>
            {analysis.statusText}
          </h2>

          {analysis.actionItems.length > 0 ? (
            <p className="text-lg text-slate-700 mb-4">
              <strong className="text-red-600">{analysis.actionItems.length}</strong> {analysis.actionItems.length === 1 ? 'item requires' : 'items require'} action before submission
            </p>
          ) : (
            <p className="text-lg text-slate-700 mb-4">
              {analysis.allIssues.length === 0
                ? 'All criteria met!'
                : `${analysis.verifyItems.length} to verify, ${analysis.advisoryItems.length} advisory only`
              }
            </p>
          )}

          {/* Tier stats bar */}
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="font-bold text-xl text-emerald-600">{analysis.passing}</span>
              <span className="text-slate-600">passing</span>
            </div>
            {analysis.actionItems.length > 0 && (
              <>
                <div className="text-slate-400">•</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="font-bold text-xl text-red-600">{analysis.actionItems.length}</span>
                  <span className="text-slate-600">ACTION</span>
                </div>
              </>
            )}
            {analysis.verifyItems.length > 0 && (
              <>
                <div className="text-slate-400">•</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className="font-bold text-xl text-amber-600">{analysis.verifyItems.length}</span>
                  <span className="text-slate-600">VERIFY</span>
                </div>
              </>
            )}
            {analysis.advisoryItems.length > 0 && (
              <>
                <div className="text-slate-400">•</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                  <span className="font-bold text-xl text-slate-500">{analysis.advisoryItems.length}</span>
                  <span className="text-slate-600">advisory</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Action Required */}
        <div className="flex-1 overflow-y-auto p-8">

          {analysis.allIssues.length > 0 ? (
            <>
              {/* Category Heatmap */}
              {Object.keys(analysis.categoryCounts).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Issues by Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis.categoryCounts)
                      .sort((a, b) => (b[1].action + b[1].verify) - (a[1].action + a[1].verify))
                      .map(([cat, counts]) => (
                        <div key={cat} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
                          counts.action > 0
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : counts.verify > 0
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          <span className="font-semibold">{cat.replace(/_/g, ' ')}</span>
                          {counts.action > 0 && <span className="bg-red-200 text-red-900 px-1.5 py-0.5 rounded text-xs">{counts.action} ACTION</span>}
                          {counts.verify > 0 && <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-xs">{counts.verify} VERIFY</span>}
                          {counts.advisory > 0 && !counts.action && !counts.verify && <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs">{counts.advisory} advisory</span>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ACTION items — always visible */}
              {analysis.actionItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Action Required
                    </span>
                    <span className="text-sm text-slate-500">{analysis.actionItems.length} {analysis.actionItems.length === 1 ? 'issue' : 'issues'} must be fixed before submission</span>
                  </div>
                  <div className="space-y-3">
                    {analysis.actionItems.map((issue) => (
                      <IssueCard key={issue.matrix_id} issue={issue} tier="action" />
                    ))}
                  </div>
                </div>
              )}

              {/* VERIFY items — collapsed by default */}
              {analysis.verifyItems.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowVerify(!showVerify)}
                    className="flex items-center gap-3 mb-3 w-full text-left"
                  >
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Verify
                    </span>
                    <span className="text-sm text-slate-500">{analysis.verifyItems.length} {analysis.verifyItems.length === 1 ? 'item' : 'items'} need human review</span>
                    <span className="ml-auto text-slate-400 text-xs">{showVerify ? '▼ hide' : '▶ show'}</span>
                  </button>
                  {showVerify && (
                    <div className="space-y-3">
                      {analysis.verifyItems.map((issue) => (
                        <IssueCard key={issue.matrix_id} issue={issue} tier="verify" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADVISORY items — collapsed by default */}
              {analysis.advisoryItems.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowAdvisory(!showAdvisory)}
                    className="flex items-center gap-3 mb-3 w-full text-left"
                  >
                    <span className="bg-slate-400 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      Advisory
                    </span>
                    <span className="text-sm text-slate-500">{analysis.advisoryItems.length} low-confidence {analysis.advisoryItems.length === 1 ? 'flag' : 'flags'} for awareness only</span>
                    <span className="ml-auto text-slate-400 text-xs">{showAdvisory ? '▼ hide' : '▶ show'}</span>
                  </button>
                  {showAdvisory && (
                    <div className="space-y-3">
                      {analysis.advisoryItems.map((issue) => (
                        <IssueCard key={issue.matrix_id} issue={issue} tier="advisory" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-emerald-600 mb-2">Perfect!</h3>
              <p className="text-slate-600">All criteria met. Ready for submission.</p>
            </div>
          )}
        </div>

        {/* Specialist Reviews */}
        {crewStatus !== 'idle' && (
          <div className="border-t-2 border-indigo-100 bg-indigo-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-indigo-900 text-sm tracking-wide uppercase">
                AI Specialist Panel
              </h3>
              {crewStatus === 'pending' && (
                <span className="text-xs text-indigo-500 animate-pulse flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Specialists working…
                </span>
              )}
              {crewStatus === 'error' && (
                <span className="text-xs text-red-500">Review unavailable</span>
              )}
            </div>

            {crewStatus === 'done' && crewReviews && (
              <>
                {/* Tab nav */}
                <div className="flex gap-1 mb-4 flex-wrap">
                  {([
                    ['synthesis',     '🏛️ Executive Summary'],
                    ['fire_safety',   '🔥 Fire Safety Engineer'],
                    ['documentation', '📋 Documentation Specialist'],
                    ['regulatory',    '⚖️ Regulatory Consultant'],
                    ['quality',       '🔍 Quality Reviewer'],
                  ] as [keyof DomainReviews, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveReviewTab(key)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        activeReviewTab === key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Active tab content — each agent gets a role header */}
                {(() => {
                  const AGENT_META: Record<keyof DomainReviews, { icon: string; title: string; role: string; domains: string }> = {
                    synthesis:     { icon: '🏛️', title: 'Executive Summary', role: 'Lead BSR Consultant', domains: 'All domains' },
                    fire_safety:   { icon: '🔥', title: 'Fire Safety Review', role: 'Chartered Fire Engineer', domains: 'Approved Document B · BS 9991 · Means of escape · Suppression' },
                    documentation: { icon: '📋', title: 'Documentation Review', role: 'Principal Designer / Documentation Specialist', domains: 'Pack completeness · Golden thread · Traceability · BSA 2022' },
                    regulatory:    { icon: '⚖️', title: 'Regulatory Compliance Review', role: 'BSR Regulatory Consultant', domains: 'HRB dutyholder duties · Regulation 38 · London Plan D12' },
                    quality:       { icon: '🔍', title: 'Quality & Consistency Review', role: 'Technical Auditor', domains: 'Cross-document contradictions · Version mismatches · Coordination gaps' },
                  };
                  const meta = AGENT_META[activeReviewTab];
                  return (
                    <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
                      {/* Agent header */}
                      <div className="px-5 py-4 border-b border-indigo-50 flex items-start gap-3 bg-indigo-50/60">
                        <span className="text-2xl leading-none mt-0.5">{meta.icon}</span>
                        <div>
                          <p className="font-semibold text-indigo-900 text-sm">{meta.title}</p>
                          <p className="text-xs text-indigo-700 mt-0.5">{meta.role}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{meta.domains}</p>
                        </div>
                        {activeReviewTab === 'synthesis' && (
                          <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Master report</span>
                        )}
                      </div>
                      {/* Review text */}
                      <div className="px-5 py-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {crewReviews[activeReviewTab]}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {crewStatus === 'pending' && (
              <div className="bg-white rounded-xl border border-indigo-100 p-5">
                <p className="text-sm font-semibold text-indigo-900 mb-1">
                  Your AI specialist panel is preparing their review
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Four independent experts are each analysing a different part of your submission in parallel. Their findings will be compiled into a single executive summary — or you can read each specialist's view in its own tab.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: '🔥', role: 'Fire Safety Engineer', focus: 'Approved Document B, BS 9991, means of escape & suppression' },
                    { icon: '📋', role: 'Documentation Specialist', focus: 'Pack completeness, golden thread & missing mandatory documents' },
                    { icon: '⚖️', role: 'Regulatory Consultant', focus: 'HRB dutyholder obligations, Regulation 38 & London Plan D12' },
                    { icon: '🔍', role: 'Quality & Consistency Reviewer', focus: 'Cross-document contradictions, version mismatches & coordination gaps' },
                  ].map(({ icon, role, focus }) => (
                    <div key={role} className="flex gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <span className="text-xl leading-none mt-0.5">{icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-indigo-800">{role}</p>
                        <p className="text-xs text-slate-500 leading-snug mt-0.5">{focus}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Once all four complete, a Lead Reviewer compiles everything into one executive summary with a clear verdict and prioritised action list.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer - Download Buttons */}
        <div className="border-t-2 border-slate-200 bg-slate-50 p-6">
          <div className="flex gap-4 justify-center items-center">
            {onSaveToClient && (
              <button
                onClick={onSaveToClient}
                className="px-6 py-3 border-2 border-slate-400 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                💾 Save to Client
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-lg rounded-lg transition-colors shadow-lg flex items-center gap-3"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Reports (2 PDFs)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 mt-3">
            Three AI-generated documents: Client Gap Analysis + Consultant Action Plan + Compliance Matrix Excel
          </p>
          <p className="text-center text-xs text-slate-400 mt-1">
            🤖 Powered by AI • Generated in seconds, not hours
          </p>
        </div>
      </div>
    </div>

    {/* AI Copilot — ask questions about your assessment results */}
    <CopilotPopup
      instructions={`You are an expert BSR (Building Safety Regulator) compliance advisor embedded in Attlee AI's assessment tool.
You have full visibility of the assessment results for this building, including critical blockers, client actions required, and internal specialist actions.

Your role is to help housing association staff and consultants understand:
- What the blockers mean in plain English
- What they need to do to pass, and in what order
- Which consultant disciplines need to be involved
- How serious each issue is and typical remediation timescales

Be concise, practical, and action-oriented. Reference specific checks from the results when relevant.
Do not speculate beyond the evidence in the assessment.`}
      defaultOpen={false}
      clickOutsideToClose={true}
      labels={{
        title: 'Attlee AI Assistant',
        initial: 'Ask me anything about these results — what to fix, who to call, or what the blockers mean.',
      }}
    />
    </>
  );
};

export default SimpleResultsView;
