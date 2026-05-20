import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/infrastructure/redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  checks: Record<string, { status: 'up' | 'down'; latencyMs?: number }>;
  uptime: number;
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async ready(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    let allUp = true;

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up', latencyMs: Date.now() - dbStart };
    } catch {
      checks.database = { status: 'down', latencyMs: Date.now() - dbStart };
      allUp = false;
    }

    const redisStart = Date.now();
    const redisUp = await this.redis.ping();
    checks.redis = {
      status: redisUp ? 'up' : 'down',
      latencyMs: Date.now() - redisStart,
    };

    const status = !allUp ? 'error' : redisUp ? 'ok' : 'degraded';

    return {
      status,
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  metrics() {
    const memory = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
