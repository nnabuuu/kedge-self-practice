import { QuizItem } from '@kedge/models';
import { QuizImageFile } from './quiz.storage';

export abstract class QuizService {
  abstract createQuiz(item: QuizItem, images?: QuizImageFile[]): Promise<QuizItem>;

  abstract findQuizById(id: string): Promise<QuizItem | null>;

  abstract listQuizzes(): Promise<QuizItem[]>;

  abstract deleteQuiz(id: string): Promise<boolean>;

  abstract updateQuiz(id: string, updates: Partial<QuizItem>): Promise<QuizItem | null>;

  abstract searchQuizzesByTags(tags: string[]): Promise<QuizItem[]>;

  abstract getAllTags(): Promise<string[]>;
}
