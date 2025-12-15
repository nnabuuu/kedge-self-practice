-- =================================================================
-- PERFORMANCE INDEXES FOR REPORT REVIEW OPTIMIZATION
-- =================================================================
-- Migration for: optimize-report-review-performance
--
-- Adds missing indexes to improve query performance for:
-- 1. Time-range filtering in analytics queries (answered_at)
-- 2. Wrong answer distribution queries (partial index)
-- 3. Report aggregation with status filtering
--
-- These indexes address full table scans identified during
-- performance analysis of teacher report review workflows.
-- =================================================================

-- Index for time-range filtering in analytics queries
-- Used by: GET /v1/teacher/analytics/quiz-error-rates
-- Query pattern: WHERE pa.answered_at >= ? AND pa.answered_at <= ?
-- Note: Existing indexes use created_at, but queries filter by answered_at
CREATE INDEX IF NOT EXISTS idx_practice_answers_answered_at
  ON kedge_practice.practice_answers(answered_at DESC);

-- Partial index for wrong answer distribution queries
-- Used by: Error rate analytics wrong answer distribution
-- Query pattern: WHERE is_correct = false GROUP BY quiz_id, user_answer
-- This index only includes incorrect answers, reducing index size
CREATE INDEX IF NOT EXISTS idx_practice_answers_incorrect
  ON kedge_practice.practice_answers(quiz_id, user_answer)
  WHERE is_correct = false;

-- Compound index for report management aggregation
-- Used by: GET /v1/teacher/reports (getReportsForManagement)
-- Query pattern: WHERE status IN (...) GROUP BY quiz_id ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_quiz_reports_status_quiz_created
  ON kedge_practice.quiz_reports(status, quiz_id, created_at DESC);

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON INDEX kedge_practice.idx_practice_answers_answered_at IS
  'Optimizes time-range filtering in analytics queries (answered_at vs created_at)';

COMMENT ON INDEX kedge_practice.idx_practice_answers_incorrect IS
  'Partial index for wrong answer distribution - only scans incorrect answers';

COMMENT ON INDEX kedge_practice.idx_quiz_reports_status_quiz_created IS
  'Optimizes report aggregation queries with status filtering and time ordering';

-- =================================================================
-- VERIFICATION
-- =================================================================
-- Run these queries to verify index creation:
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('practice_answers', 'quiz_reports')
-- AND schemaname = 'kedge_practice'
-- AND indexname IN (
--   'idx_practice_answers_answered_at',
--   'idx_practice_answers_incorrect',
--   'idx_quiz_reports_status_quiz_created'
-- );
--
-- To verify index usage, run EXPLAIN ANALYZE on sample queries:
--
-- EXPLAIN ANALYZE
-- SELECT * FROM kedge_practice.practice_answers
-- WHERE answered_at >= '2024-01-01' AND answered_at <= '2024-12-31';
-- =================================================================
