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

  async createQuiz(item: QuizItem, images: QuizImageFile[] = []): Promise<QuizItem> {
    const paths: string[] = [];
    for (const image of images) {
      const p = await this.storage.saveImage(image);
      paths.push(p);
    }
    return this.repository.createQuiz({ ...item, images: paths });
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

  updateQuiz(id: string, updates: Partial<QuizItem>): Promise<QuizItem | null> {
    return this.repository.updateQuiz(id, updates);
  }

  searchQuizzesByTags(tags: string[]): Promise<QuizItem[]> {
    return this.repository.searchQuizzesByTags(tags);
  }

  getAllTags(): Promise<string[]> {
    return this.repository.getAllTags();
  }
}

export const QuizServiceProvider = {
  provide: QuizService,
  useClass: DefaultQuizService,
};
