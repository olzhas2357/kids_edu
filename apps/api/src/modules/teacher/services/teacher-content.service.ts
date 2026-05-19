import { Injectable } from '@nestjs/common';
import { PracticeTaskLevel, Role } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import {
  CreateVideoDto,
  CreateTestDto,
  CreateTestQuestionDto,
  UpdateTestDto,
  UpdateTestQuestionDto,
  UpdateTheoryDto,
  UpdateVideoDto,
  UpsertPracticeTaskDto,
  UpsertTheoryDto,
} from '../dto';
import {
  TeacherConflictException,
  TeacherNotFoundException,
} from '../exceptions/teacher.exception';
import { TeacherRepository } from '../repositories/teacher.repository';
import { TeacherOwnershipService } from './teacher-ownership.service';

@Injectable()
export class TeacherContentService {
  constructor(
    private readonly repository: TeacherRepository,
    private readonly ownership: TeacherOwnershipService,
  ) {}

  // ─── Theory ─────────────────────────────────────────────────────────────────

  async upsertTheory(topicId: string, dto: UpsertTheoryDto, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    return this.repository.upsertTheory(topicId, dto);
  }

  async updateTheory(topicId: string, dto: UpdateTheoryDto, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    try {
      return await this.repository.updateTheory(topicId, dto);
    } catch {
      throw new TeacherNotFoundException('Theory content');
    }
  }

  async deleteTheory(topicId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    try {
      await this.repository.deleteTheory(topicId);
      return { deleted: true };
    } catch {
      throw new TeacherNotFoundException('Theory content');
    }
  }

  // ─── Videos ─────────────────────────────────────────────────────────────────

  async addVideo(topicId: string, dto: CreateVideoDto, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    return this.repository.createVideo({
      title: dto.title,
      url: dto.url,
      thumbnailUrl: dto.thumbnailUrl,
      durationSeconds: dto.durationSeconds,
      orderIndex: dto.orderIndex ?? 0,
      topic: { connect: { id: topicId } },
    });
  }

  async updateVideo(
    topicId: string,
    videoId: string,
    dto: UpdateVideoDto,
    user: AuthUser,
  ) {
    await this.ensureTopicAccess(topicId, user);
    const video = await this.repository.findVideo(topicId, videoId);
    if (!video) {
      throw new TeacherNotFoundException('Video');
    }
    return this.repository.updateVideo(videoId, dto);
  }

  async deleteVideo(topicId: string, videoId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    const video = await this.repository.findVideo(topicId, videoId);
    if (!video) {
      throw new TeacherNotFoundException('Video');
    }
    await this.repository.deleteVideo(videoId);
    return { deleted: true };
  }

  // ─── Practice (A / B / C) ───────────────────────────────────────────────────

  async upsertPracticeTask(
    topicId: string,
    level: PracticeTaskLevel,
    dto: UpsertPracticeTaskDto,
    user: AuthUser,
  ) {
    await this.ensureTopicAccess(topicId, user);
    return this.repository.upsertPracticeTask(topicId, level, {
      title: dto.title,
      prompt: dto.prompt,
      linkUrl: dto.linkUrl ?? null,
    });
  }

  async deletePracticeTask(topicId: string, level: PracticeTaskLevel, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    try {
      await this.repository.deletePracticeTask(topicId, level);
      return { deleted: true };
    } catch {
      throw new TeacherNotFoundException('Practice task');
    }
  }

  // ─── Final test ─────────────────────────────────────────────────────────────

  async getFinalTest(topicId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TeacherNotFoundException('Test');
    }
    return test;
  }

  async createFinalTest(topicId: string, dto: CreateTestDto, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);

    const existing = await this.repository.findTestByTopic(topicId);
    if (existing) {
      throw new TeacherConflictException(
        'Topic already has a final test. Use PATCH to update it.',
      );
    }

    return this.repository.createTest({
      title: dto.title,
      description: dto.description,
      passingScore: dto.passingScore ?? 70,
      timeLimitMinutes: dto.timeLimitMinutes,
      topic: { connect: { id: topicId } },
      questions: dto.questions?.length
        ? {
            create: dto.questions.map((q, index) => this.mapQuestionCreate(q, index)),
          }
        : undefined,
    });
  }

  async updateFinalTest(topicId: string, dto: UpdateTestDto, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TeacherNotFoundException('Test');
    }
    return this.repository.updateTest(test.id, {
      title: dto.title,
      description: dto.description,
      passingScore: dto.passingScore,
      timeLimitMinutes: dto.timeLimitMinutes,
    });
  }

  async deleteFinalTest(topicId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TeacherNotFoundException('Test');
    }
    await this.repository.deleteTest(test.id);
    return { deleted: true };
  }

  async addTestQuestion(
    topicId: string,
    dto: CreateTestQuestionDto,
    user: AuthUser,
  ) {
    await this.ensureTopicAccess(topicId, user);
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TeacherNotFoundException('Test');
    }
    return this.repository.createTestQuestion({
      test: { connect: { id: test.id } },
      ...this.mapQuestionCreate(dto, dto.orderIndex ?? test.questions.length),
    });
  }

  async updateTestQuestion(
    topicId: string,
    questionId: string,
    dto: UpdateTestQuestionDto,
    user: AuthUser,
  ) {
    await this.ensureTopicAccess(topicId, user);
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TeacherNotFoundException('Test');
    }
    const question = await this.repository.findTestQuestion(test.id, questionId);
    if (!question) {
      throw new TeacherNotFoundException('Question');
    }
    return this.repository.updateTestQuestion(questionId, {
      questionText: dto.questionText,
      type: dto.type,
      options: dto.options,
      correctAnswer: dto.correctAnswer,
      explanation: dto.explanation,
      points: dto.points,
      orderIndex: dto.orderIndex,
    });
  }

  async deleteTestQuestion(topicId: string, questionId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    const test = await this.repository.findTestByTopic(topicId);
    if (!test) {
      throw new TeacherNotFoundException('Test');
    }
    const question = await this.repository.findTestQuestion(test.id, questionId);
    if (!question) {
      throw new TeacherNotFoundException('Question');
    }
    await this.repository.deleteTestQuestion(questionId);
    return { deleted: true };
  }

  private mapQuestionCreate(q: CreateTestQuestionDto, orderIndex: number) {
    return {
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points ?? 1,
      orderIndex,
    };
  }

  private async ensureTopicAccess(topicId: string, user: AuthUser) {
    if (user.role === Role.ADMIN) {
      const topic = await this.repository.findTopicWithCourse(topicId);
      if (!topic) {
        throw new TeacherNotFoundException('Topic');
      }
      return topic;
    }
    return this.ownership.assertTopicOwnership(topicId, user.id);
  }
}
