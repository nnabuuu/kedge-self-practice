export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface KnowledgePoint {
  id: string;
  subjectId: string; // 学科ID
  volume: string;    // 分册，如：中外历史纲要上
  unit: string;      // 单元名称，如：第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固
  lesson: string;    // 单课名称，如：第1课 中华文明的起源与早期国家
  section: string;   // 子目，如：第一子目 石器时代的古人类和文化遗存
  topic: string;     // 知识点，如：旧石器时代与新石器文明
}

export interface QuizQuestion {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'essay' | 'other';
  question: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer?: string | string[]; // 单选题为string，多选题为string[]，填空题可能是string[]
  answer_index?: number[]; // Answer indices (0-based) for quick matching
  standardAnswer?: string; // 用于问答题的标准答案
  standardStructure?: string; // 标准答案的结构和逻辑说明
  explanation?: string; // 题目解析，帮助学生理解答案
  relatedKnowledgePointId: string;
  evaluationCriteria?: {
    [key: string]: string; // 评价维度和说明
  };
  images?: string[]; // Image URLs or paths
  alternative_answers?: string[]; // Alternative correct answers for fill-in-the-blank questions
  hints?: (string | null)[]; // Hints for fill-in-the-blank questions, e.g., ["人名", "朝代", null]
  knowledgePoint?: { // Full knowledge point data from backend
    id: string;
    subjectId: string;
    volume: string;
    unit: string;
    lesson: string;
    section: string;
    topic: string;
  };
}

export interface PracticeSession {
  id: string;
  subjectId: string;
  knowledgePoints: string[];
  questions: QuizQuestion[];
  answers: (string | string[] | null)[];
  questionDurations?: number[]; // 每题用时（秒）
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  // Backend statistics (from database)
  answeredQuestions?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  score?: number;
}

export interface PracticeHistory {
  id: string;
  subjectId: string;
  subjectName: string;
  knowledgePoints: string[];
  questions?: QuizQuestion[];
  answers?: (string | string[] | null)[];
  questionDurations?: number[]; // 每题用时（秒）
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  completionRate: number;
  date: Date;
  duration: number; // 分钟
}

export interface AIEvaluation {
  overallScore: number; // 总分 0-10分
  comparison: string; // 与标准答案的针对性对比分析
  criteriaScores: {
    [key: string]: {
      score: number; // 0-10分
      analysis: string; // 针对性分析，不是简单的评语
    };
  };
  improvementSuggestions: string[]; // 具体的改进建议
}