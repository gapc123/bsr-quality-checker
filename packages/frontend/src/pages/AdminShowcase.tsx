import { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { adminApi, ShowcaseData } from '../services/adminApi';
import AttleeLogo from '../components/AttleeLogo';

const NAV = '#1a2e4a';
const BLUE = '#3b82f6';
const PASS_COLOR = '#22c55e';
const PARTIAL_COLOR = '#f59e0b';
const FAIL_COLOR = '#ef4444';

function HeadlineCard({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '28px 32px',
      boxShadow: '0 2px 12px rgba(26,46,74,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: 1,
      minWidth: '160px',
    }}>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div style={{ fontSize: '36px', fontWeight: 800, color: NAV, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ChartCard({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(26,46,74,0.08)',
      ...style,
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: NAV, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

const DONUT_COLORS = [PASS_COLOR, PARTIAL_COLOR, FAIL_COLOR];
const BAR_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc'];

export default function AdminShowcase() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminApi.showcase().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '80px' }}>Loading…</div>
      </AdminLayout>
    );
  }

  if (!data) return null;

  const { headline, passFailSplit, failureCategories, readinessHistogram, assessmentsPerMonth, cumulativeOrgs } = data;

  return (
    <AdminLayout>
      {/* PDF export toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', gap: '12px' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            background: NAV,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>↓</span> Export PDF
        </button>
      </div>

      <div ref={contentRef}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <AttleeLogo size={36} showWordmark={true} color={NAV} />
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748b' }}>
              Compliance Intelligence Platform — Impact Summary
            </p>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Headline cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <HeadlineCard value={headline.totalAssessments} label="Total Assessments" icon="📋" />
          <HeadlineCard value={headline.totalOrgs} label="Organisations" icon="🏢" />
          <HeadlineCard value={headline.totalDocs.toLocaleString()} label="Documents Analysed" icon="📄" />
          <HeadlineCard value={headline.totalGaps.toLocaleString()} label="Gaps Identified" icon="🔍" />
          <HeadlineCard value={`${headline.avgReadiness}%`} label="Avg Readiness Score" icon="📊" />
        </div>

        {/* Charts row 1: failure categories + donut */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <ChartCard title="Most Common Failure Categories">
            {failureCategories.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={failureCategories} layout="vertical" margin={{ left: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="category" width={180} tick={{ fontSize: 12, fill: '#374151' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {failureCategories.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Pass / Partial / Fail Split">
            {passFailSplit.every(p => p.value === 0) ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={passFailSplit}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {passFailSplit.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Charts row 2: histogram + monthly trend */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <ChartCard title="Readiness Score Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={readinessHistogram}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill={BLUE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Assessments per Month">
            {assessmentsPerMonth.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={assessmentsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={BLUE} strokeWidth={2} dot={{ r: 4, fill: BLUE }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Chart row 3: cumulative orgs */}
        <ChartCard title="Cumulative Organisations Onboarded">
          {cumulativeOrgs.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cumulativeOrgs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cumulative" stroke={NAV} strokeWidth={2} dot={{ r: 4, fill: NAV }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AttleeLogo size={20} showWordmark={true} color="#94a3b8" />
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
            Confidential — Attlee AI Ltd © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          header, button { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </AdminLayout>
  );
}
