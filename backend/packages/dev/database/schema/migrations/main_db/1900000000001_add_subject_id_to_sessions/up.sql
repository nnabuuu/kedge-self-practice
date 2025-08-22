-- Add subject_id column to practice_sessions table
ALTER TABLE kedge_practice.practice_sessions
ADD COLUMN IF NOT EXISTS subject_id VARCHAR(100);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_subject_id 
ON kedge_practice.practice_sessions(subject_id);

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.practice_sessions.subject_id IS 'The ID of the subject for this practice session';