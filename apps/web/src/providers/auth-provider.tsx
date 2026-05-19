'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status, setUser, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    if (status !== 'idle') return;

    let cancelled = false;

    async function hydrate() {
      setLoading();
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
  }, [status, setLoading, setUser, clearAuth]);

  return <>{children}</>;
}
