-- =================================================================
-- ROLLBACK: QUIZ ERROR RATE ANALYTICS - DATABASE INDEXES
-- =================================================================
-- This migration removes the indexes added for NIE-28
-- =================================================================

-- Drop indexes in reverse order of creation
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_session;
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_quiz_correct_created;
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_quiz_created;

-- =================================================================
-- VERIFICATION
-- =================================================================
-- Run this query to verify indexes are removed:
--
-- SELECT indexname
-- FROM pg_indexes
-- WHERE tablename = 'practice_answers'
-- AND schemaname = 'kedge_practice';
-- =================================================================
