'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/login', { email, password });
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            router.push('/dashboard');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Login Gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800 p-10 shadow-xl border border-slate-700">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white">Warehouse System</h2>
                    <p className="mt-2 text-sm text-slate-400">Silakan login untuk mengelola stok</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <input
                            type="email"
                            required
                            className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Email: admin@warehouse.com"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            required
                            className="block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Password: password123"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-600"
                    >
                        {loading ? 'Memproses...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}