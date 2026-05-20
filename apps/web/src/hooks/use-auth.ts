'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, WEB_ROUTES } from '@edu-platform/shared';
import { authApi } from '@/lib/api';
import { getHomeRouteForRole } from '@/lib/auth/redirect';
import { useAuthStore } from '@/stores';

export function useAuth() {
  const router = useRouter();
  const { user, status, isAuthenticated, setUser, clearAuth, setLoading } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoggingIn(true);
      try {
        const data = await authApi.login({ email, password });
        if (!data?.user?.id) {
          throw new Error('Invalid login response from server');
        }
        setUser(data.user);
        router.push(getHomeRouteForRole(data.user.role));
        return data.user;
      } finally {
        setIsLoggingIn(false);
      }
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
    /** Session check on protected pages only */
    isSessionLoading: status === 'loading',
    /** Login form submit in progress */
    isLoggingIn,
    login,
    logout,
    refreshSession,
    hasRole,
  };
}
