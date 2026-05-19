import { LearningStep, PracticeTaskLevel } from '@prisma/client';

export const LEARNING_STEP_ORDER: LearningStep[] = [
  LearningStep.THEORY,
  LearningStep.VIDEO,
  LearningStep.PRACTICE_A,
  LearningStep.PRACTICE_B,
  LearningStep.PRACTICE_C,
  LearningStep.TEST,
  LearningStep.COMPLETED,
];

export const PRACTICE_LEVEL_TO_STEP: Record<PracticeTaskLevel, LearningStep> = {
  [PracticeTaskLevel.A]: LearningStep.PRACTICE_A,
  [PracticeTaskLevel.B]: LearningStep.PRACTICE_B,
  [PracticeTaskLevel.C]: LearningStep.PRACTICE_C,
};

export const STEP_TO_PRACTICE_LEVEL: Partial<Record<LearningStep, PracticeTaskLevel>> = {
  [LearningStep.PRACTICE_A]: PracticeTaskLevel.A,
  [LearningStep.PRACTICE_B]: PracticeTaskLevel.B,
  [LearningStep.PRACTICE_C]: PracticeTaskLevel.C,
};
