'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { InventoryMovementBadge } from '@/components/ui/InventoryMovementBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { formatDateTimeId } from '@/lib/format';
import { Download, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';

type ReportMutation = {
  id: number;
  reference_number?: string | null;
  quantity: number;
  type: 'in' | 'out';
  status: 'draft' | 'approved';
  mutation_source?: string | null;
  note?: string | null;
  reason?: string | null;
  created_at: string;
  product?: { name?: string; sku?: string };
  user?: { name?: string };
  approver?: { name?: string };
};

type ReportMeta = {
  total_in?: number;
  total_out?: number;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export function MutationReportsPage() {
  const { showToast } = useToast();
  const [mutations, setMutations] = useState<ReportMutation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
  });
  const [meta, setMeta] = useState<ReportMeta | null>(null);

  const loadData = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<ApiEnvelope<ReportMutation[]>>('/reports/mutations', {
        params: {
          page,
          start_date: currentFilters.start_date || undefined,
          end_date: currentFilters.end_date || undefined,
        },
      });
      setMutations(response.data.data);
      setMeta((response.data.meta as ReportMeta | undefined) ?? null);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat laporan mutasi.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = () => {
    if (mutations.length === 0) {
      showToast({
        type: 'info',
        title: 'Tidak ada data',
        description: 'Tidak ada baris report yang bisa diekspor pada filter saat ini.',
      });
      return;
    }

    const rows = [
      ['Reference', 'Tanggal', 'Produk', 'SKU', 'Type', 'Source', 'Qty', 'Status', 'Created By', 'Approved By', 'Catatan'],
      ...mutations.map((item) => [
        item.reference_number || '-',
        formatDateTimeId(item.created_at),
        item.product?.name || '-',
        item.product?.sku || '-',
        item.type,
        item.mutation_source || '-',
        String(item.quantity),
        item.status,
        item.user?.name || '-',
        item.approver?.name || '-',
        item.reason || item.note || '-',
      ]),
    ];

    const csvContent = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `mutation-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingState title="Memuat laporan mutasi" description="Mengambil histori mutation report dari backend inventory." />;
  }

  if (error) {
    return <ErrorState title="Laporan mutasi gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit & Reporting"
        title="Mutation Reports"
        description="Laporan mutasi premium untuk audit operasional gudang, dilengkapi filter tanggal dan export CSV."
        action={
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        }
      />

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Filter Report</h3>
            <p className="mt-1 text-sm text-slate-500">Gunakan rentang tanggal untuk memeriksa mutasi pada periode tertentu. Endpoint report backend saat ini mengirim detail produk dan aktor, tetapi belum menyertakan relasi gudang.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input type="date" value={filters.start_date} onChange={(e) => setFilters((current) => ({ ...current, start_date: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500" />
            <input type="date" value={filters.end_date} onChange={(e) => setFilters((current) => ({ ...current, end_date: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500" />
            <button type="button" onClick={() => void loadData(1, filters)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800">
              <Filter size={16} />
              <span>Apply</span>
            </button>
          </div>
        </div>

        {mutations.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada report" description="Tidak ada mutasi yang cocok dengan filter laporan saat ini." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">Movement</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mutations.map((mutation) => (
                    <tr key={mutation.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-slate-600">{formatDateTimeId(mutation.created_at)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-700">{mutation.reference_number || '-'}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{mutation.product?.name || '-'}</p>
                        <p className="mt-1 text-xs text-slate-500">{mutation.product?.sku || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <InventoryMovementBadge type={mutation.type} />
                          {mutation.mutation_source ? <InventoryMovementBadge source={mutation.mutation_source} /> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{mutation.quantity}</td>
                      <td className="px-6 py-4">
                        {mutation.status === 'approved' ? <StatusBadge label="approved" tone="safe" /> : <StatusBadge label="draft" tone="warning" />}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        <p>Created: {mutation.user?.name || '-'}</p>
                        <p className="mt-1">Approved: {mutation.approver?.name || '-'}</p>
                        <p className="mt-1 text-slate-500">{mutation.reason || mutation.note || 'Tanpa catatan'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
              <div className="flex gap-6">
                <span>Total IN: <strong className="text-slate-800">{meta?.total_in ?? 0}</strong></span>
                <span>Total OUT: <strong className="text-slate-800">{meta?.total_out ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadData((meta?.pagination?.current_page ?? 1) - 1, filters)}
                  disabled={(meta?.pagination?.current_page ?? 1) <= 1}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <span>
                  Hal {meta?.pagination?.current_page ?? 1} dari {meta?.pagination?.last_page ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => void loadData((meta?.pagination?.current_page ?? 1) + 1, filters)}
                  disabled={(meta?.pagination?.current_page ?? 1) >= (meta?.pagination?.last_page ?? 1)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
