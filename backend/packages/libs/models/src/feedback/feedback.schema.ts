import { z } from 'zod';

// =====================================================
// SESSION ANALYSIS SCHEMAS
// =====================================================

export const SessionAnalysisSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Performance Metrics
  accuracy_percentage: z.number().min(0).max(100),
  speed_percentile: z.number().min(0).max(100).optional(),
  consistency_score: z.number().min(0).max(100).optional(),
  improvement_rate: z.number().optional(),
  
  // Time Analysis
  total_time_seconds: z.number().int().positive(),
  average_time_per_question: z.number().positive(),
  fastest_answer_seconds: z.number().int().positive().optional(),
  slowest_answer_seconds: z.number().int().positive().optional(),
  
  // Question Type Performance
  single_choice_accuracy: z.number().min(0).max(100).optional(),
  multiple_choice_accuracy: z.number().min(0).max(100).optional(),
  essay_completion_rate: z.number().min(0).max(100).optional(),
  
  // Comparative Metrics
  peer_comparison_percentile: z.number().min(0).max(100).optional(),
  personal_best_comparison: z.number().optional(),
  
  // Strengths and Weaknesses
  identified_strengths: z.array(z.object({
    knowledge_point_id: z.string(),
    knowledge_point_name: z.string(),
    score: z.number(),
  })).default([]),
  identified_weaknesses: z.array(z.object({
    knowledge_point_id: z.string(),
    knowledge_point_name: z.string(),
    score: z.number(),
    suggested_focus: z.boolean().default(true),
  })).default([]),
  
  // Difficulty Analysis
  perceived_difficulty: z.enum(['easy', 'moderate', 'challenging', 'very_challenging']).optional(),
  
  created_at: z.date(),
  updated_at: z.date(),
});

export type SessionAnalysis = z.infer<typeof SessionAnalysisSchema>;

// =====================================================
// ANSWER FEEDBACK SCHEMAS
// =====================================================

export const AnswerFeedbackSchema = z.object({
  id: z.string().uuid(),
  answer_id: z.string().uuid(),
  session_id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  
  // Correctness Details
  is_correct: z.boolean(),
  partial_credit: z.number().min(0).max(1).default(0),
  
  // Answer Analysis
  answer_quality: z.enum(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']).optional(),
  common_mistake_type: z.string().optional(),
  
  // Time Analysis
  time_spent_seconds: z.number().int().positive().optional(),
  time_category: z.enum(['too_fast', 'optimal', 'slow', 'timeout']).optional(),
  
  // Detailed Feedback
  explanation: z.string().optional(),
  hint: z.string().optional(),
  related_concept: z.string().optional(),
  
  // Learning Material References
  recommended_resources: z.array(z.object({
    type: z.enum(['video', 'article', 'exercise', 'textbook']),
    title: z.string(),
    url: z.string().optional(),
    id: z.string().optional(),
  })).default([]),
  similar_quiz_ids: z.array(z.string().uuid()).default([]),
  
  created_at: z.date(),
});

export type AnswerFeedback = z.infer<typeof AnswerFeedbackSchema>;

// =====================================================
// LEARNING RECOMMENDATION SCHEMAS
// =====================================================

export const RecommendationTypeSchema = z.enum([
  'review_material',
  'practice_more',
  'advance_topic',
  'take_break',
  'change_strategy'
]);

export const UrgencyLevelSchema = z.enum(['immediate', 'high', 'normal', 'low']);

export const LearningRecommendationSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Recommendation Type
  recommendation_type: RecommendationTypeSchema,
  
  // Priority and Urgency
  priority: z.number().int().min(0).max(10),
  urgency: UrgencyLevelSchema.default('normal'),
  
  // Recommendation Details
  title: z.string().max(255),
  description: z.string(),
  reason: z.string().optional(),
  expected_benefit: z.string().optional(),
  
  // Action Items
  action_items: z.array(z.object({
    action: z.string(),
    completed: z.boolean().default(false),
    deadline: z.date().optional(),
  })).default([]),
  target_knowledge_points: z.array(z.string()).default([]),
  suggested_quiz_ids: z.array(z.string().uuid()).default([]),
  
  // Tracking
  is_acknowledged: z.boolean().default(false),
  is_completed: z.boolean().default(false),
  acknowledged_at: z.date().optional(),
  completed_at: z.date().optional(),
  
  // Validity
  expires_at: z.date().optional(),
  
  created_at: z.date(),
  updated_at: z.date(),
});

