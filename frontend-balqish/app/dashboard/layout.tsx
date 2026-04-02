'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Box, 
  ArrowLeftRight, 
  LogOut, 
  User, 
  Warehouse 
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // AUTH GUARD: Jika tidak ada token, tendang balik ke login
        if (!token || !userStr) {
            router.push('/login');
        } else {
            const user = JSON.parse(userStr);
            setUserName(user.name);
            setUserRole(user.role);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl">
                <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
                    <Warehouse className="text-blue-400" size={28} />
                    <span className="text-lg font-black tracking-tight uppercase">Balqish <br/><span className="text-blue-400">Warehouse</span></span>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 mt-4">
                    <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2">Main Menu</div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold">
                        <LayoutDashboard size={20} />
                        <span>Sistem Kontrol</span>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-4">
                    <div className="px-3">
                        <p className="text-xs text-slate-500">Logged in as:</p>
                        <p className="text-sm font-bold truncate">{userName}</p>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase">{userRole.replace('_', ' ')}</span>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-600/20 hover:text-red-500 transition-all text-slate-400"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                            <User size={18} />
                        </div>
                    </div>
                </header>

                {/* AREA UNTUK PAGE.TSX */}
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}