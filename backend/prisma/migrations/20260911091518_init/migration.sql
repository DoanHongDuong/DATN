-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'VOLUNTEER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('WAITING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('MINIMAL', 'MILD', 'MODERATE', 'MODERATELY_SEVERE', 'SEVERE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "reset_token_hash" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "specialization" TEXT,
    "bio" TEXT,
    "certificate_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psychological_tests" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_score" INTEGER NOT NULL,

    CONSTRAINT "psychological_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order_number" INTEGER NOT NULL,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "score_value" INTEGER NOT NULL,

    CONSTRAINT "test_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL,
    "severity_level" "SeverityLevel" NOT NULL,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_answers" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,

    CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood_emoji" TEXT,
    "sentiment_label" TEXT,
    "sentiment_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relaxation_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relaxation_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "volunteer_id" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'WAITING',
    "priority_level" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_feedback" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_user_id_key" ON "volunteer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "psychological_tests_code_key" ON "psychological_tests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "session_feedback_session_id_key" ON "session_feedback"("session_id");

-- AddForeignKey
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "psychological_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_options" ADD CONSTRAINT "test_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "psychological_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "test_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "test_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_answers" ADD CONSTRAINT "test_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "test_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
