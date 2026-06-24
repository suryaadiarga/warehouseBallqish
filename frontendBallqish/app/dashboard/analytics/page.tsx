import { MovementAnalysisPage } from '@/components/modules/analytics/MovementAnalysisPage';
import { StockAlertsPage } from '@/components/modules/analytics/StockAlertsPage';
import { ModuleTabs } from '@/components/ui/ModuleTabs';

const tabs = [
  { id: 'alerts', label: 'Peringatan Stok' },
  { id: 'movement', label: 'Analisis Pergerakan' },
];

export default async function AnalyticsWorkspace({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab ?? 'alerts';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'alerts';

  return (
    <div className="space-y-6">
      <ModuleTabs basePath="/dashboard/analytics" activeTab={activeTab} tabs={tabs} />
      {activeTab === 'movement' ? <MovementAnalysisPage /> : <StockAlertsPage />}
    </div>
  );
}
