import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import PacksList from './pages/PacksList';
import PackDetail from './pages/PackDetail';
import Upload from './pages/Upload';
import Results from './pages/Results';
import ButlerLibrary from './pages/ButlerLibrary';
import ClientsList from './pages/ClientsList';
import ClientDetail from './pages/ClientDetail';
import SignInPage from './pages/SignIn';
import Landing from './pages/Landing';
import Disclaimer from './components/Disclaimer';
import ProtectedRoute from './components/ProtectedRoute';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to !== '/' && to !== '/dashboard' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isSignInPage = location.pathname.startsWith('/sign-in');

  // Landing page and sign-in have their own layouts (no internal tool header)
  if (isLandingPage || isSignInPage) {
    return (
      <Routes>
        <Route path="/" element={
          <>
            <SignedOut>
              <Landing />
            </SignedOut>
            <SignedIn>
              <Navigate to="/clients" replace />
            </SignedIn>
          </>
        } />
        <Route path="/sign-in/*" element={<SignInPage />} />
      </Routes>
    );
  }

  // Internal tool layout (with header and navigation)
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <Link to="/clients" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Attlee.AI</span>
                <p className="hidden sm:block text-xs text-slate-400 italic">
                  Our mission is to help get more safe homes built in the UK, faster
                </p>
              </div>
            </Link>

            {/* Navigation and Auth */}
            <div className="flex items-center gap-4">
              <SignedIn>
                <nav className="flex items-center gap-2">
                  <NavLink to="/clients">Clients</NavLink>
                  <NavLink to="/dashboard">Packs</NavLink>
                  <NavLink to="/butler">Reference Library</NavLink>
                </nav>
                <div className="ml-4 pl-4 border-l border-slate-700">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
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
      <main className="flex-1 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Routes>

            {/* Protected routes */}
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
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            {/* Mission Statement */}
            <div className="text-center border-b border-slate-800 pb-6">
              <p className="text-sm text-slate-400 mb-2">
                The UK needs more safe, quality homes. The path to building them is too slow, too complex.
              </p>
              <p className="text-base font-semibold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Our mission is to help get more safe homes built in the UK, faster.
              </p>
            </div>

            {/* Footer Info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-blue-400">Attlee.AI</span> — AI-Powered Building Safety Consultancy
                </p>
                <p className="text-xs text-amber-400 font-medium mt-1">
                  AI-First. Human-Verified. Always.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                <a href="mailto:george@attlee.ai" className="hover:text-blue-400 transition-colors">george@attlee.ai</a>
              </p>
            </div>
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
