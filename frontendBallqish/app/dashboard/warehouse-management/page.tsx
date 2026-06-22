import { WarehouseMapPage } from '@/components/modules/map/WarehouseMapPage';
import { WarehouseLocationManagement } from '@/components/modules/master/WarehouseLocationManagement';
import { WarehouseManagement } from '@/components/modules/master/WarehouseManagement';
import { ModuleTabs } from '@/components/ui/ModuleTabs';

const tabs = [
  { id: 'warehouses', label: 'Gudang', description: 'Lokasi operasional' },
  { id: 'racks', label: 'Rak & Lokasi', description: 'Zona penyimpanan' },
  { id: 'map', label: 'Peta', description: 'Sebaran gudang' },
];

export default async function WarehouseWorkspace({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab ?? 'warehouses';
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'warehouses';

  return (
    <div className="space-y-6">
      <ModuleTabs basePath="/dashboard/warehouse-management" activeTab={activeTab} tabs={tabs} />
      {activeTab === 'racks' ? <WarehouseLocationManagement /> : activeTab === 'map' ? <WarehouseMapPage /> : <WarehouseManagement />}
    </div>
  );
}
