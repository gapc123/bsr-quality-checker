/**
 * QuickAssessResults — full-page results view
 *
 * Replaces the fixed inset-0 modal in SimpleResultsView.
 * Navigated to from QuickAssess after assessment completes,
 * assessment data passed via React Router location.state.
 *
 * Layout:
 *   Left sidebar (248px sticky) — verdict, score, category breakdown, export CTAs
 *   Main content (flex-1)      — tabs: Action Required | Verify | Passing | AI Analysis
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useCopilotReadable } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import type { AssessmentResult, FullAssessment } from '../types/assessment';
import * as exportService from '../services/exportService';

// ─── types ───────────────────────────────────────────────────────────────────

interface DomainReviews {
  fire_safety: string; documentation: string; regulatory: string; quality: string; synthesis: string;
}

interface QuickAssessment {
  success: boolean; assessmentId: string; documentsProcessed: number;
  context: { isLondon: boolean; isHRB: boolean; buildingType: string; heightMeters: number | null; storeys: number | null };
  results: AssessmentResult[];
  summary: { total: number; meets: number; partial: number; does_not_meet: number; not_assessed: number };
}

// ─── issue card ──────────────────────────────────────────────────────────────

const TIER_STYLES = {
  action:  { borderLeft: '3px solid #dc2626', bg: '#fff5f5', idColor: '#dc2626' },
  verify:  { borderLeft: '3px solid #d97706', bg: '#fffbeb', idColor: '#b45309' },
};

const IssueCard: React.FC<{ issue: AssessmentResult; tier: 'action' | 'verify'; defaultExpanded?: boolean }> = ({ issue, tier, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const s = TIER_STYLES[tier];
  const gap = issue.gaps_identified?.[0];
  const action = issue.actions_required?.[0];
  const evidence = issue.pack_evidence;
  return (
    <div style={{ borderLeft: s.borderLeft, background: s.bg, borderRadius: '6px', marginBottom: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: s.idColor, minWidth: '60px', paddingTop: '1px', fontWeight: 600 }}>{issue.matrix_id}</span>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.4 }}>{issue.matrix_title}</span>
        <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {gap && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>What's wrong</p><p style={{ fontSize: '12px', color: '#374151' }}>{gap}</p></div>}
          {issue.reasoning && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Assessment</p><p style={{ fontSize: '12px', color: '#374151' }}>{issue.reasoning}</p></div>}
          {evidence && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Evidence</p><p style={{ fontSize: '12px', color: '#374151' }}>{evidence.document}{evidence.page ? ` · p.${evidence.page}` : ''}</p></div>}
          {action && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Action</p><p style={{ fontSize: '12px', color: '#374151' }}>{action.action}</p></div>}
          {(action?.owner || action?.effort) && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              {action?.owner && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 500 }}>{action.owner}</span>}
              {action?.effort && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>{action.effort}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PassingRow: React.FC<{ issue: AssessmentResult }> = ({ issue }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderBottom: '1px solid #f0f0f0' }}>
    <span style={{ color: '#16a34a', fontSize: '13px', flexShrink: 0 }}>✓</span>
    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af', minWidth: '56px' }}>{issue.matrix_id}</span>
    <span style={{ fontSize: '12px', color: '#374151', flex: 1 }}>{issue.matrix_title}</span>
    {issue.pack_evidence?.document && (
      <span style={{ fontSize: '10px', color: '#9ca3af', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.pack_evidence[0].document}</span>
    )}
  </div>
);

// ─── main page ────────────────────────────────────────────────────────────────

type TabId = 'action' | 'verify' | 'passing' | 'ai';

const AGENT_META = {
  synthesis:     { icon: '🏛️', title: 'Executive Summary',            role: 'Lead BSR Consultant',                           domains: 'All domains' },
  fire_safety:   { icon: '🔥', title: 'Fire Safety Review',           role: 'Chartered Fire Engineer',                       domains: 'Approved Document B · BS 9991 · Means of escape · Suppression' },
  documentation: { icon: '📋', title: 'Documentation Review',         role: 'Principal Designer / Documentation Specialist', domains: 'Pack completeness · Golden thread · Traceability · BSA 2022' },
  regulatory:    { icon: '⚖️', title: 'Regulatory Compliance Review', role: 'BSR Regulatory Consultant',                     domains: 'HRB dutyholder duties · Regulation 38 · London Plan D12' },
  quality:       { icon: '🔍', title: 'Quality & Consistency Review', role: 'Technical Auditor',                             domains: 'Cross-document contradictions · Version mismatches · Coordination gaps' },
} as const;

const CAT_LABELS: Record<string, string> = {
  FIRE_SAFETY: 'Fire safety', GOLDEN_THREAD: 'Golden thread', VENTILATION: 'Ventilation',
  PACK_COMPLETENESS: 'Pack completeness', HRB_DUTIES: 'HRB duties',
  CONSISTENCY: 'Consistency', STRUCTURAL: 'Structural', OTHER: 'Other',
};

export default function QuickAssessResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const assessment = (location.state as { assessment: QuickAssessment } | null)?.assessment;

  useEffect(() => {
    if (!assessment) navigate('/assess', { replace: true });
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>('action');
  const [crewReviews, setCrewReviews] = useState<DomainReviews | null>(null);
  const [crewStatus, setCrewStatus] = useState<'pending' | 'done' | 'error'>('pending');
  const [activeReviewTab, setActiveReviewTab] = useState<keyof typeof AGENT_META>('synthesis');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll crew review
  useEffect(() => {
    if (!assessment?.assessmentId) return;
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      if (++attempts > 60) { setCrewStatus('error'); clearInterval(pollRef.current!); return; }
      try {
        const res = await fetch(`/api/assess/crew-review/${assessment.assessmentId}`);
        if (res.status === 404) return;
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'done') { setCrewReviews(data.domain_reviews); setCrewStatus('done'); clearInterval(pollRef.current!); }
        else if (data.status === 'error') { setCrewStatus('error'); clearInterval(pollRef.current!); }
      } catch { /* ignore */ }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [assessment?.assessmentId]);

  const analysis = useMemo(() => {
    if (!assessment) return null;
    const tierOf = (i: AssessmentResult): 'action' | 'verify' | 'advisory' => {
      if (i.confidence_tier) return i.confidence_tier;
      if (i.triage?.urgency === 'CRITICAL_BLOCKER' || i.triage?.blocks_submission) return 'action';
      if (i.status === 'does_not_meet' && (i.gaps_identified?.length ?? 0) > 0) return 'action';
      if (i.status === 'partial') return 'verify';
      return 'advisory';
    };
    const nonPassing = assessment.results.filter(r => r.status === 'does_not_meet' || r.status === 'partial');
    const passItems  = assessment.results.filter(r => r.status === 'meets');
    const actionItems = nonPassing.filter(i => tierOf(i) === 'action');
    const verifyItems = nonPassing.filter(i => tierOf(i) === 'verify');
    const categoryCounts: Record<string, { action: number; verify: number }> = {};
    for (const i of nonPassing) {
      const cat = i.category || 'OTHER';
      if (!categoryCounts[cat]) categoryCounts[cat] = { action: 0, verify: 0 };
      const t = tierOf(i); if (t === 'action') categoryCounts[cat].action++; else categoryCounts[cat].verify++;
    }
    let statusColor = '#16a34a', statusText = 'Ready to submit', statusBg = '#f0fdf4';
    if (actionItems.length > 0) { statusColor = '#dc2626'; statusText = 'Not ready'; statusBg = '#fff5f5'; }
    else if (verifyItems.length > 0) { statusColor = '#d97706'; statusText = 'Needs verification'; statusBg = '#fffbeb'; }
    return { passing: passItems.length, passItems, total: assessment.results.length, actionItems, verifyItems, categoryCounts, statusColor, statusText, statusBg };
  }, [assessment]);

  useCopilotReadable({ description: 'BSR compliance assessment results', value: analysis ? { verdict: analysis.statusText, totalChecks: analysis.total, passing: analysis.passing, actionItems: analysis.actionItems.map(b => ({ check: b.matrix_title, reason: b.reasoning, gaps: b.gaps_identified })), verifyItems: analysis.verifyItems.map(c => ({ check: c.matrix_title, reason: c.reasoning })) } : null });

  if (!assessment || !analysis) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const fa: FullAssessment = {
        pack_id: 'quick-assess', version_id: assessment.assessmentId,
        pack_context: { isLondon: assessment.context.isLondon, isHRB: assessment.context.isHRB, buildingType: assessment.context.buildingType, heightMeters: assessment.context.heightMeters, storeys: assessment.context.storeys },
        readiness_score: 0, results: assessment.results, generated_at: new Date().toISOString(),
        criteria_summary: { total_applicable: assessment.summary.total, assessed: assessment.summary.total, not_assessed: assessment.summary.not_assessed, meets: assessment.summary.meets, partial: assessment.summary.partial, does_not_meet: assessment.summary.does_not_meet },
      };
      await exportService.exportClientGapAnalysis('quick-assess', assessment.assessmentId, fa);
      await exportService.exportConsultantActionPlan('quick-assess', assessment.assessmentId, fa);
      await exportService.exportComplianceMatrixExcel('quick-assess', assessment.assessmentId, fa, 'BSR Submission');
      showToast('Three documents downloaded', 'success');
    } catch (err) {
      showToast(`Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally { setIsDownloading(false); }
  };

  const handleSave = async () => {
    if (!clientName.trim() || !projectName.trim()) { showToast('Client name and project name required', 'warning'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/assess/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assessmentId: assessment.assessmentId, clientName: clientName.trim(), projectName: projectName.trim(), clientCompany: clientCompany.trim() || null }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to save'); }
      const data = await res.json();
      showToast(`Saved to ${data.client.name}`, 'success');
      setShowSaveDialog(false);
      navigate(`/packs/${data.pack.id}`);
    } catch (err) { showToast(`Error: ${err instanceof Error ? err.message : 'Failed'}`, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)', background: 'var(--cream)' }}>

      {/* SIDEBAR */}
      <aside style={{ width: '248px', flexShrink: 0, background: 'var(--white)', borderRight: '1px solid var(--beige)', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: '18px', position: 'sticky', top: '0', alignSelf: 'flex-start', minHeight: 'calc(100vh - 120px)' }}>

        {/* Verdict */}
        <div style={{ background: analysis.statusBg, borderRadius: '8px', padding: '16px', textAlign: 'center', border: `1px solid ${analysis.statusColor}33` }}>
          <div style={{ fontSize: '22px', marginBottom: '6px' }}>{analysis.statusColor === '#16a34a' ? '✅' : analysis.statusColor === '#d97706' ? '⚠️' : '✕'}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: analysis.statusColor }}>{analysis.statusText}</div>
          {analysis.actionItems.length > 0 && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>{analysis.actionItems.length} items require action</div>}
        </div>

        {/* Score pills */}
        <div>
          {[{ dot: '#16a34a', label: 'Passing', count: analysis.passing }, { dot: '#dc2626', label: 'Action required', count: analysis.actionItems.length }, { dot: '#d97706', label: 'Verify', count: analysis.verifyItems.length }].map(({ dot, label, count }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#6b7280' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot, flexShrink: 0 }} />{label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>By category</p>
          {Object.entries(analysis.categoryCounts).map(([cat, counts]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>{CAT_LABELS[cat] ?? cat}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {counts.action > 0 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c', fontWeight: 600 }}>{counts.action}A</span>}
                {counts.verify > 0 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>{counts.verify}V</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Export CTAs — always visible, never scroll out of view */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={handleDownload} disabled={isDownloading}
            style={{ background: isDownloading ? '#f3f4f6' : 'var(--navy)', color: isDownloading ? '#9ca3af' : 'var(--white)', border: 'none', borderRadius: '6px', padding: '11px 14px', cursor: isDownloading ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>{isDownloading ? 'Generating…' : '↓ Download reports'}</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>Gap analysis + compliance matrix</div>
          </button>
          <button onClick={() => setShowSaveDialog(true)}
            style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Save to client
          </button>
          <button onClick={() => navigate('/assess')}
            style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '11px' }}>
            ← New assessment
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--beige)', background: 'var(--white)', padding: '0 24px', flexShrink: 0 }}>
          {([
            { id: 'action'  as TabId, label: 'Action required', count: analysis.actionItems.length, cBg: '#fee2e2', cFg: '#b91c1c' },
            { id: 'verify'  as TabId, label: 'Verify',           count: analysis.verifyItems.length, cBg: '#fef3c7', cFg: '#92400e' },
            { id: 'passing' as TabId, label: 'Passing',          count: analysis.passing,            cBg: '#dcfce7', cFg: '#15803d' },
            { id: 'ai'      as TabId, label: 'AI analysis',      count: null,                        cBg: '',        cFg: '' },
          ]).map(({ id, label, count, cBg, cFg }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding: '14px 16px', fontSize: '13px', fontWeight: activeTab === id ? 600 : 400, color: activeTab === id ? 'var(--navy)' : '#6b7280', background: 'transparent', border: 'none', borderBottom: activeTab === id ? '2px solid var(--navy)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {label}
              {count !== null && <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '10px', background: activeTab === id ? cBg : '#f3f4f6', color: activeTab === id ? cFg : '#9ca3af', fontWeight: 600 }}>{count}</span>}
              {id === 'ai' && crewStatus === 'pending' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8' }} />}
              {id === 'ai' && crewStatus === 'done' && <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '10px', background: '#ede9fe', color: '#5b21b6', fontWeight: 600 }}>Ready</span>}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {activeTab === 'action' && (
            analysis.actionItems.length === 0
              ? <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}><div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div><p>No action required items.</p></div>
              : analysis.actionItems.map(i => <IssueCard key={i.matrix_id} issue={i} tier="action" defaultExpanded={true} />)
          )}

          {activeTab === 'verify' && (
            <div>
              <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '14px', padding: '10px 14px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
                These items need a human reviewer to confirm — the AI found partial evidence but could not fully verify.
              </div>
              {analysis.verifyItems.length === 0
                ? <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '32px' }}>No items to verify.</p>
                : analysis.verifyItems.map(i => <IssueCard key={i.matrix_id} issue={i} tier="verify" />)}
            </div>
          )}

          {activeTab === 'passing' && (
            <div>
              <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '14px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                {analysis.passing} criteria already satisfied — these do not need further action.
              </div>
              <div style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--beige)', overflow: 'hidden' }}>
                {analysis.passItems.map(i => <PassingRow key={i.matrix_id} issue={i} />)}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              {crewStatus === 'pending' && (
                <div style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid #e0e7ff', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 700, color: '#3730a3', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Specialist Panel</span>
                    <span style={{ fontSize: '11px', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
                      Specialists working…
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    {[{ icon: '🔥', role: 'Fire Safety Engineer', focus: 'Approved Document B, BS 9991, means of escape & suppression' }, { icon: '📋', role: 'Documentation Specialist', focus: 'Pack completeness, golden thread & missing mandatory documents' }, { icon: '⚖️', role: 'Regulatory Consultant', focus: 'HRB dutyholder obligations, Regulation 38 & London Plan D12' }, { icon: '🔍', role: 'Quality & Consistency Reviewer', focus: 'Cross-document contradictions, version mismatches & coordination' }].map(({ icon, role, focus }) => (
                      <div key={role} style={{ display: 'flex', gap: '10px', padding: '12px', background: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
                        <div><p style={{ fontSize: '12px', fontWeight: 600, color: '#3730a3' }}>{role}</p><p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', lineHeight: 1.4 }}>{focus}</p></div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#818cf8' }}>Results appear here automatically when the panel completes.</p>
                </div>
              )}

              {crewStatus === 'error' && (
                <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px' }}>Specialist review unavailable for this assessment.</div>
              )}

              {crewStatus === 'done' && crewReviews && (
                <div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {(Object.keys(AGENT_META) as (keyof typeof AGENT_META)[]).map(key => (
                      <button key={key} onClick={() => setActiveReviewTab(key)}
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: activeReviewTab === key ? '#4f46e5' : 'var(--white)', color: activeReviewTab === key ? 'var(--white)' : '#4f46e5', border: activeReviewTab === key ? 'none' : '1px solid #c7d2fe' }}>
                        {AGENT_META[key].icon} {AGENT_META[key].title}
                      </button>
                    ))}
                  </div>
                  <div style={{ background: 'var(--white)', borderRadius: '8px', border: '1px solid #e0e7ff', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#eef2ff', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '22px', lineHeight: 1, marginTop: '2px' }}>{AGENT_META[activeReviewTab].icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e1b4b' }}>{AGENT_META[activeReviewTab].title}</p>
                        <p style={{ fontSize: '11px', color: '#4338ca', marginTop: '2px' }}>{AGENT_META[activeReviewTab].role}</p>
                        <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{AGENT_META[activeReviewTab].domains}</p>
                      </div>
                      {activeReviewTab === 'synthesis' && <span style={{ fontSize: '10px', background: '#c7d2fe', color: '#3730a3', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Master report</span>}
                    </div>
                    <div style={{ padding: '20px', fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: '540px', overflowY: 'auto' }}>
                      {crewReviews[activeReviewTab]}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SAVE DIALOG */}
      {showSaveDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--white)', padding: '32px', maxWidth: '440px', width: '100%', margin: '16px', borderRadius: '8px' }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '22px', color: 'var(--navy)', marginBottom: '8px' }}>Save to client</h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Create a client and pack to save this assessment.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[{ label: 'Client name *', val: clientName, set: setClientName, ph: 'e.g. ABC Development Ltd' }, { label: 'Company (optional)', val: clientCompany, set: setClientCompany, ph: 'e.g. ABC Group' }, { label: 'Project name *', val: projectName, set: setProjectName, ph: 'e.g. Riverside Tower Gateway 2' }].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--navy)', marginBottom: '5px' }}>{label}</label>
                  <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--beige)', color: 'var(--navy)', outline: 'none', fontSize: '13px', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowSaveDialog(false)} disabled={saving} style={{ flex: 1, padding: '10px', border: '1px solid var(--beige)', background: 'transparent', color: 'var(--navy)', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !clientName.trim() || !projectName.trim()} style={{ flex: 1, padding: '10px', background: 'var(--navy)', color: 'var(--white)', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500, opacity: (saving || !clientName.trim() || !projectName.trim()) ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CopilotPopup
        instructions="You are an expert BSR Gateway 2 compliance assistant. Help the user understand what the issues mean, who should fix them, and what the regulatory consequences are. Be concise and practical."
        labels={{ title: 'Attlee AI Assistant', initial: 'Ask me anything about these results — what to fix, who to call, or what the blockers mean.' }}
      />
    </div>
  );
}
