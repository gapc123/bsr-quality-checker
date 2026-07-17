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

const VERIFY_FALLBACK_GUIDANCE: Record<string, string> = {
  FIRE_SAFETY:       'Have a Chartered Fire Engineer review the evidence in your pack against Approved Document B and BS 9991. Confirm the document explicitly addresses this criterion.',
  VENTILATION:       'Confirm your ventilation strategy document explicitly states compliance with the applicable standards. A mechanical/building services engineer should sign off.',
  PACK_COMPLETENESS: 'Check your document schedule against the BSR Gateway 2 checklist. Commission or obtain any missing documents before resubmitting.',
  GOLDEN_THREAD:     'Ensure design intent, decisions, and changes are traceable across all documents. Your Principal Designer should confirm the golden thread is intact.',
  HRB_DUTIES:        'Your Accountable Person and Principal Designer should confirm in writing that all statutory dutyholder obligations have been discharged.',
  CONSISTENCY:       'Have your design team reconcile any conflicting figures across drawings, reports, and specifications. Issue a coordinated revision.',
  STRUCTURAL:        'A Chartered Structural Engineer should confirm the structural fire resistance evidence meets the BSR\'s requirements.',
  DEFAULT:           'A qualified professional with expertise in this area should manually review the relevant sections of your pack and confirm compliance in writing.',
};

function verifyGuidance(category?: string): string {
  if (!category) return VERIFY_FALLBACK_GUIDANCE.DEFAULT;
  return VERIFY_FALLBACK_GUIDANCE[category] ?? VERIFY_FALLBACK_GUIDANCE.DEFAULT;
}

