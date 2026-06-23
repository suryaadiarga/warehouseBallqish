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
import { ArrowLeftRight, PackageSearch, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ProductOption = { id: number; category_id: number; name: string; sku: string };
type WarehouseOption = { id: number; name: string };
type WarehouseLocationOption = { id: number; warehouse_id: number; code: string; name: string; quantity?: number; capacity?: number | null; total_quantity?: number | string | null; status?: string; categories?: Array<{ id: number; name: string }> };
type ProductStockPosition = { id: number; warehouse_id: number; warehouse_location_id: number | null; quantity: number; warehouse?: WarehouseOption; warehouse_location?: WarehouseLocationOption | null };

type TransferMutation = {
  id: number;
  reference_number?: string | null;
  type: 'in' | 'out';
  quantity: number;
  before_qty?: number | null;
  after_qty?: number | null;
  warehouse?: { id: number; name: string } | null;
  warehouseLocation?: { id: number; code: string; name: string } | null;
};

type TransferResult = {
  transfer_id: string;
  mutations: TransferMutation[];
};

export function StockTransfersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
  const [stockPositions, setStockPositions] = useState<ProductStockPosition[]>([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    from_warehouse_location_id: '',
    to_warehouse_location_id: '',
    quantity: 1,
    note: '',
  });

  const canOperate = hasInventoryAdminAccess(user?.role);

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
      setError(extractApiErrorMessage(err, 'Gagal memuat referensi transfer stok.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedProduct = products.find((product) => String(product.id) === form.product_id);

  const compatibleDestinationLocations = (warehouseId: string, quantity = form.quantity, sourceLocationId = form.from_warehouse_location_id) => locations
    .filter((location) => String(location.warehouse_id) === warehouseId)
    .filter((location) => location.status === 'active' || !location.status)
    .filter((location) => !selectedProduct || !location.categories?.length || location.categories.some((category) => category.id === selectedProduct.category_id))
    .filter((location) => !location.capacity || Number(location.total_quantity ?? 0) + quantity <= location.capacity)
    .filter((location) => String(location.id) !== sourceLocationId);

  const selectProduct = async (productId: string) => {
    setForm((current) => ({ ...current, product_id: productId, from_warehouse_id: '', from_warehouse_location_id: '', to_warehouse_location_id: '' }));
    setStockPositions([]);
    if (!productId) return;

    setDetectingLocation(true);
    try {
      const response = await api.get<ApiEnvelope<{ stocks: ProductStockPosition[] }>>(`/products/${productId}/stocks`);
      const available = response.data.data.stocks.filter((stock) => stock.quantity > 0 && stock.warehouse_location_id);
      setStockPositions(available);
      const source = available[0];
      if (source) {
        setForm((current) => ({ ...current, product_id: productId, from_warehouse_id: String(source.warehouse_id), from_warehouse_location_id: String(source.warehouse_location_id) }));
      } else {
        showToast({ type: 'error', title: 'Stok tidak ditemukan', description: 'Produk ini belum mempunyai stok pada rak mana pun.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Posisi stok gagal dideteksi', description: extractApiErrorMessage(err) });
    } finally {
      setDetectingLocation(false);
    }
  };

  const fromLocations = useMemo(
    () => stockPositions.filter((stock) => String(stock.warehouse_id) === form.from_warehouse_id && stock.warehouse_location).map((stock) => ({ ...stock.warehouse_location!, quantity: stock.quantity })),
    [form.from_warehouse_id, stockPositions]
  );

  const toLocations = useMemo(
    () => compatibleDestinationLocations(form.to_warehouse_id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.to_warehouse_id, form.from_warehouse_location_id, form.quantity, locations, selectedProduct?.category_id]
  );

  const validateBeforeConfirm = () => {
    if (!form.product_id || !form.from_warehouse_id || !form.to_warehouse_id) {
      showToast({
        type: 'error',
        title: 'Form belum lengkap',
        description: 'Produk, gudang asal, dan gudang tujuan wajib diisi.',
      });
      return false;
    }

    if (form.quantity < 1) {
      showToast({
        type: 'error',
        title: 'Jumlah tidak valid',
        description: 'Jumlah transfer minimal 1.',
      });
      return false;
    }

    return true;
  };

  const submitTransfer = async () => {
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<TransferResult>>('/stock-transfers', {
        product_id: Number(form.product_id),
        from_warehouse_id: Number(form.from_warehouse_id),
        to_warehouse_id: Number(form.to_warehouse_id),
        from_warehouse_location_id: form.from_warehouse_location_id ? Number(form.from_warehouse_location_id) : undefined,
        to_warehouse_location_id: form.to_warehouse_location_id ? Number(form.to_warehouse_location_id) : undefined,
        quantity: Number(form.quantity),
        note: form.note || undefined,
      });

      setResult(response.data.data);
      setConfirmOpen(false);
      setForm({
        product_id: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        from_warehouse_location_id: '',
        to_warehouse_location_id: '',
        quantity: 1,
        note: '',
      });
      showToast({
        type: 'success',
        title: 'Transfer berhasil',
        description: response.data.message,
      });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Transfer gagal',
        description: extractApiErrorMessage(err, 'Periksa stok asal dan pasangan gudang/lokasi yang dipilih.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat data transfer stok" description="Mohon tunggu sebentar." />;
  }

  if (error) {
    return <ErrorState title="Transfer stok gagal dimuat" description={error} />;
  }

  if (products.length === 0 || warehouses.length < 2) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Operasional Gudang" title="Transfer Stok" description="Transfer antar-rak atau antar-gudang dengan pemilihan rak otomatis." />
        <EmptyState title="Referensi transfer belum siap" description="Pastikan minimal ada satu produk dan dua gudang sebelum membuat transfer stok." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional Gudang"
        title="Transfer Stok"
        description="Pindahkan stok antar-rak atau antar-gudang secara atomic. Kosongkan lokasi agar sistem memilih rak asal dan tujuan."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Produk Tersedia" value={products.length} icon={PackageSearch} description="Produk yang bisa dipilih untuk transfer." />
        <MetricCard label="Gudang" value={warehouses.length} icon={Warehouse} tone="sky" description="Gudang sumber dan tujuan transfer." />
        <MetricCard label="Hasil Terakhir" value={result?.transfer_id ?? '-'} icon={ArrowLeftRight} tone="emerald" />
      </div>

      <section className="surface-card rounded-[28px] p-6">
        {!canOperate ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Hanya admin gudang yang dapat memproses transfer.</div> : null}

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
            <select value={form.product_id} onChange={(event) => void selectProduct(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required>
              <option value="">Pilih produk</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Gudang Asal</label>
            <select value={form.from_warehouse_id} onChange={(event) => { const source = stockPositions.find((stock) => String(stock.warehouse_id) === event.target.value); setForm((current) => ({ ...current, from_warehouse_id: event.target.value, from_warehouse_location_id: source?.warehouse_location_id ? String(source.warehouse_location_id) : '' })); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required disabled={detectingLocation}>
              <option value="">Pilih gudang asal</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Lokasi Asal</label>
            <select value={form.from_warehouse_location_id} onChange={(event) => setForm((current) => ({ ...current, from_warehouse_location_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Pilih rak otomatis</option>
              {fromLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name} (stok {location.quantity ?? '-'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Gudang Tujuan</label>
            <select value={form.to_warehouse_id} onChange={(event) => { const candidates = compatibleDestinationLocations(event.target.value); setForm((current) => ({ ...current, to_warehouse_id: event.target.value, to_warehouse_location_id: candidates[0] ? String(candidates[0].id) : '' })); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required>
              <option value="">Pilih gudang tujuan</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Lokasi Tujuan</label>
            <select value={form.to_warehouse_location_id} onChange={(event) => setForm((current) => ({ ...current, to_warehouse_location_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500">
              <option value="">Tidak ada rak sesuai kategori/kapasitas</option>
              {toLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Jumlah</label>
            <input type="number" min={1} value={form.quantity} onChange={(event) => { const quantity = Number(event.target.value); const source = stockPositions.find((stock) => stock.quantity >= quantity) ?? stockPositions[0]; const sourceLocationId = source?.warehouse_location_id ? String(source.warehouse_location_id) : form.from_warehouse_location_id; const destinations = compatibleDestinationLocations(form.to_warehouse_id, quantity, sourceLocationId); setForm((current) => ({ ...current, quantity, from_warehouse_id: source ? String(source.warehouse_id) : current.from_warehouse_id, from_warehouse_location_id: sourceLocationId, to_warehouse_location_id: destinations[0] ? String(destinations[0].id) : '' })); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" required />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">Catatan</label>
            <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Contoh: transfer ke gudang cabang untuk pengisian ulang." />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white transition hover:bg-sky-700">Proses Transfer</button>
          </div>
        </form>
      </section>

      {result ? (
        <section className="surface-card rounded-[28px] overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-black text-slate-900">Hasil Transfer</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Referensi</th>
                  <th className="px-6 py-4">Pergerakan</th>
                  <th className="px-6 py-4">Gudang</th>
                  <th className="px-6 py-4">Sebelum</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Sesudah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.mutations.map((mutation) => (
                  <tr key={mutation.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-slate-700">{mutation.reference_number ?? '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{result.transfer_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <InventoryMovementBadge type={mutation.type} />
                        <InventoryMovementBadge source="transfer" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="font-semibold text-slate-900">{mutation.warehouse?.name ?? '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{mutation.warehouseLocation ? `${mutation.warehouseLocation.code} - ${mutation.warehouseLocation.name}` : 'Tanpa lokasi detail'}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{mutation.before_qty ?? '-'}</td>
                    <td className="px-6 py-4 font-black text-slate-900">{mutation.quantity}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{mutation.after_qty ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <ConfirmDialog open={confirmOpen} title="Proses transfer stok?" description="Transfer akan membuat mutasi keluar dan masuk sekaligus. Backend akan menolak jika stok asal tidak mencukupi." confirmLabel="Ya, Proses Transfer" loading={submitting} onCancel={() => setConfirmOpen(false)} onConfirm={() => void submitTransfer()} />
    </div>
  );
}
