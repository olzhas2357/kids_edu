import { Injectable } from '@nestjs/common';
import { LearningStep, PracticeTaskLevel, ProgressStatus } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { StudentNotFoundException } from '../exceptions/student-learning.exception';
import { StudentLearningRepository } from '../repositories/student-learning.repository';
import { StudentProgressService } from './student-progress.service';

@Injectable()
export class StudentLearningService {
  constructor(
    private readonly repository: StudentLearningRepository,
    private readonly progressService: StudentProgressService,
  ) {}

  async listCourses() {
    return this.repository.findPublishedCourses();
  }

  async listCourseTopics(courseId: string, user: AuthUser) {
    const course = await this.repository.findPublishedCourse(courseId);
    if (!course) {
      throw new StudentNotFoundException('Course');
    }

    let progressList = await this.repository.findProgressByCourse(user.id, courseId);
    if (progressList.length === 0) {
      progressList = await this.progressService.initializeCourseProgress(user.id, courseId);
    }

    const threshold = this.progressService.unlockThreshold;
    const progressMap = new Map(progressList.map((p) => [p.topicId, p]));

    return course.topics.map((topic) => {
      const progress = progressMap.get(topic.id);
      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        orderIndex: topic.orderIndex,
        progress: progress
          ? this.progressService.mapProgressSummary(progress, threshold)
          : { isLocked: true, status: 'NOT_STARTED' },
      };
    });
  }

  async openTopic(topicId: string, user: AuthUser) {
    const { topic, progress } = await this.progressService.assertTopicUnlocked(
      topicId,
      user.id,
    );

    await this.repository.updateProgress(user.id, topicId, {
      lastAccessedAt: new Date(),
      status:
        progress.status === ProgressStatus.NOT_STARTED
          ? ProgressStatus.IN_PROGRESS
          : progress.status,
    });

    const threshold = this.progressService.unlockThreshold;
    const refreshed = await this.repository.findProgress(user.id, topicId);

    return {
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        theory: topic.theoryContent,
        videos: topic.videos,
        practiceTasks: topic.practiceTasks,
        test: topic.tests[0]
          ? {
              id: topic.tests[0].id,
              title: topic.tests[0].title,
              description: topic.tests[0].description,
              passingScore: topic.tests[0].passingScore,
              timeLimitMinutes: topic.tests[0].timeLimitMinutes,
              questions: topic.tests[0].questions,
            }
          : null,
      },
      progress: this.progressService.mapProgressSummary(refreshed!, threshold),
      flow: this.buildFlowState(refreshed!),
    };
  }

  async completeTheory(topicId: string, user: AuthUser) {
    if (!(await this.repository.findPublishedTopic(topicId))?.theoryContent) {
      throw new StudentNotFoundException('Theory content');
    }
    const progress = await this.progressService.completeStep(
      user.id,
      topicId,
      LearningStep.THEORY,
    );
    return this.wrapProgressResponse(progress);
  }

  async completeVideo(topicId: string, user: AuthUser) {
    const topic = await this.repository.findPublishedTopic(topicId);
    if (!topic?.videos.length) {
      throw new StudentNotFoundException('Videos');
    }
    const progress = await this.progressService.completeStep(
      user.id,
      topicId,
      LearningStep.VIDEO,
    );
    return this.wrapProgressResponse(progress);
  }

  async completePractice(topicId: string, level: PracticeTaskLevel, user: AuthUser) {
    const topic = await this.repository.findPublishedTopic(topicId);
    const task = topic?.practiceTasks.find((t) => t.level === level);
    if (!task) {
      throw new StudentNotFoundException(`Practice task ${level}`);
    }

    const step = this.progressService.practiceLevelToStep(level);
    const progress = await this.progressService.completeStep(user.id, topicId, step);
    return this.wrapProgressResponse(progress);
  }

  async getTopicResult(topicId: string, user: AuthUser) {
    const { progress } = await this.progressService.getOrCreateProgress(topicId, user.id);
    const threshold = this.progressService.unlockThreshold;
    const feedback = await this.repository.findLatestFeedback(user.id, topicId);

    const score = progress.lastTestScore ? Number(progress.lastTestScore) : null;
    const passed = score !== null && score >= threshold;

    return {
      progress: this.progressService.mapProgressSummary(progress, threshold),
      score,
      passed,
      retryRecommended: progress.retryRecommended,
      recommendation: passed
        ? 'Proceed to the next topic.'
        : `Repeat theory, video, and practice. Aim for ${threshold}%+ on the test.`,
      aiFeedback: feedback,
    };
  }

  async retryTopic(topicId: string, user: AuthUser) {
    const progress = await this.progressService.resetForRetry(user.id, topicId);
    return {
      progress: this.progressService.mapProgressSummary(
        progress,
        this.progressService.unlockThreshold,
      ),
      message: 'You can start a new test attempt.',
    };
  }

  private buildFlowState(progress: {
    currentStep: LearningStep;
    theoryCompleted: boolean;
    videoCompleted: boolean;
    practiceACompleted: boolean;
    practiceBCompleted: boolean;
    practiceCCompleted: boolean;
    testCompleted: boolean;
    retryRecommended: boolean;
  }) {
    const steps = [
      { step: LearningStep.THEORY, completed: progress.theoryCompleted },
      { step: LearningStep.VIDEO, completed: progress.videoCompleted },
      { step: LearningStep.PRACTICE_A, completed: progress.practiceACompleted },
      { step: LearningStep.PRACTICE_B, completed: progress.practiceBCompleted },
      { step: LearningStep.PRACTICE_C, completed: progress.practiceCCompleted },
      { step: LearningStep.TEST, completed: progress.testCompleted },
    ];
    return {
      currentStep: progress.currentStep,
      steps,
      retryRecommended: progress.retryRecommended,
    };
  }

  private wrapProgressResponse(progress: Awaited<ReturnType<StudentProgressService['completeStep']>>) {
    return {
      progress: this.progressService.mapProgressSummary(
        progress,
        this.progressService.unlockThreshold,
      ),
      flow: this.buildFlowState(progress),
    };
  }
}
