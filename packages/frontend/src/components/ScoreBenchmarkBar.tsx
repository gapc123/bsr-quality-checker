import { getBand, GATEWAY_THRESHOLD, TYPICAL_FIRST_SUBMISSION_RANGE, SCORE_BANDS } from '../lib/benchmarks';

interface Props {
  score: number;
}

export function ScoreBenchmarkBar({ score }: Props) {
  const band = getBand(score);

  return (
    <div className="mt-3 w-full">
      {/* Segmented bar */}
      <div className="relative h-2.5 rounded-full overflow-visible flex gap-0.5">
        {SCORE_BANDS.map(b => (
          <div
            key={b.label}
            className={`h-full rounded-full ${b.tailwindBg} opacity-70`}
            style={{ width: `${b.max - b.min + 1}%` }}
          />
        ))}
        {/* "You are here" marker */}
        <div
          className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-800 shadow-md"
          style={{
            left: `${score}%`,
            transform: 'translateX(-50%) translateY(-50%)',
          }}
          title={`Your score: ${score}`}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-slate-500 mt-1.5">
        <span>0</span>
        <span className="text-amber-600">
          Typical first: {TYPICAL_FIRST_SUBMISSION_RANGE.low}–{TYPICAL_FIRST_SUBMISSION_RANGE.high}
        </span>
        <span className="text-green-600">Gateway-ready: {GATEWAY_THRESHOLD}+</span>
      </div>

      {/* Interpretation */}
      <p className="mt-2 text-xs text-slate-500 italic leading-snug">
        {band.interpretation}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{band.avgRevisions}</p>

      <p className="mt-1 text-xs text-slate-300" title="Based on Attlee's assessment of typical BSR submissions">
        * Benchmark estimates
      </p>
    </div>
  );
}
