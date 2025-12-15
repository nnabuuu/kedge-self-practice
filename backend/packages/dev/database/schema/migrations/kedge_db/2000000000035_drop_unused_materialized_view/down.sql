-- =================================================================
-- RECREATE MATERIALIZED VIEW (ROLLBACK)
-- =================================================================
-- This recreates the quiz_report_summary materialized view if needed
-- for rollback. Note: This view is unused and will be removed again.
-- =================================================================

-- Recreate materialized view for report summary
CREATE MATERIALIZED VIEW IF NOT EXISTS kedge_practice.quiz_report_summary AS
SELECT
  q.id as quiz_id,
  q.question,
  q.type as quiz_type,
  q.knowledge_point_id,
  COUNT(DISTINCT r.id) as total_reports,
  COUNT(DISTINCT r.user_id) as unique_reporters,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_count,
  ARRAY_AGG(DISTINCT r.report_type) as report_types,
  MAX(r.created_at) as last_reported_at,
  MAX(r.resolved_at) as last_resolved_at
FROM kedge_practice.quizzes q
INNER JOIN kedge_practice.quiz_reports r ON q.id = r.quiz_id
GROUP BY q.id, q.question, q.type, q.knowledge_point_id;

-- Create index on materialized view
CREATE INDEX idx_report_summary_pending ON kedge_practice.quiz_report_summary(pending_count DESC);
