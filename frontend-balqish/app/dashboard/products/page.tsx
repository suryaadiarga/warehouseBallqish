'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import InventoryView from '../InventoryView';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [productSearch, setProductSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const perPage = 25;

    const skipNextFilterEffect = useRef(true);

    const loadProducts = async (nextPage = 1) => {
        setLoadingProducts(true);
        try {
            const prodRes = await api.get('/products', {
                params: {
                    page: nextPage,
                    per_page: perPage,
                    search: productSearch.trim() || undefined,
                    category_id: categoryFilter || undefined,
                },
            });
            setProducts(prodRes.data.data);
            setPage(prodRes.data.meta?.pagination?.current_page ?? nextPage);
            setLastPage(prodRes.data.meta?.pagination?.last_page ?? 1);
        } catch (error) {
            console.error("Gagal memuat data produk:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadData = async () => {
        setLoading(true);

        try {
            const catRes = await api.get('/categories');
            setCategories(catRes.data.data);
        } catch (error) {
            console.error("Gagal memuat kategori:", error);
        } finally {
            setLoading(false);
        }

        await loadProducts(1);
    };

    useEffect(() => {
        if (skipNextFilterEffect.current) {
            skipNextFilterEffect.current = false;
            return;
        }

        const handle = setTimeout(() => {
            loadProducts(1);
        }, 250);

        return () => clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productSearch, categoryFilter]);

    useEffect(() => { loadData(); }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-slate-400 font-bold animate-pulse">
            Memuat Inventaris...
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <InventoryView
                products={products}
                categories={categories}
                onRefresh={loadData}
                pagination={{ page, lastPage }}
                onPageChange={loadProducts}
                loadingProducts={loadingProducts}
                productSearch={productSearch}
                categoryFilter={categoryFilter}
                onProductSearchChange={setProductSearch}
                onCategoryFilterChange={setCategoryFilter}
            />
        </div>
    );
}