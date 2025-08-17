import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  PracticeSession,
  PracticeQuestion,
  PracticeSessionSchema,
  PracticeQuestionSchema,
  PracticeStrategy,
  PracticeSessionStatus,
  QuizItemSchema,
  BasicStatisticsSchema
} from '@kedge/models';

@Injectable()
export class PracticeRepository {
  private readonly logger = new Logger(PracticeRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  async createSessionWithQuestions(
    sessionId: string,
    userId: string,
    sessionData: {
      strategy: string;
      knowledge_point_ids: string[];
      total_questions: number;
      time_limit_minutes?: number;
      difficulty: string;
    },
    questionsData: Array<{
      id: string;
      quiz_id: string;
      question_number: number;
      question: string;
      options: string[];
      correct_answer?: string;
      knowledge_point_id: string;
      difficulty: string;
      attachments?: string[];
    }>
  ): Promise<{ session: PracticeSession; questions: PracticeQuestion[] }> {
    try {
      // Debug logging for session creation
      this.logger.log(`Creating session with data:`, {
        sessionId,
        userId,
        strategy: sessionData.strategy,
        knowledge_point_ids: sessionData.knowledge_point_ids,
        total_questions: sessionData.total_questions,
        time_limit_minutes: sessionData.time_limit_minutes,
        difficulty: sessionData.difficulty
      });
      
      // Create the session first
      this.logger.log('About to create session with SQL...');
      
      // Use a single SQL query with CASE for null handling
      const knowledgePointIdsArray = `{${sessionData.knowledge_point_ids.map(id => `"${id}"`).join(',')}}`;
      const timeLimitValue = sessionData.time_limit_minutes || null;
      
      
      // Debug the parameters before query
      this.logger.log('Session creation parameters:', {
        sessionId: sessionId,
        userId: userId,
        status: 'created',
        strategy: sessionData.strategy,
        knowledge_point_ids: sessionData.knowledge_point_ids,
        total_questions: sessionData.total_questions,
        time_limit_minutes: sessionData.time_limit_minutes || null,
        difficulty: sessionData.difficulty
      });

      // Use proper type-safe Slonik but with a minimal schema
      const MinimalPracticeSessionSchema = z.object({
        id: z.string(),
        user_id: z.string(),
        status: z.string(),
        strategy: z.string(),
        knowledge_point_ids: z.array(z.string()),
        total_questions: z.number(),
        time_limit_minutes: z.number().nullable(),
        difficulty: z.string()
      });

      const sessionResult = await this.persistentService.pgPool.query(
        sql.type(MinimalPracticeSessionSchema)`
          INSERT INTO kedge_practice.practice_sessions (
            id,
            user_id,
            status,
            strategy,
            knowledge_point_ids,
            total_questions,
            time_limit_minutes,
            difficulty
          ) VALUES (
            ${sessionId},
            ${userId},
            ${'created'},
            ${sessionData.strategy},
            ${sql.array(sessionData.knowledge_point_ids, 'text')},
            ${sessionData.total_questions},
            ${sessionData.time_limit_minutes || null},
            ${sessionData.difficulty}
          ) RETURNING *
        `
      );
      
      this.logger.log('Session created successfully, creating questions...');

      // Create all questions
      const questions = [];
      for (const questionData of questionsData) {
        // Debug logging for troubleshooting
        this.logger.log(`Creating question with data:`, {
          id: questionData.id,
          session_id: sessionId,
          quiz_id: questionData.quiz_id,
          knowledge_point_id: questionData.knowledge_point_id
        });
        
        // Use proper Slonik with correct parameter binding for questions
        const questionResult = await this.persistentService.pgPool.query(
          sql.type(PracticeQuestionSchema)`
            INSERT INTO kedge_practice.practice_questions (
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
              ${sessionId},
              ${questionData.quiz_id},
              ${questionData.question_number},
              ${questionData.question},
              ${sql.array(questionData.options || [], 'text')},
              ${questionData.correct_answer || null},
              ${null}, -- knowledge_point_id set to null (remote DB expects UUID, we have TEXT)
              ${questionData.difficulty},
              ${sql.array(questionData.attachments || [], 'text')}
            ) RETURNING *
          `
        );
        questions.push(questionResult.rows[0]);
      }

      const result = {
        session: sessionResult.rows[0],
        questions
      };

      return {
        session: this.mapSession(result.session),
        questions: result.questions.map(q => this.mapQuestion(q))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating practice session with questions: ${errorMessage}`);
      throw new Error('Failed to create practice session');
    }
  }

  async getSessionWithQuestions(sessionId: string, userId: string): Promise<{ session: PracticeSession; questions: PracticeQuestion[] } | null> {
    try {
      const sessionResult = await this.persistentService.pgPool.query(
        sql.type(PracticeSessionSchema)`
          SELECT * FROM kedge_practice.practice_sessions
          WHERE id = ${sessionId}
          AND user_id = ${userId}
        `
      );

      if (sessionResult.rowCount === 0) {
        return null;
      }

      const questionsResult = await this.persistentService.pgPool.query(
        sql.type(PracticeQuestionSchema)`
          SELECT * FROM kedge_practice.practice_questions
          WHERE session_id = ${sessionId}
          ORDER BY question_number
        `
      );

      return {
        session: this.mapSession(sessionResult.rows[0]),
        questions: questionsResult.rows.map(q => this.mapQuestion(q))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting session with questions: ${errorMessage}`);
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
      // Get the correct answer first
      const questionResult = await this.persistentService.pgPool.query(
        sql.type(PracticeQuestionSchema)`
          SELECT correct_answer FROM kedge_practice.practice_questions
          WHERE id = ${questionId}
          AND session_id = ${sessionId}
        `
      );

      if (questionResult.rowCount === 0) {
        throw new Error('Question not found');
      }

      const isCorrect = questionResult.rows[0].correct_answer === answer;

      // Update question and session in transaction
      await this.persistentService.pgPool.transaction(async (connection) => {
        await connection.query(
          sql.type(PracticeQuestionSchema)`
            UPDATE kedge_practice.practice_questions
            SET student_answer = ${answer},
                is_correct = ${isCorrect},
                time_spent_seconds = ${timeSpentSeconds},
                answered_at = NOW()
            WHERE id = ${questionId}
          `
        );

        await connection.query(
          sql.type(PracticeSessionSchema)`
            UPDATE kedge_practice.practice_sessions
            SET answered_questions = answered_questions + 1,
                correct_answers = correct_answers + ${isCorrect ? 1 : 0},
                incorrect_answers = incorrect_answers + ${isCorrect ? 0 : 1},
                time_spent_seconds = time_spent_seconds + ${timeSpentSeconds},
                score = ROUND((correct_answers + ${isCorrect ? 1 : 0})::numeric / total_questions * 100, 2),
                updated_at = NOW()
            WHERE id = ${sessionId}
          `
        );
      });

      return { isCorrect };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error submitting answer: ${errorMessage}`);
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
      
      return result.rows.map(row => this.mapSession(row));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting session history: ${errorMessage}`);
      throw error;
    }
  }

