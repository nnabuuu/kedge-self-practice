import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { z } from 'zod';

// Schema for quiz error rate
const QuizErrorRateSchema = z.object({
  quiz_id: z.string().uuid(),
  quiz_text: z.string(),
  quiz_type: z.string(),
  correct_answer: z.string(),
  knowledge_point_id: z.string().nullable(),
  knowledge_point_name: z.string().nullable(),
  total_attempts: z.number(),
  incorrect_attempts: z.number(),
  error_rate: z.number(),
});

export type QuizErrorRate = z.infer<typeof QuizErrorRateSchema>;

// Schema for wrong answer distribution
const WrongAnswerDistributionSchema = z.object({
  answer: z.string(),
  count: z.number(),
  percentage: z.number(),
});

export type WrongAnswerDistribution = z.infer<typeof WrongAnswerDistributionSchema>;

// Schema for detailed error analysis
const QuizErrorDetailsSchema = z.object({
  quiz_id: z.string().uuid(),
  question: z.string(),
  type: z.string(),
  correct_answer: z.string(),
  options: z.any().nullable(),
  knowledge_point: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  total_attempts: z.number(),
  correct_count: z.number(),
  incorrect_count: z.number(),
  error_rate: z.number(),
});

export type QuizErrorDetails = z.infer<typeof QuizErrorDetailsSchema>;

// Schema for summary stats
const ErrorRateSummarySchema = z.object({
  total_questions: z.number(),
  avg_error_rate: z.number(),
  high_error_count: z.number(),
  total_attempts: z.number(),
});

export type ErrorRateSummary = z.infer<typeof ErrorRateSummarySchema>;

