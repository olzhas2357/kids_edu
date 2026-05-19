import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIChatRole, AIFeedbackType } from '@prisma/client';
import { AiModerationService } from '../moderation/ai-moderation.service';
import { OpenAiRetryService } from '../openai/openai-retry.service';
import { OpenAiClient } from '../openai/openai.client';
import { PromptBuilderService } from '../prompt/prompt-builder.service';
import { AiRateLimitService } from '../rate-limit/ai-rate-limit.service';
import { AiRepository } from '../repositories/ai.repository';
import type {
  AiAssessmentResponse,
  AiPracticeHintResponse,
  AnalyzeTestInput,
  PracticeHintInput,
} from '../types';
import { AiResponseValidatorService } from '../validation/ai-response-validator.service';
import { AiChatLogService } from './ai-chat-log.service';
import { AiException } from '../exceptions/ai.exception';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly openAiClient: OpenAiClient,
    private readonly retryService: OpenAiRetryService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly moderation: AiModerationService,
    private readonly validator: AiResponseValidatorService,
    private readonly rateLimit: AiRateLimitService,
    private readonly chatLog: AiChatLogService,
    private readonly repository: AiRepository,
  ) {}

  isEnabled(): boolean {
    return this.config.get<boolean>('openai.enabled', true);
  }

  async analyzeTest(input: AnalyzeTestInput): Promise<AiAssessmentResponse> {
    this.assertEnabled();
    this.rateLimit.assertWithinLimit(input.studentId);

    const userPrompt = this.promptBuilder.buildTestAnalysisUserPrompt(input);
    await this.moderation.assertInputSafe(userPrompt);

    const sessionId = this.chatLog.createSessionId();
    const systemPrompt = this.promptBuilder.buildSystemPrompt();

    const raw = await this.completeJson(systemPrompt, userPrompt, {
      score: input.scorePercent,
      threshold: input.unlockThreshold,
      passed: input.passed,
    });

    const parsed = this.validator.parseJson(raw);
    let assessment = this.validator.validateTestAssessment(
      parsed,
      input.scorePercent,
      input.unlockThreshold,
    );

    assessment = {
      ...assessment,
      feedback: this.moderation.assertOutputSafe(assessment.feedback),
      recommendation: this.moderation.assertOutputSafe(assessment.recommendation),
      socraticHint: this.moderation.assertOutputSafe(assessment.socraticHint),
    };

    await this.chatLog.logExchange({
      studentId: input.studentId,
      topicId: input.topicId,
      sessionId,
      systemPrompt,
      userPrompt,
      assistantResponse: JSON.stringify(assessment),
      metadata: { type: 'test_analysis', attemptId: input.attemptId },
    });

    return assessment;
  }

  async getPracticeHint(input: PracticeHintInput): Promise<AiPracticeHintResponse> {
    this.assertEnabled();
    this.rateLimit.assertWithinLimit(input.studentId);

    if (input.studentMessage) {
      await this.moderation.assertInputSafe(input.studentMessage);
    }

    const sessionId = input.sessionId ?? this.chatLog.createSessionId();
    const systemPrompt = this.promptBuilder.buildSystemPrompt();
    const userPrompt = this.promptBuilder.buildPracticeHintUserPrompt(input);

    const raw = await this.completeJson(systemPrompt, userPrompt, null);
    const parsed = this.validator.parseJson(raw);
    const hint = this.validator.validatePracticeHint(parsed);

    const result = {
      socraticHint: this.moderation.assertOutputSafe(hint.socraticHint),
      encouragement: this.moderation.assertOutputSafe(hint.encouragement),
    };

    await this.chatLog.logExchange({
      studentId: input.studentId,
      topicId: input.topicId,
      sessionId,
      systemPrompt,
      userPrompt,
      assistantResponse: JSON.stringify(result),
      metadata: { type: 'practice_hint', practiceTaskId: input.practiceTaskId },
    });

    return result;
  }

  async chat(params: {
    studentId: string;
    topicId?: string;
    sessionId?: string;
    message: string;
    topicTitle?: string;
  }): Promise<AiPracticeHintResponse> {
    this.assertEnabled();
    this.rateLimit.assertWithinLimit(params.studentId);
    await this.moderation.assertInputSafe(params.message);

    const sessionId = params.sessionId ?? this.chatLog.createSessionId();
    await this.chatLog.logUserMessage({
      studentId: params.studentId,
      topicId: params.topicId,
      sessionId,
      content: params.message,
    });

    const systemPrompt = this.promptBuilder.buildSystemPrompt();
    const userPrompt = this.promptBuilder.buildChatUserPrompt(
      params.message,
      params.topicTitle,
    );

    const raw = await this.completeJson(systemPrompt, userPrompt, null);
    const parsed = this.validator.parseJson(raw);
    const hint = this.validator.validatePracticeHint(parsed);

    const result = {
      socraticHint: this.moderation.assertOutputSafe(hint.socraticHint),
      encouragement: this.moderation.assertOutputSafe(hint.encouragement),
    };

    await this.repository.createChatLog({
      studentId: params.studentId,
      topicId: params.topicId,
      sessionId,
      role: AIChatRole.ASSISTANT,
      content: JSON.stringify(result),
    });

    return result;
  }

  async saveTestFeedback(params: {
    studentId: string;
    topicId: string;
    assessment: AiAssessmentResponse;
    aiChatLogId?: string;
    attemptId?: string;
  }) {
    const type =
      params.assessment.level === 'excellent' || params.assessment.allowNextTopic
        ? AIFeedbackType.ENCOURAGEMENT
        : AIFeedbackType.HINT;

    const content = [
      params.assessment.feedback,
      params.assessment.recommendation,
      `Hint: ${params.assessment.socraticHint}`,
    ].join('\n\n');

    return this.repository.createFeedback({
      student: { connect: { id: params.studentId } },
      topic: { connect: { id: params.topicId } },
      type,
      content,
      aiChatLog: params.aiChatLogId
        ? { connect: { id: params.aiChatLogId } }
        : undefined,
      metadata: {
        ...params.assessment,
        attemptId: params.attemptId,
        generatedBy: 'openai',
      },
    });
  }

  buildAnalyzeInputFromAttempt(
    attempt: NonNullable<Awaited<ReturnType<AiRepository['findTestAttempt']>>>,
    scorePercent: number,
    threshold: number,
    passed: boolean,
  ): AnalyzeTestInput {
    const topic = attempt.test.topic;
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    return {
      studentId: attempt.studentId,
      topicId: topic.id,
      topicTitle: topic.title,
      courseTitle: topic.course.title,
      scorePercent,
      unlockThreshold: threshold,
      passed,
      attemptId: attempt.id,
      questions: attempt.test.questions.map((q) => {
        const ans = answerMap.get(q.id);
        return {
          id: q.id,
          text: q.questionText,
          type: q.type,
          points: q.points,
          studentAnswer: ans?.answer ?? null,
          isCorrect: ans?.isCorrect ?? false,
          pointsEarned: ans?.pointsEarned ?? 0,
        };
      }),
    };
  }

  private async completeJson(
    systemPrompt: string,
    userPrompt: string,
    fallbackContext: { score: number; threshold: number; passed: boolean } | null,
  ): Promise<string> {
    if (!this.openAiClient.isConfigured()) {
      if (fallbackContext) {
        return this.promptBuilder.buildFallbackTestResponse(
          fallbackContext.score,
          fallbackContext.threshold,
          fallbackContext.passed,
        );
      }
      return JSON.stringify({
        socraticHint: 'What part of the task do you understand already?',
        encouragement: 'Keep trying — learning takes practice!',
      });
    }

    try {
      return await this.retryService.completeWithRetry({
        systemPrompt,
        userPrompt,
        jsonMode: true,
      });
    } catch (error) {
      if (fallbackContext) {
        this.logger.warn('Using fallback AI response after provider error');
        return this.promptBuilder.buildFallbackTestResponse(
          fallbackContext.score,
          fallbackContext.threshold,
          fallbackContext.passed,
        );
      }
      throw error;
    }
  }

  private assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new AiException('AI_DISABLED', 'AI features are temporarily disabled.');
    }
  }
}
