import { create } from 'zustand';
import type { UserRole } from '@edu-platform/shared';
import type { AuthUser } from '@/lib/api/auth.api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  setLoading: () => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  isAuthenticated: false,
  setLoading: () => set({ status: 'loading' }),
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      status: user ? 'authenticated' : 'unauthenticated',
    }),
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      status: 'unauthenticated',
    }),
}));

export function selectUserRole(state: AuthState): UserRole | undefined {
  return state.user?.role as UserRole | undefined;
}
