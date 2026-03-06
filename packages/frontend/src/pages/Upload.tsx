import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UploadWizard from '../components/UploadWizard';
import type { ProjectContext } from '../components/ProjectContextForm';
import type { UploadedDocument } from '../components/DocumentUploadZone';

interface Pack {
  id: string;
  name: string;
}

export default function Upload() {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();

  const [pack, setPack] = useState<Pack | null>(null);

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

  const handleWizardComplete = async (context: ProjectContext, documents: UploadedDocument[]) => {
    try {
      const formData = new FormData();

      // Add all document files
      documents.forEach((doc) => {
        formData.append('documents', doc.file);
      });

      // Add project context as metadata
      formData.append('projectName', context.projectName);
      if (context.projectReference) {
        formData.append('projectReference', context.projectReference);
      }
      formData.append('buildingType', context.buildingType);
      if (context.heightMeters !== null) {
        formData.append('height', context.heightMeters.toString());
      }
      if (context.storeys !== null) {
        formData.append('storeys', context.storeys.toString());
      }
      formData.append('isLondon', context.isLondon.toString());
      formData.append('isHRB', context.isHRB.toString());

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
    }
  };

  const handleCancel = () => {
    navigate(`/packs/${packId}`);
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
      <div style={{ marginBottom: '32px' }}>
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
        <p style={{ color: 'var(--muted)', marginTop: '4px' }}>Guided upload with smart validation and real-time feedback</p>
      </div>

      {/* New Upload Wizard */}
      <UploadWizard
        onComplete={handleWizardComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
