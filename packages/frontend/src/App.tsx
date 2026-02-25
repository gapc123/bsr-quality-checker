import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import Landing from './pages/Landing';
import PacksList from './pages/PacksList';
import PackDetail from './pages/PackDetail';
import Upload from './pages/Upload';
import Results from './pages/Results';
import ButlerLibrary from './pages/ButlerLibrary';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import Pricing from './pages/Pricing';
import Disclaimer from './components/Disclaimer';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionGate from './components/SubscriptionGate';
import { DEMO_USER_EMAIL } from './config/contact';

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
  const { user } = useUser();
  const isLandingPage = location.pathname === '/';
  const isDemoUser = user?.primaryEmailAddress?.emailAddress === DEMO_USER_EMAIL;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - different for landing vs app */}
      {!isLandingPage && (
        <header className="bg-slate-900 shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Brand */}
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Meridian</span>
                  <span className="hidden sm:block text-xs text-slate-400">AI-Powered Regulatory Compliance</span>
                </div>
              </Link>

              {/* Navigation and Auth */}
              <div className="flex items-center gap-4">
                <SignedIn>
                  {isDemoUser && (
                    <span className="bg-amber-500 text-amber-950 text-xs font-bold px-2 py-1 rounded">
                      DEMO ACCESS
                    </span>
                  )}
                  <nav className="flex items-center gap-2">
                    <NavLink to="/dashboard">Submission Packs</NavLink>
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
                  <nav className="flex items-center gap-2">
                    <NavLink to="/pricing">Pricing</NavLink>
                    <Link
                      to="/sign-in"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Sign In
                    </Link>
                  </nav>
                </SignedOut>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Landing page header */}
      {isLandingPage && (
        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">BSR Quality Checker</span>
              </Link>

              <nav className="flex items-center gap-4">
                <SignedOut>
                  <Link to="/pricing" className="text-white/80 hover:text-white font-medium transition-colors">
                    Pricing
                  </Link>
                  <Link to="/sign-in" className="text-white/80 hover:text-white font-medium transition-colors">
                    Sign In
                  </Link>
                  <a
                    href="/#contact"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                  >
                    Book a Demo
                  </a>
                </SignedOut>
                <SignedIn>
                  <Link
                    to="/dashboard"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                  >
                    Dashboard
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9"
                      }
                    }}
                  />
                </SignedIn>
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Disclaimer Banner - only show when signed in and not on landing */}
      {!isLandingPage && (
        <SignedIn>
          <Disclaimer />
        </SignedIn>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${!isLandingPage ? 'bg-slate-50' : ''}`}>
        <div className={!isLandingPage ? 'max-w-7xl mx-auto px-4 py-8' : ''}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Protected routes (require auth + subscription) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <PacksList />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/packs/:packId"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <PackDetail />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/packs/:packId/upload"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <Upload />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/packs/:packId/versions/:versionId/results"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <Results />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/butler"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <ButlerLibrary />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>

      {/* Footer - only show when not on landing page (landing has its own) */}
      {!isLandingPage && (
        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                Meridian — AI-powered regulatory compliance for Gateway 2 submissions
              </p>
              <p className="text-xs text-slate-500">
                55+ criteria assessment. Not a compliance certificate.
              </p>
            </div>
          </div>
        </footer>
      )}
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
