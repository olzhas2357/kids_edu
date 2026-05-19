import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiException } from '../exceptions/ai.exception';

export interface ChatCompletionParams {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}

@Injectable()
export class OpenAiClient implements OnModuleInit {
  private readonly logger = new Logger(OpenAiClient.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('openai.apiKey');
    if (apiKey?.startsWith('sk-')) {
      this.client = new OpenAI({
        apiKey,
        timeout: this.config.get<number>('openai.timeoutMs', 30000),
        maxRetries: 0,
      });
    } else {
      this.logger.warn('OPENAI_API_KEY not set — AI will use safe fallback responses');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new AiException(
        'AI_NOT_CONFIGURED',
        'OpenAI is not configured. Set OPENAI_API_KEY in environment.',
        503,
      );
    }
  }

  async createChatCompletion(params: ChatCompletionParams): Promise<string> {
    if (!this.client) {
      throw new AiException('AI_NOT_CONFIGURED', 'OpenAI client is not available.', 503);
    }

    const model = this.config.get<string>('openai.model', 'gpt-4o-mini');

    const response = await this.client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 800,
      response_format: params.jsonMode ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content?.trim()) {
      throw new AiException('AI_PROVIDER_ERROR', 'OpenAI returned an empty response.');
    }

    return content;
  }

  async moderate(text: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const model = this.config.get<string>(
      'openai.moderationModel',
      'omni-moderation-latest',
    );

    const result = await this.client.moderations.create({ model, input: text });
    return result.results[0]?.flagged ?? false;
  }
}
