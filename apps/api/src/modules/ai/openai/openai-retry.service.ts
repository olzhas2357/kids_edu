import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiException } from '../exceptions/ai.exception';
import { OpenAiClient, type ChatCompletionParams } from './openai.client';

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

@Injectable()
export class OpenAiRetryService {
  private readonly logger = new Logger(OpenAiRetryService.name);

  constructor(
    private readonly openAiClient: OpenAiClient,
    private readonly config: ConfigService,
  ) {}

  async completeWithRetry(params: ChatCompletionParams): Promise<string> {
    const maxRetries = this.config.get<number>('openai.maxRetries', 3);
    const baseDelay = this.config.get<number>('openai.retryBaseDelayMs', 1000);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.openAiClient.createChatCompletion(params);
      } catch (error) {
        lastError = error as Error;

        if (error instanceof AiException && error.code === 'AI_NOT_CONFIGURED') {
          throw error;
        }

        const retryable = this.isRetryable(error);
        if (!retryable || attempt === maxRetries) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        this.logger.warn(
          `OpenAI request failed (attempt ${attempt + 1}/${maxRetries + 1}), retry in ${delay}ms`,
        );
        await this.sleep(delay);
      }
    }

    this.logger.error(`OpenAI failed after retries: ${lastError?.message}`);
    throw new AiException(
      'AI_PROVIDER_ERROR',
      'AI is temporarily unavailable. Please try again in a moment.',
      503,
    );
  }

  private isRetryable(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      return RETRYABLE_STATUS.has((error as { status: number }).status);
    }
    const message = (error as Error)?.message ?? '';
    return /timeout|ECONNRESET|ETIMEDOUT|rate limit/i.test(message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
