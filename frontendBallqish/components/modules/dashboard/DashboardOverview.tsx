'use client';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ChartColumnIncreasing,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type DashboardData = {
  total_products: number;
  total_inbound_today: number;
  total_outbound_today: number;
};

type InsightItem = {
  product_id: number;
  sku: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  forecast_daily_usage: number;
  days_since_last_outbound: number;
  movement_status: 'active' | 'slow_moving' | 'dead_stock' | 'stock_out';
  estimated_days_until_stockout: number | null;
  status: 'safe' | 'warning' | 'critical';
  recommended_restock_qty: number;
};

type DashboardInsights = {
  summary: {
    safe_products: number;
    warning_products: number;
    critical_products: number;
    slow_moving_products: number;
    dead_stock_products: number;
  };
  critical_products: InsightItem[];
  fast_moving_products: InsightItem[];
  slow_moving_products: InsightItem[];
  dead_stock_products: InsightItem[];
};

const summaryCards = [
  { key: 'safe_products', label: 'Produk Aman', icon: ShieldCheck, tone: 'safe' as const },
  { key: 'warning_products', label: 'Produk Waspada', icon: AlertTriangle, tone: 'warning' as const },
  { key: 'critical_products', label: 'Produk Kritis', icon: ChartColumnIncreasing, tone: 'critical' as const },
  { key: 'slow_moving_products', label: 'Slow-moving', icon: ArrowDownRight, tone: 'warning' as const },
  { key: 'dead_stock_products', label: 'Dead Stock', icon: Boxes, tone: 'critical' as const },
];

let dashboardRequest: Promise<DashboardData> | null = null;
let insightsRequest: Promise<DashboardInsights> | null = null;

function fetchDashboard() {
  if (!dashboardRequest) {
    dashboardRequest = api
      .get<ApiEnvelope<DashboardData>>('/dashboard')
      .then((response) => response.data.data)
      .finally(() => {
        dashboardRequest = null;
      });
  }

  return dashboardRequest;
}

function fetchInsights() {
  if (!insightsRequest) {
    insightsRequest = api
      .get<ApiEnvelope<DashboardInsights>>('/dashboard/insights')
      .then((response) => response.data.data)
      .finally(() => {
        insightsRequest = null;
      });
  }

  return insightsRequest;
}

function movementTone(status: InsightItem['movement_status']) {
  if (status === 'dead_stock' || status === 'stock_out') return 'critical';
  if (status === 'slow_moving') return 'warning';
  return 'safe';
}

function ProductList({ title, items }: { title: string; items: InsightItem[] }) {
  const visibleItems = items.slice(0, 5);

  return (
    <section className="surface-card min-w-0 overflow-hidden rounded-[28px]">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
      </div>

      {visibleItems.length === 0 ? (
        <div className="p-5">
          <EmptyState title="Belum ada data" description="Data produk belum tersedia." />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visibleItems.map((item) => {
            const inactive = item.movement_status === 'slow_moving' || item.movement_status === 'dead_stock';

            return (
              <article key={`${title}-${item.product_id}`} className="p-5 transition hover:bg-slate-50/70">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{item.name}</p>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500">{item.sku}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <StatusBadge label={item.status} tone={item.status} />
                    {item.movement_status !== 'active' ? (
                      <StatusBadge label={item.movement_status} tone={movementTone(item.movement_status)} />
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stok</p>
                    <p className="mt-1 font-black text-slate-800">{item.current_stock}</p>
                    <p className="text-xs text-slate-500">Min. {item.min_stock_level}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pemakaian</p>
                    <p className="mt-1 font-black text-slate-800">{item.forecast_daily_usage}/hari</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {inactive ? 'Tidak Bergerak' : 'Estimasi Habis'}
                    </p>
                    <p className="mt-1 font-black text-slate-800">
                      {inactive
                        ? `${item.days_since_last_outbound} hari`
                        : item.estimated_days_until_stockout !== null
                          ? `${item.estimated_days_until_stockout} hari`
                          : '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Isi Ulang</p>
                    <p className="mt-1 font-black text-slate-800">{item.recommended_restock_qty}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DashboardOverview() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [insightsError, setInsightsError] = useState('');

  useEffect(() => {
    let active = true;

    void fetchDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((err: unknown) => {
        if (active) setDashboardError(extractApiErrorMessage(err, 'Gagal memuat ringkasan dashboard.'));
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });

    void fetchInsights()
      .then((data) => {
        if (active) setInsights(data);
      })
      .catch((err: unknown) => {
        if (active) setInsightsError(extractApiErrorMessage(err, 'Gagal memuat data stok.'));
      })
      .finally(() => {
        if (active) setInsightsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader eyebrow="Ringkasan Operasional" title="Dashboard Ballqish WMS" />

      {insightsLoading ? (
        <LoadingState title="Memuat data stok" description="Mohon tunggu sebentar." />
      ) : insightsError ? (
        <ErrorState title="Data stok gagal dimuat" description={insightsError} />
      ) : insights ? (
        <section>
          <div className="mb-4 flex items-center gap-4">
            <h2 className="shrink-0 text-sm font-black uppercase tracking-[0.18em] text-slate-600">Kondisi Stok</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              const value = insights.summary[card.key as keyof DashboardInsights['summary']];

              return (
                <div key={card.key} className="surface-card min-w-0 rounded-[24px] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
                    </div>
                    <div className={`shrink-0 rounded-2xl p-3 ${card.tone === 'safe' ? 'bg-emerald-50 text-emerald-600' : card.tone === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Icon size={21} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState title="Data belum tersedia" description="Belum ada data stok untuk ditampilkan." />
      )}

      <section className="border-t border-slate-200 pt-6">
        <div className="mb-4 flex items-center gap-4">
          <h2 className="shrink-0 text-sm font-black uppercase tracking-[0.18em] text-slate-600">Ringkasan Operasional</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {dashboardLoading ? (
          <LoadingState title="Memuat ringkasan" description="Mohon tunggu sebentar." />
        ) : dashboardError ? (
          <ErrorState title="Ringkasan gagal dimuat" description={dashboardError} />
        ) : dashboard ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface-card rounded-[24px] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-600"><Boxes size={20} /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Total SKU</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{dashboard.total_products}</p>
                </div>
              </div>
            </div>
            <div className="surface-card rounded-[24px] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><ArrowUpRight size={20} /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Barang Masuk Hari Ini</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{dashboard.total_inbound_today}</p>
                </div>
              </div>
            </div>
            <div className="surface-card rounded-[24px] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-50 p-3 text-orange-600"><ArrowDownRight size={20} /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Barang Keluar Hari Ini</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{dashboard.total_outbound_today}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {insights ? (
        <>
          <ProductList title="Produk Kritis" items={insights.critical_products} />
          <div className="grid min-w-0 gap-6 xl:grid-cols-2">
            <ProductList title="Produk Bergerak Cepat" items={insights.fast_moving_products} />
            <ProductList title="Produk Bergerak Lambat" items={insights.slow_moving_products} />
          </div>
          <ProductList title="Dead Stock" items={insights.dead_stock_products} />
        </>
      ) : null}
    </div>
  );
}
