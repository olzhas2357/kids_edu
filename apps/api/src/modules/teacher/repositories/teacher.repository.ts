import { Injectable } from '@nestjs/common';
import { PracticeTaskLevel, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

const topicInclude = {
  theoryContent: true,
  videos: { orderBy: { orderIndex: 'asc' as const } },
  practiceTasks: { orderBy: { orderIndex: 'asc' as const } },
  tests: {
    include: {
      questions: { orderBy: { orderIndex: 'asc' as const } },
    },
  },
} satisfies Prisma.TopicInclude;

@Injectable()
export class TeacherRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCourseById(courseId: string) {
    return this.prisma.course.findUnique({ where: { id: courseId } });
  }

  findCoursesByTeacher(teacherId: string) {
    return this.prisma.course.findMany({
      where: { teacherId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { topics: true } },
      },
    });
  }

  findAllCourses() {
    return this.prisma.course.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { topics: true } },
      },
    });
  }

  findTopicsByCourse(courseId: string) {
    return this.prisma.topic.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        theoryContent: { select: { id: true, title: true } },
        _count: { select: { videos: true, practiceTasks: true, tests: true } },
      },
    });
  }

  findTopicById(topicId: string) {
    return this.prisma.topic.findUnique({
      where: { id: topicId },
      include: topicInclude,
    });
  }

  findTopicWithCourse(topicId: string) {
    return this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { course: true },
    });
  }

  getNextTopicOrderIndex(courseId: string) {
    return this.prisma.topic
      .aggregate({
        where: { courseId },
        _max: { orderIndex: true },
      })
      .then((r) => (r._max.orderIndex ?? -1) + 1);
  }

  createTopic(data: Prisma.TopicCreateInput) {
    return this.prisma.topic.create({
      data,
      include: topicInclude,
    });
  }

  updateTopic(topicId: string, data: Prisma.TopicUpdateInput) {
    return this.prisma.topic.update({
      where: { id: topicId },
      data,
      include: topicInclude,
    });
  }

  deleteTopic(topicId: string) {
    return this.prisma.topic.delete({ where: { id: topicId } });
  }

  upsertTheory(topicId: string, data: { title: string; content: string }) {
    return this.prisma.theoryContent.upsert({
      where: { topicId },
      create: { topicId, ...data },
      update: data,
    });
  }

  updateTheory(topicId: string, data: Prisma.TheoryContentUpdateInput) {
    return this.prisma.theoryContent.update({
      where: { topicId },
      data,
    });
  }

  deleteTheory(topicId: string) {
    return this.prisma.theoryContent.delete({ where: { topicId } });
  }

  createVideo(data: Prisma.VideoCreateInput) {
    return this.prisma.video.create({ data });
  }

  findVideo(topicId: string, videoId: string) {
    return this.prisma.video.findFirst({
      where: { id: videoId, topicId },
    });
  }

  updateVideo(videoId: string, data: Prisma.VideoUpdateInput) {
    return this.prisma.video.update({ where: { id: videoId }, data });
  }

  deleteVideo(videoId: string) {
    return this.prisma.video.delete({ where: { id: videoId } });
  }

  upsertPracticeTask(
    topicId: string,
    level: PracticeTaskLevel,
    data: { title: string; prompt: string; linkUrl?: string | null },
  ) {
    const orderMap: Record<PracticeTaskLevel, number> = {
      [PracticeTaskLevel.A]: 0,
      [PracticeTaskLevel.B]: 1,
      [PracticeTaskLevel.C]: 2,
    };
    return this.prisma.practiceTask.upsert({
      where: { topicId_level: { topicId, level } },
      create: {
        topicId,
        level,
        orderIndex: orderMap[level],
        ...data,
      },
      update: data,
    });
  }

  deletePracticeTask(topicId: string, level: PracticeTaskLevel) {
    return this.prisma.practiceTask.delete({
      where: { topicId_level: { topicId, level } },
    });
  }

  findTestByTopic(topicId: string) {
    return this.prisma.test.findFirst({
      where: { topicId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  findTestById(testId: string) {
    return this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { orderIndex: 'asc' } }, topic: true },
    });
  }

  createTest(data: Prisma.TestCreateInput) {
    return this.prisma.test.create({
      data,
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  updateTest(testId: string, data: Prisma.TestUpdateInput) {
    return this.prisma.test.update({
      where: { id: testId },
      data,
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  deleteTest(testId: string) {
    return this.prisma.test.delete({ where: { id: testId } });
  }

  createTestQuestion(data: Prisma.TestQuestionCreateInput) {
    return this.prisma.testQuestion.create({ data });
  }

  findTestQuestion(testId: string, questionId: string) {
    return this.prisma.testQuestion.findFirst({
      where: { id: questionId, testId },
    });
  }

  updateTestQuestion(questionId: string, data: Prisma.TestQuestionUpdateInput) {
    return this.prisma.testQuestion.update({ where: { id: questionId }, data });
  }

  deleteTestQuestion(questionId: string) {
    return this.prisma.testQuestion.delete({ where: { id: questionId } });
  }
}
