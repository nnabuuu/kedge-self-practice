-- Revert volume name changes for existing knowledge points
-- This migration doesn't delete knowledge points, only reverts the standardization
UPDATE kedge_practice.knowledge_points 
SET volume = '纲要上册',
    updated_at = NOW()
WHERE volume = '中外历史纲要上';

UPDATE kedge_practice.knowledge_points 
SET volume = '纲要下册',
    updated_at = NOW()
WHERE volume = '中外历史纲要下';

-- Note: If you need to completely remove all knowledge points, uncomment the following:
-- DELETE FROM kedge_practice.knowledge_points WHERE id LIKE 'kp_%';