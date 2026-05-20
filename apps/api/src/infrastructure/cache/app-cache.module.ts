import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (config: ConfigService) => {
        const ttlMs = config.get<number>('redis.ttlSeconds', 300) * 1000;

        if (!config.get<boolean>('redis.enabled', false)) {
          return { ttl: ttlMs };
        }

        const url = config.get<string>('redis.url', 'redis://localhost:6379');

        try {
          const store = await redisStore({
            url,
            socket: { connectTimeout: 2_000, reconnectStrategy: () => false },
          });
          return { store, ttl: ttlMs };
        } catch {
          return { ttl: ttlMs };
        }
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
