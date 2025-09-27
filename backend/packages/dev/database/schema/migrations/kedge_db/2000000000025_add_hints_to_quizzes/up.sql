-- Add hints column to quizzes table for fill-in-the-blank questions
-- Hints provide contextual guidance like "人名", "朝代", "年份" without revealing answers

-- Add hints column as JSONB to store array of nullable strings
ALTER TABLE kedge_practice.quizzes 
ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT NULL;

-- Add index for efficient hint queries (e.g., finding quizzes with/without hints)
CREATE INDEX IF NOT EXISTS idx_quizzes_hints 
ON kedge_practice.quizzes USING GIN (hints)
WHERE hints IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.quizzes.hints IS 
'Hints for fill-in-the-blank questions. Array of strings where each element corresponds to a blank. 
Null elements indicate no hint for that blank. Example: ["人名", "朝代", null] for 3 blanks.';