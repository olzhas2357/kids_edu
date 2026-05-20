import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.get<boolean>('redis.enabled', false)) {
      this.logger.warn('Redis disabled (REDIS_ENABLED=false)');
      return;
    }

    const url = this.config.get<string>('redis.url', 'redis://localhost:6379');
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      this.connected = false;
      this.logger.error(`Redis error: ${err.message}`);
    });

    try {
      await this.client.connect();
      this.connected = true;
      this.logger.log('Redis connected');
    } catch (err) {
      this.logger.warn(
        `Redis unavailable, falling back to in-memory limits/cache: ${(err as Error).message}`,
      );
      this.client = null;
      this.connected = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  isReady(): boolean {
    return this.connected && this.client?.isOpen === true;
  }

  getClient(): RedisClientType | null {
    return this.isReady() ? this.client : null;
  }

  async ping(): Promise<boolean> {
    if (!this.isReady() || !this.client) return false;
    const pong = await this.client.ping();
    return pong === 'PONG';
  }

  /** Increment key and set TTL on first increment (sliding window helper). */
  async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const client = this.getClient();
    if (!client) return 0;

    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, ttlSeconds);
    }
    return count;
  }
}
