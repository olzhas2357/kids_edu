import { Injectable } from '@nestjs/common';
import { ProgressStatus, Role, TestAttemptStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface ScoreSummaryRow {
  average_score: number | null;
  median_score: number | null;
  pass_rate: number | null;
  total_attempts: bigint;
  graded_attempts: bigint;
}

export interface TopicDifficultyRow {
  topic_id: string;
  topic_title: string;
  order_index: number;
  average_score: number | null;
  attempt_count: bigint;
  below_threshold_count: bigint;
  fail_rate: number | null;
}

export interface WeakStudentSqlRow {
  student_id: string;
  display_name: string;
  email: string;
  average_score: number | null;
  topics_started: bigint;
  topics_completed: bigint;
  retry_recommended_count: bigint;
  last_activity_at: Date | null;
}

export interface ProgressTimeRow {
  period: Date;
  completed: bigint;
  in_progress: bigint;
  not_started: bigint;
}

export interface AttemptsTimeRow {
  period: Date;
  attempt_count: bigint;
  avg_score: number | null;
}

export interface AttemptStatusRow {
  status: string;
  count: bigint;
}

export interface AiRiskSqlRow {
  student_id: string;
  display_name: string;
  attempt_count: bigint;
  average_score: number | null;
  flagged_attempts: bigint;
  tab_blur_total: bigint;
  paste_total: bigint;
  weak_ai_count: bigint;
}

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCourseForTeacher(courseId: string, teacherId: string, isAdmin: boolean) {
    return this.prisma.course.findFirst({
      where: {
        id: courseId,
        ...(isAdmin ? {} : { teacherId }),
      },
      select: { id: true, title: true, teacherId: true, isPublished: true },
    });
  }

  countCourseStudents(courseId: string) {
    return this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT sp.student_id)::bigint AS count
      FROM student_progress sp
      WHERE sp.course_id = ${courseId}::uuid
    `;
  }

  countActiveStudents(courseId: string, since: Date) {
    return this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT sp.student_id)::bigint AS count
      FROM student_progress sp
      WHERE sp.course_id = ${courseId}::uuid
        AND sp.last_accessed_at >= ${since}
    `;
  }

  countProgressSlots(courseId: string) {
    return this.prisma.$queryRaw<[{ total_topics: bigint; completed: bigint }]>`
      SELECT
        COUNT(*)::bigint AS total_topics,
        COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.COMPLETED}::"ProgressStatus")::bigint AS completed
      FROM student_progress sp
      WHERE sp.course_id = ${courseId}::uuid
    `;
  }

  /** Aggregated test scores for a course — uses latest graded attempt per student per test */
  getScoreSummary(courseId: string, passThreshold: number) {
    return this.prisma.$queryRaw<ScoreSummaryRow[]>`
      WITH latest_attempts AS (
        SELECT DISTINCT ON (sta.student_id, sta.test_id)
          sta.score,
          sta.status
        FROM student_test_attempts sta
        INNER JOIN tests t ON t.id = sta.test_id
        INNER JOIN topics top ON top.id = t.topic_id
        WHERE top.course_id = ${courseId}::uuid
          AND sta.status IN (
            ${TestAttemptStatus.GRADED}::"TestAttemptStatus",
            ${TestAttemptStatus.TIMED_OUT}::"TestAttemptStatus"
          )
          AND sta.score IS NOT NULL
        ORDER BY sta.student_id, sta.test_id, sta.attempt_number DESC
      )
      SELECT
        ROUND(AVG(score::numeric), 2)::float AS average_score,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score::numeric), 2)::float AS median_score,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE score::numeric >= ${passThreshold}) / NULLIF(COUNT(*), 0),
          2
        )::float AS pass_rate,
        (SELECT COUNT(*)::bigint FROM student_test_attempts sta2
         INNER JOIN tests t2 ON t2.id = sta2.test_id
         INNER JOIN topics top2 ON top2.id = t2.topic_id
         WHERE top2.course_id = ${courseId}::uuid) AS total_attempts,
        COUNT(*)::bigint AS graded_attempts
      FROM latest_attempts
    `;
  }

  getDifficultTopics(courseId: string, threshold: number, limit: number) {
    return this.prisma.$queryRaw<TopicDifficultyRow[]>`
      SELECT
        top.id AS topic_id,
        top.title AS topic_title,
        top.order_index,
        ROUND(AVG(sta.score::numeric), 2)::float AS average_score,
        COUNT(sta.id)::bigint AS attempt_count,
        COUNT(*) FILTER (WHERE sta.score::numeric < ${threshold})::bigint AS below_threshold_count,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE sta.score::numeric < ${threshold})
            / NULLIF(COUNT(*) FILTER (WHERE sta.score IS NOT NULL), 0),
          2
        )::float AS fail_rate
      FROM topics top
      INNER JOIN tests t ON t.topic_id = top.id
      LEFT JOIN student_test_attempts sta ON sta.test_id = t.id
        AND sta.status IN (
          ${TestAttemptStatus.GRADED}::"TestAttemptStatus",
          ${TestAttemptStatus.TIMED_OUT}::"TestAttemptStatus"
        )
      WHERE top.course_id = ${courseId}::uuid
        AND top.is_published = true
      GROUP BY top.id, top.title, top.order_index
      ORDER BY average_score ASC NULLS LAST, fail_rate DESC NULLS LAST
      LIMIT ${limit}
    `;
  }

  getWeakStudents(courseId: string, weakThreshold: number, limit: number) {
    return this.prisma.$queryRaw<WeakStudentSqlRow[]>`
      SELECT
        u.id AS student_id,
        u.display_name,
        u.email,
        ROUND(AVG(sp.last_test_score::numeric), 2)::float AS average_score,
        COUNT(*)::bigint AS topics_started,
        COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.COMPLETED}::"ProgressStatus")::bigint AS topics_completed,
        COUNT(*) FILTER (WHERE sp.retry_recommended = true)::bigint AS retry_recommended_count,
        MAX(sp.last_accessed_at) AS last_activity_at
      FROM student_progress sp
      INNER JOIN users u ON u.id = sp.student_id
      WHERE sp.course_id = ${courseId}::uuid
        AND u.role = ${Role.STUDENT}::"Role"
        AND u.is_active = true
      GROUP BY u.id, u.display_name, u.email
      HAVING
        AVG(sp.last_test_score::numeric) < ${weakThreshold}
        OR COUNT(*) FILTER (WHERE sp.retry_recommended = true) >= 2
        OR (
          COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.COMPLETED}::"ProgressStatus")::float
          / NULLIF(COUNT(*)::float, 0)
        ) < 0.3
      ORDER BY average_score ASC NULLS FIRST, retry_recommended_count DESC
      LIMIT ${limit}
    `;
  }

  getProgressOverTime(courseId: string, since: Date) {
    return this.prisma.$queryRaw<ProgressTimeRow[]>`
      SELECT
        date_trunc('day', sp.updated_at) AS period,
        COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.COMPLETED}::"ProgressStatus")::bigint AS completed,
        COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.IN_PROGRESS}::"ProgressStatus")::bigint AS in_progress,
        COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.NOT_STARTED}::"ProgressStatus")::bigint AS not_started
      FROM student_progress sp
      WHERE sp.course_id = ${courseId}::uuid
        AND sp.updated_at >= ${since}
      GROUP BY period
      ORDER BY period ASC
    `;
  }

  getTopicCompletionRates(courseId: string) {
    return this.prisma.$queryRaw<
      Array<{
        topic_id: string;
        topic_title: string;
        order_index: number;
        completion_rate: number | null;
        avg_progress: number | null;
      }>
    >`
      SELECT
        top.id AS topic_id,
        top.title AS topic_title,
        top.order_index,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE sp.status = ${ProgressStatus.COMPLETED}::"ProgressStatus")
            / NULLIF(COUNT(*)::float, 0),
          2
        )::float AS completion_rate,
        ROUND(AVG(sp.progress_percent::numeric), 2)::float AS avg_progress
      FROM topics top
      LEFT JOIN student_progress sp ON sp.topic_id = top.id AND sp.course_id = ${courseId}::uuid
      WHERE top.course_id = ${courseId}::uuid
        AND top.is_published = true
      GROUP BY top.id, top.title, top.order_index
      ORDER BY top.order_index ASC
    `;
  }

  getAttemptsOverTime(courseId: string, since: Date) {
    return this.prisma.$queryRaw<AttemptsTimeRow[]>`
      SELECT
        date_trunc('day', sta.submitted_at) AS period,
        COUNT(*)::bigint AS attempt_count,
        ROUND(AVG(sta.score::numeric), 2)::float AS avg_score
      FROM student_test_attempts sta
      INNER JOIN tests t ON t.id = sta.test_id
      INNER JOIN topics top ON top.id = t.topic_id
      WHERE top.course_id = ${courseId}::uuid
        AND sta.submitted_at IS NOT NULL
        AND sta.submitted_at >= ${since}
        AND sta.status IN (
          ${TestAttemptStatus.GRADED}::"TestAttemptStatus",
          ${TestAttemptStatus.TIMED_OUT}::"TestAttemptStatus"
        )
      GROUP BY period
      ORDER BY period ASC
    `;
  }

  getAttemptsByStatus(courseId: string) {
    return this.prisma.$queryRaw<AttemptStatusRow[]>`
      SELECT sta.status::text AS status, COUNT(*)::bigint AS count
      FROM student_test_attempts sta
      INNER JOIN tests t ON t.id = sta.test_id
      INNER JOIN topics top ON top.id = t.topic_id
      WHERE top.course_id = ${courseId}::uuid
      GROUP BY sta.status
    `;
  }

  getAiRiskSignals(courseId: string) {
    return this.prisma.$queryRaw<AiRiskSqlRow[]>`
      SELECT
        u.id AS student_id,
        u.display_name,
        COUNT(sta.id)::bigint AS attempt_count,
        ROUND(AVG(sta.score::numeric), 2)::float AS average_score,
        COUNT(*) FILTER (
          WHERE (sta.anti_cheat_flags->>'flagged')::boolean = true
        )::bigint AS flagged_attempts,
        COALESCE(SUM(sta.tab_blur_count), 0)::bigint AS tab_blur_total,
        COALESCE(SUM(sta.paste_count), 0)::bigint AS paste_total,
        (
          SELECT COUNT(*)::bigint
          FROM ai_feedbacks af
          INNER JOIN topics top2 ON top2.id = af.topic_id
          WHERE af.student_id = u.id
            AND top2.course_id = ${courseId}::uuid
            AND (
              af.metadata->>'level' = 'weak'
              OR (af.metadata->'assessment'->>'level') = 'weak'
            )
        ) AS weak_ai_count
      FROM users u
      INNER JOIN student_progress sp ON sp.student_id = u.id AND sp.course_id = ${courseId}::uuid
      LEFT JOIN student_test_attempts sta ON sta.student_id = u.id
        AND sta.test_id IN (
          SELECT t.id FROM tests t
          INNER JOIN topics top ON top.id = t.topic_id
          WHERE top.course_id = ${courseId}::uuid
        )
        AND sta.status IN (
          ${TestAttemptStatus.GRADED}::"TestAttemptStatus",
          ${TestAttemptStatus.TIMED_OUT}::"TestAttemptStatus"
        )
      WHERE u.role = ${Role.STUDENT}::"Role"
      GROUP BY u.id, u.display_name
      HAVING
        COUNT(sta.id) > 0
        OR EXISTS (
          SELECT 1 FROM ai_feedbacks af2
          INNER JOIN topics top3 ON top3.id = af2.topic_id
          WHERE af2.student_id = u.id AND top3.course_id = ${courseId}::uuid
        )
      ORDER BY flagged_attempts DESC, tab_blur_total DESC, average_score ASC NULLS FIRST
    `;
  }
}
