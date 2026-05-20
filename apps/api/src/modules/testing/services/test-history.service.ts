import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestingRepository } from '../repositories/testing.repository';

@Injectable()
export class TestHistoryService {
  constructor(
    private readonly repository: TestingRepository,
    private readonly config: ConfigService,
  ) {}

  async getHistory(studentId: string, testId: string, topicId: string) {
    const attempts = await this.repository.findAttemptHistory(studentId, testId);
    const threshold = this.config.get<number>('learning.unlockScoreThreshold', 85);

    return {
      topicId,
      testId,
      attempts: attempts.map((a) => ({
        attemptId: a.id,
        attemptNumber: a.attemptNumber,
        status: a.status,
        score: a.score ? Number(a.score) : null,
        maxScore: a.maxScore,
        passed: a.score !== null && Number(a.score) >= threshold,
        submittedAt: a.submittedAt,
        antiCheatFlags: a.antiCheatFlags,
        correctCount: a.answers.filter((ans) => ans.isCorrect).length,
        totalAnswered: a.answers.length,
      })),
      bestScore:
        attempts.length > 0
          ? Math.max(...attempts.map((a) => (a.score ? Number(a.score) : 0)))
          : null,
      totalAttempts: attempts.length,
      maxAttempts: null as number | null,
    };
  }
}
