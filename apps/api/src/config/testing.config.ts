import { registerAs } from '@nestjs/config';

export default registerAs('testing', () => ({
  defaultQuestionCount: parseInt(process.env.TEST_QUESTION_COUNT ?? '5', 10),
  defaultChoicesPerQuestion: parseInt(process.env.TEST_CHOICES_PER_QUESTION ?? '4', 10),
  defaultMaxAttempts: parseInt(process.env.TEST_MAX_ATTEMPTS ?? '3', 10),
  defaultTimeLimitMinutes: parseInt(process.env.TEST_TIME_LIMIT_MINUTES ?? '15', 10),
  autosaveDebounceMs: parseInt(process.env.TEST_AUTOSAVE_DEBOUNCE_MS ?? '500', 10),
  antiCheat: {
    maxTabBlurs: parseInt(process.env.TEST_MAX_TAB_BLURS ?? '5', 10),
    maxPasteEvents: parseInt(process.env.TEST_MAX_PASTE ?? '0', 10),
    minSecondsPerAnswer: parseFloat(process.env.TEST_MIN_SECONDS_PER_ANSWER ?? '2'),
  },
}));
