/**
 * Quiz type options for extraction
 */
export type QuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

/**
 * Options for quiz extraction
 */
export interface QuizExtractionOptions {
  /**
   * Target quiz types to generate
   * If not specified or empty, all types will be generated
   */
  targetTypes?: QuizType[];
  
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