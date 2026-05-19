import { Injectable, Logger } from '@nestjs/common';
import { ANSWER_LEAK_PATTERNS, UNSAFE_CONTENT_PATTERNS } from '../constants/ai.constants';
import { AiException } from '../exceptions/ai.exception';
import { OpenAiClient } from '../openai/openai.client';

@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);

  constructor(private readonly openAiClient: OpenAiClient) {}

  async assertInputSafe(text: string): Promise<void> {
    this.assertLocalRules(text);

    if (!this.openAiClient.isConfigured()) {
      return;
    }

    try {
      const flagged = await this.openAiClient.moderate(text);
      if (flagged) {
        throw new AiException(
          'AI_MODERATION_BLOCKED',
          'Your message was blocked for safety. Please ask your teacher for help.',
        );
      }
    } catch (error) {
      if (error instanceof AiException) {
        throw error;
      }
      this.logger.warn(`OpenAI moderation skipped: ${(error as Error).message}`);
    }
  }

  assertOutputSafe(text: string): string {
    for (const pattern of UNSAFE_CONTENT_PATTERNS) {
      if (pattern.test(text)) {
        throw new AiException(
          'AI_MODERATION_BLOCKED',
          'AI response was blocked for safety.',
        );
      }
    }

    for (const pattern of ANSWER_LEAK_PATTERNS) {
      if (pattern.test(text)) {
        return this.sanitizeLeakedAnswer(text);
      }
    }

    return text;
  }

  private assertLocalRules(text: string): void {
    if (!text?.trim()) {
      throw new AiException('AI_MODERATION_BLOCKED', 'Message cannot be empty.');
    }

    for (const pattern of UNSAFE_CONTENT_PATTERNS) {
      if (pattern.test(text)) {
        throw new AiException(
          'AI_MODERATION_BLOCKED',
          'This message is not allowed. Please ask your teacher.',
        );
      }
    }
  }

  private sanitizeLeakedAnswer(_text: string): string {
    return 'Think step by step. What do you already know about this question?';
  }
}
