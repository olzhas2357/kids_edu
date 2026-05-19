import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LearningStep, ProgressStatus, type StudentProgress } from '@prisma/client';
import {
  LEARNING_STEP_ORDER,
  PRACTICE_LEVEL_TO_STEP,
} from '../constants/learning-flow.constants';
import {
  StudentNotFoundException,
  StudentStepOrderException,
  StudentTopicLockedException,
} from '../exceptions/student-learning.exception';
import { StudentLearningRepository } from '../repositories/student-learning.repository';

@Injectable()
export class StudentProgressService {
  constructor(
    private readonly repository: StudentLearningRepository,
    private readonly config: ConfigService,
  ) {}

  get unlockThreshold(): number {
    return this.config.get<number>('learning.unlockScoreThreshold', 85);
  }

  async initializeCourseProgress(studentId: string, courseId: string) {
    const course = await this.repository.findPublishedCourse(courseId);
    if (!course) {
      throw new StudentNotFoundException('Course');
    }

    const topics = course.topics;
    for (let i = 0; i < topics.length; i++) {
      await this.repository.upsertProgress({
        studentId,
        courseId,
        topicId: topics[i].id,
        isLocked: i > 0,
        orderIndex: topics[i].orderIndex,
      });
    }

    return this.repository.findProgressByCourse(studentId, courseId);
  }

  async assertTopicUnlocked(topicId: string, studentId: string) {
    const topic = await this.repository.findPublishedTopic(topicId);
    if (!topic) {
      throw new StudentNotFoundException('Topic');
    }

    let progress = await this.repository.findProgress(studentId, topicId);
    if (!progress) {
      await this.initializeCourseProgress(studentId, topic.courseId);
      progress = await this.repository.findProgress(studentId, topicId);
    }

    if (progress?.isLocked) {
      throw new StudentTopicLockedException();
    }

    return { topic, progress: progress! };
  }

  async getOrCreateProgress(studentId: string, topicId: string) {
    const topic = await this.repository.findPublishedTopic(topicId);
    if (!topic) {
      throw new StudentNotFoundException('Topic');
    }

    let progress = await this.repository.findProgress(studentId, topicId);
    if (!progress) {
      await this.initializeCourseProgress(studentId, topic.courseId);
      progress = await this.repository.findProgress(studentId, topicId);
    }

    if (!progress) {
      throw new StudentNotFoundException('Progress');
    }

    return { topic, progress };
  }

  assertStepAllowed(progress: StudentProgress, step: LearningStep) {
    const currentIdx = LEARNING_STEP_ORDER.indexOf(progress.currentStep);
    const targetIdx = LEARNING_STEP_ORDER.indexOf(step);

    if (targetIdx === -1) {
      return;
    }

    if (targetIdx > currentIdx + 1) {
      throw new StudentStepOrderException(progress.currentStep);
    }
  }

  computeProgressPercent(progress: StudentProgress): number {
    const weights = this.config.get<Record<string, number>>('learning.stepWeights', {
      theory: 15,
      video: 15,
      practiceA: 15,
      practiceB: 15,
      practiceC: 15,
      test: 25,
    });

    let percent = 0;
    if (progress.theoryCompleted) percent += weights.theory ?? 15;
    if (progress.videoCompleted) percent += weights.video ?? 15;
    if (progress.practiceACompleted) percent += weights.practiceA ?? 15;
    if (progress.practiceBCompleted) percent += weights.practiceB ?? 15;
    if (progress.practiceCCompleted) percent += weights.practiceC ?? 15;
    if (progress.testCompleted) percent += weights.test ?? 25;
    return Math.min(100, percent);
  }

  getNextStepAfter(step: LearningStep): LearningStep {
    const idx = LEARNING_STEP_ORDER.indexOf(step);
    return LEARNING_STEP_ORDER[Math.min(idx + 1, LEARNING_STEP_ORDER.length - 1)];
  }

  buildStepUpdate(step: LearningStep) {
    const data: Record<string, boolean | LearningStep> = {};
    switch (step) {
      case LearningStep.THEORY:
        data.theoryCompleted = true;
        break;
      case LearningStep.VIDEO:
        data.videoCompleted = true;
        break;
      case LearningStep.PRACTICE_A:
        data.practiceACompleted = true;
        break;
      case LearningStep.PRACTICE_B:
        data.practiceBCompleted = true;
        break;
      case LearningStep.PRACTICE_C:
        data.practiceCCompleted = true;
        break;
      default:
        break;
    }
    return data;
  }

