-- Drop the redundant practice_questions table
DROP TABLE IF EXISTS kedge_practice.practice_questions CASCADE;

-- Add quiz_ids array to practice_sessions
ALTER TABLE kedge_practice.practice_sessions 
ADD COLUMN IF NOT EXISTS quiz_ids UUID[] NOT NULL DEFAULT '{}';

-- Create practice_answers table for tracking user submissions
CREATE TABLE IF NOT EXISTS kedge_practice.practice_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one answer per quiz per session
    UNIQUE(session_id, quiz_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_answers_session_id ON kedge_practice.practice_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_quiz_id ON kedge_practice.practice_answers(quiz_id);
CREATE INDEX IF NOT EXISTS idx_practice_answers_session_quiz ON kedge_practice.practice_answers(session_id, quiz_id);

-- Drop columns from practice_sessions that are now calculated
ALTER TABLE kedge_practice.practice_sessions 
DROP COLUMN IF EXISTS knowledge_point_ids;

COMMENT ON COLUMN kedge_practice.practice_sessions.quiz_ids IS 'Array of quiz IDs for this practice session';
COMMENT ON TABLE kedge_practice.practice_answers IS 'Tracks user answers/submissions for each quiz in a practice session';