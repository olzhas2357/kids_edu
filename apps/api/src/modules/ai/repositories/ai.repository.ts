import { Injectable } from '@nestjs/common';
import { AIChatRole, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  createChatLog(data: {
    studentId: string;
    topicId?: string;
    sessionId: string;
    role: AIChatRole;
    content: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.aIChatLog.create({ data });
  }

  createChatLogs(
    logs: Array<{
      studentId: string;
      topicId?: string;
      sessionId: string;
      role: AIChatRole;
      content: string;
      metadata?: Prisma.InputJsonValue;
    }>,
  ) {
    return this.prisma.aIChatLog.createMany({ data: logs });
  }

  findRecentChatLogs(studentId: string, sessionId: string, limit = 10) {
    return this.prisma.aIChatLog.findMany({
      where: { studentId, sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  createFeedback(data: Prisma.AIFeedbackCreateInput) {
    return this.prisma.aIFeedback.create({ data });
  }

  findLatestFeedback(studentId: string, topicId: string) {
    return this.prisma.aIFeedback.findFirst({
      where: { studentId, topicId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findTopicForStudent(topicId: string) {
    return this.prisma.topic.findFirst({
      where: { id: topicId, course: { isPublished: true } },
      include: { course: { select: { title: true } } },
    });
  }

  findPracticeTask(practiceTaskId: string, topicId: string) {
    return this.prisma.practiceTask.findFirst({
      where: { id: practiceTaskId, topicId },
    });
  }

  findTestAttempt(attemptId: string, studentId: string) {
    return this.prisma.studentTestAttempt.findFirst({
      where: { id: attemptId, studentId },
      include: {
        test: {
          include: {
            topic: { include: { course: { select: { title: true } } } },
            questions: { orderBy: { orderIndex: 'asc' } },
          },
        },
        answers: true,
      },
    });
  }
}
