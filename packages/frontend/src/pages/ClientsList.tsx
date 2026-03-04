import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  company: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  _count: {
    packs: number;
  };
}

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contactEmail: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error('API returned non-array data:', data);
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', company: '', contactEmail: '', notes: '' });
    setEditingClient(null);
    setShowCreateModal(true);
  };

  const openEditModal = (client: Client) => {
    setFormData({
      name: client.name,
      company: client.company || '',
      contactEmail: client.contactEmail || '',
      notes: client.notes || '',
    });
    setEditingClient(client);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingClient(null);
    setFormData({ name: '', company: '', contactEmail: '', notes: '' });
  };

  const saveClient = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          company: formData.company.trim() || null,
          contactEmail: formData.contactEmail.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      });

      if (res.ok) {
        closeModal();
        fetchClients();
      }
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? Their packs will remain but be unlinked.')) return;

    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '2px solid var(--navy)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--navy)' }} />
        <div style={{ position: 'relative', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span className="eyebrow" style={{ color: 'var(--gold)' }}>
                INTERNAL TOOL
              </span>
              <span className="eyebrow" style={{ color: 'var(--cream)', opacity: 0.8 }}>
                CLIENT MANAGEMENT
              </span>
            </div>
            <h1 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 200, color: 'var(--cream)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Client Directory
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--cream)', opacity: 0.9 }}>
              Manage your clients and their associated submission packs. Track projects by client for better organization.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--white)', padding: '1.5rem', border: '1px solid var(--beige)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 300, fontFamily: '"DM Sans", sans-serif', color: 'var(--navy)' }}>{clients.length}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Total Clients</div>
        </div>
        <div style={{ background: 'var(--white)', padding: '1.5rem', border: '1px solid var(--beige)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 300, fontFamily: '"DM Sans", sans-serif', color: 'var(--navy)' }}>
            {Array.isArray(clients) ? clients.reduce((sum, c) => sum + c._count.packs, 0) : 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Total Packs</div>
        </div>
        <div style={{ background: 'var(--white)', padding: '1.5rem', border: '1px solid var(--beige)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 300, fontFamily: '"DM Sans", sans-serif', color: 'var(--navy)' }}>
            {Array.isArray(clients) ? clients.filter(c => c._count.packs > 0).length : 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Active Clients</div>
        </div>
      </div>

      {/* Client List */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--beige)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1.25rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.25rem' }}>All Clients</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Click a client to view their packs</p>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Client
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ width: '4rem', height: '4rem', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg style={{ width: '2rem', height: '2rem', color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1.25rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem' }}>No clients yet</h3>
              <p style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto' }}>
                Add your first client to organize submission packs by customer.
              </p>
              <button
                onClick={openCreateModal}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Client
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {clients.map((client) => (
                <div
                  key={client.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--cream)', border: '1px solid var(--beige)', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '3rem', height: '3rem', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)', fontWeight: 'bold', fontSize: '1.125rem', fontFamily: '"DM Sans", sans-serif' }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        to={`/clients/${client.id}`}
                        style={{ fontWeight: 400, color: 'var(--navy)', textDecoration: 'none', transition: 'color 0.2s' }}
                      >
                        {client.name}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                        {client.company && (
                          <>
                            <span>{client.company}</span>
                            <span style={{ color: 'var(--beige)' }}>|</span>
                          </>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {client._count.packs} pack{client._count.packs !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link
                      to={`/clients/${client.id}`}
                      className="btn-ghost"
                    >
                      View Packs
                    </Link>
                    <button
                      onClick={() => openEditModal(client)}
                      style={{ padding: '0.5rem', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                      title="Edit client"
                    >
                      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      style={{ padding: '0.5rem', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                      title="Delete client"
                    >
                      <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 25, 35, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--white)', padding: '2rem', width: '100%', maxWidth: '28rem', margin: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '1.25rem', fontWeight: 300, color: 'var(--navy)' }}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={closeModal}
                style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>
                  Client Name <span style={{ color: '#a04040' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Acme Development Ltd"
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '0.75rem 1rem', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g., Acme Holdings"
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '0.75rem 1rem', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="e.g., contact@acme.com"
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '0.75rem 1rem', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.5rem' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any relevant notes about this client..."
                  rows={3}
                  style={{ width: '100%', border: '1px solid var(--beige)', padding: '0.75rem 1rem', fontFamily: 'Inter, sans-serif', fontSize: '1rem', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={closeModal}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={saveClient}
                disabled={saving || !formData.name.trim()}
                className="btn-primary"
                style={{ opacity: (saving || !formData.name.trim()) ? 0.5 : 1, cursor: (saving || !formData.name.trim()) ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
