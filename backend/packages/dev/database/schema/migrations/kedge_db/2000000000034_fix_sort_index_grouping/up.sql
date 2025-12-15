-- Fix sort_index grouping: should be partitioned by (volume, unit) not (topic, volume)
-- This ensures proper ordering of knowledge points within each unit

-- Reset and recalculate sort_index based on (volume, unit) grouping
-- Order by id within each group to preserve insertion order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY volume, unit
    ORDER BY id
  ) as rn
  FROM kedge_practice.knowledge_points
)
UPDATE kedge_practice.knowledge_points kp
SET sort_index = ranked.rn
FROM ranked
WHERE kp.id = ranked.id;

-- Update the index to match the new grouping strategy
DROP INDEX IF EXISTS kedge_practice.idx_knowledge_points_sort_order;

CREATE INDEX idx_knowledge_points_sort_order
ON kedge_practice.knowledge_points(volume, unit, sort_index);
