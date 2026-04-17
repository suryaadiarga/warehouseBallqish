import { ProductStockDetailPage } from '@/components/modules/inventory/ProductStockDetailPage';

export default async function ProductStocksDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductStockDetailPage productId={id} />;
}
