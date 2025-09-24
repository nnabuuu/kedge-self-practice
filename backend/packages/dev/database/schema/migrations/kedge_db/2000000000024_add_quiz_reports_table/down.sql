-- Drop quiz reports table and related objects
DROP TRIGGER IF EXISTS trigger_update_quiz_reports_updated_at ON kedge_practice.quiz_reports;
DROP FUNCTION IF EXISTS kedge_practice.update_quiz_reports_updated_at();
DROP MATERIALIZED VIEW IF EXISTS kedge_practice.quiz_report_summary;
DROP TABLE IF EXISTS kedge_practice.quiz_reports;