import { useState } from 'react';
import FileUpload from '../components/FileUpload';

export default function MatrixAssessment() {
  const [files, setFiles] = useState<File[]>([]);
  const [assessing, setAssessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAssessment = async () => {
    if (files.length === 0) {
      setError('Please upload at least one document first');
      return;
    }

    setAssessing(true);
    setError(null);

    try {
      // Quick assessment - no database needed
      const formData = new FormData();
      files.forEach(file => formData.append('documents', file));

      const res = await fetch('/api/quick-assess', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Assessment failed');
      }

      const data = await res.json();
      setAssessing(false);
      setResults(data.results);

    } catch (err) {
      setAssessing(false);
      setError(err instanceof Error ? err.message : 'Assessment failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Matrix Assessment</h1>
        <p className="text-blue-100 text-lg">
          Upload your Gateway 2 documents and get instant BSR compliance assessment
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Step 1: Upload Documents</h2>
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
            Running Matrix Assessment (2-5 min)...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Run Matrix Assessment
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

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Assessment Complete!</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-3xl font-bold text-green-600">{results.passCount || 0}</div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-3xl font-bold text-red-600">{results.failCount || 0}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{results.totalCount || 0}</div>
              <div className="text-sm text-blue-700">Total Criteria</div>
            </div>
          </div>
          <p className="text-slate-600 mb-4">
            View detailed results and recommendations in the Packs section.
          </p>
          <button
            onClick={() => {
              setFiles([]);
              setResults(null);
              setError(null);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Run Another Assessment
          </button>
        </div>
      )}

      {/* How it Works */}
      {!results && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">How Matrix Assessment Works</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>✓ <strong>55+ Compliance Criteria</strong> - Deterministic checks + LLM analysis</p>
            <p>✓ <strong>Evidence-Based</strong> - Every finding cites specific document sections</p>
            <p>✓ <strong>2-5 Minutes</strong> - Fast, comprehensive assessment</p>
            <p>✓ <strong>Human Verification Required</strong> - AI assists, you verify</p>
          </div>
        </div>
      )}
    </div>
  );
}
