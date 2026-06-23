import { redirect } from 'next/navigation';

export default function ProductStocksRoute() {
  redirect('/dashboard/inventory?tab=stocks');
}