@Injectable()
export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * Get quiz error rates with filtering and pagination
   */
  async getQuizErrorRates(params: {
    subjectId: string;
    knowledgePointId?: string;
    timeFrameStart?: Date;
    timeFrameEnd?: Date;
    minAttempts?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: QuizErrorRate[]; total: number }> {
    const {
      subjectId,
      knowledgePointId,
      timeFrameStart,
      timeFrameEnd,
      minAttempts = 5,
      limit = 20,
      offset = 0,
    } = params;

    this.logger.log(`Getting error rates for subject ${subjectId}, KP: ${knowledgePointId || 'all'}`);

    try {
      // Build the WHERE clause dynamically
      const whereConditions = [];
      const queryParams: any = {
        subject_id: subjectId,
        min_attempts: minAttempts,
        limit,
        offset,
      };

      whereConditions.push(sql.fragment`kp.subject_id = ${subjectId}`);

      if (knowledgePointId) {
        whereConditions.push(sql.fragment`q.knowledge_point_id = ${knowledgePointId}`);
      }

      if (timeFrameStart) {
        whereConditions.push(sql.fragment`pa.answered_at >= ${timeFrameStart.toISOString()}`);
      }

      if (timeFrameEnd) {
        whereConditions.push(sql.fragment`pa.answered_at <= ${timeFrameEnd.toISOString()}`);
      }

      const whereClause = sql.join(whereConditions, sql.fragment` AND `);

      // Main query
      const query = sql.type(QuizErrorRateSchema)`
        WITH quiz_stats AS (
          SELECT
            q.id AS quiz_id,
            q.question AS quiz_text,
            q.type AS quiz_type,
            q.answer::text AS correct_answer,
            q.knowledge_point_id,
            kp.topic AS knowledge_point_name,
            COUNT(pa.id) AS total_attempts,
            SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) AS incorrect_attempts,
            ROUND(
              100.0 * SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) /
              NULLIF(COUNT(pa.id), 0),
              2
            ) AS error_rate
          FROM kedge_practice.quizzes q
          LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
          INNER JOIN kedge_practice.practice_answers pa ON pa.quiz_id = q.id
          WHERE ${whereClause}
          GROUP BY q.id, q.question, q.type, q.answer, q.knowledge_point_id, kp.topic
          HAVING COUNT(pa.id) >= ${minAttempts}
        )
        SELECT *
        FROM quiz_stats
        ORDER BY error_rate DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const results = await this.persistentService.pgPool.query(query);

      // Get total count for pagination
      const countQuery = sql.type(z.object({ count: z.number() }))`
        WITH quiz_stats AS (
          SELECT
            q.id AS quiz_id,
            COUNT(pa.id) AS total_attempts
          FROM kedge_practice.quizzes q
          INNER JOIN kedge_practice.practice_answers pa ON pa.quiz_id = q.id
          WHERE ${whereClause}
          GROUP BY q.id
          HAVING COUNT(pa.id) >= ${minAttempts}
        )
        SELECT COUNT(*) AS count FROM quiz_stats
      `;

      const countResult = await this.persistentService.pgPool.query(countQuery);
      const total = countResult.rows[0]?.count || 0;

      return {
        data: [...results.rows],
        total,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get quiz error rates: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get summary statistics for error rates
   */
  async getErrorRateSummary(params: {
    subjectId: string;
    knowledgePointId?: string;
    timeFrameStart?: Date;
    timeFrameEnd?: Date;
    minAttempts?: number;
  }): Promise<ErrorRateSummary> {
    const {
      subjectId,
      knowledgePointId,
      timeFrameStart,
      timeFrameEnd,
      minAttempts = 5,
    } = params;

    try {
      const whereConditions = [];
      whereConditions.push(sql.fragment`kp.subject_id = ${subjectId}`);

      if (knowledgePointId) {
        whereConditions.push(sql.fragment`q.knowledge_point_id = ${knowledgePointId}`);
      }

      if (timeFrameStart) {
        whereConditions.push(sql.fragment`pa.answered_at >= ${timeFrameStart.toISOString()}`);
      }

      if (timeFrameEnd) {
        whereConditions.push(sql.fragment`pa.answered_at <= ${timeFrameEnd.toISOString()}`);
      }

      const whereClause = sql.join(whereConditions, sql.fragment` AND `);

      const query = sql.type(ErrorRateSummarySchema)`
        WITH quiz_stats AS (
          SELECT
            q.id,
            COUNT(pa.id) AS total_attempts,
            ROUND(
              100.0 * SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) /
              NULLIF(COUNT(pa.id), 0),
              2
            ) AS error_rate
          FROM kedge_practice.quizzes q
          INNER JOIN kedge_practice.practice_answers pa ON pa.quiz_id = q.id
          WHERE ${whereClause}
          GROUP BY q.id
          HAVING COUNT(pa.id) >= ${minAttempts}
        )
        SELECT
          COUNT(*) AS total_questions,
          COALESCE(ROUND(AVG(error_rate), 2), 0) AS avg_error_rate,
          SUM(CASE WHEN error_rate > 60 THEN 1 ELSE 0 END) AS high_error_count,
          SUM(total_attempts) AS total_attempts
        FROM quiz_stats
      `;

      const result = await this.persistentService.pgPool.query(query);
      return result.rows[0] || {
        total_questions: 0,
        avg_error_rate: 0,
        high_error_count: 0,
        total_attempts: 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get error rate summary: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get detailed error analysis for a specific quiz
   */
  async getQuizErrorDetails(params: {
    quizId: string;
    timeFrameStart?: Date;
    timeFrameEnd?: Date;
  }): Promise<QuizErrorDetails | null> {
    const { quizId, timeFrameStart, timeFrameEnd } = params;

    try {
      const whereConditions = [sql.fragment`pa.quiz_id = ${quizId}`];

      if (timeFrameStart) {
        whereConditions.push(sql.fragment`pa.answered_at >= ${timeFrameStart.toISOString()}`);
      }

      if (timeFrameEnd) {
        whereConditions.push(sql.fragment`pa.answered_at <= ${timeFrameEnd.toISOString()}`);
      }

      const whereClause = sql.join(whereConditions, sql.fragment` AND `);

      const query = sql.type(QuizErrorDetailsSchema)`
        SELECT
          q.id AS quiz_id,
          q.question,
          q.type,
          q.answer::text AS correct_answer,
          q.options,
          jsonb_build_object(
            'id', kp.id,
            'name', kp.topic
          ) AS knowledge_point,
          COUNT(pa.id) AS total_attempts,
          SUM(CASE WHEN pa.is_correct = true THEN 1 ELSE 0 END) AS correct_count,
          SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) AS incorrect_count,
          ROUND(
            100.0 * SUM(CASE WHEN pa.is_correct = false THEN 1 ELSE 0 END) /
            NULLIF(COUNT(pa.id), 0),
            2
          ) AS error_rate
        FROM kedge_practice.quizzes q
        LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
        INNER JOIN kedge_practice.practice_answers pa ON pa.quiz_id = q.id
        WHERE ${whereClause}
        GROUP BY q.id, q.question, q.type, q.answer, q.options, kp.id, kp.topic
      `;

      const result = await this.persistentService.pgPool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get quiz error details: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get wrong answer distribution for a quiz
   */
  async getWrongAnswerDistribution(params: {
    quizId: string;
    timeFrameStart?: Date;
    timeFrameEnd?: Date;
  }): Promise<WrongAnswerDistribution[]> {
    const { quizId, timeFrameStart, timeFrameEnd } = params;

    try {
      const whereConditions = [
        sql.fragment`quiz_id = ${quizId}`,
        sql.fragment`is_correct = false`,
        sql.fragment`user_answer IS NOT NULL`,
      ];

      if (timeFrameStart) {
        whereConditions.push(sql.fragment`answered_at >= ${timeFrameStart.toISOString()}`);
      }

      if (timeFrameEnd) {
        whereConditions.push(sql.fragment`answered_at <= ${timeFrameEnd.toISOString()}`);
      }

      const whereClause = sql.join(whereConditions, sql.fragment` AND `);

      const query = sql.type(WrongAnswerDistributionSchema)`
        WITH total_wrong AS (
          SELECT COUNT(*) AS total
          FROM kedge_practice.practice_answers
          WHERE ${whereClause}
        ),
        wrong_answers AS (
          SELECT
            user_answer::text AS answer,
            COUNT(*) AS count
          FROM kedge_practice.practice_answers
          WHERE ${whereClause}
          GROUP BY user_answer::text
        )
        SELECT
          wa.answer,
          wa.count,
          ROUND(100.0 * wa.count / NULLIF(tw.total, 0), 2) AS percentage
        FROM wrong_answers wa, total_wrong tw
        ORDER BY wa.count DESC
        LIMIT 10
      `;

      const result = await this.persistentService.pgPool.query(query);
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get wrong answer distribution: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
