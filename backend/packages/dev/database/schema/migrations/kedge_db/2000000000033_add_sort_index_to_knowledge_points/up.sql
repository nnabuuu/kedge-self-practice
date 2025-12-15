-- Add sort_index column to knowledge_points table for proper ordering of Chinese curriculum units
-- (e.g., 第一单元, 第二单元, 第三单元) that don't sort correctly as strings

-- Add the sort_index column with default 0 for backwards compatibility
ALTER TABLE kedge_practice.knowledge_points
ADD COLUMN IF NOT EXISTS sort_index INTEGER DEFAULT 0;

-- Add composite index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_knowledge_points_sort_order
ON kedge_practice.knowledge_points(topic, volume, sort_index);

-- Populate existing records with sort_index based on ID order within each topic/volume group
-- This preserves the current insertion order for existing data
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY topic, volume
    ORDER BY id
  ) as rn
  FROM kedge_practice.knowledge_points
  WHERE sort_index = 0 OR sort_index IS NULL
)
UPDATE kedge_practice.knowledge_points kp
SET sort_index = ranked.rn
FROM ranked
WHERE kp.id = ranked.id;

COMMENT ON COLUMN kedge_practice.knowledge_points.sort_index IS 'Explicit ordering for knowledge points within the same topic/volume group. Used for correct Chinese ordinal sorting.';
