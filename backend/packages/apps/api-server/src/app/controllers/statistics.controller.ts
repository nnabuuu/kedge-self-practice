import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly persistentService: PersistentService) {}

  @Get('teacher-dashboard')
  @ApiOperation({ summary: 'Get statistics for teacher dashboard' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getTeacherDashboardStats() {
    try {
      // Get total student count
      const studentCountResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.users
          WHERE role = 'student'
        `
      );
      const studentCount = parseInt(studentCountResult.rows[0]?.count || '0', 10);

      // Get total knowledge points count
      const knowledgePointCountResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.knowledge_points
        `
      );
      const knowledgePointCount = parseInt(knowledgePointCountResult.rows[0]?.count || '0', 10);

      // Get total quizzes count
      const quizCountResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.quizzes
        `
      );
      const quizCount = parseInt(quizCountResult.rows[0]?.count || '0', 10);

      // Get this month's practice sessions count
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const monthlyPracticeResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.practice_sessions
          WHERE created_at >= ${firstDayOfMonth.toISOString()}
            AND status = 'completed'
        `
      );
      const monthlyPracticeCount = parseInt(monthlyPracticeResult.rows[0]?.count || '0', 10);

      // Get active students count (students who practiced in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeStudentResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(DISTINCT user_id) as count
          FROM kedge_practice.practice_sessions
          WHERE created_at >= ${thirtyDaysAgo.toISOString()}
        `
      );
      const activeStudentCount = parseInt(activeStudentResult.rows[0]?.count || '0', 10);

      return {
        success: true,
        data: {
          totalStudents: studentCount,
          activeStudents: activeStudentCount,
          totalKnowledgePoints: knowledgePointCount,
          totalQuizzes: quizCount,
          monthlyPracticeSessions: monthlyPracticeCount,
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          period: {
            month: firstDayOfMonth.toISOString(),
            activeStudentsPeriod: thirtyDaysAgo.toISOString(),
          },
        },
      };
    } catch (error) {
      console.error('Error fetching teacher dashboard statistics:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  @Get('students')
  @ApiOperation({ summary: 'Get student statistics' })
  @ApiResponse({ status: 200, description: 'Student statistics retrieved successfully' })
  async getStudentStats() {
    try {
      // Get total students
      const totalResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.users
          WHERE role = 'student'
        `
      );

      // Get active students (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(DISTINCT user_id) as count
          FROM kedge_practice.practice_sessions
          WHERE created_at >= ${thirtyDaysAgo.toISOString()}
        `
      );

      // Get new students this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      
      const newThisMonthResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.users
          WHERE role = 'student'
            AND created_at >= ${firstDayOfMonth.toISOString()}
        `
      );

      return {
        success: true,
        data: {
          total: parseInt(totalResult.rows[0]?.count || '0', 10),
          active: parseInt(activeResult.rows[0]?.count || '0', 10),
          newThisMonth: parseInt(newThisMonthResult.rows[0]?.count || '0', 10),
        },
      };
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      throw new Error('Failed to fetch student statistics');
    }
  }

  @Get('practice-sessions')
  @ApiOperation({ summary: 'Get practice session statistics' })
  @ApiResponse({ status: 200, description: 'Practice session statistics retrieved successfully' })
  async getPracticeSessionStats() {
    try {
      // Get this month's sessions
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      
      const monthlyResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
            COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_sessions,
            AVG(CASE WHEN status = 'completed' THEN score ELSE NULL END) as average_score
          FROM kedge_practice.practice_sessions
          WHERE created_at >= ${firstDayOfMonth.toISOString()}
        `
      );

      // Get today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayResult = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT COUNT(*) as count
          FROM kedge_practice.practice_sessions
          WHERE created_at >= ${today.toISOString()}
        `
      );

      const monthlyData = monthlyResult.rows[0];
      
      return {
        success: true,
        data: {
          thisMonth: {
            total: parseInt(monthlyData?.total_sessions || '0', 10),
            completed: parseInt(monthlyData?.completed_sessions || '0', 10),
            abandoned: parseInt(monthlyData?.abandoned_sessions || '0', 10),
            averageScore: parseFloat(monthlyData?.average_score || '0'),
          },
          today: parseInt(todayResult.rows[0]?.count || '0', 10),
        },
      };
    } catch (error) {
      console.error('Error fetching practice session statistics:', error);
      throw new Error('Failed to fetch practice session statistics');
    }
  }
}