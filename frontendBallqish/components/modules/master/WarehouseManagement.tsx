'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { MapPinned, Plus, Warehouse } from 'lucide-react';
import { useEffect, useState } from 'react';

type WarehouseItem = {
  id: number;
  name: string;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
};

export function WarehouseManagement() {
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    latitude: '',
    longitude: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<ApiEnvelope<WarehouseItem[]>>('/warehouses');
      setWarehouses(response.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data gudang.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const submitWarehouse = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<WarehouseItem>>('/warehouses', {
        name: form.name,
        location: form.location || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });

      showToast({
        type: 'success',
        title: 'Gudang ditambahkan',
        description: response.data.message,
      });
      setForm({ name: '', location: '', latitude: '', longitude: '' });
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Gudang gagal ditambahkan',
        description: extractApiErrorMessage(err, 'Periksa kembali data gudang.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat gudang" description="Mengambil daftar warehouse aktif dari backend." />;
  }

  if (error) {
    return <ErrorState title="Gudang gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Warehouse Master"
        title="Warehouses"
        description="Kelola gudang aktif beserta informasi lokasi dan koordinat yang nanti bisa dipakai pada halaman peta."
        action={
          <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700">
            <Plus size={18} />
            <span>{showForm ? 'Tutup Form' : 'Tambah Gudang'}</span>
          </button>
        }
      />

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          <form onSubmit={submitWarehouse} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Nama Gudang</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Lokasi</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Latitude</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.latitude} onChange={(e) => setForm((current) => ({ ...current, latitude: e.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Longitude</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.longitude} onChange={(e) => setForm((current) => ({ ...current, longitude: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Gudang'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Daftar Gudang</h3>
          <p className="mt-1 text-sm text-slate-500">Sumber data dari endpoint `/api/warehouses` tanpa data mock.</p>
        </div>

        {warehouses.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada gudang" description="Tambahkan gudang untuk mulai mengelola stok per lokasi operasional." />
          </div>
        ) : (
          <div className="grid gap-5 p-6 lg:grid-cols-2">
            {warehouses.map((warehouse) => (
              <article key={warehouse.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                    <Warehouse size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-900">{warehouse.name}</h4>
                    <p className="mt-1 text-sm text-slate-500">{warehouse.location || 'Lokasi belum diisi'}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latitude</p>
                        <p className="mt-2 font-semibold text-slate-800">{warehouse.latitude || '-'}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Longitude</p>
                        <p className="mt-2 font-semibold text-slate-800">{warehouse.longitude || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white">
                      <MapPinned size={14} />
                      Warehouse ID #{warehouse.id}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
