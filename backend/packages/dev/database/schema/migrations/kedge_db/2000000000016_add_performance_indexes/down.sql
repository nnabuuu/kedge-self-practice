-- Remove performance indexes
-- Note: These indexes improve query performance and should normally not be removed

DO $$
BEGIN
    -- This is a rollback migration for the performance indexes
    -- The actual DROP commands are commented out to prevent accidental removal
    -- Uncomment only if you really need to remove these indexes
    
    /*
    DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_user_created;
    DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_created_at;
    DROP INDEX IF EXISTS kedge_practice.idx_users_created_at;
    DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_session_correct;
    DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_quiz_correct;
    DROP INDEX IF EXISTS kedge_practice.idx_practice_sessions_completed;
    DROP INDEX IF EXISTS kedge_practice.idx_practice_answers_time_spent;
    DROP INDEX IF EXISTS kedge_practice.idx_quizzes_kp_type;
    */
    
    RAISE NOTICE 'Performance indexes rollback placeholder - indexes preserved for performance';
END $$;