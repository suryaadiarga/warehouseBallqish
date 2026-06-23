'use client';

import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type WarehouseOption = { id: number; name: string };

type StockAlertItem = {
  product_id: number;
  sku: string;
  name: string;
  category?: string | null;
  warehouse_id?: number | null;
  current_stock: number;
  min_stock_level: number;
  avg_daily_usage: number;
  forecast_daily_usage: number;
  forecast_method: 'ewma' | 'croston_sba';
  confidence_score: number;
  critical_score: number;
  demand_spike: boolean;
  lead_time_days: number;
  safety_stock: number;
  risk_reasons: string[];
  total_outbound_last_30_days: number;
  movement_count_last_30_days: number;
  estimated_days_until_stockout?: number | null;
  estimated_stockout_date?: string | null;
  status: 'safe' | 'warning' | 'critical';
  recommendation: number;
  recommended_restock_qty: number;
};

export function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlertItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (selectedWarehouseId = warehouseId) => {
    setLoading(true);
    setError('');

    try {
      const [alertRes, warehouseRes] = await Promise.all([
        api.get<ApiEnvelope<StockAlertItem[]>>('/stock-alerts', {
          params: {
            warehouse_id: selectedWarehouseId || undefined,
          },
        }),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
      ]);

      setAlerts(alertRes.data.data);
      setWarehouses(warehouseRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data stock alerts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const criticalCount = useMemo(() => alerts.filter((item) => item.status === 'critical').length, [alerts]);
  const warningCount = useMemo(() => alerts.filter((item) => item.status === 'warning').length, [alerts]);
  const totalRecommendation = useMemo(() => alerts.reduce((sum, item) => sum + item.recommended_restock_qty, 0), [alerts]);
  const selectedWarehouseName = warehouses.find((warehouse) => String(warehouse.id) === warehouseId)?.name ?? 'Semua gudang';

  if (loading) {
    return <LoadingState title="Memuat peringatan stok" description="Mengambil hasil analitik stok kritis dan prediksi stock habis dari backend." />;
  }

  if (error) {
    return <ErrorState title="Stock alerts gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventaris Cerdas"
        title="Peringatan Stok"
        description="Deteksi gabungan menggunakan EWMA untuk permintaan stabil, Croston/SBA untuk permintaan berselang, serta skor kritis berbasis waktu tunggu dan stok pengaman."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Produk Kritis" value={criticalCount} icon={AlertTriangle} tone="rose" description="Produk yang diprediksi akan habis sangat cepat atau stoknya terlalu rendah." />
        <MetricCard label="Produk Waspada" value={warningCount} icon={AlertTriangle} tone="amber" description="Produk yang sudah mendekati batas minimum stok." />
        <MetricCard label="Saran Pengisian Ulang" value={totalRecommendation} icon={PackageSearch} tone="emerald" description="Total rekomendasi pengisian ulang dari hasil analitik saat ini." />
      </div>

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Filter Gudang</h3>
            <p className="mt-1 text-sm text-slate-500">Scope alert saat ini: {selectedWarehouseName}.</p>
          </div>
          <div className="flex w-full max-w-md gap-3">
            <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Semua gudang</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void loadData(warehouseId)} className="rounded-2xl bg-sky-600 px-4 py-3 font-bold text-white transition hover:bg-sky-700">
              Terapkan
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Tidak ada peringatan aktif" description="Semua produk berada pada status aman untuk cakupan gudang yang dipilih." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4">Saat Ini / Minimum</th>
                  <th className="px-6 py-4">Prediksi AI</th>
                  <th className="px-6 py-4">Prediksi Habis</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Pengisian Ulang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <tr key={`${alert.product_id}-${alert.warehouse_id ?? 'all'}`} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{alert.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{alert.sku}</p>
                      <p className="mt-1 text-xs text-slate-400">{alert.category ?? 'Tanpa kategori'}</p>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-sky-600">{alert.forecast_method === 'croston_sba' ? 'Croston/SBA' : 'EWMA'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-black text-slate-900">{alert.current_stock}</p>
                      <p className="mt-1 text-xs text-slate-500">Minimum {alert.min_stock_level}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p className="font-bold">Prediksi {alert.forecast_daily_usage}/hari</p>
                      <p className="mt-1 text-xs text-slate-500">Historis {alert.avg_daily_usage}/hari · {alert.total_outbound_last_30_days} qty</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p className="font-bold">{alert.estimated_days_until_stockout ?? '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{alert.estimated_stockout_date ?? 'Belum dapat diprediksi'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge label={alert.status} tone={alert.status === 'critical' ? 'critical' : alert.status === 'warning' ? 'warning' : 'safe'} />
                      <p className="mt-2 text-xs font-bold text-slate-700">Risiko {alert.critical_score}/100</p>
                      <p className="mt-1 text-xs text-slate-500">Tingkat keyakinan {alert.confidence_score}%</p>
                      {alert.demand_spike ? <p className="mt-1 text-xs font-bold text-rose-600">Lonjakan permintaan</p> : null}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-emerald-700">{alert.recommended_restock_qty}</p>
                      <p className="mt-1 text-xs text-slate-500">Lead time {alert.lead_time_days} hari</p>
                      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-600">{alert.risk_reasons[0]}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
