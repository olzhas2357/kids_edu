import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { TeacherNotFoundException } from '@/modules/teacher/exceptions/teacher.exception';
import { AnalyticsAiRiskService } from './analytics-ai-risk.service';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import type {
  AnalyticsSummary,
  AttemptsStats,
  ChartResponse,
  DifficultTopicRow,
  TeacherDashboardAnalytics,
  WeakStudentRow,
} from '../types/analytics.types';

@Injectable()
export class AnalyticsStatisticsService {
  constructor(
    private readonly repository: AnalyticsRepository,
    private readonly aiRisk: AnalyticsAiRiskService,
    private readonly config: ConfigService,
  ) {}

  async getDashboard(
    courseId: string,
    user: AuthUser,
    days?: number,
  ): Promise<TeacherDashboardAnalytics> {
    const course = await this.assertCourseAccess(courseId, user);
    const chartDays = days ?? this.config.get<number>('analytics.progressChartDays', 30);
    const since = this.daysAgo(chartDays);

    const [
      scoreRows,
      studentCount,
      activeCount,
      progressSlots,
      difficultRows,
      weakRows,
      progressTime,
      topicCompletion,
      attemptsTime,
      attemptsByStatus,
      aiRiskRows,
    ] = await Promise.all([
      this.repository.getScoreSummary(
        courseId,
        this.config.get<number>('analytics.passScoreThreshold', 85),
      ),
      this.repository.countCourseStudents(courseId),
      this.repository.countActiveStudents(courseId, this.daysAgo(14)),
      this.repository.countProgressSlots(courseId),
      this.repository.getDifficultTopics(
        courseId,
        this.config.get<number>('analytics.difficultTopicScoreThreshold', 75),
        this.config.get<number>('analytics.difficultTopicsLimit', 10),
      ),
      this.repository.getWeakStudents(
        courseId,
        this.config.get<number>('analytics.weakStudentScoreThreshold', 70),
        this.config.get<number>('analytics.weakStudentsLimit', 20),
      ),
      this.repository.getProgressOverTime(courseId, since),
      this.repository.getTopicCompletionRates(courseId),
      this.repository.getAttemptsOverTime(courseId, since),
      this.repository.getAttemptsByStatus(courseId),
      this.repository.getAiRiskSignals(courseId),
    ]);

    const summary = this.buildSummary(
      scoreRows[0],
      studentCount[0]?.count,
      activeCount[0]?.count,
      progressSlots[0],
    );

    return {
      courseId: course.id,
      courseTitle: course.title,
      generatedAt: new Date().toISOString(),
      summary,
      difficultTopics: difficultRows.map((r) => this.mapDifficultTopic(r)),
      weakStudents: weakRows.map((r) => this.mapWeakStudent(r)),
      progressChart: this.buildProgressChart(progressTime, topicCompletion),
      attempts: this.buildAttemptsStats(attemptsTime, attemptsByStatus, summary.totalStudents),
      aiRisk: this.aiRisk.analyze(aiRiskRows),
    };
  }

  async getSummaryOnly(courseId: string, user: AuthUser): Promise<AnalyticsSummary> {
    const dashboard = await this.getDashboard(courseId, user, 7);
    return dashboard.summary;
  }

  async getDifficultTopics(courseId: string, user: AuthUser): Promise<DifficultTopicRow[]> {
    await this.assertCourseAccess(courseId, user);
    const rows = await this.repository.getDifficultTopics(
      courseId,
      this.config.get<number>('analytics.difficultTopicScoreThreshold', 75),
      this.config.get<number>('analytics.difficultTopicsLimit', 10),
    );
    return rows.map((r) => this.mapDifficultTopic(r));
  }

  async getWeakStudents(courseId: string, user: AuthUser): Promise<WeakStudentRow[]> {
    await this.assertCourseAccess(courseId, user);
    const rows = await this.repository.getWeakStudents(
      courseId,
      this.config.get<number>('analytics.weakStudentScoreThreshold', 70),
      this.config.get<number>('analytics.weakStudentsLimit', 20),
    );
    return rows.map((r) => this.mapWeakStudent(r));
  }

  async getProgressChart(courseId: string, user: AuthUser, days?: number): Promise<ChartResponse> {
    await this.assertCourseAccess(courseId, user);
    const since = this.daysAgo(days ?? 30);
    const [progressTime, topicCompletion] = await Promise.all([
      this.repository.getProgressOverTime(courseId, since),
      this.repository.getTopicCompletionRates(courseId),
    ]);
    return this.buildProgressChart(progressTime, topicCompletion);
  }

  async getAttemptsChart(courseId: string, user: AuthUser, days?: number): Promise<AttemptsStats> {
    const dashboard = await this.getDashboard(courseId, user, days);
    return dashboard.attempts;
  }

  async getAiRisk(courseId: string, user: AuthUser) {
    await this.assertCourseAccess(courseId, user);
    const rows = await this.repository.getAiRiskSignals(courseId);
    return this.aiRisk.analyze(rows);
  }

