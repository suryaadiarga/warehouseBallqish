import { redirect } from 'next/navigation';

export default function DashboardStockAdjustmentsPage() {
  redirect('/dashboard/operations?tab=adjustments');
}
