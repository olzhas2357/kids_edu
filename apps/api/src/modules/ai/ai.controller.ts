import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Public, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { ConfigService } from '@nestjs/config';
import { AnalyzeTestDto, AiChatDto, PracticeHintDto } from './dto';
import { AiException } from './exceptions/ai.exception';
import { AiRepository } from './repositories/ai.repository';
import { OpenAiClient } from './openai/openai.client';
import { AiService } from './services/ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Roles(Role.STUDENT, Role.ADMIN)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly repository: AiRepository,
    private readonly config: ConfigService,
    private readonly openAiClient: OpenAiClient,
  ) {}

  @Post('topics/:topicId/test/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze test results — score, level, Socratic feedback (no direct answers)',
  })
  async analyzeTest(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() dto: AnalyzeTestDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!dto.attemptId) {
      throw new AiException('AI_INVALID_RESPONSE', 'attemptId is required');
    }

    const attempt = await this.repository.findTestAttempt(dto.attemptId, user.id);
    if (!attempt || attempt.test.topicId !== topicId) {
      throw new AiException('AI_INVALID_RESPONSE', 'Test attempt not found', 404);
    }

    if (!attempt.score) {
      throw new AiException(
        'AI_INVALID_RESPONSE',
        'Submit the test before requesting AI analysis',
        400,
      );
    }

    const threshold = this.config.get<number>('learning.unlockScoreThreshold', 85);
    const score = Number(attempt.score);
    const passed = score >= threshold;

    const input = this.aiService.buildAnalyzeInputFromAttempt(
      attempt,
      score,
      threshold,
      passed,
    );

    const assessment = await this.aiService.analyzeTest(input);
    const feedback = await this.aiService.saveTestFeedback({
      studentId: user.id,
      topicId,
      assessment,
      attemptId: dto.attemptId,
    });

    return { assessment, feedback };
  }

  @Post('topics/:topicId/practice/:practiceTaskId/hint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Socratic hint for practice task (no direct answer)' })
  async practiceHint(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Param('practiceTaskId', ParseUUIDPipe) practiceTaskId: string,
    @Body() dto: PracticeHintDto,
    @CurrentUser() user: AuthUser,
  ) {
    const topic = await this.repository.findTopicForStudent(topicId);
    if (!topic) {
      throw new AiException('AI_INVALID_RESPONSE', 'Topic not found', 404);
    }

    const task = await this.repository.findPracticeTask(practiceTaskId, topicId);
    if (!task) {
      throw new AiException('AI_INVALID_RESPONSE', 'Practice task not found', 404);
    }

    const hint = await this.aiService.getPracticeHint({
      studentId: user.id,
      topicId,
      practiceTaskId,
      topicTitle: topic.title,
      taskTitle: task.title,
      taskPrompt: task.prompt,
      level: task.level,
      studentMessage: dto.message,
      sessionId: dto.sessionId,
    });

    return { ...hint, sessionId: dto.sessionId };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI tutor chat — guiding questions only' })
  async chat(@Body() dto: AiChatDto, @CurrentUser() user: AuthUser) {
    let topicTitle: string | undefined;

    if (dto.topicId) {
      const topic = await this.repository.findTopicForStudent(dto.topicId);
      if (!topic) {
        throw new AiException('AI_INVALID_RESPONSE', 'Topic not found', 404);
      }
      topicTitle = topic.title;
    }

    const response = await this.aiService.chat({
      studentId: user.id,
      topicId: dto.topicId,
      sessionId: dto.sessionId,
      message: dto.message,
      topicTitle,
    });

    return response;
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'AI module status' })
  health() {
    return {
      enabled: this.aiService.isEnabled(),
      openaiConfigured: this.openAiClient.isConfigured(),
    };
  }
}
