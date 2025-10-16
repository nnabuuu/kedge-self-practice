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
  answer_index: z.array(z.number()).nullable(),
  options: z.any().nullable(),
  knowledge_point_id: z.string().nullable(),
  knowledge_point_name: z.string().nullable(),
  total_attempts: z.number(),
  incorrect_attempts: z.number(),
  error_rate: z.number(),
  wrong_answer_distribution: z.any().nullable(),
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

// Schema for quiz performance comparison (time + accuracy)
const QuizPerformanceComparisonSchema = z.object({
  quiz_id: z.string().uuid(),
  user_time: z.number(),
  avg_time: z.number(),
  min_time: z.number(),
  max_time: z.number(),
  time_percentile: z.number(),
  user_correct: z.boolean(),
  user_accuracy: z.number(), // User's historical accuracy on this quiz (0 or 100 for single attempt, average for multiple)
  avg_accuracy: z.number(), // Average accuracy across all users
  total_attempts: z.number(),
});

export type QuizPerformanceComparison = z.infer<typeof QuizPerformanceComparisonSchema>;

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
    volume?: string;
    unit?: string;
    timeFrameStart?: Date;
    timeFrameEnd?: Date;
    minAttempts?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: QuizErrorRate[]; total: number }> {
    const {
      subjectId,
      knowledgePointId,
      volume,
      unit,
      timeFrameStart,
      timeFrameEnd,
      minAttempts = 5,
      limit = 20,
      offset = 0,
    } = params;

    this.logger.log(`Getting error rates for subject ${subjectId}, volume: ${volume || 'all'}, unit: ${unit || 'all'}`);

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

      if (volume) {
        whereConditions.push(sql.fragment`kp.volume = ${volume}`);
      }

      if (unit) {
        whereConditions.push(sql.fragment`kp.unit = ${unit}`);
      }

      if (timeFrameStart) {
        whereConditions.push(sql.fragment`pa.answered_at >= ${timeFrameStart.toISOString()}`);
      }

      if (timeFrameEnd) {
        whereConditions.push(sql.fragment`pa.answered_at <= ${timeFrameEnd.toISOString()}`);
      }

      const whereClause = whereConditions.length > 0
        ? sql.join(whereConditions, sql.fragment` AND `)
        : sql.fragment`1=1`;

      // Main query
      const query = sql.type(QuizErrorRateSchema)`
        WITH quiz_stats AS (
          SELECT
            q.id AS quiz_id,
            q.question AS quiz_text,
            q.type AS quiz_type,
            q.answer::text AS correct_answer,
            q.answer_index,
            q.options,
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
          GROUP BY q.id, q.question, q.type, q.answer, q.answer_index, q.options, q.knowledge_point_id, kp.topic
          HAVING COUNT(pa.id) >= ${minAttempts}
        ),
        wrong_answer_counts AS (
          SELECT
            pa.quiz_id,
            pa.user_answer::text AS answer,
            COUNT(*) AS answer_count
          FROM kedge_practice.practice_answers pa
          WHERE pa.is_correct = false
          GROUP BY pa.quiz_id, pa.user_answer::text
        ),
        wrong_answer_stats AS (
          SELECT
            wac.quiz_id,
            json_agg(
              json_build_object(
                'answer', wac.answer,
                'count', wac.answer_count,
                'percentage', ROUND(100.0 * wac.answer_count / NULLIF(qs.incorrect_attempts, 0), 2)
              )
              ORDER BY wac.answer_count DESC
            ) AS wrong_answer_distribution
          FROM wrong_answer_counts wac
          INNER JOIN quiz_stats qs ON wac.quiz_id = qs.quiz_id
          GROUP BY wac.quiz_id
        )
        SELECT
          qs.*,
          was.wrong_answer_distribution
        FROM quiz_stats qs
        LEFT JOIN wrong_answer_stats was ON qs.quiz_id = was.quiz_id
        ORDER BY qs.error_rate DESC
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
          LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
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
    volume?: string;
    unit?: string;
    timeFrameStart?: Date;
    timeFrameEnd?: Date;
    minAttempts?: number;
  }): Promise<ErrorRateSummary> {
    const {
      subjectId,
      knowledgePointId,
      volume,
      unit,
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

      if (volume) {
        whereConditions.push(sql.fragment`kp.volume = ${volume}`);
      }

      if (unit) {
        whereConditions.push(sql.fragment`kp.unit = ${unit}`);
      }

      if (timeFrameStart) {
        whereConditions.push(sql.fragment`pa.answered_at >= ${timeFrameStart.toISOString()}`);
      }

      if (timeFrameEnd) {
        whereConditions.push(sql.fragment`pa.answered_at <= ${timeFrameEnd.toISOString()}`);
      }

      const whereClause = whereConditions.length > 0
        ? sql.join(whereConditions, sql.fragment` AND `)
        : sql.fragment`1=1`;

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
          LEFT JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
          INNER JOIN kedge_practice.practice_answers pa ON pa.quiz_id = q.id
          WHERE ${whereClause}
          GROUP BY q.id
          HAVING COUNT(pa.id) >= ${minAttempts}
        )
        SELECT
          COUNT(*) AS total_questions,
          COALESCE(ROUND(AVG(error_rate), 2), 0) AS avg_error_rate,
          COALESCE(SUM(CASE WHEN error_rate > 60 THEN 1 ELSE 0 END), 0) AS high_error_count,
          COALESCE(SUM(total_attempts), 0) AS total_attempts
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

      const whereClause = whereConditions.length > 0
        ? sql.join(whereConditions, sql.fragment` AND `)
        : sql.fragment`1=1`;

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

      const whereClause = whereConditions.length > 0
        ? sql.join(whereConditions, sql.fragment` AND `)
        : sql.fragment`1=1`;

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

  /**
   * Get quiz performance comparison for a specific quiz and user
   * Compares user's time and accuracy against all other users
   */
  async getQuizPerformanceComparison(params: {
    quizId: string;
    sessionId: string;
    userId: string;
  }): Promise<QuizPerformanceComparison> {
    const { quizId, sessionId, userId } = params;

    this.logger.log(`Getting performance comparison for quiz ${quizId} in session ${sessionId}`);

    try {
      const query = sql.type(QuizPerformanceComparisonSchema)`
        WITH user_current_answer AS (
          SELECT
            time_spent_seconds AS user_time,
            is_correct AS user_correct
          FROM kedge_practice.practice_answers
          WHERE quiz_id = ${quizId}
            AND session_id = ${sessionId}
          LIMIT 1
        ),
        user_historical_accuracy AS (
          SELECT
            ROUND(
              100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC /
              NULLIF(COUNT(*)::NUMERIC, 0),
              1
            ) AS user_accuracy
          FROM kedge_practice.practice_answers pa
          JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
          WHERE pa.quiz_id = ${quizId}
            AND ps.user_id = ${userId}
        ),
        quiz_stats AS (
          SELECT
            ${quizId}::uuid AS quiz_id,
            AVG(time_spent_seconds)::NUMERIC AS avg_time,
            MIN(time_spent_seconds) AS min_time,
            MAX(time_spent_seconds) AS max_time,
            ROUND(
              100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC /
              NULLIF(COUNT(*)::NUMERIC, 0),
              1
            ) AS avg_accuracy,
            COUNT(*) AS total_attempts
          FROM kedge_practice.practice_answers
          WHERE quiz_id = ${quizId}
            AND time_spent_seconds > 0
        ),
        time_percentile_calc AS (
          SELECT
            ROUND(
              100.0 * COUNT(CASE WHEN time_spent_seconds <= (SELECT user_time FROM user_current_answer) THEN 1 END)::NUMERIC /
              NULLIF(COUNT(*)::NUMERIC, 0),
              1
            ) AS time_percentile
          FROM kedge_practice.practice_answers
          WHERE quiz_id = ${quizId}
            AND time_spent_seconds > 0
        )
        SELECT
          qs.quiz_id,
          uca.user_time,
          ROUND(qs.avg_time, 1) AS avg_time,
          qs.min_time,
          qs.max_time,
          COALESCE(tpc.time_percentile, 50.0) AS time_percentile,
          uca.user_correct,
          COALESCE(uha.user_accuracy, CASE WHEN uca.user_correct THEN 100.0 ELSE 0.0 END) AS user_accuracy,
          qs.avg_accuracy,
          qs.total_attempts
        FROM quiz_stats qs
        CROSS JOIN user_current_answer uca
        LEFT JOIN user_historical_accuracy uha ON true
        LEFT JOIN time_percentile_calc tpc ON true
      `;

      const result = await this.persistentService.pgPool.query(query);

      if (result.rows.length === 0) {
        throw new Error(`No performance data found for quiz ${quizId} in session ${sessionId}`);
      }

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get quiz performance comparison: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get user learning progress trend over time
   * Returns time series data showing accuracy trend
   */
  async getUserProgressTrend(params: {
    userId: string;
    subjectId?: string;
    timeFrame: string;
  }): Promise<Array<{
    date: string;
    total_questions: number;
    correct_count: number;
    accuracy: number;
  }>> {
    const { userId, subjectId, timeFrame } = params;

    this.logger.log(`Getting progress trend for user ${userId}, timeFrame: ${timeFrame}`);

    try {
      // Calculate date filter based on timeFrame
      let dateFilter = sql.fragment`TRUE`;
      if (timeFrame === '7d') {
        dateFilter = sql.fragment`ps.created_at >= NOW() - INTERVAL '7 days'`;
      } else if (timeFrame === '30d') {
        dateFilter = sql.fragment`ps.created_at >= NOW() - INTERVAL '30 days'`;
      }

      const subjectFilter = subjectId
        ? sql.fragment`AND ps.subject_id = ${subjectId}`
        : sql.fragment``;

      const query = sql.type(z.object({
        date: z.string(),
        total_questions: z.number(),
        correct_count: z.number(),
        accuracy: z.number(),
      }))`
        SELECT
          DATE(ps.created_at) AS date,
          COUNT(pa.id) AS total_questions,
          SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) AS correct_count,
          ROUND(
            100.0 * SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END)::NUMERIC /
            NULLIF(COUNT(pa.id)::NUMERIC, 0),
            1
          ) AS accuracy
        FROM kedge_practice.practice_sessions ps
        JOIN kedge_practice.practice_answers pa ON ps.id = pa.session_id
        WHERE ps.user_id = ${userId}
          AND ps.status = 'completed'
          AND ${dateFilter}
          ${subjectFilter}
        GROUP BY DATE(ps.created_at)
        ORDER BY DATE(ps.created_at) ASC
      `;

      const result = await this.persistentService.pgPool.query(query);
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get user progress trend: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get knowledge point mastery heatmap data
   * Returns aggregated accuracy data for each knowledge point
   */
  async getKnowledgePointHeatmap(params: {
    userId: string;
    subjectId?: string;
  }): Promise<Array<{
    knowledge_point_id: string;
    volume: string | null;
    unit: string | null;
    lesson: string | null;
    topic: string;
    correct_rate: number;
    attempt_count: number;
  }>> {
    const { userId, subjectId } = params;

    this.logger.log(`Getting knowledge point heatmap for user ${userId}`);

    try {
      const subjectFilter = subjectId
        ? sql.fragment`AND ps.subject_id = ${subjectId}`
        : sql.fragment``;

      const query = sql.type(z.object({
        knowledge_point_id: z.string(),
        volume: z.string().nullable(),
        unit: z.string().nullable(),
        lesson: z.string().nullable(),
        topic: z.string(),
        correct_rate: z.number(),
        attempt_count: z.number(),
      }))`
        SELECT
          kp.id AS knowledge_point_id,
          kp.volume,
          kp.unit,
          kp.lesson,
          kp.topic,
          ROUND(
            100.0 * SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END)::NUMERIC /
            NULLIF(COUNT(pa.id)::NUMERIC, 0),
            1
          ) AS correct_rate,
          COUNT(pa.id) AS attempt_count
        FROM kedge_practice.practice_sessions ps
        JOIN kedge_practice.practice_answers pa ON ps.id = pa.session_id
        JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
        JOIN kedge_practice.knowledge_points kp ON q.knowledge_point_id = kp.id
        WHERE ps.user_id = ${userId}
          AND ps.status = 'completed'
          ${subjectFilter}
        GROUP BY kp.id, kp.volume, kp.unit, kp.lesson, kp.topic
        ORDER BY kp.volume, kp.unit, kp.lesson, kp.topic
      `;

      const result = await this.persistentService.pgPool.query(query);
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get knowledge point heatmap: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
