import { QuizItem } from '@kedge/models';

export abstract class QuizService {
  abstract createQuiz(item: QuizItem): Promise<QuizItem>;

  abstract findQuizById(id: string): Promise<QuizItem | null>;

  abstract listQuizzes(): Promise<QuizItem[]>;
}
