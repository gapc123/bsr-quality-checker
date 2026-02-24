import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-blue-900/85" />

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="max-w-3xl">
            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider shadow-lg">
              GATEWAY 2 COMPLIANCE PARTNER
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Gateway 2 Submissions.<br />
              <span className="text-blue-400">Reviewed Before the BSR Does.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Our proprietary AI reviews your entire submission pack against BSR requirements
              and delivers a prioritised action list, so you know exactly what to fix before you submit.
            </p>

            <div className="flex flex-wrap gap-4">
              <SignedOut>
                <a
                  href="#contact"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
                >
                  Request a Review
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
                >
                  Try It Yourself
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
                >
                  Go to Dashboard
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Gateway 2 is Blocking UK Construction
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Over 150 high-rise projects are currently stalled. Only 10% of new build submissions get approved.
              Cranes are standing idle. The industry cannot afford to wait.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">150+</div>
              <div className="text-slate-600">Projects currently stalled at Gateway 2</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">12-18 mo</div>
              <div className="text-slate-600">Schedule delays on affected projects</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">10.7%</div>
              <div className="text-slate-600">New build approval rate</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">40+ wks</div>
              <div className="text-slate-600">Some applications waiting for decision</div>
            </div>
          </div>

          <div className="mt-12 bg-slate-900 rounded-2xl p-8 text-center">
            <p className="text-slate-300 text-lg mb-4">
              On major developments, each week of delay costs tens of thousands in preliminaries alone.
              20-30% cost overruns are now common. Funders are losing confidence.
            </p>
            <p className="text-white font-semibold">
              The question isn't whether you can afford a proper review. It's whether you can afford not to have one.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works - Expanded */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How We Work
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our proprietary AI, trained on Gateway 2 requirements, reviews your complete pack
              and delivers expert-level analysis. Security-first architecture keeps your data protected.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Documents</h3>
              <p className="text-slate-600">
                Upload your Gateway 2 submission pack: fire strategy, structural reports,
                competency declarations, and supporting documentation.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-600">
                Our proprietary AI reviews your documents against 50+ BSR criteria at speed,
                identifying gaps, inconsistencies, and areas requiring attention.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Review & Action</h3>
              <p className="text-slate-600">
                Receive prioritised recommendations. You decide which actions to take,
                with full visibility into the reasoning behind each suggestion.
              </p>
            </div>
          </div>

          {/* AI Co-Pilot Section */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full mb-6">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-300">AI AGENTS, HUMAN IN THE LOOP</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  We Do More For You, For Less
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  Our AI agents action changes with you always in control. We separate routine
                  improvements we can handle from decisions that need your professional judgement
                  so you get more done with less effort.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Human-judgement actions:</strong> Complex decisions flagged for your review
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">AI-actionable tasks:</strong> Routine improvements you can enable or disable
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Your choice:</strong> You always decide what gets actioned
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-sm font-medium text-slate-400 mb-4">Example: Action Categorisation</div>
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">REQUIRES YOUR JUDGEMENT</span>
                    </div>
                    <p className="text-slate-300 text-sm">Fire strategy assumptions need verification against structural report Section 4.2</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">AI CAN ACTION</span>
                      <label className="ml-auto flex items-center cursor-pointer">
                        <div className="relative">
                          <div className="w-8 h-5 bg-blue-600 rounded-full shadow-inner"></div>
                          <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow"></div>
                        </div>
                      </label>
                    </div>
                    <p className="text-slate-300 text-sm">Add cross-references between competency declarations and named individuals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auditability Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full mb-6">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-slate-700">FULL AUDITABILITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Every Decision, Fully Documented
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              In regulated industries, traceability matters. Every AI-assisted recommendation
              and action is fully auditable, giving you complete oversight.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">What Was Decided</h3>
              <p className="text-slate-600 text-sm">
                Clear record of every recommendation made and action taken on your submission.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Why It Was Decided</h3>
              <p className="text-slate-600 text-sm">
                Transparent reasoning linking each recommendation to specific regulatory requirements.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Which Data Was Used</h3>
              <p className="text-slate-600 text-sm">
                Direct citations to source documents, page numbers, and regulatory references.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Who Approved It</h3>
              <p className="text-slate-600 text-sm">
                Clear distinction between human-approved actions and AI-executed tasks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full mb-6">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-semibold text-green-300">SECURITY AT OUR CORE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                AI-Native, Security-First
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                We're built AI-native from the ground up, with security at our core.
                Your Gateway 2 submissions contain sensitive project information. We treat that seriously.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Encrypted at Rest & In Transit</h3>
                    <p className="text-slate-400">
                      All documents are encrypted using industry-standard AES-256 encryption.
                      Data in transit is protected via TLS 1.3.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Least-Privilege Access</h3>
                    <p className="text-slate-400">
                      Our AI operates on a read-only basis for analysis. Write operations
                      require explicit user approval and are logged.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Controlled Data Retention</h3>
                    <p className="text-slate-400">
                      You control how long your documents are retained.
                      Delete your data at any time with immediate effect.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Defined Guardrails</h3>
                    <p className="text-slate-400">
                      The AI operates within strict boundaries. It cannot access external systems,
                      share data between users, or take actions outside its defined scope.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-6">Security Certifications & Standards</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-white">UK</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">UK Data Residency</div>
                    <div className="text-sm text-slate-400">Data processed and stored in UK data centres</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">SOC 2 Type II</div>
                    <div className="text-sm text-slate-400">Infrastructure security certification</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-white">GDPR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">GDPR Compliant</div>
                    <div className="text-sm text-slate-400">Full compliance with UK data protection law</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What You Get
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: '50+ Criteria Checked',
                description: 'Comprehensive review against all BSR Gateway 2 requirements'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Results in Minutes',
                description: 'AI-powered analysis delivers insights faster than manual review'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Detailed PDF Reports',
                description: 'Professional reports with evidence citations and page references'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Owner Assignments',
                description: 'Clear allocation of actions to Principal Designer, Contractor, etc.'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                title: 'Prioritised Actions',
                description: '20+ recommendations ranked by severity and effort required'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                title: 'Multi-Project Support',
                description: 'Organise submissions by building and project for portfolio management'
              }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl bg-slate-50">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-slate-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Submit with Confidence?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Get your submission reviewed before the BSR does. We'll tell you exactly what needs fixing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <SignedOut>
              <a
                href="#contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-lg"
              >
                Request a Review
              </a>
              <Link
                to="/sign-up"
                className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
              >
                Try It Yourself
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-lg"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-white" id="contact">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-6">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">GET IN TOUCH</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Have Questions?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We'd love to hear from you. Whether you have questions about the product,
              need a demo, or want to discuss enterprise options.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-slate-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Send us an enquiry</h3>
                <p className="text-slate-600 mb-6">
                  Fill out the form and we'll get back to you within 24 hours.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:georgeapclarke@gmail.com" className="hover:text-blue-600 transition-colors">
                      georgeapclarke@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Response within 24 hours</span>
                  </div>
                </div>
              </div>

              <form
                action="https://formsubmit.co/georgeapclarke@gmail.com"
                method="POST"
                className="space-y-4"
              >
                <input type="hidden" name="_subject" value="BSR Quality Checker Enquiry" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_next" value="https://bsr-app-v2-production.up.railway.app/?submitted=true" />

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">
                    Company (optional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your company"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                >
                  Send Enquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            BSR Quality Checker | AI-native compliance review, built with security at our core
          </p>
          <p className="text-slate-500 text-xs mt-2">
            We help you prepare better submissions. Not a compliance certification.
          </p>
          <div className="mt-4">
            <a href="#contact" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
