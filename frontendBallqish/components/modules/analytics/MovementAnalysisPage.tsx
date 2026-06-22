'use client';

import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChartColumn } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type WarehouseOption = { id: number; name: string };

type MovementItem = {
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
  total_outbound_last_30_days: number;
  movement_count_last_30_days: number;
  estimated_days_until_stockout?: number | null;
  estimated_stockout_date?: string | null;
  status: 'safe' | 'warning' | 'critical';
  recommended_restock_qty: number;
};

type MovementMeta = {
  warehouse_id?: number | null;
  lookback_days?: number;
};

export function MovementAnalysisPage() {
  const [items, setItems] = useState<MovementItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [meta, setMeta] = useState<MovementMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (selectedWarehouseId = warehouseId) => {
    setLoading(true);
    setError('');

    try {
      const [analysisRes, warehouseRes] = await Promise.all([
        api.get<ApiEnvelope<MovementItem[]>>('/products/movement-analysis', {
          params: { warehouse_id: selectedWarehouseId || undefined },
        }),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
      ]);

      setItems(analysisRes.data.data);
      setMeta((analysisRes.data.meta as MovementMeta | undefined) ?? null);
      setWarehouses(warehouseRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat movement analysis.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItems = useMemo(() => items.filter((item) => item.forecast_daily_usage > 0), [items]);
  const fastMoving = useMemo(() => [...activeItems].sort((a, b) => b.forecast_daily_usage - a.forecast_daily_usage).slice(0, 5), [activeItems]);
  const slowMoving = useMemo(() => [...activeItems].sort((a, b) => a.forecast_daily_usage - b.forecast_daily_usage).slice(0, 5), [activeItems]);
  const selectedWarehouseName = warehouses.find((warehouse) => String(warehouse.id) === warehouseId)?.name ?? 'Semua gudang';

  if (loading) {
    return <LoadingState title="Memuat movement analysis" description="Mengambil analisis rata-rata pengeluaran dan ranking pergerakan produk dari backend." />;
  }

  if (error) {
    return <ErrorState title="Movement analysis gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Smart Inventory"
        title="Movement Analysis"
        description="Forecast 90 hari menggunakan EWMA dan Croston/SBA untuk membaca fast moving, slow moving, serta risiko stockout."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Analyzed Products" value={items.length} icon={ChartColumn} description={`Lookback ${meta?.lookback_days ?? 30} hari dari backend.`} />
        <MetricCard label="Fast Moving" value={fastMoving.length} icon={ArrowUpWideNarrow} tone="emerald" description={`Produk dengan avg usage tertinggi pada scope ${selectedWarehouseName}.`} />
        <MetricCard label="Slow Moving" value={slowMoving.length} icon={ArrowDownWideNarrow} tone="amber" description="Produk aktif dengan avg usage terendah." />
      </div>

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Filter Scope</h3>
            <p className="mt-1 text-sm text-slate-500">Analisis saat ini untuk {selectedWarehouseName}.</p>
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

        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada analisis pergerakan" description="Belum ada data mutasi approved yang cukup untuk dihitung pada scope ini." />
          </div>
        ) : (
          <>
            <div className="grid gap-5 border-b border-slate-100 p-6 xl:grid-cols-2">
              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <ArrowUpWideNarrow size={18} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Fast Moving Products</h4>
                    <p className="mt-1 text-sm text-slate-500">Produk dengan penggunaan harian tertinggi.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {fastMoving.map((item, index) => (
                    <div key={`fast-${item.product_id}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">#{index + 1} {item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.sku}</p>
                      </div>
                      <p className="text-lg font-black text-emerald-700">{item.forecast_daily_usage}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <ArrowDownWideNarrow size={18} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Slow Moving Products</h4>
                    <p className="mt-1 text-sm text-slate-500">Produk aktif dengan pergerakan paling lambat.</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {slowMoving.map((item, index) => (
                    <div key={`slow-${item.product_id}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">#{index + 1} {item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.sku}</p>
                      </div>
                      <p className="text-lg font-black text-amber-700">{item.forecast_daily_usage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">Forecast</th>
                    <th className="px-6 py-4">Outbound 30 Hari</th>
                    <th className="px-6 py-4">Stockout</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.product_id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-black text-slate-700">#{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.sku}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{item.forecast_daily_usage}<span className="mt-1 block text-xs font-normal text-slate-500">{item.forecast_method === 'croston_sba' ? 'Croston/SBA' : 'EWMA'} · {item.confidence_score}%</span></td>
                      <td className="px-6 py-4 text-slate-700">
                        <p>{item.total_outbound_last_30_days}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.movement_count_last_30_days} movement</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <p>{item.estimated_days_until_stockout ?? '-'}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.estimated_stockout_date ?? 'Belum dapat diprediksi'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label={item.status} tone={item.status === 'critical' ? 'critical' : item.status === 'warning' ? 'warning' : 'safe'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
