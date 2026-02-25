import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { DEMO_USER_EMAIL } from '../config/contact';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'active' | 'inactive'>('loading');

  // Check if user is the demo user (gets free access)
  const isDemoUser = isLoaded && user?.primaryEmailAddress?.emailAddress === DEMO_USER_EMAIL;

  useEffect(() => {
    // Demo user bypasses subscription check
    if (isDemoUser) {
      setSubscriptionStatus('active');
      return;
    }

    async function checkSubscription() {
      try {
        const token = await getToken();
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data.hasActiveSubscription ? 'active' : 'inactive');
        } else {
          setSubscriptionStatus('inactive');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus('inactive');
      }
    }

    if (isLoaded && !isDemoUser) {
      checkSubscription();
    }
  }, [getToken, isLoaded, isDemoUser]);

  if (subscriptionStatus === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (subscriptionStatus === 'inactive') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Subscription Required</h2>
          <p className="text-slate-600 mb-6">
            Access to the BSR Quality Checker requires an active subscription.
            Get instant access to comprehensive Gateway 2 document analysis.
          </p>
          <Link
            to="/pricing"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
