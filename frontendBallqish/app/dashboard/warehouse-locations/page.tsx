import { redirect } from 'next/navigation';

export default function WarehouseLocationsPage() {
  redirect('/dashboard/warehouse-management?tab=racks');
}
