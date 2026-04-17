type StatusTone = 'safe' | 'warning' | 'critical' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  safe: 'status-safe',
  warning: 'status-warning',
  critical: 'status-critical',
  neutral: 'bg-slate-100 text-slate-700',
};

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
