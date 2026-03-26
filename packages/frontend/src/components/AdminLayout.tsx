import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import AttleeLogo from './AttleeLogo';

const NAV = '#1a2e4a';
const BLUE = '#3b82f6';

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    adminApi.me()
      .then(d => { setUserEmail(d.email); setAuthChecked(true); })
      .catch(() => navigate('/admin/login'));
  }, []);

  async function handleLogout() {
    await adminApi.logout();
    navigate('/admin/login');
  }

  if (!authChecked) return null;

  const isShowcase = location.pathname === '/admin/showcase';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: NAV, padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <AttleeLogo size={24} showWordmark={true} color="#fff" />
          <nav style={{ display: 'flex', gap: '4px' }}>
            <NavTab to="/admin" active={!isShowcase}>Operations</NavTab>
            <NavTab to="/admin/showcase" active={isShowcase}>Showcase</NavTab>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{userEmail}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {/* Content */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1600px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
}

function NavTab({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        padding: '6px 16px',
        fontSize: '13px',
        fontWeight: active ? 500 : 400,
        color: active ? '#fff' : 'rgba(255,255,255,0.55)',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        borderRadius: '6px',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </Link>
  );
}

export { NAV, BLUE };
