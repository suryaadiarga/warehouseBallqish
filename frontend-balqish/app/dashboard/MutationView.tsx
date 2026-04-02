import api from '@/lib/api';

export default function MutationView({ mutations, userRole, onRefresh }: any) {
    const handleApprove = async (id: number) => {
        if (!confirm("Setujui mutasi ini? Stok akan otomatis diperbarui.")) return;
        try {
            await api.put(`/mutations/${id}/approve`);
            onRefresh(); // Refresh data setelah approve
            alert("Berhasil disetujui!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Gagal menyetujui");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-black">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Produk</th>
                        <th className="px-6 py-4">Tipe</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {mutations.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold">{m.product?.name}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${m.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {m.type.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-bold">{m.quantity}</td>
                            <td className="px-6 py-4 text-sm capitalize">{m.status}</td>
                            <td className="px-6 py-4 text-center">
                                {m.status === 'draft' && userRole === 'admin_gudang' ? (
                                    <button onClick={() => handleApprove(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Approve</button>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}