import { redirect } from 'next/navigation';

export default function CategoriesPage() {
  redirect('/dashboard/inventory?tab=categories');
}
