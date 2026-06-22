import { redirect } from 'next/navigation';

export default function DashboardWarehouseMapPage() {
  redirect('/dashboard/warehouse-management?tab=map');
}
