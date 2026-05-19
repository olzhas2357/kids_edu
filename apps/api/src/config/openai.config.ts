import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  moderationModel: process.env.OPENAI_MODERATION_MODEL ?? 'omni-moderation-latest',
  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES ?? '3', 10),
  retryBaseDelayMs: parseInt(process.env.OPENAI_RETRY_BASE_DELAY_MS ?? '1000', 10),
  timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS ?? '30000', 10),
  rateLimitPerHour: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR ?? '30', 10),
  rateLimitPerMinute: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE ?? '10', 10),
  enabled: process.env.AI_ENABLED !== 'false',
}));
