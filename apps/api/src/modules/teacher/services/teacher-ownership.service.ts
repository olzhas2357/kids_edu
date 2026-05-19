import { Injectable } from '@nestjs/common';
import {
  TeacherForbiddenException,
  TeacherNotFoundException,
} from '../exceptions/teacher.exception';
import { TeacherRepository } from '../repositories/teacher.repository';

@Injectable()
export class TeacherOwnershipService {
  constructor(private readonly repository: TeacherRepository) {}

  async assertCourseOwnership(courseId: string, teacherId: string) {
    const course = await this.repository.findCourseById(courseId);
    if (!course) {
      throw new TeacherNotFoundException('Course');
    }
    if (course.teacherId !== teacherId) {
      throw new TeacherForbiddenException('You do not own this course');
    }
    return course;
  }

  async assertTopicOwnership(topicId: string, teacherId: string) {
    const topic = await this.repository.findTopicWithCourse(topicId);
    if (!topic) {
      throw new TeacherNotFoundException('Topic');
    }
    if (topic.course.teacherId !== teacherId) {
      throw new TeacherForbiddenException('You do not own this topic');
    }
    return topic;
  }
}
