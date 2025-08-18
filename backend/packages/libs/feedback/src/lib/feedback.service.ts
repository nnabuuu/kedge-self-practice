import { Injectable, Logger } from '@nestjs/common';
import { 
  SessionAnalysis,
  AnswerFeedback,
  LearningRecommendation,
  Achievement,
  PerformanceTrend,
  CompleteFeedbackResponse,
  FeedbackSummary,
  GenerateFeedbackRequest
} from '@kedge/models';
import { PracticeService } from '@kedge/practice';
import { QuizService } from '@kedge/quiz';
import { FeedbackRepository } from './feedback.repository';
import { FeedbackAnalyzer } from './feedback.analyzer';
import { AchievementEngine } from './achievement.engine';
import { RecommendationEngine } from './recommendation.engine';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly practiceService: PracticeService,
    private readonly quizService: QuizService,
    private readonly feedbackAnalyzer: FeedbackAnalyzer,
    private readonly achievementEngine: AchievementEngine,
    private readonly recommendationEngine: RecommendationEngine,
  ) {}

  /**
   * Generate comprehensive feedback for a completed practice session
   */
  async generateSessionFeedback(
    request: GenerateFeedbackRequest
  ): Promise<CompleteFeedbackResponse> {
    const { session_id, include_recommendations, include_achievements, include_trends } = request;

    // 1. Get session data
    const session = await this.practiceService.getSession(session_id, ''); // User ID from session
    if (!session.session.status !== 'completed') {
      throw new Error('Session must be completed before generating feedback');
    }

    // 2. Analyze session performance
    const sessionAnalysis = await this.analyzeSession(session_id);
    
    // 3. Generate answer-level feedback
    const answerFeedbacks = await this.generateAnswerFeedbacks(session_id);
    
    // 4. Generate recommendations if requested
    const recommendations = include_recommendations 
      ? await this.generateRecommendations(session_id, sessionAnalysis)
      : [];
    
    // 5. Check for new achievements if requested
    const newAchievements = include_achievements
      ? await this.checkAchievements(session_id, sessionAnalysis)
      : [];
    
    // 6. Get performance trends if requested
    const performanceTrends = include_trends
      ? await this.getPerformanceTrends(session.session.user_id)
      : [];
    
    // 7. Generate personalized feedback message
    const feedbackMessage = await this.generateFeedbackMessage(sessionAnalysis);
    
    // 8. Save all feedback data
    await this.saveFeedbackData({
      sessionAnalysis,
      answerFeedbacks,
      recommendations,
      newAchievements,
    });

    return {
      session_analysis: sessionAnalysis,
      answer_feedbacks: answerFeedbacks,
      recommendations,
      new_achievements: newAchievements,
      performance_trends: performanceTrends,
      feedback_message: feedbackMessage,
    };
  }

  /**
   * Analyze session performance and generate metrics
   */
  private async analyzeSession(sessionId: string): Promise<SessionAnalysis> {
    return this.feedbackAnalyzer.analyzeSession(sessionId);
  }

  /**
   * Generate detailed feedback for each answer
   */
  private async generateAnswerFeedbacks(sessionId: string): Promise<AnswerFeedback[]> {
    const session = await this.practiceService.getSession(sessionId, '');
    const feedbacks: AnswerFeedback[] = [];

    for (const answer of session.answers) {
      const quiz = session.quizzes.find(q => q.id === answer.quiz_id);
      if (!quiz) continue;

      const feedback = await this.feedbackAnalyzer.analyzeAnswer(answer, quiz);
      feedbacks.push(feedback);
    }

    return feedbacks;
  }

  /**
   * Generate learning recommendations based on performance
   */
  private async generateRecommendations(
    sessionId: string,
    analysis: SessionAnalysis
  ): Promise<LearningRecommendation[]> {
    return this.recommendationEngine.generateRecommendations(sessionId, analysis);
  }

  /**
   * Check for new achievements unlocked
   */
  private async checkAchievements(
    sessionId: string,
    analysis: SessionAnalysis
  ): Promise<Achievement[]> {
    return this.achievementEngine.checkAchievements(sessionId, analysis);
  }

  /**
   * Get performance trends for the user
   */
  private async getPerformanceTrends(userId: string): Promise<PerformanceTrend[]> {
    return this.feedbackRepository.getPerformanceTrends(userId);
  }

  /**
   * Generate personalized feedback message based on performance
   */
  private async generateFeedbackMessage(
    analysis: SessionAnalysis
  ): Promise<{
    title: string;
    message: string;
    encouragement?: string;
    tips: string[];
  }> {
    // Select appropriate template based on performance
    const template = await this.feedbackRepository.selectFeedbackTemplate(analysis);
    
    // Replace placeholders with actual values
    const title = this.replacePlaceholders(template.title_template, analysis);
    const message = this.replacePlaceholders(template.message_template, analysis);
    
    // Select random encouragement and tips
    const encouragement = this.selectRandom(template.encouragement_messages);
    const tips = this.selectMultipleRandom(template.improvement_tips, 3);

    return {
      title,
      message,
      encouragement,
      tips,
    };
  }

  /**
   * Save all feedback data to database
   */
  private async saveFeedbackData(data: {
    sessionAnalysis: SessionAnalysis;
    answerFeedbacks: AnswerFeedback[];
    recommendations: LearningRecommendation[];
    newAchievements: Achievement[];
  }): Promise<void> {
    await this.feedbackRepository.saveSessionAnalysis(data.sessionAnalysis);
    await this.feedbackRepository.saveAnswerFeedbacks(data.answerFeedbacks);
    await this.feedbackRepository.saveRecommendations(data.recommendations);
    await this.feedbackRepository.saveAchievements(data.newAchievements);
  }

  /**
   * Get feedback summary for quick display
   */
  async getFeedbackSummary(sessionId: string): Promise<FeedbackSummary> {
    const analysis = await this.feedbackRepository.getSessionAnalysis(sessionId);
    const recommendations = await this.feedbackRepository.getSessionRecommendations(sessionId);
    const achievements = await this.feedbackRepository.getSessionAchievements(sessionId);

    return {
      session_id: sessionId,
      accuracy: analysis.accuracy_percentage,
      improvement: analysis.improvement_rate,
      strengths_count: analysis.identified_strengths.length,
      weaknesses_count: analysis.identified_weaknesses.length,
      new_achievements_count: achievements.filter(a => a.is_unlocked).length,
      primary_recommendation: recommendations[0]?.title,
      overall_performance: this.categorizePerformance(analysis.accuracy_percentage),
    };
  }

  /**
   * Get detailed feedback for a specific answer
   */
  async getAnswerFeedback(answerId: string): Promise<AnswerFeedback> {
    return this.feedbackRepository.getAnswerFeedback(answerId);
  }

  /**
   * Mark recommendation as acknowledged or completed
   */
  async updateRecommendationStatus(
    recommendationId: string,
    status: 'acknowledged' | 'completed'
  ): Promise<void> {
    await this.feedbackRepository.updateRecommendationStatus(recommendationId, status);
  }

  /**
   * Get user's achievement history
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return this.feedbackRepository.getUserAchievements(userId);
  }

  /**
   * Get user's performance trends
   */
  async getUserTrends(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceTrend[]> {
    return this.feedbackRepository.getUserTrends(userId, periodType, startDate, endDate);
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private replacePlaceholders(template: string, data: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  private selectRandom<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(Math.random() * array.length)];
  }

  private selectMultipleRandom<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private categorizePerformance(accuracy: number): 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' {
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 70) return 'good';
    if (accuracy >= 50) return 'satisfactory';
    return 'needs_improvement';
  }
}