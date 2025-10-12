-- Add extra_properties column to quizzes table for quiz-type-specific metadata
-- This JSONB field allows different quiz types to store custom properties
-- For fill-in-the-blank: order-independent-groups (2D array of blank indices that can swap)
ALTER TABLE kedge_practice.quizzes
ADD COLUMN IF NOT EXISTS extra_properties JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN kedge_practice.quizzes.extra_properties IS 'JSON object for quiz-type-specific metadata. For fill-in-the-blank: order-independent-groups [[0,1], [3,4]] defines which blank indices can be answered in any order';

-- Create index for better query performance on JSONB field
CREATE INDEX IF NOT EXISTS idx_quizzes_extra_properties
ON kedge_practice.quizzes USING gin (extra_properties);
