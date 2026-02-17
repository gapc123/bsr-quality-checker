import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface AnalysisStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

interface ReportSummary {
  packName: string;
  versionNumber: number;
  projectName: string | null;
  documentCount: number;
  fieldCount: number;
  issueCount: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

interface ReportData {
  markdown: string;
  summary: ReportSummary;
}

export default function Results() {
  const { packId, versionId } = useParams<{
    packId: string;
    versionId: string;
  }>();

  const [status, setStatus] = useState<AnalysisStatus>({ status: 'pending' });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

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
        fetchReport();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/report`
      );
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setStatus({ status: 'running' });
    try {
      await fetch(`/api/packs/${packId}/versions/${versionId}/analyze`, {
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
          fetchReport();
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting analysis:', error);
      setStatus({ status: 'failed', error: 'Failed to start analysis' });
    }
  };

  const downloadReport = async (format: 'md' | 'pdf' | 'json') => {
    setDownloading(format);
    try {
      const res = await fetch(
        `/api/packs/${packId}/versions/${versionId}/report/download/${format}`
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

  const getOverallStatus = () => {
    if (!report) return null;
    const { highIssues, mediumIssues } = report.summary;
    if (highIssues > 0) return { label: 'At Risk', color: 'red', description: 'High-priority issues require attention before submission' };
    if (mediumIssues > 2) return { label: 'Needs Review', color: 'amber', description: 'Several items may trigger BSR queries' };
    return { label: 'Likely Reviewable', color: 'green', description: 'No major issues detected in provided documents' };
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
      {/* Breadcrumb Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link to="/" className="hover:text-slate-700">Submission Packs</Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {report && (
            <>
              <Link to={`/packs/${packId}`} className="hover:text-slate-700">{report.summary.packName}</Link>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
          <span className="text-slate-900 font-medium">Quality Report</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quality Analysis Report</h1>
            {report && (
              <p className="text-slate-600 mt-1">
                {report.summary.projectName || report.summary.packName} — Version {report.summary.versionNumber}
              </p>
            )}
          </div>

          {report && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 mr-2">Export:</span>
              <button
                onClick={() => downloadReport('pdf')}
                disabled={downloading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                {downloading === 'pdf' ? 'Exporting...' : 'PDF'}
              </button>
              <button
                onClick={() => downloadReport('md')}
                disabled={downloading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {downloading === 'md' ? 'Exporting...' : 'Markdown'}
              </button>
              <button
                onClick={() => downloadReport('json')}
                disabled={downloading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {downloading === 'json' ? 'Exporting...' : 'JSON'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending State */}
      {status.status === 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Ready for Quality Check</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Your documents have been uploaded. Run the quality analysis to check for
            gaps, inconsistencies, and areas that may trigger BSR queries.
          </p>
          <button
            onClick={startAnalysis}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Run Quality Check
          </button>
        </div>
      )}

      {/* Running State */}
      {status.status === 'running' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Analysis in Progress</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Cross-referencing your documents against BSR requirements and reference materials.
            This typically takes 1-2 minutes depending on the number of documents.
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
          <h2 className="text-xl font-semibold text-red-800 mb-2">Analysis Failed</h2>
          <p className="text-slate-600 mb-6">
            {status.error || 'An unexpected error occurred during analysis.'}
          </p>
          <button
            onClick={startAnalysis}
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Completed State */}
      {status.status === 'completed' && report && (
        <div className="space-y-6">
          {/* Overall Status Card */}
          {(() => {
            const overallStatus = getOverallStatus();
            if (!overallStatus) return null;
            const colorClasses = {
              red: 'bg-red-50 border-red-200 text-red-800',
              amber: 'bg-amber-50 border-amber-200 text-amber-800',
              green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            };
            const badgeClasses = {
              red: 'bg-red-600',
              amber: 'bg-amber-500',
              green: 'bg-emerald-600',
            };
            return (
              <div className={`rounded-xl border p-6 ${colorClasses[overallStatus.color as keyof typeof colorClasses]}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${badgeClasses[overallStatus.color as keyof typeof badgeClasses]}`}>
                      {overallStatus.label}
                    </span>
                    <p className="font-medium">{overallStatus.description}</p>
                  </div>
                  <p className="text-sm opacity-75">
                    Based on {report.summary.documentCount} documents analysed
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-1">Documents Reviewed</p>
              <p className="text-2xl font-bold text-slate-900">{report.summary.documentCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-5">
              <p className="text-sm text-slate-500 mb-1">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{report.summary.highIssues}</p>
              <p className="text-xs text-slate-400 mt-1">Require immediate attention</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-amber-500 p-5">
              <p className="text-sm text-slate-500 mb-1">Medium Priority</p>
              <p className="text-2xl font-bold text-amber-600">{report.summary.mediumIssues}</p>
              <p className="text-xs text-slate-400 mt-1">May trigger queries</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-5">
              <p className="text-sm text-slate-500 mb-1">Low Priority</p>
              <p className="text-2xl font-bold text-blue-600">{report.summary.lowIssues}</p>
              <p className="text-xs text-slate-400 mt-1">Minor improvements</p>
            </div>
          </div>

          {/* Full Report */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Detailed Findings</h2>
            </div>
            <div className="p-8">
              <div className="prose prose-slate prose-sm max-w-none prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-base prose-p:text-slate-600 prose-li:text-slate-600 prose-table:text-sm">
                <ReactMarkdown>{report.markdown}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="text-center text-sm text-slate-500 py-4">
            <p>
              This report assesses document quality and consistency only. It does not constitute
              compliance certification or legal advice. Final compliance determinations are the
              sole responsibility of the Building Safety Regulator.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
