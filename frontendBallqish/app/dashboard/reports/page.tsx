import { redirect } from 'next/navigation';

export default function ReportsRoute() {
  redirect('/dashboard/operations?tab=history');
}
