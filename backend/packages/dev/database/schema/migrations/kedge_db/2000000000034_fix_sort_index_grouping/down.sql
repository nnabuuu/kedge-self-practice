-- Revert to previous (topic, volume) grouping

-- Recreate original index
DROP INDEX IF EXISTS kedge_practice.idx_knowledge_points_sort_order;

CREATE INDEX idx_knowledge_points_sort_order
ON kedge_practice.knowledge_points(topic, volume, sort_index);

-- Recalculate sort_index with original grouping
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY topic, volume
    ORDER BY id
  ) as rn
  FROM kedge_practice.knowledge_points
)
UPDATE kedge_practice.knowledge_points kp
SET sort_index = ranked.rn
FROM ranked
WHERE kp.id = ranked.id;
