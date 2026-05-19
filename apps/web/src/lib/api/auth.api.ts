import { API_ROUTES, type AuthResponse, type LoginRequest, type RegisterRequest } from '@edu-platform/shared';
import { api } from './client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export const authApi = {
  me: () => api.get<AuthUser>(API_ROUTES.AUTH.ME, { skipAuthRedirect: true }),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>(API_ROUTES.AUTH.LOGIN, data, { skipAuthRedirect: true }),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>(API_ROUTES.AUTH.REGISTER, data, { skipAuthRedirect: true }),

  logout: () => api.post<void>(API_ROUTES.AUTH.LOGOUT),

  refresh: () => api.post<void>(API_ROUTES.AUTH.REFRESH, undefined, { skipAuthRedirect: true }),
};
