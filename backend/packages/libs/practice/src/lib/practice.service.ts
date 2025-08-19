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
      answers: [...answers] as any
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
      answers: [...answers] as any
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
      answers: [...answers] as any
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

  // Analysis methods for smart practice features
  async analyzeWeakKnowledgePoints(userId: string, sessionLimit = 20): Promise<any> {
    // Get recent sessions
    const recentSessions = await this.getSessionHistory(userId, 'completed', sessionLimit, 0);
    
    if (recentSessions.length === 0) {
      return { weak_points: [], message: 'No practice history found' };
    }

    // Analyze answers to find knowledge points with high error rates
    const knowledgeStats = new Map<string, { correct: number; total: number }>();
    
    for (const session of recentSessions) {
      const answers = await this.practiceRepository.getAnswersForSession(session.id);
      
      for (const answer of answers) {
        // Get the quiz to find its knowledge point
        const quiz = await this.quizService.getQuizById(answer.quiz_id);
        if (quiz && quiz.knowledge_point_id) {
          const kpId = quiz.knowledge_point_id;
          
          if (!knowledgeStats.has(kpId)) {
            knowledgeStats.set(kpId, { correct: 0, total: 0 });
          }
          
          const stat = knowledgeStats.get(kpId)!;
          stat.total++;
          if (answer.is_correct) {
            stat.correct++;
          }
        }
      }
    }
    
    // Find knowledge points with error rate > 40%
    const weakPoints = [];
    for (const [kpId, stat] of knowledgeStats.entries()) {
      const errorRate = 1 - (stat.correct / stat.total);
      if (errorRate > 0.4) {
        weakPoints.push({
          knowledge_point_id: kpId,
          error_rate: Math.round(errorRate * 100),
          total_questions: stat.total,
          correct_answers: stat.correct
        });
      }
    }
    
    // Sort by error rate (highest first)
    weakPoints.sort((a, b) => b.error_rate - a.error_rate);
    
    return {
      weak_points: weakPoints,
      sessions_analyzed: recentSessions.length
    };
  }

  async getRecentWrongQuestions(userId: string, sessionLimit = 5): Promise<any> {
    const recentSessions = await this.getSessionHistory(userId, 'completed', sessionLimit, 0);
    
    if (recentSessions.length === 0) {
      return { wrong_questions: [], message: 'No practice history found' };
    }

    const wrongQuestionIds = new Set<string>();
    
    for (const session of recentSessions) {
      const answers = await this.practiceRepository.getAnswersForSession(session.id);
      
      for (const answer of answers) {
        if (!answer.is_correct) {
          wrongQuestionIds.add(answer.quiz_id);
        }
      }
    }
    
    return {
      wrong_question_ids: Array.from(wrongQuestionIds),
      total_count: wrongQuestionIds.size,
      sessions_analyzed: recentSessions.length
    };
  }

  async getLastPracticeKnowledgePoints(userId: string): Promise<any> {
    const lastSession = await this.practiceRepository.getLastCompletedSession(userId);
    
    if (!lastSession) {
      return { knowledge_points: [], message: 'No completed sessions found' };
    }

    // Get unique knowledge points from the last session
    const knowledgePointIds = new Set<string>();
    
    for (const quizId of lastSession.quiz_ids) {
      const quiz = await this.quizService.getQuizById(quizId);
      if (quiz && quiz.knowledge_point_id) {
        knowledgePointIds.add(quiz.knowledge_point_id);
      }
    }
    
    return {
      knowledge_point_ids: Array.from(knowledgePointIds),
      session_id: lastSession.id,
      session_date: lastSession.updated_at
    };
  }

  async getKnowledgePointStatistics(
    userId: string, 
    subjectId?: string,
    sessionLimit = 20
  ): Promise<any> {
    const recentSessions = await this.getSessionHistory(userId, 'completed', sessionLimit, 0);
    
    if (recentSessions.length === 0) {
      return { statistics: [], message: 'No practice history found' };
    }

    const knowledgeStats = new Map<string, {
      correct: number;
      total: number;
      wrong: number;
      last_practiced?: Date;
    }>();
    
    for (const session of recentSessions) {
      const answers = await this.practiceRepository.getAnswersForSession(session.id);
      
      for (const answer of answers) {
        const quiz = await this.quizService.getQuizById(answer.quiz_id);
        
        // Filter by subject if specified
        if (quiz && quiz.knowledge_point_id) {
          if (subjectId) {
            // TODO: Check if knowledge point belongs to subject
            // This would require joining with knowledge_points table
          }
          
          const kpId = quiz.knowledge_point_id;
          
          if (!knowledgeStats.has(kpId)) {
            knowledgeStats.set(kpId, { 
              correct: 0, 
              total: 0, 
              wrong: 0 
            });
          }
          
          const stat = knowledgeStats.get(kpId)!;
          stat.total++;
          
          if (answer.is_correct) {
            stat.correct++;
          } else {
            stat.wrong++;
          }
          
          stat.last_practiced = session.updated_at;
        }
      }
    }
    
    // Convert to array and calculate metrics
    const statistics = [];
    for (const [kpId, stat] of knowledgeStats.entries()) {
      const accuracy = stat.total > 0 
        ? Math.round((stat.correct / stat.total) * 100) 
        : 0;
      
      statistics.push({
        knowledge_point_id: kpId,
        total_questions: stat.total,
        correct_answers: stat.correct,
        wrong_answers: stat.wrong,
        accuracy,
        last_practiced: stat.last_practiced,
        mastery_level: 
          accuracy >= 90 ? 'excellent' :
          accuracy >= 75 ? 'good' :
          accuracy >= 60 ? 'needs-improvement' :
          'poor'
      });
    }
    
    // Sort by wrong answers (most errors first)
    statistics.sort((a, b) => b.wrong_answers - a.wrong_answers);
    
    return {
      statistics,
      sessions_analyzed: recentSessions.length
    };
  }
}