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
  results: {
    results: Array<{
      matrix_id: string;
      matrix_title: string;
      category: string;
      status: string;
      severity: string;
      reasoning: string;
      evidence: any;
      regulatory_ref: any;
      proposed_changes?: string;
    }>;
    summary: {
      total: number;
      meets: number;
      partial: number;
      does_not_meet: number;
      not_assessed: number;
    };
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">BSR Compliance Assessment</h1>
        <p className="text-blue-100 text-lg">
          Upload documents → Run full two-phase assessment → Review in carousel → Save to client
        </p>
        <div className="mt-4 bg-blue-800/30 rounded-lg p-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>55 Deterministic Rules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>AI-Enhanced Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span>Carousel Review</span>
            </div>
          </div>
        </div>
      </div>

      {!assessment ? (
        <>
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Documents</h2>
            <FileUpload
              files={files}
              onFilesSelected={setFiles}
              multiple={true}
            />
            <p className="text-sm text-slate-500 mt-3">
              Upload fire strategy, drawings, specifications, or any Gateway 2 submission documents
            </p>
          </div>

          {/* Run Assessment Button */}
          <button
            onClick={handleRunAssessment}
            disabled={files.length === 0 || assessing}
            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3 mb-6"
          >
            {assessing ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                {progress || 'Running Assessment...'}
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Run Full Assessment (2-5 min)
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* How it Works */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Two-Phase Assessment Process</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Deterministic Rules Engine</p>
                  <p>55 proprietary if-then rules check explicit BSR requirements with 100% consistency</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">AI-Enhanced Analysis</p>
                  <p>Claude enriches findings with reasoning, proposed changes, and regulatory context</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Carousel Review & Save</p>
                  <p>Navigate criterion-by-criterion in the carousel, then save to a client for record-keeping</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Results View with Carousel */
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Assessment Complete!</h2>
                <p className="text-slate-600 mt-1">
                  {assessment.documentsProcessed} documents analyzed · {assessment.results.summary.total} criteria assessed
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAssessment(null);
                    setFiles([]);
                    setError(null);
                  }}
                  className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 font-medium"
                >
                  New Assessment
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Client
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Component */}
          <CriterionCarousel
            criteria={assessment.results.results}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Save to Client</h3>
            <p className="text-slate-600 mb-6">Create a client and pack to save this assessment for future reference.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Client Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., ABC Development Ltd"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company (optional)</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="e.g., ABC Group"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Riverside Tower Gateway 2"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                disabled={saving}
                className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToClient}
                disabled={saving || !clientName.trim() || !projectName.trim()}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
