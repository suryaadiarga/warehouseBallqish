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
    return <StatusBadge label="adjustment" tone="critical" />;
  }

  if (source === 'opname') {
    return <StatusBadge label="opname" tone="safe" />;
  }

  if (type === 'in') {
    return <StatusBadge label="in" tone="safe" />;
  }

  if (type === 'out') {
    return <StatusBadge label="out" tone="warning" />;
  }

  return <StatusBadge label={source || type || 'unknown'} tone="neutral" />;
}
