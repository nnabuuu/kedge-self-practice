import { QuizItem } from '@kedge/models';

/**
 * Utility class for fill-in-the-blank question operations
 */
export class FillInBlankUtility {
  /**
   * Count blanks in a question
   */
  static countBlanks(question: string): number {
    const matches = question.match(/_{2,}/g);
    return matches ? matches.length : 0;
  }

  /**
   * Check if a question has blanks
   */
  static hasBlanks(question: string): boolean {
    return this.countBlanks(question) > 0;
  }

  /**
   * Auto-add blanks to a question based on answers
   */
  static autoAddBlanks(item: QuizItem): QuizItem {
    if (!item.answer || this.hasBlanks(item.question)) {
      return item;
    }
    
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    let fixedQuestion = item.question;
    let replacements = 0;
    
    for (const ans of answers) {
      if (typeof ans === 'string' && ans.trim()) {
        const answerText = ans.trim();
        const patterns = this.createSearchPatterns(answerText);
        
        for (const pattern of patterns) {
          const matches = fixedQuestion.match(pattern);
          if (matches && matches.length > 0) {
            fixedQuestion = fixedQuestion.replace(pattern, '____');
            replacements++;
            break;
          }
        }
      }
    }
    
    // If no replacements made, append blanks at the end
    if (!fixedQuestion.includes('____')) {
      fixedQuestion = this.appendBlanksToQuestion(fixedQuestion, answers.length);
    }
    
    return { ...item, question: fixedQuestion };
  }

  /**
   * Create search patterns for finding answer text in question
   */
  private static createSearchPatterns(text: string): RegExp[] {
    const escaped = this.escapeRegex(text);
    
    return [
      new RegExp(`《${escaped}》`, 'g'),        // Chinese book title
      new RegExp(`"${escaped}"`, 'g'),          // Double quotes
      new RegExp(`'${escaped}'`, 'g'),          // Single quotes
      new RegExp(`「${escaped}」`, 'g'),        // Chinese quotes
      new RegExp(`【${escaped}】`, 'g'),        // Chinese brackets
      new RegExp(`\\(${escaped}\\)`, 'g'),      // Parentheses
      new RegExp(`\\b${escaped}\\b`, 'g'),      // Word boundary
      new RegExp(`${escaped}`, 'g'),            // Plain text
    ];
  }

  /**
   * Append blanks to the end of a question
   */
  private static appendBlanksToQuestion(question: string, answerCount: number): string {
    // Remove trailing punctuation
    let base = question.replace(/[。？！?!]$/, '');
    
    if (answerCount === 1) {
      return `${base}是____。`;
    } else {
      const blanks = Array(answerCount).fill('____').join('、');
      return `${base} 请填空：${blanks}。`;
    }
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Create a fallback fill-in-blank question
   */
  static createFallbackQuestion(item: QuizItem): QuizItem {
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    const answerCount = answers.length;
    
    let fallbackQuestion = item.question;
    
    // Remove any partial blanks
    fallbackQuestion = fallbackQuestion.replace(/_{1,3}/g, '');
    
    // Add structured blanks
    if (answerCount === 1) {
      fallbackQuestion = `关于以下内容，____是什么？\n${fallbackQuestion}`;
    } else {
      const blanks = Array(answerCount).fill('____').join('、');
      fallbackQuestion = `根据以下内容，请填空（${blanks}）：\n${fallbackQuestion}`;
    }
    
    return {
      ...item,
      question: fallbackQuestion
    };
  }

  /**
   * Validate fill-in-blank question structure
   */
  static validate(item: QuizItem): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (item.type !== 'fill-in-the-blank') {
      errors.push('Not a fill-in-the-blank question');
      return { valid: false, errors };
    }
    
    const blanksCount = this.countBlanks(item.question);
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    
    if (blanksCount === 0) {
      errors.push('Question has no blanks');
    }
    
    if (blanksCount !== answers.length) {
      errors.push(`Mismatch: ${blanksCount} blanks but ${answers.length} answers`);
    }
    
    if (answers.some(a => !a || (typeof a === 'string' && !a.trim()))) {
      errors.push('Some answers are empty');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}