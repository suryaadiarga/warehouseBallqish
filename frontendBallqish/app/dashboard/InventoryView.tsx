import { useState } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Box, FolderTree } from 'lucide-react';
import Link from 'next/link';

type Category = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    sku: string;
    name: string;
    stock: number;
    category?: Category | null;
};

type Pagination = {
    page: number;
    lastPage: number;
};

type InventoryViewProps = {
    products?: Product[];
    categories?: Category[];
    onRefresh: () => void;
    pagination?: Pagination;
    onPageChange?: (page: number) => void;
    loadingProducts?: boolean;
    productSearch?: string;
    categoryFilter?: string;
    onProductSearchChange?: (value: string) => void;
    onCategoryFilterChange?: (value: string) => void;
};

const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        return response?.data?.message ?? fallback;
    }

    return fallback;
};

export default function InventoryView({ products, categories, onRefresh, pagination, onPageChange, loadingProducts, productSearch, categoryFilter, onProductSearchChange, onCategoryFilterChange }: InventoryViewProps) {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
    const [loading, setLoading] = useState(false);

    // State Kategori
    const [showCatForm, setShowCatForm] = useState(false);
    const [catName, setCatName] = useState('');

    const handleDeleteProduct = async (id: number, name: string) => {
        if (!confirm(`Yakin ingin menghapus produk ${name}?`)) return;
        try {
            await api.delete(`/products/${id}`);
            onRefresh();
        } catch {
            alert("Gagal menghapus produk. Pastikan tidak ada histori mutasi terkait.");
        }
    };

    // --- HANDLER KATEGORI ---
    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/categories', { name: catName });
            setShowCatForm(false);
            setCatName('');
            onRefresh();
            alert("Kategori berhasil ditambahkan!");
        } catch (err: unknown) {
            alert(getErrorMessage(err, "Gagal menambahkan kategori"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Yakin ingin menghapus kategori ${name}?`)) return;
        try {
            await api.delete(`/categories/${id}`);
            onRefresh();
        } catch (err: unknown) {
            alert(getErrorMessage(err, "Gagal menghapus kategori! Pastikan tidak ada produk yang menggunakan kategori ini."));
        }
    };

    return (
        <div className="space-y-6 text-slate-800">
            {/* Header & Tabs */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-2">
                <button 
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Box size={20} /> <span>Daftar Produk</span>
                </button>
                <button 
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-xl font-bold transition-all ${activeTab === 'categories' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <FolderTree size={20} /> <span>Kategori Barang</span>
                </button>
            </div>

            {/* AREA PRODUK */}
            {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div>
                            <h2 className="text-xl font-black">Inventaris Gudang</h2>
                        </div>
                        <Link 
                            href="/dashboard/operations?tab=movements"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md"
                        >
                            <Plus size={20} /> <span>Tambah Stok</span>
                        </Link>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3">
                        <select
                            className="w-full md:w-64 p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={categoryFilter ?? ''}
                            onChange={(e) => onCategoryFilterChange?.(e.target.value)}
                        >
                            <option value="">Semua Kategori</option>
                            {categories?.map((c) => (
                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cari nama / SKU"
                            value={productSearch ?? ''}
                            onChange={(e) => onProductSearchChange?.(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-black">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">SKU</th>
                                    <th className="px-6 py-4">Nama Produk</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-center">Stok</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {loadingProducts ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold animate-pulse">
                                            Memuat data produk...
                                        </td>
                                    </tr>
                                ) : (
                                    products?.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono">
                                                <span className="text-blue-600 font-bold block">{p.sku}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold">{p.name}</td>
                                            <td className="px-6 py-4">{p.category?.name}</td>
                                            <td className="px-6 py-4 text-center font-black text-lg">{p.stock}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => handleDeleteProduct(p.id, p.name)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>
                            Halaman <span className="font-bold text-slate-700">{pagination?.page ?? 1}</span> dari{' '}
                            <span className="font-bold text-slate-700">{pagination?.lastPage ?? 1}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onPageChange?.((pagination?.page ?? 1) - 1)}
                                disabled={loadingProducts || (pagination?.page ?? 1) <= 1}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white font-bold"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => onPageChange?.((pagination?.page ?? 1) + 1)}
                                disabled={loadingProducts || (pagination?.page ?? 1) >= (pagination?.lastPage ?? 1)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white font-bold"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AREA KATEGORI */}
            {activeTab === 'categories' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div>
                            <h2 className="text-xl font-black">Manajemen Kategori</h2>
                        </div>
                        <button 
                            onClick={() => setShowCatForm(!showCatForm)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md"
                        >
                            <Plus size={20} /> <span>{showCatForm ? 'Batal' : 'Kategori Baru'}</span>
                        </button>
                    </div>

                    {showCatForm && (
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-inner">
                            <form onSubmit={handleCategorySubmit} className="flex space-x-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Kategori Baru</label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="Contoh: Alat Tulis Kantor"
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500" 
                                        value={catName} 
                                        onChange={e => setCatName(e.target.value)} 
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold w-48 h-[52px]">
                                    {loading ? 'Menyimpan...' : 'Simpan Kategori'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-black max-w-3xl">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 w-16 text-center">ID</th>
                                    <th className="px-6 py-4">Nama Kategori</th>
                                    <th className="px-6 py-4 text-center w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {categories?.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-center font-mono text-slate-400">{c.id}</td>
                                        <td className="px-6 py-4 font-bold">{c.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDeleteCategory(c.id, c.name)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
