import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Document {
  id: string;
  filename: string;
  docType: string | null;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

interface PackVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  projectName: string | null;
  borough: string | null;
  documents: Document[];
  _count: {
    fields: number;
    issues: number;
  };
}

interface Pack {
  id: string;
  name: string;
  createdAt: string;
  versions: PackVersion[];
}

export default function PackDetail() {
  const { packId } = useParams<{ packId: string }>();
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPack();
  }, [packId]);

  const fetchPack = async () => {
    try {
      const res = await fetch(`/api/packs/${packId}`);
      const data = await res.json();
      setPack(data);
    } catch (error) {
      console.error('Error fetching pack:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-500 mb-4">Submission pack not found</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
          Back to Submission Packs
        </Link>
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
          <span className="text-slate-900 font-medium">{pack.name}</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{pack.name}</h1>
            <p className="text-slate-600 mt-1">
              Created {new Date(pack.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link
            to={`/packs/${packId}/upload`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload New Version
          </Link>
        </div>
      </div>

      {/* Versions List */}
      {pack.versions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-12 px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents uploaded yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Upload your Gateway 2 submission documents to begin quality analysis.
          </p>
          <Link
            to={`/packs/${packId}/upload`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Documents
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pack.versions.map((version) => (
            <div
              key={version.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Version {version.versionNumber}
                      </h3>
                      {version._count.issues > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Analysed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {version.documents.length} document{version.documents.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>
                        Uploaded {new Date(version.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {version.projectName && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>{version.projectName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {version._count.issues > 0 ? (
                      <Link
                        to={`/packs/${packId}/versions/${version.id}/results`}
                        className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Report
                      </Link>
                    ) : (
                      <Link
                        to={`/packs/${packId}/versions/${version.id}/results`}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Run Quality Check
                      </Link>
                    )}
                  </div>
                </div>

                {/* Documents list */}
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Uploaded Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {version.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 text-sm bg-slate-50 rounded-lg px-3 py-2.5"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{doc.filename}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {doc.docType && (
                              <span className="text-xs text-slate-500">{doc.docType}</span>
                            )}
                            {doc._count.chunks === 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Scanned only
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
