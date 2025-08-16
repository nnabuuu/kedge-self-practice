-- Sample quiz questions with knowledge_point_id references
-- These quizzes reference the actual knowledge point IDs from the Excel file

-- Quiz for kp_1: 旧石器时代与新石器文明
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '长江流域是中华文明的发源地之一，能为以上认识提供的考古学证据是（ ）', 
 '["仰韶文化 半坡遗址", "红山文化 牛河梁遗址", "龙山文化 陶寺遗址", "良渚文化 良渚古城遗址"]', 
 '"良渚文化 良渚古城遗址"', 'kp_1', '["新石器时代", "良渚文化", "长江流域"]');

-- Quiz for kp_5: 商朝的统治
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '商朝政治制度的特点不包括（ ）', 
 '["君主专制", "血缘纽带", "等级制度", "郡县制"]', 
 '"郡县制"', 'kp_5', '["商朝", "政治制度", "血缘关系"]');

-- Quiz for kp_6: 西周的政治制度
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '西周时期，为了进行有效的统治实行了分封制度，分封制度的对象包括①同姓亲族 ②功臣 ③古代帝王的后代 ④平民（ ）', 
 '["①②③", "②③④", "①②④", "①②③④"]', 
 '"①②③"', 'kp_6', '["西周", "分封制", "政治制度"]');

-- Quiz for kp_11: 商鞅变法
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '商鞅变法的核心内容是（ ）', 
 '["建立郡县制", "奖励耕战", "统一度量衡", "焚书坑儒"]', 
 '"奖励耕战"', 'kp_11', '["商鞅变法", "秦国", "政治改革"]');

-- Quiz for kp_12: 孔子的思想
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '孔子思想的核心是（ ）', 
 '["仁", "礼", "义", "智"]', 
 '"仁"', 'kp_12', '["孔子", "儒家思想", "仁"]');

-- Quiz for kp_17: 秦统一的条件和过程
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '秦能够统一六国的根本原因是（ ）', 
 '["军事力量强大", "外交手段高明", "经济实力雄厚", "政治制度先进"]', 
 '"政治制度先进"', 'kp_17', '["秦统一", "政治制度", "历史原因"]');

-- Quiz for kp_22: 焚书坑儒
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '秦始皇"焚书坑儒"的主要目的是（ ）', 
 '["消灭儒家学派", "统一思想文化", "发展法家思想", "打击政治对手"]', 
 '"统一思想文化"', 'kp_22', '["焚书坑儒", "秦始皇", "思想统一"]');

-- Quiz for kp_26: "文景之治"
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '"文景之治"的主要特点是（ ）', 
 '["加强中央集权", "休养生息", "对外征战", "重用外戚"]', 
 '"休养生息"', 'kp_26', '["文景之治", "西汉", "治国方针"]');

-- Quiz for kp_53: 科举制
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '科举制正式确立于（ ）', 
 '["隋文帝时期", "隋炀帝时期", "唐太宗时期", "唐高宗时期"]', 
 '"隋炀帝时期"', 'kp_53', '["科举制", "隋朝", "选官制度"]');

-- Quiz for kp_70: 王安石变法的目的与内容
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('multiple-choice', '王安石变法的内容包括（ ）', 
 '["青苗法", "募役法", "市易法", "保甲法"]', 
 '["青苗法", "募役法", "市易法", "保甲法"]', 'kp_70', '["王安石变法", "北宋", "政治改革"]');

-- Quiz for kp_144: 虎门销烟
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '林则徐虎门销烟的历史意义在于（ ）', 
 '["开启了中国近代化进程", "显示了中华民族反抗外来侵略的坚强意志", "促进了洋务运动的兴起", "推动了戊戌变法的发生"]', 
 '"显示了中华民族反抗外来侵略的坚强意志"', 'kp_144', '["虎门销烟", "林则徐", "反抗侵略"]');

-- Quiz for kp_207: 五四运动
INSERT INTO kedge_practice.quizzes (type, question, options, answer, knowledge_point_id, tags) VALUES
('single-choice', '五四运动的导火索是（ ）', 
 '["巴黎和会中国外交失败", "北洋政府镇压学生", "帝国主义瓜分中国", "新文化运动的影响"]', 
 '"巴黎和会中国外交失败"', 'kp_207', '["五四运动", "巴黎和会", "爱国运动"]');