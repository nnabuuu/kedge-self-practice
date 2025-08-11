import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreatePracticeSession,
  PracticeSession,
  PracticeQuestion,
  SubmitAnswer,
  SkipQuestion,
  PracticeSessionResponse,
  PracticeStatistics,
  PracticeSessionStatus
} from '@kedge/models';
import { PracticeRepository } from './practice.repository';

@Injectable()
export class PracticeService {
  constructor(private readonly practiceRepository: PracticeRepository) {}

  async createSession(
    studentId: string,
    data: CreatePracticeSession
  ): Promise<PracticeSessionResponse> {
    const sessionId = uuidv4();
    
    const quizzes = await this.practiceRepository.fetchQuizzes(
      data.knowledge_point_ids,
      data.question_count,
      data.difficulty,
      data.strategy,
      studentId
    );

    if (quizzes.length === 0) {
      throw new BadRequestException('No quizzes available for selected knowledge points');
    }

    const shuffledQuizzes = data.shuffle_questions 
      ? this.shuffleArray(quizzes)
      : quizzes;

    const session = await this.practiceRepository.createSession(
      sessionId,
      studentId,
      {
        strategy: data.strategy,
        knowledge_point_ids: data.knowledge_point_ids,
        total_questions: shuffledQuizzes.length,
        time_limit_minutes: data.time_limit_minutes,
        difficulty: data.difficulty
      }
    );

    const questions: PracticeQuestion[] = [];
    for (let i = 0; i < shuffledQuizzes.length; i++) {
      const quiz = shuffledQuizzes[i];
      const questionId = uuidv4();
      const options = data.shuffle_options && quiz.options
        ? this.shuffleArray(quiz.options)
        : quiz.options;

      const question = await this.practiceRepository.createQuestion({
        id: questionId,
        session_id: sessionId,
        quiz_id: quiz.id,
        question_number: i + 1,
        question: quiz.question,
        options: options || [],
        correct_answer: data.show_answer_immediately ? quiz.correct_answer : quiz.correct_answer,
        knowledge_point_id: quiz.knowledge_point_id,
        difficulty: quiz.difficulty || 'medium',
        attachments: quiz.attachments
      });
      questions.push(question);
    }

    return {
      session,
      current_question: questions[0] || undefined
    };
  }

  async startSession(sessionId: string, studentId: string): Promise<PracticeSessionResponse> {
    const session = await this.getSession(sessionId, studentId);
    
    if (session.status !== 'created') {
      throw new BadRequestException(`Session cannot be started from status: ${session.status}`);
    }

    const updatedSession = await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'in_progress',
      { started_at: true }
    );

    const currentQuestion = await this.practiceRepository.getCurrentQuestion(sessionId);

