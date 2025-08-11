-- Drop trigger
DROP TRIGGER IF EXISTS update_practice_sessions_updated_at ON practice_sessions;

-- Drop view
DROP VIEW IF EXISTS practice_statistics_view;

-- Drop indexes
DROP INDEX IF EXISTS idx_practice_questions_session_number;
DROP INDEX IF EXISTS idx_practice_questions_session_unanswered;
DROP INDEX IF EXISTS idx_practice_questions_knowledge_point;
DROP INDEX IF EXISTS idx_practice_questions_quiz_id;
DROP INDEX IF EXISTS idx_practice_questions_session_id;

DROP INDEX IF EXISTS idx_practice_sessions_student_status;
DROP INDEX IF EXISTS idx_practice_sessions_created_at;
DROP INDEX IF EXISTS idx_practice_sessions_status;
DROP INDEX IF EXISTS idx_practice_sessions_student_id;

-- Drop tables
DROP TABLE IF EXISTS practice_questions;
DROP TABLE IF EXISTS practice_sessions;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();