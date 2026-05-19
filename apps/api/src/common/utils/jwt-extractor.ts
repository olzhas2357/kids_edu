import type { Request } from 'express';

export function extractAccessToken(req: Request, cookieName: string): string | null {
  const fromCookie = req.cookies?.[cookieName];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) {
    return fromCookie;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}
