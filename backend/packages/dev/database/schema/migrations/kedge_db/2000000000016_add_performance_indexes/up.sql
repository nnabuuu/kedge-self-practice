-- Performance indexes migration
-- These indexes have been manually applied to improve query performance
-- This migration verifies they exist

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    -- Count expected indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'kedge_practice'
    AND indexname IN (
        'idx_practice_sessions_user_created',
        'idx_practice_answers_created_at',
        'idx_users_created_at',
        'idx_practice_answers_session_correct',
        'idx_practice_answers_quiz_correct',
        'idx_practice_sessions_completed',
        'idx_practice_answers_time_spent',
        'idx_quizzes_kp_type'
    );
    
    -- Log the result
    RAISE NOTICE 'Found % performance indexes out of 8 expected', index_count;
    
    -- Note: Indexes have been manually applied to the production database
    -- This migration serves as documentation of the indexes that should exist
END $$;