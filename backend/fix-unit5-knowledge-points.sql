-- Fix Unit 5 knowledge points that were incorrectly placed in Unit 4
-- These are all related to Industrial Revolution and Marxism

-- Update Lesson 10: 影响世界的工业革命
UPDATE kedge_practice.knowledge_points 
SET unit = '第五单元 工业革命与马克思主义的诞生',
    lesson = '第10课 影响世界的工业革命',
    sub = CASE 
        WHEN id = 'kp_355' THEN '第一子目 工业革命的背景'
        WHEN id IN ('kp_356', 'kp_357', 'kp_358', 'kp_359', 'kp_360', 'kp_361', 'kp_362', 'kp_363', 'kp_364', 'kp_365') THEN '第二子目 工业革命的进程'
        WHEN id IN ('kp_366', 'kp_367', 'kp_368', 'kp_369', 'kp_370', 'kp_371') THEN '第三子目 工业革命的影响'
    END
WHERE id IN ('kp_356', 'kp_357', 'kp_358', 'kp_359', 'kp_360', 'kp_361', 'kp_362', 'kp_364', 'kp_365', 'kp_366', 'kp_367', 'kp_368', 'kp_369', 'kp_370', 'kp_371');

-- Update Lesson 11: 马克思主义的诞生与传播
UPDATE kedge_practice.knowledge_points 
SET unit = '第五单元 工业革命与马克思主义的诞生',
    lesson = '第11课 马克思主义的诞生与传播',
    sub = CASE 
        WHEN id IN ('kp_372', 'kp_373', 'kp_374', 'kp_375', 'kp_376', 'kp_377', 'kp_378') THEN '第一子目 早期工人运动与社会主义思想的萌发'
        WHEN id IN ('kp_379', 'kp_380') THEN '第二子目 马克思主义的诞生'
        WHEN id IN ('kp_381', 'kp_382') THEN '第三子目 国际工人运动的发展'
    END
WHERE id IN ('kp_372', 'kp_373', 'kp_374', 'kp_375', 'kp_376', 'kp_377', 'kp_378', 'kp_379', 'kp_380', 'kp_381', 'kp_382');

-- Verify the updates
SELECT 'Unit 5 should have 28 items:' as info;
SELECT COUNT(*) as count FROM kedge_practice.knowledge_points 
WHERE unit = '第五单元 工业革命与马克思主义的诞生';

SELECT 'Items in Lesson 10:' as info;
SELECT id, topic, sub FROM kedge_practice.knowledge_points 
WHERE lesson = '第10课 影响世界的工业革命'
ORDER BY id;

SELECT 'Items in Lesson 11:' as info;
SELECT id, topic, sub FROM kedge_practice.knowledge_points 
WHERE lesson = '第11课 马克思主义的诞生与传播'
ORDER BY id;