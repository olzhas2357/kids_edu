import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { StudentScoringService } from '@/modules/student/services/student-scoring.service';

@Injectable()
export class TestScoringService {
  constructor(private readonly studentScoring: StudentScoringService) {}

  gradeAnswer(
    type: QuestionType,
    correctAnswer: unknown,
    studentAnswer: unknown,
    points: number,
  ) {
    return this.studentScoring.gradeAnswer(type, correctAnswer, studentAnswer, points);
  }

  calculatePercent(earnedPoints: number, maxPoints: number): number {
    return this.studentScoring.calculateTestScore(earnedPoints, maxPoints);
  }

  gradeAttemptAnswers(
    questions: Array<{
      id: string;
      type: QuestionType;
      correctAnswer: unknown;
      points: number;
    }>,
    answers: Array<{ questionId: string; answer: unknown }>,
  ) {
    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
    let earned = 0;
    const breakdown: Array<{
      questionId: string;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
    }> = [];

    for (const q of questions) {
      const raw = answerMap.get(q.id);
      const grade = raw !== undefined
        ? this.gradeAnswer(q.type, q.correctAnswer, raw, q.points)
        : { isCorrect: false, pointsEarned: 0, maxPoints: q.points };
      earned += grade.pointsEarned;
      breakdown.push({
        questionId: q.id,
        isCorrect: grade.isCorrect,
        pointsEarned: grade.pointsEarned,
        maxPoints: q.points,
      });
    }

    const maxPoints = questions.reduce((s, q) => s + q.points, 0);
    return {
      earnedPoints: earned,
      maxPoints,
      scorePercent: this.calculatePercent(earned, maxPoints),
      breakdown,
    };
  }
}
