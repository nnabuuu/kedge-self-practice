-- Create quiz reports table for tracking student-reported issues
CREATE TABLE IF NOT EXISTS kedge_practice.quiz_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report identification
  quiz_id UUID NOT NULL REFERENCES kedge_practice.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES kedge_practice.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES kedge_practice.practice_sessions(id) ON DELETE SET NULL,
  
  -- Report details
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'display_error',
    'wrong_answer', 
    'wrong_association',
    'duplicate',
    'unclear_wording',
    'other'
  )),
  reason TEXT, -- Optional detailed description (max 500 chars enforced at app level)
  
  -- Context (helps teachers understand the issue)
  user_answer TEXT, -- What the student answered
  quiz_context JSONB, -- Snapshot of quiz state when reported
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Resolution tracking
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES kedge_practice.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

-- Create indexes for performance
CREATE INDEX idx_quiz_reports_quiz_id ON kedge_practice.quiz_reports(quiz_id);
CREATE INDEX idx_quiz_reports_user_id ON kedge_practice.quiz_reports(user_id);
CREATE INDEX idx_quiz_reports_status ON kedge_practice.quiz_reports(status);
CREATE INDEX idx_quiz_reports_type ON kedge_practice.quiz_reports(report_type);
CREATE INDEX idx_quiz_reports_created_at ON kedge_practice.quiz_reports(created_at DESC);

-- Compound indexes for common queries
CREATE INDEX idx_reports_quiz_status ON kedge_practice.quiz_reports(quiz_id, status);
CREATE INDEX idx_reports_type_status ON kedge_practice.quiz_reports(report_type, status);
CREATE INDEX idx_reports_user_quiz_type ON kedge_practice.quiz_reports(user_id, quiz_id, report_type);

-- Partial index for pending reports (most frequently queried)
CREATE INDEX idx_pending_reports ON kedge_practice.quiz_reports(quiz_id, created_at DESC) 
WHERE status = 'pending';

-- Prevent duplicate reports from same user for same issue  
CREATE UNIQUE INDEX idx_unique_user_quiz_report 
ON kedge_practice.quiz_reports(user_id, quiz_id, report_type) 
WHERE status != 'dismissed';

-- Create materialized view for report summary
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

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION kedge_practice.update_quiz_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quiz_reports_updated_at
  BEFORE UPDATE ON kedge_practice.quiz_reports
  FOR EACH ROW
  EXECUTE FUNCTION kedge_practice.update_quiz_reports_updated_at();

-- Add comment on table
COMMENT ON TABLE kedge_practice.quiz_reports IS 'Tracks issues reported by students for quiz questions';
COMMENT ON COLUMN kedge_practice.quiz_reports.report_type IS 'Type of issue: display_error, wrong_answer, wrong_association, duplicate, unclear_wording, other';
COMMENT ON COLUMN kedge_practice.quiz_reports.status IS 'Resolution status: pending, reviewing, resolved, dismissed';
COMMENT ON COLUMN kedge_practice.quiz_reports.reason IS 'Optional detailed description from student (max 500 chars)';
COMMENT ON COLUMN kedge_practice.quiz_reports.user_answer IS 'What the student answered when reporting the issue';
COMMENT ON COLUMN kedge_practice.quiz_reports.quiz_context IS 'Snapshot of quiz state for debugging';