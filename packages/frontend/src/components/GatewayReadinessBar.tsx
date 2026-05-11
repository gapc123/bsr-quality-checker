import { computeGatewayReadiness } from '../lib/gatewayReadiness';
import type { AssessmentResult } from '../types/assessment';

interface Props {
  results: AssessmentResult[];
}

export function GatewayReadinessBar({ results }: Props) {
  const { remainingBlockers, progressPercent, isGatewayReady } = computeGatewayReadiness(results);

  return (
    <div
      className={`rounded-xl border p-5 mb-6 ${
        isGatewayReady ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Gateway 2 Readiness
        </h2>
        {isGatewayReady && (
          <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-semibold bg-green-100 px-3 py-1 rounded-full">
            ✓ Ready to Submit
          </span>
        )}
      </div>

      <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isGatewayReady ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {isGatewayReady ? (
          'All critical blockers resolved. Pack is ready for BSR Gateway 2 submission.'
        ) : (
          <>
            <span className="font-semibold text-slate-800">
              {remainingBlockers} blocker{remainingBlockers !== 1 ? 's' : ''} remaining
            </span>
            {' '}— resolve all critical failures to unlock gateway submission.
          </>
        )}
      </p>
    </div>
  );
}
