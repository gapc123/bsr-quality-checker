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
}

export const SimpleResultsView: React.FC<SimpleResultsViewProps> = ({
  assessment,
  onDownloadReport,
  onClose,
  onSaveToClient
}) => {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);
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

  // Categorize issues
  const analysis = useMemo(() => {
    const allIssues = assessment.results.filter(r =>
      r.status === 'does_not_meet' || r.status === 'partial'
    );
    const passing = assessment.results.filter(r => r.status === 'meets');

    // Critical blockers
    const blockers = allIssues.filter(i =>
      i.triage?.urgency === 'CRITICAL_BLOCKER' ||
      i.triage?.blocks_submission
    );

    // Missing info (client needs to provide)
    const clientActions = allIssues.filter(i => {
      const reasoning = (i.reasoning || '').toLowerCase();
      const gaps = (i.gaps_identified || []).join(' ').toLowerCase();
      return (
        reasoning.includes('missing') ||
        reasoning.includes('not provided') ||
        reasoning.includes('tbc') ||
        reasoning.includes('to be confirmed') ||
        gaps.includes('missing')
      );
    });

    // Internal actions (we need specialists/work)
    const internalActions = allIssues.filter(i => !clientActions.includes(i));

    // Verdict
    let status: 'ready' | 'needs-work' | 'not-ready' = 'ready';
    let statusColor = '#10b981';
    let statusIcon = '✅';
    let statusText = 'Ready to Submit';

    if (blockers.length > 0) {
      status = 'not-ready';
      statusColor = '#ef4444';
      statusIcon = '❌';
      statusText = 'Not Ready';
    } else if (allIssues.length > 10) {
      status = 'needs-work';
      statusColor = '#f59e0b';
      statusIcon = '⚠️';
      statusText = 'Needs Work';
    }

    return {
      passing: passing.length,
      total: assessment.results.length,
      blockers,
      clientActions,
      internalActions,
      allIssues,
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
      criticalBlockers: analysis.blockers.map(b => ({
        check: b.matrix_title,
        reason: b.reasoning,
        gaps: b.gaps_identified,
      })),
      clientActions: analysis.clientActions.map(c => ({
        check: c.matrix_title,
        reason: c.reasoning,
      })),
      internalActions: analysis.internalActions.map(i => ({
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

          {analysis.blockers.length > 0 ? (
            <p className="text-lg text-slate-700 mb-4">
              <strong className="text-red-600">{analysis.blockers.length}</strong> critical {analysis.blockers.length === 1 ? 'item blocks' : 'items block'} submission
            </p>
          ) : (
            <p className="text-lg text-slate-700 mb-4">
              {analysis.allIssues.length === 0
                ? 'All criteria met!'
                : `${analysis.allIssues.length} ${analysis.allIssues.length === 1 ? 'item' : 'items'} to address before submission`
              }
            </p>
          )}

          {/* Quick Stats Bar */}
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span className="font-bold text-2xl text-emerald-600">{analysis.passing}</span>
              <span className="text-slate-600 ml-2">passing</span>
            </div>
            <div className="text-slate-400">•</div>
            <div>
              <span className="font-bold text-2xl text-orange-600">{analysis.allIssues.length}</span>
              <span className="text-slate-600 ml-2">need attention</span>
            </div>
          </div>
        </div>

        {/* Main Content - Action Required */}
        <div className="flex-1 overflow-y-auto p-8">

          {analysis.allIssues.length > 0 ? (
            <>
              <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                → What to Do Next
              </h3>

              <div className="grid grid-cols-2 gap-6 mb-8">

                {/* LEFT: Client Actions */}
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-500 text-white p-3 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-orange-900">Tell Client to Provide</h4>
                      <p className="text-xs text-orange-700">{analysis.clientActions.length} {analysis.clientActions.length === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>

                  {analysis.clientActions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysis.clientActions.slice(0, 8).map((issue, idx) => (
                        <li key={issue.matrix_id} className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold mt-0.5">{idx + 1}.</span>
                          <span className="text-slate-800 leading-tight">{issue.matrix_title}</span>
                        </li>
                      ))}
                      {analysis.clientActions.length > 8 && (
                        <li className="text-orange-700 italic text-xs">
                          + {analysis.clientActions.length - 8} more items...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-orange-700 italic">No missing information</p>
                  )}
                </div>

                {/* RIGHT: Internal Actions */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500 text-white p-3 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-blue-900">We Need to Address</h4>
                      <p className="text-xs text-blue-700">{analysis.internalActions.length} {analysis.internalActions.length === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>

                  {analysis.internalActions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysis.internalActions.slice(0, 8).map((issue, idx) => (
                        <li key={issue.matrix_id} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <span className="text-slate-800 leading-tight">{issue.matrix_title}</span>
                            {issue.actions_required?.[0]?.owner && (
                              <span className="block text-xs text-blue-700 mt-1">
                                → {issue.actions_required[0].owner}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                      {analysis.internalActions.length > 8 && (
                        <li className="text-blue-700 italic text-xs">
                          + {analysis.internalActions.length - 8} more items...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-blue-700 italic">No internal actions needed</p>
                  )}
                </div>
              </div>

              {/* Critical Blockers Alert */}
              {analysis.blockers.length > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🚨</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-red-900 mb-2">
                        Critical Blockers ({analysis.blockers.length})
                      </h4>
                      <p className="text-sm text-red-800 mb-3">
                        These items MUST be resolved before submission:
                      </p>
                      <ul className="space-y-1 text-sm">
                        {analysis.blockers.map((issue) => (
                          <li key={issue.matrix_id} className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span className="text-red-900 font-medium">{issue.matrix_title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Expandable Details */}
              <button
                onClick={() => setShowAllDetails(!showAllDetails)}
                className="w-full text-center py-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 mb-6"
              >
                {showAllDetails ? '▼ Hide Details' : '▶ Show All Details'}
              </button>

              {showAllDetails && (
                <div className="bg-slate-50 rounded-lg p-6 space-y-3 max-h-96 overflow-y-auto">
                  {analysis.allIssues.map((issue) => (
                    <div key={issue.matrix_id} className="bg-white border border-slate-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500">{issue.matrix_id}</span>
                        {issue.triage?.urgency === 'CRITICAL_BLOCKER' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <h5 className="font-semibold text-slate-900 mb-2">{issue.matrix_title}</h5>
                      <p className="text-sm text-slate-700 mb-2">{issue.reasoning}</p>
                      {issue.pack_evidence?.found && (issue.pack_evidence.document || issue.pack_evidence.quote) && (
                        <div className="text-xs bg-amber-50 border-l-2 border-amber-400 pl-3 py-2 mb-2">
                          <span className="font-semibold text-amber-800">Source: </span>
                          <span className="text-amber-700">
                            {issue.pack_evidence.document}
                            {issue.pack_evidence.page ? `, p.${issue.pack_evidence.page}` : ''}
                          </span>
                          {issue.pack_evidence.quote && (
                            <p className="text-amber-700 italic mt-1">
                              &ldquo;{issue.pack_evidence.quote.slice(0, 150)}{issue.pack_evidence.quote.length > 150 ? '…' : ''}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                      {issue.actions_required?.[0] && (
                        <div className="text-xs bg-blue-50 border-l-2 border-blue-500 pl-3 py-2">
                          <strong>Action:</strong> {issue.actions_required[0].action}
                          <br />
                          <strong>Owner:</strong> {issue.actions_required[0].owner}
                        </div>
                      )}
                    </div>
                  ))}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-indigo-900 text-sm tracking-wide uppercase">
                Specialist Review
              </h3>
              {crewStatus === 'pending' && (
                <span className="text-xs text-indigo-500 animate-pulse">
                  ⏳ Agents working...
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
                    ['synthesis',     '🏛 Executive Summary'],
                    ['fire_safety',   '🔥 Fire Safety'],
                    ['documentation', '📋 Documentation'],
                    ['regulatory',    '⚖️ Regulatory'],
                    ['quality',       '🔍 Consistency'],
                  ] as [keyof DomainReviews, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveReviewTab(key)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        activeReviewTab === key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-indigo-100">
                  {crewReviews[activeReviewTab]}
                </div>
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
