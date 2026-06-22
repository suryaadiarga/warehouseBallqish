'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { hasInventoryAdminAccess } from '@/lib/auth';
import { CheckCircle2, ClipboardCheck, EyeOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Warehouse = { id: number; name: string };
type Location = { id: number; warehouse_id: number; code: string; name: string };
type AuditItem = { id: number; system_qty: number; physical_qty: number | null; difference: number | null; product: { id: number; sku: string; name: string } };
type Audit = { id: number; audit_number: string; status: 'counting' | 'review' | 'completed' | 'cancelled'; warehouse: Warehouse; warehouse_location: Location; items: AuditItem[]; snapshot_at: string; completed_at?: string | null };

export function StockAuditsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [form, setForm] = useState({ warehouse_id: '', warehouse_location_id: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [w, l, a] = await Promise.all([
        api.get<ApiEnvelope<Warehouse[]>>('/warehouses'),
        api.get<ApiEnvelope<Location[]>>('/warehouse-locations'),
        api.get<ApiEnvelope<Audit[]>>('/stock-audits'),
      ]);
      setWarehouses(w.data.data); setLocations(l.data.data); setAudits(a.data.data);
      setActiveId((current) => current ?? a.data.data.find((item) => item.status !== 'completed')?.id ?? a.data.data[0]?.id ?? null);
    } catch (err) { setError(extractApiErrorMessage(err, 'Audit Stok gagal dimuat.')); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const availableLocations = useMemo(() => locations.filter((location) => String(location.warehouse_id) === form.warehouse_id), [locations, form.warehouse_id]);
  const active = audits.find((audit) => audit.id === activeId) ?? null;
  const canComplete = hasInventoryAdminAccess(user?.role);

  const createAudit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const response = await api.post<ApiEnvelope<Audit>>('/stock-audits', { warehouse_id: Number(form.warehouse_id), warehouse_location_id: Number(form.warehouse_location_id), note: form.note || undefined });
      setAudits((current) => [response.data.data, ...current]); setActiveId(response.data.data.id); setCounts({});
      showToast({ type: 'success', title: 'Audit Stok dimulai', description: 'Snapshot rak dibuat. Quantity sistem disembunyikan selama blind count.' });
    } catch (err) { showToast({ type: 'error', title: 'Audit gagal dibuat', description: extractApiErrorMessage(err) }); }
    finally { setBusy(false); }
  };

  const saveCounts = async () => {
    if (!active) return;
    const items = active.items.filter((item) => counts[item.product.id] !== undefined && counts[item.product.id] !== '').map((item) => ({ product_id: item.product.id, physical_qty: Number(counts[item.product.id]) }));
    if (items.length === 0) { showToast({ type: 'error', title: 'Belum ada hitungan', description: 'Masukkan stok fisik minimal satu produk.' }); return; }
    setBusy(true);
    try {
      const response = await api.put<ApiEnvelope<Audit>>(`/stock-audits/${active.id}/counts`, { items });
      setAudits((current) => current.map((item) => item.id === active.id ? response.data.data : item)); setCounts({});
      showToast({ type: 'success', title: 'Hitungan tersimpan', description: response.data.data.status === 'review' ? 'Semua item terhitung dan siap direview.' : 'Audit masih dapat dilanjutkan.' });
    } catch (err) { showToast({ type: 'error', title: 'Hitungan gagal disimpan', description: extractApiErrorMessage(err) }); }
    finally { setBusy(false); }
  };

  const complete = async () => {
    if (!active) return; setBusy(true);
    try {
      const response = await api.put<ApiEnvelope<Audit>>(`/stock-audits/${active.id}/complete`);
      setAudits((current) => current.map((item) => item.id === active.id ? response.data.data : item));
      showToast({ type: 'success', title: 'Rekonsiliasi selesai', description: 'Selisih sudah menjadi mutasi otomatis pada rak yang benar.' });
    } catch (err) { showToast({ type: 'error', title: 'Audit gagal diselesaikan', description: extractApiErrorMessage(err) }); }
    finally { setBusy(false); }
  };

  if (loading) return <LoadingState title="Memuat Audit Stok" description="Menyiapkan snapshot rak dan riwayat penghitungan." />;
  if (error) return <ErrorState title="Audit Stok gagal dimuat" description={error} />;

  return <div className="space-y-6">
    <PageHeader eyebrow="Cycle Counting" title="Audit Stok per Rak" description="Penghitungan fisik menggunakan blind count. Selisih yang disetujui otomatis menjadi mutasi rekonsiliasi pada rak terkait." />
    <section className="surface-card rounded-[28px] p-6">
      <form onSubmit={createAudit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label><span className="mb-2 block text-sm font-bold">Gudang</span><select required className="input" value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value, warehouse_location_id: '' })}><option value="">Pilih gudang</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-bold">Rak</span><select required className="input" value={form.warehouse_location_id} onChange={(e) => setForm({ ...form, warehouse_location_id: e.target.value })}><option value="">Pilih rak</option>{availableLocations.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-bold">Catatan</span><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Opsional" /></label>
        <button disabled={busy} className="self-end rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Mulai Audit Rak</button>
      </form>
    </section>

    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <aside className="space-y-2">{audits.length === 0 ? <EmptyState title="Belum ada audit" description="Pilih gudang dan rak untuk membuat snapshot pertama." /> : audits.map((audit) => <button key={audit.id} onClick={() => { setActiveId(audit.id); setCounts({}); }} className={`w-full rounded-2xl border p-4 text-left ${activeId === audit.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'}`}><div className="flex items-center justify-between"><strong className="text-sm">{audit.audit_number}</strong><span className="text-xs font-bold text-sky-700">{audit.status}</span></div><p className="mt-2 text-xs text-slate-500">{audit.warehouse.name} / {audit.warehouse_location.code}</p><p className="mt-1 text-xs text-slate-400">{audit.items.length} SKU</p></button>)}</aside>
      {active ? <section className="surface-card rounded-[28px] p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-black">{active.audit_number}</h2><p className="mt-1 text-sm text-slate-500">{active.warehouse.name} · Rak {active.warehouse_location.code}</p></div><div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{active.status === 'counting' ? <EyeOff size={15} /> : <ClipboardCheck size={15} />} {active.status === 'counting' ? 'Blind count aktif' : 'System qty ditampilkan'}</div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr><th className="p-3">Produk</th><th>Stok Fisik</th>{active.status !== 'counting' ? <><th>Stok Sistem</th><th>Selisih</th></> : null}</tr></thead><tbody>{active.items.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3 font-bold">{item.product.name}<span className="block text-xs font-normal text-slate-400">{item.product.sku}</span></td><td>{active.status === 'counting' ? <input min={0} type="number" className="w-28 rounded-xl border border-slate-200 p-2" value={counts[item.product.id] ?? item.physical_qty ?? ''} onChange={(e) => setCounts({ ...counts, [item.product.id]: e.target.value })} /> : item.physical_qty}</td>{active.status !== 'counting' ? <><td>{item.system_qty}</td><td className={`font-black ${(item.difference ?? 0) < 0 ? 'text-rose-600' : (item.difference ?? 0) > 0 ? 'text-emerald-600' : ''}`}>{(item.difference ?? 0) > 0 ? '+' : ''}{item.difference}</td></> : null}</tr>)}</tbody></table></div>
        <div className="mt-5 flex justify-end gap-3">{active.status === 'counting' ? <button disabled={busy} onClick={() => void saveCounts()} className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white">Simpan Hitungan</button> : null}{active.status === 'review' && canComplete ? <button disabled={busy} onClick={() => void complete()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"><CheckCircle2 size={16} /> Setujui Rekonsiliasi</button> : null}</div>
      </section> : <EmptyState title="Pilih audit" description="Detail blind count akan tampil di sini." />}
    </div>
  </div>;
}
