-- Rollback leaderboard optimization
DO $$
DECLARE
    sql_command TEXT;
BEGIN
    -- Remove indexes
    sql_command := 'DROP INDEX IF EXISTS ' || quote_ident('kedge_practice') || '.idx_practice_answers_user_correct';
    EXECUTE sql_command;
    
    sql_command := 'DROP INDEX IF EXISTS ' || quote_ident('kedge_practice') || '.idx_practice_answers_user_created';
    EXECUTE sql_command;
    
    sql_command := 'DROP INDEX IF EXISTS ' || quote_ident('kedge_practice') || '.idx_practice_answers_user_quiz';
    EXECUTE sql_command;
    
    -- Note: We don't remove the user_id column as it may contain data
    
    RAISE NOTICE 'Rolled back leaderboard indexes';
END $$;