import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import PacksList from './pages/PacksList';
import PackDetail from './pages/PackDetail';
import Upload from './pages/Upload';
import Results from './pages/Results';
import ButlerLibrary from './pages/ButlerLibrary';
import Disclaimer from './components/Disclaimer';

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to !== '/' && location.pathname.startsWith(to));

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
  return (
    <div className="min-h-screen flex flex-col">
      {/* Professional Header */}
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
                <span className="text-lg font-bold text-white">BSR Quality Checker</span>
                <span className="hidden sm:block text-xs text-slate-400">Gateway 2 Document Review Tool</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <NavLink to="/">Submission Packs</NavLink>
              <NavLink to="/butler">Reference Library</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <Disclaimer />

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<PacksList />} />
            <Route path="/packs/:packId" element={<PackDetail />} />
            <Route path="/packs/:packId/upload" element={<Upload />} />
            <Route
              path="/packs/:packId/versions/:versionId/results"
              element={<Results />}
            />
            <Route path="/butler" element={<ButlerLibrary />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              BSR Quality Checker — A reviewability diagnostic for Gateway 2 submissions
            </p>
            <p className="text-xs text-slate-500">
              Not a compliance tool. For quality assessment only.
            </p>
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
