import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import {
  PracticeStrategyCode,
  GeneratePracticeRequest,
  PracticeSession,
  StudentWeakness,
  StudentMistake,
  StrategyRecommendation,
  StrategyAnalytics,
  StrategyDefinition,
} from '@kedge/models';
import { v4 as uuidv4 } from 'uuid';

interface QuizQuestion {
  id: string;
  knowledgePointId: string;
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

@Injectable()
export class StrategyService {
  private readonly logger = new Logger(StrategyService.name);
  private readonly weaknessThreshold = 60;
  private readonly mistakeGraduation = 3;
  private readonly spacedIntervals = [1, 3, 7, 14, 30];

  constructor(private readonly db: PersistentService) {}

  async getAvailableStrategies(userId?: string): Promise<StrategyDefinition[]> {
    const strategies = await this.db.pgPool.any(sql.unsafe`
      SELECT 
        id,
        code,
        name,
        description,
        icon,
        is_active AS "isActive",
        required_history AS "requiredHistory",
        minimum_practice_count AS "minimumPracticeCount",
        minimum_mistake_count AS "minimumMistakeCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM kedge_practice.practice_strategies
      WHERE is_active = true
      ORDER BY code
    `);

    if (userId) {
      const eligibleStrategies = [];
      for (const strategy of strategies) {
        if (await this.isStrategyEligible(userId, strategy)) {
          eligibleStrategies.push(strategy);
        }
      }
      return eligibleStrategies;
    }

    return strategies as StrategyDefinition[];
  }

  async generateStrategySession(
    userId: string,
    request: GeneratePracticeRequest
  ): Promise<{ questions: QuizQuestion[]; metadata: any }> {
    this.logger.log(`Generating strategy session for student ${userId} with strategy ${request.strategyCode}`);

    let questions: QuizQuestion[];
    let metadata: any;

    switch (request.strategyCode) {
      case PracticeStrategyCode.QUICK_PRACTICE:
        ({ questions, metadata } = await this.generateQuickPractice(request));
        break;
      case PracticeStrategyCode.WEAKNESS_REINFORCEMENT:
        ({ questions, metadata } = await this.generateWeaknessReinforcement(userId, request));
        break;
      case PracticeStrategyCode.MISTAKE_REINFORCEMENT:
        ({ questions, metadata } = await this.generateMistakeReinforcement(userId, request));
        break;
      default:
        throw new Error(`Unknown strategy code: ${request.strategyCode}`);
    }

    return { questions, metadata };
  }

  private async generateQuickPractice(
    request: GeneratePracticeRequest
  ): Promise<{ questions: QuizQuestion[]; metadata: any }> {
    const questions = await this.getRandomQuestions(
      request.knowledgePointIds,
      request.questionCount
    );

    const metadata = {
      totalQuestions: questions.length,
      estimatedTime: request.timeLimit || this.calculateEstimatedTime(questions.length),
      knowledgePointDistribution: this.calculateKnowledgePointDistribution(questions),
    };

    return { questions, metadata };
  }

  private async generateWeaknessReinforcement(
    userId: string,
    request: GeneratePracticeRequest
  ): Promise<{ questions: QuizQuestion[]; metadata: any }> {
    const weaknesses = await this.getStudentWeaknesses(userId, request.knowledgePointIds);
    
    if (weaknesses.length === 0) {
      this.logger.log('No weaknesses found, falling back to quick practice');
      return this.generateQuickPractice(request);
    }

    const weakKnowledgePointIds = weaknesses.map(w => w.knowledgePointId);
    const weakQuestionCount = Math.floor(request.questionCount * 0.7);
    const mixedQuestionCount = request.questionCount - weakQuestionCount;

    const weakQuestions = await this.getRandomQuestions(
      weakKnowledgePointIds,
      weakQuestionCount
    );

    const mixedQuestions = await this.getRandomQuestions(
      request.knowledgePointIds,
      mixedQuestionCount
    );

    const questions = [...weakQuestions, ...mixedQuestions];
    this.shuffleArray(questions);

    const metadata = {
      totalQuestions: questions.length,
      estimatedTime: request.timeLimit || this.calculateEstimatedTime(questions.length),
      knowledgePointDistribution: this.calculateKnowledgePointDistribution(questions),
      strategySpecificData: {
        weaknessCount: weaknesses.length,
        weakQuestionCount,
        mixedQuestionCount,
      },
    };

    return { questions, metadata };
  }

