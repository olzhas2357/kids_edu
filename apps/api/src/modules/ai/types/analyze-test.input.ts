export interface TestQuestionAnalysis {
  id: string;
  text: string;
  type: string;
  points: number;
  studentAnswer: unknown;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface AnalyzeTestInput {
  studentId: string;
  topicId: string;
  topicTitle: string;
  courseTitle?: string;
  scorePercent: number;
  unlockThreshold: number;
  passed: boolean;
  questions: TestQuestionAnalysis[];
  attemptId?: string;
}

export interface PracticeHintInput {
  studentId: string;
  topicId: string;
  practiceTaskId: string;
  topicTitle: string;
  taskTitle: string;
  taskPrompt: string;
  level: string;
  studentMessage?: string;
  sessionId?: string;
}
