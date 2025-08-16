// API Mock Service - 模拟真实API调用
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';

// 模拟网络延迟
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟API响应格式
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// 创建标准API响应
const createApiResponse = <T>(data: T, success: boolean = true, message?: string): ApiResponse<T> => ({
  success,
  data,
  message,
  timestamp: new Date().toISOString()
});

// 模拟数据存储
class MockDataStore {
  private subjects: Subject[] = [
    {
      id: 'history',
      name: '历史',
      icon: 'Scroll',
      color: 'bg-amber-500'
    },
    {
      id: 'biology',
      name: '生物',
      icon: 'Dna',
      color: 'bg-green-500'
    }
  ];

  private knowledgePoints: KnowledgePoint[] = [
    // 历史知识点 - Updated to match backend IDs
    {
      "id": "kp_1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第一子目 石器时代的古人类和文化遗存",
      "topic": "旧石器时代与新石器文明"
    },
    {
      "id": "HIST-1-1-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第一子目 石器时代的古人类和文化遗存",
      "topic": "旧石器时代与新石器文明"
    },
    {
      "id": "HIST-1-1-1-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第一子目 石器时代的古人类和文化遗存",
      "topic": "中华文明起源的考古学证据"
    },
    {
      "id": "HIST-1-1-2-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第二子目 夏商周的政治制度",
      "topic": "夏朝的建立与政治制度"
    },
    {
      "id": "HIST-1-1-2-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第二子目 夏商周的政治制度",
      "topic": "商朝的政治制度与甲骨文"
    },
    {
      "id": "HIST-1-1-2-3",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第二子目 夏商周的政治制度",
      "topic": "西周的分封制与宗法制"
    },
    {
      "id": "HIST-1-2-1-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第2课 诸侯纷争与变法运动",
      "section": "第一子目 春秋战国的政治格局",
      "topic": "春秋五霸与政治变革"
    },
    {
      "id": "HIST-1-2-1-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第2课 诸侯纷争与变法运动",
      "section": "第一子目 春秋战国的政治格局",
      "topic": "战国七雄与兼并战争"
    },
    {
      "id": "HIST-1-2-2-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第2课 诸侯纷争与变法运动",
      "section": "第二子目 春秋战国时期的变法运动",
      "topic": "商鞅变法与秦国崛起"
    },
    {
      "id": "HIST-1-2-2-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第2课 诸侯纷争与变法运动",
      "section": "第二子目 春秋战国时期的变法运动",
      "topic": "其他各国的变法运动"
    },
    {
      "id": "HIST-1-3-1-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第3课 秦统一多民族封建国家的建立",
      "section": "第一子目 秦的统一",
      "topic": "秦始皇统一六国"
    },
    {
      "id": "HIST-1-3-1-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第3课 秦统一多民族封建国家的建立",
      "section": "第一子目 秦的统一",
      "topic": "秦朝的政治制度创新"
    },
    {
      "id": "HIST-1-3-2-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第3课 秦统一多民族封建国家的建立",
      "section": "第二子目 秦朝的统一措施",
      "topic": "文字、货币、度量衡的统一"
    },
    {
      "id": "HIST-1-3-2-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第3课 秦统一多民族封建国家的建立",
      "section": "第二子目 秦朝的统一措施",
      "topic": "郡县制的推行"
    },
    {
      "id": "HIST-2-1-1-1",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第二单元 三国两晋南北朝的民族交融与隋唐统一多民族封建国家的发展",
      "lesson": "第4课 西汉与东汉——统一多民族封建国家的巩固",
      "section": "第一子目 西汉的建立与发展",
      "topic": "汉高祖刘邦建立西汉"
    },
    {
      "id": "HIST-2-1-1-2",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第二单元 三国两晋南北朝的民族交融与隋唐统一多民族封建国家的发展",
      "lesson": "第4课 西汉与东汉——统一多民族封建国家的巩固",
      "section": "第一子目 西汉的建立与发展",
      "topic": "文景之治与汉武帝的统治"
    },
    
    // 生物知识点
    {
      "id": "BIO-1-1-1",
      "subjectId": "biology",
      "volume": "生物学必修1 分子与细胞",
      "unit": "第一章 走近细胞",
      "lesson": "第1节 细胞是生命活动的基本单位",
      "section": "第一子目 细胞的发现",
      "topic": "细胞的发现及细胞学说的建立"
    },
    {
      "id": "BIO-1-1-2",
      "subjectId": "biology",
      "volume": "生物学必修1 分子与细胞",
      "unit": "第一章 走近细胞",
      "lesson": "第2节 细胞的多样性和统一性",
      "section": "第一子目 细胞的基本结构",
      "topic": "原核细胞和真核细胞的结构特点"
    },
    {
      "id": "BIO-1-2-1",
      "subjectId": "biology",
      "volume": "生物学必修1 分子与细胞",
      "unit": "第二章 组成细胞的分子",
      "lesson": "第1节 细胞中的元素和化合物",
      "section": "第一子目 细胞中的元素",
      "topic": "组成细胞的主要元素和化合物"
    },
    {
      "id": "BIO-1-2-2",
      "subjectId": "biology",
      "volume": "生物学必修1 分子与细胞",
      "unit": "第二章 组成细胞的分子",
      "lesson": "第2节 生命活动的主要承担者——蛋白质",
      "section": "第一子目 蛋白质的结构",
      "topic": "蛋白质的结构和功能"
    },
    {
      "id": "BIO-1-2-3",
      "subjectId": "biology",
      "volume": "生物学必修1 分子与细胞",
      "unit": "第二章 组成细胞的分子",
      "lesson": "第3节 遗传信息的载体——核酸",
      "section": "第一子目 核酸的种类和结构",
      "topic": "DNA和RNA的结构与功能"
    },
    {
      "id": "BIO-1-3-1",
      "subjectId": "biology",
      "volume": "生物学必修1 分子与细胞",
      "unit": "第三章 细胞的基本结构",
      "lesson": "第1节 细胞膜的结构和功能",
      "section": "第一子目 细胞膜的结构特点",
      "topic": "细胞膜的结构特点"
    },
    {
      "id": "BIO-2-1-1",
      "subjectId": "biology",
      "volume": "生物学必修2 遗传与进化",
      "unit": "第一章 遗传因子的发现",
      "lesson": "第1节 孟德尔的豌豆杂交实验",
      "section": "第一子目 基因分离定律",
      "topic": "基因的分离定律"
    },
    {
      "id": "BIO-2-1-2",
      "subjectId": "biology",
      "volume": "生物学必修2 遗传与进化",
      "unit": "第一章 遗传因子的发现",
      "lesson": "第2节 孟德尔的豌豆杂交实验",
      "section": "第一子目 基因自由组合定律",
      "topic": "基因的自由组合定律"
    },
    {
      "id": "BIO-2-2-1",
      "subjectId": "biology",
      "volume": "生物学必修2 遗传与进化",
      "unit": "第二章 基因和染色体的关系",
      "lesson": "第1节 减数分裂和受精作用",
      "section": "第一子目 减数分裂过程",
      "topic": "减数分裂的过程和意义"
    },
    {
      "id": "BIO-2-2-2",
      "subjectId": "biology",
      "volume": "生物学必修2 遗传与进化",
      "unit": "第二章 基因和染色体的关系",
      "lesson": "第2节 基因在染色体上",
      "section": "第一子目 基因定位",
      "topic": "基因与染色体的关系"
    },
    // Backend-compatible knowledge points for quiz associations
    {
      "id": "kp_5",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第二子目 夏商周的政治制度",
      "topic": "商朝的统治"
    },
    {
      "id": "kp_6",
      "subjectId": "history",
      "volume": "中外历史纲要上", 
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第1课 中华文明的起源与早期国家",
      "section": "第二子目 夏商周的政治制度",
      "topic": "西周的政治制度"
    },
    {
      "id": "kp_11",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第2课 诸侯纷争与变法运动",
      "section": "第二子目 战国时期的变法",
      "topic": "商鞅变法"
    },
    {
      "id": "kp_12",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第2课 诸侯纷争与变法运动",
      "section": "第三子目 春秋战国时期的思想文化",
      "topic": "孔子的思想"
    },
    {
      "id": "kp_17",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第3课 秦统一多民族封建国家的建立",
      "section": "第一子目 秦的统一",
      "topic": "秦统一的条件和过程"
    },
    {
      "id": "kp_22",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第3课 秦统一多民族封建国家的建立",
      "section": "第二子目 秦朝的政治制度",
      "topic": "焚书坑儒"
    },
    {
      "id": "kp_26",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固",
      "lesson": "第4课 西汉与东汉——统一多民族封建国家的巩固",
      "section": "第一子目 西汉的政治制度",
      "topic": "\"文景之治\""
    },
    {
      "id": "kp_53",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第二单元 中古时期的世界",
      "lesson": "第7课 隋唐制度的变化与创新",
      "section": "第二子目 隋唐的政治制度",
      "topic": "科举制"
    },
    {
      "id": "kp_70",
      "subjectId": "history",
      "volume": "中外历史纲要上",
      "unit": "第三单元 辽宋夏金元时期的制度变化与经济发展",
      "lesson": "第11课 辽宋夏金元的政治制度",
      "section": "第二子目 宋代的政治制度",
      "topic": "王安石变法的目的与内容"
    },
    {
      "id": "kp_144",
      "subjectId": "history",
      "volume": "中外历史纲要下",
      "unit": "第四单元 中国近代化的起步",
      "lesson": "第12课 鸦片战争",
      "section": "第一子目 第一次鸦片战争",
      "topic": "虎门销烟"
    },
    {
      "id": "kp_207",
      "subjectId": "history",
      "volume": "中外历史纲要下",
      "unit": "第五单元 从新民主主义革命到社会主义建设新时期",
      "lesson": "第17课 中国共产党成立与新民主主义革命兴起",
      "section": "第一子目 五四运动",
      "topic": "五四运动"
    }
  ];

