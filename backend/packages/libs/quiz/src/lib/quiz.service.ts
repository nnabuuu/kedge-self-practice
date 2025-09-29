import { Injectable } from '@nestjs/common';
import { QuizService } from './quiz.interface';
import { QuizRepository } from './quiz.repository';
import { QuizItem } from '@kedge/models';
import { QuizStorageService, QuizImageFile } from './quiz.storage';
import { KnowledgePointStorage } from '@kedge/knowledge-point';

@Injectable()
export class DefaultQuizService implements QuizService {
  constructor(
    private readonly repository: QuizRepository,
    private readonly storage: QuizStorageService,
    private readonly knowledgePointStorage: KnowledgePointStorage,
  ) {}

  /**
   * Normalizes hint array by converting empty strings to null
   */
  private normalizeHints(hints?: (string | null)[]): (string | null)[] | undefined {
    if (!hints) return undefined;
    
    return hints.map(hint => {
      if (typeof hint === 'string' && hint.trim() === '') {
        return null;
      }
      return hint;
    });
  }

  /**
   * Process answer_index field to ensure consistency with answer field
   * Auto-fills missing fields and validates conflicts
   */
  private processAnswerIndex(item: QuizItem): QuizItem {
    // Skip processing for non-choice questions
    if (item.type !== 'single-choice' && item.type !== 'multiple-choice') {
      return item;
    }

    // If no options, can't process indices
    if (!item.options || !Array.isArray(item.options)) {
      return item;
    }

    const hasAnswer = item.answer !== undefined && item.answer !== null;
    const hasAnswerIndex = item.answer_index !== undefined && item.answer_index !== null;

    // Case 1: Both exist - validate consistency
    if (hasAnswer && hasAnswerIndex && item.answer_index) {
      const derivedIndex = this.deriveAnswerIndex(item);
      if (derivedIndex && JSON.stringify(derivedIndex.sort()) !== JSON.stringify(item.answer_index.sort())) {
        throw new Error(
          `Answer index mismatch. Answer "${item.answer}" maps to indices [${derivedIndex}] but answer_index is [${item.answer_index}]`
        );
      }
      return item;
    }

    // Case 2: Only answer exists - derive answer_index
    if (hasAnswer && !hasAnswerIndex) {
      const derivedIndex = this.deriveAnswerIndex(item);
      return { ...item, answer_index: derivedIndex };
    }

    // Case 3: Only answer_index exists - derive answer
    if (!hasAnswer && hasAnswerIndex) {
      const derivedAnswer = this.deriveAnswer(item);
      return { ...item, answer: derivedAnswer };
    }

    // Case 4: Neither exists - return as is (will fail validation later)
    return item;
  }

  /**
   * Derive answer_index from answer text
   */
  private deriveAnswerIndex(item: QuizItem): number[] | null {
    if (!item.answer || !item.options) return null;

    const options = item.options;
    const indices: number[] = [];

    // Handle single answer (string or single-element array)
    if (typeof item.answer === 'string') {
      const index = options.indexOf(item.answer);
      if (index !== -1) {
        indices.push(index);
      }
    } else if (Array.isArray(item.answer)) {
      for (const ans of item.answer) {
        if (typeof ans === 'string') {
          const index = options.indexOf(ans);
          if (index !== -1) {
            indices.push(index);
          }
        } else if (typeof ans === 'number') {
          // Already an index
          indices.push(ans);
        }
      }
    }

    return indices.length > 0 ? indices.sort() : null;
  }

  /**
   * Derive answer from answer_index
   */
  private deriveAnswer(item: QuizItem): string | string[] | undefined {
    if (!item.answer_index || !item.options) return undefined;

    const answers = item.answer_index.map(idx => item.options![idx]).filter(Boolean);
    
    if (item.type === 'single-choice') {
      return answers.length > 0 ? answers[0] : undefined;
    } else {
      return answers.length > 0 ? answers : undefined;
    }
  }

