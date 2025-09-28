import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { QuizItemSchema, QuizItem } from '@kedge/models';

@Injectable()
export class QuizRepository {
  private readonly logger = new Logger(QuizRepository.name);

  constructor(private readonly persistentService: PersistentService) {
    // Log database connection info on initialization
    this.logger.log('QuizRepository initialized');
    this.logDatabaseInfo();
  }

  private async logDatabaseInfo() {
    try {
      // Log the database URL (mask password)
      const dbUrl = process.env['NODE_DATABASE_URL'] || 'NOT SET';
      const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
      this.logger.log(`Database URL: ${maskedUrl}`);
      
      // Check database name and schema
      const dbInfo = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT current_database() as database, current_schema() as schema
      `);
      this.logger.log(`Current database: ${dbInfo.rows[0].database}, schema: ${dbInfo.rows[0].schema}`);
      
      // Count quizzes in database
      const countResult = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT COUNT(*) as count FROM kedge_practice.quizzes
      `);
      this.logger.log(`Total quizzes in kedge_practice.quizzes table: ${countResult.rows[0].count}`);
      
      // Check if table exists
      const tableCheck = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'kedge_practice' 
          AND table_name = 'quizzes'
        ) as table_exists
      `);
      this.logger.log(`Table kedge_practice.quizzes exists: ${tableCheck.rows[0].table_exists}`);
      
    } catch (error) {
      this.logger.error(`Error logging database info: ${error}`);
    }
  }

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
            knowledge_point_id,
            alternative_answers
          )
          VALUES (
            ${item.type},
            ${item.question},
            ${sql.json(item.options)},
            ${sql.json(item.answer)},
            ${item.originalParagraph ?? null},
            ${sql.json(item.images ?? [])},
            ${sql.json(item.tags ?? [])},
            ${item.knowledge_point_id ?? null},
            ${sql.array(item.alternative_answers ?? [], 'text')}
          )
          RETURNING id, type, question, options, answer, original_paragraph, images, tags, knowledge_point_id, alternative_answers, NULL as "knowledgePoint"
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
                 images, tags, knowledge_point_id,
                 alternative_answers, 
                 COALESCE(hints, '[]'::jsonb) as hints,
                 NULL as "knowledgePoint"
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
      // Log before query
      this.logger.log(`listQuizzes called - querying kedge_practice.quizzes`);
      
      // Also log current connection info
      const connInfo = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT current_database() as db, inet_server_addr() as server_addr, inet_server_port() as server_port
      `);
      this.logger.log(`Connected to: ${connInfo.rows[0].db} at ${connInfo.rows[0].server_addr}:${connInfo.rows[0].server_port}`);
      
      // Use type-safe query with proper schema
      const result = await this.persistentService.pgPool.query(
        sql.type(QuizItemSchema)`
          SELECT id, type, question, options, answer, 
                 original_paragraph as "originalParagraph", 
                 images, tags, knowledge_point_id,
                 alternative_answers, 
                 COALESCE(hints, '[]'::jsonb) as hints,
                 NULL as "knowledgePoint"
          FROM kedge_practice.quizzes
          ORDER BY id DESC
        `,
      );
      
      this.logger.log(`QuizRepository fetched ${result.rows.length} quizzes from database`);
      
      // Log first quiz if exists
      if (result.rows.length > 0) {
        this.logger.log(`First quiz ID: ${result.rows[0].id}, Question: ${result.rows[0].question?.substring(0, 50)}...`);
      }
      
      // Return the quizzes - spread to create a new mutable array
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error listing quizzes: ${errorMessage}`);
      this.logger.error(`Full error: ${JSON.stringify(error)}`);
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
              alternative_answers = ${sql.array(updatedQuiz.alternative_answers ?? [], 'text')},
              hints = ${sql.json(updatedQuiz.hints ?? null)},
              updated_at = now()
          WHERE id = ${id}
          RETURNING id, type, question, options, answer, 
                    original_paragraph as "originalParagraph", 
                    images, tags, knowledge_point_id,
                    alternative_answers, 
                    COALESCE(hints, '[]'::jsonb) as hints,
                    NULL as "knowledgePoint"
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
                 images, tags, knowledge_point_id,
                 alternative_answers, 
                 COALESCE(hints, '[]'::jsonb) as hints,
                 NULL as "knowledgePoint"
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
          sql.unsafe`
            SELECT 
              q.id, 
              q.type, 
              q.question, 
              q.options, 
              q.answer, 
              q.original_paragraph as "originalParagraph", 
              q.images, 
              q.tags, 
              q.knowledge_point_id,
              CASE 
                WHEN kp.id IS NOT NULL THEN 
                  json_build_object(
                    'id', kp.id,
                    'subjectId', 'history',
                    'volume', kp.volume,
                    'unit', kp.unit,
                    'lesson', kp.lesson,
                    'section', kp.sub,
                    'topic', kp.topic
                  )
                ELSE NULL
              END as "knowledgePoint"
            FROM kedge_practice.quizzes q
            LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
            WHERE ${sql.join(whereConditions, sql.fragment` AND `)}
            ORDER BY RANDOM()
            LIMIT ${limit}
          `,
        );
      } else {
        // If no knowledge points specified, just get random quizzes (optionally filtered by type)
        if (quizTypes && quizTypes.length > 0) {
          result = await this.persistentService.pgPool.query(
            sql.unsafe`
              SELECT 
                q.id, 
                q.type, 
                q.question, 
                q.options, 
                q.answer, 
                q.original_paragraph as "originalParagraph", 
                q.images, 
                q.tags, 
                q.knowledge_point_id,
                CASE 
                  WHEN kp.id IS NOT NULL THEN 
                    json_build_object(
                      'id', kp.id,
                      'subjectId', 'history',
                      'volume', kp.volume,
                      'unit', kp.unit,
                      'lesson', kp.lesson,
                      'section', kp.sub,
                      'topic', kp.topic
                    )
                  ELSE NULL
                END as "knowledgePoint"
              FROM kedge_practice.quizzes q
              LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
              WHERE q.type = ANY(${sql.array(quizTypes, 'text')})
              ORDER BY RANDOM()
              LIMIT ${limit}
            `,
          );
        } else {
          result = await this.persistentService.pgPool.query(
            sql.unsafe`
              SELECT 
                q.id, 
                q.type, 
                q.question, 
                q.options, 
                q.answer, 
                q.original_paragraph as "originalParagraph", 
                q.images, 
                q.tags, 
                q.knowledge_point_id,
                CASE 
                  WHEN kp.id IS NOT NULL THEN 
                    json_build_object(
                      'id', kp.id,
                      'subjectId', 'history',
                      'volume', kp.volume,
                      'unit', kp.unit,
                      'lesson', kp.lesson,
                      'section', kp.sub,
                      'topic', kp.topic
                    )
                  ELSE NULL
                END as "knowledgePoint"
              FROM kedge_practice.quizzes q
              LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
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
        sql.unsafe`
          SELECT 
            q.id, 
            q.type, 
            q.question, 
            q.options, 
            q.answer, 
            q.original_paragraph as "originalParagraph", 
            q.images, 
            q.tags, 
            q.knowledge_point_id,
            CASE 
              WHEN kp.id IS NOT NULL THEN 
                json_build_object(
                  'id', kp.id,
                  'subjectId', 'history',
                  'volume', kp.volume,
                  'unit', kp.unit,
                  'lesson', kp.lesson,
                  'section', kp.sub,
                  'topic', kp.topic
                )
              ELSE NULL
            END as "knowledgePoint"
          FROM kedge_practice.quizzes q
          LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
          WHERE q.id = ANY(${sql.array(ids, 'uuid')})
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

  async addAlternativeAnswer(quizId: string, alternativeAnswer: string): Promise<boolean> {
    try {
      // First check if the alternative answer already exists
      const quiz = await this.findQuizById(quizId);
      if (!quiz) {
        this.logger.warn(`Quiz with ID ${quizId} not found`);
        return false;
      }

      const trimmedAnswer = alternativeAnswer.trim();
      if (!trimmedAnswer) {
        return false;
      }

      // Check if the answer already exists in alternative_answers
      if (quiz.alternative_answers?.includes(trimmedAnswer)) {
        this.logger.log(`Alternative answer already exists for quiz ${quizId}`);
        return true;
      }

      // Add the new alternative answer
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.quizzes
          SET alternative_answers = array_append(
            COALESCE(alternative_answers, ARRAY[]::TEXT[]), 
            ${trimmedAnswer}
          )
          WHERE id = ${quizId}
        `,
      );
      
      this.logger.log(`Added alternative answer "${trimmedAnswer}" to quiz ${quizId}`);
      return result.rowCount > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error adding alternative answer: ${errorMessage}`);
      throw new Error('Failed to add alternative answer');
    }
  }
}
