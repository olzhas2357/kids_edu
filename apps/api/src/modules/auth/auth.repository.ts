import { Injectable } from '@nestjs/common';
import type { Role, User } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    role: Role;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        role: data.role,
      },
    });
  }

  createRefreshToken(data: {
    userId: string;
    jti: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshTokenByJti(jti: string) {
    return this.prisma.refreshToken.findUnique({
      where: { jti },
      include: { user: true },
    });
  }

  revokeRefreshToken(jti: string) {
    return this.prisma.refreshToken.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
