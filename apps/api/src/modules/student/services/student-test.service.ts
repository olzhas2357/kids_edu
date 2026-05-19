import { Injectable } from '@nestjs/common';
import { TestAttemptStatus } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { SubmitAnswerDto } from '../dto';
import {
  StudentLearningConflictException,
  StudentNotFoundException,
  StudentStepOrderException,
} from '../exceptions/student-learning.exception';
import { StudentLearningRepository } from '../repositories/student-learning.repository';
import { StudentProgressService } from './student-progress.service';
import { StudentScoringService } from './student-scoring.service';

@Injectable()
export class StudentTestService {
  constructor(
    private readonly repository: StudentLearningRepository,
    private readonly progressService: StudentProgressService,
    private readonly scoringService: StudentScoringService,
  ) {}

  async startTest(topicId: string, user: AuthUser) {
    const { topic, progress } = await this.progressService.assertTopicUnlocked(
      topicId,
      user.id,
    );

    if (
      !progress.theoryCompleted ||
      !progress.videoCompleted ||
      !progress.practiceACompleted ||
      !progress.practiceBCompleted ||
      !progress.practiceCCompleted
    ) {
      throw new StudentStepOrderException('Complete all learning steps before the test');
    }

    const test = topic.tests[0];
    if (!test) {
      throw new StudentNotFoundException('Test');
    }

    const existing = await this.repository.findActiveAttempt(user.id, test.id);
    if (existing) {
      return {
        attemptId: existing.id,
        attemptNumber: existing.attemptNumber,
        testId: test.id,
        questionCount: test.questions.length,
        resumed: true,
      };
    }

    const maxScore = test.questions.reduce((sum, q) => sum + q.points, 0);
    const attemptNumber = await this.repository.getNextAttemptNumber(user.id, test.id);

    const attempt = await this.repository.createAttempt({
      studentId: user.id,
      testId: test.id,
      attemptNumber,
      maxScore,
    });

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      testId: test.id,
      questionCount: test.questions.length,
      maxScore,
      resumed: false,
    };
  }

  async submitAnswer(
    topicId: string,
    attemptId: string,
    questionId: string,
    dto: SubmitAnswerDto,
    user: AuthUser,
  ) {
    await this.progressService.assertTopicUnlocked(topicId, user.id);

    const attempt = await this.repository.findAttempt(attemptId, user.id);
    if (!attempt || attempt.status !== TestAttemptStatus.IN_PROGRESS) {
      throw new StudentNotFoundException('Test attempt');
    }

    if (attempt.test.topicId !== topicId) {
      throw new StudentNotFoundException('Test attempt');
    }

    const question = attempt.test.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new StudentNotFoundException('Question');
    }

    const grade = this.scoringService.gradeAnswer(
      question.type,
      question.correctAnswer,
      dto.answer,
      question.points,
    );

    const answer = await this.repository.upsertAnswer({
      attemptId,
      questionId,
      studentId: user.id,
      answer: dto.answer as object,
      isCorrect: grade.isCorrect,
      pointsEarned: grade.pointsEarned,
    });

    return {
      questionId,
      isCorrect: grade.isCorrect,
      pointsEarned: grade.pointsEarned,
      saved: true,
      answerId: answer.id,
    };
  }

  async submitTest(topicId: string, attemptId: string, user: AuthUser) {
    await this.progressService.assertTopicUnlocked(topicId, user.id);

    const attempt = await this.repository.findAttempt(attemptId, user.id);
    if (!attempt || attempt.status !== TestAttemptStatus.IN_PROGRESS) {
      throw new StudentNotFoundException('Test attempt');
    }

    if (attempt.test.questions.length === 0) {
      throw new StudentLearningConflictException('Test has no questions');
    }

    const answeredIds = new Set(attempt.answers.map((a) => a.questionId));
    const unanswered = attempt.test.questions.filter((q) => !answeredIds.has(q.id));
    if (unanswered.length > 0) {
      throw new StudentLearningConflictException(
        `Answer all questions before submitting (${unanswered.length} remaining)`,
      );
    }

    const earnedPoints = attempt.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const maxPoints = attempt.test.questions.reduce((sum, q) => sum + q.points, 0);
    const scorePercent = this.scoringService.calculateTestScore(earnedPoints, maxPoints);

    await this.repository.gradeAttempt(
      attemptId,
      scorePercent,
      maxPoints,
      TestAttemptStatus.GRADED,
    );

    const threshold = this.progressService.unlockThreshold;
    const passed = scorePercent >= threshold;

    if (passed) {
      const { progress, nextTopicUnlocked } = await this.progressService.markTopicPassed(
        user.id,
        topicId,
        scorePercent,
      );
      return {
        score: scorePercent,
        earnedPoints,
        maxPoints,
        passed: true,
        unlockThreshold: threshold,
        retryRecommended: false,
        nextTopicUnlocked: nextTopicUnlocked
          ? { id: nextTopicUnlocked.id, title: nextTopicUnlocked.title }
          : null,
        progress: this.progressService.mapProgressSummary(progress, threshold),
        message: 'Great job! The next topic is now unlocked.',
      };
    }

    const progress = await this.progressService.markTopicRetry(
      user.id,
      topicId,
      scorePercent,
    );

    return {
      score: scorePercent,
      earnedPoints,
      maxPoints,
      passed: false,
      unlockThreshold: threshold,
      retryRecommended: true,
      nextTopicUnlocked: null,
      progress: this.progressService.mapProgressSummary(progress, threshold),
      message: `Score ${scorePercent}% is below ${threshold}%. Review the material and try again.`,
    };
  }
}