  practiceLevelToStep(level: string): LearningStep {
    return PRACTICE_LEVEL_TO_STEP[level as keyof typeof PRACTICE_LEVEL_TO_STEP];
  }

  isStepCompleted(progress: StudentProgress, step: LearningStep): boolean {
    switch (step) {
      case LearningStep.THEORY:
        return progress.theoryCompleted;
      case LearningStep.VIDEO:
        return progress.videoCompleted;
      case LearningStep.PRACTICE_A:
        return progress.practiceACompleted;
      case LearningStep.PRACTICE_B:
        return progress.practiceBCompleted;
      case LearningStep.PRACTICE_C:
        return progress.practiceCCompleted;
      case LearningStep.TEST:
        return progress.testCompleted;
      default:
        return false;
    }
  }

  async completeStep(studentId: string, topicId: string, step: LearningStep) {
    const { progress } = await this.assertTopicUnlocked(topicId, studentId);

    if (!this.isStepCompleted(progress, step)) {
      this.assertStepAllowed(progress, step);
    }

    const stepUpdate = this.buildStepUpdate(step);
    const nextStep = this.getNextStepAfter(step);
    const updated = await this.repository.updateProgress(studentId, topicId, {
      ...stepUpdate,
      currentStep: nextStep,
      status: ProgressStatus.IN_PROGRESS,
      lastAccessedAt: new Date(),
    });

    const progressPercent = this.computeProgressPercent(updated);
    return this.repository.updateProgress(studentId, topicId, { progressPercent });
  }

  async unlockNextTopic(studentId: string, courseId: string, currentOrderIndex: number) {
    const nextTopic = await this.repository.findNextTopic(courseId, currentOrderIndex);
    if (!nextTopic) {
      return null;
    }

    await this.repository.unlockTopic(studentId, nextTopic.id);
    return nextTopic;
  }

  async markTopicPassed(studentId: string, topicId: string, score: number) {
    const { topic } = await this.getOrCreateProgress(studentId, topicId);

    const progress = await this.repository.updateProgress(studentId, topicId, {
      testCompleted: true,
      lastTestScore: score,
      retryRecommended: false,
      currentStep: LearningStep.COMPLETED,
      status: ProgressStatus.COMPLETED,
      progressPercent: 100,
      completedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    const nextTopic = await this.unlockNextTopic(
      studentId,
      topic.courseId,
      topic.orderIndex,
    );

    return { progress, nextTopicUnlocked: nextTopic };
  }

  async markTopicRetry(studentId: string, topicId: string, score: number) {
    return this.repository.updateProgress(studentId, topicId, {
      lastTestScore: score,
      retryRecommended: true,
      testCompleted: false,
      currentStep: LearningStep.TEST,
      status: ProgressStatus.IN_PROGRESS,
      lastAccessedAt: new Date(),
    });
  }

  async resetForRetry(studentId: string, topicId: string) {
    await this.assertTopicUnlocked(topicId, studentId);
    const progress = await this.repository.updateProgress(studentId, topicId, {
      testCompleted: false,
      retryRecommended: false,
      currentStep: LearningStep.TEST,
      lastTestScore: null,
    });
    const progressPercent = this.computeProgressPercent(progress);
    return this.repository.updateProgress(studentId, topicId, { progressPercent });
  }

  mapProgressSummary(progress: StudentProgress, unlockThreshold: number) {
    return {
      topicId: progress.topicId,
      status: progress.status,
      isLocked: progress.isLocked,
      currentStep: progress.currentStep,
      progressPercent: progress.progressPercent,
      theoryCompleted: progress.theoryCompleted,
      videoCompleted: progress.videoCompleted,
      practiceACompleted: progress.practiceACompleted,
      practiceBCompleted: progress.practiceBCompleted,
      practiceCCompleted: progress.practiceCCompleted,
      testCompleted: progress.testCompleted,
      lastTestScore: progress.lastTestScore ? Number(progress.lastTestScore) : null,
      retryRecommended: progress.retryRecommended,
      unlockThreshold,
      canUnlockNext: progress.lastTestScore
        ? Number(progress.lastTestScore) >= unlockThreshold
        : false,
    };
  }
}
