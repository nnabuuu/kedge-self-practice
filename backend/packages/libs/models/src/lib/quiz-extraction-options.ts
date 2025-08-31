import { QuizType } from '../quiz/quiz-item.schema';

/**
 * Options for quiz extraction
 */
export interface QuizExtractionOptions {
  /**
   * Target quiz types to generate
   * If not specified or empty, all types will be generated
   * Note: 'other' type is excluded from generation options
   */
  targetTypes?: Exclude<QuizType, 'other'>[];
  
  /**
   * Maximum number of quiz items to generate
   */
  maxItems?: number;
  
  /**
   * Difficulty level preference
   */
  difficulty?: 'easy' | 'medium' | 'hard';
  
  /**
   * Language for quiz generation
   */
  language?: 'zh' | 'en';
}

/**
 * Request body for quiz extraction endpoints
 */
export interface ExtractQuizRequest {
  /**
   * Paragraphs extracted from document
   */
  paragraphs: any[]; // GptParagraphBlock[] or other paragraph types
  
  /**
   * Optional extraction options
   */
  options?: QuizExtractionOptions;
}