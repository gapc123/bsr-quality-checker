import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10" />

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-slate-700">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Attlee.AI
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight">
                AI-Powered Building Safety
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Review & Triage
                </span>
              </h1>

              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Intelligent document review at scale. Understanding regulation beyond human capacity.
                Identifying gaps, risks, and inconsistencies before submission.
              </p>
            </div>

            {/* CTA */}
            <div className="flex justify-center gap-4 pt-6">
              <SignedOut>
                <Link
                  to="/sign-in"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                >
                  Sign In
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/clients"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
                >
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Mission Statement */}
      <section className="relative py-16 bg-slate-800/50 border-y border-slate-700">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
          <p className="text-lg text-slate-400">
            The UK needs more safe, quality homes. The path to building them is too slow, too complex.
          </p>
          <p className="text-2xl font-semibold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            Our mission is to help get more safe homes built in the UK, faster.
          </p>
        </div>
      </section>

      {/* Section 1: AI Review, Not AI Content Generation */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="space-y-12">
            {/* Heading */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-white">
                Intelligent Review, Not Content Generation
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full" />
            </div>

            {/* Core Message */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6">
              <p className="text-lg text-slate-300 leading-relaxed">
                This system does not attempt to replace professional judgement or generate free-form compliance documents.
                Instead, it provides <span className="text-cyan-400 font-semibold">intelligent review and triage at a scale no individual human can achieve</span>.
              </p>

              {/* What the AI Does */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  What the AI Does
                </h3>
                <ul className="space-y-3 text-slate-300 ml-5">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reviews documents across entire submission packs for consistency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Understands building safety regulations at granular detail</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Identifies gaps, risks, and inconsistencies early in the process</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Cross-references requirements across dozens of documents simultaneously</span>
                  </li>
                </ul>
              </div>

              {/* Agentic Behavior */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                  Agentic Behaviour (Where AI Acts Autonomously)
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3 text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    Formatting and structural consistency checks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    Cross-referencing between documents
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    Language clarity assessment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    Highlighting missing sections
                  </li>
                </ul>
              </div>

              {/* What AI Defers */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  What the AI Always Defers to Humans
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3 text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    Professional engineering judgement
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    Creation of new technical documents
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    Final sign-off and accountability
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                    Physical testing and site inspections
                  </li>
                </ul>
              </div>

              {/* The Goal */}
              <div className="pt-6 border-t border-slate-700">
                <p className="text-lg text-cyan-400 font-medium italic">
                  The Goal: Reduce the human workload by handling repetitive review tasks,
                  while keeping human expertise and accountability at the center of every submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Continuous Improvement Through Real Outcomes */}
      <section className="relative py-20 bg-slate-800/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="space-y-12">
            {/* Heading */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-white">
                A Growing Regulatory Intelligence Layer
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-blue-400 mx-auto rounded-full" />
              <p className="text-slate-400 text-lg">
                Not a static rules engine
              </p>
            </div>

            {/* Core Message */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6">
              <p className="text-lg text-slate-300 leading-relaxed">
                Unlike static compliance checklists, this system <span className="text-cyan-400 font-semibold">learns from real regulatory outcomes</span>.
                Every submission—whether successful or not—contributes to the system's understanding of what the Building Safety Regulator expects.
              </p>

              {/* What the System Learns From */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  What the System Learns From
                </h3>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Successful Gateway 2 submissions and their common patterns</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Submissions that failed and the specific reasons why</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span>Direct feedback from BSR reviews and queries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Changes in regulatory interpretation over time</span>
                  </li>
                </ul>
              </div>

              {/* How This Improves */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                  How This Improves the System
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <div className="text-cyan-400 font-semibold">Pattern Recognition</div>
                    <div className="text-sm text-slate-400">
                      Better identification of what constitutes submission-ready documentation
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <div className="text-cyan-400 font-semibold">Risk Identification</div>
                    <div className="text-sm text-slate-400">
                      Earlier detection of issues likely to trigger regulator queries
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <div className="text-cyan-400 font-semibold">Confidence Calibration</div>
                    <div className="text-sm text-slate-400">
                      More accurate assessment of which areas need further review
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <div className="text-cyan-400 font-semibold">Conservative Guidance</div>
                    <div className="text-sm text-slate-400">
                      More cautious where regulatory standards remain ambiguous
                    </div>
                  </div>
                </div>
              </div>

              {/* The Result */}
              <div className="pt-6 border-t border-slate-700">
                <p className="text-lg text-cyan-400 font-medium italic">
                  The Result: Over time, the system becomes not just faster, but more accurate—helping teams
                  anticipate regulator expectations before submission, reducing delays and rework.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Attlee.AI
                </span>
              </div>
              <p className="text-sm text-slate-400">
                AI-Powered Building Safety Consultancy
              </p>
              <p className="text-xs text-amber-400 font-medium mt-1">
                AI-First. Human-Verified. Always.
              </p>
            </div>

            <div className="text-center md:text-right space-y-2">
              <p className="text-xs text-slate-500">
                <a href="mailto:george@attlee.ai" className="hover:text-blue-400 transition-colors">
                  george@attlee.ai
                </a>
              </p>
              <p className="text-xs text-slate-600">
                © 2026 Attlee.AI. Building safe homes, faster.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
