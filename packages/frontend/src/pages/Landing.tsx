import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useState } from 'react';
import { CONTACT_EMAIL, CALENDAR_BOOKING_URL, FORM_SUBMIT_URL } from '../config/contact';

export default function Landing() {
  const [showCalendar, setShowCalendar] = useState(false);

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
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Meridian
              </span>
              <span className="text-white/60 text-lg">|</span>
              <span className="text-white/80 text-sm font-medium">AI-Powered Regulatory Compliance</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Gateway 2 Submissions.<br />
              <span className="text-blue-400">Reviewed Before the BSR Does.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Our proprietary AI reviews your entire submission pack against 55+ regulatory criteria
              and delivers a prioritised action list, so you know exactly what to fix before you submit.
            </p>

            <div className="flex flex-wrap gap-4">
              <SignedOut>
                <button
                  onClick={() => setShowCalendar(true)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
                >
                  Book a Demo
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <a
                  href="#contact"
                  className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
                >
                  Contact Us
                </a>
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

      {/* Demo Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Book a Demo</h3>
                <p className="text-sm text-slate-600">Schedule a 30-minute walkthrough of Meridian</p>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Cal.com embed - configured in config/contact.ts */}
              <iframe
                src={CALENDAR_BOOKING_URL}
                className="w-full h-[500px] border-0 rounded-lg"
                title="Book a demo"
              />
            </div>
          </div>
        </div>
      )}

      {/* Problem Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Gateway 2 is Blocking UK Housing
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

      {/* Not ChatGPT Section */}
      <div className="py-16 bg-amber-50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full mb-6">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold text-amber-700">PURPOSE-BUILT, NOT A WRAPPER</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                This Isn't "Upload to ChatGPT"
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Meridian is not a thin wrapper around generic AI. We've built a <strong>proprietary data model</strong> specifically
                for UK building safety regulation, with 55 deterministic rules derived from Building Regulations,
                Approved Documents, and BSR guidance.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Each rule pre-linked to specific regulatory citations</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Deterministic checks with consistent, auditable results</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">AI customised for this use case, trained on real submissions</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
              <div className="text-sm font-medium text-slate-500 mb-4">Meridian vs Generic AI</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-slate-700">ChatGPT / Generic AI</span>
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">No regulatory model</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="text-slate-900 font-medium">Meridian</span>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">55 codified rules</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Every finding cites the specific regulation (document, section, page) and the exact extract from your submission.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Traceability Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-6">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">FULL TRACEABILITY</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Every Finding Linked to Source
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              No black box. Every assessment shows exactly which part of your submission we reviewed
              and the specific regulation it must comply with.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-900">From Your Submission</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">Fire_Strategy_Report.pdf - Page 14</p>
                  <p className="text-sm text-slate-700 italic">
                    "The structure has been designed to provide the required periods of fire resistance..."
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  We extract the exact quote from your document
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-900">Matched to Regulation</span>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">Approved Document B, Section B3 - Page 46</p>
                  <p className="text-sm text-slate-700 italic">
                    "The building shall be designed and constructed so that the stability of the building will be maintained..."
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Linked to the specific regulatory requirement
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                <strong className="text-slate-900">Result:</strong> You can verify every finding. Your team can act with confidence. Auditors can trace the logic.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How Meridian Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Upload your pack, get a readiness score and prioritised actions within minutes.
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
              <h3 className="text-xl font-bold text-slate-900 mb-3">Two-Phase Analysis</h3>
              <p className="text-slate-600">
                55 deterministic rules check hard requirements. AI analysis evaluates
                quality, clarity, and completeness. Results in minutes.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Review & Action</h3>
              <p className="text-slate-600">
                Get a readiness score, prioritised actions, and with your approval,
                let AI execute routine improvements automatically.
              </p>
            </div>
          </div>

          {/* Agentic AI Section */}
          <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full mb-6">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-300">AGENTIC AI WITH HUMAN-IN-THE-LOOP</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Intelligent Triage
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  Meridian intelligently separates what it can handle from what requires your professional judgement.
                  With your approval, the AI executes routine improvements while flagging substantive decisions for human review.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">AI-actionable:</strong> Formatting, cross-references, structure, citations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Human review:</strong> Compliance judgements, technical assumptions, design decisions
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">You're always in control:</strong> Approve, modify, or reject any change
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-sm font-medium text-slate-400 mb-4">Example: Intelligent Triage</div>
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">REQUIRES YOUR JUDGEMENT</span>
                    </div>
                    <p className="text-slate-300 text-sm">Fire strategy assumptions need verification against structural report Section 4.2</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded">AI CAN ACTION</span>
                      <span className="ml-auto text-xs text-slate-400">With your approval</span>
                    </div>
                    <p className="text-slate-300 text-sm">Add cross-references between competency declarations and named individuals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Options */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Level of Support
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Priced between traditional agency fees and pure SaaS subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-8 text-white">
              <div className="inline-block bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                FULL SERVICE
              </div>
              <h3 className="text-2xl font-bold mb-4">Meridian Agency</h3>
              <p className="text-slate-300 mb-6">
                We handle end-to-end. You receive a fully audited assessment with professional sign-off.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Full AI platform assessment</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>55 deterministic checks + LLM analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">Expert human review & audit</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Remediation guidance call</span>
                </li>
              </ul>
              <button
                onClick={() => setShowCalendar(true)}
                className="w-full py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Book a Demo
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <div className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                SELF-SERVICE
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Meridian SaaS</h3>
              <p className="text-slate-600 mb-6">
                Self-service access to our AI/ML system. No human audit. Your team owns the review.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Full AI platform assessment</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">55 deterministic checks + LLM analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Unlimited re-assessments</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Editable output documents</span>
                </li>
              </ul>
              <a
                href="#contact"
                className="block w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-center"
              >
                Request Access
              </a>
            </div>
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
            Get your submission reviewed before the BSR does. Book a demo to see Meridian in action.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <SignedOut>
              <button
                onClick={() => setShowCalendar(true)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-lg"
              >
                Book a Demo
              </button>
              <a
                href="#contact"
                className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
              >
                Contact Us
              </a>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Questions? Get in Touch
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you want a demo, have questions, or want to discuss enterprise options.
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
                    <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-blue-600 transition-colors">
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
              </div>

              <form
                action={FORM_SUBMIT_URL}
                method="POST"
                className="space-y-4"
              >
                <input type="hidden" name="_subject" value="Meridian Enquiry" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_next" value="https://bsr-app-v2-production.up.railway.app/?submitted=true" />

                <div>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="company"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Company (optional)"
                  />
                </div>

                <div>
                  <textarea
                    name="message"
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="How can we help?"
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Meridian
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            AI-powered regulatory compliance for UK building safety
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Purpose-built for Gateway 2. Not a compliance certification.
          </p>
        </div>
      </footer>
    </div>
  );
}
