-- Testing engine: timer, anti-cheat, retry limits, MC test defaults

ALTER TYPE "TestAttemptStatus" ADD VALUE 'TIMED_OUT';

ALTER TABLE "tests"
  ADD COLUMN IF NOT EXISTS "max_attempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "question_count" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "choices_per_question" INTEGER NOT NULL DEFAULT 4;

ALTER TABLE "student_test_attempts"
  ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "autosaved_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "client_session_id" UUID,
  ADD COLUMN IF NOT EXISTS "ip_hash" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "tab_blur_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paste_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "anti_cheat_flags" JSONB;

CREATE INDEX IF NOT EXISTS "student_test_attempts_student_id_test_id_status_idx"
  ON "student_test_attempts"("student_id", "test_id", "status");
