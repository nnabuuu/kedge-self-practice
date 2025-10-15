-- Add subject_id column to knowledge_points table (if not exists)
ALTER TABLE kedge_practice.knowledge_points
ADD COLUMN IF NOT EXISTS subject_id VARCHAR(255);

-- Populate existing records with 'history' as they are all from the history textbook
UPDATE kedge_practice.knowledge_points
SET subject_id = 'history'
WHERE subject_id IS NULL;

-- Add index on subject_id for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_knowledge_points_subject_id
ON kedge_practice.knowledge_points(subject_id);

-- Add NOT NULL constraint after populating data (if not already set)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'kedge_practice'
    AND table_name = 'knowledge_points'
    AND column_name = 'subject_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE kedge_practice.knowledge_points
    ALTER COLUMN subject_id SET NOT NULL;
  END IF;
END $$;
