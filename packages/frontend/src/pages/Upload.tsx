import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

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
          <Link to={`/packs/${packId}`} className="hover:text-slate-700">{pack.name}</Link>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-slate-900 font-medium">Upload Documents</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Upload Submission Documents</h1>
        <p className="text-slate-600 mt-1">Add your Gateway 2 documents for quality review</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
                <p className="text-sm text-slate-500">Upload PDF documents from your submission pack</p>
              </div>
            </div>
            <FileUpload files={files} onFilesSelected={setFiles} />
          </div>

          {/* Project Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
                <p className="text-sm text-slate-500">Optional — helps provide context for the analysis</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={metadata.projectName}
                  onChange={(e) => setMetadata({ ...metadata, projectName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Riverside Tower"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Borough / Local Authority
                </label>
                <input
                  type="text"
                  value={metadata.borough}
                  onChange={(e) => setMetadata({ ...metadata, borough: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Tower Hamlets"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Building Type
                </label>
                <input
                  type="text"
                  value={metadata.buildingType}
                  onChange={(e) => setMetadata({ ...metadata, buildingType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Residential"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Building Height
                </label>
                <input
                  type="text"
                  value={metadata.height}
                  onChange={(e) => setMetadata({ ...metadata, height: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., 45m"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Number of Storeys
                </label>
                <input
                  type="text"
                  value={metadata.storeys}
                  onChange={(e) => setMetadata({ ...metadata, storeys: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., 14"
                />
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex items-center justify-between">
            <Link
              to={`/packs/${packId}`}
              className="text-slate-600 hover:text-slate-800 font-medium text-sm"
            >
              Cancel
            </Link>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload {files.length > 0 ? `${files.length} Document${files.length !== 1 ? 's' : ''}` : 'Documents'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="text-lg font-semibold text-slate-900">Recommended Documents</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Include these for the most comprehensive quality review:
            </p>
            <ul className="space-y-3">
              {RECOMMENDED_DOCS.map((doc, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {doc.required ? (
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {doc.name}
                      {doc.required && <span className="text-blue-600 text-xs ml-1.5">Key</span>}
                    </p>
                    <p className="text-xs text-slate-500">{doc.benefit}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-sm font-medium text-slate-900 mb-1">Supported formats</h3>
              <p className="text-xs text-slate-500">
                PDF documents only. Maximum 50MB per file.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