    return {
      session: updatedSession,
      current_question: currentQuestion || undefined
    };
  }

  async submitAnswer(data: SubmitAnswer, studentId: string): Promise<PracticeSessionResponse> {
    const session = await this.getSession(data.session_id, studentId);
    
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Session is not in progress');
    }

    const { isCorrect } = await this.practiceRepository.submitAnswer(
      data.question_id,
      data.session_id,
      data.answer,
      data.time_spent_seconds
    );

    const updatedSession = await this.getSession(data.session_id, studentId);
    const nextQuestion = await this.practiceRepository.getNextQuestion(data.session_id);

    if (!nextQuestion && updatedSession.answered_questions >= updatedSession.total_questions) {
      const completedSession = await this.completeSession(data.session_id, studentId);
      return {
        session: completedSession,
        current_question: undefined
      };
    }

    return {
      session: updatedSession,
      current_question: nextQuestion || undefined
    };
  }

  async skipQuestion(data: SkipQuestion, studentId: string): Promise<PracticeSessionResponse> {
    const session = await this.getSession(data.session_id, studentId);
    
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Session is not in progress');
    }

    await this.practiceRepository.skipQuestion(
      data.question_id,
      data.session_id,
      data.time_spent_seconds
    );

    const updatedSession = await this.getSession(data.session_id, studentId);
    const nextQuestion = await this.practiceRepository.getNextQuestion(data.session_id);

    return {
      session: updatedSession,
      current_question: nextQuestion || undefined
    };
  }

  async getNextQuestion(sessionId: string): Promise<PracticeQuestion | undefined> {
    const question = await this.practiceRepository.getNextQuestion(sessionId);
    return question || undefined;
  }

  async getCurrentQuestion(sessionId: string): Promise<PracticeQuestion | undefined> {
    const question = await this.practiceRepository.getCurrentQuestion(sessionId);
    return question || undefined;
  }

  async pauseSession(sessionId: string, studentId: string): Promise<PracticeSession> {
    const session = await this.getSession(sessionId, studentId);
    
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Only in-progress sessions can be paused');
    }

    return await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'paused'
    );
  }

  async resumeSession(sessionId: string, studentId: string): Promise<PracticeSessionResponse> {
    const session = await this.getSession(sessionId, studentId);
    
    if (session.status !== 'paused') {
      throw new BadRequestException('Only paused sessions can be resumed');
    }

    const updatedSession = await this.practiceRepository.updateSessionStatus(
      sessionId,
      studentId,
      'in_progress'
    );

    const currentQuestion = await this.practiceRepository.getCurrentQuestion(sessionId);

    return {
      session: updatedSession,
      current_question: currentQuestion || undefined
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

  async getSession(sessionId: string, studentId: string): Promise<PracticeSession> {
    const session = await this.practiceRepository.getSession(sessionId, studentId);

    if (!session) {
      throw new NotFoundException('Practice session not found');
    }

    return session;
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

  async getStatistics(studentId: string): Promise<PracticeStatistics> {
    const { stats, knowledgePointPerformance, difficultyPerformance } = 
      await this.practiceRepository.getStatistics(studentId);

    const recentSessions = await this.getSessionHistory(studentId, undefined, 10, 0);

    const totalQuestionsAnswered = parseInt(stats.total_questions_answered || 0);
    const totalCorrect = parseInt(stats.total_correct || 0);

    return {
      student_id: studentId,
      total_sessions: parseInt(stats.total_sessions || 0),
      completed_sessions: parseInt(stats.completed_sessions || 0),
      total_questions_answered: totalQuestionsAnswered,
      total_correct: totalCorrect,
      total_incorrect: parseInt(stats.total_incorrect || 0),
      total_skipped: parseInt(stats.total_skipped || 0),
      average_accuracy: totalQuestionsAnswered > 0 
        ? (totalCorrect / totalQuestionsAnswered) * 100 
        : 0,
      total_time_spent_minutes: parseFloat(stats.total_time_spent_minutes || 0),
      knowledge_point_performance: knowledgePointPerformance.map((kp: any) => ({
        knowledge_point_id: kp.knowledge_point_id,
        knowledge_point_name: kp.knowledge_point_name || 'Unknown',
        total_questions: parseInt(kp.total_questions || 0),
        correct_answers: parseInt(kp.correct_answers || 0),
        accuracy: parseInt(kp.total_questions || 0) > 0 
          ? (parseInt(kp.correct_answers || 0) / parseInt(kp.total_questions || 0)) * 100 
          : 0,
        average_time_seconds: parseFloat(kp.average_time_seconds || 0)
      })),
      difficulty_performance: {
        easy: {
          total: parseInt(difficultyPerformance?.easy_total || 0),
          correct: parseInt(difficultyPerformance?.easy_correct || 0),
          accuracy: parseInt(difficultyPerformance?.easy_total || 0) > 0
            ? (parseInt(difficultyPerformance?.easy_correct || 0) / parseInt(difficultyPerformance?.easy_total || 0)) * 100
            : 0
        },
        medium: {
          total: parseInt(difficultyPerformance?.medium_total || 0),
          correct: parseInt(difficultyPerformance?.medium_correct || 0),
          accuracy: parseInt(difficultyPerformance?.medium_total || 0) > 0
            ? (parseInt(difficultyPerformance?.medium_correct || 0) / parseInt(difficultyPerformance?.medium_total || 0)) * 100
            : 0
        },
        hard: {
          total: parseInt(difficultyPerformance?.hard_total || 0),
          correct: parseInt(difficultyPerformance?.hard_correct || 0),
          accuracy: parseInt(difficultyPerformance?.hard_total || 0) > 0
            ? (parseInt(difficultyPerformance?.hard_correct || 0) / parseInt(difficultyPerformance?.hard_total || 0)) * 100
            : 0
        }
      },
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