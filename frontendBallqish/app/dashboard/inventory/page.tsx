import { ProductStocksPage } from '@/components/modules/inventory/ProductStocksPage';
import { CategoryManagement } from '@/components/modules/master/CategoryManagement';
import { ProductManagement } from '@/components/modules/master/ProductManagement';
import { ModuleTabs } from '@/components/ui/ModuleTabs';

const tabs = [
  { id: 'products', label: 'Produk', description: 'Katalog dan SKU' },
  { id: 'categories', label: 'Kategori', description: 'Klasifikasi barang' },
  { id: 'stocks', label: 'Stok Gudang & Rak', description: 'Distribusi inventaris' },
];

export default async function InventoryWorkspace({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab ?? 'products';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'products';

  return (
    <div className="space-y-6">
      <ModuleTabs basePath="/dashboard/inventory" activeTab={activeTab} tabs={tabs} />
      {activeTab === 'categories' ? <CategoryManagement /> : activeTab === 'stocks' ? <ProductStocksPage /> : <ProductManagement />}
    </div>
  );
}
