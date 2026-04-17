'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { buildLoginRedirectPath } from '@/lib/auth';
import { Warehouse } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      router.replace(buildLoginRedirectPath(pathname, search));
    }
  }, [isAuthenticated, isBootstrapping, pathname, router]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white/80 px-8 py-10 text-center shadow-xl backdrop-blur">
          <div className="rounded-2xl bg-sky-100 p-4 text-sky-700">
            <Warehouse size={28} />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900">Memverifikasi sesi Anda</p>
            <p className="mt-1 text-sm text-slate-500">Frontend sedang menyinkronkan autentikasi dengan backend WMS.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
