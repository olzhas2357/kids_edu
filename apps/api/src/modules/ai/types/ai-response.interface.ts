import type { AiPerformanceLevel } from './ai-level.enum';

export interface AiAssessmentResponse {
  score: number;
  level: AiPerformanceLevel;
  feedback: string;
  recommendation: string;
  allowNextTopic: boolean;
  socraticHint: string;
}

export interface AiPracticeHintResponse {
  socraticHint: string;
  encouragement: string;
}
