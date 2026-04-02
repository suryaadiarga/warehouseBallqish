'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import InventoryView from '../InventoryView';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories')
            ]);
            setProducts(prodRes.data.data);
            setCategories(catRes.data.data);
        } catch (error) {
            console.error("Gagal memuat data produk:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold animate-pulse">
            Memuat Inventaris...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <InventoryView products={products} categories={categories} onRefresh={loadData} />
        </div>
    );
}