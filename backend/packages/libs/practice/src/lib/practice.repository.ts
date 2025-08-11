import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { v4 as uuidv4 } from 'uuid';
import {
  PracticeSession,
  PracticeQuestion,
  PracticeSessionSchema,
  PracticeQuestionSchema,
  PracticeStatisticsSchema,
  PracticeStrategy,
  PracticeSessionStatus
} from '@kedge/models';

@Injectable()
export class PracticeRepository {
  private readonly logger = new Logger(PracticeRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  async createSession(
    sessionId: string,
    studentId: string,
    data: {
      strategy: string;
      knowledge_point_ids: string[];
      total_questions: number;
      time_limit_minutes?: number;
      difficulty: string;
    }
  ): Promise<PracticeSession> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          INSERT INTO practice_sessions (
            id,
            student_id,
            status,
            strategy,
            knowledge_point_ids,
            total_questions,
            time_limit_minutes,
            difficulty,
            created_at,
            updated_at
          ) VALUES (
            ${sessionId},
            ${studentId},
            'created',
            ${data.strategy},
            ${sql.array(data.knowledge_point_ids, 'text')},
            ${data.total_questions},
            ${data.time_limit_minutes ?? null},
            ${data.difficulty},
            NOW(),
            NOW()
          ) RETURNING *
        `
      );
      return this.mapSession(result.rows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating practice session: ${errorMessage}`);
      throw new Error('Failed to create practice session');
    }
  }

  async createQuestion(
    questionData: {
      id: string;
      session_id: string;
      quiz_id: string;
      question_number: number;
      question: string;
      options: string[];
      correct_answer?: string;
      knowledge_point_id: string;
      difficulty: string;
      attachments?: string[];
    }
  ): Promise<PracticeQuestion> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeQuestionSchema)`
          INSERT INTO practice_questions (
            id,
            session_id,
            quiz_id,
            question_number,
            question,
            options,
            correct_answer,
            knowledge_point_id,
            difficulty,
            attachments
          ) VALUES (
            ${questionData.id},
            ${questionData.session_id},
            ${questionData.quiz_id},
            ${questionData.question_number},
            ${questionData.question},
            ${sql.array(questionData.options || [], 'text')},
            ${questionData.correct_answer ?? null},
            ${questionData.knowledge_point_id},
            ${questionData.difficulty},
            ${sql.array(questionData.attachments || [], 'text')}
          ) RETURNING *
        `
      );
      return this.mapQuestion(result.rows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating practice question: ${errorMessage}`);
      throw new Error('Failed to create practice question');
    }
  }

  async updateSessionStatus(
    sessionId: string,
    studentId: string,
    status: PracticeSessionStatus,
    additionalUpdates?: {
      started_at?: boolean;
      completed_at?: boolean;
    }
  ): Promise<PracticeSession> {
    try {
      const startedAtClause = additionalUpdates?.started_at ? sql`, started_at = NOW()` : sql``;
      const completedAtClause = additionalUpdates?.completed_at ? sql`, completed_at = NOW()` : sql``;
      
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          UPDATE practice_sessions
          SET status = ${status},
              updated_at = NOW()
              ${startedAtClause}
              ${completedAtClause}
          WHERE id = ${sessionId}
          AND student_id = ${studentId}
          RETURNING *
        `
      );
      
      if (result.rowCount === 0) {
        throw new Error('Practice session not found');
      }
      
      return this.mapSession(result.rows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating session status: ${errorMessage}`);
      throw error;
    }
  }

  async submitAnswer(
    questionId: string,
    sessionId: string,
    answer: string,
    timeSpentSeconds: number
  ): Promise<{ isCorrect: boolean }> {
    try {
      const result = await this.persistentService.pgPool.transaction(async (connection) => {
        const questionResult = await connection.query(sql`
          SELECT correct_answer FROM practice_questions
          WHERE id = ${questionId}
          AND session_id = ${sessionId}
          AND student_answer IS NULL
        `);

        if (questionResult.rowCount === 0) {
          throw new Error('Question not found or already answered');
        }

        const isCorrect = questionResult.rows[0].correct_answer === answer;

        await connection.query(sql`
          UPDATE practice_questions
          SET student_answer = ${answer},
              is_correct = ${isCorrect},
              time_spent_seconds = ${timeSpentSeconds},
              answered_at = NOW()
          WHERE id = ${questionId}
        `);

        await connection.query(sql`
          UPDATE practice_sessions
          SET answered_questions = answered_questions + 1,
              correct_answers = correct_answers + ${isCorrect ? 1 : 0},
              incorrect_answers = incorrect_answers + ${isCorrect ? 0 : 1},
              time_spent_seconds = time_spent_seconds + ${timeSpentSeconds},
              score = ROUND((correct_answers + ${isCorrect ? 1 : 0})::numeric / total_questions * 100, 2),
              updated_at = NOW()
          WHERE id = ${sessionId}
        `);

        return { isCorrect };
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error submitting answer: ${errorMessage}`);
      throw error;
    }
  }

  async skipQuestion(
    questionId: string,
    sessionId: string,
    timeSpentSeconds: number
  ): Promise<void> {
    try {
      await this.persistentService.pgPool.transaction(async (connection) => {
        await connection.query(sql`
          UPDATE practice_questions
          SET time_spent_seconds = ${timeSpentSeconds},
              answered_at = NOW()
          WHERE id = ${questionId}
          AND session_id = ${sessionId}
          AND student_answer IS NULL
        `);

        await connection.query(sql`
          UPDATE practice_sessions
          SET skipped_questions = skipped_questions + 1,
              time_spent_seconds = time_spent_seconds + ${timeSpentSeconds},
              updated_at = NOW()
          WHERE id = ${sessionId}
        `);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error skipping question: ${errorMessage}`);
      throw error;
    }
  }

  async getSession(sessionId: string, studentId: string): Promise<PracticeSession | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          SELECT * FROM practice_sessions
          WHERE id = ${sessionId}
          AND student_id = ${studentId}
        `
      );
      return result.rows[0] ? this.mapSession(result.rows[0]) : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting session: ${errorMessage}`);
      throw error;
    }
  }

  async getCurrentQuestion(sessionId: string): Promise<PracticeQuestion | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeQuestionSchema)`
          SELECT * FROM practice_questions
          WHERE session_id = ${sessionId}
          AND student_answer IS NULL
          ORDER BY question_number
          LIMIT 1
        `
      );
      return result.rows[0] ? this.mapQuestion(result.rows[0]) : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting current question: ${errorMessage}`);
      throw error;
    }
  }

  async getNextQuestion(sessionId: string): Promise<PracticeQuestion | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeQuestionSchema)`
          SELECT * FROM practice_questions
          WHERE session_id = ${sessionId}
          AND student_answer IS NULL
          AND answered_at IS NULL
          ORDER BY question_number
          LIMIT 1
        `
      );
      return result.rows[0] ? this.mapQuestion(result.rows[0]) : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting next question: ${errorMessage}`);
      throw error;
    }
  }

  async getSessionHistory(
    studentId: string,
    status?: PracticeSessionStatus,
    limit = 20,
    offset = 0
  ): Promise<PracticeSession[]> {
    try {
      const statusCondition = status ? sql`AND status = ${status}` : sql``;
      
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          SELECT * FROM practice_sessions
          WHERE student_id = ${studentId}
          ${statusCondition}
          ORDER BY created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `
      );
      return result.rows.map(row => this.mapSession(row));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting session history: ${errorMessage}`);
      throw error;
    }
  }

  async getStatistics(studentId: string): Promise<any> {
    try {
      const statsResult = await this.persistentService.pgPool.query(sql`
        SELECT 
          COUNT(DISTINCT ps.id) as total_sessions,
          COUNT(DISTINCT CASE WHEN ps.status = 'completed' THEN ps.id END) as completed_sessions,
          COUNT(pq.id) FILTER (WHERE pq.student_answer IS NOT NULL) as total_questions_answered,
          COUNT(pq.id) FILTER (WHERE pq.is_correct = true) as total_correct,
          COUNT(pq.id) FILTER (WHERE pq.is_correct = false) as total_incorrect,
          COUNT(pq.id) FILTER (WHERE pq.student_answer IS NULL AND pq.answered_at IS NOT NULL) as total_skipped,
          COALESCE(SUM(ps.time_spent_seconds) / 60, 0) as total_time_spent_minutes
        FROM practice_sessions ps
        LEFT JOIN practice_questions pq ON ps.id = pq.session_id
        WHERE ps.student_id = ${studentId}
      `);

      const knowledgePointResult = await this.persistentService.pgPool.query(sql`
        SELECT 
          pq.knowledge_point_id,
          kp.name as knowledge_point_name,
          COUNT(pq.id) as total_questions,
          COUNT(pq.id) FILTER (WHERE pq.is_correct = true) as correct_answers,
          AVG(pq.time_spent_seconds) as average_time_seconds
        FROM practice_questions pq
        JOIN practice_sessions ps ON pq.session_id = ps.id
        LEFT JOIN knowledge_points kp ON pq.knowledge_point_id = kp.id
        WHERE ps.student_id = ${studentId}
        AND pq.student_answer IS NOT NULL
        GROUP BY pq.knowledge_point_id, kp.name
      `);

      const difficultyResult = await this.persistentService.pgPool.query(sql`
        SELECT 
          COUNT(pq.id) FILTER (WHERE pq.difficulty = 'easy') as easy_total,
          COUNT(pq.id) FILTER (WHERE pq.difficulty = 'easy' AND pq.is_correct = true) as easy_correct,
          COUNT(pq.id) FILTER (WHERE pq.difficulty = 'medium') as medium_total,
          COUNT(pq.id) FILTER (WHERE pq.difficulty = 'medium' AND pq.is_correct = true) as medium_correct,
          COUNT(pq.id) FILTER (WHERE pq.difficulty = 'hard') as hard_total,
          COUNT(pq.id) FILTER (WHERE pq.difficulty = 'hard' AND pq.is_correct = true) as hard_correct
        FROM practice_questions pq
        JOIN practice_sessions ps ON pq.session_id = ps.id
        WHERE ps.student_id = ${studentId}
        AND pq.student_answer IS NOT NULL
      `);

      return {
        stats: statsResult.rows[0],
        knowledgePointPerformance: knowledgePointResult.rows,
        difficultyPerformance: difficultyResult.rows[0]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting statistics: ${errorMessage}`);
      throw error;
    }
  }

  async fetchQuizzes(
    knowledgePointIds: string[],
    limit: number,
    difficulty: string,
    strategy: PracticeStrategy,
    studentId?: string
  ): Promise<any[]> {
    try {
      let query;
      const difficultyCondition = difficulty !== 'mixed' ? sql`AND difficulty = ${difficulty}` : sql``;

      switch (strategy) {
        case 'sequential':
          query = sql`
            SELECT * FROM quizzes
            WHERE knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
            ${difficultyCondition}
            ORDER BY created_at
            LIMIT ${limit}
          `;
          break;

        case 'difficulty_adaptive':
          query = sql`
            SELECT * FROM quizzes
            WHERE knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
            ORDER BY 
              CASE difficulty
                WHEN 'easy' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'hard' THEN 3
              END
            LIMIT ${limit}
          `;
          break;

        case 'weakness_focused':
          if (!studentId) {
            throw new Error('Student ID required for weakness focused strategy');
          }
          query = sql`
            WITH weak_points AS (
              SELECT pq.knowledge_point_id
              FROM practice_questions pq
              JOIN practice_sessions ps ON pq.session_id = ps.id
              WHERE ps.student_id = ${studentId}
              AND pq.is_correct = false
              GROUP BY pq.knowledge_point_id
              ORDER BY COUNT(*) DESC
            )
            SELECT q.* FROM quizzes q
            WHERE q.knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
            ${difficultyCondition}
            ORDER BY 
              CASE WHEN q.knowledge_point_id IN (SELECT knowledge_point_id FROM weak_points) 
                THEN 0 ELSE 1 END,
              RANDOM()
            LIMIT ${limit}
          `;
          break;

        case 'review_incorrect':
          if (!studentId) {
            throw new Error('Student ID required for review incorrect strategy');
          }
          query = sql`
            WITH incorrect_quizzes AS (
              SELECT DISTINCT pq.quiz_id
              FROM practice_questions pq
              JOIN practice_sessions ps ON pq.session_id = ps.id
              WHERE ps.student_id = ${studentId}
              AND pq.is_correct = false
            )
            SELECT q.* FROM quizzes q
            WHERE q.knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
            ${difficultyCondition}
            ORDER BY 
              CASE WHEN q.id IN (SELECT quiz_id FROM incorrect_quizzes) 
                THEN 0 ELSE 1 END,
              RANDOM()
            LIMIT ${limit}
          `;
          break;

        case 'random':
        default:
          query = sql`
            SELECT * FROM quizzes
            WHERE knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
            ${difficultyCondition}
            ORDER BY RANDOM()
            LIMIT ${limit}
          `;
          break;
      }

      const result = await this.persistentService.pgPool.query(query);
      return result.rows;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching quizzes: ${errorMessage}`);
      throw error;
    }
  }

  private mapSession(data: any): PracticeSession {
    return {
      id: data.id,
      student_id: data.student_id,
      status: data.status,
      strategy: data.strategy,
      knowledge_point_ids: data.knowledge_point_ids,
      total_questions: parseInt(data.total_questions),
      answered_questions: parseInt(data.answered_questions || 0),
      correct_answers: parseInt(data.correct_answers || 0),
      incorrect_answers: parseInt(data.incorrect_answers || 0),
      skipped_questions: parseInt(data.skipped_questions || 0),
      time_limit_minutes: data.time_limit_minutes ? parseInt(data.time_limit_minutes) : undefined,
      time_spent_seconds: parseInt(data.time_spent_seconds || 0),
      difficulty: data.difficulty,
      score: parseFloat(data.score || 0),
      started_at: data.started_at?.toISOString(),
      completed_at: data.completed_at?.toISOString(),
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString()
    };
  }

  private mapQuestion(data: any): PracticeQuestion {
    return {
      id: data.id,
      session_id: data.session_id,
      quiz_id: data.quiz_id,
      question_number: parseInt(data.question_number),
      question: data.question,
      options: data.options,
      correct_answer: data.correct_answer,
      student_answer: data.student_answer,
      is_correct: data.is_correct,
      time_spent_seconds: parseInt(data.time_spent_seconds || 0),
      answered_at: data.answered_at?.toISOString(),
      attachments: data.attachments,
      knowledge_point_id: data.knowledge_point_id,
      difficulty: data.difficulty
    };
  }
}