  private quizQuestions: QuizQuestion[] = [
    // 历史单选题
    {
      "id": "HIST-Q1",
      "type": "single-choice",
      "question": "长江流域是中华文明的发源地之一，能为以上认识提供的考古学证据是（ ）",
      "options": {
        "A": "仰韶文化 半坡遗址",
        "B": "红山文化 牛河梁遗址",
        "C": "龙山文化 陶寺遗址",
        "D": "良渚文化 良渚古城遗址"
      },
      "answer": "D",
      "relatedKnowledgePointId": "kp_1"
    },
    {
      "id": "HIST-Q2",
      "type": "single-choice",
      "question": "西周时期，为了进行有效的统治实行了分封制度，分封制度的对象包括①同姓亲族  ②功臣  ③古代帝王的后代  ④平民（ ）",
      "options": {
        "A": "①②③",
        "B": "②③④",
        "C": "①②④",
        "D": "①②③④"
      },
      "answer": "A",
      "relatedKnowledgePointId": "kp_6"
    },
    {
      "id": "HIST-Q3",
      "type": "single-choice",
      "question": "有学者在论述中国古代某政治制度时指出，\"夫但论亲族之远近...\"，该学者论述的制度是（ ）",
      "options": {
        "A": "内外服制",
        "B": "分封制",
        "C": "宗法制",
        "D": "井田制"
      },
      "answer": "C",
      "relatedKnowledgePointId": "HIST-1-1-2-3"
    },
    {
      "id": "HIST-Q4",
      "type": "single-choice",
      "question": "中华文明起源时期的基本特征是（ ）",
      "options": {
        "A": "多元一体",
        "B": "分散孤立",
        "C": "百家争鸣",
        "D": "华夏认同"
      },
      "answer": "A",
      "relatedKnowledgePointId": "HIST-1-1-1-1"
    },
    {
      "id": "HIST-Q5",
      "type": "single-choice",
      "question": "有一处遗存展现了距今约5000年的父系氏族公社，以制作独特的\"蛋壳陶\"技术为文化特征。该文化遗存为（ ）",
      "options": {
        "A": "仰韶文化",
        "B": "河姆渡文化",
        "C": "龙山文化",
        "D": "良渚文化"
      },
      "answer": "C",
      "relatedKnowledgePointId": "HIST-1-1-1-1"
    },
    {
      "id": "HIST-Q6",
      "type": "single-choice",
      "question": "古代雅典民主政治的特点包括（ ）",
      "options": {
        "A": "全体居民都享有民主权利",
        "B": "实行代议制民主",
        "C": "公民直接参与政治决策",
        "D": "妇女享有完全的政治权利"
      },
      "answer": "C",
      "relatedKnowledgePointId": "HIST-1-2-1-1"
    },
    {
      "id": "HIST-Q7",
      "type": "single-choice",
      "question": "《十二铜表法》的历史意义在于（ ）",
      "options": {
        "A": "确立了人人平等的法律原则",
        "B": "成文法的出现限制了贵族的专横",
        "C": "保护了奴隶的基本权利",
        "D": "建立了完善的法律体系"
      },
      "answer": "B",
      "relatedKnowledgePointId": "HIST-1-2-2-1"
    },
    {
      "id": "HIST-Q8",
      "type": "single-choice",
      "question": "中国古代四大发明中，对世界文明发展影响最深远的是（ ）",
      "options": {
        "A": "造纸术",
        "B": "印刷术",
        "C": "指南针",
        "D": "火药"
      },
      "answer": "B",
      "relatedKnowledgePointId": "HIST-1-3-2-1"
    },

    // 历史多选题
    {
      "id": "HIST-M1",
      "type": "multiple-choice",
      "question": "中国古代政治制度的特点包括（ ）",
      "options": {
        "A": "皇权至上",
        "B": "中央集权",
        "C": "等级森严",
        "D": "民主决策"
      },
      "answer": ["A", "B", "C"],
      "relatedKnowledgePointId": "HIST-1-3-1-2"
    },
    {
      "id": "HIST-M2",
      "type": "multiple-choice",
      "question": "古代希腊民主政治的局限性表现在（ ）",
      "options": {
        "A": "只有成年男性公民享有政治权利",
        "B": "妇女被排除在政治生活之外",
        "C": "外邦人无法参与政治决策",
        "D": "奴隶享有完全的政治权利"
      },
      "answer": ["A", "B", "C"],
      "relatedKnowledgePointId": "HIST-1-2-1-1"
    },
    
    // Backend-compatible quiz questions matching seeded data
    {
      "id": "BACKEND-Q1",
      "type": "single-choice", 
      "question": "商朝政治制度的特点不包括（ ）",
      "options": {
        "A": "君主专制",
        "B": "血缘纽带", 
        "C": "等级制度",
        "D": "郡县制"
      },
      "answer": "D",
      "relatedKnowledgePointId": "kp_5"
    },
    {
      "id": "BACKEND-Q2", 
      "type": "single-choice",
      "question": "商鞅变法的核心内容是（ ）",
      "options": {
        "A": "建立郡县制",
        "B": "奖励耕战",
        "C": "统一度量衡", 
        "D": "焚书坑儒"
      },
      "answer": "B",
      "relatedKnowledgePointId": "kp_11"
    },
    {
      "id": "BACKEND-Q3",
      "type": "single-choice",
      "question": "孔子思想的核心是（ ）",
      "options": {
        "A": "仁",
        "B": "礼",
        "C": "义", 
        "D": "智"
      },
      "answer": "A",
      "relatedKnowledgePointId": "kp_12"
    },
    {
      "id": "BACKEND-Q4",
      "type": "single-choice", 
      "question": "秦能够统一六国的根本原因是（ ）",
      "options": {
        "A": "军事力量强大",
        "B": "外交手段高明",
        "C": "经济实力雄厚",
        "D": "政治制度先进"
      },
      "answer": "D",
      "relatedKnowledgePointId": "kp_17"
    },
    {
      "id": "BACKEND-Q5",
      "type": "single-choice",
      "question": "秦始皇\"焚书坑儒\"的主要目的是（ ）",
      "options": {
        "A": "消灭儒家学派",
        "B": "统一思想文化", 
        "C": "发展法家思想",
        "D": "打击政治对手"
      },
      "answer": "B",
      "relatedKnowledgePointId": "kp_22"
    },
    {
      "id": "BACKEND-Q6",
      "type": "single-choice",
      "question": "\"文景之治\"的主要特点是（ ）",
      "options": {
        "A": "加强中央集权",
        "B": "休养生息",
        "C": "对外征战",
        "D": "重用外戚"
      },
      "answer": "B", 
      "relatedKnowledgePointId": "kp_26"
    },
    {
      "id": "BACKEND-Q7",
      "type": "single-choice",
      "question": "科举制正式确立于（ ）",
      "options": {
        "A": "隋文帝时期",
        "B": "隋炀帝时期",
        "C": "唐太宗时期",
        "D": "唐高宗时期"
      },
      "answer": "B",
      "relatedKnowledgePointId": "kp_53"
    },
    {
      "id": "BACKEND-Q8",
      "type": "multiple-choice",
      "question": "王安石变法的内容包括（ ）",
      "options": {
        "A": "青苗法",
        "B": "募役法",
        "C": "市易法", 
        "D": "保甲法"
      },
      "answer": ["A", "B", "C", "D"],
      "relatedKnowledgePointId": "kp_70"
    },
    {
      "id": "BACKEND-Q9",
      "type": "single-choice",
      "question": "林则徐虎门销烟的历史意义在于（ ）",
      "options": {
        "A": "开启了中国近代化进程",
        "B": "显示了中华民族反抗外来侵略的坚强意志",
        "C": "促进了洋务运动的兴起",
        "D": "推动了戊戌变法的发生"
      },
      "answer": "B",
      "relatedKnowledgePointId": "kp_144"
    },
    {
      "id": "BACKEND-Q10",
      "type": "single-choice", 
      "question": "五四运动的导火索是（ ）",
      "options": {
        "A": "巴黎和会中国外交失败",
        "B": "北洋政府镇压学生",
        "C": "帝国主义瓜分中国",
        "D": "新文化运动的影响"
      },
      "answer": "A",
      "relatedKnowledgePointId": "kp_207"
    },

    // 生物问答题
    {
      "id": "BIO-Q1",
      "type": "essay",
      "question": "请分析细胞膜的结构特点，并说明这些结构特点是如何体现细胞膜功能的？",
      "standardAnswer": "细胞膜的结构特点主要包括：\n1. 磷脂双分子层结构：提供了膜的基本骨架，具有流动性，使膜具有一定的弹性和可塑性\n2. 蛋白质分子：包括载体蛋白、通道蛋白等，实现物质的跨膜运输\n3. 糖蛋白和糖脂：主要分布在膜外侧，参与细胞识别和信息传递\n\n这些结构特点体现功能的方式：\n- 磷脂双分子层的选择透过性：控制物质进出，维持细胞内环境稳定\n- 载体蛋白：实现主动运输和协助扩散\n- 通道蛋白：允许特定离子通过\n- 糖蛋白：参与细胞间识别和免疫反应\n- 膜的流动性：保证膜蛋白功能的正常发挥，适应细胞的各种生理活动",
      "standardStructure": "标准答案采用\"结构→功能→结构与功能关系\"的逻辑框架：\n1. 首先系统描述细胞膜的主要结构组成（磷脂双分子层、蛋白质、糖类）\n2. 然后分析每种结构的具体功能\n3. 最后阐述结构与功能的对应关系，体现生物学\"结构决定功能\"的基本原理\n4. 逻辑层次：总体结构→具体组分→功能分析→结构功能关系",
      "relatedKnowledgePointId": "BIO-1-3-1",
      "evaluationCriteria": {
        "结构描述": "是否准确、全面地描述了细胞膜的主要结构组成",
        "功能分析": "是否正确说明了各结构组分的具体功能",
        "逻辑条理": "论述是否逻辑清晰，层次分明，符合生物学思维",
        "知识运用": "是否体现了结构与功能相适应的生物学基本原理"
      }
    },
    {
      "id": "BIO-Q2",
      "type": "essay",
      "question": "某同学在观察洋葱鳞片叶表皮细胞时，发现细胞壁、细胞膜、细胞核等结构，但没有观察到叶绿体。请分析可能的原因，并说明如何改进实验以观察到更多的细胞器。",
      "standardAnswer": "没有观察到叶绿体的可能原因：\n1. 洋葱鳞片叶表皮细胞本身不含叶绿体：鳞片叶是储藏器官，主要进行储藏功能而非光合作用\n2. 观察部位选择不当：应选择绿色部分进行观察\n3. 显微镜倍数不够：叶绿体较小，需要高倍镜观察\n4. 光照条件不适宜：光线过强或过弱都会影响观察效果\n\n改进实验的方法：\n1. 更换实验材料：选择菠菜叶、韭菜叶等绿色叶片的下表皮\n2. 提高观察倍数：使用高倍物镜进行观察\n3. 调节光照：使用适宜的光照强度\n4. 制作更薄的切片：保证光线能够透过\n5. 使用特定染色剂：如碘液染色观察淀粉粒等",
      "standardStructure": "标准答案采用\"问题分析→解决方案\"的逻辑框架：\n1. 问题分析部分：从生物学原理、实验操作、仪器使用等多角度分析原因\n2. 解决方案部分：针对每个问题提出具体的改进措施\n3. 逻辑层次：理论分析→实践操作→技术改进\n4. 体现了科学探究的思维过程：发现问题→分析原因→提出解决方案",
      "relatedKnowledgePointId": "BIO-1-1-2",
      "evaluationCriteria": {
        "原因分析": "是否从多角度正确分析了没有观察到叶绿体的原因",
        "科学思维": "是否体现了科学探究和问题解决的思维过程",
        "实验设计": "改进方法是否科学合理，具有可操作性",
        "知识整合": "是否能将理论知识与实验实践有机结合"
      }
    },
    {
      "id": "BIO-Q3",
      "type": "essay",
      "question": "请比较原核细胞和真核细胞的主要区别，并举例说明各自的代表生物。",
      "standardAnswer": "原核细胞和真核细胞的主要区别：\n\n1. 细胞核结构：\n- 原核细胞：无真正的细胞核，遗传物质分散在细胞质中，无核膜包围\n- 真核细胞：有真正的细胞核，遗传物质被核膜包围\n\n2. 细胞器：\n- 原核细胞：无膜结构的细胞器，只有核糖体\n- 真核细胞：有多种膜结构细胞器，如线粒体、内质网、高尔基体等\n\n3. 遗传物质：\n- 原核细胞：DNA呈环状，无组蛋白结合\n- 真核细胞：DNA呈线状，与组蛋白结合形成染色体\n\n4. 细胞壁：\n- 原核细胞：主要成分是肽聚糖\n- 真核细胞：植物细胞壁主要是纤维素，真菌是几丁质\n\n代表生物：\n- 原核生物：细菌（如大肠杆菌）、蓝藻（如颤藻）\n- 真核生物：动物、植物、真菌（如酵母菌）",
      "standardStructure": "标准答案采用\"对比分析→举例说明\"的逻辑框架：\n1. 对比分析部分：按照细胞核、细胞器、遗传物质、细胞壁等维度系统比较\n2. 举例说明部分：选择典型代表生物进行说明\n3. 逻辑层次：结构对比→功能差异→生物分类\n4. 体现了比较分析的科学方法和分类学思维",
      "relatedKnowledgePointId": "BIO-1-1-2",
      "evaluationCriteria": {
        "对比分析": "是否系统、准确地比较了两种细胞类型的主要区别",
        "举例说明": "所举例子是否恰当、准确，能够支撑论点",
        "知识体系": "是否体现了细胞生物学的知识体系和分类思维",
        "表达条理": "内容组织是否清晰有序，逻辑性强"
      }
    },
    {
      "id": "BIO-Q4",
      "type": "essay",
      "question": "蛋白质是生命活动的主要承担者，请说明蛋白质的结构层次，并分析结构与功能的关系。",
      "standardAnswer": "蛋白质的结构层次：\n\n1. 一级结构：\n- 定义：氨基酸的排列顺序\n- 特点：由肽键连接，决定蛋白质的基本性质\n\n2. 二级结构：\n- 定义：肽链的局部空间结构\n- 主要类型：α螺旋、β折叠片\n- 维持力：氢键\n\n3. 三级结构：\n- 定义：整条肽链的空间结构\n- 维持力：氢键、离子键、二硫键、疏水作用等\n\n4. 四级结构：\n- 定义：多条肽链组成的蛋白质分子的空间结构\n- 例子：血红蛋白由4条肽链组成\n\n结构与功能的关系：\n1. 一级结构决定高级结构：氨基酸序列决定蛋白质的空间构象\n2. 空间结构决定功能：蛋白质的生物活性依赖于特定的空间结构\n3. 结构破坏导致功能丧失：高温、强酸强碱等会破坏蛋白质结构，使其失活\n4. 功能多样性源于结构多样性：不同的氨基酸组合产生不同功能的蛋白质",
      "standardStructure": "标准答案采用\"结构层次→功能关系\"的逻辑框架：\n1. 结构层次部分：按照一级到四级结构的顺序系统阐述\n2. 功能关系部分：从结构决定功能的角度分析两者关系\n3. 逻辑层次：基础结构→高级结构→结构功能关系→生物学意义\n4. 体现了生物大分子结构与功能相统一的基本原理",
      "relatedKnowledgePointId": "BIO-1-2-2",
      "evaluationCriteria": {
        "结构层次": "是否准确、完整地描述了蛋白质的各级结构特点",
        "功能关系": "是否正确分析了结构与功能的内在联系",
        "生物学原理": "是否体现了结构决定功能的生物学基本原理",
        "知识深度": "分析是否深入，体现生物学思维的严谨性"
      }
    },
    {
      "id": "BIO-Q5",
      "type": "essay",
      "question": "请说明基因的分离定律的内容，并分析其在遗传学中的重要意义。",
      "standardAnswer": "基因的分离定律内容：\n\n1. 基本内容：\n- 在生物的体细胞中，控制同一性状的遗传因子成对存在，不相融合\n- 在形成配子时，成对的遗传因子发生分离，分别进入不同的配子中\n- 受精时，雌雄配子的结合是随机的\n\n2. 现代表述：\n- 在杂合子的细胞中，位于一对同源染色体上的等位基因，具有一定的独立性\n- 在减数分裂形成配子的过程中，等位基因随着同源染色体的分开而分离\n- 分别进入两个配子中，独立地随配子遗传给后代\n\n重要意义：\n1. 理论意义：\n- 揭示了遗传的基本规律，奠定了遗传学的理论基础\n- 证明了遗传因子的颗粒性和独立性\n- 为现代基因理论的建立提供了重要依据\n\n2. 实践意义：\n- 指导动植物育种工作，提高育种效率\n- 为遗传病的预测和防治提供理论基础\n- 在医学遗传咨询中具有重要应用价值",
      "standardStructure": "标准答案采用\"定律内容→重要意义\"的逻辑框架：\n1. 定律内容部分：从经典表述到现代理解，层层深入\n2. 重要意义部分：分理论意义和实践意义两个层面\n3. 逻辑层次：基本概念→深入理解→理论价值→实践应用\n4. 体现了从具体到抽象，从理论到实践的认知规律",
      "relatedKnowledgePointId": "BIO-2-1-1",
      "evaluationCriteria": {
        "定律理解": "是否准确理解和表述基因分离定律的基本内容",
        "现代认识": "是否能用现代遗传学观点解释分离定律",
        "意义分析": "是否全面分析了分离定律的理论和实践意义",
        "知识应用": "是否能联系实际说明定律的应用价值"
      }
    }
  ];

