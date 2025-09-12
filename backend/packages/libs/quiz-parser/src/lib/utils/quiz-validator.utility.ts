import { QuizItem, QuizExtractionResult } from '@kedge/models';

/**
 * Utility class for validating and normalizing quiz responses
 * Handles various field name variations and missing data
 */
export class QuizValidatorUtility {
  // Type name mappings
  private static readonly TYPE_MAP: { [key: string]: QuizItem['type'] } = {
    'single': 'single-choice',
    'single_choice': 'single-choice',
    'single-choice': 'single-choice',
    'singlechoice': 'single-choice',
    'multiple': 'multiple-choice',
    'multiple_choice': 'multiple-choice',
    'multiple-choice': 'multiple-choice',
    'multiplechoice': 'multiple-choice',
    'fill': 'fill-in-the-blank',
    'fill_blank': 'fill-in-the-blank',
    'fill-in-blank': 'fill-in-the-blank',
    'fill-in-the-blank': 'fill-in-the-blank',
    'fillintheblank': 'fill-in-the-blank',
    'blank': 'fill-in-the-blank',
    'blanks': 'fill-in-the-blank',
    'subjective': 'subjective',
    'essay': 'subjective',
    'short_answer': 'subjective',
    'shortanswer': 'subjective',
    'open': 'subjective',
    'other': 'other',
  };

  /**
   * Validate and normalize quiz response structure
   */
  static validateResponse(data: any): QuizExtractionResult {
    const result: QuizExtractionResult = { items: [] };
    
    if (!data) return result;
    
    // Extract items array from various possible structures
    const items = this.extractItemsArray(data);
    
    // Validate and normalize each item
    for (const item of items) {
      const validatedItem = this.validateQuizItem(item);
      if (validatedItem) {
        result.items.push(validatedItem);
      }
    }
    
    return result;
  }

  /**
   * Extract items array from various response structures
   */
  private static extractItemsArray(data: any): any[] {
    // Direct array
    if (Array.isArray(data)) {
      return data;
    }
    
    // Standard structure variations
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.quizzes && Array.isArray(data.quizzes)) return data.quizzes;
    if (data.questions && Array.isArray(data.questions)) return data.questions;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (data.data && Array.isArray(data.data)) return data.data;
    
    // Single item variations
    if (data.item) return [data.item];
    if (data.quiz) return [data.quiz];
    if (data.question && typeof data.question === 'string') return [data];
    
