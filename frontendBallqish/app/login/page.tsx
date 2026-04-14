'use client';
<<<<<<< HEAD
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Warehouse, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/login', { email, password });
            
            // Simpan token dan data user ke localStorage
            localStorage.setItem('token', res.data.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
            
            // Redirect ke dashboard
            router.push('/dashboard');
        } catch (err: any) {
            // Tangkap pesan error validasi dari Laravel
            const errorMsg = err.response?.data?.errors?.email?.[0] 
                || err.response?.data?.message 
                || 'Gagal terhubung ke server.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex text-slate-800 bg-white">
            {/* Left Side - Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/20 mix-blend-multiply rounded-full blur-3xl scale-150 translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex items-center space-x-3">
                    <Warehouse className="text-blue-400" size={32} />
                    <span className="text-2xl font-black tracking-tight text-white uppercase">Balqish <br/><span className="text-blue-400">Warehouse</span></span>
                </div>

                <div className="relative z-10">
                    <h1 className="text-5xl font-black text-white leading-tight mb-4">
                        Sistem Manajemen <br/>Inventaris Modern.
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Pantau mutasi stok, kelola barang, dan amankan aset gudang Anda dalam satu platform cerdas.
                    </p>
                </div>
                
                <div className="relative z-10 text-slate-500 text-sm">
                    &copy; 2026 Balqish Enterprise.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-slate-50">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex items-center justify-center space-x-2 mb-6">
                            <Warehouse className="text-blue-600" size={28} />
                            <span className="text-xl font-black tracking-tight uppercase">Balqish Warehouse</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900">Selamat Datang!</h2>
                        <p className="text-slate-500 mt-2">Silakan login dengan akun yang terdaftar.</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 flex items-center">
                            <div className="w-2 h-2 bg-rose-500 rounded-full mr-2"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="isikan email anda"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="isikan password anda"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <span>{loading ? 'Memverifikasi...' : 'Sign In'}</span>
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                    
                    {/* Bantuan dummy */}
                    <p className="text-center text-sm text-slate-400 font-medium pt-4">
                        Gunakan <code className="text-blue-500">admin@warehouse.com</code> / <code className="text-blue-500">password123</code> untuk demo.
                    </p>
                </div>
            </div>
        </div>
    );
}
=======

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
      return 'Password berhasil diubah. Silakan login kembali dengan password baru Anda.';
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <div className="relative hidden w-[54%] flex-col justify-between overflow-hidden bg-slate-950 p-12 xl:flex xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_22%)]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-400 ring-1 ring-sky-400/20">
              <Warehouse size={30} />
            </div>
            <span className="text-2xl font-black uppercase tracking-tight text-white">
              Balqish <br />
              <span className="text-sky-400">Warehouse</span>
            </span>
          </div>

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              <ShieldCheck size={14} />
              Enterprise Warehouse Workspace
            </div>
            <h1 className="mb-4 text-5xl font-black leading-tight text-white xl:text-6xl">
              Operasional gudang yang rapi, cerdas, dan siap demo.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-400">
              Frontend ini disiapkan untuk mengelola produk, mutasi stok, analytics, dan insight gudang Ballqish dengan pengalaman yang lebih profesional.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Modules</p>
              <p className="mt-3 text-3xl font-black text-white">32</p>
              <p className="mt-1 text-sm text-slate-400">API routes terintegrasi</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Visibility</p>
              <p className="mt-3 text-3xl font-black text-white">Live</p>
              <p className="mt-1 text-sm text-slate-400">Insight stok & mutasi</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Map Ready</p>
              <p className="mt-3 text-3xl font-black text-white">Leaflet</p>
              <p className="mt-1 text-sm text-slate-400">Siap integrasi lokasi</p>
            </div>
          </div>

          <div className="relative z-10 text-sm text-slate-500">&copy; 2026 Balqish Enterprise.</div>
        </div>

        <div className="flex w-full items-center justify-center p-6 sm:p-10 xl:w-[46%] xl:p-16">
          <div className="surface-card w-full max-w-xl rounded-[32px] p-8 sm:p-10">
            <div className="text-center xl:text-left">
              <div className="mb-6 flex items-center justify-center gap-2 xl:hidden">
                <Warehouse className="text-sky-600" size={28} />
                <span className="text-xl font-black uppercase tracking-tight">Balqish Warehouse</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600">Secure Access</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">Masuk ke workspace gudang</h2>
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
                  <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-sky-500"
                      placeholder="isikan email anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-sky-500"
                      placeholder="isikan password anda"
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
                <span>{loading ? 'Memverifikasi...' : 'Sign In'}</span>
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
>>>>>>> 58f3523 (Initial commit: WMS Ballqish fullstack (backend + frontend + features))
