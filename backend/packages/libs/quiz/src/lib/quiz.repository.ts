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
            images,
            tags
          )
          VALUES (
            ${item.type},
            ${item.question},
            ${sql.json(item.options)},
            ${sql.json(item.answer)},
            ${item.originalParagraph ?? null},
            ${sql.json(item.images ?? [])},
            ${sql.json(item.tags ?? [])}
          )
          RETURNING id, type, question, options, answer, original_paragraph, images, tags
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
          SELECT id, type, question, options, answer, original_paragraph, images, tags
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
          SELECT id, type, question, options, answer, original_paragraph, images, tags
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

  async deleteQuiz(id: string): Promise<boolean> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          DELETE FROM kedge_practice.quizzes
          WHERE id = ${id}
        `,
      );
      return result.rowCount > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error deleting quiz: ${errorMessage}`);
      throw new Error('Failed to delete quiz');
    }
  }

  async updateQuiz(id: string, updates: Partial<QuizItem>): Promise<QuizItem | null> {
    try {
      // First get the current quiz
      const currentQuiz = await this.findQuizById(id);
      if (!currentQuiz) {
        return null;
      }

      // Merge updates with current values
      const updatedQuiz = {
        ...currentQuiz,
        ...updates,
      };

      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          UPDATE kedge_practice.quizzes
          SET type = ${updatedQuiz.type},
              question = ${updatedQuiz.question},
              options = ${sql.json(updatedQuiz.options)},
              answer = ${sql.json(updatedQuiz.answer)},
              original_paragraph = ${updatedQuiz.originalParagraph ?? null},
              images = ${sql.json(updatedQuiz.images ?? [])},
              tags = ${sql.json(updatedQuiz.tags ?? [])},
              updated_at = now()
          WHERE id = ${id}
          RETURNING id, type, question, options, answer, original_paragraph, images, tags
        `,
      );

      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating quiz: ${errorMessage}`);
      throw new Error('Failed to update quiz');
    }
  }

  async searchQuizzesByTags(tags: string[]): Promise<QuizItem[]> {
    try {
      if (tags.length === 0) {
        return this.listQuizzes();
      }

      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          SELECT id, type, question, options, answer, original_paragraph, images, tags
          FROM kedge_practice.quizzes
          WHERE tags ?| ${sql.array(tags, 'text')}
          ORDER BY id DESC
        `,
      );
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error searching quizzes by tags: ${errorMessage}`);
      throw new Error('Failed to search quizzes by tags');
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT DISTINCT jsonb_array_elements_text(tags) as tag
          FROM kedge_practice.quizzes
          WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0
          ORDER BY tag
        `,
      );
      return result.rows.map(row => row.tag);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting all tags: ${errorMessage}`);
      throw new Error('Failed to get all tags');
    }
  }
}
