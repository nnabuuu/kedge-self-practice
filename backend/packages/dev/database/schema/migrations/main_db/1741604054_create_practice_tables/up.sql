-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS kedge_practice.practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES kedge_practice.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_progress', 'paused', 'completed', 'abandoned')),
    strategy VARCHAR(30) NOT NULL DEFAULT 'random' CHECK (strategy IN ('random', 'sequential', 'difficulty_adaptive', 'weakness_focused', 'review_incorrect')),
    knowledge_point_ids TEXT[] NOT NULL,
    total_questions INTEGER NOT NULL,
    answered_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    skipped_questions INTEGER NOT NULL DEFAULT 0,
    time_limit_minutes INTEGER,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    difficulty VARCHAR(10) NOT NULL DEFAULT 'mixed' CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create practice_questions table
CREATE TABLE IF NOT EXISTS kedge_practice.practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES kedge_practice.practice_sessions(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES kedge_practice.quizzes(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT[],
    correct_answer TEXT,
    student_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ,
    attachments TEXT[],
    knowledge_point_id UUID REFERENCES kedge_practice.knowledge_points(id),
    difficulty VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_practice_sessions_student_id ON kedge_practice.practice_sessions(student_id);
CREATE INDEX idx_practice_sessions_status ON kedge_practice.practice_sessions(status);
CREATE INDEX idx_practice_sessions_created_at ON kedge_practice.practice_sessions(created_at DESC);
CREATE INDEX idx_practice_sessions_student_status ON kedge_practice.practice_sessions(student_id, status);

CREATE INDEX idx_practice_questions_session_id ON kedge_practice.practice_questions(session_id);
CREATE INDEX idx_practice_questions_quiz_id ON kedge_practice.practice_questions(quiz_id);
CREATE INDEX idx_practice_questions_knowledge_point ON kedge_practice.practice_questions(knowledge_point_id);
CREATE INDEX idx_practice_questions_session_unanswered ON kedge_practice.practice_questions(session_id, student_answer) WHERE student_answer IS NULL;
CREATE INDEX idx_practice_questions_session_number ON kedge_practice.practice_questions(session_id, question_number);

-- Create practice_statistics view for quick analytics
CREATE OR REPLACE VIEW kedge_practice.practice_statistics_view AS
SELECT 
    ps.student_id,
    COUNT(DISTINCT ps.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN ps.status = 'completed' THEN ps.id END) as completed_sessions,
    COUNT(DISTINCT CASE WHEN ps.status = 'abandoned' THEN ps.id END) as abandoned_sessions,
    SUM(ps.answered_questions) as total_questions_answered,
    SUM(ps.correct_answers) as total_correct,
    SUM(ps.incorrect_answers) as total_incorrect,
    SUM(ps.skipped_questions) as total_skipped,
    AVG(CASE WHEN ps.answered_questions > 0 THEN ps.score ELSE NULL END) as average_score,
    SUM(ps.time_spent_seconds) / 60.0 as total_time_minutes,
    MAX(ps.created_at) as last_practice_date
FROM kedge_practice.practice_sessions ps
GROUP BY ps.student_id;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_practice_sessions_updated_at 
    BEFORE UPDATE ON kedge_practice.practice_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();