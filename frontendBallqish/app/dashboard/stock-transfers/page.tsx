import { redirect } from 'next/navigation';

export default function DashboardStockTransfersPage() {
  redirect('/dashboard/operations?tab=transfers');
}
