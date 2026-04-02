'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FileDown, FileText, CheckCircle, Clock } from 'lucide-react';

export default function ReportsPage() {
    const [mutations, setMutations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get('/reports/mutations');
                setMutations(res.data.data);
            } catch (error) {
                console.error("Gagal memuat data laporan:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // FUNGSI SAKTI EXPORT KE CSV (Bisa dibuka di Excel)
    const handleExportCSV = () => {
        if (mutations.length === 0) {
            alert("Tidak ada data untuk diekspor!");
            return;
        }

        // 1. Buat Header Kolom
        let csvContent = "ID Transaksi,Waktu,Nama Produk,Jenis,Jumlah,Status\n";

        // 2. Looping Data dan Format ke CSV
        mutations.forEach((m: any) => {
            const date = new Date(m.created_at).toLocaleString('id-ID').replace(/,/g, ''); // Hapus koma di tanggal
            const productName = (m.product_name || m.product?.name || 'Produk Dihapus').replace(/,/g, ''); // Hindari bentrok koma
            const type = m.type === 'in' ? 'Masuk' : 'Keluar';
            const qty = m.quantity;
            const status = m.status === 'approved' ? 'Approved' : 'Draft';

            csvContent += `${m.id},${date},${productName},${type},${qty},${status}\n`;
        });

        // 3. Buat File dan Download Otomatis
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Gudang_Balqish_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="animate-pulse text-slate-400 font-bold h-64 flex items-center justify-center">Menyiapkan Dokumen...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Export Dokumen</h2>
                        <p className="text-sm text-slate-500">Unduh riwayat mutasi stok untuk keperluan audit.</p>
                    </div>
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md shadow-amber-500/20"
                >
                    <FileDown size={20} /> <span>Download CSV (Excel)</span>
                </button>
            </div>

            {/* Preview Tabel Laporan */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Preview Data ({mutations.length} Baris)
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white sticky top-0 border-b border-slate-200 text-slate-600 font-bold shadow-sm z-10">
                            <tr>
                                <th className="px-6 py-4">Waktu Transaksi</th>
                                <th className="px-6 py-4">Nama Produk</th>
                                <th className="px-6 py-4 text-center">Tipe</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {mutations?.map((m: any) => (
                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">{new Date(m.created_at).toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 font-bold">{m.product_name || m.product?.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${m.type === 'in' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>
                                            {m.type === 'in' ? 'Masuk' : 'Keluar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-black">{m.quantity}</td>
                                    <td className="px-6 py-4">
                                        {m.status === 'approved' ? (
                                            <span className="flex items-center text-emerald-600 text-xs font-bold"><CheckCircle size={14} className="mr-1"/> Approved</span>
                                        ) : (
                                            <span className="flex items-center text-amber-500 text-xs font-bold"><Clock size={14} className="mr-1"/> Draft</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}