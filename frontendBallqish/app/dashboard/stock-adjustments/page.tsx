import { redirect } from 'next/navigation';

export default function DashboardStockAdjustmentsPage() {
  redirect('/dashboard/stock-audits?tab=adjustments');
}
