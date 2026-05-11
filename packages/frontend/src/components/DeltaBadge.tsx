import type { DeltaStatus } from '../lib/assessmentDiff';

const CONFIG: Record<DeltaStatus, { icon: string; label: string; className: string } | null> = {
  fixed: { icon: '✓', label: 'Fixed', className: 'bg-green-100 text-green-700 border border-green-300' },
  regressed: { icon: '↓', label: 'Regressed', className: 'bg-red-100 text-red-700 border border-red-300' },
  still_failing: { icon: '~', label: 'Still failing', className: 'bg-amber-100 text-amber-700 border border-amber-300' },
  still_passing: null,
};

export function DeltaBadge({ delta }: { delta: DeltaStatus }) {
  const cfg = CONFIG[delta];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