  async fetchQuizzes(
    knowledgePointIds: string[],
    limit: number,
    difficulty: string,
    strategy: PracticeStrategy
  ): Promise<any[]> {
    try {
      let result;

      // Simple random selection for now - can be enhanced later  
      if (difficulty !== 'mixed') {
        result = await this.persistentService.pgPool.query(
          sql.type(QuizItemSchema)`
            SELECT * FROM kedge_practice.quizzes
            WHERE knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'text')})
            AND difficulty = ${difficulty}
            ORDER BY RANDOM()
            LIMIT ${limit}
          `
        );
      } else {
        result = await this.persistentService.pgPool.query(
          sql.type(QuizItemSchema)`
            SELECT * FROM kedge_practice.quizzes
            WHERE knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'text')})
            ORDER BY RANDOM()
            LIMIT ${limit}
          `
        );
      }

      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error fetching quizzes: ${errorMessage}`);
      throw error;
    }
  }

  // Simple statistics - can be enhanced later
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

  private mapSession(data: any): PracticeSession {
    return {
      id: data.id,
      user_id: data.user_id,
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
      options: data.options || [],
      correct_answer: data.correct_answer,
      student_answer: data.student_answer,
      is_correct: data.is_correct,
      time_spent_seconds: parseInt(data.time_spent_seconds || 0),
      answered_at: data.answered_at?.toISOString(),
      attachments: data.attachments || [],
      knowledge_point_id: data.knowledge_point_id,
      difficulty: data.difficulty,
      created_at: data.created_at
    };
  }
}