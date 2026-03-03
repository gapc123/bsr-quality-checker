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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Internal Tool Header */}
      <div className="relative rounded-xl overflow-hidden shadow-lg mb-6">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
        {/* Content */}
        <div className="relative p-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-block bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-full tracking-wider">
                INTERNAL TOOL
              </span>
              <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full tracking-wider border border-blue-500/30">
                GATEWAY 2
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Client Assessment Dashboard
            </h1>
            <p className="text-lg text-slate-300 mb-6">
              Upload client submission packs, run AI-powered assessments, verify findings, and generate deliverables.
            </p>
            <div className="flex items-start gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-slate-300">
                <strong className="text-white">Reminder:</strong> All AI findings must be reviewed and verified before
                including in client deliverables. This tool assists your analysis — final sign-off is your responsibility.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600 mb-1">{step.description}</p>
                <p className="text-xs text-slate-400">{step.note}</p>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="hidden md:flex items-center">
                  <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Methodology Note */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Our Proprietary Assessment Engine</h3>
            <p className="text-sm text-slate-600 mb-3">
              This tool uses our <strong>proprietary Regulatory Success Matrix</strong> with 55+ deterministic checks
              and LLM-powered analysis. Documents are cross-referenced against BSR guidance, Building Regulations,
              and Gateway 2 requirements.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Deterministic rule checks</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Evidence-anchored citations</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No hallucinations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Packs Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Client Submission Packs</h2>
              <p className="text-sm text-slate-500">Create a pack for each client project</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterClientId || ''}
                onChange={(e) => setFilterClientId(e.target.value || null)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Pack
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {packs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No client packs yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Create a pack for your first client to begin their Gateway 2 assessment.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Client Pack
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/packs/${pack.id}`}
                          className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {pack.name}
                        </Link>
                        <PackStatusBadge status={pack.status} size="sm" />
                        {pack.client && (
                          <Link
                            to={`/clients/${pack.client.id}`}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                          >
                            {pack.client.name}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {pack._count.versions} version{pack._count.versions !== 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>Created {new Date(pack.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/packs/${pack.id}/upload`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload
                    </Link>
                    <button
                      onClick={() => deletePack(pack.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete pack"
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
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Create Client Pack</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Enter the project name and optionally assign to a client.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pack Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  placeholder="e.g., Riverside Tower - Gateway 2"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createPack()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Client (Optional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No client assigned</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}{client.company ? ` (${client.company})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  <Link to="/clients" className="text-blue-500 hover:text-blue-600">Manage clients</Link>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service Package
                </label>
                <select
                  value={selectedServicePackage}
                  onChange={(e) => setSelectedServicePackage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Initial Requirements
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Brief description of the project, key requirements, target dates, etc."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Template Selection */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Task Template (Optional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No template (create empty pack)</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.packageType}>
                      {template.displayName} ({template.taskTemplates.length} tasks, ~{template.estimatedDuration} days)
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applyTemplateNow}
                        onChange={(e) => setApplyTemplateNow(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-600">
                        Apply template now (auto-create {templates.find(t => t.packageType === selectedTemplate)?.taskTemplates.length} tasks with due dates)
                      </span>
                    </label>
                    {templates.find(t => t.packageType === selectedTemplate)?.description && (
                      <p className="text-xs text-slate-500 mt-2">
                        {templates.find(t => t.packageType === selectedTemplate)?.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {createError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {createError}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createPack}
                disabled={creating || !newPackName.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
