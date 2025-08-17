-- Rename student_id column to user_id in practice_sessions table
ALTER TABLE kedge_practice.practice_sessions 
RENAME COLUMN student_id TO user_id;

-- Update the foreign key constraint name for clarity
ALTER TABLE kedge_practice.practice_sessions
DROP CONSTRAINT IF EXISTS practice_sessions_student_id_fkey;

ALTER TABLE kedge_practice.practice_sessions
ADD CONSTRAINT practice_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES kedge_practice.users(id);

-- Add comment to clarify the column can be used for any user type
COMMENT ON COLUMN kedge_practice.practice_sessions.user_id IS 'User ID (can be student, teacher, or any user type)';