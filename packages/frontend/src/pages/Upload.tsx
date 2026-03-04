import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import SecurityPanel from '../components/SecurityPanel';

interface Pack {
  id: string;
  name: string;
}

const RECOMMENDED_DOCS = [
  {
    name: 'Fire Strategy Report',
    benefit: 'Core document for evacuation and fire safety analysis',
    required: true,
  },
  {
    name: 'Architectural Drawings',
    benefit: 'Enables verification of heights, layouts, and escape routes',
    required: true,
  },
  {
    name: 'Structural Drawings/Report',
    benefit: 'Supports cross-referencing of building dimensions',
    required: false,
  },
  {
    name: 'MEP Specification',
    benefit: 'Clarifies smoke control and sprinkler systems',
    required: false,
  },
  {
    name: 'External Wall Schedule',
    benefit: 'Essential for facade and cladding assessment',
    required: true,
  },
  {
    name: 'Risk Assessment',
    benefit: 'Provides context for safety decisions',
    required: false,
  },
];

export default function Upload() {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();

  const [pack, setPack] = useState<Pack | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    projectName: '',
    borough: '',
    buildingType: '',
    height: '',
    storeys: '',
  });

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
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('documents', file);
      });

      Object.entries(metadata).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      const res = await fetch(`/api/packs/${packId}/versions`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const version = await res.json();
        navigate(`/packs/${packId}/versions/${version.id}/results`);
      } else {
        alert('Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  if (!pack) {
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
      {/* Breadcrumb Header */}
      <div style={{ marginBottom: '24px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>
          <Link to="/" style={{ color: 'var(--muted)' }}>Submission Packs</Link>
          <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <Link to={`/packs/${packId}`} style={{ color: 'var(--muted)' }}>{pack.name}</Link>
          <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span style={{ color: 'var(--navy)', fontWeight: 500 }}>Upload Documents</span>
        </nav>
        <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '28px', color: 'var(--navy)' }}>Upload Submission Documents</h1>
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Add your Gateway 2 documents for quality review</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Upload Section */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Document Upload */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '20px', height: '20px', color: 'var(--navy)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Documents</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Upload PDF documents from your submission pack</p>
              </div>
            </div>
            <FileUpload files={files} onFilesSelected={setFiles} />
          </div>

          {/* Project Information */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '20px', height: '20px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Project Information</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Optional — helps provide context for the analysis</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={metadata.projectName}
                  onChange={(e) => setMetadata({ ...metadata, projectName: e.target.value })}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g., Riverside Tower"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
                  Borough / Local Authority
                </label>
                <input
                  type="text"
                  value={metadata.borough}
                  onChange={(e) => setMetadata({ ...metadata, borough: e.target.value })}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g., Tower Hamlets"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
                  Building Type
                </label>
                <input
                  type="text"
                  value={metadata.buildingType}
                  onChange={(e) => setMetadata({ ...metadata, buildingType: e.target.value })}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g., Residential"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
                  Building Height
                </label>
                <input
                  type="text"
                  value={metadata.height}
                  onChange={(e) => setMetadata({ ...metadata, height: e.target.value })}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g., 45m"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '6px' }}>
                  Number of Storeys
                </label>
                <input
                  type="text"
                  value={metadata.storeys}
                  onChange={(e) => setMetadata({ ...metadata, storeys: e.target.value })}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g., 14"
                />
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              to={`/packs/${packId}`}
              style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '14px', textDecoration: 'none' }}
            >
              Cancel
            </Link>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
                opacity: (files.length === 0 || uploading) ? 0.5 : 1
              }}
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
                <>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload {files.length > 0 ? `${files.length} Document${files.length !== 1 ? 's' : ''}` : 'Documents'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px', position: 'sticky', top: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Recommended Documents</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              Include these for the most comprehensive quality review:
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
              {RECOMMENDED_DOCS.map((doc, index) => (
                <li key={index} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {doc.required ? (
                      <div style={{ width: '20px', height: '20px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: '12px', height: '12px', color: 'var(--navy)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div style={{ width: '20px', height: '20px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '6px', height: '6px', background: 'var(--muted)' }}></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy)' }}>
                      {doc.name}
                      {doc.required && <span style={{ color: 'var(--navy)', fontSize: '12px', marginLeft: '6px' }}>Key</span>}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{doc.benefit}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--beige)', border: '1px solid var(--beige)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '4px' }}>Supported formats</h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                PDF documents only. Maximum 50MB per file.
              </p>
            </div>

            {/* Security info */}
            <div style={{ marginTop: '16px' }}>
              <SecurityPanel variant="compact" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
