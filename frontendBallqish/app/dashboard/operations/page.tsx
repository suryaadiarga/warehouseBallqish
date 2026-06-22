import { MutationsPage } from '@/components/modules/inventory/MutationsPage';
import { MutationReportsPage } from '@/components/modules/inventory/MutationReportsPage';
import { StockAdjustmentsPage } from '@/components/modules/operations/StockAdjustmentsPage';
import { StockTransfersPage } from '@/components/modules/operations/StockTransfersPage';
import { ModuleTabs } from '@/components/ui/ModuleTabs';

const tabs = [
  { id: 'mutations', label: 'Mutasi', description: 'Barang masuk & keluar' },
  { id: 'transfers', label: 'Transfer', description: 'Antar-rak dan gudang' },
  { id: 'adjustments', label: 'Adjustment', description: 'Koreksi stok' },
  { id: 'history', label: 'Riwayat & Export', description: 'Audit transaksi' },
];

export default async function OperationsWorkspace({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab ?? 'mutations';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'mutations';

  return (
    <div className="space-y-6">
      <ModuleTabs basePath="/dashboard/operations" activeTab={activeTab} tabs={tabs} />
      {activeTab === 'transfers' ? (
        <StockTransfersPage />
      ) : activeTab === 'adjustments' ? (
        <StockAdjustmentsPage />
      ) : activeTab === 'history' ? (
        <MutationReportsPage />
      ) : (
        <MutationsPage />
      )}
    </div>
  );
}
