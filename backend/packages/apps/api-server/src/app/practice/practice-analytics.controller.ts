import { 
  Controller, 
  Get, 
  Param, 
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '@kedge/auth';
import { PracticeSessionService } from '@kedge/practice';

@Controller('api/practice/analytics')
@UseGuards(JwtAuthGuard)
export class PracticeAnalyticsController {
  constructor(private readonly practiceSessionService: PracticeSessionService) {}

  @Get('dashboard')
  async getDashboardData(@Request() req: any) {
    try {
      const userId = req.user.sub;
      
      // Get basic statistics
      const statistics = await this.practiceSessionService.getSessionStatistics(userId);
      
      // Get recent practice history (last 10)
      const recentHistory = await this.practiceSessionService.getUserPracticeHistory(
        userId, 
        undefined, 
        10
      );
      
      // Get knowledge point performance
      const knowledgePointPerformance = await this.practiceSessionService
        .getKnowledgePointPerformance(userId);
      
      // Get active sessions
      const activeSessions = await this.practiceSessionService.getUserActiveSessions(userId);
      
      // Calculate some derived metrics
      const weakKnowledgePoints = knowledgePointPerformance
        .filter(kp => kp.status === 'poor' || kp.status === 'needs-improvement')
        .slice(0, 10);
      
      const strongKnowledgePoints = knowledgePointPerformance
        .filter(kp => kp.status === 'excellent' || kp.status === 'good')
        .slice(0, 10);
      
      // Calculate practice streak (consecutive days with practice)
      const practiceStreak = this.calculatePracticeStreak(recentHistory);
      
      return {
        success: true,
        data: {
          statistics,
          recentHistory,
          activeSessions,
          knowledgePointPerformance: {
            weak: weakKnowledgePoints,
            strong: strongKnowledgePoints,
            total: knowledgePointPerformance.length
          },
          practiceStreak,
          recommendations: this.generateRecommendations(
            statistics, 
            weakKnowledgePoints, 
            recentHistory
          )
        },
        message: 'Dashboard data retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve dashboard data',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('subject/:subjectId/performance')
  async getSubjectPerformance(
    @Request() req: any,
    @Param('subjectId') subjectId: string,
    @Query('timeRange') timeRange?: string
  ) {
    try {
      const userId = req.user.sub;
      
      // Get subject-specific performance
      const knowledgePointPerformance = await this.practiceSessionService
        .getKnowledgePointPerformance(userId, subjectId);
      
      // Get subject-specific history
      const history = await this.practiceSessionService.getUserPracticeHistory(
        userId, 
        subjectId, 
        100
      );
      
      // Filter by time range if specified
      let filteredHistory = history;
      if (timeRange) {
        const cutoffDate = this.getTimeRangeCutoff(timeRange);
        filteredHistory = history.filter(h => h.practiceDate >= cutoffDate);
      }
      
      // Calculate performance trends
      const performanceTrend = this.calculatePerformanceTrend(filteredHistory);
      
      // Group performance by hierarchy
      const performanceByHierarchy = this.groupPerformanceByHierarchy(knowledgePointPerformance);
      
      return {
        success: true,
        data: {
          knowledgePointPerformance,
          history: filteredHistory,
          performanceTrend,
          performanceByHierarchy,
          summary: {
            totalPractices: filteredHistory.length,
            averageAccuracy: filteredHistory.length > 0 
              ? Math.round(filteredHistory.reduce((sum, h) => sum + h.completionRate, 0) / filteredHistory.length)
              : 0,
            totalTimeSpent: filteredHistory.reduce((sum, h) => sum + h.totalDuration, 0),
            knowledgePointsCovered: knowledgePointPerformance.length
          }
        },
        message: 'Subject performance retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve subject performance',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('progress-tracking')
  async getProgressTracking(
    @Request() req: any,
    @Query('subjectId') subjectId?: string,
    @Query('timeRange') timeRange = '30d'
  ) {
    try {
      const userId = req.user.sub;
      
      // Get practice history for the specified time range
      const history = await this.practiceSessionService.getUserPracticeHistory(
        userId, 
        subjectId, 
        1000
      );
      
      const cutoffDate = this.getTimeRangeCutoff(timeRange);
      const filteredHistory = history.filter(h => h.practiceDate >= cutoffDate);
      
      // Group by date for daily progress
      const dailyProgress = this.groupHistoryByDate(filteredHistory);
      
      // Calculate weekly progress
      const weeklyProgress = this.groupHistoryByWeek(filteredHistory);
      
      // Calculate knowledge point mastery progress
      const masteryProgress = await this.calculateMasteryProgress(userId, subjectId);
      
      // Calculate goal progress (if we had goals - for now, use defaults)
      const goalProgress = {
        dailyTarget: 30, // minutes per day
        weeklyTarget: 5, // sessions per week
        accuracyTarget: 80, // percentage
        currentDailyAverage: dailyProgress.length > 0 
          ? Math.round(dailyProgress.reduce((sum, d) => sum + d.totalDuration, 0) / dailyProgress.length)
          : 0,
        currentWeeklyAverage: weeklyProgress.length > 0
          ? Math.round(weeklyProgress.reduce((sum, w) => sum + w.sessionCount, 0) / weeklyProgress.length)
          : 0,
        currentAccuracyAverage: filteredHistory.length > 0
          ? Math.round(filteredHistory.reduce((sum, h) => sum + h.completionRate, 0) / filteredHistory.length)
          : 0
      };
      
      return {
        success: true,
        data: {
          dailyProgress,
          weeklyProgress,
          masteryProgress,
          goalProgress,
          timeRange,
          totalPractices: filteredHistory.length,
          totalTimeSpent: filteredHistory.reduce((sum, h) => sum + h.totalDuration, 0)
        },
        message: 'Progress tracking data retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve progress tracking data',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('learning-insights')
  async getLearningInsights(@Request() req: any) {
    try {
      const userId = req.user.sub;
      
      // Get comprehensive data for analysis
      const statistics = await this.practiceSessionService.getSessionStatistics(userId);
      const history = await this.practiceSessionService.getUserPracticeHistory(userId, undefined, 100);
      const knowledgePointPerformance = await this.practiceSessionService
        .getKnowledgePointPerformance(userId);
      
      // Generate insights
      const insights = {
        studyPatterns: this.analyzeStudyPatterns(history),
        performanceInsights: this.analyzePerformancePatterns(knowledgePointPerformance),
        timeDistribution: this.analyzeTimeDistribution(history),
        difficultyAnalysis: this.analyzeDifficultyPreferences(history),
        recommendations: this.generateAdvancedRecommendations(
          statistics, 
          history, 
          knowledgePointPerformance
        )
      };
      
      return {
        success: true,
        data: insights,
        message: 'Learning insights generated successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate learning insights',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper methods
  private calculatePracticeStreak(history: any[]): number {
    if (history.length === 0) return 0;
    
    const sortedHistory = history.sort((a, b) => b.practiceDate.getTime() - a.practiceDate.getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const practice of sortedHistory) {
      const practiceDate = new Date(practice.practiceDate);
      practiceDate.setHours(0, 0, 0, 0);
      
      if (practiceDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (practiceDate.getTime() < currentDate.getTime()) {
        break;
      }
    }
    
    return streak;
  }

  private generateRecommendations(statistics: any, weakPoints: any[], recentHistory: any[]) {
    const recommendations = [];
    
    if (weakPoints.length > 0) {
      recommendations.push({
        type: 'knowledge_gap',
        title: '关注薄弱知识点',
        description: `您有 ${weakPoints.length} 个知识点需要加强练习`,
        action: 'practice_weak_points',
        priority: 'high'
      });
    }
    
    if (statistics.averageAccuracy < 70) {
      recommendations.push({
        type: 'accuracy_improvement',
        title: '提高答题准确率',
        description: '建议重点复习基础知识，提高解题准确性',
        action: 'review_basics',
        priority: 'high'
      });
    }
    
    if (recentHistory.length === 0) {
      recommendations.push({
        type: 'practice_consistency',
        title: '保持练习频率',
        description: '定期练习有助于巩固学习成果',
        action: 'start_practice',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  private getTimeRangeCutoff(timeRange: string): Date {
    const now = new Date();
    const cutoffDate = new Date(now);
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 30);
    }
    
    return cutoffDate;
  }

  private calculatePerformanceTrend(history: any[]) {
    if (history.length === 0) return [];
    
    const sortedHistory = history.sort((a, b) => a.practiceDate.getTime() - b.practiceDate.getTime());
    
    return sortedHistory.map((practice, index) => ({
      date: practice.practiceDate,
      accuracy: practice.completionRate,
      cumulativeAccuracy: index === 0 
        ? practice.completionRate
        : Math.round(
            sortedHistory.slice(0, index + 1)
              .reduce((sum, p) => sum + p.completionRate, 0) / (index + 1)
          )
    }));
  }

  private groupPerformanceByHierarchy(performance: any[]) {
    const hierarchy: any = {};
    
    performance.forEach(kp => {
      if (!hierarchy[kp.volume]) {
        hierarchy[kp.volume] = {
          totalPoints: 0,
          averageAccuracy: 0,
          units: {}
        };
      }
      
      if (!hierarchy[kp.volume].units[kp.unit]) {
        hierarchy[kp.volume].units[kp.unit] = {
          totalPoints: 0,
          averageAccuracy: 0,
          lessons: {}
        };
      }
      
      if (!hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson]) {
        hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson] = {
          totalPoints: 0,
          averageAccuracy: 0,
          topics: []
        };
      }
      
      // Add to lesson
      hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson].topics.push(kp);
      hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson].totalPoints++;
      
      // Update counters
      hierarchy[kp.volume].totalPoints++;
      hierarchy[kp.volume].units[kp.unit].totalPoints++;
    });
    
    // Calculate averages
    Object.values(hierarchy).forEach((volume: any) => {
      const volumeAccuracies: number[] = [];
      Object.values(volume.units).forEach((unit: any) => {
        const unitAccuracies: number[] = [];
        Object.values(unit.lessons).forEach((lesson: any) => {
          const lessonAccuracy = lesson.topics.reduce((sum: number, t: any) => sum + t.accuracy, 0) / lesson.topics.length;
          lesson.averageAccuracy = Math.round(lessonAccuracy);
          unitAccuracies.push(lessonAccuracy);
        });
        unit.averageAccuracy = Math.round(unitAccuracies.reduce((sum, acc) => sum + acc, 0) / unitAccuracies.length);
        volumeAccuracies.push(unit.averageAccuracy);
      });
      volume.averageAccuracy = Math.round(volumeAccuracies.reduce((sum, acc) => sum + acc, 0) / volumeAccuracies.length);
    });
    
    return hierarchy;
  }

  private groupHistoryByDate(history: any[]) {
    const dailyMap = new Map();
    
    history.forEach(practice => {
      const dateKey = practice.practiceDate.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: practice.practiceDate,
          sessionCount: 0,
          totalDuration: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageAccuracy: 0
        });
      }
      
      const day = dailyMap.get(dateKey);
      day.sessionCount++;
      day.totalDuration += practice.totalDuration;
      day.totalQuestions += practice.totalQuestions;
      day.correctAnswers += practice.correctAnswers;
    });
    
    // Calculate average accuracy for each day
    for (const day of dailyMap.values()) {
      day.averageAccuracy = day.totalQuestions > 0 
        ? Math.round((day.correctAnswers / day.totalQuestions) * 100)
        : 0;
    }
    
    return Array.from(dailyMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private groupHistoryByWeek(history: any[]) {
    const weeklyMap = new Map();
    
    history.forEach(practice => {
      const weekStart = new Date(practice.practiceDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          weekStart,
          sessionCount: 0,
          totalDuration: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          averageAccuracy: 0
        });
      }
      
      const week = weeklyMap.get(weekKey);
      week.sessionCount++;
      week.totalDuration += practice.totalDuration;
      week.totalQuestions += practice.totalQuestions;
      week.correctAnswers += practice.correctAnswers;
    });
    
    // Calculate average accuracy for each week
    for (const week of weeklyMap.values()) {
      week.averageAccuracy = week.totalQuestions > 0 
        ? Math.round((week.correctAnswers / week.totalQuestions) * 100)
        : 0;
    }
    
    return Array.from(weeklyMap.values()).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  }

  private async calculateMasteryProgress(userId: string, subjectId?: string) {
    const performance = await this.practiceSessionService.getKnowledgePointPerformance(userId, subjectId);
    
    const masteryLevels = {
      mastered: performance.filter(kp => kp.status === 'excellent').length,
      proficient: performance.filter(kp => kp.status === 'good').length,
      developing: performance.filter(kp => kp.status === 'needs-improvement').length,
      novice: performance.filter(kp => kp.status === 'poor').length
    };
    
    const total = performance.length;
    const masteryPercentage = total > 0 
      ? Math.round(((masteryLevels.mastered + masteryLevels.proficient) / total) * 100)
      : 0;
    
    return {
      masteryLevels,
      total,
      masteryPercentage,
      recentlyMastered: performance
        .filter(kp => kp.status === 'excellent')
        .sort((a, b) => b.lastPracticed.getTime() - a.lastPracticed.getTime())
        .slice(0, 5)
    };
  }

  private analyzeStudyPatterns(history: any[]) {
    // Analyze when user typically studies
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    
    history.forEach(practice => {
      const hour = practice.practiceDate.getHours();
      const dayOfWeek = practice.practiceDate.getDay();
      hourCounts[hour]++;
      dayOfWeekCounts[dayOfWeek]++;
    });
    
    const preferredHour = hourCounts.indexOf(Math.max(...hourCounts));
    const preferredDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
    
    return {
      preferredHour,
      preferredDay,
      hourlyDistribution: hourCounts,
      weeklyDistribution: dayOfWeekCounts,
      averageSessionDuration: history.length > 0 
        ? Math.round(history.reduce((sum, h) => sum + h.totalDuration, 0) / history.length)
        : 0
    };
  }

  private analyzePerformancePatterns(performance: any[]) {
    const statusCounts = {
      excellent: performance.filter(kp => kp.status === 'excellent').length,
      good: performance.filter(kp => kp.status === 'good').length,
      needs_improvement: performance.filter(kp => kp.status === 'needs-improvement').length,
      poor: performance.filter(kp => kp.status === 'poor').length
    };
    
    const averageAccuracy = performance.length > 0
      ? Math.round(performance.reduce((sum, kp) => sum + kp.accuracy, 0) / performance.length)
      : 0;
    
    return {
      statusDistribution: statusCounts,
      averageAccuracy,
      totalKnowledgePoints: performance.length,
      strongestAreas: performance
        .filter(kp => kp.status === 'excellent')
        .slice(0, 5),
      weakestAreas: performance
        .filter(kp => kp.status === 'poor')
        .slice(0, 5)
    };
  }

  private analyzeTimeDistribution(history: any[]) {
    const totalTime = history.reduce((sum, h) => sum + h.totalDuration, 0);
    const sessionCount = history.length;
    
    const timeBySubject = new Map();
    history.forEach(practice => {
      const current = timeBySubject.get(practice.subjectId) || 0;
      timeBySubject.set(practice.subjectId, current + practice.totalDuration);
    });
    
    return {
      totalTime,
      sessionCount,
      averageSessionTime: sessionCount > 0 ? Math.round(totalTime / sessionCount) : 0,
      timeBySubject: Object.fromEntries(timeBySubject)
    };
  }

  private analyzeDifficultyPreferences(history: any[]) {
    // This would be more meaningful with actual difficulty ratings
    // For now, use completion rate as a proxy
    const easyPractices = history.filter(h => h.completionRate >= 90).length;
    const mediumPractices = history.filter(h => h.completionRate >= 70 && h.completionRate < 90).length;
    const hardPractices = history.filter(h => h.completionRate < 70).length;
    
    return {
      difficultyDistribution: {
        easy: easyPractices,
        medium: mediumPractices,
        hard: hardPractices
      },
      preferredDifficulty: easyPractices >= mediumPractices && easyPractices >= hardPractices 
        ? 'easy' 
        : mediumPractices >= hardPractices 
          ? 'medium' 
          : 'hard'
    };
  }

  private generateAdvancedRecommendations(statistics: any, history: any[], performance: any[]) {
    const recommendations = [];
    
    // Study pattern recommendations
    const studyPatterns = this.analyzeStudyPatterns(history);
    if (studyPatterns.averageSessionDuration < 15) {
      recommendations.push({
        type: 'session_duration',
        title: '增加练习时长',
        description: '建议每次练习至少15-20分钟以获得更好效果',
        priority: 'medium'
      });
    }
    
    // Performance-based recommendations
    const weakAreas = performance.filter(kp => kp.accuracy < 60);
    if (weakAreas.length > 5) {
      recommendations.push({
        type: 'focus_learning',
        title: '集中学习重点',
        description: '建议专注于少数薄弱知识点，逐个击破',
        priority: 'high'
      });
    }
    
    // Frequency recommendations
    if (history.length > 0) {
      const daysSinceLastPractice = Math.floor(
        (Date.now() - history[0].practiceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastPractice > 3) {
        recommendations.push({
          type: 'practice_frequency',
          title: '保持练习频率',
          description: '建议每2-3天进行一次练习以保持学习效果',
          priority: 'high'
        });
      }
    }
    
    return recommendations;
  }
}