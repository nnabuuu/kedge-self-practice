import { Injectable } from '@nestjs/common';
import {
  PracticeSession,
  CreatePracticeSessionRequest,
  UpdatePracticeSessionRequest,
  PracticeHistory,
  QuizConfig,
  KnowledgePointPerformance,
  PracticeSessionSchema,
  CreatePracticeSessionSchema,
  UpdatePracticeSessionSchema,
  QuizItem
} from '@kedge/models';
import { KnowledgePointService } from './knowledge-point.service';
import { SubjectService } from './subject.service';

@Injectable()
export class PracticeSessionService {
  private sessions: Map<string, PracticeSession> = new Map();
  private practiceHistory: Map<string, PracticeHistory[]> = new Map(); // userId -> history[]

  constructor(
    private knowledgePointService: KnowledgePointService,
    private subjectService: SubjectService
  ) {}

  // Create a new practice session
  async createSession(
    userId: string,
    createSessionDto: CreatePracticeSessionRequest
  ): Promise<PracticeSession> {
    // Validate input
    const validatedData = CreatePracticeSessionSchema.parse(createSessionDto);
    
    // Validate subject exists
    const subject = await this.subjectService.findById(validatedData.subjectId);
    if (!subject) {
      throw new Error(`Subject ${validatedData.subjectId} not found`);
    }

    // Validate knowledge points exist
    const knowledgePoints = await this.knowledgePointService.findByIds(validatedData.knowledgePointIds);
    if (knowledgePoints.length !== validatedData.knowledgePointIds.length) {
      throw new Error('Some knowledge points not found');
    }

    // Generate questions based on configuration
    const questionIds = await this.generateQuestions(
      validatedData.knowledgePointIds,
      validatedData.config
    );

    const sessionId = this.generateSessionId();
    const now = new Date();

    const session: PracticeSession = {
      id: sessionId,
      userId,
      subjectId: validatedData.subjectId,
      knowledgePointIds: validatedData.knowledgePointIds,
      questionIds,
      config: validatedData.config,
      answers: new Array(questionIds.length).fill(null),
      questionDurations: [],
      startTime: now,
      completed: false,
      createdAt: now,
      updatedAt: now
    };

    // Validate complete session
    PracticeSessionSchema.parse(session);
    
    this.sessions.set(sessionId, session);
    return session;
  }

