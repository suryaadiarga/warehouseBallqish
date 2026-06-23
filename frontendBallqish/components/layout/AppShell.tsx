'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { formatRoleLabel } from '@/lib/auth';
import { formatLongDateId } from '@/lib/format';
import {
  ArrowLeftRight,
  Boxes,
  ChartColumn,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Warehouse,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', description: 'Ringkasan operasional', icon: LayoutDashboard },
  { href: '/dashboard/inventory', label: 'Produk & Stok', description: 'Katalog dan inventaris', icon: Boxes },
  { href: '/dashboard/operations', label: 'Operasional Stok', description: 'Mutasi dan transfer', icon: ArrowLeftRight },
  { href: '/dashboard/stock-audits', label: 'Audit Stok', description: 'Penghitungan dan penyesuaian', icon: ClipboardList },
  { href: '/dashboard/analytics', label: 'Analitik Inventaris', description: 'Peringatan dan pergerakan', icon: ChartColumn },
  { href: '/dashboard/warehouse-management', label: 'Manajemen Gudang', description: 'Gudang, rak, dan peta', icon: Warehouse },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dateLabel = useMemo(() => formatLongDateId(), []);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-400 ring-1 ring-sky-500/20">
            <Warehouse size={23} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Ballqish</p>
            <p className="mt-0.5 text-lg font-black tracking-tight text-white">Sistem Gudang</p>
          </div>
        </Link>
        <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white xl:hidden" aria-label="Tutup navigasi">
          <X size={20} />
        </button>
      </div>

      <nav className="mt-8 flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                active ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20' : 'text-slate-300 hover:bg-white/6 hover:text-white'
              }`}
            >
              <Icon size={19} className={active ? 'text-sky-400' : 'text-slate-500 transition group-hover:text-slate-300'} />
              <span className="min-w-0">
                <span className="block text-sm font-bold">{item.label}</span>
                <span className={`mt-0.5 block truncate text-[11px] ${active ? 'text-sky-400/70' : 'text-slate-600'}`}>{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-500">
        <span className="font-bold text-slate-400">Ballqish WMS</span>
        <span className="block">Operasional gudang terintegrasi</span>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.04),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      {mobileOpen ? <button type="button" aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm xl:hidden" /> : null}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col border-r border-white/10 bg-slate-950 px-5 py-6 shadow-2xl transition-transform xl:w-[272px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}>
        {sidebarContent}
      </aside>

      <div className="min-h-screen xl:ml-[272px]">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm xl:hidden" aria-label="Buka navigasi">
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Sistem Manajemen Gudang</p>
                <p className="mt-1 hidden text-sm font-semibold text-slate-600 sm:block">{dateLabel}</p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
                aria-expanded={accountOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-sm font-black uppercase text-white">{user?.name?.charAt(0) ?? 'U'}</span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-40 truncate text-sm font-bold text-slate-900">{user?.name ?? 'Pengguna'}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-sky-600">{formatRoleLabel(user?.role)}</span>
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition ${accountOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountOpen ? (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                  <div className="border-b border-slate-100 px-3 py-3 sm:hidden">
                    <p className="truncate text-sm font-bold text-slate-900">{user?.name ?? 'Pengguna'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatRoleLabel(user?.role)}</p>
                  </div>
                  <Link href="/dashboard/settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    <Settings2 size={17} />
                    Profil & Keamanan
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setAccountOpen(false);
                      await logout();
                      router.replace('/login');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
