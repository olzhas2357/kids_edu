import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';

@Injectable()
export class StudentScoringService {
  calculateTestScore(earnedPoints: number, maxPoints: number): number {
    if (maxPoints <= 0) {
      return 0;
    }
    return Math.round((earnedPoints / maxPoints) * 10000) / 100;
  }

  gradeAnswer(
    type: QuestionType,
    correctAnswer: unknown,
    studentAnswer: unknown,
    questionPoints: number,
  ): { isCorrect: boolean; pointsEarned: number; maxPoints: number } {
    const isCorrect = this.isAnswerCorrect(type, correctAnswer, studentAnswer);
    return {
      isCorrect,
      pointsEarned: isCorrect ? questionPoints : 0,
      maxPoints: questionPoints,
    };
  }

  private isAnswerCorrect(
    type: QuestionType,
    correct: unknown,
    student: unknown,
  ): boolean {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.arraysEqual(
          this.normalizeArray(correct),
          this.normalizeArray(student),
        );
      case QuestionType.TRUE_FALSE:
        return this.normalizeBoolean(correct) === this.normalizeBoolean(student);
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.TEXT:
      default:
        return (
          String(correct).trim().toLowerCase() === String(student).trim().toLowerCase()
        );
    }
  }

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return String(value).toLowerCase() === 'true';
  }

  private normalizeArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim().toLowerCase()).sort();
    }
    return [String(value).trim().toLowerCase()];
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((val, idx) => val === b[idx]);
  }
}
