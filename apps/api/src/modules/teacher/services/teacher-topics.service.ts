import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { CreateTopicDto, UpdateTopicDto } from '../dto';
import { TeacherConflictException, TeacherNotFoundException } from '../exceptions/teacher.exception';
import { TeacherRepository } from '../repositories/teacher.repository';
import { TeacherOwnershipService } from './teacher-ownership.service';

@Injectable()
export class TeacherTopicsService {
  constructor(
    private readonly repository: TeacherRepository,
    private readonly ownership: TeacherOwnershipService,
  ) {}

  async listCourses(user: AuthUser) {
    if (user.role === Role.ADMIN) {
      return this.repository.findAllCourses();
    }
    return this.repository.findCoursesByTeacher(user.id);
  }

  async listTopics(courseId: string, user: AuthUser) {
    await this.ensureCourseAccess(courseId, user);
    return this.repository.findTopicsByCourse(courseId);
  }

  async getTopic(topicId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    const topic = await this.repository.findTopicById(topicId);
    if (!topic) {
      throw new TeacherNotFoundException('Topic');
    }
    return topic;
  }

  async createTopic(courseId: string, dto: CreateTopicDto, user: AuthUser) {
    await this.ensureCourseAccess(courseId, user);

    const orderIndex =
      dto.orderIndex ?? (await this.repository.getNextTopicOrderIndex(courseId));

    const existing = await this.repository.findTopicsByCourse(courseId);
    if (existing.some((t) => t.orderIndex === orderIndex)) {
      throw new TeacherConflictException(
        `Topic with orderIndex ${orderIndex} already exists in this course`,
      );
    }

    return this.repository.createTopic({
      title: dto.title,
      description: dto.description,
      orderIndex,
      isPublished: dto.isPublished ?? false,
      course: { connect: { id: courseId } },
    });
  }

  async updateTopic(topicId: string, dto: UpdateTopicDto, user: AuthUser) {
    const topic = await this.ensureTopicAccess(topicId, user);

    if (dto.orderIndex !== undefined && dto.orderIndex !== topic.orderIndex) {
      const siblings = await this.repository.findTopicsByCourse(topic.courseId);
      if (siblings.some((t) => t.id !== topicId && t.orderIndex === dto.orderIndex)) {
        throw new TeacherConflictException(
          `Topic with orderIndex ${dto.orderIndex} already exists`,
        );
      }
    }

    return this.repository.updateTopic(topicId, {
      title: dto.title,
      description: dto.description,
      orderIndex: dto.orderIndex,
      isPublished: dto.isPublished,
    });
  }

  async deleteTopic(topicId: string, user: AuthUser) {
    await this.ensureTopicAccess(topicId, user);
    await this.repository.deleteTopic(topicId);
    return { deleted: true };
  }

  private async ensureCourseAccess(courseId: string, user: AuthUser) {
    if (user.role === Role.ADMIN) {
      const course = await this.repository.findCourseById(courseId);
      if (!course) {
        throw new TeacherNotFoundException('Course');
      }
      return course;
    }
    return this.ownership.assertCourseOwnership(courseId, user.id);
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
