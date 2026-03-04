import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import PacksList from './pages/PacksList';
import PackDetail from './pages/PackDetail';
import Upload from './pages/Upload';
import Results from './pages/Results';
import ButlerLibrary from './pages/ButlerLibrary';
import ClientsList from './pages/ClientsList';
import ClientDetail from './pages/ClientDetail';
import QuickAssess from './pages/QuickAssess';
import SignInPage from './pages/SignIn';
import Landing from './pages/Landing';
import Problem from './pages/Problem';
import System from './pages/System';
import Approach from './pages/Approach';
import Security from './pages/Security';
import Disclaimer from './components/Disclaimer';
import ProtectedRoute from './components/ProtectedRoute';
import AttleeLogo from './components/AttleeLogo';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to !== '/' && to !== '/dashboard' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      style={{
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 400,
        letterSpacing: '0.04em',
        textDecoration: 'none',
        color: isActive ? 'var(--cream)' : 'rgba(242,241,238,0.6)',
        background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
        transition: 'all 0.2s',
        opacity: isActive ? 1 : 0.6
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.opacity = '1';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.opacity = '0.6';
        }
      }}
    >
      {children}
    </Link>
  );
}

function AppContent() {
  const location = useLocation();
  const isPublicPage = ['/', '/problem', '/system', '/approach', '/security'].includes(location.pathname);
  const isSignInPage = location.pathname.startsWith('/sign-in');

  // Public pages (landing, problem, system, approach, security) and sign-in have their own layouts
  if (isPublicPage || isSignInPage) {
    return (
      <Routes>
        <Route path="/" element={
          <>
            <SignedOut>
              <Landing />
            </SignedOut>
            <SignedIn>
              <Navigate to="/assess" replace />
            </SignedIn>
          </>
        } />
        <Route path="/problem" element={<Problem />} />
        <Route path="/system" element={<System />} />
        <Route path="/approach" element={<Approach />} />
        <Route path="/security" element={<Security />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
      </Routes>
    );
  }

  // Internal tool layout (with header and navigation)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--navy)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px'
          }}>
            {/* Logo and Brand */}
            <Link to="/clients" style={{ textDecoration: 'none' }}>
              <AttleeLogo size={28} showWordmark={true} color="var(--cream)" />
            </Link>

            {/* Navigation and Auth */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <SignedIn>
                <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <NavLink to="/assess">Assessment</NavLink>
                  <NavLink to="/clients">Clients</NavLink>
                  <NavLink to="/dashboard">Packs</NavLink>
                  <NavLink to="/butler">Reference Library</NavLink>
                </nav>
                <div style={{
                  marginLeft: '16px',
                  paddingLeft: '16px',
                  borderLeft: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9"
                      }
                    }}
                  />
                </div>
              </SignedIn>

              <SignedOut>
                <Link
                  to="/sign-in"
                  style={{
                    padding: '10px 20px',
                    fontSize: '12px',
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--navy)',
                    background: 'var(--cream)',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s'
                  }}
                >
                  Sign In
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <SignedIn>
        <Disclaimer />
      </SignedIn>

      {/* Main Content */}
      <main style={{ flex: 1, background: 'var(--cream)' }}>
        <div style={{ maxWidth: '1800px', width: '100%', margin: '0 auto', padding: '48px 5%' }}>
          <Routes>

            {/* Protected routes */}
            <Route
              path="/assess"
              element={
                <ProtectedRoute>
                  <QuickAssess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <ClientsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:clientId"
              element={
                <ProtectedRoute>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PacksList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packs/:packId"
              element={
                <ProtectedRoute>
                  <PackDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packs/:packId/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packs/:packId/versions/:versionId/results"
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              }
            />
            <Route
              path="/butler"
              element={
                <ProtectedRoute>
                  <ButlerLibrary />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--navy)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '40px 48px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <AttleeLogo size={20} showWordmark={true} color="rgba(255,255,255,0.3)" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.06em'
            }}>
              © 2026 Attlee AI Ltd · Getting Britain Building
            </p>
            <a
              href="mailto:george@attlee.ai"
              style={{
                fontSize: '11px',
                color: 'var(--gold)',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                opacity: 0.6,
                transition: 'opacity 0.2s'
              }}
            >
              george@attlee.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
