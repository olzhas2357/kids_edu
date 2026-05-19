import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { AuthRepository } from './auth.repository';
import type { LoginDto, RegisterDto } from './dto';
import { AuthException } from './exceptions/auth.exception';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from './interfaces/token-pair.interface';
import type { AuthUser } from '@/common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === Role.ADMIN) {
      throw new AuthException(
        'ADMIN_REGISTRATION_FORBIDDEN',
        'Admin accounts cannot be registered via API',
        403,
      );
    }

    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new AuthException(
        'EMAIL_ALREADY_EXISTS',
        'Email is already registered',
        409,
      );
    }

    const rounds = this.config.get<number>('auth.bcryptRounds', 12);
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = await this.authRepository.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: dto.role,
    });

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    return {
      user: this.authRepository.toPublicUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.authRepository.findByEmail(dto.email);

    if (!user) {
      throw new AuthException('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthException('USER_INACTIVE', 'Account is deactivated', 403);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthException('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    return {
      user: this.authRepository.toPublicUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new AuthException('INVALID_REFRESH_TOKEN', 'Refresh token is missing');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new AuthException('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new AuthException('INVALID_REFRESH_TOKEN', 'Invalid refresh token type');
    }

    const stored = await this.authRepository.findRefreshTokenByJti(payload.jti);
    if (!stored || stored.revokedAt) {
      throw new AuthException('REFRESH_TOKEN_REVOKED', 'Refresh token has been revoked');
    }

    if (stored.expiresAt < new Date()) {
      throw new AuthException('INVALID_REFRESH_TOKEN', 'Refresh token has expired');
    }

    const tokenHash = this.hashToken(refreshToken);
    if (stored.tokenHash !== tokenHash) {
      await this.authRepository.revokeRefreshToken(payload.jti);
      throw new AuthException('INVALID_REFRESH_TOKEN', 'Refresh token mismatch');
    }

    await this.authRepository.revokeRefreshToken(payload.jti);

    const user = stored.user;
    if (!user.isActive) {
      throw new AuthException('USER_INACTIVE', 'Account is deactivated', 403);
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    return {
      user: this.authRepository.toPublicUser(user),
      tokens,
    };
  }

  async logout(refreshToken: string | null) {
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
          secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        });
        await this.authRepository.revokeRefreshToken(payload.jti);
      } catch {
        // Ignore invalid token on logout
      }
    }
  }

  async logoutAll(userId: string) {
    await this.authRepository.revokeAllUserRefreshTokens(userId);
  }

  async getMe(user: AuthUser) {
    const dbUser = await this.authRepository.findById(user.id);
    if (!dbUser || !dbUser.isActive) {
      throw new AuthException('USER_INACTIVE', 'Account is deactivated', 403);
    }
    return this.authRepository.toPublicUser(dbUser);
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    role: Role,
  ): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn', '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      jti,
      type: 'refresh',
    };

    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '7d');
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    await this.authRepository.createRefreshToken({
      userId,
      jti,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.addExpiresIn(new Date(), refreshExpiresIn),
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private addExpiresIn(from: Date, expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(from.getTime() + value * (multipliers[unit] ?? 1000));
  }
}
