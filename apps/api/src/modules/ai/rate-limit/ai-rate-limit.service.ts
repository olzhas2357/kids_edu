import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiException } from '../exceptions/ai.exception';

interface RateBucket {
  minuteTimestamps: number[];
  hourTimestamps: number[];
}

@Injectable()
export class AiRateLimitService {
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly config: ConfigService) {}

  assertWithinLimit(studentId: string): void {
    const now = Date.now();
    const perMinute = this.config.get<number>('openai.rateLimitPerMinute', 10);
    const perHour = this.config.get<number>('openai.rateLimitPerHour', 30);

    let bucket = this.buckets.get(studentId);
    if (!bucket) {
      bucket = { minuteTimestamps: [], hourTimestamps: [] };
      this.buckets.set(studentId, bucket);
    }

    const minuteAgo = now - 60_000;
    const hourAgo = now - 3_600_000;

    bucket.minuteTimestamps = bucket.minuteTimestamps.filter((t) => t > minuteAgo);
    bucket.hourTimestamps = bucket.hourTimestamps.filter((t) => t > hourAgo);

    if (bucket.minuteTimestamps.length >= perMinute) {
      throw new AiException(
        'AI_RATE_LIMITED',
        'Too many AI requests. Please wait a minute and try again.',
        429,
      );
    }

    if (bucket.hourTimestamps.length >= perHour) {
      throw new AiException(
        'AI_RATE_LIMITED',
        'You reached the hourly AI limit. Please try again later.',
        429,
      );
    }

    bucket.minuteTimestamps.push(now);
    bucket.hourTimestamps.push(now);
  }
}
