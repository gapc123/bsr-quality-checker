import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import Disclaimer from './components/Disclaimer';
import ProtectedRoute from './components/ProtectedRoute';
import AttleeLogo from './components/AttleeLogo';
import { ResponsiveContainer } from './components/ResponsiveContainer';
import { A11yProvider, SkipLinks } from './components/AccessibilityEnhancements';
import { ToastProvider } from './components/Toast';

// Lazy-load all pages to break static import chains and prevent TDZ errors in production bundle
const PacksList = lazy(() => import('./pages/PacksList'));
const PackDetail = lazy(() => import('./pages/PackDetail'));
const Upload = lazy(() => import('./pages/Upload'));
const Results = lazy(() => import('./pages/Results'));
const ClientsList = lazy(() => import('./pages/ClientsList'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const QuickAssess = lazy(() => import('./pages/QuickAssess'));
const QuickAssessResults = lazy(() => import('./pages/QuickAssessResults'));
const SignInPage = lazy(() => import('./pages/SignIn'));
const Landing = lazy(() => import('./pages/Landing'));
const Problem = lazy(() => import('./pages/Problem'));
const System = lazy(() => import('./pages/System'));
const Approach = lazy(() => import('./pages/Approach'));
const Security = lazy(() => import('./pages/Security'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminOperations = lazy(() => import('./pages/AdminOperations'));
const AdminShowcase = lazy(() => import('./pages/AdminShowcase'));



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
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPublicPage = ['/', '/problem', '/system', '/approach', '/security'].includes(location.pathname);
  const isSignInPage = location.pathname.startsWith('/sign-in');

  // Admin pages have their own layout (no Clerk, no main nav)
  if (isAdminPage) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/showcase" element={<AdminShowcase />} />
          <Route path="/admin" element={<AdminOperations />} />
        </Routes>
      </Suspense>
    );
  }

  // Public pages (landing, problem, system, approach, security) and sign-in have their own layouts
  if (isPublicPage || isSignInPage) {
    return (
      <Suspense fallback={null}>
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
      </Suspense>
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
        <div style={{ maxWidth: '1800px', width: '100%', margin: '0 auto', padding: '24px 5% 48px' }}>
          <Suspense fallback={null}>
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
                path="/assess/results"
                element={
                  <ProtectedRoute>
                    <QuickAssessResults />
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
            </Routes>
          </Suspense>
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
              © 2026 Attlee AI Ltd · Get Britain Building
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
          <ToastProvider>
            <A11yProvider>
              <ResponsiveContainer>
                <SkipLinks />
                <AppContent />
              </ResponsiveContainer>
            </A11yProvider>
          </ToastProvider>
        </BrowserRouter>
  );
}

export default App;
