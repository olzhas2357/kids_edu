import { Injectable } from '@nestjs/common';
import {
  AI_JSON_RESPONSE_KEYS,
  MAX_FEEDBACK_LENGTH,
  MAX_HINT_LENGTH,
} from '../constants/ai.constants';
import { AiException } from '../exceptions/ai.exception';
import {
  AI_PERFORMANCE_LEVELS,
  AiAssessmentResponse,
  AiPerformanceLevel,
  AiPracticeHintResponse,
} from '../types';

@Injectable()
export class AiResponseValidatorService {
  parseJson(raw: string): Record<string, unknown> {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AiException('AI_INVALID_RESPONSE', 'AI returned invalid JSON.');
    }

    try {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      throw new AiException('AI_INVALID_RESPONSE', 'AI returned malformed JSON.');
    }
  }

  validateTestAssessment(
    parsed: Record<string, unknown>,
    expectedScore: number,
    unlockThreshold: number,
  ): AiAssessmentResponse {
    for (const key of AI_JSON_RESPONSE_KEYS) {
      if (!(key in parsed)) {
        throw new AiException('AI_INVALID_RESPONSE', `Missing field: ${key}`);
      }
    }

    const score = this.toNumber(parsed.score, 'score');
    const level = this.toLevel(parsed.level);
    const feedback = this.toSafeString(parsed.feedback, MAX_FEEDBACK_LENGTH, 'feedback');
    const recommendation = this.toSafeString(
      parsed.recommendation,
      MAX_FEEDBACK_LENGTH,
      'recommendation',
    );
    const socraticHint = this.toSafeString(parsed.socraticHint, MAX_HINT_LENGTH, 'socraticHint');

    const normalizedScore = Math.round(Math.min(100, Math.max(0, score)));
    const computedAllow = normalizedScore >= unlockThreshold;

    return {
      score: expectedScore,
      level: this.alignLevelWithScore(level, normalizedScore),
      feedback,
      recommendation,
      allowNextTopic: computedAllow,
      socraticHint,
    };
  }

  validatePracticeHint(parsed: Record<string, unknown>): AiPracticeHintResponse {
    return {
      socraticHint: this.toSafeString(parsed.socraticHint, MAX_HINT_LENGTH, 'socraticHint'),
      encouragement: this.toSafeString(
        parsed.encouragement ?? parsed.feedback ?? 'Keep trying — you can do it!',
        MAX_HINT_LENGTH,
        'encouragement',
      ),
    };
  }

  private alignLevelWithScore(level: AiPerformanceLevel, score: number): AiPerformanceLevel {
    const fromScore = this.levelFromScore(score);
    if (level === fromScore) {
      return level;
    }
    const order = [AiPerformanceLevel.WEAK, AiPerformanceLevel.MEDIUM, AiPerformanceLevel.GOOD, AiPerformanceLevel.EXCELLENT];
    const aiIdx = order.indexOf(level);
    const scoreIdx = order.indexOf(fromScore);
    return Math.abs(aiIdx - scoreIdx) <= 1 ? level : fromScore;
  }

  levelFromScore(score: number): AiPerformanceLevel {
    if (score >= 85) return AiPerformanceLevel.EXCELLENT;
    if (score >= 70) return AiPerformanceLevel.GOOD;
    if (score >= 50) return AiPerformanceLevel.MEDIUM;
    return AiPerformanceLevel.WEAK;
  }

  private toLevel(value: unknown): AiPerformanceLevel {
    const str = String(value).toLowerCase().trim();
    if (AI_PERFORMANCE_LEVELS.includes(str as AiPerformanceLevel)) {
      return str as AiPerformanceLevel;
    }
    throw new AiException('AI_INVALID_RESPONSE', `Invalid level: ${value}`);
  }

  private toNumber(value: unknown, field: string): number {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new AiException('AI_INVALID_RESPONSE', `Invalid number for ${field}`);
    }
    return num;
  }

  private toSafeString(value: unknown, maxLen: number, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new AiException('AI_INVALID_RESPONSE', `Invalid string for ${field}`);
    }
    return value.trim().slice(0, maxLen);
  }
}
