import { CircleAlert, Inbox, LoaderCircle } from 'lucide-react';

export function LoadingState({ title = 'Memuat data', description = 'Mohon tunggu sebentar...' }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="rounded-2xl bg-sky-50 p-4 text-sky-600">
        <LoaderCircle className="animate-spin" size={24} />
      </div>
      <p className="mt-4 text-lg font-black text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function EmptyState({ title = 'Belum ada data', description = 'Data akan muncul setelah backend mengirimkan hasil.' }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
        <Inbox size={24} />
      </div>
      <p className="mt-4 text-lg font-black text-slate-900">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorState({ title = 'Terjadi kesalahan', description = 'Silakan coba lagi atau periksa koneksi ke server.' }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-rose-200 bg-rose-50/80 p-10 text-center">
      <div className="rounded-2xl bg-white p-4 text-rose-600">
        <CircleAlert size={24} />
      </div>
      <p className="mt-4 text-lg font-black text-rose-950">{title}</p>
      <p className="mt-2 max-w-md text-sm text-rose-700/80">{description}</p>
    </div>
  );
}
