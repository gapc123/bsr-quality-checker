import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PackStatusBadge from '../components/PackStatusBadge';

interface Pack {
  id: string;
  name: string;
  createdAt: string;
  clientId: string | null;
  status: string;
  client: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  _count: {
    versions: number;
  };
  versions: Array<{
    versionNumber: number;
    createdAt: string;
  }>;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
}

const WORKFLOW_STEPS = [
  {
    number: '1',
    title: 'Upload Client Documents',
    description: 'Add client Gateway 2 pack documents (fire strategy, drawings, etc.)',
    note: 'Supports PDF, Word, and image files',
  },
  {
    number: '2',
    title: 'Run Assessment',
    description: 'AI analysis against 55+ BSR criteria with deterministic checks',
    note: 'Takes 1-2 minutes to complete',
  },
  {
    number: '3',
    title: 'Review & Verify',
    description: 'Review AI findings, verify accuracy, and prepare client deliverables',
    note: 'Export as PDF report or amended documents',
  },
];

const SERVICE_PACKAGES = [
  { value: 'gap_assessment', label: 'Gap Assessment', description: 'Identify compliance gaps and required actions' },
  { value: 'full_pack_prep', label: 'Full Pack Preparation', description: 'Complete submission pack preparation' },
  { value: 'compliance_review', label: 'Compliance Review', description: 'Review and verify existing submission' },
  { value: 'ongoing_support', label: 'Ongoing Support', description: 'Continuous compliance monitoring' },
];

interface Template {
  id: string;
  packageType: string;
  displayName: string;
  description: string;
  estimatedDuration: number;
  taskTemplates: any[];
  milestoneTemplates: any[];
}

