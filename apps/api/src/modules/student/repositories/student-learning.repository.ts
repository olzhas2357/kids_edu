import { Injectable } from '@nestjs/common';
import { Prisma, ProgressStatus, TestAttemptStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

const topicContentInclude = {
  theoryContent: true,
  videos: { orderBy: { orderIndex: 'asc' as const } },
  practiceTasks: { orderBy: { orderIndex: 'asc' as const } },
  tests: {
    take: 1,
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' as const },
        select: {
          id: true,
          questionText: true,
          type: true,
          options: true,
          points: true,
          orderIndex: true,
        },
      },
    },
  },
} satisfies Prisma.TopicInclude;

@Injectable()
export class StudentLearningRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedCourse(courseId: string) {
    return this.prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      include: {
        topics: {
          where: { isPublished: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  findPublishedCourses() {
    return this.prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { title: 'asc' },
      include: { _count: { select: { topics: true } } },
    });
  }

  findPublishedTopic(topicId: string) {
    return this.prisma.topic.findFirst({
      where: { id: topicId, isPublished: true, course: { isPublished: true } },
      include: {
        course: true,
        ...topicContentInclude,
      },
    });
  }

  findPublishedTopicsByCourse(courseId: string) {
    return this.prisma.topic.findMany({
      where: { courseId, isPublished: true, course: { isPublished: true } },
      orderBy: { orderIndex: 'asc' },
    });
  }

  findProgress(studentId: string, topicId: string) {
    return this.prisma.studentProgress.findUnique({
      where: { studentId_topicId: { studentId, topicId } },
    });
  }

  findProgressByCourse(studentId: string, courseId: string) {
    return this.prisma.studentProgress.findMany({
      where: { studentId, courseId },
      orderBy: { topic: { orderIndex: 'asc' } },
      include: { topic: { select: { id: true, title: true, orderIndex: true } } },
    });
  }

  upsertProgress(data: {
    studentId: string;
    courseId: string;
    topicId: string;
    isLocked: boolean;
    orderIndex: number;
  }) {
    return this.prisma.studentProgress.upsert({
      where: { studentId_topicId: { studentId: data.studentId, topicId: data.topicId } },
      create: {
        studentId: data.studentId,
        courseId: data.courseId,
        topicId: data.topicId,
        isLocked: data.isLocked,
        status: ProgressStatus.NOT_STARTED,
      },
      update: {},
    });
  }

  updateProgress(studentId: string, topicId: string, data: Prisma.StudentProgressUpdateInput) {
    return this.prisma.studentProgress.update({
      where: { studentId_topicId: { studentId, topicId } },
      data,
    });
  }

  unlockTopic(studentId: string, topicId: string) {
    return this.prisma.studentProgress.update({
      where: { studentId_topicId: { studentId, topicId } },
      data: { isLocked: false },
    });
  }

  findNextTopic(courseId: string, afterOrderIndex: number) {
    return this.prisma.topic.findFirst({
      where: {
        courseId,
        isPublished: true,
        orderIndex: { gt: afterOrderIndex },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  findTestWithQuestions(testId: string) {
    return this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  findActiveAttempt(studentId: string, testId: string) {
    return this.prisma.studentTestAttempt.findFirst({
      where: { studentId, testId, status: TestAttemptStatus.IN_PROGRESS },
      orderBy: { createdAt: 'desc' },
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
  }) {
    return this.prisma.studentTestAttempt.create({
      data: {
        studentId: data.studentId,
        testId: data.testId,
        attemptNumber: data.attemptNumber,
        maxScore: data.maxScore,
        status: TestAttemptStatus.IN_PROGRESS,
      },
    });
  }

  findAttempt(attemptId: string, studentId: string) {
    return this.prisma.studentTestAttempt.findFirst({
      where: { id: attemptId, studentId },
      include: {
        test: { include: { questions: true, topic: true } },
        answers: true,
      },
    });
  }

  upsertAnswer(data: {
    attemptId: string;
    questionId: string;
    studentId: string;
    answer: Prisma.InputJsonValue;
    isCorrect: boolean;
    pointsEarned: number;
  }) {
    return this.prisma.studentAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      create: data,
      update: {
        answer: data.answer,
        isCorrect: data.isCorrect,
        pointsEarned: data.pointsEarned,
      },
    });
  }

  gradeAttempt(
    attemptId: string,
    score: number,
    maxScore: number,
    status: TestAttemptStatus,
  ) {
    return this.prisma.studentTestAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        maxScore,
        status,
        submittedAt: new Date(),
      },
    });
  }

  createAiFeedback(data: Prisma.AIFeedbackCreateInput) {
    return this.prisma.aIFeedback.create({ data });
  }

  findLatestFeedback(studentId: string, topicId: string) {
    return this.prisma.aIFeedback.findFirst({
      where: { studentId, topicId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
