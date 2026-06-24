'use client';

import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { FolderTree, Trash2 } from 'lucide-react';
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
    return <LoadingState title="Memuat kategori" description="Mohon tunggu sebentar." />;
  }

  if (error) {
    return <ErrorState title="Kategori gagal dimuat" description={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori"
      />

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Daftar Kategori</h3>
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
