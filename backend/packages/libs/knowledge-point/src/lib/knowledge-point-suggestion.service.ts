import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

export interface SuggestionCriteria {
  userId: string;
  subjectId?: string;
  maxPoints?: number;
  strategy?: 'balanced' | 'weak_areas' | 'new_topics' | 'review' | 'adaptive';
}

export interface KnowledgePointSuggestion {
  knowledgePointId: string;
  topic: string;
  reason: string;
  priority: number;
  metadata?: {
    accuracy?: number;
    lastPracticed?: Date;
    practiceCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

@Injectable()
export class KnowledgePointSuggestionService {
  private readonly logger = new Logger(KnowledgePointSuggestionService.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * Get smart knowledge point suggestions based on user's learning history
   */
  async getSmartSuggestions(criteria: SuggestionCriteria): Promise<KnowledgePointSuggestion[]> {
    const { userId, subjectId, maxPoints = 10, strategy = 'adaptive' } = criteria;
    
    this.logger.log(`Generating smart suggestions for user ${userId} with strategy: ${strategy}`);

    try {
      switch (strategy) {
        case 'balanced':
          return this.getBalancedSuggestions(userId, subjectId, maxPoints);
        case 'weak_areas':
          return this.getWeakAreasSuggestions(userId, subjectId, maxPoints);
        case 'new_topics':
          return this.getNewTopicsSuggestions(userId, subjectId, maxPoints);
        case 'review':
          return this.getReviewSuggestions(userId, subjectId, maxPoints);
        case 'adaptive':
        default:
          return this.getAdaptiveSuggestions(userId, subjectId, maxPoints);
      }
    } catch (error) {
      this.logger.error('Failed to generate smart suggestions:', error);
      // Fallback to basic suggestions
      return this.getBasicSuggestions(subjectId, maxPoints);
    }
  }

  /**
   * Adaptive suggestions based on multiple factors
   */
  private async getAdaptiveSuggestions(
    userId: string,
    subjectId?: string,
    maxPoints: number = 10
  ): Promise<KnowledgePointSuggestion[]> {
    const suggestions: KnowledgePointSuggestion[] = [];

    // 1. Get user's practice history and performance
    const performanceData = await this.getUserPerformance(userId, subjectId);
    
    // 2. Identify weak areas (30% of suggestions)
    const weakPoints = await this.identifyWeakPoints(userId, subjectId, Math.ceil(maxPoints * 0.3));
    suggestions.push(...weakPoints);

    // 3. Add topics for review (30% of suggestions) 
    const reviewPoints = await this.getTopicsForReview(userId, subjectId, Math.ceil(maxPoints * 0.3));
    suggestions.push(...reviewPoints);

    // 4. Add new/unpracticed topics (30% of suggestions)
    const newPoints = await this.getUnpracticedTopics(userId, subjectId, Math.ceil(maxPoints * 0.3));
    suggestions.push(...newPoints);

    // 5. Add some foundational topics for confidence building (10% of suggestions)
    const easyPoints = await this.getFoundationalTopics(subjectId, Math.ceil(maxPoints * 0.1));
    suggestions.push(...easyPoints);

    // Sort by priority and return top N
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxPoints);
  }

  /**
   * Get balanced suggestions across different units and lessons
   */
  private async getBalancedSuggestions(
    userId: string,
    subjectId?: string,
    maxPoints: number = 10
  ): Promise<KnowledgePointSuggestion[]> {
    const query = sql.unsafe`
      WITH volume_distribution AS (
        SELECT DISTINCT 
          kp.id,
          kp.topic,
          kp.volume,
          kp.unit,
          kp.lesson,
          ROW_NUMBER() OVER (PARTITION BY kp.volume, kp.unit ORDER BY RANDOM()) as rn
        FROM kedge_practice.knowledge_points kp
        WHERE 1=1
      )
      SELECT 
        id as knowledge_point_id,
        topic,
        volume,
        unit,
        lesson
      FROM volume_distribution
      WHERE rn <= 2  -- Take 2 from each unit
      LIMIT ${maxPoints}
    `;

    const result = await this.persistentService.pgPool.query(query);
    
    return result.rows.map((row, index) => ({
      knowledgePointId: row.knowledge_point_id,
      topic: row.topic,
      reason: `均衡选择：${row.volume} - ${row.unit}`,
      priority: maxPoints - index,
      metadata: {
        difficulty: 'medium' as const
      }
    }));
  }

  /**
   * Get suggestions focusing on weak areas
   */
  private async getWeakAreasSuggestions(
    userId: string,
    subjectId?: string,
    maxPoints: number = 10
  ): Promise<KnowledgePointSuggestion[]> {
    return this.identifyWeakPoints(userId, subjectId, maxPoints);
  }

  /**
   * Get new topics the user hasn't practiced
   */
  private async getNewTopicsSuggestions(
    userId: string,
    subjectId?: string,
    maxPoints: number = 10
  ): Promise<KnowledgePointSuggestion[]> {
    return this.getUnpracticedTopics(userId, subjectId, maxPoints);
  }

  /**
   * Get topics for review based on spaced repetition
   */
  private async getReviewSuggestions(
    userId: string,
    subjectId?: string,
    maxPoints: number = 10
  ): Promise<KnowledgePointSuggestion[]> {
    return this.getTopicsForReview(userId, subjectId, maxPoints);
  }

  /**
   * Identify weak points based on user's error rate
   */
  private async identifyWeakPoints(
    userId: string,
    subjectId?: string,
    limit: number = 5
  ): Promise<KnowledgePointSuggestion[]> {
    const query = sql.unsafe`
      WITH user_performance AS (
        SELECT 
          q.knowledge_point_id,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as correct_count,
          ROUND(100.0 * SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_rate,
          MAX(pa.created_at) as last_practiced
        FROM kedge_practice.practice_answers pa
        JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
        JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
        WHERE ps.user_id = ${userId}
        GROUP BY q.knowledge_point_id
        HAVING COUNT(*) >= 3  -- At least 3 attempts
          AND (100.0 * SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) / COUNT(*)) < 60  -- Less than 60% accuracy
      )
      SELECT 
        kp.id as knowledge_point_id,
        kp.topic,
        up.accuracy_rate,
        up.total_attempts,
        up.last_practiced
      FROM user_performance up
      JOIN kedge_practice.knowledge_points kp ON kp.id = up.knowledge_point_id
      WHERE 1=1
      ORDER BY up.accuracy_rate ASC, up.last_practiced ASC
      LIMIT ${limit}
    `;

    const result = await this.persistentService.pgPool.query(query);
    
    return result.rows.map((row, index) => ({
      knowledgePointId: row.knowledge_point_id,
      topic: row.topic,
      reason: `需要加强 (正确率: ${row.accuracy_rate}%)`,
      priority: 100 - index * 5,
      metadata: {
        accuracy: parseFloat(row.accuracy_rate),
        lastPracticed: row.last_practiced,
        practiceCount: parseInt(row.total_attempts),
        difficulty: 'hard' as const
      }
    }));
  }

  /**
   * Get topics the user hasn't practiced yet
   */
  private async getUnpracticedTopics(
    userId: string,
    subjectId?: string,
    limit: number = 5
  ): Promise<KnowledgePointSuggestion[]> {
    const query = sql.unsafe`
      WITH practiced_points AS (
        SELECT DISTINCT q.knowledge_point_id
        FROM kedge_practice.practice_answers pa
        JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
        JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
        WHERE ps.user_id = ${userId}
      )
      SELECT 
        kp.id as knowledge_point_id,
        kp.topic,
        kp.volume,
        kp.unit,
        kp.lesson
      FROM kedge_practice.knowledge_points kp
      WHERE kp.id NOT IN (SELECT knowledge_point_id FROM practiced_points)
      ORDER BY kp.volume, kp.unit, kp.lesson
      LIMIT ${limit}
    `;

    const result = await this.persistentService.pgPool.query(query);
    
    return result.rows.map((row, index) => ({
      knowledgePointId: row.knowledge_point_id,
      topic: row.topic,
      reason: '新知识点 (未练习)',
      priority: 80 - index * 3,
      metadata: {
        difficulty: 'medium' as const,
        practiceCount: 0
      }
    }));
  }

  /**
   * Get topics for review based on time since last practice
   */
  private async getTopicsForReview(
    userId: string,
    subjectId?: string,
    limit: number = 5
  ): Promise<KnowledgePointSuggestion[]> {
    const query = sql.unsafe`
      WITH user_practice AS (
        SELECT 
          q.knowledge_point_id,
          MAX(pa.created_at) as last_practiced,
          COUNT(*) as practice_count,
          AVG(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) * 100 as accuracy_rate
        FROM kedge_practice.practice_answers pa
        JOIN kedge_practice.practice_sessions ps ON pa.session_id = ps.id
        JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
        WHERE ps.user_id = ${userId}
        GROUP BY q.knowledge_point_id
        HAVING MAX(pa.created_at) < NOW() - INTERVAL '3 days'  -- Not practiced in last 3 days
          AND AVG(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) BETWEEN 0.6 AND 0.85  -- Medium performance
      )
      SELECT 
        kp.id as knowledge_point_id,
        kp.topic,
        up.last_practiced,
        up.practice_count,
        up.accuracy_rate,
        EXTRACT(DAY FROM NOW() - up.last_practiced) as days_since_practice
      FROM user_practice up
      JOIN kedge_practice.knowledge_points kp ON kp.id = up.knowledge_point_id
      WHERE 1=1
      ORDER BY up.last_practiced ASC
      LIMIT ${limit}
    `;

    const result = await this.persistentService.pgPool.query(query);
    
    return result.rows.map((row, index) => ({
      knowledgePointId: row.knowledge_point_id,
      topic: row.topic,
      reason: `需要复习 (${row.days_since_practice}天未练习)`,
      priority: 70 - index * 2,
      metadata: {
        accuracy: parseFloat(row.accuracy_rate),
        lastPracticed: row.last_practiced,
        practiceCount: parseInt(row.practice_count),
        difficulty: 'medium' as const
      }
    }));
  }

  /**
   * Get foundational topics for confidence building
   */
  private async getFoundationalTopics(
    subjectId?: string,
    limit: number = 2
  ): Promise<KnowledgePointSuggestion[]> {
    const query = sql.unsafe`
      SELECT 
        id as knowledge_point_id,
        topic,
        volume,
        unit,
        lesson
      FROM kedge_practice.knowledge_points
      WHERE 1=1
        AND unit LIKE '%第一%' OR unit LIKE '%基础%'  -- First units or basic topics
      ORDER BY volume, unit, lesson
      LIMIT ${limit}
    `;

    const result = await this.persistentService.pgPool.query(query);
    
    return result.rows.map((row, index) => ({
      knowledgePointId: row.knowledge_point_id,
      topic: row.topic,
      reason: '基础巩固',
      priority: 50 - index,
      metadata: {
        difficulty: 'easy' as const
      }
    }));
  }

  /**
   * Get user's overall performance metrics
   */
  private async getUserPerformance(userId: string, subjectId?: string): Promise<any> {
    const query = sql.unsafe`
      SELECT 
        COUNT(DISTINCT ps.id) as total_sessions,
        COUNT(DISTINCT pa.quiz_id) as total_questions,
        AVG(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) * 100 as overall_accuracy,
        COUNT(DISTINCT q.knowledge_point_id) as knowledge_points_practiced
      FROM kedge_practice.practice_sessions ps
      LEFT JOIN kedge_practice.practice_answers pa ON pa.session_id = ps.id
      LEFT JOIN kedge_practice.quizzes q ON pa.quiz_id = q.id
      WHERE ps.user_id = ${userId}
    `;

    const result = await this.persistentService.pgPool.query(query);
    return result.rows[0] || {};
  }

  /**
   * Basic fallback suggestions when no user data is available
   */
  private async getBasicSuggestions(
    subjectId?: string,
    maxPoints: number = 10
  ): Promise<KnowledgePointSuggestion[]> {
    const query = sql.unsafe`
      WITH ranked_points AS (
        SELECT 
          id,
          topic,
          volume,
          unit,
          lesson,
          ROW_NUMBER() OVER (PARTITION BY volume ORDER BY unit, lesson) as rn
        FROM kedge_practice.knowledge_points
        WHERE 1=1
        )
      SELECT 
        id as knowledge_point_id,
        topic,
        volume,
        unit
      FROM ranked_points
      WHERE rn <= 3  -- Take first 3 from each volume
      LIMIT ${maxPoints}
    `;

    const result = await this.persistentService.pgPool.query(query);
    
    return result.rows.map((row, index) => ({
      knowledgePointId: row.knowledge_point_id,
      topic: row.topic,
      reason: '推荐学习',
      priority: 40 - index,
      metadata: {
        difficulty: 'medium' as const
      }
    }));
  }
}