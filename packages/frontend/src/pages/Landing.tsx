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
              GATEWAY 2 QUALITY ASSURANCE
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Submit with Confidence.<br />
              <span className="text-blue-400">Avoid Costly Rejections.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              AI-powered quality analysis for Building Safety Regulator Gateway 2 submissions.
              Get instant feedback on your documentation before you submit.
            </p>

            <div className="flex flex-wrap gap-4">
              <SignedOut>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg text-lg"
                >
                  Get Started Free
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
                >
                  View Pricing
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
              The Cost of Getting It Wrong
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Gateway 2 rejections are expensive and time-consuming
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">£5,000+</div>
              <div className="text-slate-600">Consultant fees to fix deficiencies</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">6-12 wks</div>
              <div className="text-slate-600">Average delay from rejection</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">£144/hr</div>
              <div className="text-slate-600">BSR review charges</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
              <div className="text-4xl font-bold text-red-600 mb-2">£50k+</div>
              <div className="text-slate-600">Project delay costs</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get comprehensive quality analysis in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Documents</h3>
              <p className="text-slate-600">
                Upload your Gateway 2 submission pack - fire strategy, structural reports,
                competency declarations, and more.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-600">
                Our algorithm reviews your documents against 50+ BSR criteria, identifying gaps,
                inconsistencies, and missing information.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Get Your Report</h3>
              <p className="text-slate-600">
                Receive a comprehensive PDF report with prioritised actions, evidence citations,
                and clear owner assignments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: 'Reference Library',
                description: 'Upload BSR guidance documents to improve analysis accuracy'
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
            Join professionals who use BSR Quality Checker to avoid costly rejections.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <SignedOut>
              <Link
                to="/sign-up"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg text-lg"
              >
                Get Started Now
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 text-lg"
              >
                View Pricing
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

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            BSR Quality Checker — A reviewability diagnostic for Gateway 2 submissions
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Not a compliance tool. For quality assessment only.
          </p>
        </div>
      </footer>
    </div>
  );
}
