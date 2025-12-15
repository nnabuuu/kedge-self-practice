-- =================================================================
-- DROP PERFORMANCE INDEXES (ROLLBACK)
-- =================================================================

DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_answered_at;
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_incorrect;
DROP INDEX IF EXISTS kedge_practice.idx_quiz_reports_status_quiz_created;
