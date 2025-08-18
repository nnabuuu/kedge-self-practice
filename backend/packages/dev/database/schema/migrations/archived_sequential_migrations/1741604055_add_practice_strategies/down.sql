-- Drop triggers
DROP TRIGGER IF EXISTS update_practice_strategies_updated_at ON kedge_practice.practice_strategies;
DROP TRIGGER IF EXISTS update_student_weaknesses_updated_at ON kedge_practice.student_weaknesses;
DROP TRIGGER IF EXISTS update_student_mistakes_updated_at ON kedge_practice.student_mistakes;

-- Drop indexes
DROP INDEX IF EXISTS kedge_practice.idx_student_weaknesses_student_id;
DROP INDEX IF EXISTS kedge_practice.idx_student_weaknesses_is_weak;
DROP INDEX IF EXISTS kedge_practice.idx_student_weaknesses_accuracy;
DROP INDEX IF EXISTS kedge_practice.idx_student_mistakes_student_id;
DROP INDEX IF EXISTS kedge_practice.idx_student_mistakes_is_corrected;
DROP INDEX IF EXISTS kedge_practice.idx_student_mistakes_next_review_date;

-- Drop tables
DROP TABLE IF EXISTS kedge_practice.student_mistakes;
DROP TABLE IF EXISTS kedge_practice.student_weaknesses;
DROP TABLE IF EXISTS kedge_practice.practice_strategies;

-- Revert practice_sessions strategy constraint
ALTER TABLE kedge_practice.practice_sessions 
DROP CONSTRAINT IF EXISTS practice_sessions_strategy_check;

ALTER TABLE kedge_practice.practice_sessions 
ADD CONSTRAINT practice_sessions_strategy_check 
CHECK (strategy IN ('random', 'sequential', 'difficulty_adaptive', 'weakness_focused', 'review_incorrect'));