export default function PacksList() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServicePackage, setSelectedServicePackage] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [applyTemplateNow, setApplyTemplateNow] = useState(true);
  const [filterClientId, setFilterClientId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchPacks();
    fetchClients();
    fetchTemplates();
  }, [filterClientId]);

  const fetchPacks = async () => {
    try {
      const url = filterClientId ? `/api/packs?clientId=${filterClientId}` : '/api/packs';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPacks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching packs:', error);
      setPacks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    }
  };

  const createPack = async () => {
    if (!newPackName.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      // Create the pack
      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPackName.trim(),
          clientId: selectedClientId || null,
          servicePackage: selectedServicePackage || null,
          requirements: requirements.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to create pack: ${res.statusText}`);
      }

      const pack = await res.json();

      // Apply template if selected and checkbox is checked
      if (selectedTemplate && applyTemplateNow) {
        try {
          const templateRes = await fetch('/api/templates/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId: pack.id,
              packageType: selectedTemplate,
            }),
          });

          if (!templateRes.ok) {
            console.error('Failed to apply template, but pack was created');
            // Don't fail the whole operation if template application fails
          }
        } catch (error) {
          console.error('Error applying template:', error);
          // Don't fail the whole operation if template application fails
        }
      }

      // Reset form and close modal
      setNewPackName('');
      setSelectedClientId('');
      setSelectedServicePackage('');
      setRequirements('');
      setSelectedTemplate('');
      setApplyTemplateNow(true);
      setCreateError(null);
      setShowCreateModal(false);
      fetchPacks();
    } catch (error) {
      console.error('Error creating pack:', error);
      setCreateError(error instanceof Error ? error.message : 'Failed to create pack. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const deletePack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client pack?')) return;

    try {
      await fetch(`/api/packs/${id}`, { method: 'DELETE' });
      fetchPacks();
    } catch (error) {
      console.error('Error deleting pack:', error);
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
      {/* Internal Tool Header */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: '0', background: 'var(--navy)' }} />
        {/* Content */}
        <div style={{ position: 'relative', padding: '32px' }}>
          <div style={{ maxWidth: '768px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--navy)', fontSize: '12px', fontWeight: 600, padding: '4px 12px', letterSpacing: '0.05em' }}>
                INTERNAL TOOL
              </span>
              <span style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--cream)', fontSize: '12px', fontWeight: 600, padding: '4px 12px', letterSpacing: '0.05em', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                GATEWAY 2
              </span>
            </div>
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '30px', color: 'var(--white)', marginBottom: '8px' }}>
              Client Assessment Dashboard
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--cream)', marginBottom: '24px' }}>
              Upload client submission packs, run AI-powered assessments, verify findings, and generate deliverables.
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <svg style={{ width: '20px', height: '20px', color: 'var(--gold)', marginTop: '2px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div style={{ fontSize: '14px', color: 'var(--cream)' }}>
                <strong style={{ color: 'var(--white)' }}>Reminder:</strong> All AI findings must be reviewed and verified before
                including in client deliverables. This tool assists your analysis — final sign-off is your responsibility.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={index} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--navy)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '18px' }}>
                  {step.number}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '16px', color: 'var(--navy)', marginBottom: '4px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>{step.description}</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{step.note}</p>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div style={{ display: 'none' }}>
                  <svg style={{ width: '20px', height: '20px', color: 'var(--beige)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MATRIX ASSESSMENT - QUICK START */}
      <div style={{ background: 'var(--navy)', padding: '32px', marginBottom: '32px', color: 'var(--white)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '28px', height: '28px', color: 'var(--white)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '24px' }}>Matrix Assessment</h2>
                <p style={{ color: 'var(--cream)', fontSize: '14px' }}>AI-Powered BSR Compliance Check (55+ Criteria)</p>
              </div>
            </div>
            <p style={{ color: 'var(--cream)', marginBottom: '16px', fontSize: '18px' }}>
              Upload client documents and run our proprietary Regulatory Success Matrix assessment in 3 simple steps.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Step 1</div>
                <div style={{ fontSize: '14px', color: 'var(--cream)' }}>Create a client pack below</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Step 2</div>
                <div style={{ fontSize: '14px', color: 'var(--cream)' }}>Upload Gateway 2 documents</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Step 3</div>
                <div style={{ fontSize: '14px', color: 'var(--cream)' }}>Run Matrix Assessment</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ flexShrink: 0, background: 'var(--white)', color: 'var(--navy)', padding: '16px 32px', fontWeight: 600, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Assessment
          </button>
        </div>
      </div>

      {/* Client Packs Section */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--beige)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Client Submission Packs</h2>
              <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Create a pack for each client project</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                value={filterClientId || ''}
                onChange={(e) => setFilterClientId(e.target.value || null)}
                style={{ border: '1px solid var(--beige)', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
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
        </div>

        <div style={{ padding: '24px' }}>
          {packs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg style={{ width: '32px', height: '32px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No client packs yet</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '384px', margin: '0 auto 24px' }}>
                Create a pack for your first client to begin their Gateway 2 assessment.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Client Pack
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {packs.map((pack) => (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/packs/${pack.id}`}
                          style={{ fontWeight: 500, color: 'var(--navy)', textDecoration: 'none' }}
                        >
                          {pack.name}
                        </Link>
                        <PackStatusBadge status={pack.status} size="sm" />
                        {pack.client && (
                          <Link
                            to={`/clients/${pack.client.id}`}
                            style={{ fontSize: '12px', background: 'var(--cream)', color: 'var(--navy)', padding: '2px 8px', textDecoration: 'none' }}
                          >
                            {pack.client.name}
                          </Link>
                        )}
                      </div>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--white)', padding: '24px', width: '100%', maxWidth: '448px', margin: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>Create Client Pack</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
              Enter the project name and optionally assign to a client.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '4px' }}>
                  Pack Name <span style={{ color: 'var(--navy)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  placeholder="e.g., Riverside Tower - Gateway 2"
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', outline: 'none' }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createPack()}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '4px' }}>
                  Client (Optional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', outline: 'none' }}
                >
                  <option value="">No client assigned</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}{client.company ? ` (${client.company})` : ''}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                  <Link to="/clients" style={{ color: 'var(--navy)', textDecoration: 'none' }}>Manage clients</Link>
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '4px' }}>
                  Service Package
                </label>
                <select
                  value={selectedServicePackage}
                  onChange={(e) => setSelectedServicePackage(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', outline: 'none' }}
                >
                  <option value="">Select service type...</option>
                  {SERVICE_PACKAGES.map((pkg) => (
                    <option key={pkg.value} value={pkg.value}>
                      {pkg.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '4px' }}>
                  Initial Requirements
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Brief description of the project, key requirements, target dates, etc."
                  rows={3}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', outline: 'none', resize: 'none' }}
                />
              </div>

              {/* Template Selection */}
              <div style={{ borderTop: '1px solid var(--beige)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '4px' }}>
                  Task Template (Optional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '10px 16px', outline: 'none' }}
                >
                  <option value="">No template (create empty pack)</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.packageType}>
                      {template.displayName} ({template.taskTemplates.length} tasks, ~{template.estimatedDuration} days)
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={applyTemplateNow}
                        onChange={(e) => setApplyTemplateNow(e.target.checked)}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                        Apply template now (auto-create {templates.find(t => t.packageType === selectedTemplate)?.taskTemplates.length} tasks with due dates)
                      </span>
                    </label>
                    {templates.find(t => t.packageType === selectedTemplate)?.description && (
                      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                        {templates.find(t => t.packageType === selectedTemplate)?.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {createError && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--cream)', border: '1px solid var(--beige)' }}>
                <p style={{ fontSize: '14px', color: 'var(--navy)' }}>
                  <strong>Error:</strong> {createError}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="btn-ghost"
                style={{ padding: '8px 16px', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={createPack}
                disabled={creating || !newPackName.trim()}
                className="btn-primary"
                style={{ padding: '8px 16px', fontWeight: 500, opacity: (creating || !newPackName.trim()) ? 0.5 : 1 }}
              >
                {creating ? 'Creating...' : 'Create Pack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
