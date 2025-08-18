import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePracticeSession,
  PracticeSession,
  PracticeSessionResponse,
  SubmitAnswer,
  PracticeStatistics,
  PracticeSessionStatus,
  QuizItem
} from '@kedge/models';
import { PracticeRepository } from './practice.repository';
import { QuizService } from '@kedge/quiz';

@Injectable()
export class PracticeService {
  constructor(
    private readonly practiceRepository: PracticeRepository,
    private readonly quizService: QuizService
  ) {}

  async createSession(
    userId: string,
    data: CreatePracticeSession
  ): Promise<PracticeSessionResponse> {
    const sessionId = uuidv4();
    
    // Fetch random quizzes based on criteria - let the database do the work
    const quizzes = await this.quizService.getRandomQuizzesByKnowledgePoints(
      data.knowledge_point_ids || [],
      data.question_count
    );
    
    // If no quizzes found, throw error
    if (quizzes.length === 0) {
      throw new BadRequestException(
        data.knowledge_point_ids && data.knowledge_point_ids.length > 0
          ? `No quizzes available for knowledge points: ${data.knowledge_point_ids.join(', ')}`
          : 'No quizzes available in the database'
      );
    }

    // Shuffle quizzes if requested
    const finalQuizzes = data.shuffle_questions 
      ? this.shuffleArray(quizzes)
      : quizzes;

    // Extract quiz IDs
    const quizIds = finalQuizzes.map(quiz => quiz.id || uuidv4());

    // Create session with quiz IDs
    const session = await this.practiceRepository.createSession(
      sessionId,
      userId,
      quizIds,
      {
        strategy: data.strategy,
        total_questions: finalQuizzes.length,
        time_limit_minutes: data.time_limit_minutes,
      }
    );

    return {
      session,
      quizzes: finalQuizzes,
      answers: []
    };
  }

  async startSession(sessionId: string, userId: string): Promise<PracticeSessionResponse> {
    const session = await this.practiceRepository.getSession(sessionId, userId);
    
    if (!session) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (session.status !== 'pending') {
      throw new BadRequestException(`Session cannot be started from status: ${session.status}`);
    }

    const updatedSession = await this.practiceRepository.updateSessionStatus(
      sessionId,
      userId,
      'in_progress',
      { started_at: true }
    );

    // Fetch the actual quiz items from the quiz service
    const quizzes = await this.quizService.getQuizzesByIds(updatedSession.quiz_ids);
    const answers = await this.practiceRepository.getAnswersForSession(sessionId);

    return {
      session: updatedSession,
      quizzes,
      answers
    };
  }

  async submitAnswer(data: SubmitAnswer, userId: string): Promise<{ isCorrect: boolean }> {
    const session = await this.practiceRepository.getSession(data.session_id, userId);
    
    if (!session) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Session is not in progress');
    }

    // Get the quiz to check the correct answer
    const quiz = await this.quizService.getQuizById(data.question_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Determine if answer is correct
    const correctAnswer = Array.isArray(quiz.answer) ? quiz.answer.join(',') : quiz.answer;
    const isCorrect = data.answer === correctAnswer;

    // Submit the answer
    const result = await this.practiceRepository.submitAnswer(
      data.session_id,
      data.question_id,
      data.answer,
      isCorrect,
      data.time_spent_seconds
    );

    // Check if session should be completed
    const updatedSession = await this.practiceRepository.getSession(data.session_id, userId);
    if (updatedSession && updatedSession.answered_questions >= updatedSession.total_questions) {
      await this.completeSession(data.session_id, userId);
    }

    return { isCorrect };
  }

  async pauseSession(sessionId: string, userId: string): Promise<PracticeSession> {
    const session = await this.practiceRepository.getSession(sessionId, userId);
    
    if (!session) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress sessions can be paused');
    }

    return await this.practiceRepository.updateSessionStatus(
      sessionId,
      userId,
      'abandoned'
    );
  }

  async resumeSession(sessionId: string, userId: string): Promise<PracticeSessionResponse> {
    const session = await this.practiceRepository.getSession(sessionId, userId);
    
    if (!session) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (session.status !== 'pending' && session.status !== 'abandoned') {
      throw new BadRequestException('Only pending or abandoned sessions can be resumed');
    }

    const updatedSession = await this.practiceRepository.updateSessionStatus(
      sessionId,
      userId,
      'in_progress'
    );

    // Fetch the actual quiz items and answers
    const quizzes = await this.quizService.getQuizzesByIds(updatedSession.quiz_ids);
    const answers = await this.practiceRepository.getAnswersForSession(sessionId);

    return {
      session: updatedSession,
      quizzes,
      answers
    };
  }

  async completeSession(sessionId: string, userId: string): Promise<PracticeSession> {
    return await this.practiceRepository.updateSessionStatus(
      sessionId,
      userId,
      'completed',
      { completed_at: true }
    );
  }

  async getSession(sessionId: string, userId: string): Promise<PracticeSessionResponse> {
    const session = await this.practiceRepository.getSession(sessionId, userId);

    if (!session) {
      throw new NotFoundException('Practice session not found');
    }

    // Fetch the actual quiz items and answers
    const quizzes = await this.quizService.getQuizzesByIds(session.quiz_ids);
    const answers = await this.practiceRepository.getAnswersForSession(sessionId);

    return {
      session,
      quizzes,
      answers
    };
  }

  async getSessionHistory(
    userId: string,
    status?: PracticeSessionStatus,
    limit = 20,
    offset = 0
  ): Promise<PracticeSession[]> {
    return await this.practiceRepository.getSessionHistory(
      userId,
      status,
      limit,
      offset
    );
  }

  async getStatistics(userId: string): Promise<any> {
    const basicStats = await this.practiceRepository.getBasicStatistics(userId);
    const recentSessions = await this.getSessionHistory(userId, undefined, 10, 0);

    return {
      user_id: userId,
      total_sessions: parseInt(basicStats.total_sessions || 0),
      completed_sessions: parseInt(basicStats.completed_sessions || 0),
      average_score: parseFloat(basicStats.average_score || 0),
      recent_sessions: recentSessions
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}