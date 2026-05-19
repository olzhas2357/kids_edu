/** Must match API ACCESS_TOKEN_COOKIE when using cookie auth */
export const ACCESS_TOKEN_COOKIE =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE ?? 'access_token';

export const AUTH_PUBLIC_PATHS = ['/login', '/register'] as const;

export const ROLE_HOME: Record<string, string> = {
  TEACHER: '/teacher',
  ADMIN: '/teacher',
  STUDENT: '/student/topics',
};
