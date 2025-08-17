import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePracticeSession,
  PracticeSession,
  PracticeSessionResponse,
  SubmitAnswer,
  PracticeStatistics,
  PracticeSessionStatus
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
    studentId: string,
    data: CreatePracticeSession
  ): Promise<PracticeSessionResponse> {
    const sessionId = uuidv4();
    
    // Fetch quizzes based on criteria
    const allQuizzes = await this.quizService.listQuizzes();
    
    // Filter quizzes by knowledge point IDs
    const filteredQuizzes = allQuizzes.filter(quiz => 
      quiz.knowledge_point_id && data.knowledge_point_ids.includes(quiz.knowledge_point_id)
    );
    
    // Limit the number of questions
    const quizzes = filteredQuizzes.slice(0, data.question_count);

    if (quizzes.length === 0) {
      throw new BadRequestException('No quizzes available for selected knowledge points');
    }

    // Shuffle quizzes if requested
    const finalQuizzes = data.shuffle_questions 
      ? this.shuffleArray(quizzes)
      : quizzes;

    // Prepare session data
    const sessionData = {
      strategy: data.strategy,
      knowledge_point_ids: data.knowledge_point_ids,
      total_questions: finalQuizzes.length,
      time_limit_minutes: data.time_limit_minutes,
      difficulty: data.difficulty
    };

    // Prepare questions data
    const questionsData = finalQuizzes.map((quiz, index) => {
      const options = data.shuffle_options && quiz.options
        ? this.shuffleArray(quiz.options)
        : quiz.options;

      return {
        id: uuidv4(),
        quiz_id: quiz.id,
        question_number: index + 1,
        question: quiz.question,
        options: options || [],
        correct_answer: quiz.correct_answer,
        knowledge_point_id: quiz.knowledge_point_id,
        difficulty: quiz.difficulty || 'medium',
        attachments: quiz.attachments || []
      };
    });

    // Create session with all questions in one transaction
    const result = await this.practiceRepository.createSessionWithQuestions(
      sessionId,
      studentId,
      sessionData,
      questionsData
    );

    return {
      session: result.session,
      questions: result.questions
    };
  }

  async startSession(sessionId: string, studentId: string): Promise<PracticeSessionResponse> {
    const sessionData = await this.practiceRepository.getSessionWithQuestions(sessionId, studentId);
    
    if (!sessionData) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (sessionData.session.status !== 'created') {
      throw new BadRequestException(`Session cannot be started from status: ${sessionData.session.status}`);
    }

    const updatedSession = await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'in_progress',
      { started_at: true }
    );

    return {
      session: updatedSession,
      questions: sessionData.questions
    };
  }

  async submitAnswer(data: SubmitAnswer, studentId: string): Promise<{ isCorrect: boolean }> {
    const sessionData = await this.practiceRepository.getSessionWithQuestions(data.session_id, studentId);
    
    if (!sessionData) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (sessionData.session.status !== 'in_progress') {
      throw new BadRequestException('Session is not in progress');
    }

    const result = await this.practiceRepository.submitAnswer(
      data.question_id,
      data.session_id,
      data.answer,
      data.time_spent_seconds
    );

    // Check if session should be completed
    const updatedSessionData = await this.practiceRepository.getSessionWithQuestions(data.session_id, studentId);
    if (updatedSessionData && updatedSessionData.session.answered_questions >= updatedSessionData.session.total_questions) {
      await this.completeSession(data.session_id, studentId);
    }

    return result;
  }

  async pauseSession(sessionId: string, studentId: string): Promise<PracticeSession> {
    const sessionData = await this.practiceRepository.getSessionWithQuestions(sessionId, studentId);
    
    if (!sessionData) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (sessionData.session.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress sessions can be paused');
    }

    return await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'paused'
    );
  }

  async resumeSession(sessionId: string, studentId: string): Promise<PracticeSessionResponse> {
    const sessionData = await this.practiceRepository.getSessionWithQuestions(sessionId, studentId);
    
    if (!sessionData) {
      throw new NotFoundException('Practice session not found');
    }
    
    if (sessionData.session.status !== 'paused') {
      throw new BadRequestException('Only paused sessions can be resumed');
    }

    const updatedSession = await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'in_progress'
    );

    return {
      session: updatedSession,
      questions: sessionData.questions
    };
  }

  async completeSession(sessionId: string, studentId: string): Promise<PracticeSession> {
    return await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'completed',
      { completed_at: true }
    );
  }

  async getSession(sessionId: string, studentId: string): Promise<PracticeSessionResponse> {
    const sessionData = await this.practiceRepository.getSessionWithQuestions(sessionId, studentId);

    if (!sessionData) {
      throw new NotFoundException('Practice session not found');
    }

    return {
      session: sessionData.session,
      questions: sessionData.questions
    };
  }

  async getSessionHistory(
    studentId: string,
    status?: PracticeSessionStatus,
    limit = 20,
    offset = 0
  ): Promise<PracticeSession[]> {
    return await this.practiceRepository.getSessionHistory(
      studentId,
      status,
      limit,
      offset
    );
  }

  async getStatistics(studentId: string): Promise<any> {
    const basicStats = await this.practiceRepository.getBasicStatistics(studentId);
    const recentSessions = await this.getSessionHistory(studentId, undefined, 10, 0);

    return {
      student_id: studentId,
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