  private async generateMistakeReinforcement(
    userId: string,
    request: GeneratePracticeRequest
  ): Promise<{ questions: QuizQuestion[]; metadata: any }> {
    const mistakes = await this.getStudentMistakes(userId, request.knowledgePointIds);
    
    if (mistakes.length === 0) {
      this.logger.log('No mistakes found, falling back to quick practice');
      return this.generateQuickPractice(request);
    }

    const mistakeQuizIds = mistakes.map(m => m.quizId);
    const exactRepeatCount = Math.floor(request.questionCount * 0.2);
    const similarCount = Math.min(request.questionCount - exactRepeatCount, mistakes.length);

    const exactQuestions = await this.getQuestionsByIds(
      mistakeQuizIds.slice(0, exactRepeatCount)
    );

    const similarQuestions = await this.getSimilarQuestions(
      mistakes.slice(0, similarCount),
      similarCount
    );

    const questions = [...exactQuestions, ...similarQuestions];
    this.shuffleArray(questions);

    const metadata = {
      totalQuestions: questions.length,
      estimatedTime: request.timeLimit || this.calculateEstimatedTime(questions.length),
      knowledgePointDistribution: this.calculateKnowledgePointDistribution(questions),
      strategySpecificData: {
        mistakeCount: mistakes.length,
        exactRepeatCount: exactQuestions.length,
        similarCount: similarQuestions.length,
      },
    };

    return { questions, metadata };
  }

  async getStrategyRecommendations(userId: string): Promise<{
    primaryRecommendation?: StrategyRecommendation;
    alternativeRecommendations: StrategyRecommendation[];
  }> {
    const recommendations: StrategyRecommendation[] = [];

    const weaknesses = await this.getStudentWeaknesses(userId);
    if (weaknesses.length > 0) {
      recommendations.push({
        strategyCode: PracticeStrategyCode.WEAKNESS_REINFORCEMENT,
        reason: `You have ${weaknesses.length} weak knowledge points that need attention`,
        priority: 1,
        metadata: {
          weakPoints: weaknesses.map(w => ({
            knowledgePointId: w.knowledgePointId,
            accuracy: w.accuracyRate,
            practiceCount: w.practiceCount,
          })),
        },
      });
    }

    const mistakes = await this.getStudentMistakes(userId);
    if (mistakes.length >= 5) {
      recommendations.push({
        strategyCode: PracticeStrategyCode.MISTAKE_REINFORCEMENT,
        reason: `You have ${mistakes.length} uncorrected mistakes`,
        priority: weaknesses.length > 0 ? 2 : 1,
        metadata: {
          mistakeCount: mistakes.length,
        },
      });
    }

    recommendations.push({
      strategyCode: PracticeStrategyCode.QUICK_PRACTICE,
      reason: 'Random practice with mixed questions',
      priority: 3,
      metadata: {},
    });

    recommendations.sort((a, b) => a.priority - b.priority);

    return {
      primaryRecommendation: recommendations[0],
      alternativeRecommendations: recommendations.slice(1),
    };
  }

  async getStrategyAnalytics(
    userId: string,
    strategyCode: string
  ): Promise<StrategyAnalytics> {
    const sessions = await this.db.pgPool.any(sql.unsafe`
      SELECT 
        id,
        start_time,
        end_time,
        total_questions,
        correct_answers,
        time_spent,
        metadata
      FROM kedge_practice.practice_sessions
      WHERE user_id = ${userId}
        AND strategy_code = ${strategyCode}
      ORDER BY start_time DESC
    `);

    const totalSessions = sessions.length;
    const lastUsed = sessions[0]?.start_time || undefined;
    const averageScore = totalSessions > 0
      ? sessions.reduce((sum: number, s: any) => sum + (s.correct_answers / s.total_questions) * 100, 0) / totalSessions
      : 0;

    const oldSessions = sessions.slice(Math.floor(totalSessions / 2));
    const newSessions = sessions.slice(0, Math.floor(totalSessions / 2));
    const oldAverage = oldSessions.length > 0
      ? oldSessions.reduce((sum: number, s: any) => sum + (s.correct_answers / s.total_questions) * 100, 0) / oldSessions.length
      : 0;
    const newAverage = newSessions.length > 0
      ? newSessions.reduce((sum: number, s: any) => sum + (s.correct_answers / s.total_questions) * 100, 0) / newSessions.length
      : 0;
    const improvement = newAverage - oldAverage;

    let effectiveness: StrategyAnalytics['effectiveness'] = {};

    if (strategyCode === PracticeStrategyCode.WEAKNESS_REINFORCEMENT) {
      const weaknesses = await this.getStudentWeaknesses(userId);
      effectiveness = {
        weakPointsImproved: weaknesses.filter(w => !w.isWeak).length,
        weakPointsRemaining: weaknesses.filter(w => w.isWeak).length,
        averageImprovementRate: improvement,
      };
    } else if (strategyCode === PracticeStrategyCode.MISTAKE_REINFORCEMENT) {
      const mistakes = await this.getStudentMistakes(userId);
      effectiveness = {
        mistakesCorrected: mistakes.filter(m => m.isCorrected).length,
        mistakesRemaining: mistakes.filter(m => !m.isCorrected).length,
      };
    }

    return {
      strategyCode,
      usage: {
        totalSessions,
        lastUsed,
        averageScore,
        improvement,
      },
      effectiveness,
    };
  }

