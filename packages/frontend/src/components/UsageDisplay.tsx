import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

interface UsageData {
  submissionsThisPeriod: number;
  limit: number | 'unlimited';
  remainingInPlan: number | 'unlimited';
  availableCredits: number;
  canSubmit: boolean;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  usage: UsageData;
}

export default function UsageDisplay() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const token = await getToken();
        const response = await fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setStatus(await response.json());
        }
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [getToken]);

  if (loading || !status) {
    return null;
  }

  const { usage, subscription } = status;
  const isUnlimited = usage.limit === 'unlimited';
  const remaining = isUnlimited ? null : (usage.remainingInPlan as number);
  const isLow = !isUnlimited && remaining !== null && remaining <= 3;
  const isOut = !isUnlimited && remaining === 0 && usage.availableCredits === 0;

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      isOut ? 'bg-red-50 border border-red-200' :
      isLow ? 'bg-amber-50 border border-amber-200' :
      'bg-slate-100 border border-slate-200'
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              isOut ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-slate-700'
            }`}>
              {subscription ? (
                <>
                  <span className="capitalize">{subscription.plan}</span> Plan
                </>
              ) : (
                'No Active Subscription'
              )}
            </span>
            {isUnlimited && (
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded">
                Unlimited
              </span>
            )}
          </div>

          {!isUnlimited && (
            <div className="mt-1 text-sm text-slate-600">
              <span className="font-semibold">{remaining}</span> of {usage.limit} submissions remaining this month
              {usage.availableCredits > 0 && (
                <span className="ml-2 text-blue-600">
                  + {usage.availableCredits} credit{usage.availableCredits !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {isUnlimited && (
            <div className="mt-1 text-sm text-slate-600">
              {usage.submissionsThisPeriod} submissions this month
            </div>
          )}
        </div>

        {isOut && (
          <BuyCreditsButton />
        )}

        {isLow && !isOut && (
          <Link
            to="/pricing"
            className="text-sm text-amber-700 hover:text-amber-800 font-medium"
          >
            Running low? Upgrade or buy credits →
          </Link>
        )}
      </div>
    </div>
  );
}

export function BuyCreditsButton() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBuyCredits = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/subscription/buy-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: 1 })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuyCredits}
      disabled={loading}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Buy Submission Credit (£149)'}
    </button>
  );
}

export function SubmissionBlockedModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Submission Limit Reached
          </h3>
          <p className="text-slate-600 mb-6">
            You've used all your submissions for this month. Purchase additional submission credits to continue analysing documents.
          </p>

          <div className="space-y-3">
            <BuyCreditsButton />
            <div className="text-sm text-slate-500">or</div>
            <Link
              to="/pricing"
              className="block w-full py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              Upgrade Your Plan
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
