'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { extractApiErrorMessage } from '@/lib/api';
import { formatRoleLabel } from '@/lib/auth';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [pageError, setPageError] = useState('');
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  useEffect(() => {
    refreshUser()
      .catch((error: unknown) => {
        setPageError(extractApiErrorMessage(error, 'Gagal memuat profil pengguna.'));
      })
      .finally(() => {
        setPageReady(true);
      });
  }, [refreshUser]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.new_password !== formData.new_password_confirmation) {
      showToast({
        type: 'error',
        title: 'Validasi gagal',
        description: 'Password baru dan konfirmasi password harus sama.',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/update-password', formData);
      setFormData({ current_password: '', new_password: '', new_password_confirmation: '' });
      await logout();
      showToast({
        type: 'success',
        title: 'Password diperbarui',
        description: res.data.message || 'Password berhasil diubah.',
      });
      router.replace('/login?reason=password-updated');
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Gagal memperbarui password',
        description: extractApiErrorMessage(err, 'Pastikan password lama benar.'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) {
    return <LoadingState title="Memuat profil akun" description="Frontend sedang mengambil data user dari backend." />;
  }

  if (pageError) {
    return <ErrorState title="Profil gagal dimuat" description={pageError} />;
  }

  if (!user) {
    return <ErrorState title="Profil tidak tersedia" description="Data user aktif belum ditemukan pada sesi saat ini." />;
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Account Center"
        title="Profil & Keamanan"
        description="Kelola identitas pengguna aktif dan lakukan pembaruan password dengan aman."
      />

      <div className="surface-card flex items-center space-x-6 rounded-[28px] p-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-4xl font-black text-blue-600 shadow-lg">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">{user.name}</h2>
          <p className="mb-2 font-medium text-slate-500">{user.email}</p>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-700">
            {formatRoleLabel(user.role)}
          </span>
        </div>
      </div>

      <div className="surface-card overflow-hidden rounded-[28px]">
        <div className="flex items-center space-x-3 border-b border-slate-100 bg-slate-50 p-6">
          <ShieldCheck className="text-emerald-500" size={24} />
          <div>
            <h3 className="text-lg font-black text-slate-800">Keamanan Akun</h3>
            <p className="text-xs text-slate-500">Ubah password secara berkala untuk menjaga keamanan data gudang.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password Saat Ini</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500 md:w-1/2"
              value={formData.current_password}
              onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password Baru (Min. 8 Karakter)</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500 md:w-1/2"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500 md:w-1/2"
              value={formData.new_password_confirmation}
              onChange={(e) => setFormData({ ...formData, new_password_confirmation: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              <KeyRound size={18} />
              <span>{loading ? 'Memproses...' : 'Perbarui Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
