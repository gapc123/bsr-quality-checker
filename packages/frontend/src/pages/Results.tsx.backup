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
      // Start the assessment with increased timeout
      const response = await fetch(`/api/packs/${packId}/versions/${versionId}/matrix-assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to start assessment: ${response.statusText}`);
      }

      // Poll for status with maximum duration of 10 minutes
      const maxPollingTime = 600000; // 10 minutes
      const pollInterval = 3000; // 3 seconds
      const startTime = Date.now();

      const pollId = setInterval(async () => {
        try {
          // Check if we've exceeded maximum polling time
          if (Date.now() - startTime > maxPollingTime) {
            clearInterval(pollId);
            setStatus({
              status: 'failed',
              error: 'Assessment timed out after 10 minutes. Please try again or contact support.'
            });
            return;
          }

          const res = await fetch(
            `/api/packs/${packId}/versions/${versionId}/analyze/status`
          );

          if (!res.ok) {
            throw new Error(`Status check failed: ${res.statusText}`);
          }

          const data = await res.json();
          setStatus(data);

          if (data.status === 'completed') {
            clearInterval(pollId);
            fetchMatrixReport(true); // Show carousel automatically
            fetchActionableChanges();
          } else if (data.status === 'failed') {
            clearInterval(pollId);
          }
        } catch (pollError) {
          console.error('Error polling status:', pollError);
          // Don't stop polling on transient errors, just log them
        }
      }, pollInterval);
    } catch (error) {
      console.error('Error starting analysis:', error);
      setStatus({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start analysis'
      });
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
      case 'red': return { bg: { background: '#fee2e2' }, border: { border: '1px solid #fecaca' }, badge: { background: 'var(--navy)' }, text: { color: 'var(--navy)' } };
      case 'amber': return { bg: { background: '#fef3c7' }, border: { border: '1px solid #fde68a' }, badge: { background: 'var(--gold)' }, text: { color: 'var(--navy)' } };
      case 'green': return { bg: { background: '#d1fae5' }, border: { border: '1px solid #a7f3d0' }, badge: { background: '#059669' }, text: { color: '#065f46' } };
      default: return { bg: { background: 'var(--beige)' }, border: { border: '1px solid var(--beige)' }, badge: { background: 'var(--muted)' }, text: { color: 'var(--navy)' } };
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
      case 'meets': return { background: '#d1fae5', color: '#065f46' };
      case 'partial': return { background: '#fef3c7', color: '#92400e' };
      case 'does_not_meet': return { background: '#fee2e2', color: '#991b1b' };
      default: return { background: 'var(--beige)', color: 'var(--muted)' };
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
      case 'high': return { background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b' };
      case 'medium': return { background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' };
      case 'low': return { background: '#dbeafe', border: '1px solid #bfdbfe', color: '#1e40af' };
      default: return { background: 'var(--beige)', border: '1px solid var(--beige)', color: 'var(--muted)' };
    }
  };

  const getConfidenceClass = (confidence: string) => {
    switch (confidence) {
      case 'high': return { color: '#059669' };
      case 'medium': return { color: 'var(--gold)' };
      case 'low': return { color: '#dc2626' };
      default: return { color: 'var(--muted)' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--beige)', borderTop: '2px solid var(--navy)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header - Styled like PDF title */}
      <div style={{ marginBottom: '24px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Submission Packs</Link>
          <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {packName && (
            <>
              <Link to={`/packs/${packId}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>{packName}</Link>
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
          <span style={{ color: 'var(--navy)', fontWeight: 500 }}>Quality Report</span>
        </nav>
        <div style={{ position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          {/* Background Image */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to right, rgba(15, 25, 35, 0.9), rgba(30, 41, 59, 0.85), rgba(30, 58, 138, 0.8))'
          }} />
          {/* Content */}
          <div style={{ position: 'relative', padding: '24px', color: 'var(--white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                  color: 'var(--white)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  marginBottom: '8px',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  GATEWAY 2
                </span>
                <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '24px', letterSpacing: '-0.025em' }}>Quality Assessment Report</h1>
                {projectName && (
                  <p style={{ color: '#bfdbfe', marginTop: '4px' }}>{projectName} • Version {versionNumber}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#bfdbfe' }}>BSR Quality Checker</div>
                <div style={{ fontSize: '12px', color: '#dbeafe' }}>Building Safety Act 2022</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending State */}
      {status.status === 'pending' && (
        <div style={{ background: 'var(--white)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--beige)', padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <svg style={{ width: '40px', height: '40px', color: 'var(--white)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span style={{
            display: 'inline-block',
            background: 'var(--beige)',
            color: 'var(--muted)',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 12px',
            marginBottom: '12px',
            letterSpacing: '0.05em'
          }}>
            PROPRIETARY ALGORITHM
          </span>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '24px', color: 'var(--navy)', marginBottom: '8px' }}>Ready for Quality Assessment</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '32px', maxWidth: '512px', margin: '0 auto 32px' }}>
            Run our proprietary AI assessment against the <strong>Regulatory Success Matrix</strong>: 55+ deterministic criteria plus LLM analysis, derived from Building Safety Act 2022 and BSR requirements.
          </p>
          <button
            onClick={startAnalysis}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(to right, #2563eb, #9333ea)',
              color: 'var(--white)',
              padding: '16px 32px',
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Matrix Assessment
          </button>
        </div>
      )}

      {/* Running State */}
      {status.status === 'running' && (
        <div style={{ background: 'linear-gradient(to bottom right, var(--cream), #dbeafe)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--beige)', padding: '48px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '4px solid var(--beige)' }}></div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '4px solid transparent',
              borderTopColor: '#2563eb',
              borderRightColor: '#9333ea',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              bottom: '12px',
              background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '24px', height: '24px', color: 'var(--white)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <span style={{
            display: 'inline-block',
            background: '#dbeafe',
            color: '#1e40af',
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 12px',
            marginBottom: '12px',
            letterSpacing: '0.05em'
          }}>
            PROCESSING
          </span>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '24px', color: 'var(--navy)', marginBottom: '8px' }}>Assessment in Progress</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '448px', margin: '0 auto' }}>
            Assessing 55+ deterministic criteria plus LLM analysis against your submission pack.
            This typically takes 2-3 minutes.
          </p>
        </div>
      )}

      {/* Failed State */}
      {status.status === 'failed' && (
        <div style={{ background: 'var(--white)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #fecaca', padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg style={{ width: '32px', height: '32px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '20px', color: '#991b1b', marginBottom: '8px' }}>Assessment Failed</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>{status.error || 'An unexpected error occurred.'}</p>
          <button
            onClick={startAnalysis}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--navy)',
              color: 'var(--white)',
              padding: '8px 16px',
              fontWeight: 500
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Completed State with Summary */}
      {status.status === 'completed' && uiSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overall Status Banner with Score */}
          {(() => {
            const colors = getStatusColor(uiSummary.overallStatus.color);
            const readinessScore = uiSummary.criteria.total > 0
              ? Math.round(((uiSummary.criteria.pass + uiSummary.criteria.partial * 0.5) / uiSummary.criteria.total) * 100)
              : 0;
            return (
              <div style={{ ...colors.bg, ...colors.border, padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{
                        padding: '6px 16px',
                        color: 'var(--white)',
                        fontSize: '14px',
                        fontWeight: 700,
                        ...colors.badge
                      }}>
                        {uiSummary.overallStatus.label.toUpperCase()}
                      </span>
                      <span style={{ padding: '4px 12px', background: 'var(--navy)', color: 'var(--white)', fontSize: '14px', fontWeight: 700 }}>
                        {readinessScore}% Ready
                      </span>
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: 500, ...colors.text }}>
                      {uiSummary.overallStatus.description}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Criteria assessed</p>
                    <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--navy)' }}>{uiSummary.criteria.total}</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>55+ checks via proprietary matrix</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Readiness Score + Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
            {/* Large Readiness Score */}
            <div style={{
              gridColumn: 'span 2',
              background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)',
              padding: '20px',
              color: 'var(--white)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, marginBottom: '4px' }}>Regulatory Readiness</p>
              <p style={{ fontSize: '48px', fontWeight: 700 }}>
                {uiSummary.criteria.total > 0
                  ? Math.round(((uiSummary.criteria.pass + uiSummary.criteria.partial * 0.5) / uiSummary.criteria.total) * 100)
                  : 0}%
              </p>
              <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
                Based on {uiSummary.criteria.total} criteria from our proprietary BSR matrix
              </p>
              <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.2)', height: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--white)',
                    transition: 'all 0.3s',
                    width: `${uiSummary.criteria.total > 0 ? Math.round(((uiSummary.criteria.pass + uiSummary.criteria.partial * 0.5) / uiSummary.criteria.total) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
            {/* Pass/Partial/Fail */}
            <div style={{ background: 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)', border: '1px solid #a7f3d0', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#059669' }}>{uiSummary.criteria.pass}</p>
              <p style={{ fontSize: '14px', color: '#065f46', marginTop: '4px', fontWeight: 500 }}>Pass</p>
            </div>
            <div style={{ background: 'linear-gradient(to bottom right, #fef3c7, #fde68a)', border: '1px solid #fde68a', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--gold)' }}>{uiSummary.criteria.partial}</p>
              <p style={{ fontSize: '14px', color: '#92400e', marginTop: '4px', fontWeight: 500 }}>Partial</p>
            </div>
            <div style={{ background: 'linear-gradient(to bottom right, #fee2e2, #fecaca)', border: '1px solid #fecaca', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '30px', fontWeight: 700, color: '#dc2626' }}>{uiSummary.criteria.fail}</p>
              <p style={{ fontSize: '14px', color: '#991b1b', marginTop: '4px', fontWeight: 500 }}>Fail</p>
            </div>
            {/* Severity Summary */}
            <div style={{ background: 'var(--white)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--beige)', padding: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>Severity Breakdown</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>High</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{uiSummary.severity.high}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 500 }}>Medium</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>{uiSummary.severity.medium}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>Low</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>{uiSummary.severity.low || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Phase Assessment Breakdown */}
          <div style={{ background: 'linear-gradient(to right, #0f172a, #312e81)', padding: '24px', color: 'var(--white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '20px', height: '20px', color: 'var(--white)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px' }}>Two-Phase Assessment Engine</h3>
                <p style={{ fontSize: '14px', color: '#cbd5e1' }}>Your submission was assessed using our proprietary methodology</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {/* Phase 1: Deterministic Rules */}
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ background: '#3b82f6', color: 'var(--white)', fontSize: '12px', fontWeight: 700, padding: '2px 8px' }}>PHASE 1</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Deterministic Rules</span>
                </div>
                <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--white)' }}>
                  {uiSummary.assessmentPhases?.deterministic?.totalRules || uiSummary.confidence?.deterministicRuleCount || 55}
                </p>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px' }}>Explicit if-then criteria checked</p>
                {uiSummary.assessmentPhases?.deterministic && (
                  <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px 4px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{uiSummary.assessmentPhases.deterministic.passed}</p>
                      <p style={{ fontSize: '12px', color: '#6ee7b7' }}>Pass</p>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '8px 4px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#f87171' }}>{uiSummary.assessmentPhases.deterministic.failed}</p>
                      <p style={{ fontSize: '12px', color: '#fca5a5' }}>Fail</p>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px 4px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>{uiSummary.assessmentPhases.deterministic.needsReview}</p>
                      <p style={{ fontSize: '12px', color: '#fcd34d' }}>Review</p>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  <p>Includes: Fire safety, HRB duties, golden thread, pack completeness</p>
                </div>
              </div>

              {/* Phase 2: LLM Analysis */}
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ background: '#a855f7', color: 'var(--white)', fontSize: '12px', fontWeight: 700, padding: '2px 8px' }}>PHASE 2</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>AI Analysis</span>
                </div>
                <p style={{ fontSize: '30px', fontWeight: 700, color: 'var(--white)' }}>
                  {uiSummary.assessmentPhases?.llmAnalysis?.assessed || uiSummary.confidence?.llmCriteriaCount || 0}
                </p>
                <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '4px' }}>Nuanced criteria requiring judgement</p>
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#94a3b8' }}>Corpus-backed:</span>
                    <span style={{ fontWeight: 500 }}>{Math.round(uiSummary.confidence.referenceAnchorRate * 100)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#94a3b8' }}>Documents analysed:</span>
                    <span style={{ fontWeight: 500 }}>{uiSummary.confidence.documentsAnalysed}</span>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                  <p>Cross-references regulatory source material for evidence</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
                <strong style={{ color: 'var(--white)' }}>Total criteria assessed:</strong>{' '}
                {(uiSummary.assessmentPhases?.deterministic?.totalRules || 55) + (uiSummary.assessmentPhases?.llmAnalysis?.assessed || 0)}
                {' '}({uiSummary.assessmentPhases?.deterministic?.totalRules || 55} deterministic + {uiSummary.assessmentPhases?.llmAnalysis?.assessed || 0} AI analysis)
              </p>
              <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', color: '#cbd5e1' }}>
                Proprietary BSR Matrix v1.0
              </span>
            </div>
          </div>

          {/* Detailed Criteria Results with Auditability */}
          {criteriaResults.length > 0 && (
            <div style={{ background: 'var(--white)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--beige)', overflow: 'hidden' }}>
              <button
                onClick={() => setShowCriteriaDetails(!showCriteriaDetails)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(to right, #eef2ff, #f3e8ff)',
                  border: 'none',
                  borderBottom: '1px solid #c7d2fe',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#4f46e5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Auditability Details</h3>
                    <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Click each criterion to see evidence sources and reasoning</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', fontWeight: 500 }}>
                    {criteriaResults.length} criteria
                  </span>
                  <svg style={{ width: '20px', height: '20px', color: 'var(--muted)', transform: showCriteriaDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showCriteriaDetails && (
                <div>
                  {criteriaResults.map((criterion) => (
                    <div key={criterion.matrix_id} style={{ borderBottom: '1px solid var(--beige)' }}>
                      {/* Criterion Header Row */}
                      <button
                        onClick={() => toggleCriterion(criterion.matrix_id)}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--muted)', flexShrink: 0 }}>{criterion.matrix_id}</span>
                          <span style={{ fontSize: '14px', color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{criterion.matrix_title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: 500, ...getStatusBadgeClass(criterion.status) }}>
                            {getStatusLabel(criterion.status)}
                          </span>
                          {criterion.status !== 'meets' && (
                            <span style={{ padding: '2px 8px', fontSize: '12px', fontWeight: 500, ...getSeverityClass(criterion.severity) }}>
                              {criterion.severity.toUpperCase()}
                            </span>
                          )}
                          <svg style={{ width: '16px', height: '16px', color: 'var(--muted)', transform: expandedCriteria.has(criterion.matrix_id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {expandedCriteria.has(criterion.matrix_id) && (
                        <div style={{ padding: '0 20px 16px', background: 'var(--cream)', borderTop: '1px solid var(--beige)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            {/* Left Column: Assessment Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {/* Reasoning */}
                              <div>
                                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Assessment Reasoning</h4>
                                <p style={{ fontSize: '14px', color: 'var(--navy)', background: 'var(--white)', padding: '12px', border: '1px solid var(--beige)' }}>
                                  {criterion.reasoning || 'No detailed reasoning available for this criterion.'}
                                </p>
                              </div>

                              {/* Confidence */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence:</span>
                                <span style={{ fontSize: '14px', fontWeight: 500, ...getConfidenceClass(criterion.confidence) }}>
                                  {criterion.confidence.charAt(0).toUpperCase() + criterion.confidence.slice(1)}
                                </span>
                              </div>

                              {/* Gaps */}
                              {criterion.gaps_identified.length > 0 && (
                                <div>
                                  <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Gaps Identified</h4>
                                  <ul style={{ fontSize: '14px', color: 'var(--navy)', background: 'var(--white)', padding: '12px', border: '1px solid var(--beige)', display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', margin: 0 }}>
                                    {criterion.gaps_identified.map((gap, i) => (
                                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <span style={{ color: '#dc2626', marginTop: '2px' }}>-</span>
                                        <span>{gap}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Right Column: Evidence Sources */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {/* Pack Evidence */}
                              <div>
                                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Evidence from Your Submission
                                </h4>
                                <div style={{
                                  fontSize: '14px',
                                  padding: '12px',
                                  border: criterion.pack_evidence.found ? '1px solid #a7f3d0' : '1px solid var(--beige)',
                                  background: criterion.pack_evidence.found ? '#d1fae5' : 'var(--beige)'
                                }}>
                                  {criterion.pack_evidence.found ? (
                                    <>
                                      <p style={{ fontWeight: 500, color: '#065f46', marginBottom: '4px' }}>
                                        {criterion.pack_evidence.document}
                                        {criterion.pack_evidence.page && ` (Page ${criterion.pack_evidence.page})`}
                                      </p>
                                      {criterion.pack_evidence.quote && (
                                        <p style={{ color: '#047857', fontStyle: 'italic', fontSize: '12px', borderLeft: '2px solid #6ee7b7', paddingLeft: '8px' }}>
                                          "{criterion.pack_evidence.quote}"
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No specific evidence found in submission</p>
                                  )}
                                </div>
                              </div>

                              {/* Reference Evidence */}
                              <div>
                                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  Regulatory Reference
                                </h4>
                                <div style={{
                                  fontSize: '14px',
                                  padding: '12px',
                                  border: criterion.reference_evidence.found ? '1px solid #bfdbfe' : '1px solid var(--beige)',
                                  background: criterion.reference_evidence.found ? '#dbeafe' : 'var(--beige)'
                                }}>
                                  {criterion.reference_evidence.found ? (
                                    <>
                                      <p style={{ fontWeight: 500, color: '#1e40af', marginBottom: '4px' }}>
                                        {criterion.reference_evidence.doc_title}
                                        {criterion.reference_evidence.page && ` (Page ${criterion.reference_evidence.page})`}
                                      </p>
                                      {criterion.reference_evidence.quote && (
                                        <p style={{ color: '#1e40af', fontStyle: 'italic', fontSize: '12px', borderLeft: '2px solid #93c5fd', paddingLeft: '8px' }}>
                                          "{criterion.reference_evidence.quote}"
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No regulatory reference anchor</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions Required */}
                          {criterion.actions_required.length > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Recommended Actions</h4>
                              <div style={{ background: 'var(--white)', border: '1px solid var(--beige)' }}>
                                {criterion.actions_required.map((action, i) => (
                                  <div key={i} style={{ padding: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', borderTop: i > 0 ? '1px solid var(--beige)' : 'none' }}>
                                    <div style={{ flex: 1 }}>
                                      <p style={{ fontSize: '14px', color: 'var(--navy)' }}>{action.action}</p>
                                      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{action.expected_benefit}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{action.owner}</span>
                                      <span style={{
                                        padding: '2px 6px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        background: action.effort === 'S' ? '#d1fae5' : action.effort === 'M' ? '#fef3c7' : '#fee2e2',
                                        color: action.effort === 'S' ? '#065f46' : action.effort === 'M' ? '#92400e' : '#991b1b'
                                      }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Risk Themes */}
            <div style={{ background: 'var(--white)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--beige)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--beige)', background: 'linear-gradient(to right, var(--cream), var(--beige))' }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Top Risk Themes</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Areas requiring attention</p>
              </div>
              <div style={{ padding: '16px' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={{ paddingBottom: '8px' }}>Theme</th>
                      <th style={{ paddingBottom: '8px', textAlign: 'center' }}>Fail</th>
                      <th style={{ paddingBottom: '8px', textAlign: 'center' }}>Partial</th>
                      <th style={{ paddingBottom: '8px' }}>Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uiSummary.riskThemes.slice(0, 5).map((theme, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--beige)' }}>
                        <td style={{ padding: '8px 0', fontWeight: 500, color: 'var(--navy)' }}>{theme.theme}</td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            width: '24px',
                            height: '24px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: theme.fails > 0 ? '#fee2e2' : 'var(--beige)',
                            color: theme.fails > 0 ? '#991b1b' : 'var(--muted)'
                          }}>
                            {theme.fails}
                          </span>
                        </td>
                        <td style={{ padding: '8px 0', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            width: '24px',
                            height: '24px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: theme.partials > 0 ? '#fef3c7' : 'var(--beige)',
                            color: theme.partials > 0 ? '#92400e' : 'var(--muted)'
                          }}>
                            {theme.partials}
                          </span>
                        </td>
                        <td style={{ padding: '8px 0', color: 'var(--muted)', fontSize: '12px' }}>{theme.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Actions */}
            <div style={{ background: 'var(--white)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--beige)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--beige)', background: 'linear-gradient(to right, var(--cream), var(--beige))' }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>If You Do Nothing Else</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Top 5 priority actions</p>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uiSummary.topActions.slice(0, 5).map((action, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{
                        flexShrink: 0,
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(to right, #dc2626, #ef4444)',
                        color: 'var(--white)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', color: 'var(--navy)' }}>{action.action}</p>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{action.owner} | Effort: {action.effort}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--beige)', textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    <svg style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px', marginTop: '-2px' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    20+ actions in full PDF report
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Note */}
          <div style={{ background: 'var(--cream)', border: '1px solid var(--beige)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--muted)', marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--navy)' }}>Assessment confidence:</strong> {uiSummary.confidence.documentsAnalysed} documents analysed, {uiSummary.confidence.referenceAnchorRate.toFixed(0)}% of assessments anchored to regulatory references.
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
              <div style={{ background: 'linear-gradient(to right, #1e293b, #0f172a)', padding: '24px', color: 'var(--white)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg style={{ width: '28px', height: '28px', color: 'var(--white)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '20px', marginBottom: '12px' }}>Review Assessment Results</h3>

                    {/* Segmented Counts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      {/* AI Actionable Changes */}
                      <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '20px', height: '20px', color: '#4ade80' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>AI Actionable Changes: {aiActionableCount}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(187, 247, 208, 0.8)' }}>
                          Text changes AI can apply directly to your documents. Review and accept or reject each proposed change.
                        </p>
                      </div>

                      {/* Human Intervention Required */}
                      <div style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <svg style={{ width: '20px', height: '20px', color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24' }}>Human Intervention Required: {humanInterventionCount}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(254, 243, 199, 0.8)' }}>
                          Issues requiring new documents, expert analysis, or evidence. These will be added to your Outstanding Issues Report.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button
                        onClick={() => setShowCarousel(true)}
                        disabled={generatingDocuments}
                        className="btn-primary"
                        style={{
                          padding: '12px 24px',
                          background: 'var(--white)',
                          color: 'var(--navy)',
                          fontWeight: 600,
                          transition: 'background 0.2s',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Review All Items
                      </button>
                      <span style={{ color: '#94a3b8', fontSize: '14px' }}>
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
            <div style={{ background: 'linear-gradient(to right, #eff6ff, #eef2ff)', border: '1px solid #bfdbfe', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '24px', height: '24px', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Generating Your Documents</h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Applying your approved changes and creating download files...</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Documents Ready */}
          {generatedDocuments && (
            <div style={{ background: 'linear-gradient(to right, #f0fdf4, #d1fae5)', border: '2px solid #86efac', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: '20px', height: '20px', color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Your Documents Are Ready</h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Download your amended submission and review outstanding issues</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* Amended Word Doc */}
                <div style={{ background: 'var(--white)', padding: '16px', border: '1px solid #86efac' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#2563eb' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <h4 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Amended Document</h4>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                    Word document with your approved changes. Includes table of contents and explanation of amendments.
                  </p>
                  <a
                    href={generatedDocuments.amendedDocx?.downloadUrl}
                    download={generatedDocuments.amendedDocx?.filename}
                    className="btn-primary"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      background: '#2563eb',
                      color: 'var(--white)',
                      textAlign: 'center',
                      fontWeight: 500,
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                  >
                    Download DOCX
                  </a>
                </div>

                {/* PDF Version */}
                <div style={{ background: 'var(--white)', padding: '16px', border: '1px solid #86efac' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <h4 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>PDF Version</h4>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                    Same amended content as PDF for sharing or printing.
                  </p>
                  <a
                    href={generatedDocuments.amendedPdf?.downloadUrl}
                    download={generatedDocuments.amendedPdf?.filename}
                    className="btn-primary"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      background: 'var(--navy)',
                      color: 'var(--white)',
                      textAlign: 'center',
                      fontWeight: 500,
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                  >
                    Download PDF
                  </a>
                </div>

                {/* Outstanding Issues */}
                <div style={{ background: 'var(--white)', padding: '16px', border: '1px solid #fcd34d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg style={{ width: '20px', height: '20px', color: 'var(--gold)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h4 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Outstanding Issues</h4>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                    Items you skipped that require manual review by your team.
                  </p>
                  <a
                    href={generatedDocuments.outstandingIssues?.downloadUrl}
                    download={generatedDocuments.outstandingIssues?.filename}
                    className="btn-primary"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px',
                      background: 'var(--gold)',
                      color: 'var(--white)',
                      textAlign: 'center',
                      fontWeight: 500,
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                  >
                    Download Issues
                  </a>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: '#dbeafe', border: '1px solid #bfdbfe' }}>
                <p style={{ fontSize: '12px', color: '#1e40af' }}>
                  <strong>What's in each document:</strong> The Amended Document contains your original submission with AI-suggested
                  changes integrated (highlighted in yellow). The Outstanding Issues report lists all criteria you skipped,
                  with full context and recommended actions for your team to address manually.
                </p>
              </div>
            </div>
          )}

          {/* Download Section - Two Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* PDF Option */}
            <div style={{ background: 'linear-gradient(to right, #334155, #1e293b)', padding: '20px', color: 'var(--white)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: '24px', height: '24px', color: 'var(--white)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, marginBottom: '4px' }}>PDF Report</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '12px' }}>
                    Final, formatted report with all {uiSummary.criteria.total} criteria and action plan.
                  </p>
                  <button
                    onClick={() => downloadReport('pdf')}
                    disabled={downloading !== null}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--white)',
                      color: 'var(--navy)',
                      fontWeight: 500,
                      transition: 'background 0.2s'
                    }}
                  >
                    {downloading === 'pdf' ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Editable DOCX Option - Emphasized */}
            <div style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)', padding: '20px', color: 'var(--white)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '2px solid #60a5fa' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: '24px', height: '24px', color: 'var(--white)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>Editable DOCX</h3>
                    <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px' }}>Recommended</span>
                  </div>
                  <p style={{ color: '#dbeafe', fontSize: '14px', marginBottom: '12px' }}>
                    Word document you can edit, with AI changes highlighted in yellow.
                  </p>
                  <button
                    onClick={() => downloadEditableDocx([])}
                    disabled={downloading !== null}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--white)',
                      color: '#1e40af',
                      fontWeight: 500,
                      transition: 'background 0.2s'
                    }}
                  >
                    Download Editable DOCX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Actions Panel */}
          {aiChanges.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={() => setShowChangesPanel(!showChangesPanel)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(to right, #f0fdf4, #d1fae5)',
                  border: '1px solid #86efac',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, color: 'var(--navy)' }}>Want us to action changes for you?</p>
                    <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{aiChanges.length} improvements can be applied automatically</p>
                  </div>
                </div>
                <svg style={{ width: '20px', height: '20px', color: 'var(--muted)', transform: showChangesPanel ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showChangesPanel && (
                <div style={{ marginTop: '16px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', fontSize: '14px' }}>
            <span style={{ color: 'var(--muted)' }}>Other formats:</span>
            <button
              onClick={() => downloadReport('md')}
              disabled={downloading !== null}
              className="btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--white)',
                border: '1px solid var(--beige)',
                fontWeight: 500,
                color: 'var(--muted)',
                transition: 'border 0.2s'
              }}
            >
              {downloading === 'md' ? '...' : 'Markdown'}
            </button>
            <button
              onClick={() => downloadReport('json')}
              disabled={downloading !== null}
              className="btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--white)',
                border: '1px solid var(--beige)',
                fontWeight: 500,
                color: 'var(--muted)',
                transition: 'border 0.2s'
              }}
            >
              {downloading === 'json' ? '...' : 'JSON'}
            </button>
          </div>

          {/* Security Panel */}
          <SecurityPanel />

          {/* Disclaimer */}
          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', padding: '8px 0' }}>
            <p>
              This report assesses submission quality against regulatory success criteria. It does not determine compliance or guarantee approval.
              Final decisions rest with the Building Safety Regulator.
            </p>
          </div>
        </div>
      )}

      {/* AI Actions Modal */}
      {showChangesModal && aiChanges.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'var(--white)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '672px', width: '100%', maxHeight: '90vh', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(to right, #059669, #10b981)', padding: '24px', color: 'var(--white)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '20px' }}>Assessment Complete</h2>
                    <p style={{ color: '#d1fae5' }}>Would you like us to apply improvements?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangesModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '60vh' }}>
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
            <div style={{ borderTop: '1px solid var(--beige)', padding: '16px', background: 'var(--cream)' }}>
              <button
                onClick={() => setShowChangesModal(false)}
                style={{
                  width: '100%',
                  padding: '8px',
                  color: 'var(--muted)',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
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
