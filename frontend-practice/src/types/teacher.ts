export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[]; // 可管理的学科ID列表
  role: 'teacher' | 'admin';
}

export interface QuestionDraft {
  id?: string;
  type: 'multiple-choice' | 'essay';
  question: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer?: string;
  standardAnswer?: string;
  standardStructure?: string;
  relatedKnowledgePointId?: string;
  evaluationCriteria?: {
    [key: string]: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdBy: string;
  createdAt: Date;
  status: 'draft' | 'review' | 'approved' | 'rejected';
}

export interface AIAnalysisResult {
  suggestedKnowledgePoints: {
    id: string;
    confidence: number;
    reason: string;
  }[];
  suggestedAnswer?: string;
  suggestedExplanation?: string;
  suggestedDifficulty: 'easy' | 'medium' | 'hard';
  suggestedTags: string[];
  qualityScore: number;
  improvements: string[];
}

export interface KnowledgePointDraft {
  id?: string;
  subjectId: string;
  volume: string;
  unit: string;
  lesson: string;
  section: string;
  topic: string;
  description?: string;
  prerequisites: string[]; // 前置知识点ID
  relatedPoints: string[]; // 相关知识点ID
  createdBy: string;
  createdAt: Date;
  status: 'draft' | 'approved';
}