import { useState } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Box, FolderTree } from 'lucide-react';

export default function InventoryView({ products, categories, onRefresh }: any) {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
    const [loading, setLoading] = useState(false);

    // State Produk
    const [showProductForm, setShowProductForm] = useState(false);
    const [productForm, setProductForm] = useState({ name: '', sku: '', barcode: '', category_id: '', min_stock_level: 10, price: 0 });

    // State Kategori
    const [showCatForm, setShowCatForm] = useState(false);
    const [catName, setCatName] = useState('');

    // --- HANDLER PRODUK ---
    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/products', productForm);
            setShowProductForm(false);
            setProductForm({ name: '', sku: '', barcode: '', category_id: '', min_stock_level: 10, price: 0 });
            onRefresh();
            alert("Produk berhasil ditambahkan!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menambahkan produk");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id: number, name: string) => {
        if (!confirm(`Yakin ingin menghapus produk ${name}?`)) return;
        try {
            await api.delete(`/products/${id}`);
            onRefresh();
        } catch (err: any) {
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
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menambahkan kategori");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Yakin ingin menghapus kategori ${name}?`)) return;
        try {
            await api.delete(`/categories/${id}`);
            onRefresh();
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menghapus kategori! Pastikan tidak ada produk yang menggunakan kategori ini.");
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
                        <button 
                            onClick={() => setShowProductForm(!showProductForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md"
                        >
                            <Plus size={20} /> <span>{showProductForm ? 'Tutup Form' : 'Tambah Produk'}</span>
                        </button>
                    </div>

                    {showProductForm && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Produk</label>
                                    <input type="text" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                                    <select required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})}>
                                        <option value="">-- Pilih --</option>
                                        {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">SKU</label>
                                    <input type="text" required className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Barcode (Opsional)</label>
                                    <input type="text" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Batas Kritis Stok</label>
                                    <input type="number" required min="0" className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={productForm.min_stock_level} onChange={e => setProductForm({...productForm, min_stock_level: parseInt(e.target.value)})} />
                                </div>
                                <button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl font-bold w-full h-[52px]">
                                    {loading ? 'Menyimpan...' : 'Simpan Produk Baru'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-black">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">SKU / Barcode</th>
                                    <th className="px-6 py-4">Nama Produk</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4 text-center">Stok</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {products?.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono">
                                            <span className="text-blue-600 font-bold block">{p.sku}</span>
                                            <span className="text-slate-400 text-xs">{p.barcode || '-'}</span>
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
                                ))}
                            </tbody>
                        </table>
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
                                {categories?.map((c: any) => (
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