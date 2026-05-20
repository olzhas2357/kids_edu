-- Analytics query indexes (PostgreSQL partial indexes)

CREATE INDEX IF NOT EXISTS "student_test_attempts_test_graded_score_idx"
  ON "student_test_attempts" ("test_id", "submitted_at" DESC)
  WHERE "status" IN ('GRADED', 'TIMED_OUT') AND "score" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "student_test_attempts_submitted_at_idx"
  ON "student_test_attempts" ("submitted_at" DESC)
  WHERE "submitted_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "student_progress_course_score_idx"
  ON "student_progress" ("course_id", "last_test_score")
  WHERE "last_test_score" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "student_progress_course_status_idx"
  ON "student_progress" ("course_id", "status", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "ai_feedbacks_topic_metadata_idx"
  ON "ai_feedbacks" ("topic_id", "created_at" DESC)
  WHERE "metadata" IS NOT NULL;
