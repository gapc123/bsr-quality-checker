import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import CriterionCarousel from '../components/CriterionCarousel';

interface FullAssessment {
  success: boolean;
  assessmentId: string;
  documentsProcessed: number;
  context: {
    isLondon: boolean;
    isHRB: boolean;
    buildingType: string;
    heightMeters: number | null;
    storeys: number | null;
  };
  results: Array<{
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
        effort: 'S' | 'M' | 'L';
        expected_benefit: string;
      }>;
      confidence: 'high' | 'medium' | 'low';
      proposed_change?: string | null;
      proposed_change_source?: string | null;
    }>;
  summary: {
    total: number;
    meets: number;
    partial: number;
    does_not_meet: number;
    not_assessed: number;
  };
}

export default function QuickAssess() {
  const [files, setFiles] = useState<File[]>([]);
  const [assessing, setAssessing] = useState(false);
  const [assessment, setAssessment] = useState<FullAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRunAssessment = async () => {
    if (files.length === 0) {
      setError('Please upload at least one document first');
      return;
    }

    setAssessing(true);
    setError(null);
    setProgress('Uploading documents...');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('documents', file));

      // Add default context (can be enhanced with form inputs)
      formData.append('buildingType', 'residential');
      formData.append('isHRB', 'true');
      formData.append('isLondon', 'false');

      setProgress('Running Phase 1: Deterministic Rules (55 checks)...');

      const res = await fetch('/api/assess', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Assessment failed');
      }

      setProgress('Running Phase 2: LLM Enrichment...');

      const data = await res.json();
      setAssessing(false);
      setAssessment(data);
      setProgress('');

    } catch (err) {
      setAssessing(false);
      setError(err instanceof Error ? err.message : 'Assessment failed');
      setProgress('');
    }
  };

  const handleSaveToClient = async () => {
    if (!clientName.trim() || !projectName.trim()) {
      alert('Please provide both client name and project name');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/assess/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: assessment!.assessmentId,
          clientName: clientName.trim(),
          projectName: projectName.trim(),
          clientCompany: clientCompany.trim() || null
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await res.json();
      alert(`✅ Saved! Client: ${data.client.name}, Pack: ${data.pack.name}`);
      setShowSaveDialog(false);

      // Optionally redirect to the pack
      window.location.href = `/packs/${data.pack.id}`;

    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '32px', marginBottom: '32px', color: 'var(--white)' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '30px', marginBottom: '8px' }}>BSR Compliance Assessment</h1>
        <p style={{ color: 'var(--cream)', fontSize: '18px', lineHeight: '1.6' }}>
          Upload documents → Run full two-phase assessment → Review in carousel → Save to client
        </p>
        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.1)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>55 Deterministic Rules</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>AI-Enhanced Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>Carousel Review</span>
            </div>
          </div>
        </div>
      </div>

      {!assessment ? (
        <>
          {/* Upload Section */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '32px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '20px', color: 'var(--navy)', marginBottom: '16px' }}>Upload Documents</h2>
            <FileUpload
              files={files}
              onFilesSelected={setFiles}
              multiple={true}
            />
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '12px' }}>
              Upload fire strategy, drawings, specifications, or any Gateway 2 submission documents
            </p>
          </div>

          {/* Run Assessment Button */}
          <button
            onClick={handleRunAssessment}
            disabled={files.length === 0 || assessing}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              opacity: files.length === 0 || assessing ? 0.5 : 1,
              cursor: files.length === 0 || assessing ? 'not-allowed' : 'pointer'
            }}
          >
            {assessing ? (
              <>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--white)',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                {progress || 'Running Assessment...'}
              </>
            ) : (
              <>
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Run Full Assessment (2-5 min)
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div style={{ background: 'var(--cream)', border: '1px solid var(--beige)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg style={{ width: '20px', height: '20px', color: 'var(--navy)', marginTop: '2px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--navy)' }}>Error</p>
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* How it Works */}
          <div style={{ background: 'var(--beige)', border: '1px solid var(--beige)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)', marginBottom: '12px' }}>Two-Phase Assessment Process</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--navy)', fontWeight: 600 }}>1</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--navy)' }}>Deterministic Rules Engine</p>
                  <p>55 proprietary if-then rules check explicit BSR requirements with 100% consistency</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--navy)', fontWeight: 600 }}>2</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--navy)' }}>AI-Enhanced Analysis</p>
                  <p>Claude enriches findings with reasoning, proposed changes, and regulatory context</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--navy)', fontWeight: 600 }}>✓</span>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--navy)' }}>Carousel Review & Save</p>
                  <p>Navigate criterion-by-criterion in the carousel, then save to a client for record-keeping</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Results View with Carousel */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Action Bar */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '28px', color: 'var(--navy)' }}>Assessment Complete!</h2>
                <p style={{ color: 'var(--muted)', marginTop: '4px' }}>
                  {assessment.documentsProcessed} documents analyzed · {assessment.summary.total} criteria assessed
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setAssessment(null);
                    setFiles([]);
                    setError(null);
                  }}
                  className="btn-ghost"
                  style={{ padding: '12px 24px', fontWeight: 500 }}
                >
                  New Assessment
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Client
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Component */}
          <CriterionCarousel
            criteria={assessment.results}
            onComplete={(decisions) => {
              console.log('Carousel decisions:', decisions);
              // Optionally update assessment with user decisions
            }}
            onClose={() => {
              // Carousel closed, could show summary or return to upload
            }}
          />
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--white)', padding: '32px', maxWidth: '448px', width: '100%', margin: '16px' }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '24px', color: 'var(--navy)', marginBottom: '16px' }}>Save to Client</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>Create a client and pack to save this assessment for future reference.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '8px' }}>Client Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., ABC Development Ltd"
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--beige)', color: 'var(--navy)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '8px' }}>Company (optional)</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g., ABC Group"
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--beige)', color: 'var(--navy)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '8px' }}>Project Name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Riverside Tower Gateway 2"
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--beige)', color: 'var(--navy)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                disabled={saving}
                className="btn-ghost"
                style={{ flex: 1, padding: '12px 24px', fontWeight: 500, opacity: saving ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToClient}
                disabled={saving || !clientName.trim() || !projectName.trim()}
                className="btn-primary"
                style={{ flex: 1, padding: '12px 24px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (saving || !clientName.trim() || !projectName.trim()) ? 0.5 : 1 }}
              >
                {saving ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid var(--white)',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
