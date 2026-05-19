import {
  Body,
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
import { SubmitAnswerDto } from '../dto';
import { StudentTopicAccessGuard } from '../guards/student-topic-access.guard';
import { StudentLearningService } from '../services/student-learning.service';
import { StudentTestService } from '../services/student-test.service';

@ApiTags('student')
@ApiBearerAuth()
@Roles(Role.STUDENT, Role.ADMIN)
@Controller('student/topics/:topicId')
export class StudentLearningController {
  constructor(
    private readonly learningService: StudentLearningService,
    private readonly testService: StudentTestService,
  ) {}

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

  // ─── Test flow ──────────────────────────────────────────────────────────────

  @Post('test/start')
  @UseGuards(StudentTopicAccessGuard)
  @ApiOperation({ summary: 'Start a new test attempt' })
  startTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.testService.startTest(topicId, user);
  }

  @Post('test/attempts/:attemptId/answers/:questionId')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit answer for a question' })
  submitAnswer(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.testService.submitAnswer(topicId, attemptId, questionId, dto, user);
  }

  @Post('test/attempts/:attemptId/submit')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit test — score, unlock next topic if >= 85%, AI feedback',
  })
  submitTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.learningService.submitTestWithFeedback(topicId, attemptId, user);
  }
}
