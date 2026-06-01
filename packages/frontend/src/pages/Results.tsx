/**
 * Results Page - Dashboard-First UI
 *
 * Clean, modern results page using the new dashboard components
 * Replaces old carousel-first approach with intelligent grouping
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/Toast';
import ResultsDashboard from '../components/ResultsDashboard';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import ChatPanel from '../components/ChatPanel';
import MobileDashboardView from '../components/MobileDashboardView';
import ProjectMetadataCard from '../components/ProjectMetadataCard';
import { useResponsive } from '../components/ResponsiveContainer';
import { useA11y } from '../components/AccessibilityEnhancements';
import type { FullAssessment, SubmissionGate, AssessmentResult } from '../types/assessment';
import { GatewayReadinessBar } from '../components/GatewayReadinessBar';
import { computeDiff, diffSummary } from '../lib/assessmentDiff';
import AssessmentProgressScreen, { CriterionResult } from '../components/AssessmentProgressScreen';

export default function Results() {
  const { packId, versionId } = useParams<{ packId: string; versionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  const { announce } = useA11y();
  const { showToast } = useToast();

  const [assessment, setAssessment] = useState<FullAssessment | null>(null);
  const [submissionGate, setSubmissionGate] = useState<SubmissionGate | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<'loading' | 'running' | 'complete' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  // Progress tracking for the live assessment screen
  const [completedCriteria, setCompletedCriteria] = useState<CriterionResult[]>([]);
  const [pendingCriterion, setPendingCriterion] = useState<{ criterionId: string; criterionName: string } | null>(null);
  const [progressPhase, setProgressPhase] = useState<'deterministic' | 'llm' | null>(null);
  const [deterministicTotal, setDeterministicTotal] = useState(0);
  const [deterministicDone, setDeterministicDone] = useState(0);
  const [llmTotal, setLlmTotal] = useState(0);
  const [llmDone, setLlmDone] = useState(0);
  const [previousAssessment, setPreviousAssessment] = useState<{ results?: any[] } | null>(null);
  const [previousVersionCreatedAt, setPreviousVersionCreatedAt] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  // Set to true when SSE signals assessment is done — shows "View Results" button on progress screen
  const [sseComplete, setSseComplete] = useState(false);

  const POLL_INTERVAL_MS = 3000;
  const POLL_TIMEOUT_MS = 15 * 60 * 1000;

  // Restore scroll position when returning from CriterionDetailPage
  useEffect(() => {
    const scrollY = (location.state as any)?.restoreScrollY;
    if (scrollY != null && assessmentStatus === 'complete') {
      window.scrollTo(0, scrollY);
    }
  }, [assessmentStatus, location.state]);

  const handleRerunAssessment = async () => {
    setAssessmentStatus('loading');
    setErrorMessage(null);
    try {
      await fetch(`/api/packs/${packId}/versions/${versionId}/matrix-assess`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to start re-run:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();

    async function poll() {
      if (cancelled) return;

      if (Date.now() - startTime > POLL_TIMEOUT_MS) {
        setAssessmentStatus('error');
        setErrorMessage('Assessment timed out after 15 minutes. Please try re-running.');
        return;
      }

      try {
        const res = await fetch(`/api/packs/${packId}/versions/${versionId}/assessment`);

        if (res.status === 401 || res.status === 403) {
          window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        if (res.status === 404) {
          setAssessmentStatus('running');
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        if (res.status === 503) {
          // Backend signals the assessment itself failed
          let msg = 'Assessment failed on the server. Please try re-running.';
          try { const d = await res.json(); msg = d.error || msg; } catch { /* ignore */ }
          setAssessmentStatus('error');
          setErrorMessage(msg);
          return;
        }

        if (!res.ok) {
          setAssessmentStatus('error');
          setErrorMessage(`Assessment failed (${res.status}). Please try re-running.`);
          return;
        }

        const assessmentData = await res.json();
        const fullAssessment: FullAssessment = transformAssessmentData(assessmentData);
        setAssessment(fullAssessment);
        if (assessmentData.previous_assessment) {
          setPreviousAssessment(assessmentData.previous_assessment);
          setPreviousVersionCreatedAt(assessmentData.previous_version_created_at ?? null);
        }

        try {
          const gateRes = await fetch(`/api/packs/${packId}/versions/${versionId}/submission-gate`);
          if (gateRes.ok) {
            setSubmissionGate(await gateRes.json());
          } else {
            setSubmissionGate(generateSubmissionGate(fullAssessment));
          }
        } catch {
          setSubmissionGate(generateSubmissionGate(fullAssessment));
        }

        setAssessmentStatus('complete');
        announce('Assessment results loaded', 'polite');

      } catch (err) {
        if (!cancelled) {
          setAssessmentStatus('error');
          setErrorMessage('Network error. Check your connection and try again.');
          announce('Failed to load assessment results', 'assertive');
        }
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [packId, versionId]);

  // SSE ticker — connect when assessment is running, disconnect when done
  useEffect(() => {
    if (assessmentStatus !== 'running') return;

    if (typeof EventSource === 'undefined') return; // SSE not supported — polling fallback handles it

    const source = new EventSource(
      `/api/packs/${packId}/versions/${versionId}/assessment-progress`
    );

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.done) {
          source.close();
          setSseComplete(true);
          // Reload the page — the polling loop will immediately get a 200 and show the dashboard
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
        if (event.error) {
          source.close();
          setAssessmentStatus('error');
          setErrorMessage(event.message || 'Assessment failed on the server. Please re-run.');
          return;
        }

        setProgressPhase(event.phase);

        if (event.status === 'checking') {
          // LLM call in progress — show as pending
          setPendingCriterion({ criterionId: event.criterionId, criterionName: event.criterionName });
        } else if (event.status) {
          // Completed criterion — add to feed
          setPendingCriterion(null);
          setCompletedCriteria(prev => [
            ...prev,
            {
              criterionId: event.criterionId,
              criterionName: event.criterionName,
              phase: event.phase,
              status: event.status,
              finding: event.finding,
            } as CriterionResult,
          ]);
          if (event.phase === 'deterministic') {
            setDeterministicTotal(event.total);
            setDeterministicDone(event.current);
          } else {
            setLlmTotal(event.total);
            setLlmDone(event.current);
          }
        } else {
          // Legacy event without status — update phase totals only
          if (event.phase === 'deterministic') {
            setDeterministicTotal(event.total);
            setDeterministicDone(event.current);
          } else {
            setLlmTotal(event.total);
            setLlmDone(event.current);
          }
        }
      } catch {
        // ignore malformed events
      }
    };

    source.onerror = () => source.close();

    return () => source.close();
  }, [assessmentStatus, packId, versionId]);

  const transformAssessmentData = (data: any): FullAssessment => {
    // If data is already in correct format, return it
    if (data.results && data.pack_context && data.readiness_score !== undefined) {
      return data as FullAssessment;
    }

    // Transform old format to new format
    const results: AssessmentResult[] = (data.criteria || data.results || []).map((criterion: any) => ({
      matrix_id: criterion.matrix_id || criterion.id || '',
      matrix_title: criterion.matrix_title || criterion.title || '',
      matrix_references: criterion.matrix_references || [],
      category: criterion.category || 'General',
      status: criterion.status || 'not_assessed',
      reasoning: criterion.reasoning || '',
      success_definition: criterion.success_definition || criterion.success_criteria || '',
      pack_evidence: {
        found: criterion.pack_evidence?.found || false,
        document: criterion.pack_evidence?.document || null,
        page: criterion.pack_evidence?.page || criterion.pack_evidence?.page_number || null,
        section: criterion.pack_evidence?.section || null,
        quote: criterion.pack_evidence?.quote || criterion.pack_evidence?.text_evidence || null
      },
      reference_evidence: {
        found: criterion.reference_evidence?.found || false,
        doc_id: criterion.reference_evidence?.doc_id || null,
        doc_title: criterion.reference_evidence?.doc_title || null,
        page: criterion.reference_evidence?.page || null,
        quote: criterion.reference_evidence?.quote || null
      },
      gaps_identified: criterion.gaps_identified || [],
      actions_required: (criterion.actions_required || []).map((action: any) => ({
        action: action.action || '',
        owner: action.owner || 'TBD',
        effort: action.effort || 'Unknown',
        expected_benefit: action.expected_benefit || action.benefit || ''
      })),
      confidence: {
        level: criterion.confidence === 'high' ? 'HIGH' :
               criterion.confidence === 'medium' ? 'MEDIUM' :
               criterion.confidence === 'low' ? 'REQUIRES_HUMAN_JUDGEMENT' : 'MEDIUM',
        can_system_act: criterion.confidence === 'high' || criterion.confidence === 'medium',
        reasoning: ''
      },
      triage: generateTriage(criterion),
      proposed_change: criterion.proposed_change || null
    }));

    return {
      pack_id: packId || '',
      version_id: versionId || '',
      pack_context: {
        buildingType: data.pack_context?.buildingType || 'Unknown',
        isLondon: data.pack_context?.isLondon || false,
        heightMeters: data.pack_context?.heightMeters || null,
        storeys: data.pack_context?.storeys || null,
        isHRB: data.pack_context?.isHRB || false
      },
      readiness_score: data.readiness_score || calculateReadinessScore(results),
      results,
      generated_at: new Date().toISOString()
    };
  };

  const generateTriage = (criterion: any): AssessmentResult['triage'] => {
    const severity = criterion.severity || 'medium';
    const status = criterion.status;

    // Determine urgency
    let urgency: 'CRITICAL_BLOCKER' | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY' = 'MEDIUM_PRIORITY';
    if (severity === 'high' && status === 'does_not_meet') {
      urgency = 'CRITICAL_BLOCKER';
    } else if (severity === 'high' || (severity === 'medium' && status === 'does_not_meet')) {
      urgency = 'HIGH_PRIORITY';
    } else if (severity === 'low') {
      urgency = 'LOW_PRIORITY';
    }

    // Determine if it blocks submission
    const blocks_submission = urgency === 'CRITICAL_BLOCKER';

    // Determine if it's a quick win (can be fixed in < 2 days)
    const effort = criterion.actions_required?.[0]?.effort || '';
    const quick_win = effort.toLowerCase().includes('day') || effort.toLowerCase().includes('hour');

    // Determine engagement type
    const owner = criterion.actions_required?.[0]?.owner?.toLowerCase() || '';
    let engagement_type: 'SPECIALIST_REQUIRED' | 'INTERNAL_FIX' | 'AI_AMENDABLE' | 'CLIENT_INPUT' = 'SPECIALIST_REQUIRED';
    if (quick_win) {
      engagement_type = 'INTERNAL_FIX';
    } else if (owner.includes('client') || owner.includes('developer')) {
      engagement_type = 'CLIENT_INPUT';
    }

    return {
      urgency,
      blocks_submission,
      quick_win,
      engagement_type
    };
  };

  const calculateReadinessScore = (results: AssessmentResult[]): number => {
    if (results.length === 0) return 0;

    const weights = { meets: 1, partial: 0.5, does_not_meet: 0, not_assessed: 0 };
    const totalWeight = results.reduce((sum, r) => sum + (weights[r.status] || 0), 0);
    return Math.round((totalWeight / results.length) * 100);
  };

  const generateSubmissionGate = (assessment: FullAssessment): SubmissionGate => {
    const blockers = assessment.results.filter(r => r.triage?.blocks_submission);
    const highPriority = assessment.results.filter(r => r.triage?.urgency === 'HIGH_PRIORITY');

    const gate_status: 'GREEN' | 'AMBER' | 'RED' =
      blockers.length > 0 ? 'RED' :
      highPriority.length > 5 ? 'AMBER' : 'GREEN';

    return {
      can_submit: gate_status === 'GREEN',
      gate_status,
      blockers_count: blockers.length,
      high_priority_count: highPriority.length,
      recommendation:
        gate_status === 'RED' ? `Not ready for submission. ${blockers.length} critical blockers must be resolved.` :
        gate_status === 'AMBER' ? `Submission possible with caveats. ${highPriority.length} high-priority items should be addressed.` :
        'Ready for submission. All critical requirements met.',
      blocking_issues: blockers.map(b => b.matrix_id)
    };
  };

  const handleGenerateBrief = async (specialist: string, issues: AssessmentResult[]) => {
    console.log('Generate brief for:', specialist, issues);
    // Brief generation handled by modal
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/export/pdf`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment-${packId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        announce('Assessment report exported', 'polite');
      } else {
        console.error('Export failed:', res.status);
        showToast('Failed to export report. Please try again.', 'error');
        announce('Failed to export report', 'assertive');
      }
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export report. Please try again.', 'error');
      announce('Failed to export report', 'assertive');
    } finally {
      setExporting(false);
    }
  };

  const handleViewIssue = (issue: AssessmentResult) => {
    console.log('View issue:', issue);
    // Detail panel handles this
  };

  // Initial loading state
  if (assessmentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Loading Assessment Results
          </h2>
          <p className="text-slate-600">
            Analyzing building safety compliance...
          </p>
        </div>
      </div>
    );
  }

  // Assessment running — rich live-feed screen
  if (assessmentStatus === 'running') {
    return (
      <AssessmentProgressScreen
        completed={completedCriteria}
        pending={pendingCriterion}
        phase={progressPhase}
        deterministicTotal={deterministicTotal}
        deterministicDone={deterministicDone}
        llmTotal={llmTotal}
        llmDone={llmDone}
        isComplete={sseComplete}
        onViewResults={() => window.location.reload()}
      />
    );
  }

  // Error state
  if (assessmentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Assessment Error
          </h2>
          <p className="text-slate-600 mb-6">{errorMessage || 'Something went wrong. Please try again.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRerunAssessment}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              Re-run Assessment
            </button>
            <button
              onClick={() => navigate(`/packs/${packId}`)}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Back to Pack
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            No Results Available
          </h2>
          <p className="text-slate-600 mb-6">
            Assessment data not found for this version.
          </p>
          <button
            onClick={() => navigate(`/packs/${packId}`)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
          >
            Back to Pack
          </button>
        </div>
      </div>
    );
  }

  // Main results view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <main id="main-content" className="pb-20">
        {isMobile ? (
          <MobileDashboardView
            assessment={assessment}
            submissionGate={submissionGate || undefined}
            onIssueSelect={handleViewIssue}
            onExport={handleExportReport}
          />
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Assessment Results
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportReport}
                    disabled={exporting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {exporting ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Exporting…
                      </>
                    ) : (
                      'Export Results'
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/packs/${packId}`)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    ← Back to Pack
                  </button>
                </div>
              </div>
            </div>

            {/* Gateway Readiness Bar */}
            <GatewayReadinessBar results={assessment.results} />

            {/* Version diff toggle — only shown when a previous assessment exists */}
            {previousAssessment && (() => {
              const deltaMap = computeDiff(assessment.results, previousAssessment);
              const summary = diffSummary(deltaMap);
              const prevDate = previousVersionCreatedAt
                ? new Date(previousVersionCreatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                : 'previous version';
              return (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={showDiff}
                      onChange={e => setShowDiff(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    Compare with {prevDate}
                  </label>
                  {showDiff && (
                    <span className="text-sm">
                      <span className="text-green-600 font-medium">{summary.fixed} fixed</span>
                      {' · '}
                      <span className="text-red-600 font-medium">{summary.regressed} regressed</span>
                      {' · '}
                      <span className="text-amber-600 font-medium">{summary.stillFailing} still failing</span>
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Project Metadata Card */}
            <div className="mb-6">
              <ProjectMetadataCard
                packContext={assessment.pack_context}
                packId={assessment.pack_id}
                versionId={assessment.version_id}
                generatedAt={assessment.generated_at}
              />
            </div>

            {/* AI Analysis */}
            <AIAnalysisPanel packId={packId!} versionId={versionId!} />

            {/* Dashboard */}
            <ResultsDashboard
              assessment={assessment}
              submissionGate={submissionGate || undefined}
              onGenerateBrief={handleGenerateBrief}
              onExportReport={handleExportReport}
              onViewIssue={handleViewIssue}
              deltaMap={showDiff && previousAssessment
                ? computeDiff(assessment.results, previousAssessment)
                : undefined}
            />

            {/* Floating chat */}
            <ChatPanel packId={packId!} versionId={versionId!} />
          </div>
        )}
      </main>
    </div>
  );
}