export type LearningRecommendation = z.infer<typeof LearningRecommendationSchema>;

// =====================================================
// ACHIEVEMENT SCHEMAS
// =====================================================

export const AchievementRaritySchema = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']);

export const AchievementSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  
  // Achievement Details
  achievement_type: z.string().max(100),
  achievement_name: z.string().max(255),
  achievement_description: z.string().optional(),
  
  // Badge/Icon Information
  badge_icon: z.string().optional(),
  badge_color: z.string().optional(),
  rarity: AchievementRaritySchema.default('common'),
  
  // Progress Tracking
  progress_current: z.number().int().min(0).default(0),
  progress_target: z.number().int().positive().optional(),
  is_unlocked: z.boolean().default(false),
  unlocked_at: z.date().optional(),
  
  // Rewards
  reward_points: z.number().int().min(0).default(0),
  reward_description: z.string().optional(),
  
  created_at: z.date(),
  updated_at: z.date(),
});

export type Achievement = z.infer<typeof AchievementSchema>;

// =====================================================
// PERFORMANCE TREND SCHEMAS
// =====================================================

export const PeriodTypeSchema = z.enum(['daily', 'weekly', 'monthly']);
export const TrendDirectionSchema = z.enum(['improving', 'stable', 'declining']);

export const PerformanceTrendSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  knowledge_point_id: z.string().optional(),
  
  // Time Period
  period_type: PeriodTypeSchema,
  period_date: z.date(),
  
  // Metrics
  sessions_count: z.number().int().min(0).default(0),
  questions_attempted: z.number().int().min(0).default(0),
  questions_correct: z.number().int().min(0).default(0),
  average_accuracy: z.number().min(0).max(100).optional(),
  average_speed: z.number().positive().optional(),
  
  // Trend Analysis
  trend_direction: TrendDirectionSchema.optional(),
  trend_strength: z.number().min(0).max(100).optional(),
  
  created_at: z.date(),
  updated_at: z.date(),
});

export type PerformanceTrend = z.infer<typeof PerformanceTrendSchema>;

// =====================================================
// FEEDBACK TEMPLATE SCHEMAS
// =====================================================

export const FeedbackTemplateSchema = z.object({
  id: z.string().uuid(),
  template_type: z.string().max(100),
  condition_rules: z.record(z.any()),
  
  // Template Content
  title_template: z.string(),
  message_template: z.string(),
  encouragement_messages: z.array(z.string()).default([]),
  improvement_tips: z.array(z.string()).default([]),
  
  // Visual Elements
  icon: z.string().optional(),
  color_scheme: z.string().optional(),
  animation_type: z.string().optional(),
  
  is_active: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  
  created_at: z.date(),
  updated_at: z.date(),
});

export type FeedbackTemplate = z.infer<typeof FeedbackTemplateSchema>;

// =====================================================
// API REQUEST/RESPONSE SCHEMAS
// =====================================================

// Request schema for generating feedback
export const GenerateFeedbackRequestSchema = z.object({
  session_id: z.string().uuid(),
  include_recommendations: z.boolean().default(true),
  include_achievements: z.boolean().default(true),
  include_trends: z.boolean().default(false),
});

export type GenerateFeedbackRequest = z.infer<typeof GenerateFeedbackRequestSchema>;

// Complete feedback response
export const CompleteFeedbackResponseSchema = z.object({
  session_analysis: SessionAnalysisSchema,
  answer_feedbacks: z.array(AnswerFeedbackSchema),
  recommendations: z.array(LearningRecommendationSchema),
  new_achievements: z.array(AchievementSchema),
  performance_trends: z.array(PerformanceTrendSchema).optional(),
  feedback_message: z.object({
    title: z.string(),
    message: z.string(),
    encouragement: z.string().optional(),
    tips: z.array(z.string()),
  }),
});

export type CompleteFeedbackResponse = z.infer<typeof CompleteFeedbackResponseSchema>;

// Summary feedback for quick display
export const FeedbackSummarySchema = z.object({
  session_id: z.string().uuid(),
  accuracy: z.number(),
  improvement: z.number().optional(),
  strengths_count: z.number(),
  weaknesses_count: z.number(),
  new_achievements_count: z.number(),
  primary_recommendation: z.string().optional(),
  overall_performance: z.enum(['excellent', 'good', 'satisfactory', 'needs_improvement']),
});

export type FeedbackSummary = z.infer<typeof FeedbackSummarySchema>;