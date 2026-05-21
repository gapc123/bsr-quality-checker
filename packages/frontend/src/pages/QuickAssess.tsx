import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import FileUpload from '../components/FileUpload';
import { sanitizeForFormData } from '../utils/fileUtils';

interface QuickAssessment {
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
  results: any[];
  summary: {
    total: number;
    meets: number;
    partial: number;
    does_not_meet: number;
    not_assessed: number;
  };
}

export default function QuickAssess() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

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
      files.forEach(file => formData.append('documents', sanitizeForFormData(file)));
      formData.append('buildingType', 'residential');
      formData.append('isHRB', 'true');
      formData.append('isLondon', 'false');

      setProgress('Uploading documents…');

      // Start assessment — server responds 202 immediately
      const startRes = await fetch('/api/assess', { method: 'POST', body: formData });
      if (!startRes.ok) {
        let errorMessage = `Upload failed (${startRes.status})`;
        try { const d = await startRes.json(); errorMessage = d.error || errorMessage; } catch { /* ignore */ }
        throw new Error(errorMessage);
      }
      const { assessmentId } = await startRes.json();

      // Poll until done
      setProgress('Running Phase 1: Deterministic Rules (55 checks)…');
      let data: any = null;
      for (let attempt = 0; attempt < 180; attempt++) {  // up to 15 minutes (5s intervals)
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch(`/api/assess/${assessmentId}/status`);
        // 404 in the first 12 attempts (60s) means the job hasn't been written to DB yet
        // (cold start / DB write race). Keep polling rather than failing.
        if (pollRes.status === 404 && attempt < 12) continue;
        if (!pollRes.ok) throw new Error(`Poll failed (${pollRes.status})`);
        const poll = await pollRes.json();
        if (poll.status === 'error') throw new Error(poll.error || 'Assessment failed');
        if (poll.status === 'done') { data = poll; break; }
        // Update progress label from server
        if (poll.progress) setProgress(poll.progress);
      }

      if (!data) throw new Error('Assessment timed out — please try again');

      console.log('Assessment complete:', data.results?.length, 'results');
      setAssessing(false);
      setProgress('');

      // Navigate to full-page results view
      navigate('/assess/results', { state: { assessment: data } });

    } catch (err) {
      setAssessing(false);
      setError(err instanceof Error ? err.message : 'Assessment failed');
      setProgress('');
    }
  };

  return (
    <div style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', padding: '24px', marginBottom: '24px', color: 'var(--white)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '30px', margin: 0 }}>AI-Powered BSR Compliance</h1>
          <span style={{ background: 'var(--gold)', color: 'var(--navy)', padding: '4px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '4px' }}>AI ENABLED</span>
        </div>
        <p style={{ color: 'var(--cream)', fontSize: '18px', lineHeight: '1.6' }}>
          Automated compliance analysis in minutes, not days. Upload documents → AI assessment → Instant reports
        </p>
        <div style={{ marginTop: '16px', background: 'rgba(255, 255, 255, 0.1)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>AI-Powered Analysis</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>Minutes vs Days</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>Auto-Generated Matrices</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--gold)' }}></div>
              <span>55 Compliance Rules</span>
            </div>
          </div>
        </div>
      </div>

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
        <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)', marginBottom: '12px' }}>AI-Powered Automation (Not Manual Review)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'var(--navy)', fontWeight: 600 }}>⚡</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--navy)' }}>AI Document Analysis</p>
              <p>AI extracts requirements, evidence, and gaps automatically - no manual reading required</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'var(--navy)', fontWeight: 600 }}>🧠</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--navy)' }}>Intelligent Compliance Mapping</p>
              <p>AI links every requirement to evidence sources with page numbers and reasoning</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'var(--navy)', fontWeight: 600 }}>📊</span>
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--navy)' }}>Instant Report Generation</p>
              <p>3 submission-ready documents generated in seconds - matrices that take consultants hours to build manually</p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid var(--gold)' }}>
          <p style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 600 }}>
            Traditional consultancies charge £5,000-10,000 for compliance matrices built over weeks. Attlee generates them in minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
