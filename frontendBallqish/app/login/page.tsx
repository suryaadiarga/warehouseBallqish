'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { extractApiErrorMessage } from '@/lib/api';
import { ArrowRight, Lock, Mail, ShieldCheck, Warehouse } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const notice = useMemo(() => {
    const reason = searchParams.get('reason');

    if (reason === 'password-updated') {
      return 'Kata sandi berhasil diubah. Silakan masuk kembali dengan kata sandi baru Anda.';
    }

    return '';
  }, [searchParams]);

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isBootstrapping, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      showToast({
        type: 'success',
        title: 'Login berhasil',
        description: 'Sesi Anda telah terhubung ke backend WMS Ballqish.',
      });
      router.push(searchParams.get('redirect') || '/dashboard');
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Gagal terhubung ke server.'));
    } finally {
      setLoading(false);
    }
  };

  if (isBootstrapping || isAuthenticated) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-800">
      <div className="flex min-h-screen w-full">
        <div className="relative hidden w-[54%] flex-col justify-between overflow-hidden bg-slate-950 p-12 xl:flex xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_22%)]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-400 ring-1 ring-sky-400/20">
              <Warehouse size={30} />
            </div>
            <span className="text-2xl font-black uppercase tracking-tight text-white">
              Ballqish <br />
              <span className="text-sky-400">Gudang</span>
            </span>
          </div>

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              <ShieldCheck size={14} />
              Ruang Kerja Gudang Terintegrasi
            </div>
            <h1 className="mb-4 text-5xl font-black leading-tight text-white xl:text-6xl">
              Operasional gudang yang rapi, cerdas, dan siap demo.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-400">
              Aplikasi ini disiapkan untuk mengelola produk, mutasi stok, analitik, dan wawasan gudang Ballqish dengan pengalaman yang lebih profesional.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Modul</p>
              <p className="mt-3 text-3xl font-black text-white">32</p>
              <p className="mt-1 text-sm text-slate-400">API routes terintegrasi</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Visibilitas</p>
              <p className="mt-3 text-3xl font-black text-white">Langsung</p>
              <p className="mt-1 text-sm text-slate-400">Wawasan stok & mutasi</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Peta Siap</p>
              <p className="mt-3 text-3xl font-black text-white">Leaflet</p>
              <p className="mt-1 text-sm text-slate-400">Siap integrasi lokasi</p>
            </div>
          </div>

          <div className="relative z-10 text-sm text-slate-500">&copy; 2026 Ballqish Enterprise.</div>
        </div>

        <div className="flex w-full items-center justify-center p-6 sm:p-10 xl:w-[46%] xl:p-16">
          <div className="surface-card w-full max-w-xl rounded-[32px] p-8 sm:p-10">
            <div className="text-center xl:text-left">
              <div className="mb-6 flex items-center justify-center gap-2 xl:hidden">
                <Warehouse className="text-sky-600" size={28} />
                <span className="text-xl font-black uppercase tracking-tight">Gudang Ballqish</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Akses Aman</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Masuk ke ruang kerja gudang</h2>
              <p className="mt-2 leading-7 text-slate-500">
                Gunakan akun backend yang sudah terdaftar untuk mengakses dashboard operasional WMS Ballqish.
              </p>
            </div>

            {error ? (
              <div className="mt-8 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="mt-8 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-bold text-sky-700">
                {notice}
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Alamat Email</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-sky-500"
                      placeholder="Masukkan email Anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Kata Sandi</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-sky-500"
                      placeholder="Masukkan kata sandi Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 p-4 font-bold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{loading ? 'Memverifikasi...' : 'Masuk'}</span>
                {!loading ? <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /> : null}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginContent />
    </Suspense>
  );
}