  async recordMistake(
    userId: string,
    quizId: string,
    sessionId: string,
    incorrectAnswer: string,
    correctAnswer: string
  ): Promise<void> {
    await this.db.pgPool.query(sql.unsafe`
      INSERT INTO kedge_practice.student_mistakes (
        id,
        user_id,
        quiz_id,
        session_id,
        incorrect_answer,
        correct_answer,
        mistake_count,
        last_attempted,
        is_corrected,
        correction_count,
        next_review_date,
        created_at,
        updated_at
      ) VALUES (
        ${uuidv4()},
        ${userId},
        ${quizId},
        ${sessionId},
        ${incorrectAnswer},
        ${correctAnswer},
        1,
        CURRENT_TIMESTAMP,
        false,
        0,
        ${this.calculateNextReviewDate(0)},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id, quiz_id) DO UPDATE
      SET 
        mistake_count = kedge_practice.student_mistakes.mistake_count + 1,
        last_attempted = CURRENT_TIMESTAMP,
        is_corrected = false,
        correction_count = 0,
        next_review_date = ${this.calculateNextReviewDate(0)},
        updated_at = CURRENT_TIMESTAMP
    `);
  }

  async recordCorrection(
    userId: string,
    quizId: string
  ): Promise<void> {
    const mistake = await this.db.pgPool.maybeOne(sql.unsafe`
      SELECT correction_count
      FROM kedge_practice.student_mistakes
      WHERE user_id = ${userId}
        AND quiz_id = ${quizId}
    `);

    if (!mistake) return;

    const newCorrectionCount = (mistake.correction_count || 0) + 1;
    const isCorrected = newCorrectionCount >= this.mistakeGraduation;

    await this.db.pgPool.query(sql.unsafe`
      UPDATE kedge_practice.student_mistakes
      SET 
        correction_count = ${newCorrectionCount},
        is_corrected = ${isCorrected},
        next_review_date = ${isCorrected ? null : this.calculateNextReviewDate(newCorrectionCount)},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
        AND quiz_id = ${quizId}
    `);
  }

  private async isStrategyEligible(
    userId: string,
    strategy: any
  ): Promise<boolean> {
    if (!strategy.requiredHistory) return true;

    const practiceCount = await this.getStudentPracticeCount(userId);
    if (practiceCount < strategy.minimumPracticeCount) return false;

    if (strategy.code === PracticeStrategyCode.MISTAKE_REINFORCEMENT) {
      const mistakeCount = await this.getStudentMistakeCount(userId);
      return mistakeCount >= strategy.minimumMistakeCount;
    }

    return true;
  }

  private async getStudentPracticeCount(userId: string): Promise<number> {
    const result = await this.db.pgPool.maybeOne(sql.unsafe`
      SELECT COUNT(*) as count
      FROM kedge_practice.practice_sessions
      WHERE user_id = ${userId}
    `);
    return Number(result?.count || 0);
  }

  private async getStudentMistakeCount(userId: string): Promise<number> {
    const result = await this.db.pgPool.maybeOne(sql.unsafe`
      SELECT COUNT(*) as count
      FROM kedge_practice.student_mistakes
      WHERE user_id = ${userId}
        AND is_corrected = false
    `);
    return Number(result?.count || 0);
  }

  private async getStudentWeaknesses(
    userId: string,
    knowledgePointIds?: string[]
  ): Promise<StudentWeakness[]> {
    let query = sql.unsafe`
      SELECT 
        id,
        user_id AS "userId",
        knowledge_point_id AS "knowledgePointId",
        accuracy_rate AS "accuracyRate",
        practice_count AS "practiceCount",
        last_practiced AS "lastPracticed",
        improvement_trend AS "improvementTrend",
        is_weak AS "isWeak",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM kedge_practice.student_weaknesses
      WHERE user_id = ${userId}
        AND accuracy_rate < ${this.weaknessThreshold}
    `;

    if (knowledgePointIds && knowledgePointIds.length > 0) {
      query = sql.unsafe`${query} AND knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})`;
    }

    query = sql.unsafe`${query} ORDER BY accuracy_rate ASC`;

    return this.db.pgPool.any(query) as Promise<StudentWeakness[]>;
  }

