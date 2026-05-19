export type LearningStep =
  | 'THEORY'
  | 'VIDEO'
  | 'PRACTICE_A'
  | 'PRACTICE_B'
  | 'PRACTICE_C'
  | 'TEST'
  | 'COMPLETED';

export type AiPerformanceLevel = 'weak' | 'medium' | 'good' | 'excellent';

export interface TopicProgress {
  isLocked: boolean;
  status: string;
  currentStep?: LearningStep;
  lastTestScore?: number | null;
  retryRecommended?: boolean;
}

export interface StudentTopic {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  progress: TopicProgress;
}

export interface AiAssessment {
  score: number;
  level: AiPerformanceLevel;
  feedback: string;
  recommendation: string;
  allowNextTopic: boolean;
  socraticHint: string;
}
