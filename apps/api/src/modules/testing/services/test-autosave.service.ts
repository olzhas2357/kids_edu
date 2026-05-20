import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { TestingRepository } from '../repositories/testing.repository';
import {
  normalizeOptions,
  validateAnswerAgainstOptions,
} from '../validators/mc-question.validator';
import { TestScoringService } from './test-scoring.service';

@Injectable()
export class TestAutosaveService {
  constructor(
    private readonly repository: TestingRepository,
    private readonly scoring: TestScoringService,
  ) {}

  async saveAnswer(params: {
    attemptId: string;
    questionId: string;
    studentId: string;
    answer: unknown;
    question: {
      type: QuestionType;
      options: unknown;
      correctAnswer: unknown;
      points: number;
    };
    /** When false, grade but do not reveal correctness to client */
    revealGrade?: boolean;
  }) {
    const options = normalizeOptions(params.question.options);
    validateAnswerAgainstOptions(params.answer, options, params.question.type);

    const grade = this.scoring.gradeAnswer(
      params.question.type,
      params.question.correctAnswer,
      params.answer,
      params.question.points,
    );

    const saved = await this.repository.upsertAnswer({
      attemptId: params.attemptId,
      questionId: params.questionId,
      studentId: params.studentId,
      answer: params.answer as Prisma.InputJsonValue,
      isCorrect: grade.isCorrect,
      pointsEarned: grade.pointsEarned,
    });

    await this.repository.updateAttempt(params.attemptId, {
      autosavedAt: new Date(),
    });

    return {
      questionId: params.questionId,
      answerId: saved.id,
      saved: true,
      autosavedAt: new Date().toISOString(),
      ...(params.revealGrade
        ? { isCorrect: grade.isCorrect, pointsEarned: grade.pointsEarned }
        : {}),
    };
  }

  async saveBatch(params: {
    attemptId: string;
    studentId: string;
    answers: Array<{ questionId: string; answer: unknown }>;
    questionsById: Map<
      string,
      { type: QuestionType; options: unknown; correctAnswer: unknown; points: number }
    >;
  }) {
    const results = [];
    for (const item of params.answers) {
      const question = params.questionsById.get(item.questionId);
      if (!question) continue;
      const result = await this.saveAnswer({
        attemptId: params.attemptId,
        questionId: item.questionId,
        studentId: params.studentId,
        answer: item.answer,
        question,
        revealGrade: false,
      });
      results.push(result);
    }
    return { savedCount: results.length, answers: results };
  }
}