  private async getStudentMistakes(
    userId: string,
    knowledgePointIds?: string[]
  ): Promise<StudentMistake[]> {
    let query: any;

    if (knowledgePointIds && knowledgePointIds.length > 0) {
      query = sql.unsafe`
        SELECT 
          sm.id,
          sm.user_id AS "userId",
          sm.quiz_id AS "quizId",
          sm.session_id AS "sessionId",
          sm.incorrect_answer AS "incorrectAnswer",
          sm.correct_answer AS "correctAnswer",
          sm.mistake_count AS "mistakeCount",
          sm.last_attempted AS "lastAttempted",
          sm.is_corrected AS "isCorrected",
          sm.correction_count AS "correctionCount",
          sm.next_review_date AS "nextReviewDate",
          sm.created_at AS "createdAt",
          sm.updated_at AS "updatedAt"
        FROM kedge_practice.student_mistakes sm
        JOIN quizzes q ON sm.quiz_id = q.id
        WHERE sm.user_id = ${userId}
          AND sm.is_corrected = false
          AND q.knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
      `;
    } else {
      query = sql.unsafe`
        SELECT 
          id,
          user_id AS "userId",
          quiz_id AS "quizId",
          session_id AS "sessionId",
          incorrect_answer AS "incorrectAnswer",
          correct_answer AS "correctAnswer",
          mistake_count AS "mistakeCount",
          last_attempted AS "lastAttempted",
          is_corrected AS "isCorrected",
          correction_count AS "correctionCount",
          next_review_date AS "nextReviewDate",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM kedge_practice.student_mistakes
        WHERE user_id = ${userId}
          AND is_corrected = false
      `;
    }

    query = sql.unsafe`${query} ORDER BY next_review_date ASC, mistake_count DESC`;

    return this.db.pgPool.any(query) as Promise<StudentMistake[]>;
  }

  private async getRandomQuestions(
    knowledgePointIds: string[],
    count: number
  ): Promise<QuizQuestion[]> {
    const query = sql.unsafe`
      SELECT 
        id,
        knowledge_point_id,
        content,
        options,
        correct_answer,
        explanation
      FROM kedge_practice.quizzes
      WHERE knowledge_point_id = ANY(${sql.array(knowledgePointIds, 'uuid')})
      ORDER BY RANDOM() 
      LIMIT ${count}
    `;

    const questions = await this.db.pgPool.any(query);
    return questions.map((q: any) => ({
      id: q.id,
      knowledgePointId: q.knowledge_point_id,
      content: q.content,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    }));
  }

  private async getQuestionsByIds(quizIds: string[]): Promise<QuizQuestion[]> {
    if (quizIds.length === 0) return [];

    const questions = await this.db.pgPool.any(sql.unsafe`
      SELECT 
        id,
        knowledge_point_id,
        content,
        options,
        correct_answer,
        explanation
      FROM kedge_practice.quizzes
      WHERE id = ANY(${sql.array(quizIds, 'uuid')})
    `);

    return questions.map((q: any) => ({
      id: q.id,
      knowledgePointId: q.knowledge_point_id,
      content: q.content,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    }));
  }

  private async getSimilarQuestions(
    mistakes: StudentMistake[],
    count: number
  ): Promise<QuizQuestion[]> {
    const knowledgePointIds = new Set<string>();
    
    for (const mistake of mistakes) {
      const quiz = await this.db.pgPool.maybeOne(sql.unsafe`
        SELECT knowledge_point_id
        FROM kedge_practice.quizzes
        WHERE id = ${mistake.quizId}
      `);
      if (quiz) {
        knowledgePointIds.add(quiz.knowledge_point_id);
      }
    }

    if (knowledgePointIds.size === 0) return [];

    return this.getRandomQuestions(
      Array.from(knowledgePointIds),
      count
    );
  }

  private calculateEstimatedTime(questionCount: number): number {
    return questionCount * 90;
  }


  private calculateKnowledgePointDistribution(
    questions: QuizQuestion[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    questions.forEach(q => {
      distribution[q.knowledgePointId] = (distribution[q.knowledgePointId] || 0) + 1;
    });

    return distribution;
  }

  private calculateNextReviewDate(correctionCount: number): string {
    const intervalIndex = Math.min(correctionCount, this.spacedIntervals.length - 1);
    const daysToAdd = this.spacedIntervals[intervalIndex];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate.toISOString();
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}