import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiModerationService } from './moderation/ai-moderation.service';
import { OpenAiClient } from './openai/openai.client';
import { OpenAiRetryService } from './openai/openai-retry.service';
import { PromptBuilderService } from './prompt/prompt-builder.service';
import { AiRateLimitService } from './rate-limit/ai-rate-limit.service';
import { AiRepository } from './repositories/ai.repository';
import { AiChatLogService } from './services/ai-chat-log.service';
import { AiService } from './services/ai.service';
import { AiResponseValidatorService } from './validation/ai-response-validator.service';

@Module({
  controllers: [AiController],
  providers: [
    AiRepository,
    AiService,
    AiChatLogService,
    PromptBuilderService,
    AiModerationService,
    AiResponseValidatorService,
    OpenAiClient,
    OpenAiRetryService,
    AiRateLimitService,
  ],
  exports: [AiService, AiRepository],
})
export class AiModule {}
