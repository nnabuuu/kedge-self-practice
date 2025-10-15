-- Drop the index on subject_id
DROP INDEX IF EXISTS kedge_practice.idx_knowledge_points_subject_id;

-- Remove the subject_id column from knowledge_points table
ALTER TABLE kedge_practice.knowledge_points
DROP COLUMN IF EXISTS subject_id;
