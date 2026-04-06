'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import StatsView from './StatsView';

export default function DashboardHome() {
    const [data, setData] = useState<any>(null);

    const loadData = async () => {
        try {
            const dashRes = await api.get('/dashboard');
            setData(dashRes.data.data);
        } catch (error) {
            console.error("Gagal sinkronisasi data dashboard:", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (!data) return (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold animate-pulse">
            Menyinkronkan data dengan Server...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <StatsView stats={data} />
        </div>
    );
}