import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestAttemptStatus } from '@prisma/client';

@Injectable()
export class TestTimerService {
  constructor(private readonly config: ConfigService) {}

  resolveExpiresAt(timeLimitMinutes: number | null | undefined, startedAt: Date): Date | null {
    const minutes =
      timeLimitMinutes ??
      this.config.get<number>('testing.defaultTimeLimitMinutes', 15);
    if (!minutes || minutes <= 0) {
      return null;
    }
    return new Date(startedAt.getTime() + minutes * 60 * 1000);
  }

  getRemainingSeconds(expiresAt: Date | null): number | null {
    if (!expiresAt) return null;
    const diff = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }

  isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return Date.now() >= expiresAt.getTime();
  }

  timedOutStatus(): TestAttemptStatus {
    return TestAttemptStatus.TIMED_OUT;
  }
}
