-- Add new strategy codes to existing practice_sessions table
ALTER TABLE kedge_practice.practice_sessions 
DROP CONSTRAINT IF EXISTS practice_sessions_strategy_check;

ALTER TABLE kedge_practice.practice_sessions 
ADD CONSTRAINT practice_sessions_strategy_check 
CHECK (strategy IN ('random', 'sequential', 'difficulty_adaptive', 'weakness_focused', 'review_incorrect', 'QUICK_PRACTICE', 'WEAKNESS_REINFORCEMENT', 'MISTAKE_REINFORCEMENT'));

-- Create practice_strategies table
CREATE TABLE IF NOT EXISTS kedge_practice.practice_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    required_history BOOLEAN DEFAULT false,
    minimum_practice_count INTEGER DEFAULT 0,
    minimum_mistake_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_weaknesses table
CREATE TABLE IF NOT EXISTS kedge_practice.student_weaknesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES kedge_practice.users(id) ON DELETE CASCADE,
    knowledge_point_id UUID REFERENCES kedge_practice.knowledge_points(id) ON DELETE CASCADE,
    accuracy_rate DECIMAL(5,2) CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
    practice_count INTEGER DEFAULT 0,
    last_practiced TIMESTAMPTZ,
    improvement_trend DECIMAL(5,2),
    is_weak BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, knowledge_point_id)
);

-- Create student_mistakes table
CREATE TABLE IF NOT EXISTS kedge_practice.student_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES kedge_practice.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES kedge_practice.quizzes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES kedge_practice.practice_sessions(id) ON DELETE SET NULL,
    incorrect_answer TEXT,
    correct_answer TEXT,
    mistake_count INTEGER DEFAULT 1,
    last_attempted TIMESTAMPTZ DEFAULT NOW(),
    is_corrected BOOLEAN DEFAULT false,
    correction_count INTEGER DEFAULT 0,
    next_review_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, quiz_id)
);

-- Create indexes for better performance
CREATE INDEX idx_student_weaknesses_student_id ON kedge_practice.student_weaknesses(student_id);
CREATE INDEX idx_student_weaknesses_is_weak ON kedge_practice.student_weaknesses(is_weak);
CREATE INDEX idx_student_weaknesses_accuracy ON kedge_practice.student_weaknesses(accuracy_rate);
CREATE INDEX idx_student_mistakes_student_id ON kedge_practice.student_mistakes(student_id);
CREATE INDEX idx_student_mistakes_is_corrected ON kedge_practice.student_mistakes(is_corrected);
CREATE INDEX idx_student_mistakes_next_review_date ON kedge_practice.student_mistakes(next_review_date);

-- Insert default practice strategies
INSERT INTO kedge_practice.practice_strategies (code, name, description, icon, is_active, required_history, minimum_practice_count, minimum_mistake_count)
VALUES 
    ('QUICK_PRACTICE', '快速练习', 'Random practice with mixed questions from selected topics', 'flash', true, false, 0, 0),
    ('WEAKNESS_REINFORCEMENT', '薄弱点强化', 'Focus on your weak knowledge points to improve performance', 'target', true, true, 20, 0),
    ('MISTAKE_REINFORCEMENT', '错题强化', 'Practice questions you previously answered incorrectly', 'refresh', true, true, 0, 5)
ON CONFLICT (code) DO NOTHING;

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_practice_strategies_updated_at BEFORE UPDATE ON kedge_practice.practice_strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_weaknesses_updated_at BEFORE UPDATE ON kedge_practice.student_weaknesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_mistakes_updated_at BEFORE UPDATE ON kedge_practice.student_mistakes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();