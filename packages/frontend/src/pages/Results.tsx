import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SecurityPanel from '../components/SecurityPanel';
import ActionableChanges from '../components/ActionableChanges';
import CriterionCarousel, { CriterionDecision } from '../components/CriterionCarousel';

interface MatrixUISummary {
  overallStatus: {
    label: string;
    color: string;
    description: string;
  };
  criteria: {
    total: number;
    pass: number;
    partial: number;
    fail: number;
    notAssessed: number;
  };
  severity: {
    high: number;
    medium: number;
    low: number;
  };
  assessmentPhases?: {
    deterministic: {
      totalRules: number;
      passed: number;
      failed: number;
      needsReview: number;
    };
    llmAnalysis: {
      totalCriteria: number;
      assessed: number;
    };
  };
  riskThemes: Array<{
    theme: string;
    fails: number;
    partials: number;
    impact: string;
  }>;
  topActions: Array<{
    action: string;
    owner: string;
    effort: string;
  }>;
  confidence: {
    documentsAnalysed: number;
    referenceAnchorRate: number;
    corpusBackedCriteria: number;
    deterministicRuleCount?: number;
    llmCriteriaCount?: number;
  };
}

interface CriterionResult {
  matrix_id: string;
  matrix_title: string;
  category: string;
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed';
  severity: string;
  reasoning: string;
  success_definition: string;
  pack_evidence: {
    found: boolean;
    document: string | null;
    page: number | null;
    quote: string | null;
  };
  reference_evidence: {
    found: boolean;
    doc_id: string | null;
    doc_title: string | null;
    page: number | null;
    quote: string | null;
  };
  gaps_identified: string[];
  actions_required: Array<{
    action: string;
    owner: string;
    effort: string;
    expected_benefit: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  proposed_change?: string | null;
}

interface AnalysisStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export default function Results() {
  const { packId, versionId } = useParams<{
    packId: string;
    versionId: string;
  }>();

  const [status, setStatus] = useState<AnalysisStatus>({ status: 'pending' });
  const [uiSummary, setUiSummary] = useState<MatrixUISummary | null>(null);
  const [criteriaResults, setCriteriaResults] = useState<CriterionResult[]>([]);
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [packName, setPackName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [versionNumber, setVersionNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showChangesPanel, setShowChangesPanel] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [aiChanges, setAiChanges] = useState<any[]>([]);
  const [humanChanges, setHumanChanges] = useState<any[]>([]);
  const [hasUpdatedReport, setHasUpdatedReport] = useState(false);
  const [showCriteriaDetails, setShowCriteriaDetails] = useState(true); // Show by default
  const [showCarousel, setShowCarousel] = useState(false);
  const [generatingDocuments, setGeneratingDocuments] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState<{
    amendedDocx?: { filename: string; downloadUrl: string };
    amendedPdf?: { filename: string; downloadUrl: string };
    outstandingIssues?: { filename: string; downloadUrl: string };
  } | null>(null);

  useEffect(() => {
    checkStatusAndFetch();
  }, [packId, versionId]);

  const checkStatusAndFetch = async () => {
    try {
      const statusRes = await fetch(
        `/api/packs/${packId}/versions/${versionId}/analyze/status`
      );
      const statusData = await statusRes.json();
      setStatus(statusData);

      if (statusData.status === 'completed') {
        // Fetch actionable changes first, then show modal
        await fetchActionableChanges();
        fetchMatrixReport(true); // Show modal for completed assessments
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setLoading(false);
    }
  };

  const fetchMatrixReport = async (showModal = false) => {
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/matrix-report`
      );
      if (res.ok) {
        const data = await res.json();
        setUiSummary(data.uiSummary);
        setCriteriaResults(data.results || []);
        // Show carousel automatically when assessment completes
        if (showModal && data.results?.some((c: CriterionResult) => c.status !== 'meets' && c.status !== 'not_assessed')) {
          setShowCarousel(true);
        }
      }

      // Also fetch pack info
      const packRes = await fetch(`/api/packs/${packId}`);
      if (packRes.ok) {
        const packData = await packRes.json();
        setPackName(packData.name);
        const version = packData.versions?.find((v: {id: string}) => v.id === versionId);
        if (version) {
          setProjectName(version.projectName || packData.name);
          setVersionNumber(version.versionNumber);
        }
      }
    } catch (error) {
      console.error('Error fetching matrix report:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setStatus({ status: 'running' });
    try {
      await fetch(`/api/packs/${packId}/versions/${versionId}/matrix-assess`, {
        method: 'POST',
      });

      const pollInterval = setInterval(async () => {
        const res = await fetch(
          `/api/packs/${packId}/versions/${versionId}/analyze/status`
        );
        const data = await res.json();
        setStatus(data);

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          fetchMatrixReport(true); // Show carousel automatically
          fetchActionableChanges();
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
        }
      }, 3000);
    } catch (error) {
      console.error('Error starting analysis:', error);
      setStatus({ status: 'failed', error: 'Failed to start analysis' });
    }
  };

  const downloadReport = async (format: 'md' | 'pdf' | 'json') => {
    setDownloading(format);
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/matrix-report/download/${format}`
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setDownloading(null);
    }
  };

  const downloadEditableDocx = async (appliedActions: string[]) => {
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/generate-editable`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appliedActions })
        }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quality-report-editable.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading editable document:', error);
    }
  };

  const fetchActionableChanges = async () => {
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/actionable-changes`
      );
      if (res.ok) {
        const data = await res.json();
        setAiChanges(data.aiChanges || []);
        setHumanChanges(data.humanChanges || []);
        setHasUpdatedReport(data.hasAppliedChanges || false);
      }
    } catch (error) {
      console.error('Error fetching actionable changes:', error);
    }
  };

