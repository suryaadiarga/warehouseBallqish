'use client';

import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { MapPinned, Navigation, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type WarehouseMarker = {
  id: number;
  name: string;
  latitude: string | number;
  longitude: string | number;
};

type ProjectedWarehouse = WarehouseMarker & {
  lat: number;
  lng: number;
  x: number;
  y: number;
};

function projectWarehouses(items: WarehouseMarker[]): ProjectedWarehouse[] {
  const parsed = items
    .map((item) => ({
      ...item,
      lat: Number(item.latitude),
      lng: Number(item.longitude),
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

  if (parsed.length === 0) {
    return [];
  }

  const minLat = Math.min(...parsed.map((item) => item.lat));
  const maxLat = Math.max(...parsed.map((item) => item.lat));
  const minLng = Math.min(...parsed.map((item) => item.lng));
  const maxLng = Math.max(...parsed.map((item) => item.lng));

  const width = 1000;
  const height = 560;
  const padding = 72;

  return parsed.map((item) => {
    const x =
      minLng === maxLng
        ? width / 2
        : padding + ((item.lng - minLng) / (maxLng - minLng)) * (width - padding * 2);
    const y =
      minLat === maxLat
        ? height / 2
        : height - padding - ((item.lat - minLat) / (maxLat - minLat)) * (height - padding * 2);

    return {
      ...item,
      x,
      y,
    };
  });
}

export function WarehouseMapPage() {
  const [warehouses, setWarehouses] = useState<WarehouseMarker[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<ApiEnvelope<WarehouseMarker[]>>('/warehouses/map');
      setWarehouses(response.data.data);
      setSelectedId(response.data.data[0]?.id ?? null);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data peta gudang.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const projected = useMemo(() => projectWarehouses(warehouses), [warehouses]);
  const selected = projected.find((item) => item.id === selectedId) ?? projected[0] ?? null;

  if (loading) {
    return <LoadingState title="Memuat peta gudang" description="Mengambil koordinat gudang dari backend untuk divisualisasikan." />;
  }

  if (error) {
    return <ErrorState title="Warehouse map gagal dimuat" description={error} />;
  }

  if (projected.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Data Geografis" title="Peta Gudang" description="Tampilan koordinat gudang yang siap dipakai untuk demo integrasi lokasi dan peta." />
        <EmptyState title="Belum ada koordinat gudang" description="Isi lintang dan bujur pada data master gudang agar penanda dapat ditampilkan." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Geografis"
        title="Peta Gudang"
        description="Visualisasi lokasi gudang berdasarkan koordinat backend. Halaman ini memakai data nyata dari `/api/warehouses/map` dan tetap ringan tanpa menambah dependensi peta baru."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Gudang Terpetakan" value={projected.length} icon={Warehouse} description="Jumlah gudang dengan koordinat valid dari backend." />
        <MetricCard label="Penanda Terpilih" value={selected?.name ?? '-'} icon={MapPinned} tone="sky" description="Penanda yang sedang difokuskan pada panel detail." />
        <MetricCard label="Navigasi Tersedia" value="OSM" icon={Navigation} tone="emerald" description="Setiap penanda bisa dibuka langsung ke OpenStreetMap." />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="surface-card rounded-[28px] p-5">
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-900">Peta Koordinat Gudang</h3>
            <p className="mt-1 text-sm text-slate-500">Panel ini memetakan penanda gudang dari koordinat lintang dan bujur yang sudah disiapkan backend.</p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_32%,_#ecfeff_100%)]">
            <svg viewBox="0 0 1000 560" className="h-[560px] w-full">
              <defs>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
                </pattern>
                <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(14,165,233,0.22)" />
                  <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                </radialGradient>
              </defs>

              <rect width="1000" height="560" fill="url(#grid)" />

              {projected.map((warehouse) => {
                const active = warehouse.id === selected?.id;

                return (
                  <g key={warehouse.id} onClick={() => setSelectedId(warehouse.id)} className="cursor-pointer">
                    {active ? <circle cx={warehouse.x} cy={warehouse.y} r="44" fill="url(#pulse)" /> : null}
                    <circle cx={warehouse.x} cy={warehouse.y} r="11" fill={active ? '#0284c7' : '#0f172a'} />
                    <circle cx={warehouse.x} cy={warehouse.y} r="24" fill="transparent" />
                    <text x={warehouse.x + 16} y={warehouse.y - 18} fill={active ? '#0f172a' : '#334155'} fontSize="14" fontWeight="700">
                      {warehouse.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="space-y-5">
          <section className="surface-card rounded-[28px] p-6">
            <h3 className="text-lg font-black text-slate-900">Gudang Terpilih</h3>
            {selected ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Nama</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{selected.name}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Lintang</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.lat}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Bujur</p>
                    <p className="mt-2 font-semibold text-slate-900">{selected.lng}</p>
                  </div>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=14/${selected.lat}/${selected.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 font-bold text-white transition hover:bg-sky-700"
                >
                  <Navigation size={16} />
                  <span>Buka di OpenStreetMap</span>
                </a>
              </div>
            ) : null}
          </section>

          <section className="surface-card rounded-[28px] p-6">
            <h3 className="text-lg font-black text-slate-900">Daftar Penanda</h3>
            <div className="mt-4 space-y-3">
              {projected.map((warehouse) => (
                <button
                  key={warehouse.id}
                  type="button"
                  onClick={() => setSelectedId(warehouse.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    warehouse.id === selected?.id ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{warehouse.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {warehouse.lat}, {warehouse.lng}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
