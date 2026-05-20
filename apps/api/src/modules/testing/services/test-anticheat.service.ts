import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { ANTI_CHEAT_EVENT } from '../constants/testing.constants';
import { TestingException } from '../exceptions/testing.exception';

export interface AntiCheatFlags {
  flagged: boolean;
  reasons: string[];
  tabBlurCount: number;
  pasteCount: number;
  warnings: string[];
}

@Injectable()
export class TestAntiCheatService {
  constructor(private readonly config: ConfigService) {}

  hashIp(req: Request): string | null {
    const ip = req.ip || req.headers['x-forwarded-for'];
    if (!ip) return null;
    const raw = Array.isArray(ip) ? ip[0] : String(ip).split(',')[0].trim();
    return createHash('sha256').update(raw).digest('hex').slice(0, 64);
  }

  assertSessionMatch(attemptSessionId: string | null, clientSessionId: string): void {
    if (attemptSessionId && attemptSessionId !== clientSessionId) {
      throw new TestingException(
        'ANTI_CHEAT_VIOLATION',
        'Test session mismatch. Please restart the test.',
        403,
      );
    }
  }

  recordTabBlur(current: number): { tabBlurCount: number; flag?: string } {
    const max = this.config.get<number>('testing.antiCheat.maxTabBlurs', 5);
    const next = current + 1;
    return {
      tabBlurCount: next,
      flag: next > max ? ANTI_CHEAT_EVENT.TAB_BLUR : undefined,
    };
  }

  recordPaste(current: number): { pasteCount: number; flag?: string } {
    const max = this.config.get<number>('testing.antiCheat.maxPasteEvents', 0);
    const next = current + 1;
    return {
      pasteCount: next,
      flag: next > max ? ANTI_CHEAT_EVENT.PASTE : undefined,
    };
  }

  buildFlags(
    tabBlurCount: number,
    pasteCount: number,
    extra: string[] = [],
  ): AntiCheatFlags {
    const maxBlur = this.config.get<number>('testing.antiCheat.maxTabBlurs', 5);
    const maxPaste = this.config.get<number>('testing.antiCheat.maxPasteEvents', 0);
    const reasons: string[] = [...extra];
    const warnings: string[] = [];

    if (tabBlurCount > maxBlur) {
      reasons.push(ANTI_CHEAT_EVENT.TAB_BLUR);
      warnings.push('Many tab switches were detected.');
    } else if (tabBlurCount > 2) {
      warnings.push('Please stay on the test page.');
    }

    if (pasteCount > maxPaste) {
      reasons.push(ANTI_CHEAT_EVENT.PASTE);
      warnings.push('Paste is not allowed during the test.');
    }

    return {
      flagged: reasons.length > 0,
      reasons,
      tabBlurCount,
      pasteCount,
      warnings,
    };
  }
}
