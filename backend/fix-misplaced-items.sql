-- Fix misplaced knowledge point items that were in wrong units/volumes

-- Fix kp_273: Was incorrectly "黑死病的爆发与影响" in Unit 5, should be about modern China
UPDATE kedge_practice.knowledge_points 
SET topic = '在应对风险挑战中推进各项事业',
    unit = '第十一单元 中国特色社会主义新时代',
    lesson = '第30课 新时代中国特色社会主义的伟大成就',
    sub = '第三子目 在应对风险挑战中推进各项事业'
WHERE id = 'kp_273';

-- Fix kp_276: Was incorrectly "手工工场的发展" in Unit 5, should be about modern China
UPDATE kedge_practice.knowledge_points 
SET topic = '中国特色大国外交和推动构建人类命运共同体',
    unit = '第十一单元 中国特色社会主义新时代',
    lesson = '第30课 新时代中国特色社会主义的伟大成就',
    sub = '第四子目 中国特色大国外交和推动构建人类命运共同体'
WHERE id = 'kp_276';

-- Fix kp_282: Was incorrectly in 纲要上 Unit 6, should be in 纲要下 Unit 1
UPDATE kedge_practice.knowledge_points 
SET topic = '古代文明的扩展',
    volume = '中外历史纲要下',
    unit = '第一单元 古代文明的产生与发展',
    lesson = '第2课 古代世界的帝国与文明的交流',
    sub = '第一子目 古代文明的扩展'
WHERE id = 'kp_282';

-- Fix kp_308: Was incorrectly in 纲要上 Unit 6, should be in 纲要下 Unit 3
UPDATE kedge_practice.knowledge_points 
SET topic = '人口迁移与物种交换',
    volume = '中外历史纲要下',
    unit = '第三单元 走向整体的世界',
    lesson = '第7课 全球联系的初步建立与世界格局的演变',
    sub = '第一子目 人口迁移与物种交换'
WHERE id = 'kp_308';

-- Verify the fixes
SELECT 'Fixed items:' as info;
SELECT id, topic, volume, unit FROM kedge_practice.knowledge_points 
WHERE id IN ('kp_273', 'kp_276', 'kp_282', 'kp_308')
ORDER BY id;