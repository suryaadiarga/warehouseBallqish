import { redirect } from 'next/navigation';

export default function DashboardMovementAnalysisPage() {
  redirect('/dashboard/analytics?tab=movement');
}
