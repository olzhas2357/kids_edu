import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { StudentLearningService } from '../services/student-learning.service';
import { StudentProgressService } from '../services/student-progress.service';

@ApiTags('student')
@ApiBearerAuth()
@Roles(Role.STUDENT, Role.ADMIN)
@Controller('student')
export class StudentCoursesController {
  constructor(
    private readonly learningService: StudentLearningService,
    private readonly progressService: StudentProgressService,
  ) {}

  @Get('courses')
  @ApiOperation({ summary: 'List published courses' })
  listCourses() {
    return this.learningService.listCourses();
  }

  @Get('courses/:courseId/topics')
  @ApiOperation({ summary: 'List course topics with lock status and progress' })
  listTopics(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.listCourseTopics(courseId, user);
  }

  @Post('courses/:courseId/enroll')
  @ApiOperation({ summary: 'Initialize progress records for a course' })
  enroll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.progressService.initializeCourseProgress(user.id, courseId);
  }
}
