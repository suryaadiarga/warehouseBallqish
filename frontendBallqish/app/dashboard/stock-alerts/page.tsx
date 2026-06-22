import { redirect } from 'next/navigation';

export default function DashboardStockAlertsPage() {
  redirect('/dashboard/analytics?tab=alerts');
}
