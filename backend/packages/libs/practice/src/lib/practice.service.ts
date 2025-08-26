import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'slonik';
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
import { QuizRepository } from '@kedge/quiz';
import { PersistentService } from '@kedge/persistent';
import { GptService } from '@kedge/quiz-parser';

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);
  
  constructor(
    private readonly practiceRepository: PracticeRepository,
    private readonly quizService: QuizService,
    private readonly quizRepository: QuizRepository,
    private readonly persistentService: PersistentService,
    private readonly gptService: GptService
  ) {}

  async createSession(
    userId: string,
    data: CreatePracticeSession
  ): Promise<PracticeSessionResponse> {
    const sessionId = uuidv4();
    
    // Handle different question types (new, with-wrong, wrong-only)
    let quizzes: QuizItem[] = [];
    
    if (data.question_type === 'wrong-only') {
      // Get only wrong questions from user's history
      // For wrong questions, don't require knowledge points - get any wrong questions
      quizzes = await this.getWrongQuizzesForUser(
        userId,
        [], // Don't filter by knowledge points for wrong questions
        data.question_count,
        data.quiz_types
      );
      
      // If no wrong questions found, return empty array but don't error
      if (quizzes.length === 0) {
        this.logger.log('No wrong questions found for user, returning empty quiz set');
      }
    } else if (data.question_type === 'new-only') {
      // Get only questions the user hasn't attempted
      quizzes = await this.getNewQuizzesForUser(
        userId,
        data.knowledge_point_ids || [],
        data.question_count,
        data.quiz_types
      );
    } else {
      // Default: Get random quizzes (may include both new and wrong)
      quizzes = await this.quizService.getRandomQuizzesByKnowledgePoints(
        data.knowledge_point_ids || [],
        data.question_count,
        data.quiz_types
      );
    }
    
    // If no quizzes found, throw error
    if (quizzes.length === 0) {
      let errorMessage = 'No quizzes available';
      
      // Different message for wrong-only questions
      if (data.question_type === 'wrong-only') {
        errorMessage = '暂无错题记录。请先完成几次练习后再使用此功能。';
      } else {
        if (data.knowledge_point_ids && data.knowledge_point_ids.length > 0) {
          errorMessage += ` for knowledge points: ${data.knowledge_point_ids.join(', ')}`;
        }
        
        if (data.quiz_types && data.quiz_types.length > 0) {
          errorMessage += ` with quiz types: ${data.quiz_types.join(', ')}`;
        }
      }
      
      throw new BadRequestException(errorMessage);
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
        subject_id: data.subject_id,
        strategy: data.strategy,
        total_questions: finalQuizzes.length,
        time_limit_minutes: data.time_limit_minutes,
        auto_advance_delay: data.auto_advance_delay,
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

    // Enhanced answer evaluation logic (without automatic GPT)
    let isCorrect = false;
    const userAnswer = data.answer?.trim();
    
    if (!userAnswer) {
      isCorrect = false;
    } else if (quiz.type === 'fill-in-the-blank') {
      // For fill-in-the-blank questions, check exact match and alternative answers only
      const correctAnswer = Array.isArray(quiz.answer) ? quiz.answer[0] : quiz.answer;
      const correctAnswerStr = String(correctAnswer).trim();
      
      // Step 1: Check exact match (case-insensitive)
      if (userAnswer.toLowerCase() === correctAnswerStr.toLowerCase()) {
        isCorrect = true;
        this.logger.log(`Answer matched exactly (case-insensitive): "${userAnswer}" === "${correctAnswerStr}"`);
      }
      // Step 2: Check alternative answers
      else if (quiz.alternative_answers && quiz.alternative_answers.length > 0) {
        isCorrect = quiz.alternative_answers.some(
          alt => alt.toLowerCase() === userAnswer.toLowerCase()
        );
        if (isCorrect) {
          this.logger.log(`Answer matched alternative: "${userAnswer}" in [${quiz.alternative_answers.join(', ')}]`);
        }
      }
      // Step 3: No automatic GPT validation - user must request it manually
      else {
        isCorrect = false;
        this.logger.log(`Answer did not match, user can request AI re-evaluation: "${userAnswer}" vs "${correctAnswerStr}"`);
      }
    } else {
      // For other question types, use original logic
      const correctAnswer = Array.isArray(quiz.answer) ? quiz.answer.join(',') : quiz.answer;
      isCorrect = userAnswer === String(correctAnswer);
    }

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

  /**
   * Get quizzes that the user previously answered incorrectly
   */
  private async getWrongQuizzesForUser(
    userId: string,
    knowledgePointIds: string[],
    questionCount: number,
    quizTypes?: string[]
  ): Promise<QuizItem[]> {
    try {
      // Build the query to get wrong quiz IDs
      let whereClause = sql.unsafe`
        ps.user_id = ${userId}::uuid
        AND pa.is_correct = false
      `;

      // Add knowledge point filter if specified
      if (knowledgePointIds.length > 0) {
        whereClause = sql.unsafe`
          ${whereClause}
          AND q.knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'text')})
        `;
      }

      // Add quiz type filter if specified
      if (quizTypes && quizTypes.length > 0) {
        whereClause = sql.unsafe`
          ${whereClause}
          AND q.type = ANY(${sql.array(quizTypes, 'text')})
        `;
      }

      // Use a subquery to first get distinct quiz IDs, then order randomly
      const query = sql.unsafe`
        SELECT quiz_id FROM (
          SELECT DISTINCT pa.quiz_id
          FROM kedge_practice.practice_answers pa
          JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
          JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
          WHERE ${whereClause}
        ) AS distinct_quizzes
        ORDER BY RANDOM()
        LIMIT ${questionCount}
      `;

      const result = await this.persistentService.pgPool.query(query);
      
      if (result.rows.length === 0) {
        return [];
      }

      // Get the full quiz details
      const quizIds = result.rows.map(row => row.quiz_id);
      return await this.quizService.getQuizzesByIds(quizIds);
    } catch (error) {
      this.logger.error('Failed to get wrong quizzes for user', error);
      return [];
    }
  }

  /**
   * Get quizzes that the user has never attempted
   */
  private async getNewQuizzesForUser(
    userId: string,
    knowledgePointIds: string[],
    questionCount: number,
    quizTypes?: string[]
  ): Promise<QuizItem[]> {
    try {
      // Build the query to get quiz IDs the user hasn't attempted
      let query = sql.unsafe`
        SELECT q.id
        FROM kedge_practice.quizzes q
        WHERE q.id NOT IN (
          SELECT DISTINCT pa.quiz_id
          FROM kedge_practice.practice_answers pa
          JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
          WHERE ps.user_id = ${userId}::uuid
        )
      `;

      // Add knowledge point filter if specified
      if (knowledgePointIds.length > 0) {
        query = sql.unsafe`
          ${query}
          AND q.knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'text')})
        `;
      }

      // Add quiz type filter if specified
      if (quizTypes && quizTypes.length > 0) {
        query = sql.unsafe`
          ${query}
          AND q.type = ANY(${sql.array(quizTypes, 'text')})
        `;
      }

      // Limit the results
      query = sql.unsafe`
        ${query}
        ORDER BY RANDOM()
        LIMIT ${questionCount}
      `;

      const result = await this.persistentService.pgPool.query(query);
      
      if (result.rows.length === 0) {
        return [];
      }

      // Get the full quiz details
      const quizIds = result.rows.map(row => row.id);
      return await this.quizService.getQuizzesByIds(quizIds);
    } catch (error) {
      this.logger.error('Failed to get new quizzes for user', error);
      return [];
    }
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

  async createWrongQuestionsSession(
    userId: string,
    sessionLimit = 5
  ): Promise<PracticeSessionResponse> {
    // Get wrong question IDs from recent sessions
    const wrongQuestionsData = await this.getRecentWrongQuestions(userId, sessionLimit);
    
    if (wrongQuestionsData.wrong_question_ids.length === 0) {
      throw new BadRequestException('No wrong questions found in recent practice sessions');
    }
    
    const sessionId = uuidv4();
    const quizIds = wrongQuestionsData.wrong_question_ids;
    
    // Fetch the actual quiz items
    const quizzes = await this.quizService.getQuizzesByIds(quizIds);
    
    if (quizzes.length === 0) {
      throw new BadRequestException('Could not load wrong questions');
    }
    
    // Create session with wrong question IDs
    const session = await this.practiceRepository.createSession(
      sessionId,
      userId,
      quizIds,
      {
        strategy: 'review', // Using 'review' strategy for wrong questions
        total_questions: quizzes.length,
        time_limit_minutes: undefined, // No time limit for review
      }
    );
    
    return {
      session,
      quizzes,
      answers: []
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

  async createQuickPracticeSession(userId: string, questionLimit: number = 10): Promise<any> {
    try {
      // Get last completed session to find knowledge points
      const lastSession = await this.practiceRepository.getLastCompletedSession(userId);
      
      if (!lastSession) {
        throw new Error('No previous practice session found');
      }

      // Get quizzes from last session's knowledge points
      const quizIds = lastSession.quiz_ids;
      if (!quizIds || quizIds.length === 0) {
        throw new Error('No quizzes found from last session');
      }

      // Create a quick practice session with limited questions
      const sessionId = uuidv4();
      const limitedQuizIds = quizIds.slice(0, questionLimit);
      
      const session = await this.practiceRepository.createSession(
        sessionId,
        userId,
        limitedQuizIds,
        {
          strategy: 'quick-practice',
          total_questions: limitedQuizIds.length,
          time_limit_minutes: 10
        }
      );

      return {
        success: true,
        session_id: sessionId,
        question_count: limitedQuizIds.length,
        message: 'Quick practice session created successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating quick practice session: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async checkQuickOptionsAvailability(userId: string): Promise<any> {
    try {
      // Check for quick practice (needs previous session)
      const lastSession = await this.practiceRepository.getLastCompletedSession(userId);
      const canQuickPractice = !!lastSession;
      
      // Check for weak points (needs practice history with errors)
      const weakPoints = await this.analyzeWeakKnowledgePoints(userId, 1);
      const canWeakPointsPractice = weakPoints?.weak_points && weakPoints.weak_points.length > 0;
      
      // Check for wrong questions (needs recent wrong answers)
      const wrongQuestions = await this.getRecentWrongQuestions(userId, 1);
      const canWrongQuestionsPractice = wrongQuestions?.wrong_question_ids && wrongQuestions.wrong_question_ids.length > 0;
      
      return {
        quick_practice: {
          available: canQuickPractice,
          message: canQuickPractice ? '继续上次的知识点练习' : '请先完成一次完整的练习以解锁此功能'
        },
        weak_points: {
          available: canWeakPointsPractice,
          message: canWeakPointsPractice ? '针对您的薄弱知识点进行强化练习' : '暂无薄弱知识点，继续保持！'
        },
        wrong_questions: {
          available: canWrongQuestionsPractice,
          message: canWrongQuestionsPractice ? '复习最近练习中的错题' : '暂无错题记录，继续努力！'
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error checking quick options availability: ${errorMessage}`);
      return {
        quick_practice: { available: false, message: '无法获取状态' },
        weak_points: { available: false, message: '无法获取状态' },
        wrong_questions: { available: false, message: '无法获取状态' }
      };
    }
  }

  async createWeakPointsSession(userId: string, limit: number = 20): Promise<any> {
    try {
      // Get weak knowledge points
      const weakPoints = await this.analyzeWeakKnowledgePoints(userId, limit);
      
      if (!weakPoints?.weak_points || weakPoints.weak_points.length === 0) {
        throw new Error('No weak knowledge points identified');
      }

      // Get knowledge point IDs
      const knowledgePointIds = weakPoints.weak_points.map((wp: any) => wp.knowledge_point_id);
      
      // Fetch quizzes for these knowledge points
      const quizResult = await this.persistentService.pgPool.query(sql.unsafe`
        SELECT DISTINCT q.id
        FROM kedge_practice.quizzes q
        WHERE q.knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
        AND q.is_deleted = false
        ORDER BY RANDOM()
        LIMIT ${limit}
      `);

      if (quizResult.rowCount === 0) {
        throw new Error('No quizzes found for weak knowledge points');
      }

      const quizIds = quizResult.rows.map(row => row.id);
      const sessionId = uuidv4();
      
      const session = await this.practiceRepository.createSession(
        sessionId,
        userId,
        quizIds,
        {
          strategy: 'weak-points',
          total_questions: quizIds.length,
          time_limit_minutes: undefined
        }
      );

      return {
        success: true,
        session_id: sessionId,
        question_count: quizIds.length,
        weak_points_targeted: knowledgePointIds.length,
        message: 'Weak points practice session created successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating weak points session: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Manual AI re-evaluation of a fill-in-the-blank answer
   * This allows users to explicitly request AI to check their answer
   */
  async aiReevaluateAnswer(
    sessionId: string,
    questionId: string,
    userAnswer: string,
    userId: string
  ): Promise<{ isCorrect: boolean; reasoning: string; message?: string }> {
    try {
      // Verify session belongs to user
      const session = await this.practiceRepository.getSession(sessionId, userId);
      if (!session) {
        throw new NotFoundException('Practice session not found');
      }

      // Get the quiz details
      const quiz = await this.quizService.getQuizById(questionId);
      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }

      // Only allow re-evaluation for fill-in-the-blank questions
      if (quiz.type !== 'fill-in-the-blank') {
        throw new BadRequestException('AI re-evaluation is only available for fill-in-the-blank questions');
      }

      const correctAnswer = Array.isArray(quiz.answer) ? quiz.answer[0] : quiz.answer;
      const correctAnswerStr = String(correctAnswer).trim();
      const userAnswerTrimmed = userAnswer?.trim();

      if (!userAnswerTrimmed) {
        return {
          isCorrect: false,
          reasoning: '答案不能为空',
        };
      }

      // Check if it's already an exact match or in alternative answers
      if (userAnswerTrimmed.toLowerCase() === correctAnswerStr.toLowerCase()) {
        return {
          isCorrect: true,
          reasoning: '答案完全匹配',
        };
      }

      if (quiz.alternative_answers?.some(alt => alt.toLowerCase() === userAnswerTrimmed.toLowerCase())) {
        return {
          isCorrect: true,
          reasoning: '答案已在系统认可的替代答案中',
        };
      }

      // Use GPT to evaluate the answer
      this.logger.log(`AI re-evaluation requested for: "${userAnswerTrimmed}" vs "${correctAnswerStr}"`);
      
      const gptValidation = await this.gptService.validateFillInBlankAnswer(
        quiz.question,
        correctAnswerStr,
        userAnswerTrimmed,
        quiz.originalParagraph || undefined
      );

      if (gptValidation.isCorrect) {
        // Add this answer to alternative answers for future use
        await this.quizRepository.addAlternativeAnswer(questionId, userAnswerTrimmed);
        this.logger.log(`Added "${userAnswerTrimmed}" as alternative answer for quiz ${questionId}`);

        // Update the answer in the database to mark it as correct
        await this.practiceRepository.updateAnswerCorrectness(sessionId, questionId, true);

        return {
          isCorrect: true,
          reasoning: gptValidation.reasoning || 'AI判断答案正确',
          message: '系统已记录此答案，未来相同答案将自动判定为正确',
        };
      } else {
        return {
          isCorrect: false,
          reasoning: gptValidation.reasoning || 'AI判断答案不正确',
        };
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Error in AI re-evaluation: ${error}`);
      throw new BadRequestException('AI评估失败，请稍后重试');
    }
  }
}