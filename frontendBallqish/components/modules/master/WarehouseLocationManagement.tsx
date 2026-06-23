'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatStatusLabel } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { Boxes, Grid3X3, Layers3, Pencil, Plus, Trash2, Warehouse as WarehouseIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Warehouse = { id: number; name: string };
type Category = { id: number; name: string };

type WarehouseLocation = {
  id: number;
  warehouse_id: number;
  code: string;
  name: string;
  zone?: string | null;
  aisle?: string | null;
  level?: number | null;
  capacity?: number | null;
  status: 'active' | 'inactive' | 'maintenance';
  description?: string | null;
  sku_count?: number;
  total_quantity?: number | string | null;
  warehouse?: Warehouse;
  categories?: Category[];
};

const emptyForm = {
  warehouse_id: '',
  code: '',
  name: '',
  zone: '',
  aisle: '',
  level: '',
  capacity: '',
  status: 'active',
  description: '',
  category_ids: [] as number[],
};

export function WarehouseLocationManagement() {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<WarehouseLocation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [locationRes, warehouseRes, categoryRes] = await Promise.all([
        api.get<ApiEnvelope<WarehouseLocation[]>>('/warehouse-locations'),
        api.get<ApiEnvelope<Warehouse[]>>('/warehouses'),
        api.get<ApiEnvelope<Category[]>>('/categories'),
      ]);

      setLocations(locationRes.data.data);
      setWarehouses(warehouseRes.data.data);
      setCategories(categoryRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data rak gudang.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalCapacity = useMemo(() => locations.reduce((sum, item) => sum + Number(item.capacity ?? 0), 0), [locations]);
  const totalQuantity = useMemo(() => locations.reduce((sum, item) => sum + Number(item.total_quantity ?? 0), 0), [locations]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const editLocation = (location: WarehouseLocation) => {
    setEditingId(location.id);
    setForm({
      warehouse_id: String(location.warehouse_id),
      code: location.code,
      name: location.name,
      zone: location.zone ?? '',
      aisle: location.aisle ?? '',
      level: location.level ? String(location.level) : '',
      capacity: location.capacity ? String(location.capacity) : '',
      status: location.status,
      description: location.description ?? '',
      category_ids: location.categories?.map((category) => category.id) ?? [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      warehouse_id: Number(form.warehouse_id),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      zone: form.zone.trim() || null,
      aisle: form.aisle.trim() || null,
      level: form.level ? Number(form.level) : null,
      capacity: form.capacity ? Number(form.capacity) : null,
      status: form.status,
      description: form.description.trim() || null,
      category_ids: form.category_ids,
    };

    try {
      const response = editingId
        ? await api.put<ApiEnvelope<WarehouseLocation>>(`/warehouse-locations/${editingId}`, payload)
        : await api.post<ApiEnvelope<WarehouseLocation>>('/warehouse-locations', payload);

      showToast({
        type: 'success',
        title: editingId ? 'Rak diperbarui' : 'Rak ditambahkan',
        description: response.data.message,
      });
      resetForm();
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: editingId ? 'Rak gagal diperbarui' : 'Rak gagal ditambahkan',
        description: extractApiErrorMessage(err, 'Periksa gudang, kode rak, kapasitas, dan kategori.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLocation = async () => {
    if (!deletingLocation) return;
    setDeleting(true);

    try {
      const response = await api.delete<ApiEnvelope<null>>(`/warehouse-locations/${deletingLocation.id}`);
      showToast({ type: 'success', title: 'Rak dihapus', description: response.data.message });
      setDeletingLocation(null);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Rak tidak dapat dihapus',
        description: extractApiErrorMessage(err, 'Rak masih digunakan oleh stok atau transaksi.'),
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState title="Memuat rak gudang" description="Mengambil zona, kapasitas, kategori, dan isi rak." />;
  if (error) return <ErrorState title="Rak gudang gagal dimuat" description={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tata Letak Gudang"
        title="Rak & Lokasi Gudang"
        description="Atur zona penyimpanan, kapasitas, dan kategori barang yang diperbolehkan pada setiap rak."
        action={
          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
          >
            <Plus size={18} />
            {showForm ? 'Tutup Form' : 'Tambah Rak'}
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Rak" value={locations.length} icon={Grid3X3} description="Seluruh rak dan area transit." />
        <MetricCard label="Rak Aktif" value={locations.filter((item) => item.status === 'active').length} icon={WarehouseIcon} tone="emerald" description="Lokasi yang siap dipakai." />
        <MetricCard label="Kapasitas" value={totalCapacity.toLocaleString('id-ID')} icon={Layers3} tone="sky" description="Total kapasitas unit." />
        <MetricCard label="Stok Tersimpan" value={totalQuantity.toLocaleString('id-ID')} icon={Boxes} description="Jumlah stok pada seluruh rak." />
      </div>

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          <div className="mb-5">
            <h3 className="text-lg font-black text-slate-900">{editingId ? 'Edit Rak' : 'Rak Baru'}</h3>
            <p className="mt-1 text-sm text-slate-500">Kode rak unik di dalam setiap gudang, misalnya A1, B2, atau T1.</p>
          </div>
          <form onSubmit={submitLocation} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm font-bold text-slate-700 xl:col-span-2">
              Gudang
              <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.warehouse_id} onChange={(event) => setForm((current) => ({ ...current, warehouse_id: event.target.value }))} required>
                <option value="">Pilih gudang</option>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Kode Rak
              <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 uppercase outline-none focus:ring-2 focus:ring-sky-500" placeholder="A1" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Status
              <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
                <option value="maintenance">Pemeliharaan</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700 xl:col-span-2">
              Nama Rak
              <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Rak Sistem Pengereman" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Zona
              <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="A" value={form.zone} onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Lorong/Fungsi
              <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Komponen Kendaraan" value={form.aisle} onChange={(event) => setForm((current) => ({ ...current, aisle: event.target.value }))} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Tingkat
              <input type="number" min="1" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Kapasitas Unit
              <input type="number" min="1" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} />
            </label>
            <label className="block text-sm font-bold text-slate-700 md:col-span-2">
              Deskripsi
              <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </label>
            <fieldset className="md:col-span-2 xl:col-span-4">
              <legend className="text-sm font-bold text-slate-700">Kategori yang Diizinkan</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => {
                  const selected = form.category_ids.includes(category.id);
                  return (
                    <button key={category.id} type="button" onClick={() => setForm((current) => ({ ...current, category_ids: selected ? current.category_ids.filter((id) => id !== category.id) : [...current.category_ids, category.id] }))} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${selected ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex gap-3 md:col-span-2 xl:col-span-4">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">{submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Rak'}</button>
              {editingId ? <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50">Batal</button> : null}
            </div>
          </form>
        </section>
      ) : null}

      {locations.length === 0 ? (
        <EmptyState title="Belum ada rak" description="Tambahkan rak agar stok dapat ditempatkan secara spesifik di dalam gudang." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {locations.map((location) => {
            const quantity = Number(location.total_quantity ?? 0);
            const capacity = Number(location.capacity ?? 0);
            const utilization = capacity > 0 ? Math.min(100, Math.round((quantity / capacity) * 100)) : 0;
            return (
              <article key={location.id} className="surface-card rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-sky-50 px-3 py-2 font-mono text-lg font-black text-sky-700">{location.code}</span>
                    <div>
                      <h3 className="font-black text-slate-900">{location.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{location.warehouse?.name ?? `Gudang #${location.warehouse_id}`}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${location.status === 'active' ? 'bg-emerald-50 text-emerald-700' : location.status === 'maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{formatStatusLabel(location.status)}</span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zona</p><p className="mt-1 font-black text-slate-800">{location.zone || '-'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tingkat</p><p className="mt-1 font-black text-slate-800">{location.level || '-'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SKU</p><p className="mt-1 font-black text-slate-800">{location.sku_count ?? 0}</p></div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500">Kapasitas terpakai</span><span className="font-black text-slate-800">{quantity.toLocaleString('id-ID')} / {capacity ? capacity.toLocaleString('id-ID') : '-'}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${utilization >= 90 ? 'bg-rose-500' : utilization >= 70 ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${utilization}%` }} /></div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {location.categories?.map((category) => <span key={category.id} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{category.name}</span>)}
                </div>

                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => editLocation(location)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Pencil size={14} /> Edit</button>
                  <button type="button" onClick={() => setDeletingLocation(location)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Hapus</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={Boolean(deletingLocation)} title="Hapus rak ini?" description={`Rak ${deletingLocation?.code ?? ''} hanya dapat dihapus jika belum memiliki stok atau histori mutasi.`} confirmLabel="Ya, Hapus Rak" loading={deleting} onCancel={() => setDeletingLocation(null)} onConfirm={() => void deleteLocation()} />
    </div>
  );
}
