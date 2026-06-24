import { MutationsPage } from '@/components/modules/inventory/MutationsPage';
import { MutationReportsPage } from '@/components/modules/inventory/MutationReportsPage';
import { StockTransfersPage } from '@/components/modules/operations/StockTransfersPage';
import { ModuleTabs } from '@/components/ui/ModuleTabs';

const tabs = [
  { id: 'movements', label: 'Inbound & Outbound' },
  { id: 'transfers', label: 'Transfer' },
  { id: 'mutations', label: 'Mutasi' },
  { id: 'history', label: 'Riwayat & Ekspor' },
];

export default async function OperationsWorkspace({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab ?? 'movements';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'movements';

  return (
    <div className="space-y-6">
      <ModuleTabs basePath="/dashboard/operations" activeTab={activeTab} tabs={tabs} />
      {activeTab === 'transfers' ? (
        <StockTransfersPage />
      ) : activeTab === 'history' || activeTab === 'mutations' ? (
        <MutationReportsPage />
      ) : (
        <MutationsPage />
      )}
    </div>
  );
}
