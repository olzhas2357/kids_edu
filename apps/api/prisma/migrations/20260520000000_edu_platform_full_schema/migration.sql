
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEACHER', 'STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "PracticeTaskLevel" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TestAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'TEXT');

-- CreateEnum
CREATE TYPE "AIChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AIFeedbackType" AS ENUM ('HINT', 'EXPLANATION', 'CORRECTION', 'ENCOURAGEMENT', 'SUMMARY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "role" "Role" NOT NULL,
    "avatar_url" VARCHAR(512),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(120) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theory_contents" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theory_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "thumbnail_url" VARCHAR(512),
    "duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_tasks" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "prompt" TEXT NOT NULL,
    "level" "PracticeTaskLevel" NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "time_limit_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_test_attempts" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "TestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DECIMAL(5,2),
    "max_score" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "answer" JSONB NOT NULL,
    "is_correct" BOOLEAN,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_logs" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "topic_id" UUID,
    "session_id" UUID NOT NULL,
    "role" "AIChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedbacks" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "topic_id" UUID,
    "type" "AIFeedbackType" NOT NULL,
    "content" TEXT NOT NULL,
    "ai_chat_log_id" UUID,
    "student_answer_id" UUID,
    "practice_task_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_progress" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_teacher_id_is_published_idx" ON "courses"("teacher_id", "is_published");

-- CreateIndex
CREATE INDEX "courses_is_published_created_at_idx" ON "courses"("is_published", "created_at" DESC);

-- CreateIndex
CREATE INDEX "courses_teacher_id_updated_at_idx" ON "courses"("teacher_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "topics_course_id_is_published_order_index_idx" ON "topics"("course_id", "is_published", "order_index");

-- CreateIndex
CREATE INDEX "topics_course_id_updated_at_idx" ON "topics"("course_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "topics_course_id_order_index_key" ON "topics"("course_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "theory_contents_topic_id_key" ON "theory_contents"("topic_id");

-- CreateIndex
CREATE INDEX "videos_topic_id_order_index_idx" ON "videos"("topic_id", "order_index");

-- CreateIndex
CREATE INDEX "practice_tasks_topic_id_order_index_idx" ON "practice_tasks"("topic_id", "order_index");

-- CreateIndex
CREATE INDEX "practice_tasks_topic_id_level_idx" ON "practice_tasks"("topic_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "practice_tasks_topic_id_level_key" ON "practice_tasks"("topic_id", "level");

-- CreateIndex
CREATE INDEX "tests_topic_id_idx" ON "tests"("topic_id");

-- CreateIndex
CREATE INDEX "test_questions_test_id_order_index_idx" ON "test_questions"("test_id", "order_index");

-- CreateIndex
CREATE INDEX "student_test_attempts_student_id_status_updated_at_idx" ON "student_test_attempts"("student_id", "status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "student_test_attempts_student_id_created_at_idx" ON "student_test_attempts"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "student_test_attempts_test_id_student_id_idx" ON "student_test_attempts"("test_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_test_attempts_student_id_test_id_attempt_number_key" ON "student_test_attempts"("student_id", "test_id", "attempt_number");

-- CreateIndex
CREATE INDEX "student_answers_student_id_created_at_idx" ON "student_answers"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "student_answers_attempt_id_idx" ON "student_answers"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_attempt_id_question_id_key" ON "student_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE INDEX "ai_chat_logs_student_id_session_id_created_at_idx" ON "ai_chat_logs"("student_id", "session_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_chat_logs_student_id_created_at_idx" ON "ai_chat_logs"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_chat_logs_topic_id_created_at_idx" ON "ai_chat_logs"("topic_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_feedbacks_student_id_created_at_idx" ON "ai_feedbacks"("student_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_feedbacks_student_id_type_idx" ON "ai_feedbacks"("student_id", "type");

-- CreateIndex
CREATE INDEX "ai_feedbacks_topic_id_created_at_idx" ON "ai_feedbacks"("topic_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "student_progress_student_id_last_accessed_at_idx" ON "student_progress"("student_id", "last_accessed_at" DESC);

-- CreateIndex
CREATE INDEX "student_progress_student_id_course_id_status_idx" ON "student_progress"("student_id", "course_id", "status");

-- CreateIndex
CREATE INDEX "student_progress_student_id_status_updated_at_idx" ON "student_progress"("student_id", "status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "student_progress_course_id_status_idx" ON "student_progress"("course_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_progress_student_id_topic_id_key" ON "student_progress"("student_id", "topic_id");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theory_contents" ADD CONSTRAINT "theory_contents_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_tasks" ADD CONSTRAINT "practice_tasks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_test_attempts" ADD CONSTRAINT "student_test_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_test_attempts" ADD CONSTRAINT "student_test_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "student_test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_logs" ADD CONSTRAINT "ai_chat_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_chat_logs" ADD CONSTRAINT "ai_chat_logs_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_ai_chat_log_id_fkey" FOREIGN KEY ("ai_chat_log_id") REFERENCES "ai_chat_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_student_answer_id_fkey" FOREIGN KEY ("student_answer_id") REFERENCES "student_answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedbacks" ADD CONSTRAINT "ai_feedbacks_practice_task_id_fkey" FOREIGN KEY ("practice_task_id") REFERENCES "practice_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

