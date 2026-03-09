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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching butler docs:', error);
      setDocs([]);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--navy)',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '28px', color: 'var(--navy)' }}>Reference Library</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>
          Documents used to cross-check submissions against standards and best practices
        </p>
      </div>

      {/* Info Box */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg style={{ width: '20px', height: '20px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '16px', color: 'var(--navy)', marginBottom: '4px' }}>About the Reference Library</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '12px' }}>
              The reference library contains baseline documents used during quality analysis. When checking
              your submission packs, the system cross-references against these materials to identify gaps
              and inconsistencies.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
              <span style={{ padding: '4px 8px', background: 'var(--beige)', color: 'var(--muted)' }}>Approved Documents</span>
              <span style={{ padding: '4px 8px', background: 'var(--beige)', color: 'var(--muted)' }}>BSR Guidance</span>
              <span style={{ padding: '4px 8px', background: 'var(--beige)', color: 'var(--muted)' }}>British Standards</span>
              <span style={{ padding: '4px 8px', background: 'var(--beige)', color: 'var(--muted)' }}>Best Practice Examples</span>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--beige)', background: 'var(--beige)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '16px', color: 'var(--navy)' }}>Reference Documents</h2>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg style={{ width: '32px', height: '32px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No reference documents yet</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '384px', margin: '0 auto 24px' }}>
              Add reference documents to enable more accurate cross-referencing during quality analysis.
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Document
            </button>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--beige)' }}>
            {docs.map((doc) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--beige)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '20px', height: '20px', color: 'var(--navy)' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--navy)' }}>{doc.filename}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                      {doc.source && <span>{doc.source}</span>}
                      {doc.source && <span style={{ color: 'var(--beige)' }}>|</span>}
                      <span>Added {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {doc._count?.chunks > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--beige)', color: 'var(--navy)', fontSize: '12px', fontWeight: 500 }}>
                      <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Indexed ({doc._count?.chunks} sections)
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--cream)', color: 'var(--muted)', fontSize: '12px', fontWeight: 500 }}>
                      <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Scanned (no text)
                    </span>
                  )}
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    style={{ padding: '6px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    title="Remove document"
                  >
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--white)', padding: '24px', width: '100%', maxWidth: '512px', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Add Reference Document</h2>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setFiles([]);
                  setSource('');
                }}
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              Upload a PDF document to add to the reference library. This will be used for cross-referencing
              during quality analysis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FileUpload
                files={files}
                onFilesSelected={setFiles}
                multiple={false}
              />

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
                  Source Reference (Optional)
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., BS 9991:2015, Approved Document B, CIBSE Guide E"
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', fontSize: '14px', outline: 'none' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                  Add a citation or reference identifier for this document
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setFiles([]);
                  setSource('');
                }}
                className="btn-ghost"
                style={{ padding: '8px 16px', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="btn-primary"
                style={{ padding: '8px 16px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: (files.length === 0 || uploading) ? 0.5 : 1 }}
              >
                {uploading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--white)',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
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
