import type { AssessmentResult } from '../types/assessment';

export type DeltaStatus = 'fixed' | 'regressed' | 'still_failing' | 'still_passing';

export interface CriterionDelta {
  criterionId: string;
  previousStatus: string | null;
  currentStatus: string;
  delta: DeltaStatus;
}

const PASSING_STATUSES = new Set(['meets', 'PASS', 'pass']);

function isPass(status: string): boolean {
  return PASSING_STATUSES.has(status);
}

export function computeDiff(
  currentResults: AssessmentResult[],
  previousAssessment: { results?: AssessmentResult[] } | null,
): Map<string, CriterionDelta> {
  const deltaMap = new Map<string, CriterionDelta>();

  if (!previousAssessment) return deltaMap;

  const prevResults: AssessmentResult[] = previousAssessment.results ?? [];
  const previousById = new Map(prevResults.map(r => [r.matrix_id, r]));

  for (const curr of currentResults) {
    const prev = previousById.get(curr.matrix_id);
    if (!prev) continue;

    const wasPass = isPass(prev.status);
    const nowPass = isPass(curr.status);

    let delta: DeltaStatus;
    if (!wasPass && nowPass) delta = 'fixed';
    else if (wasPass && !nowPass) delta = 'regressed';
    else if (!wasPass && !nowPass) delta = 'still_failing';
    else delta = 'still_passing';

    deltaMap.set(curr.matrix_id, {
      criterionId: curr.matrix_id,
      previousStatus: prev.status,
      currentStatus: curr.status,
      delta,
    });
  }

  return deltaMap;
}

export function diffSummary(deltas: Map<string, CriterionDelta>) {
  let fixed = 0, regressed = 0, stillFailing = 0;
  for (const d of deltas.values()) {
    if (d.delta === 'fixed') fixed++;
    if (d.delta === 'regressed') regressed++;
    if (d.delta === 'still_failing') stillFailing++;
  }
  return { fixed, regressed, stillFailing };
}
