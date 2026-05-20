import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestAttemptStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import type { AuthUser } from '@/common/types';
import { AiRepository } from '@/modules/ai/repositories/ai.repository';
import { AiService } from '@/modules/ai/services/ai.service';
import { StudentProgressService } from '@/modules/student/services/student-progress.service';
import { StudentNotFoundException } from '@/modules/student/exceptions/student-learning.exception';
import { StudentStepOrderException } from '@/modules/student/exceptions/student-learning.exception';
import { TestingException } from '../exceptions/testing.exception';
import { TestingRepository } from '../repositories/testing.repository';
import {
  mapQuestionForStudent,
  validateMcTestQuestions,
} from '../validators/mc-question.validator';
import { TestAntiCheatService } from './test-anticheat.service';
import { TestAutosaveService } from './test-autosave.service';
import { TestHistoryService } from './test-history.service';
import { TestScoringService } from './test-scoring.service';
import { TestTimerService } from './test-timer.service';
import type { AntiCheatEventType } from '../constants/testing.constants';

@Injectable()
export class TestEngineService {
  constructor(
    private readonly repository: TestingRepository,
    private readonly progressService: StudentProgressService,
    private readonly scoring: TestScoringService,
    private readonly timer: TestTimerService,
    private readonly anticheat: TestAntiCheatService,
    private readonly autosave: TestAutosaveService,
    private readonly history: TestHistoryService,
    private readonly aiService: AiService,
    private readonly aiRepository: AiRepository,
    private readonly config: ConfigService,
  ) {}

  async startTest(topicId: string, user: AuthUser, req: Request, clientSessionId?: string) {
    const { progress } = await this.progressService.assertTopicUnlocked(topicId, user.id);
    this.assertPrerequisites(progress);

    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TestingException('TEST_NOT_CONFIGURED', 'No test configured for this topic', 404);
    }

    const mcConfig = {
      questionCount: test.questionCount,
      choicesPerQuestion: test.choicesPerQuestion,
    };
    validateMcTestQuestions(test.questions, mcConfig);

    const completedAttempts = await this.repository.countGradedAttempts(user.id, test.id);
    if (completedAttempts >= test.maxAttempts) {
      throw new TestingException(
        'MAX_ATTEMPTS_REACHED',
        `Maximum ${test.maxAttempts} attempts reached. Review your history.`,
        403,
      );
    }

    const existing = await this.repository.findActiveAttempt(user.id, test.id);
    if (existing) {
      return this.mapSession(existing, true);
    }

    const sessionId = clientSessionId ?? randomUUID();
    const maxScore = test.questions.reduce((s, q) => s + q.points, 0);
    const attemptNumber = await this.repository.getNextAttemptNumber(user.id, test.id);
    const startedAt = new Date();
    const expiresAt = this.timer.resolveExpiresAt(test.timeLimitMinutes, startedAt);

    const attempt = await this.repository.createAttempt({
      studentId: user.id,
      testId: test.id,
      attemptNumber,
      maxScore,
      expiresAt,
      clientSessionId: sessionId,
      ipHash: this.anticheat.hashIp(req),
    });

