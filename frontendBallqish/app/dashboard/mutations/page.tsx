import { redirect } from 'next/navigation';

export default function MutationsRoute() {
  redirect('/dashboard/operations?tab=mutations');
}
