import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

export interface PracticeStats {
  userId: string;
  userName: string;
  userClass: string | null;
  totalQuizzes: number;
  correctCount: number;
  incorrectCount: number;
  correctRate: number;
}

export interface LeaderboardFilters {
  class?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * Get users with most/least quizzes practiced
   */
  async getUsersByPracticeCount(filters: LeaderboardFilters & { order?: 'most' | 'least' }) {
    try {
      const { class: classFilter, limit = 20, offset = 0, order = 'most' } = filters;
      
      // Build WHERE clause for class filter
      const whereClause = classFilter 
        ? sql.fragment`WHERE u.class = ${classFilter}`
        : sql.fragment``;
      
      const orderDirection = order === 'most' ? sql.fragment`DESC` : sql.fragment`ASC`;
      
      const query = sql.unsafe`
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.account_id as account,
          u.class as user_class,
          COALESCE(COUNT(DISTINCT pa.id), 0) as total_quizzes,
          COALESCE(SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END), 0) as correct_count,
          COALESCE(SUM(CASE WHEN NOT pa.is_correct THEN 1 ELSE 0 END), 0) as incorrect_count,
          CASE 
            WHEN COUNT(pa.id) > 0 THEN 
              ROUND((SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(pa.id)::NUMERIC) * 100, 2)
            ELSE 0
          END as correct_rate
        FROM kedge_practice.users u
        LEFT JOIN kedge_practice.practice_answers pa ON u.id = pa.user_id
        ${whereClause}
        ${classFilter ? sql.fragment`` : sql.fragment`WHERE u.role = 'student'`}
        GROUP BY u.id, u.name, u.account_id, u.class
        ORDER BY total_quizzes ${orderDirection}, u.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const result = await this.persistentService.pgPool.query(query);
      
      return result.rows.map((row: any) => ({
        userId: row.user_id,
        userName: row.user_name,
        account: row.account,
        userClass: row.user_class,
        totalQuizzes: parseInt(row.total_quizzes),
        correctCount: parseInt(row.correct_count),
        incorrectCount: parseInt(row.incorrect_count),
        correctRate: parseFloat(row.correct_rate)
      }));
    } catch (error) {
      this.logger.error('Error getting users by practice count:', error);
      throw error;
    }
  }

  /**
   * Get users with highest/lowest correct rate
   */
  async getUsersByCorrectRate(filters: LeaderboardFilters & { order?: 'highest' | 'lowest', minQuizzes?: number }) {
    try {
      const { class: classFilter, limit = 20, offset = 0, order = 'highest', minQuizzes = 5 } = filters;
      
      // Build WHERE clause for class filter
      const whereConditions = [];
      if (classFilter) {
        whereConditions.push(sql.fragment`u.class = ${classFilter}`);
      } else {
        whereConditions.push(sql.fragment`u.role = 'student'`);
      }
      
      const whereClause = whereConditions.length > 0
        ? sql.fragment`WHERE ${sql.join(whereConditions, sql.fragment` AND `)}`
        : sql.fragment``;
      
      const orderDirection = order === 'highest' ? sql.fragment`DESC` : sql.fragment`ASC`;
      
      const query = sql.unsafe`
        WITH user_stats AS (
          SELECT 
            u.id as user_id,
            u.name as user_name,
            u.account_id as account,
            u.class as user_class,
            COUNT(pa.id) as total_quizzes,
            SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END) as correct_count,
            SUM(CASE WHEN NOT pa.is_correct THEN 1 ELSE 0 END) as incorrect_count,
            CASE 
              WHEN COUNT(pa.id) > 0 THEN 
                ROUND((SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(pa.id)::NUMERIC) * 100, 2)
              ELSE 0
            END as correct_rate
          FROM kedge_practice.users u
          LEFT JOIN kedge_practice.practice_answers pa ON u.id = pa.user_id
          ${whereClause}
          GROUP BY u.id, u.name, u.account_id, u.class
          HAVING COUNT(pa.id) >= ${minQuizzes}
        )
        SELECT * FROM user_stats
        ORDER BY correct_rate ${orderDirection}, total_quizzes DESC, user_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const result = await this.persistentService.pgPool.query(query);
      
      return result.rows.map((row: any) => ({
        userId: row.user_id,
        userName: row.user_name,
        account: row.account,
        userClass: row.user_class,
        totalQuizzes: parseInt(row.total_quizzes),
        correctCount: parseInt(row.correct_count),
        incorrectCount: parseInt(row.incorrect_count),
        correctRate: parseFloat(row.correct_rate)
      }));
    } catch (error) {
      this.logger.error('Error getting users by correct rate:', error);
      throw error;
    }
  }

  /**
   * Get class statistics
   */
  async getClassStatistics() {
    try {
      const query = sql.unsafe`
        SELECT 
          u.class,
          COUNT(DISTINCT u.id) as student_count,
          COUNT(pa.id) as total_answers,
          COALESCE(AVG(CASE WHEN pa.is_correct THEN 100.0 ELSE 0 END), 0) as avg_correct_rate,
          COALESCE(SUM(CASE WHEN pa.is_correct THEN 1 ELSE 0 END), 0) as total_correct,
          COALESCE(SUM(CASE WHEN NOT pa.is_correct THEN 1 ELSE 0 END), 0) as total_incorrect
        FROM kedge_practice.users u
        LEFT JOIN kedge_practice.practice_answers pa ON u.id = pa.user_id
        WHERE u.role = 'student' AND u.class IS NOT NULL
        GROUP BY u.class
        ORDER BY u.class
      `;
      
      const result = await this.persistentService.pgPool.query(query);
      
      return result.rows.map((row: any) => ({
        class: row.class,
        studentCount: parseInt(row.student_count),
        totalAnswers: parseInt(row.total_answers),
        avgCorrectRate: parseFloat(row.avg_correct_rate),
        totalCorrect: parseInt(row.total_correct),
        totalIncorrect: parseInt(row.total_incorrect)
      }));
    } catch (error) {
      this.logger.error('Error getting class statistics:', error);
      throw error;
    }
  }

  /**
   * Get overall leaderboard data
   */
  async getLeaderboardSummary(classFilter?: string) {
    try {
      const whereClause = classFilter 
        ? sql.fragment`WHERE u.class = ${classFilter} AND u.role = 'student'`
        : sql.fragment`WHERE u.role = 'student'`;
      
      // Get top performers
      const topPerformers = await this.getUsersByCorrectRate({ 
        class: classFilter, 
        limit: 5, 
        order: 'highest' 
      });
      
      // Get most active users
      const mostActive = await this.getUsersByPracticeCount({ 
        class: classFilter, 
        limit: 5, 
        order: 'most' 
      });
      
      // Get overall statistics
      const statsQuery = sql.unsafe`
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          COUNT(pa.id) as total_quizzes_answered,
          COALESCE(AVG(CASE WHEN pa.is_correct THEN 100.0 ELSE 0 END), 0) as overall_correct_rate,
          COUNT(DISTINCT ps.id) as total_sessions
        FROM kedge_practice.users u
        LEFT JOIN kedge_practice.practice_answers pa ON u.id = pa.user_id
        LEFT JOIN kedge_practice.practice_sessions ps ON u.id = ps.user_id
        ${whereClause}
      `;
      
      const statsResult = await this.persistentService.pgPool.query(statsQuery);
      const stats = statsResult.rows[0];
      
      return {
        topPerformers,
        mostActive,
        statistics: {
          totalStudents: parseInt(stats.total_students),
          totalQuizzesAnswered: parseInt(stats.total_quizzes_answered),
          overallCorrectRate: parseFloat(stats.overall_correct_rate),
          totalSessions: parseInt(stats.total_sessions)
        }
      };
    } catch (error) {
      this.logger.error('Error getting leaderboard summary:', error);
      throw error;
    }
  }
}