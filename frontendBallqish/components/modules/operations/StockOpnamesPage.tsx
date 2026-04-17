'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { hasInventoryAdminAccess } from '@/lib/auth';
import { formatDateTimeId } from '@/lib/format';
import { CheckCircle2, ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ProductOption = { id: number; name: string; sku: string };
type WarehouseOption = { id: number; name: string };

type StockOpnameItem = {
  id: number;
  product_id: number;
  system_qty: number;
  physical_qty: number;
  selisih: number;
  product?: { id: number; name: string; sku: string };
};

type StockOpname = {
  id: number;
  warehouse_id: number;
  user_id: number;
  status: 'draft' | 'completed';
  note?: string | null;
  completed_at?: string | null;
  created_at: string;
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
  items: StockOpnameItem[];
};

export function StockOpnamesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmState, setConfirmState] = useState<StockOpname | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: '',
    note: '',
    items: [{ product_id: '', physical_qty: 0 }],
  });

  const canOperate = hasInventoryAdminAccess(user?.role);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [opnameRes, productRes, warehouseRes] = await Promise.all([
        api.get<ApiEnvelope<StockOpname[]>>('/stock-opnames'),
        api.get<ApiEnvelope<ProductOption[]>>('/products', { params: { per_page: 100 } }),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
      ]);

      setOpnames(opnameRes.data.data);
      setProducts(productRes.data.data);
      setWarehouses(warehouseRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data stock opname.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const draftCount = useMemo(() => opnames.filter((item) => item.status === 'draft').length, [opnames]);
  const completedCount = useMemo(() => opnames.filter((item) => item.status === 'completed').length, [opnames]);

  const addItemRow = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { product_id: '', physical_qty: 0 }],
    }));
  };

  const removeItemRow = (index: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateItem = (index: number, key: 'product_id' | 'physical_qty', value: string | number) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: key === 'physical_qty' ? Number(value) : value,
            }
          : item
      ),
    }));
  };

  const submitOpname = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.warehouse_id) {
      showToast({
        type: 'error',
        title: 'Gudang wajib dipilih',
        description: 'Stock opname harus dilakukan dalam satu gudang.',
      });
      return;
    }

    if (form.items.some((item) => !item.product_id)) {
      showToast({
        type: 'error',
        title: 'Item opname belum lengkap',
        description: 'Setiap baris item harus memiliki produk yang dipilih.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<StockOpname>>('/stock-opnames', {
        warehouse_id: Number(form.warehouse_id),
        note: form.note || undefined,
        items: form.items.map((item) => ({
          product_id: Number(item.product_id),
          physical_qty: Number(item.physical_qty),
        })),
      });

      showToast({
        type: 'success',
        title: 'Draft stock opname dibuat',
        description: response.data.message,
      });
      setForm({
        warehouse_id: '',
        note: '',
        items: [{ product_id: '', physical_qty: 0 }],
      });
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Stock opname gagal dibuat',
        description: extractApiErrorMessage(err, 'Periksa gudang dan item physical quantity yang Anda input.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const completeOpname = async () => {
    if (!confirmState) {
      return;
    }

    setConfirmLoading(true);

    try {
      const response = await api.put<ApiEnvelope<StockOpname>>(`/stock-opnames/${confirmState.id}/complete`);
      showToast({
        type: 'success',
        title: 'Stock opname diselesaikan',
        description: response.data.message,
      });
      setConfirmState(null);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Complete opname gagal',
        description: extractApiErrorMessage(err, 'Backend menolak penyelesaian stock opname ini.'),
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat stock opname" description="Mengambil daftar opname, produk, dan gudang dari backend WMS." />;
  }

  if (error) {
    return <ErrorState title="Stock opname gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Warehouse Operations"
        title="Stock Opnames"
        description="Buat draft stock opname, masukkan physical quantity, lalu selesaikan opname untuk menghasilkan penyesuaian stok dari backend."
        action={
          <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700">
            <Plus size={18} />
            <span>{showForm ? 'Tutup Form' : 'Buat Opname'}</span>
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Total Opnames" value={opnames.length} icon={ClipboardList} description="Semua stock opname dari backend." />
        <MetricCard label="Draft" value={draftCount} icon={ClipboardList} tone="amber" description="Opname yang masih menunggu completion." />
        <MetricCard label="Completed" value={completedCount} icon={CheckCircle2} tone="emerald" description="Opname yang sudah menghasilkan penyesuaian stok." />
      </div>

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          {!canOperate ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Role Anda bukan admin gudang. Backend dapat menolak complete opname jika otoritas tidak cukup.</div> : null}

          <form onSubmit={submitOpname} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Warehouse</label>
                <select value={form.warehouse_id} onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required>
                  <option value="">Pilih gudang</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Catatan</label>
                <input value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Contoh: opname mingguan gudang utama" />
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Item Opname</h3>
                  <p className="mt-1 text-sm text-slate-500">Input physical quantity per produk.</p>
                </div>
                <button type="button" onClick={addItemRow} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Tambah Baris</button>
              </div>

              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={`opname-item-${index}`} className="grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[1fr_180px_auto]">
                    <select value={item.product_id} onChange={(event) => updateItem(index, 'product_id', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required>
                      <option value="">Pilih produk</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                    <input type="number" min={0} value={item.physical_qty} onChange={(event) => updateItem(index, 'physical_qty', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Physical qty" required />
                    <button type="button" onClick={() => removeItemRow(index)} disabled={form.items.length === 1} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40">
                      <Trash2 size={16} />
                      <span>Hapus</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Simpan Draft Opname'}
            </button>
          </form>
        </section>
      ) : null}

      {opnames.length === 0 ? (
        <EmptyState title="Belum ada stock opname" description="Buat draft opname pertama untuk mulai membandingkan stok fisik dan stok sistem." />
      ) : (
        <div className="space-y-5">
          {opnames.map((opname) => (
            <section key={opname.id} className="surface-card rounded-[28px] overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Stock Opname #{opname.id}</p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">{opname.warehouse?.name ?? `Warehouse #${opname.warehouse_id}`}</h3>
                  <p className="mt-1 text-sm text-slate-500">Dibuat {formatDateTimeId(opname.created_at)} oleh {opname.user?.name ?? '-'}</p>
                  {opname.note ? <p className="mt-3 text-sm text-slate-600">{opname.note}</p> : null}
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  {opname.status === 'completed' ? <StatusBadge label="completed" tone="safe" /> : <StatusBadge label="draft" tone="warning" />}
                  {opname.status === 'draft' ? (
                    <button type="button" onClick={() => setConfirmState(opname)} className="rounded-2xl bg-sky-600 px-4 py-3 font-bold text-white transition hover:bg-sky-700">
                      Complete Opname
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500">Completed {formatDateTimeId(opname.completed_at)}</p>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Produk</th>
                      <th className="px-6 py-4">System Qty</th>
                      <th className="px-6 py-4">Physical Qty</th>
                      <th className="px-6 py-4">Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opname.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{item.product?.name ?? `Produk #${item.product_id}`}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.product?.sku ?? '-'}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{item.system_qty}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{item.physical_qty}</td>
                        <td className={`px-6 py-4 font-black ${item.selisih === 0 ? 'text-slate-700' : item.selisih > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.selisih > 0 ? `+${item.selisih}` : item.selisih}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog open={Boolean(confirmState)} title="Selesaikan stock opname ini?" description="Completion akan menghasilkan penyesuaian stok otomatis berdasarkan selisih tiap item." confirmLabel="Ya, Selesaikan Opname" loading={confirmLoading} onCancel={() => setConfirmState(null)} onConfirm={() => void completeOpname()} />
    </div>
  );
}
