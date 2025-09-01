-- SQL script to fix any missing knowledge points and standardize volume names
-- This is a backup script in case the migration doesn't fully apply

-- Insert any missing knowledge points
INSERT INTO kedge_practice.knowledge_points (id, topic, volume, unit, lesson, sub) VALUES 
('kp_273', '黑死病的爆发与影响', '中外历史纲要上', '第五单元 晚明至清中叶的中国与世界', '第14课 清朝的鼎盛与危机', '第一子目 康乾盛世'),
('kp_276', '手工工场的发展', '中外历史纲要上', '第五单元 晚明至清中叶的中国与世界', '第14课 清朝的鼎盛与危机', '第二子目 经济与文化'),  
('kp_282', '农业商品化发展', '中外历史纲要上', '第六单元 晚清时期的内忧外患与救亡图存', '第15课 两次鸦片战争', '第一子目 第一次鸦片战争'),
('kp_308', '外交的失败', '中外历史纲要上', '第六单元 晚清时期的内忧外患与救亡图存', '第18课 挽救民族危亡的斗争', '第二子目 瓜分危机与民族觉醒'),
('kp_355', '工业革命的背景', '中外历史纲要下', '第五单元 工业革命与马克思主义的诞生', '第11课 马克思主义的诞生与传播', '第一子目 工业革命的背景')
ON CONFLICT (id) DO UPDATE SET 
  topic = EXCLUDED.topic,
  volume = EXCLUDED.volume,
  unit = EXCLUDED.unit,
  lesson = EXCLUDED.lesson,
  sub = EXCLUDED.sub;

-- Standardize volume names
UPDATE kedge_practice.knowledge_points SET volume = '中外历史纲要上' WHERE volume = '纲要上册';
UPDATE kedge_practice.knowledge_points SET volume = '中外历史纲要下' WHERE volume = '纲要下册';

-- Verify the results
SELECT 'Total knowledge points:' as info, COUNT(*) as count FROM kedge_practice.knowledge_points
UNION ALL
SELECT 'Distinct volumes:' as info, COUNT(DISTINCT volume) as count FROM kedge_practice.knowledge_points;