  // 获取所有学科
  getSubjects(): Subject[] {
    return [...this.subjects];
  }

  // 根据学科ID获取知识点
  getKnowledgePointsBySubject(subjectId: string): KnowledgePoint[] {
    return this.knowledgePoints.filter(kp => kp.subjectId === subjectId);
  }

  // 根据知识点ID获取题目
  getQuestionsByKnowledgePoints(knowledgePointIds: string[]): QuizQuestion[] {
    return this.quizQuestions.filter(q => 
      knowledgePointIds.includes(q.relatedKnowledgePointId)
    );
  }

  // 根据ID获取单个知识点
  getKnowledgePointById(id: string): KnowledgePoint | undefined {
    return this.knowledgePoints.find(kp => kp.id === id);
  }

  // 根据ID获取单个题目
  getQuestionById(id: string): QuizQuestion | undefined {
    return this.quizQuestions.find(q => q.id === id);
  }

  // 添加新知识点
  addKnowledgePoint(knowledgePoint: Omit<KnowledgePoint, 'id'>): KnowledgePoint {
    const newKnowledgePoint: KnowledgePoint = {
      ...knowledgePoint,
      id: `KP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.knowledgePoints.push(newKnowledgePoint);
    return newKnowledgePoint;
  }

  // 添加新题目
  addQuestion(question: Omit<QuizQuestion, 'id'>): QuizQuestion {
    const newQuestion: QuizQuestion = {
      ...question,
      id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    this.quizQuestions.push(newQuestion);
    return newQuestion;
  }

  // 更新知识点
  updateKnowledgePoint(id: string, updates: Partial<KnowledgePoint>): KnowledgePoint | null {
    const index = this.knowledgePoints.findIndex(kp => kp.id === id);
    if (index === -1) return null;
    
    this.knowledgePoints[index] = { ...this.knowledgePoints[index], ...updates };
    return this.knowledgePoints[index];
  }

  // 更新题目
  updateQuestion(id: string, updates: Partial<QuizQuestion>): QuizQuestion | null {
    const index = this.quizQuestions.findIndex(q => q.id === id);
    if (index === -1) return null;
    
    this.quizQuestions[index] = { ...this.quizQuestions[index], ...updates };
    return this.quizQuestions[index];
  }

  // 删除知识点
  deleteKnowledgePoint(id: string): boolean {
    const index = this.knowledgePoints.findIndex(kp => kp.id === id);
    if (index === -1) return false;
    
    this.knowledgePoints.splice(index, 1);
    return true;
  }

  // 删除题目
  deleteQuestion(id: string): boolean {
    const index = this.quizQuestions.findIndex(q => q.id === id);
    if (index === -1) return false;
    
    this.quizQuestions.splice(index, 1);
    return true;
  }
}

// 创建数据存储实例
const dataStore = new MockDataStore();

// API 服务类
export class ApiService {
  // 获取所有学科
  static async getSubjects(): Promise<ApiResponse<Subject[]>> {
    await mockDelay(300);
    try {
      const subjects = dataStore.getSubjects();
      return createApiResponse(subjects);
    } catch (error) {
      return createApiResponse([], false, '获取学科列表失败');
    }
  }

  // 根据学科ID获取知识点
  static async getKnowledgePointsBySubject(subjectId: string): Promise<ApiResponse<KnowledgePoint[]>> {
    await mockDelay(400);
    try {
      const knowledgePoints = dataStore.getKnowledgePointsBySubject(subjectId);
      return createApiResponse(knowledgePoints);
    } catch (error) {
      return createApiResponse([], false, '获取知识点失败');
    }
  }

  // 根据知识点ID获取题目
  static async getQuestionsByKnowledgePoints(knowledgePointIds: string[]): Promise<ApiResponse<QuizQuestion[]>> {
    await mockDelay(600);
    try {
      const questions = dataStore.getQuestionsByKnowledgePoints(knowledgePointIds);
      return createApiResponse(questions);
    } catch (error) {
      return createApiResponse([], false, '获取题目失败');
    }
  }

  // 根据ID获取知识点详情
  static async getKnowledgePointById(id: string): Promise<ApiResponse<KnowledgePoint | null>> {
    await mockDelay(200);
    try {
      const knowledgePoint = dataStore.getKnowledgePointById(id);
      return createApiResponse(knowledgePoint || null);
    } catch (error) {
      return createApiResponse(null, false, '获取知识点详情失败');
    }
  }

  // 根据ID获取题目详情
  static async getQuestionById(id: string): Promise<ApiResponse<QuizQuestion | null>> {
    await mockDelay(200);
    try {
      const question = dataStore.getQuestionById(id);
      return createApiResponse(question || null);
    } catch (error) {
      return createApiResponse(null, false, '获取题目详情失败');
    }
  }

  // 创建知识点
  static async createKnowledgePoint(knowledgePoint: Omit<KnowledgePoint, 'id'>): Promise<ApiResponse<KnowledgePoint>> {
    await mockDelay(800);
    try {
      const newKnowledgePoint = dataStore.addKnowledgePoint(knowledgePoint);
      return createApiResponse(newKnowledgePoint, true, '知识点创建成功');
    } catch (error) {
      return createApiResponse({} as KnowledgePoint, false, '知识点创建失败');
    }
  }

  // 创建题目
  static async createQuestion(question: Omit<QuizQuestion, 'id'>): Promise<ApiResponse<QuizQuestion>> {
    await mockDelay(800);
    try {
      const newQuestion = dataStore.addQuestion(question);
      return createApiResponse(newQuestion, true, '题目创建成功');
    } catch (error) {
      return createApiResponse({} as QuizQuestion, false, '题目创建失败');
    }
  }

  // 更新知识点
  static async updateKnowledgePoint(id: string, updates: Partial<KnowledgePoint>): Promise<ApiResponse<KnowledgePoint | null>> {
    await mockDelay(600);
    try {
      const updatedKnowledgePoint = dataStore.updateKnowledgePoint(id, updates);
      if (updatedKnowledgePoint) {
        return createApiResponse(updatedKnowledgePoint, true, '知识点更新成功');
      } else {
        return createApiResponse(null, false, '知识点不存在');
      }
    } catch (error) {
      return createApiResponse(null, false, '知识点更新失败');
    }
  }

  // 更新题目
  static async updateQuestion(id: string, updates: Partial<QuizQuestion>): Promise<ApiResponse<QuizQuestion | null>> {
    await mockDelay(600);
    try {
      const updatedQuestion = dataStore.updateQuestion(id, updates);
      if (updatedQuestion) {
        return createApiResponse(updatedQuestion, true, '题目更新成功');
      } else {
        return createApiResponse(null, false, '题目不存在');
      }
    } catch (error) {
      return createApiResponse(null, false, '题目更新失败');
    }
  }

  // 删除知识点
  static async deleteKnowledgePoint(id: string): Promise<ApiResponse<boolean>> {
    await mockDelay(500);
    try {
      const success = dataStore.deleteKnowledgePoint(id);
      if (success) {
        return createApiResponse(true, true, '知识点删除成功');
      } else {
        return createApiResponse(false, false, '知识点不存在');
      }
    } catch (error) {
      return createApiResponse(false, false, '知识点删除失败');
    }
  }

  // 删除题目
  static async deleteQuestion(id: string): Promise<ApiResponse<boolean>> {
    await mockDelay(500);
    try {
      const success = dataStore.deleteQuestion(id);
      if (success) {
        return createApiResponse(true, true, '题目删除成功');
      } else {
        return createApiResponse(false, false, '题目不存在');
      }
    } catch (error) {
      return createApiResponse(false, false, '题目删除失败');
    }
  }

  // 模拟AI分析功能
  static async analyzeQuestionWithAI(question: string): Promise<ApiResponse<any>> {
    await mockDelay(2000 + Math.random() * 3000); // 2-5秒延迟模拟AI处理
    try {
      // 模拟AI分析结果
      const analysisResult = {
        suggestedKnowledgePoints: [
          {
            id: 'HIST-1-1-1',
            confidence: 0.85,
            reason: '题目内容与先秦政治制度高度相关'
          }
        ],
        suggestedAnswer: 'A',
        suggestedExplanation: '根据题目内容分析，选项A最符合相关知识点的核心概念。',
        suggestedDifficulty: 'medium' as const,
        suggestedTags: ['核心概念', '理解应用'],
        qualityScore: Math.random() * 30 + 70, // 70-100
        improvements: [
          '建议在题目中增加更具体的情境描述',
          '可以考虑增加干扰选项的迷惑性',
          '题目表述可以更加简洁明确'
        ]
      };
      
      return createApiResponse(analysisResult, true, 'AI分析完成');
    } catch (error) {
      return createApiResponse(null, false, 'AI分析失败');
    }
  }

  // 批量操作 - 批量获取题目
  static async getBatchQuestions(questionIds: string[]): Promise<ApiResponse<QuizQuestion[]>> {
    await mockDelay(800);
    try {
      const questions = questionIds
        .map(id => dataStore.getQuestionById(id))
        .filter(q => q !== undefined) as QuizQuestion[];
      
      return createApiResponse(questions);
    } catch (error) {
      return createApiResponse([], false, '批量获取题目失败');
    }
  }

  // 搜索功能
  static async searchQuestions(query: string, subjectId?: string): Promise<ApiResponse<QuizQuestion[]>> {
    await mockDelay(600);
    try {
      let questions = dataStore.getQuestionsByKnowledgePoints(
        dataStore.getKnowledgePointsBySubject(subjectId || '').map(kp => kp.id)
      );
      
      if (query.trim()) {
        questions = questions.filter(q => 
          q.question.toLowerCase().includes(query.toLowerCase()) ||
          (q.options && Object.values(q.options).some(option => 
            option.toLowerCase().includes(query.toLowerCase())
          ))
        );
      }
      
      return createApiResponse(questions);
    } catch (error) {
      return createApiResponse([], false, '搜索失败');
    }
  }

  // 统计信息
  static async getStatistics(subjectId?: string): Promise<ApiResponse<any>> {
    await mockDelay(400);
    try {
      const knowledgePoints = subjectId 
        ? dataStore.getKnowledgePointsBySubject(subjectId)
        : dataStore.getKnowledgePointsBySubject('history').concat(dataStore.getKnowledgePointsBySubject('biology'));
      
      const questions = dataStore.getQuestionsByKnowledgePoints(knowledgePoints.map(kp => kp.id));
      
      const stats = {
        totalKnowledgePoints: knowledgePoints.length,
        totalQuestions: questions.length,
        questionsByType: {
          'single-choice': questions.filter(q => q.type === 'single-choice').length,
          'multiple-choice': questions.filter(q => q.type === 'multiple-choice').length,
          'essay': questions.filter(q => q.type === 'essay').length
        },
        lastUpdated: new Date().toISOString()
      };
      
      return createApiResponse(stats);
    } catch (error) {
      return createApiResponse(null, false, '获取统计信息失败');
    }
  }
}

// 导出便捷的API调用函数
export const api = {
  subjects: {
    getAll: () => ApiService.getSubjects()
  },
  knowledgePoints: {
    getBySubject: (subjectId: string) => ApiService.getKnowledgePointsBySubject(subjectId),
    getById: (id: string) => ApiService.getKnowledgePointById(id),
    create: (kp: Omit<KnowledgePoint, 'id'>) => ApiService.createKnowledgePoint(kp),
    update: (id: string, updates: Partial<KnowledgePoint>) => ApiService.updateKnowledgePoint(id, updates),
    delete: (id: string) => ApiService.deleteKnowledgePoint(id)
  },
  questions: {
    getByKnowledgePoints: (kpIds: string[]) => ApiService.getQuestionsByKnowledgePoints(kpIds),
    getById: (id: string) => ApiService.getQuestionById(id),
    getBatch: (ids: string[]) => ApiService.getBatchQuestions(ids),
    create: (question: Omit<QuizQuestion, 'id'>) => ApiService.createQuestion(question),
    update: (id: string, updates: Partial<QuizQuestion>) => ApiService.updateQuestion(id, updates),
    delete: (id: string) => ApiService.deleteQuestion(id),
    search: (query: string, subjectId?: string) => ApiService.searchQuestions(query, subjectId)
  },
  ai: {
    analyzeQuestion: (question: string) => ApiService.analyzeQuestionWithAI(question)
  },
  stats: {
    get: (subjectId?: string) => ApiService.getStatistics(subjectId)
  }
};

// 默认导出
export default ApiService;