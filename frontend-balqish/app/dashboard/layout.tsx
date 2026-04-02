'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  LayoutDashboard, 
  Box, 
  ArrowLeftRight, 
  LogOut, 
  User, 
  Warehouse,
  FileText,
  Settings,
  Tags
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname(); // Untuk mendeteksi halaman aktif
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [dateStr, setDateStr] = useState('');

    useEffect(() => {
        setDateStr(new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!token || !userStr) {
            router.push('/login');
        } else {
            const user = JSON.parse(userStr);
            setUserName(user.name);
            setUserRole(user.role);
        }
    }, [router]);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Gagal logout");
        } finally {
            localStorage.clear();
            router.push('/login');
        }
    };

    // Fungsi kecil untuk mengecek menu aktif
    const isActive = (path: string) => pathname === path;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full shadow-2xl z-20">
                <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950/50">
                    <Warehouse className="text-blue-500" size={28} />
                    <span className="text-lg font-black tracking-tight uppercase text-white">Balqish <br/><span className="text-blue-500">Warehouse</span></span>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                    
                    {/* Core System */}
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-3">Core System</div>
                        <div className="space-y-1">
                            <Link href="/dashboard" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold' : 'hover:bg-slate-800 hover:text-white font-medium'}`}>
                                <LayoutDashboard size={20} />
                                <span>Dashboard</span>
                            </Link>
                            <Link href="/dashboard/products" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive('/dashboard/products') ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold' : 'hover:bg-slate-800 hover:text-white font-medium'}`}>
                                <Box size={20} />
                                <span>Data Produk</span>
                            </Link>
                            <Link href="/dashboard/mutations" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive('/dashboard/mutations') ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold' : 'hover:bg-slate-800 hover:text-white font-medium'}`}>
                                <ArrowLeftRight size={20} />
                                <span>Mutasi Stok</span>
                            </Link>
                        </div>
                    </div>

                    {/* Laporan & Pengaturan */}
                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-3">Laporan & Audit</div>
                        <div className="space-y-1">
                            {/* TOMBOL BARU UNTUK EXPORT */}
                            <Link href="/dashboard/reports" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive('/dashboard/reports') ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold' : 'hover:bg-slate-800 hover:text-white font-medium'}`}>
                                <FileText size={20} />
                                <span>Export Dokumen</span>
                            </Link>
                            
                            <Link href="/dashboard/settings" className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${isActive('/dashboard/settings') ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold' : 'hover:bg-slate-800 hover:text-white font-medium'}`}>
                                <Settings size={20} />
                                <span>Pengaturan Akun</span>
                            </Link>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                    <div className="flex items-center space-x-3 p-2 mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-slate-700">
                            {userName.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{userName}</p>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{userRole.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center justify-center space-x-2 w-full p-2.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 font-bold transition-all"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="font-bold text-slate-500 text-xs uppercase tracking-widest">
                        {dateStr || 'Memuat tanggal...'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                            <User size={18} />
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}