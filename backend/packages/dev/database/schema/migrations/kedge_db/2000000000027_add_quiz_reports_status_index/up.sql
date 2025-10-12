-- Add index on quiz_reports.status for faster filtering
CREATE INDEX IF NOT EXISTS idx_quiz_reports_status
ON kedge_practice.quiz_reports(status);
