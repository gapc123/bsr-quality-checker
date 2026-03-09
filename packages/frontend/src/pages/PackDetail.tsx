import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AISummary from '../components/AISummary';
import TaskChecklist from '../components/TaskChecklist';
import PackStatusBadge from '../components/PackStatusBadge';
import PackStatusChangeModal from '../components/PackStatusChangeModal';
import PackTimeline from '../components/PackTimeline';

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

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
  status: string;
  assignedTo: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  priority: string;
  blockedByIds: string[];
  tags: string[];
  category: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  _count?: {
    comments: number;
  };
}

interface Pack {
  id: string;
  name: string;
  createdAt: string;
  servicePackage: string | null;
  requirements: string | null;
  client: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  tasks: Task[];
  versions: PackVersion[];
  status: string;
  startedAt: string | null;
  targetCompletionDate: string | null;
  actualCompletionDate: string | null;
  leadAssignee: string | null;
  leadName: string | null;
  milestones: any[] | null;
  statusHistory?: any[];
}

const SERVICE_PACKAGE_LABELS: Record<string, string> = {
  gap_assessment: 'Gap Assessment',
  full_pack_prep: 'Full Pack Preparation',
  compliance_review: 'Compliance Review',
  ongoing_support: 'Ongoing Support',
};

interface Template {
  id: string;
  packageType: string;
  displayName: string;
  description: string;
  estimatedDuration: number;
  taskTemplates: any[];
}

