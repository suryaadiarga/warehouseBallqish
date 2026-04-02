export default function InventoryView({ products }: any) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-black">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr><th className="px-6 py-4">SKU</th><th className="px-6 py-4">Nama</th><th className="px-6 py-4">Stok</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {products.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono text-blue-600">{p.sku}</td>
                            <td className="px-6 py-4 font-bold">{p.name}</td>
                            <td className="px-6 py-4">{p.stock}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}