'use client';
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