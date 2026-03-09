import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AISummary from '../components/AISummary';

interface Pack {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    versions: number;
  };
  versions: Array<{
    id: string;
    versionNumber: number;
    createdAt: string;
    matrixAssessment: string | null;
  }>;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  packs: Pack[];
  _count: {
    packs: number;
  };
}

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePackModal, setShowCreatePackModal] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [creatingPack, setCreatingPack] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) {
        navigate('/clients');
        return;
      }
      const data = await res.json();
      console.log('[ClientDetail] Fetched client data:', data);
      console.log('[ClientDetail] Packs with assessments:', data.packs?.map((p: any) => ({
        id: p.id,
        name: p.name,
        hasAssessment: p.versions?.[0]?.matrixAssessment ? 'YES' : 'NO',
        versionId: p.versions?.[0]?.id
      })));
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPack = async () => {
    if (!newPackName.trim()) {
      alert('Please enter a pack name');
      return;
    }

    setCreatingPack(true);
    try {
      console.log('Creating pack:', { name: newPackName.trim(), clientId });
      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPackName.trim(),
          clientId: clientId,
        }),
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const pack = await res.json();
        console.log('Pack created:', pack);
        setNewPackName('');
        setShowCreatePackModal(false);
        fetchClient();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create pack:', errorData);
        alert(`Failed to create pack: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating pack:', error);
      alert(`Error creating pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingPack(false);
    }
  };

  const deletePack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pack?')) return;

    try {
      await fetch(`/api/packs/${id}`, { method: 'DELETE' });
      fetchClient();
    } catch (error) {
      console.error('Error deleting pack:', error);
    }
  };

  const downloadDocuments = async (packId: string, versionId: string) => {
    setDownloadingDocs(versionId);

    try {
      console.log(`[ClientDetail] Downloading documents for pack ${packId}, version ${versionId}`);

      // Download Client Gap Analysis
      const clientGapUrl = `/api/packs/${packId}/versions/${versionId}/saved-assessment/client-gap-analysis`;
      console.log(`[ClientDetail] Fetching client gap analysis from: ${clientGapUrl}`);

      const clientGapRes = await fetch(clientGapUrl);
      console.log(`[ClientDetail] Client gap analysis response status: ${clientGapRes.status}`);

      if (!clientGapRes.ok) {
        const errorText = await clientGapRes.text();
        console.error(`[ClientDetail] Client gap analysis error:`, errorText);
        throw new Error(`Failed to download client gap analysis: ${errorText}`);
      }

      const clientGapBlob = await clientGapRes.blob();
      const clientGapBlobUrl = window.URL.createObjectURL(clientGapBlob);
      const clientGapLink = document.createElement('a');
      clientGapLink.href = clientGapBlobUrl;
      clientGapLink.download = `client-gap-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      clientGapLink.click();
      window.URL.revokeObjectURL(clientGapBlobUrl);

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));

      // Download Consultant Action Plan
      const consultantPlanUrl = `/api/packs/${packId}/versions/${versionId}/saved-assessment/consultant-action-plan`;
      console.log(`[ClientDetail] Fetching consultant action plan from: ${consultantPlanUrl}`);

      const consultantPlanRes = await fetch(consultantPlanUrl);
      console.log(`[ClientDetail] Consultant action plan response status: ${consultantPlanRes.status}`);

      if (!consultantPlanRes.ok) {
        const errorText = await consultantPlanRes.text();
        console.error(`[ClientDetail] Consultant action plan error:`, errorText);
        throw new Error(`Failed to download consultant action plan: ${errorText}`);
      }

      const consultantPlanBlob = await consultantPlanRes.blob();
      const consultantPlanBlobUrl = window.URL.createObjectURL(consultantPlanBlob);
      const consultantPlanLink = document.createElement('a');
      consultantPlanLink.href = consultantPlanBlobUrl;
      consultantPlanLink.download = `consultant-action-plan-${new Date().toISOString().split('T')[0]}.pdf`;
      consultantPlanLink.click();
      window.URL.revokeObjectURL(consultantPlanBlobUrl);

      console.log('Documents downloaded successfully');
    } catch (error) {
      console.error('Error downloading documents:', error);
      alert(`Failed to download documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingDocs(null);
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

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '20px', color: 'var(--navy)' }}>Client not found</h2>
        <Link to="/clients" style={{ color: 'var(--navy)', marginTop: '8px', display: 'inline-block', textDecoration: 'none' }}>
          Back to clients
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <Link to="/clients" style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>
      </div>

      {/* Client Header */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontWeight: 600, fontSize: '24px' }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '28px', color: 'var(--navy)' }}>{client.name}</h1>
              {client.company && (
                <p style={{ color: 'var(--muted)' }}>{client.company}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '14px', color: 'var(--muted)' }}>
                {client.contactEmail && (
                  <a href={`mailto:${client.contactEmail}`} style={{ color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {client.contactEmail}
                  </a>
                )}
                <span>Added {new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'var(--beige)', color: 'var(--navy)', padding: '4px 12px', fontSize: '14px', fontWeight: 500 }}>
              {client._count.packs} pack{client._count.packs !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {client.notes && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--beige)' }}>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{client.notes}</p>
          </div>
        )}
      </div>

      {/* AI Summary */}
      <div style={{ marginBottom: '24px' }}>
        <AISummary entityType="client" entityId={client.id} entityName={client.name} />
      </div>

      {/* Client Packs */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--beige)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Submission Packs</h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>All packs for this client</p>
            </div>
            <button
              onClick={() => setShowCreatePackModal(true)}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Pack
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {client.packs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg style={{ width: '32px', height: '32px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No packs yet</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '384px', margin: '0 auto 24px' }}>
                Create the first submission pack for {client.name}.
              </p>
              <button
                onClick={() => setShowCreatePackModal(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Pack
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {client.packs.map((pack) => (
                <div
                  key={pack.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--beige)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--white)', border: '1px solid var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <Link
                        to={`/packs/${pack.id}`}
                        style={{ fontWeight: 500, color: 'var(--navy)', textDecoration: 'none' }}
                      >
                        {pack.name}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {pack._count.versions} version{pack._count.versions !== 1 ? 's' : ''}
                        </span>
                        <span style={{ color: 'var(--beige)' }}>|</span>
                        <span>Created {new Date(pack.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Show download button if pack has saved assessment */}
                    {pack.versions.length > 0 && pack.versions[0].matrixAssessment && (
                      <button
                        onClick={() => downloadDocuments(pack.id, pack.versions[0].id)}
                        disabled={downloadingDocs === pack.versions[0].id}
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: downloadingDocs === pack.versions[0].id ? 0.5 : 1 }}
                        title="Download assessment reports"
                      >
                        {downloadingDocs === pack.versions[0].id ? (
                          <>
                            <div style={{ width: '16px', height: '16px', border: '2px solid var(--white)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Reports
                          </>
                        )}
                      </button>
                    )}
                    <Link
                      to={`/packs/${pack.id}/upload`}
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload
                    </Link>
                    <button
                      onClick={() => deletePack(pack.id)}
                      style={{ padding: '6px', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Delete pack"
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
      </div>

      {/* Create Pack Modal */}
      {showCreatePackModal && (
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--white)', padding: '24px', width: '100%', maxWidth: '448px', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Create Pack for {client.name}</h2>
              <button
                onClick={() => setShowCreatePackModal(false)}
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              Enter the project name and submission type for this pack.
            </p>
            <input
              type="text"
              value={newPackName}
              onChange={(e) => setNewPackName(e.target.value)}
              placeholder="e.g., Riverside Tower - Gateway 2"
              style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', outline: 'none' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createPack()}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowCreatePackModal(false)}
                className="btn-ghost"
                style={{ padding: '8px 16px', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={createPack}
                disabled={creatingPack || !newPackName.trim()}
                className="btn-primary"
                style={{ padding: '8px 16px', fontWeight: 500, opacity: (creatingPack || !newPackName.trim()) ? 0.5 : 1 }}
              >
                {creatingPack ? 'Creating...' : 'Create Pack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
