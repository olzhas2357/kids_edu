import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { StudentTopicAccessGuard } from '@/modules/student/guards/student-topic-access.guard';
import {
  AntiCheatEventDto,
  AutosaveAnswersDto,
  SaveAnswerDto,
  StartTestDto,
  SubmitTestDto,
} from '../dto';
import { TestEngineService } from '../services/test-engine.service';

@ApiTags('student-test')
@ApiBearerAuth()
@Roles(Role.STUDENT, Role.ADMIN)
@Controller('student/topics/:topicId/test')
export class TestingController {
  constructor(private readonly engine: TestEngineService) {}

  @Post('start')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start or resume MC test (5 questions, 4 options each)' })
  start(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: StartTestDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    return this.engine.startTest(topicId, user, req, dto.clientSessionId);
  }

  @Get('attempts/:attemptId/session')
  @UseGuards(StudentTopicAccessGuard)
  @ApiOperation({ summary: 'Get test session — questions, saved answers, timer' })
  getSession(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engine.getSession(topicId, attemptId, user);
  }

  @Post('attempts/:attemptId/answers/:questionId')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autosave single answer (progress persisted)' })
  saveAnswer(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: SaveAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engine.saveAnswer(
      topicId,
      attemptId,
      questionId,
      dto.answer,
      user,
      dto.clientSessionId,
    );
  }

  @Post('attempts/:attemptId/autosave')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch autosave answers' })
  autosave(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: AutosaveAnswersDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engine.autosaveBatch(topicId, attemptId, dto.answers, user, dto.clientSessionId);
  }

  @Post('attempts/:attemptId/events')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record anti-cheat event (tab_blur, paste)' })
  recordEvent(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: AntiCheatEventDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engine.recordAntiCheatEvent(
      topicId,
      attemptId,
      dto.event as 'tab_blur' | 'paste' | 'rapid_answer' | 'session_mismatch',
      user,
      dto.clientSessionId,
    );
  }

  @Post('attempts/:attemptId/submit')
  @UseGuards(StudentTopicAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit test — auto score, progress, AI feedback' })
  submit(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: SubmitTestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engine.submitTest(topicId, attemptId, user, dto.clientSessionId, {
      timedOut: dto.timedOut,
    });
  }

  @Get('history')
  @UseGuards(StudentTopicAccessGuard)
  @ApiOperation({ summary: 'Test attempt result history' })
  history(@Param('topicId', ParseUUIDPipe) topicId: string, @CurrentUser() user: AuthUser) {
    return this.engine.getHistory(topicId, user);
  }

  @Get('attempts/:attemptId/result')
  @UseGuards(StudentTopicAccessGuard)
  @ApiOperation({ summary: 'Single attempt result' })
  result(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engine.getAttemptResult(topicId, attemptId, user);
  }
}
