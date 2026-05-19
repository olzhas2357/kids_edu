import type { ApiSuccessResponse } from '@/types/api';
import { ApiError } from './errors';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig extends Omit<RequestInit, 'body' | 'method'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  skipAuthRedirect?: boolean;
}

function buildUrl(path: string, params?: RequestConfig['params']): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const url = new URL(path.startsWith('http') ? path : `${base}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Invalid server response', response.status);
  }
}

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  config: RequestConfig = {},
): Promise<T> {
  const { params, body, headers, skipAuthRedirect, ...rest } = config;

  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const payload = await parseBody<ApiSuccessResponse<T> | { message?: string; code?: string }>(
    response,
  );

  if (!response.ok) {
    const message =
      (payload as { message?: string }).message ??
      `Request failed (${response.status})`;
    const code = (payload as { code?: string }).code;

    if (response.status === 401 && !skipAuthRedirect && typeof window !== 'undefined') {
      const isAuthPage = window.location.pathname.startsWith('/login');
      if (!isAuthPage) {
        window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    throw new ApiError(message, response.status, code);
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiSuccessResponse<T>).data;
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, config?: RequestConfig) => apiRequest<T>('GET', path, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>('POST', path, { ...config, body }),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>('PUT', path, { ...config, body }),
  patch: <T>(path: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>('PATCH', path, { ...config, body }),
  delete: <T>(path: string, config?: RequestConfig) => apiRequest<T>('DELETE', path, config),
};
