type StatusTone = 'safe' | 'warning' | 'critical' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  safe: 'status-safe',
  warning: 'status-warning',
  critical: 'status-critical',
  neutral: 'bg-slate-100 text-slate-700',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  maintenance: 'Pemeliharaan',
  approved: 'Disetujui',
  draft: 'Draf',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  counting: 'Penghitungan',
  review: 'Peninjauan',
  safe: 'Aman',
  warning: 'Waspada',
  critical: 'Kritis',
  low: 'Rendah',
  'low stock': 'Stok Rendah',
  'safe stock': 'Stok Aman',
  pending: 'Menunggu',
  increase: 'Penambahan',
  decrease: 'Pengurangan',
  active_movement: 'Aktif',
  slow_moving: 'Slow-moving',
  dead_stock: 'Dead stock',
  stock_out: 'Stock Habis',
  unknown: 'Tidak Diketahui',
};

export function formatStatusLabel(label: string) {
  return statusLabels[label.toLowerCase()] ?? label;
}

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
      {formatStatusLabel(label)}
    </span>
  );
}
