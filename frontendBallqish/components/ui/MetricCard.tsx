import { LucideIcon } from 'lucide-react';

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'sky',
}: {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-600'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-600'
        : tone === 'rose'
          ? 'bg-rose-50 text-rose-600'
          : tone === 'slate'
            ? 'bg-slate-100 text-slate-700'
            : 'bg-sky-50 text-sky-600';

  return (
    <div className="surface-card rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
          {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
        </div>
        <div className={`rounded-2xl p-3 ${toneClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
