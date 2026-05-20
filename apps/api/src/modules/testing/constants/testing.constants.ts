import { QuestionType } from '@prisma/client';

export const MC_QUESTION_TYPES: QuestionType[] = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE,
];

export const ANTI_CHEAT_EVENT = {
  TAB_BLUR: 'tab_blur',
  PASTE: 'paste',
  RAPID_ANSWER: 'rapid_answer',
  SESSION_MISMATCH: 'session_mismatch',
} as const;

export type AntiCheatEventType = (typeof ANTI_CHEAT_EVENT)[keyof typeof ANTI_CHEAT_EVENT];
