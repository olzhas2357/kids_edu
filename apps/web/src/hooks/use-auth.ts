'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, WEB_ROUTES } from '@edu-platform/shared';
import { authApi } from '@/lib/api';
import { getHomeRouteForRole } from '@/lib/auth/redirect';
import { useAuthStore } from '@/stores';

export function useAuth() {
  const router = useRouter();
  const { user, status, isAuthenticated, setUser, clearAuth, setLoading } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      setUser(response.user);
      router.push(getHomeRouteForRole(response.user.role));
      return response.user;
    },
    [router, setUser],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push(WEB_ROUTES.LOGIN);
    }
  }, [clearAuth, router]);

  const refreshSession = useCallback(async () => {
    setLoading();
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, setLoading, setUser]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    },
    [user],
  );

  return {
    user,
    status,
    isAuthenticated,
    isLoading: status === 'loading' || status === 'idle',
    login,
    logout,
    refreshSession,
    hasRole,
  };
}
