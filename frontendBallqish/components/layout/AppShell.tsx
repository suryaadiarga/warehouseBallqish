'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { formatRoleLabel } from '@/lib/auth';
import { formatLongDateId } from '@/lib/format';
import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  ChartColumn,
  FileText,
  FolderTree,
  Grid3X3,
  LayoutDashboard,
  LogOut,
  Map,
  PackageSearch,
  SlidersHorizontal,
  Settings2,
  TriangleAlert,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navigationGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Core',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { href: '/dashboard/product-stocks', label: 'Product Stocks', icon: PackageSearch },
      { href: '/dashboard/mutations', label: 'Stock Mutations', icon: ArrowLeftRight },
      { href: '/dashboard/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/dashboard/stock-transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
      { href: '/dashboard/stock-adjustments', label: 'Stock Adjustments', icon: SlidersHorizontal },
      { href: '/dashboard/stock-opnames', label: 'Stock Opnames', icon: ClipboardList },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/dashboard/stock-alerts', label: 'Stock Alerts', icon: TriangleAlert },
      { href: '/dashboard/movement-analysis', label: 'Movement Analysis', icon: ChartColumn },
      { href: '/dashboard/warehouse-map', label: 'Warehouse Map', icon: Map },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { href: '/dashboard/products', label: 'Products', icon: Boxes },
      { href: '/dashboard/categories', label: 'Categories', icon: FolderTree },
      { href: '/dashboard/warehouses', label: 'Warehouses', icon: Warehouse },
      { href: '/dashboard/warehouse-locations', label: 'Warehouse Locations', icon: Grid3X3 },
    ],
  },
  {
    title: 'Akun',
    items: [{ href: '/dashboard/settings', label: 'Profile & Security', icon: Settings2 }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const dateLabel = useMemo(
    () => formatLongDateId(),
    []
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.04),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[304px] flex-col border-r border-slate-200 bg-slate-950 px-5 pb-5 pt-6 text-slate-300 shadow-2xl xl:flex">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-sky-500/5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-400 ring-1 ring-sky-500/20">
                <Warehouse size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Ballqish</p>
                <h1 className="text-lg font-black tracking-tight text-white">Warehouse OS</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Panel operasional gudang yang rapi, siap untuk inventory, analytics, dan presentasi demo.
            </p>
          </div>

          <nav className="mt-6 flex-1 space-y-6 overflow-y-auto pr-2">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{group.title}</p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20'
                            : 'text-slate-300 hover:bg-white/6 hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-sm font-black uppercase text-white">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{user?.name ?? 'Pengguna'}</p>
                <p className="truncate text-xs uppercase tracking-[0.18em] text-sky-300">{formatRoleLabel(user?.role)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace('/login');
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="min-h-screen flex-1 xl:ml-[304px]">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Warehouse Management System</p>
                <h2 className="mt-1 text-sm font-semibold text-slate-600">{dateLabel}</h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Active User</p>
                <p className="text-sm font-bold text-slate-800">{user?.name ?? 'Pengguna'}</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
