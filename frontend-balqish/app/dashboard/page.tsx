'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import StatsView from './StatsView';
import InventoryView from './InventoryView';
import MutationView from './MutationView';

export default function DashboardMain() {
    const [view, setView] = useState('stats');
    const [data, setData] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const loadData = async () => {
        const [dashRes, prodRes] = await Promise.all([
            api.get('/dashboard'),
            api.get('/products')
        ]);
        setData({
            ...dashRes.data.data,
            all_products: prodRes.data.data
        });
        setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };

    useEffect(() => { loadData(); }, []);

    if (!data) return <p className="text-black p-10 font-bold">Menghubungkan ke server...</p>;

    return (
        <div className="space-y-6">
            {/* Navigasi Tab */}
            <div className="flex space-x-2 bg-slate-200 p-1 rounded-xl w-fit">
                <button onClick={() => setView('stats')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'stats' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Dashboard</button>
                <button onClick={() => setView('inventory')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'inventory' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Inventory</button>
                <button onClick={() => setView('mutations')} className={`px-4 py-2 rounded-lg text-sm font-bold ${view === 'mutations' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>Mutasi</button>
            </div>

            {/* Render View */}
            {view === 'stats' && <StatsView stats={data} />}
            {view === 'inventory' && <InventoryView products={data.all_products} />}
            {view === 'mutations' && <MutationView mutations={data.recent_activities} userRole={user?.role} onRefresh={loadData} />}
        </div>
    );
}