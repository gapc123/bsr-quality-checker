export interface ScoreBand {
  label: string;
  min: number;
  max: number;
  tailwindBg: string;
  interpretation: string;
  avgRevisions: string;
}

export const SCORE_BANDS: ScoreBand[] = [
  {
    label: 'Significant work required',
    min: 0,
    max: 54,
    tailwindBg: 'bg-red-500',
    interpretation:
      'Multiple mandatory criteria remain unmet. A gateway submission at this score would be refused.',
    avgRevisions: 'Typically 3–4 revision cycles to reach gateway-ready.',
  },
  {
    label: 'Progressing',
    min: 55,
    max: 79,
    tailwindBg: 'bg-amber-400',
    interpretation:
      'Core safety documentation is largely in place. Targeted fixes can reach gateway-ready.',
    avgRevisions: 'Typically 1–2 revision cycles to reach gateway-ready.',
  },
  {
    label: 'Gateway-ready',
    min: 80,
    max: 100,
    tailwindBg: 'bg-green-500',
    interpretation:
      'Pack meets the threshold for BSR Gateway 2 submission. Resolve any remaining critical failures before submitting.',
    avgRevisions: 'Ready to submit — address any outstanding critical failures first.',
  },
];

export const GATEWAY_THRESHOLD = 80;
export const TYPICAL_FIRST_SUBMISSION_RANGE = { low: 55, high: 70 };

export function getBand(score: number): ScoreBand {
  return SCORE_BANDS.find(b => score >= b.min && score <= b.max) ?? SCORE_BANDS[0];
}
