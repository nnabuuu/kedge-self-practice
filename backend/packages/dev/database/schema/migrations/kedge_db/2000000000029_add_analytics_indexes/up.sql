-- =================================================================
-- QUIZ ERROR RATE ANALYTICS - DATABASE INDEXES
-- =================================================================
-- Migration for NIE-28: Teacher Analytics - Quiz Error Rate Analysis
--
-- This migration adds performance indexes to support the error rate
-- analytics feature, which allows teachers to:
-- - View questions sorted by error rate
-- - Filter by knowledge points and time frames
-- - Analyze wrong answer distributions
--
-- Design Document: /docs/designs/quiz-error-rate-analytics.md
-- =================================================================

-- Index for quiz-based time filtering
-- Used by: GET /v1/teacher/analytics/quiz-error-rates
-- Query pattern: WHERE quiz_id = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_practice_answers_quiz_created
  ON kedge_practice.practice_answers(quiz_id, created_at);

-- Index for error rate calculations with time filtering
-- Used by: Error rate aggregation queries
-- Query pattern: WHERE quiz_id = ? AND is_correct = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_practice_answers_quiz_correct_created
  ON kedge_practice.practice_answers(quiz_id, is_correct, created_at);

-- Index for session-based queries (existing feature support)
-- Query pattern: WHERE session_id = ?
CREATE INDEX IF NOT EXISTS idx_practice_answers_session
  ON kedge_practice.practice_answers(session_id);

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON INDEX kedge_practice.idx_practice_answers_quiz_created IS
  'Optimizes time-based queries for quiz error rate analytics (NIE-28)';

COMMENT ON INDEX kedge_practice.idx_practice_answers_quiz_correct_created IS
  'Optimizes error rate calculations with time filtering (NIE-28)';

COMMENT ON INDEX kedge_practice.idx_practice_answers_session IS
  'Optimizes session-based answer retrieval for practice features';

-- =================================================================
-- VERIFICATION
-- =================================================================
-- Run these queries to verify index creation:
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'practice_answers'
-- AND schemaname = 'kedge_practice';
-- =================================================================