    return this.mapSession(attempt, false);
  }

  async getSession(topicId: string, attemptId: string, user: AuthUser) {
    const attempt = await this.assertActiveAttempt(attemptId, user.id, topicId);
    await this.expireIfNeeded(attempt);
    const refreshed = await this.repository.findAttempt(attemptId, user.id);
    if (!refreshed) {
      throw new TestingException('ATTEMPT_NOT_FOUND', 'Attempt not found', 404);
    }
    return this.mapSession(refreshed, true);
  }

  async saveAnswer(
    topicId: string,
    attemptId: string,
    questionId: string,
    answer: unknown,
    user: AuthUser,
    clientSessionId?: string,
  ) {
    const attempt = await this.assertActiveAttempt(attemptId, user.id, topicId);
    await this.expireIfNeeded(attempt);

    if (clientSessionId) {
      this.anticheat.assertSessionMatch(attempt.clientSessionId, clientSessionId);
    }

    const question = attempt.test.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new TestingException('QUESTION_NOT_FOUND', 'Question not found', 404);
    }

    const saved = await this.autosave.saveAnswer({
      attemptId,
      questionId,
      studentId: user.id,
      answer,
      question,
      revealGrade: false,
    });

    const updated = await this.repository.findAttempt(attemptId, user.id);
    return {
      ...saved,
      progress: this.buildAnswerProgress(updated!),
      timer: this.buildTimer(updated!),
    };
  }

  async autosaveBatch(
    topicId: string,
    attemptId: string,
    answers: Array<{ questionId: string; answer: unknown }>,
    user: AuthUser,
    clientSessionId?: string,
  ) {
    const attempt = await this.assertActiveAttempt(attemptId, user.id, topicId);
    await this.expireIfNeeded(attempt);

    if (clientSessionId) {
      this.anticheat.assertSessionMatch(attempt.clientSessionId, clientSessionId);
    }

    const questionsById = new Map(
      attempt.test.questions.map((q) => [q.id, q]),
    );

    const batch = await this.autosave.saveBatch({
      attemptId,
      studentId: user.id,
      answers,
      questionsById,
    });

    const updated = await this.repository.findAttempt(attemptId, user.id);
    return {
      ...batch,
      progress: this.buildAnswerProgress(updated!),
      timer: this.buildTimer(updated!),
    };
  }

  async recordAntiCheatEvent(
    topicId: string,
    attemptId: string,
    event: AntiCheatEventType,
    user: AuthUser,
    clientSessionId?: string,
  ) {
    const attempt = await this.assertActiveAttempt(attemptId, user.id, topicId);

    if (clientSessionId) {
      this.anticheat.assertSessionMatch(attempt.clientSessionId, clientSessionId);
    }

    let tabBlurCount = attempt.tabBlurCount;
    let pasteCount = attempt.pasteCount;
    const extraFlags: string[] = [];

    if (event === 'tab_blur') {
      const r = this.anticheat.recordTabBlur(tabBlurCount);
      tabBlurCount = r.tabBlurCount;
      if (r.flag) extraFlags.push(r.flag);
    } else if (event === 'paste') {
      const r = this.anticheat.recordPaste(pasteCount);
      pasteCount = r.pasteCount;
      if (r.flag) extraFlags.push(r.flag);
    }

    const flags = this.anticheat.buildFlags(tabBlurCount, pasteCount, extraFlags);

    await this.repository.updateAttempt(attemptId, {
      tabBlurCount,
      pasteCount,
      antiCheatFlags: flags as object,
    });

    return { recorded: true, event, antiCheat: flags };
  }

  async submitTest(
    topicId: string,
    attemptId: string,
    user: AuthUser,
    clientSessionId?: string,
    options?: { timedOut?: boolean },
  ) {
    let attempt = await this.repository.findAttempt(attemptId, user.id);
    if (!attempt || attempt.test.topicId !== topicId) {
      throw new TestingException('ATTEMPT_NOT_FOUND', 'Attempt not found', 404);
    }

    if (attempt.status !== TestAttemptStatus.IN_PROGRESS) {
      throw new TestingException('ATTEMPT_NOT_ACTIVE', 'This attempt is already finished');
    }

    if (clientSessionId) {
      this.anticheat.assertSessionMatch(attempt.clientSessionId, clientSessionId);
    }

    const timedOut = options?.timedOut ?? this.timer.isExpired(attempt.expiresAt);
    if (timedOut) {
      return this.submitTimedOut(attempt, topicId, user.id);
    }

    const questions = attempt.test.questions;
    const answers = attempt.answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
    }));

    const unanswered = questions.filter(
      (q) => !answers.some((a) => a.questionId === q.id),
    );
    if (unanswered.length > 0) {
      throw new TestingException(
        'ATTEMPT_NOT_ACTIVE',
        `Answer all ${questions.length} questions before submit (${unanswered.length} remaining)`,
      );
    }

    const graded = this.scoring.gradeAttemptAnswers(questions, answers);

    for (const row of graded.breakdown) {
      const ans = answers.find((a) => a.questionId === row.questionId)!;
      await this.repository.upsertAnswer({
        attemptId,
        questionId: row.questionId,
        studentId: user.id,
        answer: ans.answer as object,
        isCorrect: row.isCorrect,
        pointsEarned: row.pointsEarned,
      });
    }

    const antiCheat = this.anticheat.buildFlags(
      attempt.tabBlurCount,
      attempt.pasteCount,
      (attempt.antiCheatFlags as { reasons?: string[] })?.reasons ?? [],
    );

    await this.repository.updateAttempt(attemptId, {
      score: graded.scorePercent,
      maxScore: graded.maxPoints,
      status: TestAttemptStatus.GRADED,
      submittedAt: new Date(),
      antiCheatFlags: antiCheat as object,
    });

    const finalAttempt = (await this.repository.findAttempt(attemptId, user.id))!;
    const result = await this.applyProgressAndAi(finalAttempt, topicId, user.id, graded.scorePercent);

    return {
      ...result,
      antiCheat,
      breakdown: graded.breakdown.map((b) => ({
        questionId: b.questionId,
        isCorrect: b.isCorrect,
        pointsEarned: b.pointsEarned,
      })),
    };
  }

  async getHistory(topicId: string, user: AuthUser) {
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new StudentNotFoundException('Test');
    }
    const data = await this.history.getHistory(user.id, test.id, topicId);
    return { ...data, maxAttempts: test.maxAttempts };
  }

  async getAttemptResult(topicId: string, attemptId: string, user: AuthUser) {
    const attempt = await this.repository.findAttempt(attemptId, user.id);
    if (!attempt || attempt.test.topicId !== topicId) {
      throw new TestingException('ATTEMPT_NOT_FOUND', 'Attempt not found', 404);
    }

    const threshold = this.config.get<number>('learning.unlockScoreThreshold', 85);
    const score = attempt.score ? Number(attempt.score) : null;

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score,
      maxScore: attempt.maxScore,
      passed: score !== null && score >= threshold,
      unlockThreshold: threshold,
      submittedAt: attempt.submittedAt,
      antiCheatFlags: attempt.antiCheatFlags,
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
      })),
    };
  }

  private async applyProgressAndAi(
    attempt: NonNullable<Awaited<ReturnType<TestingRepository['findAttempt']>>>,
    topicId: string,
    studentId: string,
    scorePercent: number,
  ) {
    const threshold = this.progressService.unlockThreshold;
    const passed = scorePercent >= threshold;

    if (passed) {
      const { progress, nextTopicUnlocked } = await this.progressService.markTopicPassed(
        studentId,
        topicId,
        scorePercent,
      );
      const aiFeedback = await this.generateAiFeedback(
        attempt.id,
        studentId,
        topicId,
        scorePercent,
        true,
      );
      return {
        score: scorePercent,
        passed: true,
        unlockThreshold: threshold,
        retryRecommended: false,
        nextTopicUnlocked: nextTopicUnlocked
          ? { id: nextTopicUnlocked.id, title: nextTopicUnlocked.title }
          : null,
        progress: this.progressService.mapProgressSummary(progress, threshold),
        aiFeedback,
        message: 'Great job! The next topic is now unlocked.',
      };
    }

    const progress = await this.progressService.markTopicRetry(studentId, topicId, scorePercent);
    const aiFeedback = await this.generateAiFeedback(
      attempt.id,
      studentId,
      topicId,
      scorePercent,
      false,
    );

    return {
      score: scorePercent,
      passed: false,
      unlockThreshold: threshold,
      retryRecommended: true,
      nextTopicUnlocked: null,
      progress: this.progressService.mapProgressSummary(progress, threshold),
      aiFeedback,
      message: `Score ${scorePercent}% is below ${threshold}%. Review and try again.`,
    };
  }

  private async generateAiFeedback(
    attemptId: string,
    studentId: string,
    topicId: string,
    scorePercent: number,
    passed: boolean,
  ) {
    if (!this.aiService.isEnabled()) {
      return null;
    }
    try {
      const attempt = await this.aiRepository.findTestAttempt(attemptId, studentId);
      if (!attempt) return null;

      const threshold = this.progressService.unlockThreshold;
      const input = this.aiService.buildAnalyzeInputFromAttempt(
        attempt,
        scorePercent,
        threshold,
        passed,
      );
      const assessment = await this.aiService.analyzeTest(input);
      const saved = await this.aiService.saveTestFeedback({
        studentId,
        topicId,
        assessment,
        attemptId,
      });
      return { assessment, feedback: saved };
    } catch {
      return null;
    }
  }

  private async submitTimedOut(
    attempt: NonNullable<Awaited<ReturnType<TestingRepository['findAttempt']>>>,
    topicId: string,
    studentId: string,
  ) {
    const questions = attempt.test.questions;
    const answers = attempt.answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
    }));

    const graded = this.scoring.gradeAttemptAnswers(questions, answers);
    const antiCheat = this.anticheat.buildFlags(attempt.tabBlurCount, attempt.pasteCount);

    await this.repository.updateAttempt(attempt.id, {
      score: graded.scorePercent,
      maxScore: graded.maxPoints,
      status: TestAttemptStatus.TIMED_OUT,
      submittedAt: new Date(),
      antiCheatFlags: antiCheat as object,
    });

    const progress = await this.progressService.markTopicRetry(
      studentId,
      topicId,
      graded.scorePercent,
    );
    const threshold = this.progressService.unlockThreshold;
    const aiFeedback = await this.generateAiFeedback(
      attempt.id,
      studentId,
      topicId,
      graded.scorePercent,
      false,
    );

    return {
      score: graded.scorePercent,
      earnedPoints: graded.earnedPoints,
      maxPoints: graded.maxPoints,
      passed: false,
      timedOut: true,
      unlockThreshold: threshold,
      retryRecommended: true,
      progress: this.progressService.mapProgressSummary(progress, threshold),
      aiFeedback,
      antiCheat,
      message: 'Time is up. Your partial answers were scored.',
    };
  }

  private async expireIfNeeded(
    attempt: NonNullable<Awaited<ReturnType<TestingRepository['findAttempt']>>>,
  ) {
    if (!this.timer.isExpired(attempt.expiresAt)) {
      return;
    }
    await this.repository.updateAttempt(attempt.id, {
      status: TestAttemptStatus.TIMED_OUT,
      submittedAt: new Date(),
    });
    throw new TestingException(
      'ATTEMPT_EXPIRED',
      'Time is up. Submit to see your result or start a new attempt.',
      410,
    );
  }

  private async assertActiveAttempt(attemptId: string, studentId: string, topicId: string) {
    const attempt = await this.repository.findAttempt(attemptId, studentId);
    if (!attempt || attempt.test.topicId !== topicId) {
      throw new TestingException('ATTEMPT_NOT_FOUND', 'Attempt not found', 404);
    }
    if (attempt.status !== TestAttemptStatus.IN_PROGRESS) {
      throw new TestingException('ATTEMPT_NOT_ACTIVE', 'Test attempt is not active');
    }
    return attempt;
  }

  private assertPrerequisites(progress: {
    theoryCompleted: boolean;
    videoCompleted: boolean;
    practiceACompleted: boolean;
    practiceBCompleted: boolean;
    practiceCCompleted: boolean;
  }) {
    if (
      !progress.theoryCompleted ||
      !progress.videoCompleted ||
      !progress.practiceACompleted ||
      !progress.practiceBCompleted ||
      !progress.practiceCCompleted
    ) {
      throw new StudentStepOrderException('Complete all learning steps before the test');
    }
  }

  private mapSession(
    attempt: NonNullable<Awaited<ReturnType<TestingRepository['findAttempt']>>>,
    resumed: boolean,
  ) {
    const test = attempt.test;
    const savedAnswers = attempt.answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
      savedAt: a.updatedAt,
    }));

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      testId: test.id,
      topicId: test.topicId,
      clientSessionId: attempt.clientSessionId,
      resumed,
      questionCount: test.questions.length,
      maxScore: attempt.maxScore,
      questions: test.questions.map(mapQuestionForStudent),
      savedAnswers,
      progress: this.buildAnswerProgress(attempt),
      timer: this.buildTimer(attempt),
      config: {
        maxAttempts: test.maxAttempts,
        questionCount: test.questionCount,
        choicesPerQuestion: test.choicesPerQuestion,
        timeLimitMinutes: test.timeLimitMinutes,
        passingScore: test.passingScore,
      },
    };
  }

  private buildAnswerProgress(
    attempt: NonNullable<Awaited<ReturnType<TestingRepository['findAttempt']>>>,
  ) {
    const total = attempt.test.questions.length;
    const answered = attempt.answers.length;
    return {
      answered,
      total,
      percent: total > 0 ? Math.round((answered / total) * 100) : 0,
      autosavedAt: attempt.autosavedAt,
    };
  }

  private buildTimer(
    attempt: NonNullable<Awaited<ReturnType<TestingRepository['findAttempt']>>>,
  ) {
    return {
      expiresAt: attempt.expiresAt,
      remainingSeconds: this.timer.getRemainingSeconds(attempt.expiresAt),
      expired: this.timer.isExpired(attempt.expiresAt),
    };
  }
}
