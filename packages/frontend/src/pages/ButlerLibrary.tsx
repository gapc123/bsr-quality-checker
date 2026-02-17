import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';

interface ButlerDoc {
  id: string;
  filename: string;
  docType: string | null;
  source: string | null;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

export default function ButlerLibrary() {
  const [docs, setDocs] = useState<ButlerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [source, setSource] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/butler');
      const data = await res.json();
      setDocs(data);
    } catch (error) {
      console.error('Error fetching butler docs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', files[0]);
      if (source) {
        formData.append('source', source);
      }

      const res = await fetch('/api/butler', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setFiles([]);
        setSource('');
        setShowUpload(false);
        fetchDocs();
      } else {
        alert('Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Are you sure you want to remove this reference document?')) return;

    try {
      await fetch(`/api/butler/${id}`, { method: 'DELETE' });
      fetchDocs();
    } catch (error) {
      console.error('Error deleting document:', error);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reference Library</h1>
        <p className="text-slate-600 mt-1">
          Documents used to cross-check submissions against standards and best practices
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">About the Reference Library</h3>
            <p className="text-sm text-slate-600 mb-3">
              The reference library contains baseline documents used during quality analysis. When checking
              your submission packs, the system cross-references against these materials to identify gaps
              and inconsistencies.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">Approved Documents</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">BSR Guidance</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">British Standards</span>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">Best Practice Examples</span>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Reference Documents</h2>
            <span className="text-sm text-slate-500">{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No reference documents yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Add reference documents to enable more accurate cross-referencing during quality analysis.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Document
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{doc.filename}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      {doc.source && <span>{doc.source}</span>}
                      {doc.source && <span className="text-slate-300">|</span>}
                      <span>Added {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {doc._count.chunks > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Indexed ({doc._count.chunks} sections)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Scanned (no text)
                    </span>
                  )}
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove document"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Add Reference Document</h2>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setFiles([]);
                  setSource('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Upload a PDF document to add to the reference library. This will be used for cross-referencing
              during quality analysis.
            </p>

            <div className="space-y-4">
              <FileUpload
                files={files}
                onFilesSelected={setFiles}
                multiple={false}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Source Reference (Optional)
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., BS 9991:2015, Approved Document B, CIBSE Guide E"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Add a citation or reference identifier for this document
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpload(false);
                  setFiles([]);
                  setSource('');
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  'Add Document'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
