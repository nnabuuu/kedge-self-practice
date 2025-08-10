import { QuizItem } from '@kedge/models';
import { QuizImageFile } from './quiz.storage';

export abstract class QuizService {
  abstract createQuiz(item: QuizItem, images?: QuizImageFile[]): Promise<QuizItem>;

  abstract findQuizById(id: string): Promise<QuizItem | null>;

  abstract listQuizzes(): Promise<QuizItem[]>;
}
