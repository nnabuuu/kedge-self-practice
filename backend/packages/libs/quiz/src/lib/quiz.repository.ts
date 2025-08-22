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
            tags,
            knowledge_point_id
          )
          VALUES (
            ${item.type},
            ${item.question},
            ${sql.json(item.options)},
            ${sql.json(item.answer)},
            ${item.originalParagraph ?? null},
            ${sql.json(item.images ?? [])},
            ${sql.json(item.tags ?? [])},
            ${item.knowledge_point_id ?? null}
          )
          RETURNING id, type, question, options, answer, original_paragraph, images, tags, knowledge_point_id
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
          SELECT id, type, question, options, answer, 
                 original_paragraph as "originalParagraph", 
                 images, tags, knowledge_point_id
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
      // Use type-safe query with proper schema
      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          SELECT id, type, question, options, answer, 
                 original_paragraph as "originalParagraph", 
                 images, tags, knowledge_point_id
          FROM kedge_practice.quizzes
          ORDER BY id DESC
        `,
      );
      
      this.logger.log(`QuizRepository fetched ${result.rows.length} quizzes from database`);
      
      // Return the quizzes - spread to create a new mutable array
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
              knowledge_point_id = ${updatedQuiz.knowledge_point_id ?? null},
              updated_at = now()
          WHERE id = ${id}
          RETURNING id, type, question, options, answer, 
                    original_paragraph as "originalParagraph", 
                    images, tags, knowledge_point_id
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
          SELECT id, type, question, options, answer, 
                 original_paragraph as "originalParagraph", 
                 images, tags, knowledge_point_id
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

  async getRandomQuizzesByKnowledgePoints(
    knowledgePointIds: string[], 
    limit: number,
    quizTypes?: string[]
  ): Promise<QuizItem[]> {
    try {
      this.logger.log(`Fetching random quizzes for knowledge points: ${knowledgePointIds.join(', ')}, limit: ${limit}, quiz types: ${quizTypes?.join(', ') || 'all'}`);
      
      let result;
      
      if (knowledgePointIds.length > 0) {
        // Debug: Check database connection info
        const dbInfo = sql.unsafe`SELECT current_database(), current_user, inet_server_addr(), inet_server_port()`;
        const dbResult = await this.persistentService.pgPool.query(dbInfo);
        this.logger.log(`Database connection info: ${JSON.stringify(dbResult.rows)}`);
        
        // Check count
        const countQuery = sql.unsafe`SELECT COUNT(*) as total FROM kedge_practice.quizzes`;
        const countResult = await this.persistentService.pgPool.query(countQuery);
        this.logger.log(`Total quiz count: ${JSON.stringify(countResult.rows)}`);
        
        // Build WHERE clause based on filters
        const whereConditions = [
          sql.fragment`knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'text')})`
        ];
        
        if (quizTypes && quizTypes.length > 0) {
          whereConditions.push(sql.fragment`type = ANY(${sql.array(quizTypes, 'text')})`);
        }
        
        // If knowledge points are specified, filter by them and optionally by quiz types
        result = await this.persistentService.pgPool.query(
          sql.type(QuizItemSchema)`
            SELECT id, type, question, options, answer, 
                   original_paragraph as "originalParagraph", 
                   images, tags, knowledge_point_id
            FROM kedge_practice.quizzes
            WHERE ${sql.join(whereConditions, sql.fragment` AND `)}
            ORDER BY RANDOM()
            LIMIT ${limit}
          `,
        );
      } else {
        // If no knowledge points specified, just get random quizzes (optionally filtered by type)
        if (quizTypes && quizTypes.length > 0) {
          result = await this.persistentService.pgPool.query(
            sql.type(QuizItemSchema)`
              SELECT id, type, question, options, answer, 
                     original_paragraph as "originalParagraph", 
                     images, tags, knowledge_point_id
              FROM kedge_practice.quizzes
              WHERE type = ANY(${sql.array(quizTypes, 'text')})
              ORDER BY RANDOM()
              LIMIT ${limit}
            `,
          );
        } else {
          result = await this.persistentService.pgPool.query(
            sql.type(QuizItemSchema)`
              SELECT id, type, question, options, answer, 
                     original_paragraph as "originalParagraph", 
                     images, tags, knowledge_point_id
              FROM kedge_practice.quizzes
              ORDER BY RANDOM()
              LIMIT ${limit}
            `,
          );
        }
      }
      
      this.logger.log(`Found ${result.rows.length} quizzes`);
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting random quizzes: ${errorMessage}`);
      throw new Error('Failed to get random quizzes');
    }
  }

  async getQuizzesByIds(ids: string[]): Promise<QuizItem[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      this.logger.log(`[QuizRepository.getQuizzesByIds] Fetching quizzes for IDs: ${ids.join(', ')}`);

      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          SELECT id, type, question, options, answer, 
                 original_paragraph as "originalParagraph", 
                 images, tags, knowledge_point_id
          FROM kedge_practice.quizzes
          WHERE id = ANY(${sql.array(ids, 'uuid')})
        `,
      );
      
      // Debug log the raw result
      if (result.rows && result.rows.length > 0) {
        this.logger.log(`[QuizRepository.getQuizzesByIds] Fetched ${result.rows.length} quizzes from database`);
        this.logger.log(`[QuizRepository.getQuizzesByIds] First quiz raw data: ${JSON.stringify(result.rows[0], null, 2)}`);
      } else {
        this.logger.warn(`[QuizRepository.getQuizzesByIds] No quizzes found for the given IDs`);
      }
      
      // Return quizzes in the same order as the input IDs
      const quizMap = new Map(result.rows.map(quiz => [quiz.id, quiz]));
      const orderedQuizzes = ids.map(id => quizMap.get(id)).filter(Boolean) as QuizItem[];
      
      this.logger.log(`[QuizRepository.getQuizzesByIds] Returning ${orderedQuizzes.length} ordered quizzes`);
      
      return orderedQuizzes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting quizzes by ids: ${errorMessage}`);
      throw new Error('Failed to get quizzes by ids');
    }
  }
}
