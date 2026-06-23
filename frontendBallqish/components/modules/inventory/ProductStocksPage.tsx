'use client';

import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { Boxes, MapPin, PackageSearch, Search, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ProductOption = { id: number; name: string; sku: string };
type WarehouseOption = { id: number; name: string };

type ProductStockItem = {
  id: number;
  quantity: number;
  reserved_quantity: number;
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
    min_stock_level: number;
  };
  warehouse?: {
    id: number;
    name: string;
    location?: string | null;
  };
  warehouseLocation?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

type ProductStockPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function ProductStocksPage() {
  const [stocks, setStocks] = useState<ProductStockItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    product_id: '',
    warehouse_id: '',
  });
  const [pagination, setPagination] = useState<ProductStockPagination | null>(null);

  const loadData = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const [stocksRes, productsRes, warehousesRes] = await Promise.all([
        api.get<ApiEnvelope<ProductStockItem[]>>('/product-stocks', {
          params: {
            page,
            product_id: currentFilters.product_id || undefined,
            warehouse_id: currentFilters.warehouse_id || undefined,
          },
        }),
        api.get<ApiEnvelope<ProductOption[]>>('/products', {
          params: { per_page: 1000 },
        }),
        api.get<ApiEnvelope<WarehouseOption[]>>('/warehouses'),
      ]);

      setStocks(stocksRes.data.data);
      setPagination((stocksRes.data.meta?.pagination as ProductStockPagination | undefined) ?? null);
      setProducts(productsRes.data.data);
      setWarehouses(warehousesRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data stok detail.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lowStockCount = stocks.filter((item) => item.quantity <= item.product.min_stock_level).length;

  if (loading) {
    return <LoadingState title="Memuat stok produk" description="Mohon tunggu sebentar." />;
  }

  if (error) {
    return <ErrorState title="Stok produk gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Detail Inventaris"
        title="Stok Produk"
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Baris Stok" value={pagination?.total ?? stocks.length} icon={Boxes} description="Jumlah baris stok detail yang sedang dimuat." />
        <MetricCard label="Baris Stok Rendah" value={lowStockCount} icon={PackageSearch} tone="amber" description="Baris stok dengan jumlah di bawah batas minimum produk." />
        <MetricCard label="Gudang" value={new Set(stocks.map((item) => item.warehouse?.id).filter(Boolean)).size} icon={Warehouse} tone="sky" description="Gudang aktif pada hasil filter saat ini." />
      </div>

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900">Filter Stok Detail</h3>
            <p className="mt-1 text-sm text-slate-500">Gunakan filter produk dan gudang untuk memeriksa posisi stok lebih cepat.</p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-2 xl:max-w-2xl">
            <select
              value={filters.product_id}
              onChange={(e) => setFilters((current) => ({ ...current, product_id: e.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Semua produk</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <select
                value={filters.warehouse_id}
                onChange={(e) => setFilters((current) => ({ ...current, warehouse_id: e.target.value }))}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Semua gudang</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void loadData(1, filters)}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 font-bold text-white transition hover:bg-sky-700"
              >
                <Search size={16} />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {stocks.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada stok detail" description="Belum ada kombinasi produk-gudang-lokasi yang tercatat pada hasil filter ini." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">Gudang</th>
                    <th className="px-6 py-4">Lokasi</th>
                    <th className="px-6 py-4">Jumlah</th>
                    <th className="px-6 py-4">Dipesan</th>
                    <th className="px-6 py-4">Stok Minimum</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stocks.map((stock) => {
                    const low = stock.quantity <= stock.product.min_stock_level;

                    return (
                      <tr key={stock.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{stock.product.name}</p>
                          <p className="mt-1 font-mono text-xs text-slate-500">{stock.product.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <p className="font-semibold">{stock.warehouse?.name ?? '-'}</p>
                          <p className="mt-1 text-xs text-slate-500">{stock.warehouse?.location ?? 'Lokasi area belum diisi'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {stock.warehouseLocation ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              <MapPin size={14} />
                              {stock.warehouseLocation.code}
                            </div>
                          ) : (
                            <span className="text-slate-400">Tanpa lokasi detail</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black text-slate-900">{stock.quantity}</span>
                            {low ? <StatusBadge label="low" tone="warning" /> : <StatusBadge label="safe" tone="safe" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{stock.reserved_quantity}</td>
                        <td className="px-6 py-4 text-slate-600">{stock.product.min_stock_level}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/products/${stock.product.id}/stocks`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">
                              Detail Stok
                            </Link>
                            <Link href={`/dashboard/products/${stock.product.id}/stock-card`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">
                              Stock Card
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Halaman <span className="font-bold text-slate-800">{pagination.current_page}</span> dari{' '}
                  <span className="font-bold text-slate-800">{pagination.last_page}</span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void loadData(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-slate-500">Total {pagination.total} baris stok</span>
                  <button
                    type="button"
                    onClick={() => void loadData(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
