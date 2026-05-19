import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { CreateTopicDto, UpdateTopicDto } from '../dto';
import { TeacherCourseGuard } from '../guards/teacher-course.guard';
import { TeacherTopicGuard } from '../guards/teacher-topic.guard';
import { TeacherTopicsService } from '../services/teacher-topics.service';

@ApiTags('teacher')
@ApiBearerAuth()
@Roles(Role.TEACHER, Role.ADMIN)
@Controller('teacher')
export class TeacherTopicsController {
  constructor(private readonly topicsService: TeacherTopicsService) {}

  @Get('courses')
  @ApiOperation({ summary: 'List courses for teacher dashboard' })
  listCourses(@CurrentUser() user: AuthUser) {
    return this.topicsService.listCourses(user);
  }

  @Get('courses/:courseId/topics')
  @UseGuards(TeacherCourseGuard)
  @ApiOperation({ summary: 'List topics in a course' })
  listTopics(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.listTopics(courseId, user);
  }

  @Post('courses/:courseId/topics')
  @UseGuards(TeacherCourseGuard)
  @ApiOperation({ summary: 'Create a topic' })
  createTopic(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateTopicDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.createTopic(courseId, dto, user);
  }

  @Get('topics/:topicId')
  @UseGuards(TeacherTopicGuard)
  @ApiOperation({ summary: 'Get topic with theory, videos, practice tasks, and test' })
  getTopic(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.getTopic(topicId, user);
  }

  @Patch('topics/:topicId')
  @UseGuards(TeacherTopicGuard)
  @ApiOperation({ summary: 'Update a topic' })
  updateTopic(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.updateTopic(topicId, dto, user);
  }

  @Delete('topics/:topicId')
  @UseGuards(TeacherTopicGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a topic and all related content' })
  deleteTopic(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.deleteTopic(topicId, user);
  }
}
