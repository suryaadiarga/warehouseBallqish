'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InventoryMovementBadge } from '@/components/ui/InventoryMovementBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { hasInventoryAdminAccess } from '@/lib/auth';
import { formatDateTimeId } from '@/lib/format';
import { CheckCircle2, Plus, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ProductOption = { id: number; name: string; sku: string; stock: number };
type WarehouseOption = { id: number; name: string };
type WarehouseLocationOption = { id: number; warehouse_id: number; code: string; name: string };

type MutationItem = {
  id: number;
  product_id: number;
  warehouse_id?: number | null;
  warehouse_location_id?: number | null;
  quantity: number;
  type: 'in' | 'out';
  status: 'draft' | 'approved';
  note?: string | null;
  reason?: string | null;
  mutation_source?: string | null;
  reference_number?: string | null;
  created_at: string;
  product?: { id: number; name: string; sku: string };
  warehouse?: { id: number; name: string };
  warehouseLocation?: { id: number; code: string; name: string } | null;
  user?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
};

export function MutationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mutations, setMutations] = useState<MutationItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [dialog, setDialog] = useState<{ mode: 'approve' | 'reject'; item: MutationItem } | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    warehouse_location_id: '',
    type: 'in' as 'in' | 'out',
    quantity: 1,
    note: '',
  });

  const isApprover = hasInventoryAdminAccess(user?.role);

  const filteredLocations = useMemo(() => {
    if (!form.warehouse_id) {
      return locations;
    }

    return locations.filter((item) => String(item.warehouse_id) === form.warehouse_id);
  }, [form.warehouse_id, locations]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [mutationRes, productRes, warehouseRes, locationRes] = await Promise.all([
        api.get<ApiEnvelope<MutationItem[]>>('/reports/mutations'),
        api.get<ApiEnvelope<ProductOption[]>>('/products', { params: { per_page: 1000 } }),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
        api.get<ApiEnvelope<WarehouseLocationOption[]>>('/warehouse-locations'),
      ]);

      setMutations(mutationRes.data.data);
      setProducts(productRes.data.data);
      setWarehouses(warehouseRes.data.data);
      setLocations(locationRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data mutasi stok.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const submitMutation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<MutationItem>>('/mutations', {
        product_id: Number(form.product_id),
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : undefined,
        warehouse_location_id: form.warehouse_location_id ? Number(form.warehouse_location_id) : undefined,
        type: form.type,
        quantity: form.quantity,
        note: form.note || undefined,
      });

      showToast({
        type: 'success',
        title: 'Draft mutasi dibuat',
        description: response.data.message,
      });
      setForm({
        product_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        type: 'in',
        quantity: 1,
        note: '',
      });
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Mutasi gagal dibuat',
        description: extractApiErrorMessage(err, 'Periksa data produk, gudang, dan quantity.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const runDialogAction = async () => {
    if (!dialog) {
      return;
    }

    setDialogLoading(true);

    try {
      if (dialog.mode === 'approve') {
        const response = await api.put<ApiEnvelope<MutationItem>>(`/mutations/${dialog.item.id}/approve`);
        showToast({
          type: 'success',
          title: 'Mutasi disetujui',
          description: response.data.message,
        });
      } else {
        const response = await api.delete<ApiEnvelope<null>>(`/mutations/${dialog.item.id}/reject`);
        showToast({
          type: 'success',
          title: 'Draft mutasi ditolak',
          description: response.data.message,
        });
      }

      setDialog(null);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: dialog.mode === 'approve' ? 'Persetujuan gagal' : 'Penolakan gagal',
        description: extractApiErrorMessage(err, 'Backend menolak aksi mutasi ini.'),
      });
    } finally {
      setDialogLoading(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat mutasi stok" description="Mengambil draf, mutasi yang disetujui, produk, gudang, dan lokasi." />;
  }

  if (error) {
    return <ErrorState title="Mutasi gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alur Inventaris"
        title="Mutasi Stok"
        description="Buat draf mutasi barang masuk/keluar, lalu setujui atau tolak langsung dari ruang kerja inventaris."
        action={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
          >
            <Plus size={18} />
            <span>{showForm ? 'Tutup Form' : 'Input Mutasi'}</span>
          </button>
        }
      />

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          <form onSubmit={submitMutation} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Produk</label>
              <select value={form.product_id} onChange={(e) => setForm((current) => ({ ...current, product_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required>
                <option value="">Pilih produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Gudang</label>
              <select value={form.warehouse_id} onChange={(e) => setForm((current) => ({ ...current, warehouse_id: e.target.value, warehouse_location_id: '' }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">Tanpa gudang spesifik</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Lokasi Gudang</label>
              <select value={form.warehouse_location_id} onChange={(e) => setForm((current) => ({ ...current, warehouse_location_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">Pilih rak otomatis</option>
                {filteredLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} - {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Tipe Mutasi</label>
              <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as 'in' | 'out' }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
                <option value="in">Masuk (IN)</option>
                <option value="out">Keluar (OUT)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Jumlah</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm((current) => ({ ...current, quantity: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required />
            </div>
            <div className="xl:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">Catatan</label>
              <textarea value={form.note} onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Tambahkan catatan bila diperlukan" />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Draft Mutasi'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Daftar Mutasi</h3>
          <p className="mt-1 text-sm text-slate-500">Daftar memakai endpoint laporan mutasi karena backend belum menyediakan endpoint GET khusus mutasi. Konsekuensinya, detail gudang dan lokasi tidak selalu dikirim pada data daftar.</p>
        </div>

        {mutations.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada mutasi" description="Buat draf mutasi pertama untuk mencatat pergerakan stok." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-6 py-4">Pergerakan</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mutations.map((mutation) => (
                  <tr key={mutation.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 text-slate-600">{formatDateTimeId(mutation.created_at)}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{mutation.product?.name ?? `Produk #${mutation.product_id}`}</p>
                      <p className="mt-1 text-xs text-slate-500">{mutation.reference_number || 'Tanpa reference'}</p>
                      <p className="mt-1 text-xs text-slate-400">{mutation.note || mutation.reason || 'Tanpa catatan tambahan'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <InventoryMovementBadge type={mutation.type} />
                        <InventoryMovementBadge source={mutation.mutation_source} />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">{mutation.quantity}</td>
                    <td className="px-6 py-4">
                      {mutation.status === 'approved' ? <StatusBadge label="approved" tone="safe" /> : <StatusBadge label="draft" tone="warning" />}
                      <div className="mt-2 text-xs text-slate-500">
                        <p>Oleh: {mutation.user?.name ?? '-'}</p>
                        <p>Penyetuju: {mutation.approver?.name ?? '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {mutation.status === 'draft' && isApprover ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDialog({ mode: 'approve', item: mutation })}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <CheckCircle2 size={16} />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDialog({ mode: 'reject', item: mutation })}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <XCircle size={16} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">{mutation.status === 'approved' ? 'Selesai' : 'Menunggu admin'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.mode === 'approve' ? 'Setujui mutasi ini?' : 'Tolak draf mutasi ini?'}
        description={
          dialog?.mode === 'approve'
            ? 'Persetujuan akan memperbarui stok di backend sesuai gudang dan lokasi yang dipilih.'
            : 'Penolakan akan menghapus draf mutasi dari sistem backend.'
        }
        confirmLabel={dialog?.mode === 'approve' ? 'Setujui Sekarang' : 'Tolak Draf'}
        tone={dialog?.mode === 'approve' ? 'primary' : 'danger'}
        loading={dialogLoading}
        onCancel={() => setDialog(null)}
        onConfirm={() => void runDialogAction()}
      />
    </div>
  );
}