  const applyChanges = async (selectedIds: string[]) => {
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/apply-changes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedChangeIds: selectedIds })
        }
      );
      if (res.ok) {
        setHasUpdatedReport(true);
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      throw error;
    }
  };

  const handleCarouselComplete = async (decisions: CriterionDecision[]) => {
    setShowCarousel(false);
    setGeneratingDocuments(true);

    const acceptedChanges = decisions
      .filter(d => d.accepted === true && d.proposed_change)
      .map(d => ({
        matrix_id: d.matrix_id,
        proposed_change: d.proposed_change!
      }));

    const skippedCriteriaIds = decisions
      .filter(d => d.accepted === false || d.accepted === null)
      .map(d => d.matrix_id);

    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/generate-amended-documents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acceptedChanges, skippedCriteriaIds })
        }
      );

      if (res.ok) {
        const data = await res.json();
        setGeneratedDocuments(data);
      } else {
        console.error('Failed to generate documents');
      }
    } catch (error) {
      console.error('Error generating amended documents:', error);
    } finally {
      setGeneratingDocuments(false);
    }
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'red': return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600', text: 'text-red-800' };
      case 'amber': return { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-800' };
      case 'green': return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600', text: 'text-emerald-800' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-600', text: 'text-slate-800' };
    }
  };

  const toggleCriterion = (criterionId: string) => {
    setExpandedCriteria(prev => {
      const newSet = new Set(prev);
      if (newSet.has(criterionId)) {
        newSet.delete(criterionId);
      } else {
        newSet.add(criterionId);
      }
      return newSet;
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'meets': return 'bg-emerald-100 text-emerald-700';
      case 'partial': return 'bg-amber-100 text-amber-700';
      case 'does_not_meet': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'meets': return 'Pass';
      case 'partial': return 'Partial';
      case 'does_not_meet': return 'Fail';
      default: return 'N/A';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700';
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getConfidenceClass = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header - Styled like PDF title */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-slate-700">Submission Packs</Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {packName && (
            <>
              <Link to={`/packs/${packId}`} className="hover:text-slate-700">{packName}</Link>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
          <span className="text-slate-900 font-medium">Quality Report</span>
        </nav>
        <div className="relative rounded-xl overflow-hidden shadow-lg">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80')" }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/85 to-blue-900/80" />
          {/* Content */}
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 tracking-wider shadow-md">
                  GATEWAY 2
                </span>
                <h1 className="text-2xl font-light tracking-tight">Quality Assessment Report</h1>
                {projectName && (
                  <p className="text-blue-200 mt-1">{projectName} • Version {versionNumber}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-200">BSR Quality Checker</div>
                <div className="text-xs text-blue-300">Building Safety Act 2022</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending State */}
      {status.status === 'pending' && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider">
            PROPRIETARY ALGORITHM
          </span>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Ready for Quality Assessment</h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            Run our proprietary AI assessment against the <strong>Regulatory Success Matrix</strong>: 55+ deterministic criteria plus LLM analysis, derived from Building Safety Act 2022 and BSR requirements.
          </p>
          <button
            onClick={startAnalysis}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Matrix Assessment
          </button>
        </div>
      )}

      {/* Running State */}
      {status.status === 'running' && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl shadow-lg border border-slate-200 p-12 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-wider animate-pulse">
            PROCESSING
          </span>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Assessment in Progress</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Assessing 55+ deterministic criteria plus LLM analysis against your submission pack.
            This typically takes 2-3 minutes.
          </p>
        </div>
      )}

      {/* Failed State */}
      {status.status === 'failed' && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Assessment Failed</h2>
          <p className="text-slate-600 mb-6">{status.error || 'An unexpected error occurred.'}</p>
          <button
            onClick={startAnalysis}
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Completed State with Summary */}
      {status.status === 'completed' && uiSummary && (
        <div className="space-y-6">
          {/* Overall Status Banner with Score */}
          {(() => {
            const colors = getStatusColor(uiSummary.overallStatus.color);
            const readinessScore = uiSummary.criteria.total > 0
              ? Math.round(((uiSummary.criteria.pass + uiSummary.criteria.partial * 0.5) / uiSummary.criteria.total) * 100)
              : 0;
            return (
              <div className={`rounded-xl border-2 p-6 ${colors.bg} ${colors.border}`}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-1.5 rounded-full text-white text-sm font-bold ${colors.badge}`}>
                        {uiSummary.overallStatus.label.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-white text-sm font-bold">
                        {readinessScore}% Ready
                      </span>
                    </div>
                    <p className={`text-lg font-medium ${colors.text}`}>
                      {uiSummary.overallStatus.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Criteria assessed</p>
                    <p className="text-3xl font-bold text-slate-900">{uiSummary.criteria.total}</p>
                    <p className="text-xs text-slate-400 mt-1">55+ checks via proprietary matrix</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Readiness Score + Quick Stats Grid */}
          <div className="grid grid-cols-6 gap-4">
            {/* Large Readiness Score */}
            <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg">
              <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Regulatory Readiness</p>
              <p className="text-5xl font-bold">
                {uiSummary.criteria.total > 0
                  ? Math.round(((uiSummary.criteria.pass + uiSummary.criteria.partial * 0.5) / uiSummary.criteria.total) * 100)
                  : 0}%
              </p>
              <p className="text-sm opacity-80 mt-2">
                Based on {uiSummary.criteria.total} criteria from our proprietary BSR matrix
              </p>
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${uiSummary.criteria.total > 0 ? Math.round(((uiSummary.criteria.pass + uiSummary.criteria.partial * 0.5) / uiSummary.criteria.total) * 100) : 0}%` }}
                />
              </div>
            </div>
            {/* Pass/Partial/Fail */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-emerald-600">{uiSummary.criteria.pass}</p>
              <p className="text-sm text-emerald-700 mt-1 font-medium">Pass</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-600">{uiSummary.criteria.partial}</p>
              <p className="text-sm text-amber-700 mt-1 font-medium">Partial</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-red-600">{uiSummary.criteria.fail}</p>
              <p className="text-sm text-red-700 mt-1 font-medium">Fail</p>
            </div>
            {/* Severity Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-2">Severity Breakdown</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-600 font-medium">High</span>
                  <span className="text-sm font-bold text-red-600">{uiSummary.severity.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-600 font-medium">Medium</span>
                  <span className="text-sm font-bold text-amber-600">{uiSummary.severity.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600 font-medium">Low</span>
                  <span className="text-sm font-bold text-blue-600">{uiSummary.severity.low || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Phase Assessment Breakdown */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Two-Phase Assessment Engine</h3>
                <p className="text-sm text-slate-300">Your submission was assessed using our proprietary methodology</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phase 1: Deterministic Rules */}
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">PHASE 1</span>
                  <span className="text-sm font-medium">Deterministic Rules</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {uiSummary.assessmentPhases?.deterministic?.totalRules || uiSummary.confidence?.deterministicRuleCount || 55}
                </p>
                <p className="text-sm text-slate-300 mt-1">Explicit if-then criteria checked</p>
                {uiSummary.assessmentPhases?.deterministic && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-500/20 rounded px-2 py-1">
                      <p className="text-lg font-bold text-emerald-400">{uiSummary.assessmentPhases.deterministic.passed}</p>
                      <p className="text-xs text-emerald-300">Pass</p>
                    </div>
                    <div className="bg-red-500/20 rounded px-2 py-1">
                      <p className="text-lg font-bold text-red-400">{uiSummary.assessmentPhases.deterministic.failed}</p>
                      <p className="text-xs text-red-300">Fail</p>
                    </div>
                    <div className="bg-amber-500/20 rounded px-2 py-1">
                      <p className="text-lg font-bold text-amber-400">{uiSummary.assessmentPhases.deterministic.needsReview}</p>
                      <p className="text-xs text-amber-300">Review</p>
                    </div>
                  </div>
                )}
                <div className="mt-3 text-xs text-slate-400">
                  <p>Includes: Fire safety, HRB duties, golden thread, pack completeness</p>
                </div>
              </div>

              {/* Phase 2: LLM Analysis */}
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">PHASE 2</span>
                  <span className="text-sm font-medium">AI Analysis</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {uiSummary.assessmentPhases?.llmAnalysis?.assessed || uiSummary.confidence?.llmCriteriaCount || 0}
                </p>
                <p className="text-sm text-slate-300 mt-1">Nuanced criteria requiring judgement</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Corpus-backed:</span>
                    <span className="font-medium">{Math.round(uiSummary.confidence.referenceAnchorRate * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Documents analysed:</span>
                    <span className="font-medium">{uiSummary.confidence.documentsAnalysed}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  <p>Cross-references regulatory source material for evidence</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
              <p className="text-sm text-slate-300">
                <strong className="text-white">Total criteria assessed:</strong>{' '}
                {(uiSummary.assessmentPhases?.deterministic?.totalRules || 55) + (uiSummary.assessmentPhases?.llmAnalysis?.assessed || 0)}
                {' '}({uiSummary.assessmentPhases?.deterministic?.totalRules || 55} deterministic + {uiSummary.assessmentPhases?.llmAnalysis?.assessed || 0} AI analysis)
              </p>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-300">
                Proprietary BSR Matrix v1.0
              </span>
            </div>
          </div>

          {/* Detailed Criteria Results with Auditability */}
          {criteriaResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowCriteriaDetails(!showCriteriaDetails)}
                className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors border-b border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900">Auditability Details</h3>
                    <p className="text-sm text-slate-500">Click each criterion to see evidence sources and reasoning</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    {criteriaResults.length} criteria
                  </span>
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${showCriteriaDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showCriteriaDetails && (
                <div className="divide-y divide-slate-100">
                  {criteriaResults.map((criterion) => (
                    <div key={criterion.matrix_id} className="border-b border-slate-100 last:border-0">
                      {/* Criterion Header Row */}
                      <button
                        onClick={() => toggleCriterion(criterion.matrix_id)}
                        className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs font-mono text-slate-500 flex-shrink-0">{criterion.matrix_id}</span>
                          <span className="text-sm text-slate-900 truncate">{criterion.matrix_title}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadgeClass(criterion.status)}`}>
                            {getStatusLabel(criterion.status)}
                          </span>
                          {criterion.status !== 'meets' && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityClass(criterion.severity)}`}>
                              {criterion.severity.toUpperCase()}
                            </span>
                          )}
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedCriteria.has(criterion.matrix_id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {expandedCriteria.has(criterion.matrix_id) && (
                        <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Left Column: Assessment Details */}
                            <div className="space-y-4">
                              {/* Reasoning */}
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assessment Reasoning</h4>
                                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                                  {criterion.reasoning || 'No detailed reasoning available for this criterion.'}
                                </p>
                              </div>

                              {/* Confidence */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence:</span>
                                <span className={`text-sm font-medium ${getConfidenceClass(criterion.confidence)}`}>
                                  {criterion.confidence.charAt(0).toUpperCase() + criterion.confidence.slice(1)}
                                </span>
                              </div>

                              {/* Gaps */}
                              {criterion.gaps_identified.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gaps Identified</h4>
                                  <ul className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                    {criterion.gaps_identified.map((gap, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">-</span>
                                        <span>{gap}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Right Column: Evidence Sources */}
                            <div className="space-y-4">
                              {/* Pack Evidence */}
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Evidence from Your Submission
                                </h4>
                                <div className={`text-sm p-3 rounded-lg border ${criterion.pack_evidence.found ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
                                  {criterion.pack_evidence.found ? (
                                    <>
                                      <p className="font-medium text-emerald-800 mb-1">
                                        {criterion.pack_evidence.document}
                                        {criterion.pack_evidence.page && ` (Page ${criterion.pack_evidence.page})`}
                                      </p>
                                      {criterion.pack_evidence.quote && (
                                        <p className="text-emerald-700 italic text-xs border-l-2 border-emerald-300 pl-2">
                                          "{criterion.pack_evidence.quote}"
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-slate-500 italic">No specific evidence found in submission</p>
                                  )}
                                </div>
                              </div>

                              {/* Reference Evidence */}
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  Regulatory Reference
                                </h4>
                                <div className={`text-sm p-3 rounded-lg border ${criterion.reference_evidence.found ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-200'}`}>
                                  {criterion.reference_evidence.found ? (
                                    <>
                                      <p className="font-medium text-blue-800 mb-1">
                                        {criterion.reference_evidence.doc_title}
                                        {criterion.reference_evidence.page && ` (Page ${criterion.reference_evidence.page})`}
                                      </p>
                                      {criterion.reference_evidence.quote && (
                                        <p className="text-blue-700 italic text-xs border-l-2 border-blue-300 pl-2">
                                          "{criterion.reference_evidence.quote}"
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-slate-500 italic">No regulatory reference anchor</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions Required */}
                          {criterion.actions_required.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommended Actions</h4>
                              <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                {criterion.actions_required.map((action, i) => (
                                  <div key={i} className="p-3 flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <p className="text-sm text-slate-900">{action.action}</p>
                                      <p className="text-xs text-slate-500 mt-0.5">{action.expected_benefit}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-xs text-slate-500">{action.owner}</span>
                                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                                        action.effort === 'S' ? 'bg-green-100 text-green-700' :
                                        action.effort === 'M' ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {action.effort}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Two Column Layout: Risk Themes + Top Actions */}
          <div className="grid grid-cols-2 gap-6">
            {/* Risk Themes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <h3 className="font-semibold text-slate-900">Top Risk Themes</h3>
                <p className="text-xs text-slate-500">Areas requiring attention</p>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Theme</th>
                      <th className="pb-2 text-center">Fail</th>
                      <th className="pb-2 text-center">Partial</th>
                      <th className="pb-2">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uiSummary.riskThemes.slice(0, 5).map((theme, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2 font-medium text-slate-900">{theme.theme}</td>
                        <td className="py-2 text-center">
                          <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${theme.fails > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'}`}>
                            {theme.fails}
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${theme.partials > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                            {theme.partials}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500 text-xs">{theme.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <h3 className="font-semibold text-slate-900">If You Do Nothing Else</h3>
                <p className="text-xs text-slate-500">Top 5 priority actions</p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {uiSummary.topActions.slice(0, 5).map((action, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 line-clamp-2">{action.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{action.owner} | Effort: {action.effort}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    20+ actions in full PDF report
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Note */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-slate-600">
                <strong className="text-slate-700">Assessment confidence:</strong> {uiSummary.confidence.documentsAnalysed} documents analysed, {uiSummary.confidence.referenceAnchorRate.toFixed(0)}% of assessments anchored to regulatory references.
                This is a decision-support tool, not a compliance certificate.
              </div>
            </div>
          </div>

          {/* Criteria Carousel Section */}
          {criteriaResults.some(c => c.status !== 'meets' && c.status !== 'not_assessed') && !generatedDocuments && (() => {
            const actionableCriteria = criteriaResults.filter(c => c.status !== 'meets' && c.status !== 'not_assessed');
            const aiActionableCount = actionableCriteria.filter(c => c.proposed_change).length;
            const humanInterventionCount = actionableCriteria.filter(c => !c.proposed_change).length;

            return (
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">Review Assessment Results</h3>

                    {/* Segmented Counts */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* AI Actionable Changes */}
                      <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-lg font-bold text-green-400">AI Actionable Changes: {aiActionableCount}</span>
                        </div>
                        <p className="text-xs text-green-200/80">
                          Text changes AI can apply directly to your documents. Review and accept or reject each proposed change.
                        </p>
                      </div>

                      {/* Human Intervention Required */}
                      <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-lg font-bold text-amber-400">Human Intervention Required: {humanInterventionCount}</span>
                        </div>
                        <p className="text-xs text-amber-200/80">
                          Issues requiring new documents, expert analysis, or evidence. These will be added to your Outstanding Issues Report.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowCarousel(true)}
                        disabled={generatingDocuments}
                        className="px-6 py-3 bg-white text-slate-800 rounded-lg font-semibold hover:bg-slate-100 transition-colors shadow-md flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Review All Items
                      </button>
                      <span className="text-slate-400 text-sm">
                        {aiActionableCount > 0 && `${aiActionableCount} AI changes to review`}
                        {aiActionableCount > 0 && humanInterventionCount > 0 && ' • '}
                        {humanInterventionCount > 0 && `${humanInterventionCount} items for Outstanding Issues Report`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Document Generation Progress */}
          {generatingDocuments && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Generating Your Documents</h3>
                  <p className="text-sm text-slate-600">Applying your approved changes and creating download files...</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Documents Ready */}
          {generatedDocuments && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Your Documents Are Ready</h3>
                  <p className="text-sm text-slate-600">Download your amended submission and review outstanding issues</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Amended Word Doc */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <h4 className="font-semibold text-slate-900">Amended Document</h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Word document with your approved changes. Includes table of contents and explanation of amendments.
                  </p>
                  <a
                    href={generatedDocuments.amendedDocx?.downloadUrl}
                    download={generatedDocuments.amendedDocx?.filename}
                    className="block w-full py-2 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 text-sm"
                  >
                    Download DOCX
                  </a>
                </div>

                {/* PDF Version */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <h4 className="font-semibold text-slate-900">PDF Version</h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Same amended content as PDF for sharing or printing.
                  </p>
                  <a
                    href={generatedDocuments.amendedPdf?.downloadUrl}
                    download={generatedDocuments.amendedPdf?.filename}
                    className="block w-full py-2 bg-slate-700 text-white text-center rounded-lg font-medium hover:bg-slate-800 text-sm"
                  >
                    Download PDF
                  </a>
                </div>

                {/* Outstanding Issues */}
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h4 className="font-semibold text-slate-900">Outstanding Issues</h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Items you skipped that require manual review by your team.
                  </p>
                  <a
                    href={generatedDocuments.outstandingIssues?.downloadUrl}
                    download={generatedDocuments.outstandingIssues?.filename}
                    className="block w-full py-2 bg-amber-500 text-white text-center rounded-lg font-medium hover:bg-amber-600 text-sm"
                  >
                    Download Issues
                  </a>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>What's in each document:</strong> The Amended Document contains your original submission with AI-suggested
                  changes integrated (highlighted in yellow). The Outstanding Issues report lists all criteria you skipped,
                  with full context and recommended actions for your team to address manually.
                </p>
              </div>
            </div>
          )}

          {/* Download Section - Two Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PDF Option */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">PDF Report</h3>
                  <p className="text-slate-300 text-sm mb-3">
                    Final, formatted report with all {uiSummary.criteria.total} criteria and action plan.
                  </p>
                  <button
                    onClick={() => downloadReport('pdf')}
                    disabled={downloading !== null}
                    className="w-full py-2 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    {downloading === 'pdf' ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Editable DOCX Option - Emphasized */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-5 text-white shadow-lg border-2 border-blue-400">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Editable DOCX</h3>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Recommended</span>
                  </div>
                  <p className="text-blue-100 text-sm mb-3">
                    Word document you can edit, with AI changes highlighted in yellow.
                  </p>
                  <button
                    onClick={() => downloadEditableDocx([])}
                    disabled={downloading !== null}
                    className="w-full py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    Download Editable DOCX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Actions Panel */}
          {aiChanges.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowChangesPanel(!showChangesPanel)}
                className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center justify-between hover:from-green-100 hover:to-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Want us to action changes for you?</p>
                    <p className="text-sm text-slate-600">{aiChanges.length} improvements can be applied automatically</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${showChangesPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showChangesPanel && (
                <div className="mt-4">
                  <ActionableChanges
                    aiChanges={aiChanges}
                    humanChanges={humanChanges}
                    onApplyChanges={applyChanges}
                    onDownloadUpdated={() => downloadReport('pdf')}
                    onDownloadEditable={downloadEditableDocx}
                    hasUpdatedReport={hasUpdatedReport}
                    packId={packId || ''}
                    versionId={versionId || ''}
                  />
                </div>
              )}
            </div>
          )}

          {/* Other formats */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-slate-500">Other formats:</span>
            <button
              onClick={() => downloadReport('md')}
              disabled={downloading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              {downloading === 'md' ? '...' : 'Markdown'}
            </button>
            <button
              onClick={() => downloadReport('json')}
              disabled={downloading !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50"
            >
              {downloading === 'json' ? '...' : 'JSON'}
            </button>
          </div>

          {/* Security Panel */}
          <SecurityPanel />

          {/* Disclaimer */}
          <div className="text-center text-sm text-slate-500 py-2">
            <p>
              This report assesses submission quality against regulatory success criteria. It does not determine compliance or guarantee approval.
              Final decisions rest with the Building Safety Regulator.
            </p>
          </div>
        </div>
      )}

      {/* AI Actions Modal */}
      {showChangesModal && aiChanges.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Assessment Complete</h2>
                    <p className="text-green-100">Would you like us to apply improvements?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangesModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <ActionableChanges
                aiChanges={aiChanges}
                humanChanges={humanChanges}
                onApplyChanges={applyChanges}
                onDownloadUpdated={() => {
                  downloadReport('pdf');
                  setShowChangesModal(false);
                }}
                onDownloadEditable={async (selectedIds) => {
                  await downloadEditableDocx(selectedIds);
                  setShowChangesModal(false);
                }}
                hasUpdatedReport={hasUpdatedReport}
                packId={packId || ''}
                versionId={versionId || ''}
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <button
                onClick={() => setShowChangesModal(false)}
                className="w-full py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Skip for now — I'll download the standard report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criterion Carousel Modal */}
      {showCarousel && (
        <CriterionCarousel
          criteria={criteriaResults}
          onComplete={handleCarouselComplete}
          onClose={() => setShowCarousel(false)}
        />
      )}
    </div>
  );
}
