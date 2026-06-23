'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  category_id: number;
  sku: string;
  name: string;
  stock: number;
  min_stock_level: number;
  lead_time_days: number;
  safety_stock: number;
  price?: number;
  category?: Category;
};

type ProductPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function ProductManagement() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<ProductPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '',
    min_stock_level: '10',
    lead_time_days: '7',
    safety_stock: '10',
    price: '',
  });

  const loadData = async (page = 1, nextSearch = query) => {
    setLoading(true);
    setError('');

    try {
      const [productRes, categoryRes] = await Promise.all([
        api.get<ApiEnvelope<Product[]>>('/products', {
          params: {
            page,
            search: nextSearch || undefined,
          },
        }),
        api.get<ApiEnvelope<Category[]>>('/categories'),
      ]);
      setProducts(productRes.data.data);
      setPagination((productRes.data.meta?.pagination as ProductPagination | undefined) ?? null);
      setCategories(categoryRes.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat data produk.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        min_stock_level: Number(form.min_stock_level),
        lead_time_days: Number(form.lead_time_days),
        safety_stock: Number(form.safety_stock),
        price: Number(form.price),
      };

      const response = await api.post<ApiEnvelope<Product>>('/products', payload);
      showToast({
        type: 'success',
        title: 'Produk ditambahkan',
        description: response.data.message,
      });
      setForm({ name: '', sku: '', category_id: '', min_stock_level: '10', lead_time_days: '7', safety_stock: '10', price: '' });
      setShowForm(false);
      await loadData(1, '');
      setSearch('');
      setQuery('');
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Produk gagal ditambahkan',
        description: extractApiErrorMessage(err, 'Periksa kembali input produk Anda.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    setDeleteLoading(true);
    try {
      const response = await api.delete<ApiEnvelope<null>>(`/products/${product.id}`);
      showToast({
        type: 'success',
        title: 'Produk dihapus',
        description: response.data.message,
      });
      setDeletingProduct(null);
      await loadData(pagination?.current_page ?? 1);
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Gagal menghapus produk',
        description: extractApiErrorMessage(err, 'Pastikan tidak ada histori yang masih terkait.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat master produk" description="Mengambil daftar produk dan kategori dari backend." />;
  }

  if (error) {
    return <ErrorState title="Produk gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Master"
        title="Produk"
        description="Kelola data master produk, ringkasan stok, kategori, dan parameter stok minimum yang dipakai backend WMS."
        action={
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
          >
            <Plus size={18} />
            <span>{showForm ? 'Tutup Form' : 'Tambah Produk'}</span>
          </button>
        }
      />

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          <form onSubmit={submitProduct} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Nama Produk</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">SKU</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.sku} onChange={(e) => setForm((current) => ({ ...current, sku: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Kategori</label>
              <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.category_id} onChange={(e) => setForm((current) => ({ ...current, category_id: e.target.value }))} required>
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Batas Minimum Stok</label>
              <input type="number" min={0} step={1} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.min_stock_level} onFocus={(event) => event.currentTarget.select()} onChange={(e) => setForm((current) => ({ ...current, min_stock_level: e.target.value.replace(/^0+(?=\d)/, '') }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Harga</label>
              <input type="number" min={0} step={1} inputMode="numeric" placeholder="Masukkan harga" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.price} onFocus={(event) => event.currentTarget.select()} onChange={(e) => setForm((current) => ({ ...current, price: e.target.value.replace(/^0+(?=\d)/, '') }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Lead Time Supplier (hari)</label>
              <input type="number" min={1} max={365} step={1} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.lead_time_days} onFocus={(event) => event.currentTarget.select()} onChange={(e) => setForm((current) => ({ ...current, lead_time_days: e.target.value.replace(/^0+(?=\d)/, '') }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Stok Pengaman</label>
              <input type="number" min={0} step={1} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-sky-500" value={form.safety_stock} onFocus={(event) => event.currentTarget.select()} onChange={(e) => setForm((current) => ({ ...current, safety_stock: e.target.value.replace(/^0+(?=\d)/, '') }))} required />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Daftar Produk</h3>
            <p className="mt-1 text-sm text-slate-500">Sinkron langsung dengan endpoint `/api/products`.</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search);
              void loadData(1, search);
            }}
            className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <Search size={18} className="text-slate-400" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Cari nama atau SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        {products.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada produk" description="Tambahkan produk baru atau ubah kata kunci pencarian Anda." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Stok</th>
                    <th className="px-6 py-4">Stok Minimum</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{product.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{product.category?.name ?? '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{product.stock}</td>
                      <td className="px-6 py-4 text-slate-600">{product.min_stock_level}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/dashboard/products/${product.id}/stocks`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">
                            Detail Stok
                          </Link>
                          <Link href={`/dashboard/products/${product.id}/stock-card`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50">
                            Stock Card
                          </Link>
                          <button type="button" onClick={() => setDeletingProduct(product)} className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 font-semibold text-rose-700 transition hover:bg-rose-100">
                            <Trash2 size={16} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination ? (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Menampilkan halaman <span className="font-bold text-slate-800">{pagination.current_page}</span> dari{' '}
                  <span className="font-bold text-slate-800">{pagination.last_page}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadData(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void loadData(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        title="Hapus produk ini?"
        description={`Produk "${deletingProduct?.name ?? ''}" akan dihapus dari master data. Backend akan menolak jika histori masih terkait.`}
        confirmLabel="Ya, Hapus Produk"
        tone="danger"
        loading={deleteLoading}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            void deleteProduct(deletingProduct);
          }
        }}
      />
    </div>
  );
}
