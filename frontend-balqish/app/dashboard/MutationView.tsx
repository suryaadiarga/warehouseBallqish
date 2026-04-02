import { useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, Clock, Plus, AlertCircle } from 'lucide-react';

export default function MutationView({ mutations, products, userRole, onRefresh }: any) {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ product_id: '', type: 'in', quantity: 1, note: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/mutations', formData);
            setShowForm(false);
            setFormData({ product_id: '', type: 'in', quantity: 1, note: '' });
            onRefresh();
            alert("Draft mutasi berhasil dibuat! Menunggu approval admin.");
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal membuat mutasi");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm("Setujui transaksi ini? Stok barang akan otomatis diperbarui.")) return;
        try {
            await api.put(`/mutations/${id}/approve`);
            onRefresh();
            alert("Transaksi Berhasil di-Approve!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal melakukan Approve");
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm("Tolak transaksi ini? Draft akan dihapus permanen.")) return;
        try {
            await api.delete(`/mutations/${id}/reject`);
            onRefresh();
            alert("Draft transaksi berhasil ditolak!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menolak transaksi");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 text-slate-800">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-black">Manajemen Mutasi Stok</h2>
                    <p className="text-sm text-slate-500">Catat barang masuk dan keluar gudang.</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md shadow-blue-500/20"
                >
                    <Plus size={20} /> <span>{showForm ? 'Batal' : 'Input Mutasi'}</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Barang</label>
                            <select 
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={formData.product_id}
                                onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                                required
                            >
                                <option value="">-- Pilih Barang --</option>
                                {products?.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Mutasi</label>
                            <select 
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="in">Masuk (IN)</option>
                                <option value="out">Keluar (OUT)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah</label>
                            <input 
                                type="number" min="1" 
                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl font-bold w-full disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Draft'}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Waktu Transaksi</th>
                            <th className="px-6 py-4">Nama Produk</th>
                            <th className="px-6 py-4 text-center">Tipe</th>
                            <th className="px-6 py-4 text-center">Qty</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Tindakan Admin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {mutations?.map((m: any) => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">{new Date(m.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{m.product_name || m.product?.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${m.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {m.type === 'in' ? 'Masuk' : 'Keluar'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-black text-lg">{m.quantity}</td>
                                <td className="px-6 py-4">
                                    {m.status === 'approved' ? (
                                        <span className="flex items-center text-emerald-600 text-xs font-bold"><CheckCircle size={14} className="mr-1"/> Approved</span>
                                    ) : (
                                        <span className="flex items-center text-amber-500 text-xs font-bold"><Clock size={14} className="mr-1"/> Draft</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {m.status === 'draft' && ['admin_gudang', 'superadmin', 'super_admin'].includes(userRole) ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <button 
                                                onClick={() => handleApprove(m.id)}
                                                className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleReject(m.id)}
                                                className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-colors"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    ) : m.status === 'draft' ? (
                                        <span className="flex items-center justify-center text-slate-400 text-xs italic"><AlertCircle size={12} className="mr-1"/> Menunggu Admin</span>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!mutations || mutations.length === 0) && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                    Belum ada data mutasi stok.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}