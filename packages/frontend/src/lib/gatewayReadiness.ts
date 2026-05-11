import type { AssessmentResult } from '../types/assessment';

export interface GatewayReadiness {
  totalBlockers: number;
  resolvedBlockers: number;
  remainingBlockers: number;
  progressPercent: number;
  isGatewayReady: boolean;
}

export function computeGatewayReadiness(results: AssessmentResult[]): GatewayReadiness {
  // A blocker is: critical severity OR CRITICAL_BLOCKER urgency
  const blockerResults = results.filter(
    r =>
      (r.severity as string) === 'critical' ||
      r.triage?.urgency === 'CRITICAL_BLOCKER' ||
      r.triage?.blocks_submission === true
  );

  const totalBlockers = blockerResults.length;
  const resolvedBlockers = blockerResults.filter(r => r.status === 'meets').length;
  const remainingBlockers = totalBlockers - resolvedBlockers;
  const progressPercent =
    totalBlockers === 0 ? 100 : Math.round((resolvedBlockers / totalBlockers) * 100);
  const isGatewayReady = remainingBlockers === 0;

  return { totalBlockers, resolvedBlockers, remainingBlockers, progressPercent, isGatewayReady };
}