    // Object with numeric keys (sometimes LLMs return this)
    if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      const numericKeys = keys.filter(k => !isNaN(Number(k)));
      if (numericKeys.length > 0) {
        return numericKeys.map(k => data[k]);
      }
    }
    
    return [];
  }

  /**
   * Validate and normalize individual quiz item
   */
  static validateQuizItem(item: any): QuizItem | null {
    if (!item || typeof item !== 'object') {
      return null;
    }
    
    // Extract and validate question
    const question = this.extractQuestion(item);
    if (!question) {
      console.warn('Quiz item missing question text, skipping');
      return null;
    }
    
    // Determine and normalize type
    const type = this.normalizeQuizType(item);
    
    // Extract and validate options for choice questions
    const options = this.extractOptions(item, type);
    
    // Extract and format answer based on type
    const answer = this.extractAndFormatAnswer(item, type, options);
    
    // Create validated quiz item
    const validatedItem: QuizItem = {
      type,
      question,
      options,
      answer,
      alternative_answers: item.alternative_answers || [],
    };
    
    // Preserve optional fields
    if (item.originalParagraph) {
      validatedItem.originalParagraph = item.originalParagraph;
    }
    if (item.images) {
      validatedItem.images = item.images;
    }
    
    return validatedItem;
  }

  /**
   * Extract question text from various field names
   */
  private static extractQuestion(item: any): string {
    return item.question || 
           item.text || 
           item.content || 
           item.prompt || 
           item.q || 
           item.quiz_question || 
           item.questionText || 
           '';
  }

  /**
   * Normalize quiz type from various formats
   */
  private static normalizeQuizType(item: any): QuizItem['type'] {
    const rawType = (
      item.type || 
      item.quiz_type || 
      item.questionType || 
      item.question_type || 
      item.qtype || 
      'other'
    ).toString().toLowerCase().replace(/[\s-_]/g, '');
    
    return this.TYPE_MAP[rawType] || 'other';
  }

  /**
   * Extract options from various formats
   */
  private static extractOptions(item: any, type: QuizItem['type']): string[] {
    // Non-choice questions don't need options
    if (type !== 'single-choice' && type !== 'multiple-choice') {
      return [];
    }
    
    // Standard options array
    if (Array.isArray(item.options)) {
      return item.options.map((opt: any) => this.normalizeOption(opt));
    }
    
    // Alternative field names
    if (Array.isArray(item.choices)) {
      return item.choices.map((opt: any) => this.normalizeOption(opt));
    }
    
    if (Array.isArray(item.alternatives)) {
      return item.alternatives.map((opt: any) => this.normalizeOption(opt));
    }
    
    // Options as separate fields (A, B, C, D...)
    const letterOptions: string[] = [];
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(letter => {
      if (item[letter]) {
        letterOptions.push(String(item[letter]));
      }
    });
    if (letterOptions.length > 0) {
      return letterOptions;
    }
    
    // Options as numbered fields (1, 2, 3...)
    const numberedOptions: string[] = [];
    for (let i = 1; i <= 10; i++) {
      if (item[i]) {
        numberedOptions.push(String(item[i]));
      }
    }
    if (numberedOptions.length > 0) {
      return numberedOptions;
    }
    
    return [];
  }

  /**
   * Normalize option format
   */
  private static normalizeOption(opt: any): string {
    if (typeof opt === 'string') return opt;
    if (opt.text) return opt.text;
    if (opt.content) return opt.content;
    if (opt.value) return opt.value;
    if (opt.option) return opt.option;
    return String(opt);
  }

  /**
   * Extract and format answer based on quiz type
   */
  private static extractAndFormatAnswer(
    item: any, 
    type: QuizItem['type'], 
    options: string[]
  ): string | string[] | number[] {
    // Extract raw answer
    const rawAnswer = item.answer ?? 
                     item.correct_answer ?? 
                     item.correctAnswer ?? 
                     item.correct ?? 
                     item.answers ?? 
                     item.solution ?? 
                     '';
    
    // Format based on type
    switch (type) {
      case 'single-choice':
      case 'multiple-choice':
        return this.formatChoiceAnswer(rawAnswer, options);
      
      case 'fill-in-the-blank':
        return this.formatFillInBlankAnswer(rawAnswer);
      
      default:
        return this.formatTextAnswer(rawAnswer);
    }
  }

  /**
   * Format answer for choice questions
   */
  private static formatChoiceAnswer(rawAnswer: any, options: string[]): number[] {
    // Already in correct format
    if (Array.isArray(rawAnswer) && rawAnswer.every(a => typeof a === 'number')) {
      return rawAnswer;
    }
    
    // Single number
    if (typeof rawAnswer === 'number') {
      return [rawAnswer];
    }
    
    // Letter answers (A, B, C, D or A,B,C)
    if (typeof rawAnswer === 'string') {
      const letters = rawAnswer.match(/[A-H]/gi);
      if (letters) {
        return letters.map(letter => letter.toUpperCase().charCodeAt(0) - 65);
      }
      
      // Numeric string
      if (!isNaN(Number(rawAnswer))) {
        return [Number(rawAnswer)];
      }
      
      // Try to find answer text in options
      const index = options.findIndex(opt => 
        opt.toLowerCase() === rawAnswer.toLowerCase()
      );
      return index >= 0 ? [index] : [0];
    }
    
    // Array of strings - convert to indices
    if (Array.isArray(rawAnswer)) {
      const indices: number[] = [];
      for (const ans of rawAnswer) {
        if (typeof ans === 'number') {
          indices.push(ans);
        } else if (typeof ans === 'string') {
          // Try letter
          if (ans.length === 1 && /[A-H]/i.test(ans)) {
            indices.push(ans.toUpperCase().charCodeAt(0) - 65);
          } else {
            // Try to find in options
            const idx = options.findIndex(opt => 
              opt.toLowerCase() === ans.toLowerCase()
            );
            if (idx >= 0) indices.push(idx);
          }
        }
      }
      return indices.length > 0 ? indices : [0];
    }
    
    return [0]; // Default to first option
  }

  /**
   * Format answer for fill-in-the-blank questions
   */
  private static formatFillInBlankAnswer(rawAnswer: any): string[] {
    if (Array.isArray(rawAnswer)) {
      return rawAnswer.map(a => String(a || ''));
    }
    return [String(rawAnswer || '')];
  }

  /**
   * Format answer for text questions
   */
  private static formatTextAnswer(rawAnswer: any): string {
    if (Array.isArray(rawAnswer)) {
      return rawAnswer.join(', ');
    }
    return String(rawAnswer || '');
  }
}