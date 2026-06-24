'use client';

import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProductImage } from '@/components/ui/ProductImage';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { Boxes, MapPin, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type StockDetailResponse = {
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
    min_stock_level: number;
    image_url?: string;
  };
  stocks: Array<{
    id: number;
    quantity: number;
    reserved_quantity: number;
    warehouse?: { id: number; name: string; location?: string | null };
    warehouseLocation?: { id: number; code: string; name: string } | null;
  }>;
};

export function ProductStockDetailPage({ productId }: { productId: string }) {
  const [data, setData] = useState<StockDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get<ApiEnvelope<StockDetailResponse>>(`/products/${productId}/stocks`);
        setData(response.data.data);
      } catch (err: unknown) {
        setError(extractApiErrorMessage(err, 'Gagal memuat detail stok produk.'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [productId]);

  if (loading) {
    return <LoadingState title="Memuat detail stok produk" description="Mengambil distribusi stok per gudang dan lokasi." />;
  }

  if (error) {
    return <ErrorState title="Detail stok gagal dimuat" description={error} />;
  }

  if (!data) {
    return <EmptyState title="Detail stok tidak ditemukan" description="Produk ini belum memiliki data stok detail." />;
  }

  const activeWarehouses = new Set(data.stocks.map((item) => item.warehouse?.id).filter(Boolean)).size;
  const activeLocations = data.stocks.filter((item) => item.quantity > 0).length;
  const totalStock = data.product.stock;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory Detail"
        title={data.product.name}
        description={`SKU ${data.product.sku}. Halaman ini menampilkan distribusi stok detail produk di seluruh gudang dan lokasi.`}
        action={
          <Link href={`/dashboard/products/${data.product.id}/stock-card`} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800">
            Lihat Stock Card
          </Link>
        }
      />

      <section className="surface-card flex flex-col gap-5 rounded-[28px] p-5 sm:flex-row sm:items-center">
        <ProductImage src={data.product.image_url} alt={data.product.name} className="h-36 w-full rounded-2xl border border-slate-200 sm:w-36 sm:shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Referensi Produk</p>
          <h2 className="mt-2 text-xl font-black text-slate-900">{data.product.name}</h2>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Total Stok" value={totalStock} icon={Boxes} />
        <MetricCard label="Gudang Aktif" value={activeWarehouses} icon={Warehouse} tone="sky" description="Jumlah gudang yang menyimpan produk ini." />
        <MetricCard label="Lokasi Aktif" value={activeLocations} icon={MapPin} tone="emerald" description="Jumlah baris lokasi dengan quantity aktif." />
      </div>

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Distribusi Stok</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Batas minimum stok: {data.product.min_stock_level}</span>
            {totalStock <= data.product.min_stock_level ? <StatusBadge label="low stock" tone="warning" /> : <StatusBadge label="safe stock" tone="safe" />}
          </div>
        </div>

        {data.stocks.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada stok detail" description="Belum ada gudang atau lokasi yang menyimpan produk ini." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Gudang</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Dipesan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{stock.warehouse?.name ?? '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{stock.warehouse?.location ?? 'Area belum diisi'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {stock.warehouseLocation ? (
                        <div>
                          <p className="font-semibold text-slate-800">{stock.warehouseLocation.code}</p>
                          <p className="mt-1 text-xs text-slate-500">{stock.warehouseLocation.name}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">Tanpa lokasi detail</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">{stock.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{stock.reserved_quantity}</td>
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