  private async assertCourseAccess(courseId: string, user: AuthUser) {
    const course = await this.repository.findCourseForTeacher(
      courseId,
      user.id,
      user.role === Role.ADMIN,
    );
    if (!course) {
      throw new TeacherNotFoundException('Course');
    }
    return course;
  }

  private buildSummary(
    scoreRow: {
      average_score: number | null;
      median_score: number | null;
      pass_rate: number | null;
      total_attempts: bigint;
      graded_attempts: bigint;
    } | undefined,
    totalStudents: bigint | undefined,
    activeStudents: bigint | undefined,
    progressSlots: { total_topics: bigint; completed: bigint } | undefined,
  ): AnalyticsSummary {
    return {
      averageScore: scoreRow?.average_score ?? null,
      medianScore: scoreRow?.median_score ?? null,
      passRate: scoreRow?.pass_rate ?? null,
      totalStudents: Number(totalStudents ?? 0),
      activeStudents: Number(activeStudents ?? 0),
      totalAttempts: Number(scoreRow?.total_attempts ?? 0),
      gradedAttempts: Number(scoreRow?.graded_attempts ?? 0),
      completedTopics: Number(progressSlots?.completed ?? 0),
      totalTopicSlots: Number(progressSlots?.total_topics ?? 0),
    };
  }

  private mapDifficultTopic(r: {
    topic_id: string;
    topic_title: string;
    order_index: number;
    average_score: number | null;
    attempt_count: bigint;
    below_threshold_count: bigint;
    fail_rate: number | null;
  }): DifficultTopicRow {
    const avg = r.average_score;
    const failRate = r.fail_rate ?? 0;
    const difficultyScore = avg === null ? 100 : Math.round(100 - avg + failRate * 0.3);

    return {
      topicId: r.topic_id,
      topicTitle: r.topic_title,
      orderIndex: r.order_index,
      averageScore: avg,
      attemptCount: Number(r.attempt_count),
      failRate,
      belowThresholdCount: Number(r.below_threshold_count),
      difficultyScore: Math.min(100, difficultyScore),
    };
  }

  private mapWeakStudent(r: {
    student_id: string;
    display_name: string;
    email: string;
    average_score: number | null;
    topics_started: bigint;
    topics_completed: bigint;
    retry_recommended_count: bigint;
    last_activity_at: Date | null;
  }): WeakStudentRow {
    const avg = r.average_score;
    const retries = Number(r.retry_recommended_count);
    let riskLevel: WeakStudentRow['riskLevel'] = 'low';
    if (avg !== null && avg < 50) riskLevel = 'high';
    else if (avg !== null && avg < 70) riskLevel = 'medium';
    else if (retries >= 3) riskLevel = 'medium';

    return {
      studentId: r.student_id,
      displayName: r.display_name,
      email: r.email,
      averageScore: avg,
      topicsStarted: Number(r.topics_started),
      topicsCompleted: Number(r.topics_completed),
      retryRecommendedCount: retries,
      lastActivityAt: r.last_activity_at,
      riskLevel,
    };
  }

  private buildProgressChart(
    timeRows: Array<{
      period: Date;
      completed: bigint;
      in_progress: bigint;
      not_started: bigint;
    }>,
    topicRows: Array<{
      topic_title: string;
      order_index: number;
      completion_rate: number | null;
      avg_progress: number | null;
    }>,
  ): ChartResponse {
    const timeLabels = timeRows.map((r) => this.formatDate(r.period));

    if (timeLabels.length > 0) {
      return {
        labels: timeLabels,
        datasets: [
          {
            label: 'Completed updates',
            data: timeRows.map((r) => Number(r.completed)),
          },
          {
            label: 'In progress',
            data: timeRows.map((r) => Number(r.in_progress)),
          },
        ],
      };
    }

    return {
      labels: topicRows.map((t) => t.topic_title),
      datasets: [
        {
          label: 'Completion rate %',
          data: topicRows.map((t) => t.completion_rate ?? 0),
        },
        {
          label: 'Avg progress %',
          data: topicRows.map((t) => t.avg_progress ?? 0),
        },
      ],
    };
  }

  private buildAttemptsStats(
    timeRows: Array<{ period: Date; attempt_count: bigint; avg_score: number | null }>,
    statusRows: Array<{ status: string; count: bigint }>,
    totalStudents: number,
  ): AttemptsStats {
    const total = statusRows.reduce((s, r) => s + Number(r.count), 0);
    const byStatus: Record<string, number> = {};
    for (const r of statusRows) {
      byStatus[r.status] = Number(r.count);
    }

    return {
      total,
      byStatus,
      averagePerStudent: totalStudents > 0 ? Math.round((total / totalStudents) * 100) / 100 : 0,
      chart: {
        labels: timeRows.map((r) => this.formatDate(r.period)),
        datasets: [
          {
            label: 'Attempts',
            data: timeRows.map((r) => Number(r.attempt_count)),
          },
          {
            label: 'Avg score',
            data: timeRows.map((r) => r.avg_score ?? 0),
          },
        ],
      },
    };
  }

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
