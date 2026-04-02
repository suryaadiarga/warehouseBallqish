'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import MutationView from '../MutationView';

export default function MutationsPage() {
    const [mutations, setMutations] = useState([]);
    const [products, setProducts] = useState([]);
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [mutRes, prodRes] = await Promise.all([
                api.get('/reports/mutations'),
                api.get('/products')
            ]);
            setMutations(mutRes.data.data);
            setProducts(prodRes.data.data);

            const userStr = localStorage.getItem('user');
            if (userStr) {
                setUserRole(JSON.parse(userStr).role);
            }
        } catch (error) {
            console.error("Gagal memuat data mutasi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold animate-pulse">
            Memuat Data Mutasi...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <MutationView mutations={mutations} products={products} userRole={userRole} onRefresh={loadData} />
        </div>
    );
}