-- =================================================================
-- FIX VOLUME NAMES MIGRATION
-- =================================================================
-- This migration updates remaining knowledge points with old volume names
-- Changes: 纲要上册 → 中外历史纲要上, 纲要下册 → 中外历史纲要下
-- =================================================================

-- Update all knowledge points with volume '纲要上册' to '中外历史纲要上'
UPDATE kedge_practice.knowledge_points 
SET volume = '中外历史纲要上', updated_at = NOW()
WHERE volume = '纲要上册';

-- Update all knowledge points with volume '纲要下册' to '中外历史纲要下'
UPDATE kedge_practice.knowledge_points 
SET volume = '中外历史纲要下', updated_at = NOW()
WHERE volume = '纲要下册';

-- Verify the update
DO $$
DECLARE
  old_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count 
  FROM kedge_practice.knowledge_points 
  WHERE volume IN ('纲要上册', '纲要下册');
  
  IF old_count > 0 THEN
    RAISE WARNING 'Found % knowledge points with old volume names after update', old_count;
  ELSE
    RAISE NOTICE 'Successfully updated all volume names';
  END IF;
END $$;