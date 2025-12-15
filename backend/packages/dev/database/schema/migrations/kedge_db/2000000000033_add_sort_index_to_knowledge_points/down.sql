-- Revert sort_index addition to knowledge_points table

-- Drop the index first
DROP INDEX IF EXISTS kedge_practice.idx_knowledge_points_sort_order;

-- Remove the column
ALTER TABLE kedge_practice.knowledge_points
DROP COLUMN IF EXISTS sort_index;
