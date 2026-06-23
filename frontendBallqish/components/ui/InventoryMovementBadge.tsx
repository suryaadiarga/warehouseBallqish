import { StatusBadge } from '@/components/ui/StatusBadge';

export function InventoryMovementBadge({
  type,
  source,
}: {
  type?: string | null;
  source?: string | null;
}) {
  if (source === 'transfer') {
    return <StatusBadge label="transfer" tone="warning" />;
  }

  if (source === 'adjustment') {
    return <StatusBadge label="penyesuaian" tone="critical" />;
  }

  if (source === 'stock_audit') {
    return <StatusBadge label="audit stok" tone="safe" />;
  }

  if (type === 'in') {
    return <StatusBadge label="masuk" tone="safe" />;
  }

  if (type === 'out') {
    return <StatusBadge label="keluar" tone="warning" />;
  }

  return <StatusBadge label={source || type || 'unknown'} tone="neutral" />;
}
