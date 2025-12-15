-- =================================================================
-- DROP UNUSED MATERIALIZED VIEW
-- =================================================================
-- Migration for: optimize-report-review-performance
--
-- The quiz_report_summary materialized view was created but never
-- actually queried. It was being refreshed on every report submission
-- causing unnecessary lock contention and performance overhead.
--
-- This migration removes the unused view and its index.
-- =================================================================

-- Drop the index on the materialized view first
DROP INDEX IF EXISTS kedge_practice.idx_report_summary_pending;

-- Drop the unused materialized view
DROP MATERIALIZED VIEW IF EXISTS kedge_practice.quiz_report_summary;

-- =================================================================
-- VERIFICATION
-- =================================================================
-- Run this query to verify the view no longer exists:
--
-- SELECT matviewname FROM pg_matviews
-- WHERE schemaname = 'kedge_practice' AND matviewname = 'quiz_report_summary';
-- =================================================================