export default function PackDetail() {
  const { packId } = useParams<{ packId: string }>();
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  useEffect(() => {
    fetchPack();
    fetchTemplates();
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

  const applyTemplate = async () => {
    if (!selectedTemplate || !pack) return;

    setApplyingTemplate(true);
    try {
      await fetch('/api/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          packageType: selectedTemplate,
        }),
      });
      setShowApplyTemplateModal(false);
      setSelectedTemplate('');
      await fetchPack();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to apply template');
    } finally {
      setApplyingTemplate(false);
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

  if (!pack) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', background: 'var(--white)', border: '1px solid var(--beige)' }}>
        <div style={{ width: '64px', height: '64px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg style={{ width: '32px', height: '32px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>Submission pack not found</p>
        <Link to="/" style={{ color: 'var(--navy)', fontWeight: 500, textDecoration: 'none' }}>
          Back to Submission Packs
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb Header */}
      <div style={{ marginBottom: '24px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--muted)', marginBottom: '8px' }}>
          <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Submission Packs</Link>
          <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span style={{ color: 'var(--navy)', fontWeight: 500 }}>{pack.name}</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 200, fontSize: '28px', color: 'var(--navy)' }}>{pack.name}</h1>
              <PackStatusBadge status={pack.status} size="md" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', color: 'var(--muted)' }}>
              {pack.client && (
                <Link to={`/clients/${pack.client.id}`} style={{ color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {pack.client.name}
                </Link>
              )}
              {pack.servicePackage && (
                <span style={{ display: 'inline-block', background: 'var(--beige)', color: 'var(--navy)', fontSize: '12px', fontWeight: 500, padding: '2px 8px' }}>
                  {SERVICE_PACKAGE_LABELS[pack.servicePackage] || pack.servicePackage}
                </span>
              )}
              <span style={{ color: 'var(--beige)' }}>|</span>
              <span>
                Created {new Date(pack.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn-ghost"
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Change Status
            </button>
            <Link
              to={`/packs/${packId}/upload`}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload New Version
            </Link>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div style={{ marginBottom: '24px' }}>
        <AISummary entityType="pack" entityId={pack.id} entityName={pack.name} />
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: '24px' }}>
        <PackTimeline
          packId={pack.id}
          packCreatedAt={pack.createdAt}
          startedAt={pack.startedAt}
          targetCompletionDate={pack.targetCompletionDate}
          actualCompletionDate={pack.actualCompletionDate}
        />
      </div>

      {/* Requirements & Task Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {/* Requirements */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px' }}>
          <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '16px', color: 'var(--navy)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: '20px', height: '20px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Initial Requirements
          </h3>
          {pack.requirements ? (
            <p style={{ color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{pack.requirements}</p>
          ) : (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No requirements captured yet</p>
          )}
        </div>

        {/* Task Checklist */}
        {pack.tasks && pack.tasks.length === 0 ? (
          <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '16px', color: 'var(--navy)', marginBottom: '12px' }}>Task Checklist</h3>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <svg style={{ width: '48px', height: '48px', color: 'var(--beige)', margin: '0 auto 12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>No tasks yet. Create tasks manually or apply a template.</p>
              <button
                onClick={() => setShowApplyTemplateModal(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Apply Task Template
              </button>
            </div>
          </div>
        ) : (
          <TaskChecklist packId={pack.id} tasks={pack.tasks || []} onTasksChange={fetchPack} />
        )}
      </div>

      {/* Versions List */}
      {pack.versions.length === 0 ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--beige)', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg style={{ width: '32px', height: '32px', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No documents uploaded yet</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '384px', margin: '0 auto 24px' }}>
            Upload your Gateway 2 submission documents to begin quality analysis.
          </p>
          <Link
            to={`/packs/${packId}/upload`}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Documents
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pack.versions.map((version) => (
            <div
              key={version.id}
              style={{ background: 'var(--white)', border: '1px solid var(--beige)', overflow: 'hidden' }}
            >
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '18px', color: 'var(--navy)' }}>
                        Version {version.versionNumber}
                      </h3>
                      {version._count.issues > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'var(--beige)', color: 'var(--navy)', fontSize: '12px', fontWeight: 500 }}>
                          <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Analysed
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '14px', color: 'var(--muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {version.documents.length} document{version.documents.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ color: 'var(--beige)' }}>|</span>
                      <span>
                        Uploaded {new Date(version.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {version.projectName && (
                        <>
                          <span style={{ color: 'var(--beige)' }}>|</span>
                          <span>{version.projectName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {version._count.issues > 0 ? (
                      <Link
                        to={`/packs/${packId}/versions/${version.id}/results`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--navy)', color: 'var(--white)', padding: '8px 16px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Report
                      </Link>
                    ) : (
                      <Link
                        to={`/packs/${packId}/versions/${version.id}/results`}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Run Quality Check
                      </Link>
                    )}
                  </div>
                </div>

                {/* Documents list */}
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--beige)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '12px' }}>
                    Uploaded Documents
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {version.documents.map((doc) => (
                      <div
                        key={doc.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', background: 'var(--beige)', padding: '10px 12px' }}
                      >
                        <div style={{ width: '32px', height: '32px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg style={{ width: '16px', height: '16px', color: 'var(--navy)' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 500, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            {doc.docType && (
                              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{doc.docType}</span>
                            )}
                            {doc._count?.chunks === 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                                <svg style={{ width: '12px', height: '12px' }} fill="currentColor" viewBox="0 0 20 20">
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

      {/* Status Change Modal */}
      {showStatusModal && (
        <PackStatusChangeModal
          packId={pack.id}
          currentStatus={pack.status}
          onClose={() => setShowStatusModal(false)}
          onStatusChanged={fetchPack}
        />
      )}

      {/* Apply Template Modal */}
      {showApplyTemplateModal && (
        <div style={{ position: 'fixed', inset: '0', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: 'var(--white)', maxWidth: '512px', width: '100%' }}>
            <div style={{ borderBottom: '1px solid var(--beige)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 300, fontSize: '20px', color: 'var(--navy)' }}>Apply Task Template</h2>
              <button
                onClick={() => setShowApplyTemplateModal(false)}
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>
                Choose a template to automatically create tasks with due dates and dependencies.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--navy)', marginBottom: '8px' }}>
                  Select Template <span style={{ color: 'var(--navy)' }}>*</span>
                </label>
                {templates.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Loading templates...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {templates.map((template) => (
                      <label
                        key={template.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '16px',
                          border: selectedTemplate === template.packageType ? '2px solid var(--navy)' : '2px solid var(--beige)',
                          background: selectedTemplate === template.packageType ? 'var(--cream)' : 'var(--white)',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="template"
                          value={template.packageType}
                          checked={selectedTemplate === template.packageType}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          style={{ marginTop: '4px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: 'var(--navy)' }}>{template.displayName}</div>
                          <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>{template.description}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                            {template.taskTemplates.length} tasks • ~{template.estimatedDuration} days
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <div style={{ marginTop: '16px', background: 'var(--cream)', border: '1px solid var(--beige)', padding: '12px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--navy)' }}>
                    <strong>Note:</strong> Tasks will be created with due dates calculated from today,
                    and dependencies will be automatically set up.
                  </p>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--beige)', borderTop: '1px solid var(--beige)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowApplyTemplateModal(false)}
                className="btn-ghost"
                style={{ padding: '8px 16px', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={applyTemplate}
                disabled={!selectedTemplate || applyingTemplate}
                className="btn-primary"
                style={{ padding: '8px 16px', fontWeight: 500, opacity: (!selectedTemplate || applyingTemplate) ? 0.5 : 1 }}
              >
                {applyingTemplate ? 'Applying...' : 'Apply Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
