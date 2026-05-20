import { Injectable } from '@nestjs/common';
import { Prisma, TestAttemptStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

const attemptWithTestInclude = {
  test: {
    include: {
      questions: { orderBy: { orderIndex: 'asc' as const } },
      topic: { select: { id: true, title: true, courseId: true } },
    },
  },
  answers: { orderBy: { updatedAt: 'asc' as const } },
} satisfies Prisma.StudentTestAttemptInclude;

@Injectable()
export class TestingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTestByTopic(topicId: string) {
    return this.prisma.test.findFirst({
      where: { topicId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  findActiveAttempt(studentId: string, testId: string) {
    return this.prisma.studentTestAttempt.findFirst({
      where: { studentId, testId, status: TestAttemptStatus.IN_PROGRESS },
      orderBy: { createdAt: 'desc' },
      include: attemptWithTestInclude,
    });
  }

  countGradedAttempts(studentId: string, testId: string) {
    return this.prisma.studentTestAttempt.count({
      where: {
        studentId,
        testId,
        status: { in: [TestAttemptStatus.GRADED, TestAttemptStatus.TIMED_OUT] },
      },
    });
  }

  getNextAttemptNumber(studentId: string, testId: string) {
    return this.prisma.studentTestAttempt
      .aggregate({
        where: { studentId, testId },
        _max: { attemptNumber: true },
      })
      .then((r) => (r._max.attemptNumber ?? 0) + 1);
  }

  createAttempt(data: {
    studentId: string;
    testId: string;
    attemptNumber: number;
    maxScore: number;
    expiresAt: Date | null;
    clientSessionId: string;
    ipHash: string | null;
  }) {
    return this.prisma.studentTestAttempt.create({
      data: {
        studentId: data.studentId,
        testId: data.testId,
        attemptNumber: data.attemptNumber,
        maxScore: data.maxScore,
        status: TestAttemptStatus.IN_PROGRESS,
        expiresAt: data.expiresAt,
        clientSessionId: data.clientSessionId,
        ipHash: data.ipHash,
      },
      include: attemptWithTestInclude,
    });
  }

  findAttempt(attemptId: string, studentId: string) {
    return this.prisma.studentTestAttempt.findFirst({
      where: { id: attemptId, studentId },
      include: attemptWithTestInclude,
    });
  }

  updateAttempt(attemptId: string, data: Prisma.StudentTestAttemptUpdateInput) {
    return this.prisma.studentTestAttempt.update({
      where: { id: attemptId },
      data,
      include: attemptWithTestInclude,
    });
  }

  upsertAnswer(data: {
    attemptId: string;
    questionId: string;
    studentId: string;
    answer: Prisma.InputJsonValue;
    isCorrect: boolean | null;
    pointsEarned: number;
  }) {
    return this.prisma.studentAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      create: {
        ...data,
        isCorrect: data.isCorrect ?? undefined,
      },
      update: {
        answer: data.answer,
        isCorrect: data.isCorrect ?? undefined,
        pointsEarned: data.pointsEarned,
      },
    });
  }

  findAttemptHistory(studentId: string, testId: string, limit = 20) {
    return this.prisma.studentTestAttempt.findMany({
      where: {
        studentId,
        testId,
        status: {
          in: [
            TestAttemptStatus.GRADED,
            TestAttemptStatus.TIMED_OUT,
            TestAttemptStatus.SUBMITTED,
          ],
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      include: {
        answers: { select: { id: true, questionId: true, isCorrect: true, pointsEarned: true } },
      },
    });
  }

  findAnswersByAttempt(attemptId: string) {
    return this.prisma.studentAnswer.findMany({
      where: { attemptId },
    });
  }
}
