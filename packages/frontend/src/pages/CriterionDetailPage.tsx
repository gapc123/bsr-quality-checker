import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CircleDotIcon, ZapIcon, XCircleIcon, CheckIcon, XIcon, AlertCircleIcon } from '../components/Icons';
import { resolveRef } from '../lib/regulationRefs';
import type { AssessmentResult } from '../types/assessment';

const PDFViewerModal = lazy(() => import('../components/PDFViewerModal'));

export default function CriterionDetailPage() {
  const { packId, versionId, criterionId } = useParams<{
    packId: string;
    versionId: string;
    criterionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Use criterion passed via navigation state if available; otherwise fetch
  const [criterion, setCriterion] = useState<AssessmentResult | null>(
    (location.state as any)?.criterion ?? null
  );
  const [loading, setLoading] = useState(!criterion);
  const [error, setError] = useState<string | null>(null);
  const [pdfViewer, setPdfViewer] = useState<{
    documentId: string;
    documentName: string;
    page: number;
    quote: string | null;
  } | null>(null);

  useEffect(() => {
    if (criterion) return; // already have data from state
    setLoading(true);
    fetch(`/api/packs/${packId}/versions/${versionId}/assessment`)
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!data) return;
        const results: AssessmentResult[] = data.results ?? data.criteria ?? [];
        const found = results.find(r => r.matrix_id === criterionId);
        if (found) {
          setCriterion(found);
        } else {
          setError('Criterion not found in assessment results.');
        }
      })
      .catch(() => setError('Failed to load assessment data.'))
      .finally(() => setLoading(false));
  }, [packId, versionId, criterionId, criterion]);

  const handleBack = () => {
    const scrollY = (location.state as any)?.scrollY ?? 0;
    navigate(`/packs/${packId}/versions/${versionId}/results`, {
      state: { restoreScrollY: scrollY },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !criterion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{error ?? 'Criterion not found.'}</p>
          <button onClick={handleBack} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
            ← Back to Results
          </button>
        </div>
      </div>
    );
  }

  const getStatusStyles = () => {
    switch (criterion.status) {
      case 'meets':
        return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', badge: 'bg-green-100 text-green-800' };
      case 'partial':
        return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' };
      case 'does_not_meet':
        return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', badge: 'bg-red-100 text-red-800' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-900', badge: 'bg-slate-100 text-slate-800' };
    }
  };

  const styles = getStatusStyles();

  const getPriorityBadge = () => {
    switch (criterion.triage?.urgency) {
      case 'CRITICAL_BLOCKER':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded bg-red-100 text-red-800 flex items-center gap-1.5">
            <CircleDotIcon size={10} color="#dc2626" /> CRITICAL BLOCKER
          </span>
        );
      case 'HIGH_PRIORITY':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded bg-amber-100 text-amber-800 flex items-center gap-1.5">
            <CircleDotIcon size={10} color="#f59e0b" /> HIGH PRIORITY
          </span>
        );
      case 'MEDIUM_PRIORITY':
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded bg-blue-100 text-blue-800 flex items-center gap-1.5">
            <CircleDotIcon size={10} color="#3b82f6" /> MEDIUM PRIORITY
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-sm font-semibold rounded bg-slate-100 text-slate-800 flex items-center gap-1.5">
            <CircleDotIcon size={10} color="#64748b" /> LOW PRIORITY
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          ← Back to Results
        </button>

        {/* Header */}
        <div className={`${styles.bg} border-2 ${styles.border} rounded-xl p-6 mb-6`}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-mono px-2 py-1 bg-white border border-slate-300 rounded">
              {criterion.matrix_id}
            </span>
            {getPriorityBadge()}
            {criterion.triage?.blocks_submission && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-red-600 text-white flex items-center gap-1.5">
                <XCircleIcon size={12} color="white" /> BLOCKS SUBMISSION
              </span>
            )}
            {criterion.triage?.quick_win && (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 text-white flex items-center gap-1.5">
                <ZapIcon size={12} color="white" /> QUICK WIN
              </span>
            )}
          </div>
          <h1 className={`text-2xl font-bold ${styles.text} mb-1`}>{criterion.matrix_title}</h1>
          <p className="text-sm text-slate-500">{criterion.category}</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Status */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Status</h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded ${styles.badge}`}>
                {criterion.status.toUpperCase().replace('_', ' ')}
              </span>
              <span className="px-3 py-1 text-sm font-semibold rounded bg-slate-100 text-slate-700">
                Severity: {criterion.severity?.toUpperCase()}
              </span>
            </div>
          </section>

          {/* Regulatory Basis */}
          {criterion.matrix_references && criterion.matrix_references.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Regulatory Basis</h2>
              <div className="flex flex-wrap gap-2">
                {criterion.matrix_references.map(refId => {
                  const ref = resolveRef(refId);
                  return ref.url ? (
                    <a
                      key={refId}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                      title={ref.label}
                    >
                      {ref.shortLabel} ↗
                    </a>
                  ) : (
                    <span
                      key={refId}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded"
                      title={ref.label}
                    >
                      {ref.shortLabel}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Reasoning */}
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assessment Reasoning</h2>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded border border-slate-200">
              {criterion.reasoning}
            </p>
          </section>

          {/* Success Definition */}
          {criterion.success_definition && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Success Criteria</h2>
              <p className="text-sm text-slate-700 leading-relaxed bg-blue-50 p-4 rounded border border-blue-200">
                {criterion.success_definition}
              </p>
            </section>
          )}

          {/* Pack Evidence */}
          {criterion.pack_evidence.found && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pack Evidence</h2>
              {criterion.pack_evidence.quote && (
                <blockquote className="border-l-4 border-indigo-400 pl-4 py-2 mb-4 bg-indigo-50 rounded-r text-sm text-indigo-900 italic">
                  "{criterion.pack_evidence.quote}"
                </blockquote>
              )}
              <div className="text-sm space-y-1 text-slate-700">
                <p><span className="font-medium text-slate-600">Document:</span> {criterion.pack_evidence.document}</p>
                {criterion.pack_evidence.page && (
                  <div className="flex items-center gap-3">
                    <p><span className="font-medium text-slate-600">Page:</span> {criterion.pack_evidence.page}</p>
                    {(criterion as any).pack_evidence_document_id && (
                      <button
                        onClick={() => setPdfViewer({
                          documentId: (criterion as any).pack_evidence_document_id,
                          documentName: criterion.pack_evidence.document ?? 'Document',
                          page: criterion.pack_evidence.page!,
                          quote: criterion.pack_evidence.quote,
                        })}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        View in document →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Gaps Identified */}
          {criterion.gaps_identified.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gaps Identified</h2>
              <ul className="space-y-2">
                {criterion.gaps_identified.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Actions Required */}
          {criterion.actions_required.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions Required</h2>
              <div className="space-y-3">
                {criterion.actions_required.map((action, idx) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-blue-900">{action.owner}</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">{action.effort}</span>
                    </div>
                    <p className="text-sm text-blue-900 mb-2"><strong>Action:</strong> {action.action}</p>
                    <p className="text-sm text-blue-700"><strong>Benefit:</strong> {action.expected_benefit}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Triage */}
          {criterion.triage && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Triage Assessment</h2>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600 font-medium">Action Type:</span>
                    <div className="text-indigo-900 font-semibold mt-1">
                      {criterion.triage.action_type ? criterion.triage.action_type.replace(/_/g, ' ') : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Engagement:</span>
                    <div className="text-indigo-900 font-semibold mt-1">
                      {criterion.triage.engagement_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Quick Win:</span>
                    <div className="text-indigo-900 font-semibold mt-1 flex items-center gap-1.5">
                      {criterion.triage.quick_win
                        ? <><CheckIcon size={14} color="#4f46e5" /> Yes</>
                        : <><XIcon size={14} color="#4f46e5" /> No</>
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Blocks Submission:</span>
                    <div className="text-indigo-900 font-semibold mt-1 flex items-center gap-1.5">
                      {criterion.triage.blocks_submission
                        ? <><XCircleIcon size={14} color="#dc2626" /> Yes</>
                        : <><CheckIcon size={14} color="#16a34a" /> No</>
                      }
                    </div>
                  </div>
                </div>
                {criterion.triage.urgency_reasoning && (
                  <div className="pt-2 border-t border-indigo-200">
                    <span className="text-slate-600 font-medium text-sm">Urgency Reasoning:</span>
                    <p className="text-sm text-indigo-900 mt-1">{criterion.triage.urgency_reasoning}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Confidence */}
          {criterion.confidence && (
            <section className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Confidence Assessment</h2>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                    {criterion.confidence.level}
                  </span>
                  <span className={`text-sm font-semibold flex items-center gap-1.5 ${criterion.confidence.can_system_act ? 'text-green-600' : 'text-amber-600'}`}>
                    {criterion.confidence.can_system_act
                      ? <><CheckIcon size={14} color="#16a34a" /> System can act</>
                      : <><AlertCircleIcon size={14} color="#d97706" /> Human review needed</>
                    }
                  </span>
                </div>
                {criterion.confidence.reasoning && (
                  <p className="text-sm text-purple-900">{criterion.confidence.reasoning}</p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {pdfViewer && (
        <Suspense fallback={null}>
          <PDFViewerModal
            documentId={pdfViewer.documentId}
            documentName={pdfViewer.documentName}
            page={pdfViewer.page}
            quote={pdfViewer.quote}
            onClose={() => setPdfViewer(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
