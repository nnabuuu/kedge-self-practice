export interface HighlightedText {
  text: string;
  color: string;
}

export interface ParagraphData {
  paragraph: string;
  highlighted: HighlightedText[];
}

export interface QuizItem {
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other';
  question: string;
  options: string[];
  answer: string | string[] | number[];
  originalParagraph?: string;
  images?: string[]; // URLs or base64 encoded images
  attachments?: string[]; // Server attachment URLs
  hints?: (string | null)[]; // Hints for fill-in-the-blank questions, e.g., ["人名", "朝代", null]
  alternative_answers?: string[] | string[][]; // Alternative acceptable answers for fill-in-the-blank
}

export interface GPTQuizResponse {
  items: QuizItem[];
}

export interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

/**
 * 表示从课程知识点表格中提取出的单个知识点。
 *
 * - `volume`: 分册，例如"上册"或"下册"
 * - `unit`: 单元，例如"第一单元"
 * - `lesson`: 单课，例如"第1课"
 * - `sub`: 子目，表示知识点所属的小节或主题分类
 * - `topic`: 知识点内容本身
 * - `id`: 每条知识点的唯一标识符，在加载时生成
 */
export interface KnowledgePoint {
  id: string;
  topic: string;
  volume: string;
  unit: string;
  lesson: string;
  sub: string;
}

export interface QuizWithKnowledgePoint extends QuizItem {
  knowledgePoint?: KnowledgePoint;
  matchingResult?: KnowledgePointMatchResult;
  matchingStatus?: 'pending' | 'loading' | 'success' | 'error';
}

export interface KnowledgePointMatchResult {
  matched?: KnowledgePoint;
  candidates: KnowledgePoint[];
  keywords: string[];
  country: string;
  dynasty: string;
}