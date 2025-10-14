import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  PracticeSession,
  PracticeAnswer,
  PracticeSessionSchema,
  PracticeAnswerSchema,
  PracticeStrategy,
  PracticeSessionStatus,
  QuizItemSchema,
  BasicStatisticsSchema
} from '@kedge/models';

@Injectable()
export class PracticeRepository {
  private readonly logger = new Logger(PracticeRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  async createSession(
    sessionId: string,
    userId: string,
    quizIds: string[],
    sessionData: {
      subject_id?: string;
      strategy: string;
      total_questions: number;
      time_limit_minutes?: number;
      auto_advance_delay?: number;
    }
  ): Promise<PracticeSession> {
    try {
      this.logger.log(`Creating session ${sessionId} with ${quizIds.length} quizzes. Quiz IDs: ${quizIds.join(', ')}`);
      
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          INSERT INTO kedge_practice.practice_sessions (
            id,
            user_id,
            subject_id,
            status,
            strategy,
            quiz_ids,
            total_questions,
            time_limit_minutes,
            auto_advance_delay
          ) VALUES (
            ${sessionId},
            ${userId},
            ${sessionData.subject_id || null},
            ${'pending'},
            ${sessionData.strategy},
            ${sql.array(quizIds, 'uuid')},
            ${sessionData.total_questions},
            ${sessionData.time_limit_minutes || null},
            ${sessionData.auto_advance_delay || 0}
          ) RETURNING *
        `
      );
      
      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating practice session: ${errorMessage}`);
      throw new Error('Failed to create practice session');
    }
  }

