import { useState } from 'react';
import FileUpload from '../components/FileUpload';

interface AssessmentResult {
  success: boolean;
  assessmentId: string;
  documentsProcessed: number;
  results: {
    criteria: Array<{
      id: string;
      name: string;
      status: 'pass' | 'fail' | 'n/a';
      evidence: string;
      reasoning?: string;
      proposedChanges?: string;
      regulatoryReference?: string;
      phase: 'deterministic' | 'llm';
    }>;
    summary: {
      total: number;
      pass: number;
      fail: number;
      na: number;
      passRate: number;
    };
    phases: {
      deterministic: { description: string; criteriaCount: number };
      llm: { description: string; criteriaCount: number };
    };
  };
}

export default function QuickAssess() {
  const [files, setFiles] = useState<File[]>([]);
  const [assessing, setAssessing] = useState(false);
  const [results, setResults] = useState<AssessmentResult | null>(null);
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
      files.forEach(file => formData.append('documents', file));

      setProgress('Running two-phase assessment (2-5 minutes)...');

      const res = await fetch('/api/assess', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Assessment failed');
      }

      const data = await res.json();
      setAssessing(false);
      setResults(data);
      setProgress('');

    } catch (err) {
      setAssessing(false);
      setError(err instanceof Error ? err.message : 'Assessment failed');
      setProgress('');
    }
  };

  const handleSaveToClient = async () => {
    // TODO: Implement save functionality when database is working
    alert('Save to Client feature coming soon - requires database connection');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">BSR Compliance Assessment</h1>
        <p className="text-blue-100 text-lg">
          Upload Gateway 2 documents → Get instant compliance assessment → Save to client (optional)
        </p>
        <div className="mt-4 bg-blue-800/30 rounded-lg p-4">
          <div className="flex items-center gap-3 text-sm">
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
              <span>Evidence-Based</span>
            </div>
          </div>
        </div>
      </div>

      {!results ? (
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
                Run Assessment (2-5 min)
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
                  <p>LLM enriches findings with reasoning, proposed changes, and regulatory context</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Human Verification Required</p>
                  <p>AI assists, you verify. Every finding cites specific document evidence.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Results View */
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Assessment Complete!</h2>
              <button
                onClick={handleSaveToClient}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save to Client
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{results.results.summary.pass}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{results.results.summary.fail}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-3xl font-bold text-slate-600">{results.results.summary.na}</div>
                <div className="text-sm text-slate-700">N/A</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{results.results.summary.passRate}%</div>
                <div className="text-sm text-blue-700">Pass Rate</div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Assessment Breakdown</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">Phase 1: Deterministic Rules</span>
                  <p className="text-slate-600">{results.results.phases.deterministic.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{results.results.phases.deterministic.criteriaCount} criteria</p>
                </div>
                <div>
                  <span className="font-medium text-purple-600">Phase 2: AI Analysis</span>
                  <p className="text-slate-600">{results.results.phases.llm.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{results.results.phases.llm.criteriaCount} criteria</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Detailed Findings</h3>
            <div className="space-y-3">
              {results.results.criteria.map((criterion, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    criterion.status === 'pass'
                      ? 'bg-green-50 border-green-200'
                      : criterion.status === 'fail'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{criterion.name}</h4>
                      {criterion.regulatoryReference && (
                        <p className="text-xs text-slate-500 mt-1">📘 {criterion.regulatoryReference}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          criterion.status === 'pass'
                            ? 'bg-green-100 text-green-800'
                            : criterion.status === 'fail'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {criterion.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        criterion.phase === 'deterministic'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {criterion.phase === 'deterministic' ? 'Rule-Based' : 'AI-Enhanced'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    <span className="font-medium">Evidence:</span> {criterion.evidence}
                  </p>
                  {criterion.reasoning && (
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">Reasoning:</span> {criterion.reasoning}
                    </p>
                  )}
                  {criterion.proposedChanges && (
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Proposed Changes:</span> {criterion.proposedChanges}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setFiles([]);
                setResults(null);
                setError(null);
              }}
              className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-300 font-medium"
            >
              Run Another Assessment
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
