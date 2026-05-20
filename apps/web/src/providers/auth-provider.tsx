'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api';

const AUTH_PATHS = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status, setUser, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    if (status !== 'idle') return;

    const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

    let cancelled = false;

    async function hydrate() {
      if (!isAuthPage) {
        setLoading();
      }

      try {
        const user = await authApi.me();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) clearAuth();
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [status, pathname, setLoading, setUser, clearAuth]);

  return <>{children}</>;
}
