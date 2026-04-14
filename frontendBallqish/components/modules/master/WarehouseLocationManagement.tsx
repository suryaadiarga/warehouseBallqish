'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { Grid3X3, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

type Warehouse = {
  id: number;
  name: string;
};

type WarehouseLocation = {
  id: number;
  warehouse_id: number;
  code: string;
  name: string;
  description?: string | null;
  warehouse?: Warehouse;
};

export function WarehouseLocationManagement() {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: '',
    code: '',
    name: '',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [locationRes, warehouseRes] = await Promise.all([
        api.get<ApiEnvelope<WarehouseLocation[]>>('/warehouse-locations'),
        api.get<ApiEnvelope<Warehouse[]>>('/warehouses'),
      ]);

      setLocations(locationRes.data.data);
      setWarehouses(warehouseRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat lokasi gudang.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const submitLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<WarehouseLocation>>('/warehouse-locations', {
        warehouse_id: Number(form.warehouse_id),
        code: form.code,
        name: form.name,
        description: form.description || null,
      });

      showToast({
        type: 'success',
        title: 'Lokasi gudang ditambahkan',
        description: response.data.message,
      });
      setForm({ warehouse_id: '', code: '', name: '', description: '' });
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Lokasi gagal ditambahkan',
        description: extractApiErrorMessage(err, 'Periksa warehouse dan kode lokasi yang dipilih.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat warehouse locations" description="Mengambil lokasi detail dalam gudang dari backend." />;
  }

  if (error) {
    return <ErrorState title="Warehouse locations gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Warehouse Layout"
        title="Warehouse Locations"
        description="Kelola kode lokasi seperti zone, rack, dan bin untuk mendukung penyimpanan yang lebih detail."
        action={
          <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700">
            <Plus size={18} />
            <span>{showForm ? 'Tutup Form' : 'Tambah Lokasi'}</span>
          </button>
        }
      />

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          <form onSubmit={submitLocation} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Warehouse</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.warehouse_id} onChange={(e) => setForm((current) => ({ ...current, warehouse_id: e.target.value }))} required>
                <option value="">Pilih warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Code</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" placeholder="A1-R2-B3" value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Name</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Description</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Lokasi'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Daftar Lokasi Gudang</h3>
          <p className="mt-1 text-sm text-slate-500">Data lokasi membantu pemetaan bin dan rack di dalam gudang.</p>
        </div>

        {locations.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada lokasi gudang" description="Tambahkan lokasi agar penyimpanan lebih detail dan siap dipakai inventory multi-location." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Nama Lokasi</th>
                  <th className="px-6 py-4">Warehouse</th>
                  <th className="px-6 py-4">Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                        <Grid3X3 size={14} />
                        {location.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{location.name}</td>
                    <td className="px-6 py-4 text-slate-600">{location.warehouse?.name ?? `Warehouse #${location.warehouse_id}`}</td>
                    <td className="px-6 py-4 text-slate-500">{location.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
