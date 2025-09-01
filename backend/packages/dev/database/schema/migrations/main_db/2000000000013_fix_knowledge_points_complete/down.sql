-- =================================================================
-- REVERT KNOWLEDGE POINTS MIGRATION
-- =================================================================
-- This reverts the knowledge points to their previous state
-- Note: This is provided for completeness but should be used carefully
-- =================================================================

-- Since we don't have the original data, we can't fully revert
-- The best we can do is remove the newly added knowledge points

DELETE FROM kedge_practice.knowledge_points 
WHERE id IN ('kp_355', 'kp_501', 'kp_502', 'kp_503', 'kp_504', 'kp_505');

-- Note: This doesn't restore the original content of the other knowledge points
-- A full restoration would require a backup of the original data