  async createQuiz(item: QuizItem, images: QuizImageFile[] = []): Promise<QuizItem> {
    const paths: string[] = [];
    for (const image of images) {
      const p = await this.storage.saveImage(image);
      paths.push(p);
    }
    
    // Normalize hints for fill-in-the-blank questions
    const normalizedItem = { ...item };
    if (item.type === 'fill-in-the-blank' && item.hints) {
      normalizedItem.hints = this.normalizeHints(item.hints);
    }
    
    // Process answer_index for choice questions
    const processedItem = this.processAnswerIndex(normalizedItem);
    
    return this.repository.createQuiz({ ...processedItem, images: paths });
  }

  findQuizById(id: string): Promise<QuizItem | null> {
    return this.repository.findQuizById(id);
  }

  async listQuizzes(): Promise<QuizItem[]> {
    const quizzes = await this.repository.listQuizzes();
    
    // Populate knowledge point data for each quiz
    return quizzes.map(quiz => {
      if (quiz.knowledge_point_id) {
        const knowledgePoint = this.knowledgePointStorage.findKnowledgePointById(quiz.knowledge_point_id);
        if (knowledgePoint) {
          return {
            ...quiz,
            knowledgePoint: {
              id: knowledgePoint.id,
              topic: knowledgePoint.topic,
              volume: knowledgePoint.volume,
              unit: knowledgePoint.unit,
              lesson: knowledgePoint.lesson,
            }
          };
        }
      }
      return quiz;
    });
  }

  deleteQuiz(id: string): Promise<boolean> {
    return this.repository.deleteQuiz(id);
  }

  async updateQuiz(id: string, updates: Partial<QuizItem>): Promise<QuizItem | null> {
    // Get the existing quiz first
    const existingQuiz = await this.repository.findQuizById(id);
    if (!existingQuiz) {
      return null;
    }
    
    // Merge with existing data for validation
    const mergedQuiz = { ...existingQuiz, ...updates };
    
    // Normalize hints if provided
    if (updates.hints) {
      mergedQuiz.hints = this.normalizeHints(updates.hints);
    }
    
    // Process answer_index for choice questions
    const processedQuiz = this.processAnswerIndex(mergedQuiz);
    
    // Extract only the updated fields
    const finalUpdates: Partial<QuizItem> = {};
    for (const key in updates) {
      finalUpdates[key as keyof QuizItem] = processedQuiz[key as keyof QuizItem] as any;
    }
    
    // Also include answer_index if it was derived
    if (processedQuiz.answer_index !== undefined && updates.answer_index === undefined) {
      finalUpdates.answer_index = processedQuiz.answer_index;
    }
    
    return this.repository.updateQuiz(id, finalUpdates);
  }

  searchQuizzesByTags(tags: string[]): Promise<QuizItem[]> {
    return this.repository.searchQuizzesByTags(tags);
  }

  getAllTags(): Promise<string[]> {
    return this.repository.getAllTags();
  }

  getRandomQuizzesByKnowledgePoints(
    knowledgePointIds: string[], 
    limit: number,
    quizTypes?: string[]
  ): Promise<QuizItem[]> {
    return this.repository.getRandomQuizzesByKnowledgePoints(knowledgePointIds, limit, quizTypes);
  }

  getQuizById(id: string): Promise<QuizItem | null> {
    return this.repository.findQuizById(id);
  }

  async getQuizzesByIds(ids: string[]): Promise<QuizItem[]> {
    if (ids.length === 0) {
      return [];
    }
    
    console.log(`[QuizService.getQuizzesByIds] Fetching ${ids.length} quizzes`);
    const quizzes = await this.repository.getQuizzesByIds(ids);
    
    if (quizzes && quizzes.length > 0) {
      console.log(`[QuizService.getQuizzesByIds] Returned ${quizzes.length} quizzes from repository`);
      console.log(`[QuizService.getQuizzesByIds] First quiz data:`, JSON.stringify(quizzes[0], null, 2));
    } else {
      console.log(`[QuizService.getQuizzesByIds] No quizzes returned from repository`);
    }
    
    return quizzes;
  }
}

export const QuizServiceProvider = {
  provide: QuizService,
  useClass: DefaultQuizService,
};
