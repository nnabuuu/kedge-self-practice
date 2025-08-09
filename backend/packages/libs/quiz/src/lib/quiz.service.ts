import { Injectable } from '@nestjs/common';
import { QuizService } from './quiz.interface';
import { QuizRepository } from './quiz.repository';
import { QuizItem } from '@kedge/models';

@Injectable()
export class DefaultQuizService implements QuizService {
  constructor(private readonly repository: QuizRepository) {}

  createQuiz(item: QuizItem): Promise<QuizItem> {
    return this.repository.createQuiz(item);
  }

  findQuizById(id: string): Promise<QuizItem | null> {
    return this.repository.findQuizById(id);
  }

  listQuizzes(): Promise<QuizItem[]> {
    return this.repository.listQuizzes();
  }
}

export const QuizServiceProvider = {
  provide: QuizService,
  useClass: DefaultQuizService,
};
