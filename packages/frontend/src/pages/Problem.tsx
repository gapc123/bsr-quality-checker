import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeadlinesSection } from '../components/ContextSection';

export default function Problem() {
  const [openModal, setOpenModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                attlee.ai
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/problem" className="text-white font-medium">
                Problem
              </Link>
              <Link to="/system" className="text-slate-400 hover:text-white transition-colors">
                System
              </Link>
              <Link to="/approach" className="text-slate-400 hover:text-white transition-colors">
                Approach
              </Link>
              <Link to="/security" className="text-slate-400 hover:text-white transition-colors">
                Security
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
            The UK needs more safe homes.
            <br />
            <span className="text-slate-400">Getting them approved takes too long.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            The path to building them is too slow, too complex.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="relative py-12 bg-slate-800/50 border-y border-slate-700">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <p className="text-2xl font-semibold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            We're an AI-first consultancy helping get more safe homes built in the UK, faster.
          </p>
        </div>
      </section>

      {/* Headlines Carousel */}
      <HeadlinesSection />

      {/* Why Generic AI Falls Short */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Generic AI Falls Short
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full" />
          </div>

          <div className="bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-8 md:p-10 space-y-6">
            <div className="space-y-4 text-slate-300 leading-relaxed text-lg">
              <p>
                Large Language Models (LLMs) generate text by predicting the most likely next word. They are probabilistic by design.
              </p>
              <p>
                This makes them good at summarising, extracting, and rewriting information.
              </p>
              <p>
                It also means their outputs can vary and cannot be relied on for strict pass/fail decisions.
              </p>
              <p>
                Regulatory compliance is deterministic. A requirement is either met or it is not.
              </p>
              <p className="font-medium text-slate-200 text-xl">
                In regulated workflows, "probably compliant" is not an acceptable outcome.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-700">
              <p className="text-sm text-cyan-400 italic">
                The problem isn't AI. It's using the wrong kind of AI for the decision.
              </p>
            </div>

            {/* Interactive Example Trigger */}
            <div className="pt-6">
              <button
                onClick={() => setOpenModal('example')}
                className="w-full px-6 py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                See a Real Example of AI Failure
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Next Section */}
      <section className="relative py-16 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link
            to="/system"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/20"
          >
            Next: See How We Solve This
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Modal: Example of AI Failure */}
      {openModal === 'example' && (
        <Modal onClose={() => setOpenModal(null)}>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Real Example: AI Inconsistency</h3>
                <p className="text-slate-600">Same input, different outputs</p>
              </div>
              <button
                onClick={() => setOpenModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-mono text-slate-600 mb-2">Prompt to ChatGPT:</p>
                <p className="text-slate-800 italic">"Does this fire strategy comply with Approved Document B?"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">Response 1 (10:00 AM)</p>
                  <p className="text-sm text-green-800">"Yes, the fire strategy appears to comply with ADB requirements..."</p>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-600">✓ PASS</p>
                  </div>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Response 2 (10:01 AM)</p>
                  <p className="text-sm text-red-800">"No, there are several gaps in compartmentation details that would need addressing..."</p>
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-600">✗ FAIL</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-amber-800">
                    <strong>The Problem:</strong> Same document, same question, asked 1 minute apart. Completely contradictory answers. This is why probabilistic AI cannot be the final arbiter of compliance decisions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500">
                <a href="mailto:george@attlee.ai" className="hover:text-blue-400 transition-colors">
                  george@attlee.ai
                </a>
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-600">© 2026 attlee.ai</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Modal Component
interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
