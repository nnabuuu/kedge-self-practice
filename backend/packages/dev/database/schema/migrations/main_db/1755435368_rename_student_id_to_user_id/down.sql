-- Revert: Rename user_id column back to student_id
ALTER TABLE kedge_practice.practice_sessions 
RENAME COLUMN user_id TO student_id;

-- Revert the foreign key constraint name
ALTER TABLE kedge_practice.practice_sessions
DROP CONSTRAINT IF EXISTS practice_sessions_user_id_fkey;

ALTER TABLE kedge_practice.practice_sessions
ADD CONSTRAINT practice_sessions_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES kedge_practice.users(id);

-- Remove the comment
COMMENT ON COLUMN kedge_practice.practice_sessions.student_id IS NULL;