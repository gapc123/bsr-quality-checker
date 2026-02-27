import { CONTACT_EMAIL, BOOK_DEMO_URL } from '../config/contact';

const agencyPlans = [
  {
    name: 'Gap Analysis',
    price: 'Per-pack',
    period: 'pricing',
    description: 'Comprehensive assessment with detailed report and remediation roadmap',
    features: [
      'AI-powered analysis against 55+ BSR criteria',
      'Human expert verification of all findings',
      'Detailed gap analysis report',
      'Prioritised remediation roadmap',
      'Evidence citations with page references',
    ],
    endProduct: 'Gap analysis report',
    turnaround: '1 week',
    popular: false,
  },
  {
    name: 'Full Service',
    price: 'Complete',
    period: 'package',
    description: 'Complete review with amended documents ready for submission',
    features: [
      'Everything in Gap Analysis, plus:',
      'Submission-ready amended documents',
      'Expert guidance call',
      'Support until BSR decision',
      'Free re-assessment if needed',
    ],
    endProduct: 'Submission-ready docs',
    turnaround: '2 weeks',
    popular: true,
  },
  {
    name: 'Retainer',
    price: 'Monthly',
    period: 'partnership',
    description: 'Ongoing support for teams with multiple projects',
    features: [
      'Unlimited gap analyses',
      'Priority 48-hour turnaround',
      'Dedicated account manager',
      'Monthly strategy calls',
      'Discounted full service rates',
    ],
    endProduct: 'Ongoing partnership',
    turnaround: '48 hours priority',
    popular: false,
  }
];

export default function Pricing() {
  return (
    <div className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-4 tracking-wider">
          AI-POWERED BUILDING SAFETY CONSULTANCY
        </span>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Expert BSR Review Services
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Our AI analyses your submission against 55+ criteria in minutes. Our experts verify every finding.
          You get submission-ready results in days, not weeks.
        </p>
      </div>

      {/* How We Work */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">How Attlee.AI Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">1. AI Analysis</h4>
              <p className="text-slate-400 text-sm">
                Our proprietary system analyses your pack against our expert-built compliance matrix
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">2. Expert Verification</h4>
              <p className="text-slate-400 text-sm">
                Every finding is reviewed and validated by our building safety experts
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">3. You Receive Results</h4>
              <p className="text-slate-400 text-sm">
                Detailed reports and submission-ready documents delivered to your inbox
              </p>
            </div>
          </div>
          <p className="text-center text-amber-400 font-semibold mt-6">
            AI-First. Human-Verified. Always.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {agencyPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                plan.popular ? 'border-blue-500 scale-105' : 'border-slate-200'
              } p-6 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-4 pt-2">
                <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                <p className="text-slate-500 text-sm">{plan.description}</p>
              </div>

              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-600 text-sm">{plan.period}</span>
              </div>

              {/* Turnaround badge */}
              <div className={`text-center text-sm font-medium mb-4 px-3 py-2 rounded-lg ${
                plan.popular
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {plan.turnaround}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      feature.includes('Everything in') ? 'text-blue-500' : 'text-green-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={`text-sm ${
                      feature.includes('Everything in') ? 'font-semibold text-blue-700' : 'text-slate-700'
                    }`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={BOOK_DEMO_URL}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all text-center block ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Speed Comparison */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Days, Not Weeks
          </h3>
          <p className="text-slate-600 text-center mb-6">
            Traditional consultants take 4-6 weeks. We deliver in days.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Traditional Consultant
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">4-6 weeks</span> turnaround time
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">Manual review</span> of every document
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">Inconsistent</span> criteria coverage
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">£10,000+</span> typical engagement
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-400">
              <h4 className="font-bold text-green-600 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Attlee.AI
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">1-2 weeks</span> turnaround time
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">AI-powered</span> comprehensive analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">55+ criteria</span> every time
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 font-semibold">Competitive</span> transparent pricing
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Our Approach */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Why AI + Human Expertise?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">No Hallucinations</h4>
              <p className="text-sm text-slate-600">
                Our proprietary compliance matrix grounds every finding in actual regulatory requirements
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Expert Verification</h4>
              <p className="text-sm text-slate-600">
                Every AI finding is reviewed by building safety professionals before delivery
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Consistent Quality</h4>
              <p className="text-sm text-slate-600">
                Same comprehensive 55+ criteria check on every submission, every time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost of rejection */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            The True Cost of Gateway 2 Rejection
          </h3>
          <p className="text-slate-600 text-center mb-6">
            A single rejection costs far more than getting it right the first time
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">£10k+</div>
              <div className="text-sm text-slate-600">Consultant fees to fix deficiencies</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">6-12 weeks</div>
              <div className="text-sm text-slate-600">Average delay from rejection</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">£144/hr</div>
              <div className="text-sm text-slate-600">BSR charges on resubmission</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">£50k+</div>
              <div className="text-sm text-slate-600">Project delay costs</div>
            </div>
          </div>
          <p className="text-center mt-6 text-slate-700 font-medium">
            An expert review is a fraction of rejection costs
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-slate-300 mb-6">
            Book a call with our team to discuss your submission and how we can help.
          </p>
          <a
            href={BOOK_DEMO_URL}
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
          >
            Book a Consultation
          </a>
          <p className="text-slate-400 text-sm mt-4">
            Or email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
