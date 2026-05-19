import { Module } from '@nestjs/common';
import { TeacherContentController } from './controllers/teacher-content.controller';
import { TeacherTopicsController } from './controllers/teacher-topics.controller';
import { TeacherCourseGuard } from './guards/teacher-course.guard';
import { TeacherTopicGuard } from './guards/teacher-topic.guard';
import { TeacherRepository } from './repositories/teacher.repository';
import { TeacherContentService } from './services/teacher-content.service';
import { TeacherOwnershipService } from './services/teacher-ownership.service';
import { TeacherTopicsService } from './services/teacher-topics.service';

@Module({
  controllers: [TeacherTopicsController, TeacherContentController],
  providers: [
    TeacherRepository,
    TeacherOwnershipService,
    TeacherTopicsService,
    TeacherContentService,
    TeacherCourseGuard,
    TeacherTopicGuard,
  ],
  exports: [TeacherTopicsService, TeacherContentService],
})
export class TeacherModule {}