  async getSession(sessionId: string, userId: string): Promise<PracticeSession | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          SELECT * FROM kedge_practice.practice_sessions
          WHERE id = ${sessionId}
          AND user_id = ${userId}
        `
      );

      return result.rowCount > 0 ? result.rows[0] : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting session: ${errorMessage}`);
      throw error;
    }
  }


  async submitAnswer(
    sessionId: string,
    quizId: string,
    userAnswer: string,
    isCorrect: boolean,
    timeSpentSeconds: number
  ): Promise<PracticeAnswer> {
    try {
      // Insert or update the answer
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeAnswerSchema)`
          INSERT INTO kedge_practice.practice_answers (
            session_id,
            quiz_id,
            user_answer,
            is_correct,
            time_spent_seconds,
            answered_at
          ) VALUES (
            ${sessionId},
            ${quizId},
            ${sql.json(userAnswer)},
            ${isCorrect},
            ${timeSpentSeconds},
            NOW()
          )
          ON CONFLICT (session_id, quiz_id) 
          DO UPDATE SET
            user_answer = ${sql.json(userAnswer)},
            is_correct = ${isCorrect},
            time_spent_seconds = ${timeSpentSeconds},
            answered_at = NOW()
          RETURNING *
        `
      );

      // Update session statistics
      await this.updateSessionStats(sessionId);

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error submitting answer: ${errorMessage}`);
      throw error;
    }
  }

  private async updateSessionStats(sessionId: string): Promise<void> {
    try {
      await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.practice_sessions
          SET 
            answered_questions = (
              SELECT COUNT(*) FROM kedge_practice.practice_answers 
              WHERE session_id = ${sessionId}
            ),
            correct_answers = (
              SELECT COUNT(*) FROM kedge_practice.practice_answers 
              WHERE session_id = ${sessionId} AND is_correct = true
            ),
            incorrect_answers = (
              SELECT COUNT(*) FROM kedge_practice.practice_answers 
              WHERE session_id = ${sessionId} AND is_correct = false
            ),
            time_spent_seconds = (
              SELECT COALESCE(SUM(time_spent_seconds), 0) 
              FROM kedge_practice.practice_answers 
              WHERE session_id = ${sessionId}
            ),
            score = CASE 
              WHEN total_questions > 0 THEN
                ROUND(
                  (SELECT COUNT(*)::numeric FROM kedge_practice.practice_answers 
                   WHERE session_id = ${sessionId} AND is_correct = true) 
                  / total_questions * 100, 2
                )
              ELSE 0
            END,
            updated_at = NOW()
          WHERE id = ${sessionId}
        `
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating session stats: ${errorMessage}`);
      throw error;
    }
  }

  async updateSessionStatus(
    sessionId: string,
    userId: string,
    status: PracticeSessionStatus,
    additionalUpdates?: {
      started_at?: boolean;
      completed_at?: boolean;
    }
  ): Promise<PracticeSession> {
    try {
      let result;

      if (additionalUpdates?.started_at && additionalUpdates?.completed_at) {
        result = await this.persistentService.pgPool.query(
          sql.type(PracticeSessionSchema)`
            UPDATE kedge_practice.practice_sessions
            SET status = ${status},
                started_at = NOW(),
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = ${sessionId}
            AND user_id = ${userId}
            RETURNING *
          `
        );
      } else if (additionalUpdates?.started_at) {
        result = await this.persistentService.pgPool.query(
          sql.type(PracticeSessionSchema)`
            UPDATE kedge_practice.practice_sessions
            SET status = ${status},
                started_at = NOW(),
                updated_at = NOW()
            WHERE id = ${sessionId}
            AND user_id = ${userId}
            RETURNING *
          `
        );
      } else if (additionalUpdates?.completed_at) {
        result = await this.persistentService.pgPool.query(
          sql.type(PracticeSessionSchema)`
            UPDATE kedge_practice.practice_sessions
            SET status = ${status},
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = ${sessionId}
            AND user_id = ${userId}
            RETURNING *
          `
        );
      } else {
        result = await this.persistentService.pgPool.query(
          sql.type(PracticeSessionSchema)`
            UPDATE kedge_practice.practice_sessions
            SET status = ${status},
                updated_at = NOW()
            WHERE id = ${sessionId}
            AND user_id = ${userId}
            RETURNING *
          `
        );
      }

      if (result.rowCount === 0) {
        throw new Error('Practice session not found');
      }

      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating session status: ${errorMessage}`);
      throw error;
    }
  }

  async getSessionHistory(
    userId: string,
    status?: PracticeSessionStatus,
    limit = 20,
    offset = 0
  ): Promise<PracticeSession[]> {
    try {
      let result;
      
      if (status) {
        result = await this.persistentService.pgPool.query(
          sql.type(PracticeSessionSchema)`
            SELECT * FROM kedge_practice.practice_sessions
            WHERE user_id = ${userId}
            AND status = ${status}
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
        );
      } else {
        result = await this.persistentService.pgPool.query(
          sql.type(PracticeSessionSchema)`
            SELECT * FROM kedge_practice.practice_sessions
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
        );
      }
      
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting session history: ${errorMessage}`);
      throw error;
    }
  }

  async getBasicStatistics(userId: string): Promise<any> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(BasicStatisticsSchema)`
          SELECT 
            COUNT(*) as total_sessions,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
            AVG(score) as average_score
          FROM kedge_practice.practice_sessions
          WHERE user_id = ${userId}
        `
      );

      return result.rows[0] || { total_sessions: 0, completed_sessions: 0, average_score: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting statistics: ${errorMessage}`);
      throw error;
    }
  }

  async getAnswersForSession(sessionId: string): Promise<readonly any[]> {
    try {
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT 
          id,
          session_id,
          quiz_id,
          user_answer,
          is_correct,
          time_spent_seconds,
          created_at
        FROM kedge_practice.practice_answers
        WHERE session_id = ${sessionId}
        ORDER BY created_at ASC
      `);

      return result.rows;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting answers for session: ${errorMessage}`);
      throw error;
    }
  }

  async getLastCompletedSession(userId: string): Promise<PracticeSession | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          SELECT *
          FROM kedge_practice.practice_sessions
          WHERE user_id = ${userId}
            AND status = 'completed'
          ORDER BY updated_at DESC
          LIMIT 1
        `
      );

      return result.rows[0] || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting last completed session: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Update the correctness of an existing answer
   * Used when AI re-evaluation determines the answer is actually correct
   */
  async updateAnswerCorrectness(
    sessionId: string,
    quizId: string,
    isCorrect: boolean
  ): Promise<boolean> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.practice_answers
          SET is_correct = ${isCorrect},
              updated_at = NOW()
          WHERE session_id = ${sessionId}::uuid
            AND quiz_id = ${quizId}::uuid
        `
      );

      return result.rowCount > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating answer correctness: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Find the most recent incomplete session for a user
   * Returns the newest session with status 'pending' or 'in_progress'
   * Sessions older than 7 days are excluded
   */
  async findIncompleteSessionByUserId(userId: string): Promise<PracticeSession | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          SELECT * FROM kedge_practice.practice_sessions
          WHERE user_id = ${userId}
          AND status IN ('pending', 'in_progress')
          AND updated_at > NOW() - INTERVAL '7 days'
          ORDER BY updated_at DESC
          LIMIT 1
        `
      );

      return result.rowCount > 0 ? result.rows[0] : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding incomplete session: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Update session progress - track current question index and UI state
   */
  async updateSessionProgress(
    sessionId: string,
    userId: string,
    lastQuestionIndex: number,
    sessionState?: Record<string, any>
  ): Promise<void> {
    try {
      const updateParams: any = {
        last_question_index: lastQuestionIndex,
        updated_at: sql.fragment`NOW()`
      };

      if (sessionState) {
        await this.persistentService.pgPool.query(
          sql.unsafe`
            UPDATE kedge_practice.practice_sessions
            SET last_question_index = ${lastQuestionIndex},
                session_state = ${sql.json(sessionState)},
                updated_at = NOW()
            WHERE id = ${sessionId}
            AND user_id = ${userId}
          `
        );
      } else {
        await this.persistentService.pgPool.query(
          sql.unsafe`
            UPDATE kedge_practice.practice_sessions
            SET last_question_index = ${lastQuestionIndex},
                updated_at = NOW()
            WHERE id = ${sessionId}
            AND user_id = ${userId}
          `
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating session progress: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Mark a session as abandoned
   */
  async abandonSession(sessionId: string, userId: string): Promise<void> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          UPDATE kedge_practice.practice_sessions
          SET status = 'abandoned',
              updated_at = NOW()
          WHERE id = ${sessionId}
          AND user_id = ${userId}
          AND status IN ('pending', 'in_progress')
        `
      );

      if (result.rowCount === 0) {
        throw new Error('Session not found or already completed/abandoned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error abandoning session: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get all answers for a session
   */
  async getAnswersBySessionId(sessionId: string): Promise<PracticeAnswer[]> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(PracticeAnswerSchema)`
          SELECT * FROM kedge_practice.practice_answers
          WHERE session_id = ${sessionId}
          ORDER BY answered_at ASC
        `
      );

      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting answers by session: ${errorMessage}`);
      throw error;
    }
  }
}