-- Add explanation column to quizzes table
ALTER TABLE kedge_practice.quizzes 
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add index for filtering quizzes with explanations (performance optimization)
CREATE INDEX IF NOT EXISTS idx_quizzes_has_explanation 
ON kedge_practice.quizzes((explanation IS NOT NULL));

-- Add comment to document the column purpose
COMMENT ON COLUMN kedge_practice.quizzes.explanation IS 'Educational explanation shown to students when they answer incorrectly, helps them understand why the answer is correct';