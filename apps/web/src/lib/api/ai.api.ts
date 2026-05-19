import { API_ROUTES } from '@edu-platform/shared';
import type { AiAssessment } from '@/types/learning';
import { api } from './client';

export interface PracticeHintResponse {
  socraticHint: string;
  encouragement: string;
  sessionId?: string;
}

export interface ChatResponse {
  socraticHint: string;
  encouragement: string;
}

export const aiApi = {
  health: () =>
    api.get<{ enabled: boolean; openaiConfigured: boolean }>(API_ROUTES.AI.HEALTH, {
      skipAuthRedirect: true,
    }),

  analyzeTest: (topicId: string, attemptId: string) =>
    api.post<{ assessment: AiAssessment }>(API_ROUTES.AI.TEST_ANALYZE(topicId), {
      attemptId,
    }),

  practiceHint: (topicId: string, taskId: string, message?: string, sessionId?: string) =>
    api.post<PracticeHintResponse>(API_ROUTES.AI.PRACTICE_HINT(topicId, taskId), {
      message,
      sessionId,
    }),

  chat: (message: string, topicId?: string, sessionId?: string) =>
    api.post<ChatResponse>(API_ROUTES.AI.CHAT, { message, topicId, sessionId }),
};