  // Get practice session by ID
  async getSessionById(sessionId: string, userId: string): Promise<PracticeSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }
    return session;
  }

  // Update practice session (submit answers, update durations)
  async updateSession(
    sessionId: string,
    userId: string,
    updateDto: UpdatePracticeSessionRequest
  ): Promise<PracticeSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }

    // Validate input
    const validatedData = UpdatePracticeSessionSchema.parse(updateDto);
    
    const updatedSession: PracticeSession = {
      ...session,
      ...validatedData,
      updatedAt: new Date()
    };

    // If marked as completed and no endTime provided, set it
    if (validatedData.completed && !validatedData.endTime) {
      updatedSession.endTime = new Date();
    }

    // Validate complete session
    PracticeSessionSchema.parse(updatedSession);
    
    this.sessions.set(sessionId, updatedSession);

    // If session is completed, create practice history entry
    if (updatedSession.completed && updatedSession.endTime) {
      await this.createPracticeHistoryEntry(updatedSession);
    }

    return updatedSession;
  }

  // Get user's active sessions
  async getUserActiveSessions(userId: string): Promise<PracticeSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && !session.completed)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // Get user's practice history
  async getUserPracticeHistory(
    userId: string,
    subjectId?: string,
    limit = 50
  ): Promise<PracticeHistory[]> {
    const userHistory = this.practiceHistory.get(userId) || [];
    
    let filteredHistory = userHistory;
    if (subjectId) {
      filteredHistory = userHistory.filter(h => h.subjectId === subjectId);
    }
    
    return filteredHistory
      .sort((a, b) => b.practiceDate.getTime() - a.practiceDate.getTime())
      .slice(0, limit);
  }

  // Get knowledge point performance for user
  async getKnowledgePointPerformance(
    userId: string,
    subjectId?: string
  ): Promise<KnowledgePointPerformance[]> {
    const userHistory = this.practiceHistory.get(userId) || [];
    
    let relevantHistory = userHistory;
    if (subjectId) {
      relevantHistory = userHistory.filter(h => h.subjectId === subjectId);
    }

    // Group by knowledge point and calculate performance
    const performanceMap = new Map<string, {
      correctCount: number;
      totalCount: number;
      lastPracticed: Date;
      knowledgePoint?: any;
    }>();

    for (const history of relevantHistory) {
      for (const kpId of history.knowledgePointIds) {
        const existing = performanceMap.get(kpId) || {
          correctCount: 0,
          totalCount: 0,
          lastPracticed: history.practiceDate
        };
        
        // Update stats based on session performance
        const sessionAccuracy = history.completionRate / 100;
        const sessionCorrect = Math.round(history.totalQuestions * sessionAccuracy);
        
        existing.correctCount += sessionCorrect;
        existing.totalCount += history.totalQuestions;
        existing.lastPracticed = new Date(Math.max(
          existing.lastPracticed.getTime(),
          history.practiceDate.getTime()
        ));
        
        performanceMap.set(kpId, existing);
      }
    }

    // Convert to performance objects
    const performances: KnowledgePointPerformance[] = [];
    
    for (const [kpId, stats] of performanceMap.entries()) {
      const knowledgePoint = await this.knowledgePointService.findById(kpId);
      if (knowledgePoint) {
        const accuracy = Math.round((stats.correctCount / stats.totalCount) * 100);
        const status = this.getPerformanceStatus(accuracy);
        
        performances.push({
          knowledgePointId: kpId,
          volume: knowledgePoint.volume,
          unit: knowledgePoint.unit,
          lesson: knowledgePoint.lesson,
          section: knowledgePoint.section,
          topic: knowledgePoint.topic,
          correctCount: stats.correctCount,
          totalCount: stats.totalCount,
          accuracy,
          status,
          lastPracticed: stats.lastPracticed
        });
      }
    }

    return performances.sort((a, b) => b.lastPracticed.getTime() - a.lastPracticed.getTime());
  }

  // Delete practice session
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }
    
    return this.sessions.delete(sessionId);
  }

  // Private helper methods
  private async generateQuestions(
    knowledgePointIds: string[],
    config: QuizConfig
  ): Promise<string[]> {
    // Mock question generation - in real implementation, this would query QuizService
    // For now, generate mock question IDs based on knowledge points
    const baseQuestionCount = typeof config.questionCount === 'number' 
      ? config.questionCount 
      : 20; // default for unlimited
    
    const questionIds: string[] = [];
    
    for (let i = 0; i < baseQuestionCount; i++) {
      const kpIndex = i % knowledgePointIds.length;
      const questionId = `Q_${knowledgePointIds[kpIndex]}_${i + 1}`;
      questionIds.push(questionId);
    }
    
    if (config.shuffleQuestions) {
      // Shuffle questions
      for (let i = questionIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionIds[i], questionIds[j]] = [questionIds[j], questionIds[i]];
      }
    }
    
    return questionIds;
  }

  private async createPracticeHistoryEntry(session: PracticeSession): Promise<void> {
    if (!session.endTime) return;

    const subject = await this.subjectService.findById(session.subjectId);
    if (!subject) return;

    // Calculate statistics
    const totalQuestions = session.questionIds.length;
    const answeredQuestions = session.answers.filter(a => a !== null).length;
    const correctAnswers = session.answers.filter(a => a !== null).length; // Mock calculation
    const wrongAnswers = answeredQuestions - correctAnswers;
    const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);
    
    const totalDuration = Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
    ); // in minutes
    
    const averageTimePerQuestion = session.questionDurations?.length 
      ? session.questionDurations.reduce((sum, d) => sum + d, 0) / session.questionDurations.length
      : undefined;

    const historyEntry: PracticeHistory = {
      id: `history_${session.id}`,
      userId: session.userId,
      subjectId: session.subjectId,
      subjectName: subject.name,
      knowledgePointIds: session.knowledgePointIds,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      completionRate,
      averageTimePerQuestion,
      totalDuration,
      practiceDate: session.endTime,
      config: session.config,
      createdAt: new Date()
    };

    // Add to user's history
    const userHistory = this.practiceHistory.get(session.userId) || [];
    userHistory.push(historyEntry);
    this.practiceHistory.set(session.userId, userHistory);
  }

  private getPerformanceStatus(accuracy: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 75) return 'good';
    if (accuracy >= 60) return 'needs-improvement';
    return 'poor';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get session statistics
  async getSessionStatistics(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageAccuracy: number;
    totalPracticeTime: number;
    favoriteSubject?: string;
  }> {
    const userHistory = this.practiceHistory.get(userId) || [];
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId);

    const totalSessions = userSessions.length;
    const completedSessions = userSessions.filter(s => s.completed).length;
    
    const totalAccuracy = userHistory.reduce((sum, h) => sum + h.completionRate, 0);
    const averageAccuracy = userHistory.length > 0 ? Math.round(totalAccuracy / userHistory.length) : 0;
    
    const totalPracticeTime = userHistory.reduce((sum, h) => sum + h.totalDuration, 0);
    
    // Find favorite subject (most practiced)
    const subjectCounts = new Map<string, number>();
    userHistory.forEach(h => {
      subjectCounts.set(h.subjectId, (subjectCounts.get(h.subjectId) || 0) + 1);
    });
    
    let favoriteSubject: string | undefined;
    let maxCount = 0;
    for (const [subjectId, count] of subjectCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        favoriteSubject = subjectId;
      }
    }

    return {
      totalSessions,
      completedSessions,
      averageAccuracy,
      totalPracticeTime,
      favoriteSubject
    };
  }
}