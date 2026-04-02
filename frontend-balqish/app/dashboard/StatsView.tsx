import { Package, ArrowUpRight, ArrowDownRight, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

export default function StatsView({ stats }: any) {
    // Ambil sebagian data dari mutations untuk recent activity (kalau ada)
    const recentActivities = stats.recent_activities?.slice(0, 5) || [];
    const lowStocks = stats.all_products?.filter((p: any) => p.stock <= (p.min_stock_level || 10)).slice(0, 5) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Header Text */}
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Overview Dashboard</h2>
                <p className="text-slate-500 text-sm mt-1">Pantau pergerakan stok dan performa gudang secara real-time hari ini.</p>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Total SKU */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Package size={20} /></div>
                            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total SKU</p>
                        </div>
                        <h3 className="text-4xl font-black">{stats.total_products || 0}</h3>
                    </div>
                    <Package className="absolute -bottom-6 -right-6 text-white/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                </div>

                {/* Card 2: Inbound */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ArrowUpRight size={20} /></div>
                            <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Barang Masuk</p>
                        </div>
                        <h3 className="text-4xl font-black">{stats.total_inbound_today || 0}</h3>
                    </div>
                    <ArrowUpRight className="absolute -bottom-6 -right-6 text-white/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                </div>

                {/* Card 3: Outbound */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-2xl shadow-lg shadow-orange-500/20 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><ArrowDownRight size={20} /></div>
                            <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider">Barang Keluar</p>
                        </div>
                        <h3 className="text-4xl font-black">{stats.total_outbound_today || 0}</h3>
                    </div>
                    <ArrowDownRight className="absolute -bottom-6 -right-6 text-white/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                </div>

                {/* Card 4: Kritis */}
                <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-6 rounded-2xl shadow-lg shadow-rose-500/20 text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><AlertTriangle size={20} /></div>
                            <p className="text-rose-100 text-sm font-semibold uppercase tracking-wider">Stok Kritis</p>
                        </div>
                        <h3 className="text-4xl font-black">{lowStocks.length}</h3>
                    </div>
                    <AlertTriangle className="absolute -bottom-6 -right-6 text-white/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                </div>

            </div>

            {/* Lower Section: Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Widget 1: Low Stock Alerts */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-1 flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-rose-500" /> Perlu Restock
                        </h3>
                    </div>
                    <div className="p-5 flex-1">
                        {lowStocks.length > 0 ? (
                            <div className="space-y-4">
                                {lowStocks.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                                        </div>
                                        <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">
                                            {item.stock} left
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
                                <Package size={40} className="opacity-20" />
                                <p className="text-sm font-medium">Stok dalam kondisi aman</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Widget 2: Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" /> Aktivitas Mutasi Terakhir
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-5 py-3">Waktu</th>
                                    <th className="px-5 py-3">Produk</th>
                                    <th className="px-5 py-3">Tipe</th>
                                    <th className="px-5 py-3">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((act: any) => (
                                        <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3 text-slate-500 text-xs">{new Date(act.created_at).toLocaleString('id-ID')}</td>
                                            <td className="px-5 py-3 font-semibold">{act.product_name || act.product?.name || '-'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${act.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {act.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-black text-slate-900">{act.quantity}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                                            Belum ada aktivitas mutasi hari ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}