import { redirect } from 'next/navigation';

export default function WarehousesPage() {
  redirect('/dashboard/warehouse-management?tab=warehouses');
}
