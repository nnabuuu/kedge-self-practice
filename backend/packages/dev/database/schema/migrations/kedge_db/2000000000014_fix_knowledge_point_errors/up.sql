-- Fix errors in knowledge points data that were in the original migration
-- This ensures new deployments will have correct data

-- Fix kp_273: Should be about modern China, not Black Death
UPDATE kedge_practice.knowledge_points 
SET topic = '在应对风险挑战中推进各项事业',
    unit = '第十一单元 中国特色社会主义新时代',
    lesson = '第30课 新时代中国特色社会主义的伟大成就',
    sub = '第三子目 在应对风险挑战中推进各项事业'
WHERE id = 'kp_273';

-- Fix kp_276: Should be about modern China diplomacy, not workshops
UPDATE kedge_practice.knowledge_points 
SET topic = '中国特色大国外交和推动构建人类命运共同体',
    unit = '第十一单元 中国特色社会主义新时代',
    lesson = '第30课 新时代中国特色社会主义的伟大成就',
    sub = '第四子目 中国特色大国外交和推动构建人类命运共同体'
WHERE id = 'kp_276';

-- Fix kp_282: Should be in 纲要下 Unit 1, not 纲要上
UPDATE kedge_practice.knowledge_points 
SET topic = '古代文明的扩展',
    volume = '中外历史纲要下',
    unit = '第一单元 古代文明的产生与发展',
    lesson = '第2课 古代世界的帝国与文明的交流',
    sub = '第一子目 古代文明的扩展'
WHERE id = 'kp_282';

-- Fix kp_308: Should be in 纲要下 Unit 3, not 纲要上
UPDATE kedge_practice.knowledge_points 
SET topic = '人口迁移与物种交换',
    volume = '中外历史纲要下',
    unit = '第三单元 走向整体的世界',
    lesson = '第7课 全球联系的初步建立与世界格局的演变',
    sub = '第一子目 人口迁移与物种交换'
WHERE id = 'kp_308';

-- Fix kp_355: Was missing, should be 工业革命的背景
UPDATE kedge_practice.knowledge_points 
SET lesson = '第11课 马克思主义的诞生与传播',
    sub = '第一子目 工业革命的背景'
WHERE id = 'kp_355';

-- Fix kp_363: Remove quotes from topic "电气时代"
UPDATE kedge_practice.knowledge_points 
SET topic = '电气时代'
WHERE id = 'kp_363' AND topic = '"电气时代"';

-- Fix all items from kp_356 to kp_382 to be in Unit 5 (工业革命与马克思主义的诞生)
-- These were incorrectly placed in Unit 4
UPDATE kedge_practice.knowledge_points 
SET unit = '第五单元 工业革命与马克思主义的诞生',
    lesson = '第10课 影响世界的工业革命',
    sub = CASE 
        WHEN id IN ('kp_356', 'kp_357', 'kp_358', 'kp_359', 'kp_360', 'kp_361', 'kp_362', 'kp_363', 'kp_364', 'kp_365') THEN '第二子目 工业革命的进程'
        WHEN id IN ('kp_366', 'kp_367', 'kp_368', 'kp_369', 'kp_370', 'kp_371') THEN '第三子目 工业革命的影响'
    END
WHERE id IN ('kp_356', 'kp_357', 'kp_358', 'kp_359', 'kp_360', 'kp_361', 'kp_362', 'kp_363', 'kp_364', 'kp_365', 'kp_366', 'kp_367', 'kp_368', 'kp_369', 'kp_370', 'kp_371')
  AND volume = '中外历史纲要下';

UPDATE kedge_practice.knowledge_points 
SET unit = '第五单元 工业革命与马克思主义的诞生',
    lesson = '第11课 马克思主义的诞生与传播',
    sub = CASE 
        WHEN id IN ('kp_372', 'kp_373', 'kp_374', 'kp_375', 'kp_376', 'kp_377', 'kp_378') THEN '第一子目 早期工人运动与社会主义思想的萌发'
        WHEN id IN ('kp_379', 'kp_380') THEN '第二子目 马克思主义的诞生'
        WHEN id IN ('kp_381', 'kp_382') THEN '第三子目 国际工人运动的发展'
    END
WHERE id IN ('kp_372', 'kp_373', 'kp_374', 'kp_375', 'kp_376', 'kp_377', 'kp_378', 'kp_379', 'kp_380', 'kp_381', 'kp_382')
  AND volume = '中外历史纲要下';

-- Verification query
DO $$
DECLARE
  total_count INTEGER;
  unit5_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM kedge_practice.knowledge_points;
  SELECT COUNT(*) INTO unit5_count FROM kedge_practice.knowledge_points 
    WHERE unit = '第五单元 工业革命与马克思主义的诞生';
  
  IF total_count != 505 THEN
    RAISE EXCEPTION 'Expected 505 knowledge points, but found %', total_count;
  END IF;
  
  IF unit5_count != 28 THEN
    RAISE WARNING 'Unit 5 should have 28 items, but has %', unit5_count;
  END IF;
  
  RAISE NOTICE 'Knowledge points correction completed successfully';
END $$;