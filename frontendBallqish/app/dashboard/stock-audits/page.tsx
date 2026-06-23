import { StockAdjustmentsPage } from '@/components/modules/operations/StockAdjustmentsPage';
import { StockAuditsPage } from '@/components/modules/operations/StockAuditsPage';
import { ModuleTabs } from '@/components/ui/ModuleTabs';

const tabs = [
  { id: 'audit', label: 'Audit Rak', description: 'Hitung stok fisik' },
  { id: 'adjustments', label: 'Penyesuaian', description: 'Kerusakan, hilang, koreksi' },
];

export default async function StockAuditsRoute({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab ?? 'audit';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'audit';

  return <div className="space-y-6">
    <ModuleTabs basePath="/dashboard/stock-audits" activeTab={activeTab} tabs={tabs} />
    {activeTab === 'adjustments' ? <StockAdjustmentsPage /> : <StockAuditsPage />}
  </div>;
}
