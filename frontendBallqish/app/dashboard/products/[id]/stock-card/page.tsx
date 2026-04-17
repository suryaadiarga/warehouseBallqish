import { ProductStockCardPage } from '@/components/modules/inventory/ProductStockCardPage';

export default async function ProductStockCardRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductStockCardPage productId={id} />;
}
