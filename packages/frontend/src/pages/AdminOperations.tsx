import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminApi, Submission, Organisation, CostStats, HealthData, SubmissionStats } from '../services/adminApi';

const NAV = '#1a2e4a';
const BLUE = '#3b82f6';

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      minWidth: '160px',
    }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: NAV }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ── Score badge ────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: '#94a3b8' }}>—</span>;
  const bg = score >= 75 ? '#dcfce7' : score >= 40 ? '#fef9c3' : '#fee2e2';
  const color = score >= 75 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';
  return (
    <span style={{ background: bg, color, padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
      {score.toFixed(0)}%
    </span>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: '#dcfce7', color: '#16a34a' },
    processing: { bg: '#dbeafe', color: '#2563eb' },
    error: { bg: '#fee2e2', color: '#dc2626' },
  };
  const style = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: style.bg, color: style.color, padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 500 }}>
      {status}
    </span>
  );
}

// ── Submission detail modal ────────────────────────────────────────────────
function SubmissionModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [sub, setSub] = useState<Submission | null>(null);
  useEffect(() => {
    adminApi.submission(id).then(setSub);
  }, [id]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '640px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {!sub ? <p>Loading…</p> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: NAV, margin: 0 }}>{sub.orgName}</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>{sub.id}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <Detail label="Status"><StatusBadge status={sub.status} /></Detail>
              <Detail label="Readiness Score"><ScoreBadge score={sub.regulatoryReadinessScore} /></Detail>
              <Detail label="Created">{new Date(sub.createdAt).toLocaleString()}</Detail>
              <Detail label="Processing Time">{sub.processingTimeSeconds ? `${sub.processingTimeSeconds}s` : '—'}</Detail>
              <Detail label="Documents">{sub.documentCount}</Detail>
              <Detail label="User Email">{sub.userEmail}</Detail>
              <Detail label="Total Checks">{sub.totalChecksRun}</Detail>
              <Detail label="Pass / Partial / Fail">{sub.checksPassed} / {sub.checksPartial} / {sub.checksFailed}</Detail>
              <Detail label="API Calls">{sub.apiCallsMade}</Detail>
              <Detail label="Est. Cost">{sub.estimatedApiCostGbp > 0 ? `£${sub.estimatedApiCostGbp.toFixed(4)}` : '—'}</Detail>
              <Detail label="Tokens In">{sub.tokensInput.toLocaleString()}</Detail>
              <Detail label="Tokens Out">{sub.tokensOutput.toLocaleString()}</Detail>
            </div>
            {sub.documentNames.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', marginBottom: '8px' }}>Documents</p>
                {sub.documentNames.map(name => (
                  <div key={name} style={{ fontSize: '13px', padding: '4px 0', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{name}</div>
                ))}
              </div>
            )}
            {sub.failureCategories.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', marginBottom: '8px' }}>Failure Categories</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {sub.failureCategories.map(cat => (
                    <span key={cat} style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 10px', borderRadius: '100px', fontSize: '12px' }}>{cat}</span>
                  ))}
                </div>
              </div>
            )}
            {sub.errorMessage && (
              <div style={{ marginTop: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#dc2626' }}>
                {sub.errorMessage}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#1e293b' }}>{children}</div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminOperations() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [costs, setCosts] = useState<CostStats | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [section, setSection] = useState<'submissions' | 'orgs' | 'costs' | 'health'>('submissions');

  // Filters
  const [filterOrg, setFilterOrg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  async function fetchAll() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterOrg) params.orgName = filterOrg;
    if (filterStatus) params.status = filterStatus;
    if (filterFrom) params.from = filterFrom;
    if (filterTo) params.to = filterTo;

    const [subsData, orgsData, costsData, healthData] = await Promise.all([
      adminApi.submissions(params),
      adminApi.organisations(),
      adminApi.costs(),
      adminApi.health(),
    ]);
    setSubmissions(subsData.submissions);
    setStats(subsData.stats);
    setOrgs(orgsData);
    setCosts(costsData);
    setHealth(healthData);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const hasAlert = health && (health.stuckSubmissions.length > 0 || health.recentErrors.length > 0);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: NAV, margin: 0 }}>Operations</h1>
        {hasAlert && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠</span>
            {health!.stuckSubmissions.length > 0 && `${health!.stuckSubmissions.length} submission(s) stuck >1hr`}
            {health!.stuckSubmissions.length > 0 && health!.recentErrors.length > 0 && ' · '}
            {health!.recentErrors.length > 0 && `${health!.recentErrors.length} recent error(s)`}
          </div>
        )}
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <StatCard label="Total Submissions" value={stats.allTime} />
          <StatCard label="Last 30 Days" value={stats.last30Days} />
          <StatCard label="Avg Readiness" value={stats.avgReadinessScore ? `${stats.avgReadinessScore.toFixed(0)}%` : '—'} />
          <StatCard label="Avg Processing" value={stats.avgProcessingSeconds ? `${stats.avgProcessingSeconds.toFixed(0)}s` : '—'} />
          {costs && (
            <>
              <StatCard label="Total Spend" value={`£${costs.totalSpendGbp.toFixed(2)}`} sub="estimated" />
              <StatCard label="Error Rate" value={`${costs.errorRate.toFixed(1)}%`} />
            </>
          )}
        </div>
      )}

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
        {(['submissions', 'orgs', 'costs', 'health'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: section === s ? 600 : 400,
              color: section === s ? BLUE : '#64748b',
              background: 'none',
              border: 'none',
              borderBottom: section === s ? `2px solid ${BLUE}` : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
              textTransform: 'capitalize',
            }}
          >
            {s === 'submissions' ? 'Submissions' : s === 'orgs' ? 'Organisations' : s === 'costs' ? 'AI Costs' : 'System Health'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>Loading…</div>
      ) : (
        <>
          {/* ── Submissions ─────────────────────────────────────────────────── */}
          {section === 'submissions' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <FilterInput label="Organisation" value={filterOrg} onChange={setFilterOrg} placeholder="Filter by org…" />
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
                    <option value="">All</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <FilterInput label="From" type="date" value={filterFrom} onChange={setFilterFrom} />
                <FilterInput label="To" type="date" value={filterTo} onChange={setFilterTo} />
                <button onClick={fetchAll} style={btnPrimary}>Apply</button>
                <button onClick={() => { setFilterOrg(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); }} style={btnSecondary}>Clear</button>
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={() => adminApi.exportSubmissions()} style={btnSecondary}>Export CSV</button>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Organisation', 'Date', 'Docs', 'Score', 'Pass/Part/Fail', 'Processing', 'Status', ''].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No submissions yet</td></tr>
                    ) : submissions.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}><span style={{ fontWeight: 500, color: NAV }}>{s.orgName}</span></td>
                        <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(s.createdAt).toLocaleDateString()}</span></td>
                        <td style={tdStyle}>{s.documentCount}</td>
                        <td style={tdStyle}><ScoreBadge score={s.regulatoryReadinessScore} /></td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '13px' }}>
                            <span style={{ color: '#16a34a' }}>{s.checksPassed}</span> /
                            <span style={{ color: '#ca8a04' }}> {s.checksPartial}</span> /
                            <span style={{ color: '#dc2626' }}> {s.checksFailed}</span>
                          </span>
                        </td>
                        <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{s.processingTimeSeconds ? `${s.processingTimeSeconds}s` : '—'}</span></td>
                        <td style={tdStyle}><StatusBadge status={s.status} /></td>
                        <td style={tdStyle}>
                          <button onClick={() => setSelectedId(s.id)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', color: BLUE }}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Organisations ───────────────────────────────────────────────── */}
          {section === 'orgs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={() => adminApi.exportOrganisations()} style={btnSecondary}>Export CSV</button>
              </div>
              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Organisation', 'Email', 'Joined', 'Submissions', 'Last Active', 'Status'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgs.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No organisations yet</td></tr>
                    ) : orgs.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 500, color: NAV }}>{o.name}</span>
                          {o.isPilot && <span style={{ marginLeft: '8px', background: '#eff6ff', color: BLUE, padding: '1px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>PILOT</span>}
                        </td>
                        <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{o.primaryEmail}</span></td>
                        <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(o.createdAt).toLocaleDateString()}</span></td>
                        <td style={tdStyle}>{o.submissionCount}</td>
                        <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(o.lastActiveAt).toLocaleDateString()}</span></td>
                        <td style={tdStyle}>
                          {o.isActive
                            ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 500 }}>Active</span>
                            : <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '2px 10px', borderRadius: '100px', fontSize: '12px' }}>Inactive</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AI Costs ─────────────────────────────────────────────────────── */}
          {section === 'costs' && costs && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <StatCard label="Total API Calls" value={costs.totalApiCalls.toLocaleString()} />
              <StatCard label="Total Spend" value={`£${costs.totalSpendGbp.toFixed(2)}`} sub="estimated (Claude Sonnet rates)" />
              <StatCard label="Avg Cost / Submission" value={`£${costs.avgCostPerSubmission.toFixed(4)}`} />
              <StatCard label="Avg Input Tokens" value={Math.round(costs.avgTokensInput).toLocaleString()} />
              <StatCard label="Avg Output Tokens" value={Math.round(costs.avgTokensOutput).toLocaleString()} />
              <StatCard label="Error Rate" value={`${costs.errorRate.toFixed(1)}%`} />
            </div>
          )}

          {/* ── System Health ─────────────────────────────────────────────────── */}
          {section === 'health' && health && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {health.stuckSubmissions.length === 0 && health.recentErrors.length === 0 ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '24px', color: '#16a34a', fontWeight: 500 }}>
                  ✓ All systems healthy
                </div>
              ) : null}

              {health.stuckSubmissions.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: NAV, marginBottom: '12px' }}>
                    Stuck Submissions ({health.stuckSubmissions.length})
                  </h3>
                  <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                          {['ID', 'Organisation', 'Started', 'Stuck For'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {health.stuckSubmissions.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '11px' }}>{s.id.slice(0, 8)}…</td>
                            <td style={tdStyle}>{s.orgName}</td>
                            <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(s.createdAt).toLocaleString()}</span></td>
                            <td style={tdStyle}><span style={{ color: '#dc2626', fontWeight: 600 }}>{s.minutesStuck} min</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {health.recentErrors.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: NAV, marginBottom: '12px' }}>
                    Recent Errors
                  </h3>
                  <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                          {['Submission ID', 'Organisation', 'Timestamp', 'Error'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {health.recentErrors.map(s => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '11px' }}>{s.id.slice(0, 8)}…</td>
                            <td style={tdStyle}>{s.orgName}</td>
                            <td style={tdStyle}><span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(s.createdAt).toLocaleString()}</span></td>
                            <td style={tdStyle}><span style={{ color: '#dc2626', fontSize: '12px' }}>{s.errorMessage || 'Unknown error'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selectedId && <SubmissionModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </AdminLayout>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 500, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', background: '#fff', outline: 'none' };
const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#1e293b' };
const btnPrimary: React.CSSProperties = { padding: '9px 18px', background: '#1a2e4a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { padding: '9px 18px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' };

function FilterInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}
