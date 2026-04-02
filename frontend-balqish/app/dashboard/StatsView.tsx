import { Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatsView({ stats }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-black">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <Package className="text-blue-600 mb-2" />
                <h4 className="text-slate-500 text-sm">Total Produk</h4>
                <p className="text-2xl font-bold">{stats.total_products}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <ArrowUpRight className="text-green-600 mb-2" />
                <h4 className="text-slate-500 text-sm">Masuk Hari Ini</h4>
                <p className="text-2xl font-bold">{stats.total_inbound_today}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <ArrowDownRight className="text-orange-600 mb-2" />
                <h4 className="text-slate-500 text-sm">Keluar Hari Ini</h4>
                <p className="text-2xl font-bold">{stats.total_outbound_today}</p>
            </div>
        </div>
    );
}