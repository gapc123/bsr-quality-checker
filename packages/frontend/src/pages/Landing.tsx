import { CONTACT_EMAIL, BOOK_DEMO_URL, FORM_SUBMIT_URL } from '../config/contact';
import { HeadlinesSection, ConstructionSection, TimelapseSection } from '../components/ContextSection';

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
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Attlee.AI
              </span>
              <span className="text-white/60 text-lg">|</span>
              <span className="text-white/80 text-sm font-medium">AI-Powered Building Safety Consultancy</span>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-2 inline-block mb-6">
              <span className="text-amber-300 font-semibold">AI-First. Human-Verified. Always.</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Gateway 2 Submissions.<br />
              <span className="text-blue-400">AI-Reviewed. Expert-Approved.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              We're an AI-enabled consultancy. You send us your Gateway 2 pack - we run it through our proprietary
              AI system, our experts verify every finding, and we deliver a comprehensive report with specific fixes.
              You get confidence. We do the work.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={BOOK_DEMO_URL}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
              >
                Book a Demo
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a
                href="#contact"
                className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Gateway 2 is Blocking UK Housing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              The BSR received over 1,000 Gateway Two applications in its first year.
              Only 14% were approved. The rest are stuck in limbo — and incomplete or non-compliant
              submissions are a major cause.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">1,018</div>
              <div className="text-slate-600">Gateway 2 applications submitted</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">847</div>
              <div className="text-slate-600">Applications still pending decision</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">14%</div>
              <div className="text-slate-600">Approval rate since Oct 2023</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-amber-600 mb-2">146</div>
              <div className="text-slate-600">Applications signed off as compliant</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Source: Freedom of Information request to BSR, covering Oct 2023 – Sept 2024
            </p>
          </div>

          <div className="mt-8 bg-slate-900 rounded-2xl p-8 text-center">
            <p className="text-slate-300 text-lg mb-4">
              The BSR has cited incomplete and non-compliant submissions as key reasons for the backlog.
              On major developments, each week of delay costs tens of thousands in preliminaries alone.
            </p>
            <p className="text-white font-semibold">
              Getting your submission right first time isn't optional — it's essential.
            </p>
          </div>
        </div>
      </div>

      {/* Editorial Headlines Section - News coverage */}
      <HeadlinesSection />

      {/* Why Applications Fail Section */}
      <div className="py-16 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why Applications Get Rejected
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              The most common mistake? Submitting plans that show <em>what</em> work will be done,
              without demonstrating <em>how</em> compliance is achieved.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* What doesn't work */}
            <div className="bg-white rounded-xl p-8 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-red-700">What Gets Rejected</h3>
              </div>
              <ul className="space-y-4 text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Submitting plans and specifications without explanation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Expecting the BSR to "second guess" your design philosophy</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Assuming documents "speak for themselves"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Missing justification for contentious design elements</span>
                </li>
              </ul>
            </div>

            {/* What BSR requires */}
            <div className="bg-white rounded-xl p-8 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-700">What the BSR Requires</h3>
              </div>
              <ul className="space-y-4 text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Identify</strong> every Building Regulation requirement that applies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Clarify</strong> which standards and codes demonstrate compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Justify</strong> with detailed narrative how each requirement is met</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Address</strong> contentious design elements specifically</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <div className="inline-block bg-blue-900 text-white rounded-xl px-8 py-6 max-w-3xl">
              <p className="text-lg">
                <strong>This is exactly what Attlee does.</strong> We assess your submission against 55+ criteria,
                identify gaps in compliance demonstration, and help you build the narrative the BSR needs to see.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Not ChatGPT Section */}
      <div className="py-16 bg-amber-50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Key insight callout */}
          <div className="bg-white rounded-xl p-6 border-2 border-amber-300 mb-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Why Generic AI Falls Short</h3>
                <p className="text-slate-600">
                  <strong>Regulatory compliance is deterministic, not probabilistic.</strong> A document either meets
                  Approved Document B Section 8.3 or it doesn't. There's no "probably compliant." LLMs are designed
                  to predict likely responses — they're not built to make precise pass/fail judgements against
                  specific regulatory criteria. That's why we built something purpose-made.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full mb-6">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold text-amber-700">PROPRIETARY SYSTEM, NOT CHATGPT</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                No Hallucinations. No Guesswork.
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Generic AI doesn't have access to our proprietary algorithm built on the Building Safety Act,
                Approved Documents, BSR operational guidance, and real submission feedback. Our system runs
                <strong> 55 deterministic rules</strong> that produce consistent, auditable results —
                then our experts verify every finding.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700"><strong>Proprietary algorithm:</strong> Built on BSA 2022, ADB, BS 9991, and BSR guidance</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700"><strong>Deterministic, not probabilistic:</strong> Pass/fail logic, not AI guessing</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700"><strong>Human-in-the-loop:</strong> Expert verification on every finding</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
              <div className="text-sm font-medium text-slate-500 mb-4">Why Our Approach is Different</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <span className="text-slate-700 font-medium">ChatGPT / Generic AI</span>
                    <p className="text-xs text-slate-500 mt-0.5">No access to regulatory matrix</p>
                  </div>
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">Probabilistic</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <span className="text-slate-700 font-medium">Traditional Consultant</span>
                    <p className="text-xs text-slate-500 mt-0.5">Manual review, variable coverage</p>
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">4-6 weeks</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <div>
                    <span className="text-slate-900 font-medium">Attlee</span>
                    <p className="text-xs text-slate-500 mt-0.5">AI speed + deterministic accuracy + expert verification</p>
                  </div>
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">Best of both</span>
                </div>
              </div>
              <p className="text-sm text-green-700 mt-4 font-medium">
                The speed of AI. The precision of deterministic rules. The assurance of human experts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Section */}
      <div className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Days, Not Weeks
              </h2>
              <p className="text-lg text-slate-300 mb-6">
                Gateway 2 was designed to take 12 weeks. In practice, applications are taking
                25-40 weeks — with some delays approaching 18 months. Traditional consultants
                add another 4-6 weeks on top. Every day matters when costs are mounting.
              </p>
              <p className="text-lg text-slate-300">
                <strong className="text-white">We deliver within 1 week.</strong> Our AI analyses your entire pack in minutes.
                Our team then reviews every finding, verifies accuracy, and prepares your report.
                You get the speed of AI with the assurance of human expertise.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-red-400 mb-2">4-6</div>
                <div className="text-sm text-slate-400">weeks for traditional consultant review</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-amber-400 mb-2">25-40</div>
                <div className="text-sm text-slate-400">weeks for Gateway 2 approval</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">1</div>
                <div className="text-sm text-slate-400">week for Attlee review</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
                <div className="text-sm text-slate-400">human-verified findings</div>
              </div>
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
              Send. We Review. You Receive.
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Three steps to a submission-ready report. You send, we analyse, you get results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">You Send Your Pack</h3>
              <p className="text-slate-600">
                Email us your Gateway 2 submission pack: fire strategy, structural reports,
                competency declarations, and supporting documentation.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">We Run The Analysis</h3>
              <p className="text-slate-600">
                Our team runs your pack through 55 deterministic checks and AI analysis.
                Every finding is verified by our experts before delivery.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">You Receive Your Deliverables</h3>
              <p className="text-slate-600 mb-4">
                Depending on your package, you receive:
              </p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Gap Analysis:</strong> Detailed findings report + action plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Full Service:</strong> Report + amended documents + strategy call</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Proprietary System */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full mb-4">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-300">PROPRIETARY TECHNOLOGY</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Built on Our Regulatory Success Matrix
                </h3>
                <p className="text-slate-300 mb-4">
                  We've developed a comprehensive compliance framework specifically for Gateway 2 submissions.
                  Our matrix maps <strong className="text-white">55 deterministic rules</strong> directly to Building Regulations,
                  Approved Documents, and BSR guidance — with specific citations for every criterion.
                </p>
                <p className="text-slate-400 text-sm">
                  This isn't off-the-shelf software. It's a purpose-built system developed from deep regulatory
                  expertise and refined through real submission reviews.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">55+</div>
                  <div className="text-xs text-slate-400">Deterministic rules</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">100%</div>
                  <div className="text-xs text-slate-400">Citation coverage</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">6</div>
                  <div className="text-xs text-slate-400">Regulatory sources</div>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-400 mb-1">0</div>
                  <div className="text-xs text-slate-400">AI hallucinations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Process Section */}
          <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full mb-6">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-300">AI + EXPERT VERIFICATION</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Every Criterion. Every Finding. Verified.
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-6">
                  Our team reviews each finding from the AI analysis. We verify accuracy, check context,
                  and ensure every recommendation is actionable before it reaches you.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Pass/Fail per criterion:</strong> Clear status with evidence from your submission
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Regulatory citation:</strong> Every finding linked to the specific regulation
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Actionable guidance:</strong> Specific recommendations on what to fix
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-slate-200">
                      <strong className="text-white">Prioritised actions:</strong> Know what to fix first and why
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-sm font-medium text-slate-400 mb-4">Sample Finding</div>
                <div className="space-y-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-slate-400">G2-12.4</span>
                      <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">FAIL</span>
                    </div>
                    <p className="text-white font-medium text-sm mb-2">Fire Compartmentation Documentation</p>
                    <div className="text-xs text-slate-400 mb-3">Missing horizontal compartmentation details</div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mb-3">
                      <p className="text-xs text-blue-300 font-medium mb-1">Your Submission:</p>
                      <p className="text-xs text-slate-300 italic">"The structure provides required fire resistance..."</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                      <p className="text-xs text-amber-300 font-medium mb-1">Recommendation:</p>
                      <p className="text-xs text-slate-300">Add explicit horizontal compartmentation statement per AD B, Section 8.3</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    55+ criteria assessed per pack
                  </p>
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
              We Do The Work. You Get The Results.
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Send us your pack. We run the AI analysis, verify every finding, and deliver a comprehensive report.
              No software to learn. No logins to manage. Just results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <div className="inline-block bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
                GAP ANALYSIS
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Submission Review</h3>
              <p className="text-2xl font-bold text-slate-900 mb-4">Per-pack pricing <span className="text-sm font-normal text-slate-500">contact for quote</span></p>
              <p className="text-slate-600 mb-6">
                We analyse your pack against 55+ criteria and deliver a detailed findings report with specific gaps identified.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">AI analysis of all documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Expert verification of every finding</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">Prioritised action list</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">1 week turnaround</span>
                </li>
              </ul>
              <a
                href={BOOK_DEMO_URL}
                className="block w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-center"
              >
                Get Started
              </a>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-8 text-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full">RECOMMENDED</span>
              </div>
              <div className="inline-block bg-blue-500/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-4 mt-2">
                FULL SERVICE
              </div>
              <h3 className="text-2xl font-bold mb-2">Review + Remediation</h3>
              <p className="text-2xl font-bold mb-4">Full service <span className="text-sm font-normal text-slate-400">contact for quote</span></p>
              <p className="text-slate-300 mb-6">
                We find the issues AND help you fix them. Includes AI-drafted amendments and a strategy call.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything in Gap Analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">AI-drafted amended documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1-hour strategy call with our team</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Re-review after your amendments</span>
                </li>
              </ul>
              <a
                href={BOOK_DEMO_URL}
                className="block w-full py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors text-center"
              >
                Book a Call
              </a>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <div className="inline-block bg-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
                PARTNERSHIP
              </div>
              <h3 className="text-2xl font-bold mb-2">Developer Retainer</h3>
              <p className="text-2xl font-bold mb-4">Monthly retainer <span className="text-sm font-normal text-slate-400">contact for quote</span></p>
              <p className="text-slate-300 mb-6">
                Ongoing partnership for developers with multiple HRB projects. Priority access, volume pricing.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Includes 2 full reviews/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>48-hour priority turnaround</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Direct line to our team</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Additional reviews at discounted rates</span>
                </li>
              </ul>
              <a
                href={BOOK_DEMO_URL}
                className="block w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                Discuss Partnership
              </a>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              <strong className="text-slate-900">How it works:</strong> Email your pack to <a href="mailto:george@attlee.ai" className="text-blue-600 hover:underline font-semibold">george@attlee.ai</a>. We run the analysis, verify findings, and send you the report. Simple.
            </p>
            <p className="text-sm text-slate-500">
              Questions? Want to discuss your specific project? <a href="mailto:george@attlee.ai" className="text-blue-600 hover:underline">Get in touch</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Data Security Section */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-6">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-semibold text-green-700">YOUR DATA IS PROTECTED</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Security & Confidentiality
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Your submission documents contain sensitive project information. We treat them accordingly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Secure Transmission</h3>
              <p className="text-sm text-slate-600">
                All data transmitted via HTTPS/TLS encryption. Your documents are protected in transit.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Access Control</h3>
              <p className="text-sm text-slate-600">
                Industry-standard authentication. Your data is isolated and only accessible to you and our review team.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Data Deletion</h3>
              <p className="text-sm text-slate-600">
                Request deletion of your data at any time. We permanently remove all associated documents and reports.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No Third-Party Sharing</h3>
              <p className="text-sm text-slate-600">
                Your documents are never shared with third parties or used for training. Analysis stays confidential.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">How We Process Your Documents</h4>
                <p className="text-sm text-slate-600">
                  Your documents are processed using AI technology (Anthropic Claude) to perform the analysis.
                  Anthropic does not use API data to train their models. We retain your documents only for the
                  duration of your engagement and delete them upon request or project completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Construction Imagery Section - Visual grounding */}
      <ConstructionSection />

      {/* Timelapse Video Section */}
      <TimelapseSection />

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-slate-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Submit with Confidence?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Get your submission reviewed before the BSR does. Book a demo to see Attlee in action.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={BOOK_DEMO_URL}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-lg"
            >
              Book a Demo
            </a>
            <a
              href="#contact"
              className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
            >
              Contact Us
            </a>
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
                <input type="hidden" name="_subject" value="Attlee Enquiry" />
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Attlee.AI
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-sm">AI-Powered Building Safety Consultancy</span>
          </div>
          <p className="text-amber-400 text-sm font-medium mb-2">
            AI-First. Human-Verified. Always.
          </p>
          <p className="text-slate-500 text-xs mb-2">
            Gateway 2 submission reviews powered by AI, verified by experts.
          </p>
          <p className="text-slate-400 text-xs">
            <a href="mailto:george@attlee.ai" className="hover:text-blue-400 transition-colors">george@attlee.ai</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
