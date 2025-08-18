-- =================================================================
-- CONSOLIDATED INITIAL SCHEMA ROLLBACK
-- =================================================================
-- This migration drops the complete database schema for the
-- Kedge Self-Practice learning platform in reverse order.
-- =================================================================

-- =================================================================
-- DROP VIEWS
-- =================================================================

DROP VIEW IF EXISTS kedge_practice.practice_statistics_view CASCADE;

-- =================================================================
-- DROP TRIGGERS
-- =================================================================

DROP TRIGGER IF EXISTS set_users_updated_at ON kedge_practice.users;
DROP TRIGGER IF EXISTS set_knowledge_points_updated_at ON kedge_practice.knowledge_points;
DROP TRIGGER IF EXISTS set_quizzes_updated_at ON kedge_practice.quizzes;
DROP TRIGGER IF EXISTS set_practice_sessions_updated_at ON kedge_practice.practice_sessions;
DROP TRIGGER IF EXISTS set_practice_answers_updated_at ON kedge_practice.practice_answers;
DROP TRIGGER IF EXISTS set_practice_strategies_updated_at ON kedge_practice.practice_strategies;
DROP TRIGGER IF EXISTS set_student_weaknesses_updated_at ON kedge_practice.student_weaknesses;
DROP TRIGGER IF EXISTS set_student_mistakes_updated_at ON kedge_practice.student_mistakes;
DROP TRIGGER IF EXISTS set_knowledge_points_metadata_updated_at ON kedge_practice.knowledge_points_metadata;
DROP TRIGGER IF EXISTS set_attachments_updated_at ON kedge_practice.attachments;

-- =================================================================
-- DROP INDEXES (automatically dropped with tables, but explicit for clarity)
-- =================================================================

-- Attachments indexes
DROP INDEX IF EXISTS kedge_practice.idx_attachments_created_at;
DROP INDEX IF EXISTS kedge_practice.idx_attachments_mime_type;
DROP INDEX IF EXISTS kedge_practice.idx_attachments_uploaded_by;
DROP INDEX IF EXISTS kedge_practice.idx_attachments_file_id;

-- Mistake tracking indexes
DROP INDEX IF EXISTS kedge_practice.idx_student_mistakes_review;
DROP INDEX IF EXISTS kedge_practice.idx_student_mistakes_quiz_id;
DROP INDEX IF EXISTS kedge_practice.idx_student_mistakes_user_id;

-- Weakness tracking indexes
DROP INDEX IF EXISTS kedge_practice.idx_student_weaknesses_score;
DROP INDEX IF EXISTS kedge_practice.idx_student_weaknesses_knowledge_point;
DROP INDEX IF EXISTS kedge_practice.idx_student_weaknesses_user_id;

-- Practice answers indexes
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_session_quiz;
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_quiz_id;
DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_session_id;

-- Practice sessions indexes
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_user_status;
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_created_at;
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_strategy;
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_status;
DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_user_id;

-- Quizzes indexes
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_created_at;
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_tags_gin;
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_knowledge_point_id;
DROP INDEX IF EXISTS kedge_practice.idx_quizzes_type;

-- Knowledge points indexes
DROP INDEX IF EXISTS kedge_practice.idx_knowledge_points_hierarchy;
DROP INDEX IF EXISTS kedge_practice.idx_knowledge_points_topic;

-- User indexes
DROP INDEX IF EXISTS kedge_practice.idx_users_preferences_gin;
DROP INDEX IF EXISTS kedge_practice.idx_users_role;
DROP INDEX IF EXISTS kedge_practice.idx_users_account_id;

-- =================================================================
-- DROP TABLES (in dependency order - dependent tables first)
-- =================================================================

-- Drop attachment table
DROP TABLE IF EXISTS kedge_practice.attachments CASCADE;

-- Drop metadata table
DROP TABLE IF EXISTS kedge_practice.knowledge_points_metadata CASCADE;

-- Drop practice system tables
DROP TABLE IF EXISTS kedge_practice.student_mistakes CASCADE;
DROP TABLE IF EXISTS kedge_practice.student_weaknesses CASCADE;
DROP TABLE IF EXISTS kedge_practice.practice_strategies CASCADE;
DROP TABLE IF EXISTS kedge_practice.practice_answers CASCADE;
DROP TABLE IF EXISTS kedge_practice.practice_sessions CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS kedge_practice.quizzes CASCADE;
DROP TABLE IF EXISTS kedge_practice.knowledge_points CASCADE;
DROP TABLE IF EXISTS kedge_practice.users CASCADE;

-- =================================================================
-- DROP FUNCTIONS
-- =================================================================

DROP FUNCTION IF EXISTS kedge_practice.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS kedge_practice.set_current_timestamp_updated_at() CASCADE;

-- =================================================================
-- DROP SCHEMA
-- =================================================================

-- Note: We don't drop the schema if it might contain other objects
-- Uncomment the following line only if you're sure the schema should be removed entirely
-- DROP SCHEMA IF EXISTS kedge_practice CASCADE;

-- =================================================================
-- DROP EXTENSIONS
-- =================================================================

-- Note: We don't drop pgcrypto as it might be used by other schemas
-- Uncomment only if you're certain no other schemas depend on it
-- DROP EXTENSION IF EXISTS pgcrypto;