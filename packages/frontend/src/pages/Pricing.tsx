import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { CONTACT_EMAIL } from '../config/contact';

const plans = [
  {
    name: 'Pay Per Submission',
    price: '£149',
    period: '/submission',
    description: 'Perfect for occasional use or individual projects',
    features: [
      'Single submission analysis',
      'Full Gateway 2 compliance report',
      'PDF report with 20+ action items',
      'Evidence citations & page references',
      '90-day report access',
      'Email support'
    ],
    priceId: 'price_per_submission',
    popular: false,
    type: 'one-time'
  },
  {
    name: 'Professional',
    price: '£349',
    period: '/month',
    description: 'For consultants handling multiple projects',
    features: [
      'Up to 15 submissions/month',
      'Full Gateway 2 compliance reports',
      'PDF reports with action plans',
      'Reference library access',
      'Priority processing',
      'Version comparison tools',
      'Email & chat support'
    ],
    priceId: 'price_professional_monthly',
    popular: true,
    type: 'subscription'
  },
  {
    name: 'Enterprise',
    price: '£799',
    period: '/month',
    description: 'For teams with high-volume needs',
    features: [
      'Unlimited submissions',
      'Everything in Professional',
      'Custom branding on reports',
      'API access',
      'Team management (up to 25 users)',
      'SSO integration',
      'Dedicated account manager',
      'Priority phone support',
      'Quarterly business reviews'
    ],
    priceId: 'price_enterprise_monthly',
    popular: false,
    type: 'subscription'
  }
];

export default function Pricing() {
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!isSignedIn) {
      window.location.href = '/sign-up';
      return;
    }

    setLoading(priceId);
    try {
      const token = await getToken();
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priceId })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full mb-4 tracking-wider">
          GATEWAY 2 QUALITY ASSURANCE
        </span>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Get instant quality analysis of your Gateway 2 submissions.
          Choose pay-per-use for occasional projects or subscribe for regular use.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl shadow-lg border-2 ${
              plan.popular ? 'border-blue-500 scale-105' : 'border-slate-200'
            } p-6 flex flex-col`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
              <p className="text-slate-500 text-sm">{plan.description}</p>
            </div>

            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
              <span className="text-slate-600 text-sm">{plan.period}</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.priceId)}
              disabled={loading === plan.priceId}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                plan.popular
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === plan.priceId ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                plan.type === 'one-time' ? 'Buy Now' : 'Get Started'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Cost of rejection */}
      <div className="max-w-4xl mx-auto mt-16">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            The True Cost of Gateway 2 Rejection
          </h3>
          <p className="text-slate-600 text-center mb-6">
            A single rejection can cost your project significantly more than a quality review
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">£5,000+</div>
              <div className="text-sm text-slate-600">Consultant fees to address deficiencies</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">6-12 weeks</div>
              <div className="text-sm text-slate-600">Average delay from rejection</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">£144/hr</div>
              <div className="text-sm text-slate-600">BSR review charges on resubmission</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl font-bold text-red-600 mb-1">£50k+</div>
              <div className="text-sm text-slate-600">Potential project delay costs</div>
            </div>
          </div>
          <p className="text-center mt-6 text-slate-700 font-medium">
            A £149-£349 quality check is a fraction of rejection costs
          </p>
        </div>
      </div>

      {/* Value proposition */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Why BSR Quality Checker?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-1">Analysis in Minutes</h4>
              <p className="text-slate-400 text-sm">
                AI-powered review identifies gaps instantly. No waiting for consultants.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-1">Reduce Rejections</h4>
              <p className="text-slate-400 text-sm">
                Comprehensive review against all 50+ BSR criteria before you submit.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-1">Clear Action Plans</h4>
              <p className="text-slate-400 text-sm">
                20+ prioritised actions with evidence citations and owner assignments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <p className="text-slate-600">
          Questions? Contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
