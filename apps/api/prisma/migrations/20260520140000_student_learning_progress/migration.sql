-- CreateEnum
CREATE TYPE "LearningStep" AS ENUM ('THEORY', 'VIDEO', 'PRACTICE_A', 'PRACTICE_B', 'PRACTICE_C', 'TEST', 'COMPLETED');

-- AlterTable
ALTER TABLE "student_progress" ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "current_step" "LearningStep" NOT NULL DEFAULT 'THEORY',
ADD COLUMN     "theory_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "video_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "practice_a_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "practice_b_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "practice_c_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "test_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_test_score" DECIMAL(5,2),
ADD COLUMN     "retry_recommended" BOOLEAN NOT NULL DEFAULT false;

-- Unlock first topic per course for existing progress rows
UPDATE "student_progress" sp
SET "is_locked" = false
FROM "topics" t
WHERE sp."topic_id" = t."id"
  AND t."order_index" = (
    SELECT MIN(t2."order_index") FROM "topics" t2 WHERE t2."course_id" = t."course_id"
  );
