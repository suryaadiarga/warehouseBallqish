'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InventoryMovementBadge } from '@/components/ui/InventoryMovementBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { formatDateTimeId } from '@/lib/format';
import { ArrowDownToLine, ArrowUpFromLine, PackageCheck, Plus, Truck, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type SupplierOption = { id: number; name: string };
type ProductOption = { id: number; supplier_id?: number | null; name: string; sku: string; stock: number; supplier?: SupplierOption | null };
type WarehouseOption = { id: number; name: string };
type WarehouseLocationResult = { id: number; code: string; name: string };

type MutationItem = {
  id: number;
  quantity: number;
  type: 'in' | 'out';
  status: 'draft' | 'approved';
  note?: string | null;
  reason?: string | null;
  mutation_source?: string | null;
  reference_number?: string | null;
  created_at: string;
  product?: { id: number; name: string; sku: string; supplier?: SupplierOption | null };
  warehouse?: { id: number; name: string } | null;
  warehouse_location?: WarehouseLocationResult | null;
  warehouseLocation?: WarehouseLocationResult | null;
  from_warehouse?: { id: number; name: string } | null;
  to_warehouse?: { id: number; name: string } | null;
  user?: { id: number; name: string } | null;
  approver?: { id: number; name: string } | null;
};

type MovementResult = MutationItem & {
  before_qty?: number | null;
  after_qty?: number | null;
};

const isMainWarehouse = (warehouse: WarehouseOption) => /pusat|utama|main/i.test(warehouse.name);

export function MutationsPage() {
  const { showToast } = useToast();
  const [mutations, setMutations] = useState<MutationItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<MovementResult | null>(null);
  const [form, setForm] = useState({
    type: 'in' as 'in' | 'out',
    supplier_id: '',
    product_id: '',
    warehouse_id: '',
    destination_type: 'customer' as 'customer' | 'transit',
    to_warehouse_id: '',
    quantity: 1,
    note: '',
  });

  const mainWarehouse = useMemo(
    () => warehouses.find(isMainWarehouse) ?? warehouses[0],
    [warehouses]
  );

  const filteredProducts = useMemo(() => {
    if (form.type !== 'in' || !form.supplier_id) {
      return products;
    }

    return products.filter((product) => String(product.supplier_id ?? product.supplier?.id ?? '') === form.supplier_id);
  }, [form.supplier_id, form.type, products]);

  const selectedProduct = products.find((product) => String(product.id) === form.product_id);
  const selectedSupplier = suppliers.find((supplier) => String(supplier.id) === form.supplier_id);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [mutationRes, productRes, supplierRes, warehouseRes] = await Promise.all([
        api.get<ApiEnvelope<MutationItem[]>>('/reports/mutations'),
        api.get<ApiEnvelope<ProductOption[]>>('/products', { params: { per_page: 1000 } }),
        api.get<ApiEnvelope<SupplierOption[]>>('/suppliers'),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
      ]);

      setMutations(mutationRes.data.data);
      setProducts(productRes.data.data);
      setSuppliers(supplierRes.data.data);
      setWarehouses(warehouseRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data inbound & outbound.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!form.warehouse_id && mainWarehouse) {
      setForm((current) => ({ ...current, warehouse_id: String(mainWarehouse.id) }));
    }
  }, [form.warehouse_id, mainWarehouse]);

  const setMovementType = (type: 'in' | 'out') => {
    setForm((current) => ({
      ...current,
      type,
      product_id: '',
      supplier_id: type === 'in' ? current.supplier_id : '',
      destination_type: type === 'out' ? current.destination_type : 'customer',
      to_warehouse_id: '',
      note: '',
    }));
    setResult(null);
  };

  const validateBeforeConfirm = () => {
    if (!form.product_id) {
      showToast({ type: 'error', title: 'Produk wajib dipilih', description: 'Pilih produk yang akan diproses.' });
      return false;
    }

    if (form.type === 'in' && !form.supplier_id) {
      showToast({ type: 'error', title: 'Supplier wajib dipilih', description: 'Barang masuk harus dicatat dari supplier yang sesuai.' });
      return false;
    }

    if (form.type === 'out' && form.destination_type === 'transit' && !form.to_warehouse_id) {
      showToast({ type: 'error', title: 'Gudang transit wajib dipilih', description: 'Pilih gudang tujuan transit.' });
      return false;
    }

    if (form.quantity < 1) {
      showToast({ type: 'error', title: 'Jumlah tidak valid', description: 'Jumlah minimal 1.' });
      return false;
    }

    return true;
  };

  const submitMovement = async () => {
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<MovementResult>>('/inventory-movements', {
        type: form.type,
        supplier_id: form.type === 'in' ? Number(form.supplier_id) : undefined,
        product_id: Number(form.product_id),
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : undefined,
        destination_type: form.type === 'out' ? form.destination_type : undefined,
        to_warehouse_id: form.type === 'out' && form.destination_type === 'transit' ? Number(form.to_warehouse_id) : undefined,
        quantity: Number(form.quantity),
        note: form.note.trim() || undefined,
      });

      setResult(response.data.data);
      setConfirmOpen(false);
      setForm((current) => ({
        ...current,
        supplier_id: current.type === 'in' ? current.supplier_id : '',
        product_id: '',
        destination_type: 'customer',
        to_warehouse_id: '',
        quantity: 1,
        note: '',
      }));
      await loadData();
      showToast({ type: 'success', title: 'Transaksi stok berhasil', description: response.data.message });
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Transaksi stok gagal',
        description: extractApiErrorMessage(err, 'Periksa supplier, produk, jumlah, dan stok tersedia.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat inbound & outbound" description="Mengambil supplier, produk, gudang, dan riwayat mutasi." />;
  }

  if (error) {
    return <ErrorState title="Inbound & outbound gagal dimuat" description={error} />;
  }

  const resultLocation = result?.warehouse_location ?? result?.warehouseLocation ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alur Inventaris"
        title="Inbound & Outbound"
        description="Catat stok masuk dari supplier dan stok keluar ke customer atau gudang transit. Rak dipilih otomatis dari kapasitas dan kategori yang sesuai."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Supplier" value={suppliers.length} icon={Truck} description="Sumber barang masuk." />
        <MetricCard label="Produk" value={products.length} icon={PackageCheck} tone="sky" description="Produk yang tersedia di master." />
        <MetricCard label="Gudang Utama" value={mainWarehouse?.name ?? '-'} icon={Warehouse} tone="emerald" />
      </div>

      <section className="surface-card rounded-[28px] p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMovementType('in')}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black transition ${form.type === 'in' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <ArrowDownToLine size={18} />
            <span>Inbound</span>
          </button>
          <button
            type="button"
            onClick={() => setMovementType('out')}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black transition ${form.type === 'out' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            <ArrowUpFromLine size={18} />
            <span>Outbound</span>
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (validateBeforeConfirm()) {
              setConfirmOpen(true);
            }
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {form.type === 'in' ? (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Supplier</label>
              <select
                value={form.supplier_id}
                onChange={(event) => setForm((current) => ({ ...current, supplier_id: event.target.value, product_id: '' }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
                required
              >
                <option value="">Pilih supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Produk</label>
            <select
              value={form.product_id}
              onChange={(event) => setForm((current) => ({ ...current, product_id: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">{form.type === 'in' && !form.supplier_id ? 'Pilih supplier dulu' : 'Pilih produk'}</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">{form.type === 'in' ? 'Masuk ke Gudang' : 'Keluar dari Gudang'}</label>
            <select
              value={form.warehouse_id}
              onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          {form.type === 'out' ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Tujuan Keluar</label>
                <select
                  value={form.destination_type}
                  onChange={(event) => setForm((current) => ({ ...current, destination_type: event.target.value as 'customer' | 'transit', to_warehouse_id: '' }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="customer">Customer</option>
                  <option value="transit">Gudang Transit</option>
                </select>
              </div>
              {form.destination_type === 'transit' ? (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Gudang Transit</label>
                  <select
                    value={form.to_warehouse_id}
                    onChange={(event) => setForm((current) => ({ ...current, to_warehouse_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    <option value="">Pilih gudang transit</option>
                    {warehouses
                      .filter((warehouse) => String(warehouse.id) !== form.warehouse_id)
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}
            </>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Jumlah</label>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm font-bold text-slate-700">Catatan</label>
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={form.type === 'in' ? 'Contoh: Surat jalan supplier, nomor PO, atau kondisi barang.' : 'Contoh: Nomor pembelian customer atau alasan keluar.'}
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:opacity-50">
              <Plus size={18} />
              <span>{submitting ? 'Memproses...' : form.type === 'in' ? 'Catat Inbound' : 'Catat Outbound'}</span>
            </button>
          </div>
        </form>
      </section>

      {result ? (
        <section className="surface-card rounded-[28px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Transaksi Terakhir</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{result.product?.name ?? selectedProduct?.name ?? 'Produk'}</h3>
              <p className="mt-1 font-mono text-sm text-slate-500">{result.reference_number ?? '-'}</p>
            </div>
            <div className="flex gap-2">
              <InventoryMovementBadge type={result.type} />
              <InventoryMovementBadge source={result.mutation_source} />
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="Jumlah" value={result.quantity} icon={PackageCheck} tone={result.type === 'in' ? 'emerald' : 'rose'} />
            <MetricCard label="Gudang" value={result.warehouse?.name ?? '-'} icon={Warehouse} tone="sky" />
            <MetricCard label="Rak Otomatis" value={resultLocation ? `${resultLocation.code} - ${resultLocation.name}` : '-'} icon={Warehouse} tone="slate" />
          </div>
        </section>
      ) : null}

      <section className="surface-card overflow-hidden rounded-[28px]">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Mutasi Terbaru</h3>
        </div>

        {mutations.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada mutasi" description="Belum ada transaksi stok yang tercatat." />
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
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mutations.map((mutation) => {
                  const location = mutation.warehouse_location ?? mutation.warehouseLocation ?? null;

                  return (
                    <tr key={mutation.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-slate-600">{formatDateTimeId(mutation.created_at)}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{mutation.product?.name ?? '-'}</p>
                        <p className="mt-1 text-xs text-slate-500">{mutation.reference_number || mutation.product?.sku || '-'}</p>
                        {mutation.reason ? <p className="mt-1 text-xs text-slate-400">{mutation.reason}</p> : null}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <InventoryMovementBadge type={mutation.type} />
                          <InventoryMovementBadge source={mutation.mutation_source} />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{mutation.quantity}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <p className="font-semibold">{mutation.warehouse?.name ?? '-'}</p>
                        <p className="mt-1 text-xs text-slate-500">{location ? `${location.code} - ${location.name}` : '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {mutation.status === 'approved' ? <StatusBadge label="approved" tone="safe" /> : <StatusBadge label="draft" tone="warning" />}
                        <p className="mt-2 text-xs text-slate-500">Oleh: {mutation.user?.name ?? '-'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={form.type === 'in' ? 'Catat barang masuk?' : 'Catat barang keluar?'}
        description={
          form.type === 'in'
            ? `Stok ${selectedProduct?.name ?? 'produk'} dari ${selectedSupplier?.name ?? 'supplier'} akan masuk ke gudang utama dan rak dipilih otomatis.`
            : `Stok ${selectedProduct?.name ?? 'produk'} akan dikurangi dari gudang asal dan rak dipilih otomatis.`
        }
        confirmLabel={form.type === 'in' ? 'Ya, Catat Masuk' : 'Ya, Catat Keluar'}
        loading={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void submitMovement()}
      />
    </div>
  );
}
