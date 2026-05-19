import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessTokenCookie: process.env.ACCESS_TOKEN_COOKIE ?? 'access_token',
  refreshTokenCookie: process.env.REFRESH_TOKEN_COOKIE ?? 'refresh_token',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  refreshCookiePath: process.env.REFRESH_COOKIE_PATH ?? '/api/v1/auth',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
}));
