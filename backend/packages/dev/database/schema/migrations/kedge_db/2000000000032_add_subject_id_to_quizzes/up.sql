-- Add subject_id column to quizzes table (if not exists)
ALTER TABLE kedge_practice.quizzes
ADD COLUMN IF NOT EXISTS subject_id VARCHAR(255);

-- Populate existing records with 'history' as all current quizzes are history questions
UPDATE kedge_practice.quizzes
SET subject_id = 'history'
WHERE subject_id IS NULL;

-- Add index on subject_id for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id
ON kedge_practice.quizzes(subject_id);

-- Add NOT NULL constraint after populating data (if not already set)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kedge_practice'
    AND table_name = 'quizzes'
    AND column_name = 'subject_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE kedge_practice.quizzes
    ALTER COLUMN subject_id SET NOT NULL;
  END IF;
END $$;

-- Add comment to document the purpose of this column
COMMENT ON COLUMN kedge_practice.quizzes.subject_id IS 'The ID of the subject this quiz belongs to (e.g., history, biology)';
