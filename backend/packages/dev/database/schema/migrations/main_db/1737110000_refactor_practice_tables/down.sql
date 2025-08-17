-- Recreate practice_questions table
CREATE TABLE IF NOT EXISTS kedge_practice.practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT[],
    correct_answer TEXT,
    student_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at TIMESTAMPTZ,
    attachments TEXT[],
    knowledge_point_id TEXT,
    difficulty TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restore knowledge_point_ids column
ALTER TABLE kedge_practice.practice_sessions 
ADD COLUMN IF NOT EXISTS knowledge_point_ids TEXT[] DEFAULT '{}';

-- Drop the new quiz_ids column
ALTER TABLE kedge_practice.practice_sessions 
DROP COLUMN IF EXISTS quiz_ids;

-- Drop practice_answers table
DROP TABLE IF EXISTS kedge_practice.practice_answers CASCADE;