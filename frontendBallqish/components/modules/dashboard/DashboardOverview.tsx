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
  recent_activities: Array<{
    id: number;
    type: 'in' | 'out';
    quantity: number;
    created_at: string;
    product?: { name?: string };
  }>;
};

type InsightItem = {
  product_id: number;
  sku: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  avg_daily_usage: number;
  forecast_daily_usage: number;
  forecast_method: 'ewma' | 'croston_sba';
  confidence_score: number;
  critical_score: number;
  demand_spike: boolean;
  risk_reasons: string[];
  estimated_days_until_stockout: number | null;
  estimated_stockout_date: string | null;
  status: 'safe' | 'warning' | 'critical';
  recommended_restock_qty: number;
};

type DashboardInsights = {
  summary: {
    safe_products: number;
    warning_products: number;
    critical_products: number;
  };
  critical_products: InsightItem[];
  fast_moving_products: InsightItem[];
  slow_moving_products: InsightItem[];
};

const summaryCards = [
  {
    key: 'safe_products',
    label: 'Safe Products',
    icon: ShieldCheck,
    tone: 'safe' as const,
  },
  {
    key: 'warning_products',
    label: 'Warning Products',
    icon: AlertTriangle,
    tone: 'warning' as const,
  },
  {
    key: 'critical_products',
    label: 'Critical Products',
    icon: ChartColumnIncreasing,
    tone: 'critical' as const,
  },
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

function InsightTable({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: InsightItem[];
}) {
  return (
    <section className="surface-card rounded-[28px] overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Belum ada insight"
            description="Data akan muncul setelah backend memiliki riwayat pergerakan stok yang cukup."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">AI Forecast</th>
                <th className="px-6 py-4">Prediksi Habis</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={`${title}-${item.product_id}`} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{item.sku}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {item.current_stock} / min {item.min_stock_level}
                  </td>
                  <td className="px-6 py-4"><span className="font-bold">{item.forecast_daily_usage}/hari</span><span className="mt-1 block text-xs text-slate-500">Avg {item.avg_daily_usage} · {item.forecast_method === 'croston_sba' ? 'Croston/SBA' : 'EWMA'}</span></td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">
                      {item.estimated_days_until_stockout ?? '-'} hari
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{item.estimated_stockout_date ?? 'Belum terprediksi'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge label={item.status} tone={item.status} />
                    <p className="mt-2 text-xs font-bold text-slate-700">Risk {item.critical_score} · Confidence {item.confidence_score}%</p>
                    {item.demand_spike ? <p className="mt-1 text-xs font-bold text-rose-600">Demand spike</p> : null}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">{item.recommended_restock_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        if (active) setInsightsError(extractApiErrorMessage(err, 'Gagal memuat insight dashboard.'));
      })
      .finally(() => {
        if (active) setInsightsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations Overview"
        title="Dashboard Ballqish WMS"
        description="Ringkasan gudang, insight stok kritis, dan tren pergerakan produk ditampilkan langsung dari endpoint analytics backend."
      />

      {insightsLoading ? (
        <LoadingState title="Memuat insight stok" description="Menghitung status dan tren pergerakan produk." />
      ) : insightsError ? (
        <ErrorState title="Insight dashboard gagal dimuat" description={insightsError} />
      ) : insights ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const value = insights.summary[card.key as keyof DashboardInsights['summary']];

            return (
              <div key={card.key} className="surface-card rounded-[28px] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                    <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${card.tone === 'safe' ? 'bg-emerald-50 text-emerald-600' : card.tone === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Icon size={22} />
                  </div>
                </div>
                <div className="mt-4">
                  <StatusBadge label={card.tone} tone={card.tone} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Insight belum tersedia" description="Backend belum mengembalikan data insight." />
      )}

      {dashboardLoading ? (
        <LoadingState title="Memuat ringkasan operasional" description="Mengambil total produk dan mutasi hari ini." />
      ) : dashboardError ? (
        <ErrorState title="Ringkasan dashboard gagal dimuat" description={dashboardError} />
      ) : dashboard ? (
        <div className="grid gap-5 xl:grid-cols-3">
        <div className="surface-card rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
              <Boxes size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Total SKU</p>
              <p className="text-2xl font-black text-slate-950">{dashboard.total_products}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Inbound Today</p>
              <p className="text-2xl font-black text-slate-950">{dashboard.total_inbound_today}</p>
            </div>
          </div>
        </div>
        <div className="surface-card rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-50 p-3 text-orange-600">
              <ArrowDownRight size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Outbound Today</p>
              <p className="text-2xl font-black text-slate-950">{dashboard.total_outbound_today}</p>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <EmptyState title="Ringkasan belum tersedia" description="Backend belum mengembalikan ringkasan dashboard." />
      )}

      {insights ? <>
        <InsightTable
          title="Critical Products"
          description="Produk yang perlu perhatian cepat berdasarkan aturan stok minimum dan prediksi kehabisan."
          items={insights.critical_products}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <InsightTable
            title="Fast Moving Products"
            description="Produk dengan rata-rata pengeluaran tertinggi pada periode analisis backend."
            items={insights.fast_moving_products}
          />
          <InsightTable
            title="Slow Moving Products"
            description="Produk yang tetap bergerak, tetapi dengan usage harian paling rendah."
            items={insights.slow_moving_products}
          />
        </div>
      </> : null}
    </div>
  );
}
