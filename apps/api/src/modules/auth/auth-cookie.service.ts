import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(
      this.config.getOrThrow<string>('auth.accessTokenCookie'),
      accessToken,
      this.buildAccessCookieOptions(),
    );
    res.cookie(
      this.config.getOrThrow<string>('auth.refreshTokenCookie'),
      refreshToken,
      this.buildRefreshCookieOptions(),
    );
  }

  clearAuthCookies(res: Response) {
    res.clearCookie(this.config.getOrThrow<string>('auth.accessTokenCookie'), {
      path: '/',
    });
    res.clearCookie(this.config.getOrThrow<string>('auth.refreshTokenCookie'), {
      path: this.config.get<string>('auth.refreshCookiePath', '/api/v1/auth'),
    });
  }

  getRefreshTokenFromCookies(cookies: Record<string, string | undefined>): string | null {
    const name = this.config.getOrThrow<string>('auth.refreshTokenCookie');
    const token = cookies[name];
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  private buildAccessCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      path: '/',
      maxAge: this.expiresInToMs(this.config.get<string>('jwt.accessExpiresIn', '15m')),
    };
  }

  private buildRefreshCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      path: this.config.get<string>('auth.refreshCookiePath', '/api/v1/auth'),
      maxAge: this.expiresInToMs(this.config.get<string>('jwt.refreshExpiresIn', '7d')),
    };
  }

  private baseCookieOptions(): CookieOptions {
    const domain = this.config.get<string>('auth.cookieDomain');
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('auth.cookieSecure', false),
      sameSite: this.config.get<'lax' | 'strict' | 'none'>('auth.cookieSameSite', 'lax'),
      ...(domain ? { domain } : {}),
    };
  }

  private expiresInToMs(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return 15 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? 1000);
  }
}
