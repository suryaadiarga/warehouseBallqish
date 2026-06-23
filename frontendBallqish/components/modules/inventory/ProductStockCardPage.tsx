'use client';

import { InventoryMovementBadge } from '@/components/ui/InventoryMovementBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/QueryState';
import api, { ApiEnvelope, extractApiErrorMessage } from '@/lib/api';
import { formatDateTimeId } from '@/lib/format';
import { FileSpreadsheet, History, PackageSearch } from 'lucide-react';
import { useEffect, useState } from 'react';

type StockCardEntry = {
  id: number;
  reference_number: string | null;
  transfer_id: string | null;
  mutation_source: string | null;
  type: string | null;
  status: string | null;
  reason: string | null;
  note: string | null;
  before_qty: number | null;
  change_qty: number | null;
  after_qty: number | null;
  created_at: string | null;
};

type StockCardResponse = {
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
    min_stock_level: number;
  };
  stock_card: StockCardEntry[];
};

export function ProductStockCardPage({ productId }: { productId: string }) {
  const [data, setData] = useState<StockCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get<ApiEnvelope<StockCardResponse>>(`/products/${productId}/stock-card`);
        setData(response.data.data);
      } catch (err: unknown) {
        setError(extractApiErrorMessage(err, 'Gagal memuat stock card produk.'));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [productId]);

  if (loading) {
    return <LoadingState title="Memuat kartu stok" description="Mengambil jejak audit mutasi produk dari backend." />;
  }

  if (error) {
    return <ErrorState title="Stock card gagal dimuat" description={error} />;
  }

  if (!data) {
    return <EmptyState title="Stock card tidak tersedia" description="Backend belum mengirimkan data kartu stok untuk produk ini." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jejak Audit"
        title={`Kartu Stok: ${data.product.name}`}
        description={`Jejak mutasi kronologis untuk SKU ${data.product.sku}, termasuk before, change, dan after quantity.`}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <MetricCard label="Stok Saat Ini" value={data.product.stock} icon={PackageSearch} description="Ringkasan stok produk." />
        <MetricCard label="Entri" value={data.stock_card.length} icon={History} tone="sky" description="Jumlah transaksi pada kartu stok produk ini." />
        <MetricCard label="Stok Minimum" value={data.product.min_stock_level} icon={FileSpreadsheet} tone="amber" description="Batas minimum yang dipakai backend untuk peringatan stok." />
      </div>

      <section className="surface-card rounded-[28px] overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-black text-slate-900">Kartu Stok</h3>
          <p className="mt-1 text-sm text-slate-500">Tampilan ini dirancang sebagai audit trail profesional untuk demo dan pelacakan transaksi.</p>
        </div>

        {data.stock_card.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Belum ada mutasi" description="Produk ini belum memiliki histori mutasi pada stock card." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Referensi</th>
                  <th className="px-6 py-4">Sumber</th>
                  <th className="px-6 py-4">Tipe</th>
                  <th className="px-6 py-4">Sebelum</th>
                  <th className="px-6 py-4">Perubahan</th>
                  <th className="px-6 py-4">Sesudah</th>
                  <th className="px-6 py-4">Transfer ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.stock_card.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 text-slate-600">{formatDateTimeId(entry.created_at)}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{entry.reference_number || '-'}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.reason || entry.note || 'Tanpa catatan tambahan'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <InventoryMovementBadge source={entry.mutation_source} />
                    </td>
                    <td className="px-6 py-4">
                      <InventoryMovementBadge type={entry.type} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{entry.before_qty ?? '-'}</td>
                    <td className="px-6 py-4 font-black text-slate-900">{entry.change_qty ?? '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{entry.after_qty ?? '-'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{entry.transfer_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
