'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
};

export function CategoryManagement() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<ApiEnvelope<Category[]>>('/categories');
      setCategories(response.data.data);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal memuat kategori.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const submitCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post<ApiEnvelope<null>>('/categories', { name });
      showToast({
        type: 'success',
        title: 'Kategori ditambahkan',
        description: response.data.message,
      });
      setName('');
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Kategori gagal ditambahkan',
        description: extractApiErrorMessage(err, 'Periksa nama kategori Anda.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    setDeleteLoading(true);
    try {
      const response = await api.delete<ApiEnvelope<null>>(`/categories/${category.id}`);
      showToast({
        type: 'success',
        title: 'Kategori dihapus',
        description: response.data.message,
      });
      setDeletingCategory(null);
      await loadData();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Kategori gagal dihapus',
        description: extractApiErrorMessage(err, 'Kategori masih dipakai oleh produk aktif.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingState title="Memuat kategori" description="Mengambil kategori dari backend WMS." />;
  }

  if (error) {
    return <ErrorState title="Kategori gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Master"
        title="Kategori"
        description="Kelola klasifikasi produk agar inventaris lebih mudah dicari dan dianalisis."
        action={
          <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700">
            <Plus size={18} />
            <span>{showForm ? 'Tutup Form' : 'Tambah Kategori'}</span>
          </button>
        }
      />

      {showForm ? (
        <section className="surface-card rounded-[28px] p-6">
          <form onSubmit={submitCategory} className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-bold text-slate-700">Nama Kategori</label>
              <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:ring-2 focus:ring-emerald-500" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Daftar Kategori</h3>
          <p className="mt-1 text-sm text-slate-500">Semua kategori diambil langsung dari endpoint master data kategori backend.</p>
        </div>

        {categories.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada kategori" description="Tambahkan kategori pertama untuk mengelompokkan produk gudang." />
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article key={category.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 w-fit">
                      <FolderTree size={18} />
                    </div>
                    <h4 className="mt-4 text-lg font-black text-slate-900">{category.name}</h4>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Category ID #{category.id}</p>
                  </div>
                  <button type="button" onClick={() => setDeletingCategory(category)} className="rounded-xl bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title="Hapus kategori ini?"
        description={`Kategori "${deletingCategory?.name ?? ''}" akan dihapus dari master data. Backend akan menolak jika kategori masih dipakai produk.`}
        confirmLabel="Ya, Hapus Kategori"
        tone="danger"
        loading={deleteLoading}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) {
            void deleteCategory(deletingCategory);
          }
        }}
      />
    </div>
  );
}
