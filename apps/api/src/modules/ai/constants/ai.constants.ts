/** Phrases that may leak direct answers — blocked in output moderation */
export const ANSWER_LEAK_PATTERNS: RegExp[] = [
  /\bthe answer is\b/i,
  /\bcorrect answer\b/i,
  /\bправильный ответ\b/i,
  /\bответ:\s*\S+/i,
  /\bjust choose\b/i,
  /\bвыбери\s+(вариант|букву)\b/i,
  /\b\d+\s*is\s*correct\b/i,
];

export const UNSAFE_CONTENT_PATTERNS: RegExp[] = [
  /\b(kill|murder|suicide|weapon|drug|porn|sex)\b/i,
];

export const AI_JSON_RESPONSE_KEYS = [
  'score',
  'level',
  'feedback',
  'recommendation',
  'allowNextTopic',
  'socraticHint',
] as const;

export const MAX_STUDENT_MESSAGE_LENGTH = 2000;
export const MAX_FEEDBACK_LENGTH = 1500;
export const MAX_HINT_LENGTH = 500;
