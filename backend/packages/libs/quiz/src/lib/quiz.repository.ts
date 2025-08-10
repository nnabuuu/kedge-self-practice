import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { QuizItemSchema, QuizItem } from '@kedge/models';

@Injectable()
export class QuizRepository {
  private readonly logger = new Logger(QuizRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  async createQuiz(item: QuizItem): Promise<QuizItem> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          INSERT INTO kedge_practice.quizzes (
            type,
            question,
            options,
            answer,
            original_paragraph,
            images
          )
          VALUES (
            ${item.type},
            ${item.question},
            ${sql.json(item.options)},
            ${sql.json(item.answer)},
            ${item.originalParagraph ?? null},
            ${sql.json(item.images ?? [])}
          )
          RETURNING type, question, options, answer, original_paragraph, images
        `,
      );
      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating quiz: ${errorMessage}`);
      throw new Error('Failed to create quiz');
    }
  }

  async findQuizById(id: string): Promise<QuizItem | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          SELECT type, question, options, answer, original_paragraph, images
          FROM kedge_practice.quizzes
          WHERE id = ${id}
        `,
      );
      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding quiz by id: ${errorMessage}`);
      throw new Error('Failed to find quiz');
    }
  }

  async listQuizzes(): Promise<QuizItem[]> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          SELECT type, question, options, answer, original_paragraph, images
          FROM kedge_practice.quizzes
        `,
      );
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error listing quizzes: ${errorMessage}`);
      throw new Error('Failed to list quizzes');
    }
  }
}