const IssueCard: React.FC<{ issue: AssessmentResult; tier: 'action' | 'verify'; defaultExpanded?: boolean; isCritical?: boolean }> = ({ issue, tier, defaultExpanded = false, isCritical = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const s = TIER_STYLES[tier];
  const gap = issue.gaps_identified?.[0];
  const action = issue.actions_required?.[0];
  const evidence = issue.pack_evidence;
  const actionText = action?.action;
  const verifyGuidanceText = (!actionText && tier === 'verify') ? verifyGuidance(issue.category) : null;
  return (
    <div style={{ borderLeft: isCritical ? '3px solid #7c0000' : s.borderLeft, background: isCritical ? '#fff0f0' : s.bg, borderRadius: '6px', marginBottom: '8px', overflow: 'hidden', border: isCritical ? '1px solid #fca5a5' : '1px solid rgba(0,0,0,0.06)' }}>
      <button onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: isCritical ? '#7c0000' : s.idColor, minWidth: '60px', paddingTop: '1px', fontWeight: 600 }}>{issue.matrix_id}</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isCritical && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: '#7c0000', background: '#fecaca', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.04em', width: 'fit-content' }}>
              ⛔ CRITICAL — automatic rejection risk
            </span>
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', lineHeight: 1.4 }}>{issue.matrix_title}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {gap && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>What's wrong</p><p style={{ fontSize: '12px', color: '#374151' }}>{gap}</p></div>}
          {issue.reasoning && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Assessment</p><p style={{ fontSize: '12px', color: '#374151' }}>{issue.reasoning}</p></div>}
          {evidence && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Evidence</p><p style={{ fontSize: '12px', color: '#374151' }}>{evidence.document}{evidence.page ? ` · p.${evidence.page}` : ''}</p></div>}
          {actionText && <div><p style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>What to do</p><p style={{ fontSize: '12px', color: '#374151' }}>{actionText}</p></div>}
          {verifyGuidanceText && (
            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '4px', padding: '8px 10px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>What to do</p>
              <p style={{ fontSize: '12px', color: '#78350f' }}>{verifyGuidanceText}</p>
            </div>
          )}
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
      <span style={{ fontSize: '10px', color: '#9ca3af', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.pack_evidence.document}</span>
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
    const isCriticalItem = (i: AssessmentResult) =>
      i.triage?.urgency === 'CRITICAL_BLOCKER' || i.triage?.blocks_submission === true;
    const tierOf = (i: AssessmentResult): 'action' | 'verify' | 'advisory' => {
      if (i.confidence_tier) return i.confidence_tier;
      if (isCriticalItem(i)) return 'action';
      if (i.status === 'does_not_meet' && (i.gaps_identified?.length ?? 0) > 0) return 'action';
      if (i.status === 'partial') return 'verify';
      return 'advisory';
    };
    const nonPassing = assessment.results.filter(r => r.status === 'does_not_meet' || r.status === 'partial');
    const passItems  = assessment.results.filter(r => r.status === 'meets');
    const allActionItems = nonPassing.filter(i => tierOf(i) === 'action');
    // Critical blockers (auto-rejection risk) sorted to the top
    const criticalItems = allActionItems.filter(isCriticalItem);
    const normalActionItems = allActionItems.filter(i => !isCriticalItem(i));
    const actionItems = [...criticalItems, ...normalActionItems];
    const verifyItems = nonPassing.filter(i => tierOf(i) === 'verify');
    const categoryCounts: Record<string, { action: number; verify: number }> = {};
    for (const i of nonPassing) {
      const cat = i.category || 'OTHER';
      if (!categoryCounts[cat]) categoryCounts[cat] = { action: 0, verify: 0 };
      const t = tierOf(i); if (t === 'action') categoryCounts[cat].action++; else categoryCounts[cat].verify++;
    }
    let statusColor = '#16a34a', statusText = 'Ready to submit', statusBg = '#f0fdf4';
    if (criticalItems.length > 0) { statusColor = '#7c0000'; statusText = 'Not ready — critical blockers'; statusBg = '#fff0f0'; }
    else if (actionItems.length > 0) { statusColor = '#dc2626'; statusText = 'Not ready'; statusBg = '#fff5f5'; }
    else if (verifyItems.length > 0) { statusColor = '#d97706'; statusText = 'Needs verification'; statusBg = '#fffbeb'; }
    return { passing: passItems.length, passItems, total: assessment.results.length, actionItems, criticalItems, verifyItems, categoryCounts, statusColor, statusText, statusBg, isCriticalItem };
  }, [assessment]);

  if (!assessment || !analysis) return null;

  const buildFA = (): FullAssessment => ({
    pack_id: 'quick-assess', version_id: assessment!.assessmentId,
    pack_context: { isLondon: assessment!.context.isLondon, isHRB: assessment!.context.isHRB, buildingType: assessment!.context.buildingType, heightMeters: assessment!.context.heightMeters, storeys: assessment!.context.storeys },
    readiness_score: 0, results: assessment!.results, generated_at: new Date().toISOString(),
    criteria_summary: { total_applicable: assessment!.summary.total, assessed: assessment!.summary.total, not_assessed: assessment!.summary.not_assessed, meets: assessment!.summary.meets, partial: assessment!.summary.partial, does_not_meet: assessment!.summary.does_not_meet },
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const fa = buildFA();
      await exportService.exportClientGapAnalysis('quick-assess', assessment!.assessmentId, fa);
      await exportService.exportConsultantActionPlan('quick-assess', assessment!.assessmentId, fa);
      await exportService.exportComplianceMatrixExcel('quick-assess', assessment!.assessmentId, fa, 'BSR Submission');
      showToast('All 3 reports downloaded', 'success');
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

      {/* SIDEBAR — dark navy surface, light text throughout */}
      <aside style={{ width: '264px', flexShrink: 0, background: '#0f1117', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '0', alignSelf: 'flex-start', minHeight: 'calc(100vh - 120px)' }}>

        {/* Verdict */}
        <div style={{ background: analysis.statusColor === '#16a34a' ? 'rgba(22,163,74,0.15)' : analysis.statusColor === '#d97706' ? 'rgba(217,119,6,0.15)' : 'rgba(220,38,38,0.15)', borderRadius: '6px', padding: '16px', textAlign: 'center', border: `1px solid ${analysis.statusColor}55` }}>
          <div style={{ fontSize: '22px', marginBottom: '6px' }}>{analysis.statusColor === '#16a34a' ? '✅' : analysis.statusColor === '#d97706' ? '⚠️' : '✕'}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: analysis.statusColor === '#16a34a' ? '#4ade80' : analysis.statusColor === '#d97706' ? '#fbbf24' : '#f87171' }}>{analysis.statusText}</div>
          {analysis.actionItems.length > 0 && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>{analysis.actionItems.length} items require action</div>}
        </div>

        {/* Score pills */}
        <div>
          {[{ dot: '#4ade80', label: 'Passing', count: analysis.passing }, { dot: '#f87171', label: 'Action required', count: analysis.actionItems.length }, { dot: '#fbbf24', label: 'Verify', count: analysis.verifyItems.length }].map(({ dot, label, count }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dot, flexShrink: 0 }} />{label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f1ec' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        {Object.keys(analysis.categoryCounts).length > 0 && (
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>By category</p>
            {Object.entries(analysis.categoryCounts).map(([cat, counts]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{CAT_LABELS[cat] ?? cat}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {counts.action > 0 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: 'rgba(220,38,38,0.25)', color: '#fca5a5', fontWeight: 600 }}>{counts.action}A</span>}
                  {counts.verify > 0 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: 'rgba(217,119,6,0.25)', color: '#fcd34d', fontWeight: 600 }}>{counts.verify}V</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Download reports</p>
          <button onClick={handleDownload} disabled={isDownloading}
            style={{ background: isDownloading ? 'rgba(255,255,255,0.08)' : 'var(--gold)', color: isDownloading ? 'rgba(255,255,255,0.4)' : '#fff', border: 'none', borderRadius: '6px', padding: '11px 14px', cursor: isDownloading ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>{isDownloading ? 'Generating…' : '↓ All 3 reports'}</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>Gap analysis · Action plan · Matrix</div>
          </button>
          <button onClick={() => setShowSaveDialog(true)}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#f4f1ec', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '10px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Save to client
          </button>
          <button onClick={() => navigate('/assess')}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '11px' }}>
            ← New assessment
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Download banner — always visible above tabs */}
        <div style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>Download:</span>
          {[
            { label: 'Gap Analysis (PDF)', fn: async () => { const fa = buildFA(); await exportService.exportClientGapAnalysis('quick-assess', assessment.assessmentId, fa); } },
            { label: 'Action Plan (PDF)', fn: async () => { const fa = buildFA(); await exportService.exportConsultantActionPlan('quick-assess', assessment.assessmentId, fa); } },
            { label: 'Compliance Matrix (Excel)', fn: async () => { const fa = buildFA(); await exportService.exportComplianceMatrixExcel('quick-assess', assessment.assessmentId, fa, 'BSR Submission'); } },
          ].map(({ label, fn }) => (
            <button key={label} disabled={isDownloading} onClick={async () => { setIsDownloading(true); try { await fn(); showToast(`${label} downloaded`, 'success'); } catch (e) { showToast(`Download failed: ${e instanceof Error ? e.message : 'error'}`, 'error'); } finally { setIsDownloading(false); } }}
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: isDownloading ? 'rgba(255,255,255,0.05)' : 'rgba(232,92,44,0.15)', color: isDownloading ? 'rgba(255,255,255,0.3)' : 'var(--gold)', border: '1px solid rgba(232,92,44,0.3)', borderRadius: '4px', cursor: isDownloading ? 'not-allowed' : 'pointer' }}>
              ↓ {label}
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#ffffff', padding: '0 24px', flexShrink: 0 }}>
          {([
            { id: 'action'  as TabId, label: 'Action required', count: analysis.actionItems.length, cBg: '#fee2e2', cFg: '#b91c1c' },
            { id: 'verify'  as TabId, label: 'Verify',           count: analysis.verifyItems.length, cBg: '#fef3c7', cFg: '#92400e' },
            { id: 'passing' as TabId, label: 'Passing',          count: analysis.passing,            cBg: '#dcfce7', cFg: '#15803d' },
            { id: 'ai'      as TabId, label: 'AI analysis',      count: null,                        cBg: '',        cFg: '' },
          ]).map(({ id, label, count, cBg, cFg }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding: '14px 16px', fontSize: '13px', fontWeight: activeTab === id ? 600 : 400, color: activeTab === id ? '#0f1117' : '#6b7280', background: 'transparent', border: 'none', borderBottom: activeTab === id ? '2px solid #0f1117' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              : (
                <>
                  {/* UX-06: Submission readiness summary card */}
                  <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '8px', background: analysis.criticalItems.length > 0 ? '#fff0f0' : '#fff5f5', border: `1px solid ${analysis.criticalItems.length > 0 ? '#fca5a5' : '#fecaca'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{analysis.criticalItems.length > 0 ? '⛔' : '✕'}</span>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: analysis.criticalItems.length > 0 ? '#7c0000' : '#991b1b' }}>
                        Not ready to submit
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#374151' }}>
                      {analysis.criticalItems.length > 0 && (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', background: '#fecaca', color: '#7c0000', fontWeight: 600 }}>
                          {analysis.criticalItems.length} critical — automatic rejection risk
                        </span>
                      )}
                      <span style={{ padding: '3px 10px', borderRadius: '20px', background: '#fee2e2', color: '#991b1b', fontWeight: 500 }}>
                        {analysis.actionItems.length} items require action
                      </span>
                      {analysis.verifyItems.length > 0 && (
                        <span style={{ padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', fontWeight: 500 }}>
                          {analysis.verifyItems.length} items need verification
                        </span>
                      )}
                    </div>
                    {analysis.criticalItems.length > 0 && (
                      <p style={{ marginTop: '8px', fontSize: '11px', color: '#7c0000' }}>
                        Critical items (⛔) will cause automatic rejection regardless of other criteria. These must be resolved first.
                      </p>
                    )}
                  </div>
                  {analysis.actionItems.map(i => <IssueCard key={i.matrix_id} issue={i} tier="action" defaultExpanded={analysis.actionItems.length <= 5} isCritical={analysis.isCriticalItem(i)} />)}
                </>
              )
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
              <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {analysis.passItems.map(i => <PassingRow key={i.matrix_id} issue={i} />)}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div>
              {crewStatus === 'pending' && (
                <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e0e7ff', padding: '24px' }}>
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
                        <div><p style={{ fontSize: '12px', fontWeight: 600, color: '#3730a3' }}>{role}</p><p style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px', lineHeight: 1.4 }}>{focus}</p></div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: '#6366f1' }}>Results appear here automatically when the panel completes.</p>
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
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: activeReviewTab === key ? '#4f46e5' : '#ffffff', color: activeReviewTab === key ? '#ffffff' : '#4f46e5', border: activeReviewTab === key ? '1px solid #4f46e5' : '1px solid #c7d2fe' }}>
                        {AGENT_META[key].icon} {AGENT_META[key].title}
                      </button>
                    ))}
                  </div>
                  <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e0e7ff', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', background: '#eef2ff', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '22px', lineHeight: 1, marginTop: '2px' }}>{AGENT_META[activeReviewTab].icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e1b4b' }}>{AGENT_META[activeReviewTab].title}</p>
                        <p style={{ fontSize: '11px', color: '#4338ca', marginTop: '2px' }}>{AGENT_META[activeReviewTab].role}</p>
                        <p style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>{AGENT_META[activeReviewTab].domains}</p>
                      </div>
                      {activeReviewTab === 'synthesis' && <span style={{ fontSize: '10px', background: '#c7d2fe', color: '#3730a3', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Master report</span>}
                    </div>
                    <div style={{ padding: '20px', fontSize: '13px', color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: '540px', overflowY: 'auto', background: '#ffffff' }}>
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
    </div>
  );
}
