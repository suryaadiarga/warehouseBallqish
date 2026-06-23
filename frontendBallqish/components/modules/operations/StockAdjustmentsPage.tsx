'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InventoryMovementBadge } from '@/components/ui/InventoryMovementBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { hasInventoryAdminAccess } from '@/lib/auth';
import { Boxes, Scale, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ProductOption = { id: number; name: string; sku: string };
type WarehouseOption = { id: number; name: string };
type WarehouseLocationOption = { id: number; warehouse_id: number; code: string; name: string };

type AdjustmentResult = {
  id: number;
  reference_number?: string | null;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  note?: string | null;
  before_qty?: number | null;
  after_qty?: number | null;
  product?: { id: number; name: string; sku: string };
  warehouse?: { id: number; name: string } | null;
  warehouseLocation?: { id: number; code: string; name: string } | null;
};

export function StockAdjustmentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<AdjustmentResult | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    warehouse_location_id: '',
    type: 'increase' as 'increase' | 'decrease',
    quantity: 1,
    reason: '',
    note: '',
  });

  const canOperate = hasInventoryAdminAccess(user?.role);

  const filteredLocations = useMemo(
    () => locations.filter((location) => String(location.warehouse_id) === form.warehouse_id),
    [form.warehouse_id, locations]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [productRes, warehouseRes, locationRes] = await Promise.all([
        api.get<ApiEnvelope<ProductOption[]>>('/products', { params: { per_page: 1000 } }),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
        api.get<ApiEnvelope<WarehouseLocationOption[]>>('/warehouse-locations'),
      ]);

      setProducts(productRes.data.data);
      setWarehouses(warehouseRes.data.data);
      setLocations(locationRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat referensi adjustment stok.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const validateBeforeConfirm = () => {
    if (!form.product_id) {
      showToast({
        type: 'error',
        title: 'Produk wajib dipilih',
        description: 'Pilih produk yang ingin disesuaikan stoknya.',
      });
      return false;
    }

    if (!form.reason.trim()) {
      showToast({
        type: 'error',
        title: 'Reason wajib diisi',
        description: 'Adjustment membutuhkan alasan yang jelas untuk audit operasional.',
      });
      return false;
    }

    if (form.quantity < 1) {
      showToast({
        type: 'error',
        title: 'Quantity tidak valid',
        description: 'Quantity adjustment minimal 1.',
      });
      return false;
    }

    return true;
  };

  const submitAdjustment = async () => {
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<AdjustmentResult>>('/stock-adjustments', {
        product_id: Number(form.product_id),
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : undefined,
        warehouse_location_id: form.warehouse_location_id ? Number(form.warehouse_location_id) : undefined,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason.trim(),
        note: form.note || undefined,
      });

      setResult(response.data.data);
      setConfirmOpen(false);
      setForm({
        product_id: '',
        warehouse_id: '',
        warehouse_location_id: '',
        type: 'increase',
        quantity: 1,
        reason: '',
        note: '',
      });
      showToast({
        type: 'success',
        title: 'Adjustment berhasil',
        description: response.data.message,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Adjustment gagal',
        description: extractApiErrorMessage(err, 'Periksa reason, quantity, dan stok pada gudang yang dipilih.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat data adjustment stok" description="Mengambil referensi master untuk proses koreksi stok." />;
  }

  if (error) {
    return <ErrorState title="Adjustment stok gagal dimuat" description={error} />;
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Audit Stok" title="Stock Adjustments" description="Catat koreksi kerusakan, kehilangan, atau selisih yang ditemukan saat audit." />
        <EmptyState title="Belum ada produk" description="Tambahkan master produk terlebih dahulu sebelum membuat stock adjustment." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit Stok"
        title="Stock Adjustments"
        description="Tindak lanjut hasil audit untuk kerusakan, kehilangan, atau koreksi lain. Setiap perubahan tercatat sebagai mutasi approved."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Products" value={products.length} icon={Boxes} description="Produk yang siap disesuaikan stoknya." />
        <MetricCard label="Warehouses" value={warehouses.length} icon={Warehouse} tone="sky" description="Gudang tersedia untuk adjustment per lokasi." />
        <MetricCard label="Last Adjustment" value={result?.reference_number ?? '-'} icon={Scale} tone="amber" description="Reference adjustment terakhir yang diproses." />
      </div>

      <section className="surface-card rounded-[28px] p-6">
        {!canOperate ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Role Anda bukan admin gudang. Backend bisa menolak adjustment jika otoritas tidak cukup.</div> : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (validateBeforeConfirm()) {
              setConfirmOpen(true);
            }
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Produk</label>
            <select value={form.product_id} onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required>
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
            <select value={form.warehouse_id} onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value, warehouse_location_id: '' }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
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
            <select value={form.warehouse_location_id} onChange={(event) => setForm((current) => ({ ...current, warehouse_location_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Pilih rak otomatis</option>
              {filteredLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Tipe Adjustment</label>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as 'increase' | 'decrease' }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Quantity</label>
            <input type="number" min={1} value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">Reason</label>
            <input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Contoh: Barang rusak saat pengecekan." required />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">Catatan</label>
            <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Tambahkan catatan tambahan jika diperlukan." />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700">Proses Adjustment</button>
          </div>
        </form>
      </section>

      {result ? (
        <section className="surface-card rounded-[28px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Adjustment Result</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{result.product?.name ?? 'Produk adjustment'}</h3>
              <p className="mt-1 text-sm text-slate-500">{result.reference_number ?? 'Tanpa reference number'}</p>
            </div>
            <div className="flex gap-2">
              <InventoryMovementBadge type={result.type} />
              <InventoryMovementBadge source="adjustment" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricCard label="Before Qty" value={result.before_qty ?? '-'} icon={Scale} tone="slate" />
            <MetricCard label="Changed Qty" value={result.quantity} icon={Scale} tone={result.type === 'in' ? 'emerald' : 'rose'} />
            <MetricCard label="After Qty" value={result.after_qty ?? '-'} icon={Scale} tone="emerald" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Reason</p>
              <p className="mt-2 font-semibold text-slate-900">{result.reason}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Warehouse Scope</p>
              <p className="mt-2 font-semibold text-slate-900">{result.warehouse?.name ?? 'Tanpa gudang spesifik'}</p>
              <p className="mt-1 text-sm text-slate-500">{result.warehouseLocation ? `${result.warehouseLocation.code} - ${result.warehouseLocation.name}` : 'Tanpa lokasi detail'}</p>
            </div>
          </div>
        </section>
      ) : null}

      <ConfirmDialog open={confirmOpen} title="Proses adjustment stok?" description="Adjustment akan langsung memengaruhi stok dan tersimpan sebagai mutasi approved di backend." confirmLabel="Ya, Proses Adjustment" loading={submitting} onCancel={() => setConfirmOpen(false)} onConfirm={() => void submitAdjustment()} />
    </div>
  );
}
