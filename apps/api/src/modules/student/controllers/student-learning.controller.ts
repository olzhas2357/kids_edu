import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PracticeTaskLevel, Role } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { StudentTopicAccessGuard } from '../guards/student-topic-access.guard';
import { StudentLearningService } from '../services/student-learning.service';

@ApiTags('student')
@ApiBearerAuth()
@Roles(Role.STUDENT, Role.ADMIN)
@Controller('student/topics/:topicId')
export class StudentLearningController {
  constructor(private readonly learningService: StudentLearningService) {}

  @Get()
  @UseGuards(StudentTopicAccessGuard)
  @ApiOperation({ summary: 'Open topic — theory, videos, practice, test (no answers)' })
  openTopic(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.openTopic(topicId, user);
  }

  @Get('result')
  @UseGuards(StudentTopicAccessGuard)
  @ApiOperation({ summary: 'Get learning result and retry recommendation' })
  getResult(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.getTopicResult(topicId, user);
  }

  @Post('retry')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset test for retry (keeps theory/video/practice progress)' })
  retry(@Param('topicId', ParseUUIDPipe) topicId: string, @CurrentUser() user: AuthUser) {
    return this.learningService.retryTopic(topicId, user);
  }

  // ─── Learning steps ─────────────────────────────────────────────────────────

  @Post('steps/theory/complete')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark theory as read' })
  completeTheory(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.completeTheory(topicId, user);
  }

  @Post('steps/video/complete')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark video as watched' })
  completeVideo(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.completeVideo(topicId, user);
  }

  @Post('steps/practice/:level/complete')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark practice level A, B, or C as done' })
  completePractice(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('level', new ParseEnumPipe(PracticeTaskLevel)) level: PracticeTaskLevel,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.completePractice(topicId, level, user);
  }

}
