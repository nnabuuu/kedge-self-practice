import { z } from 'zod';

// Date preprocessor to handle various date formats from database
const dateSchema = z.preprocess((arg) => {
  if (arg instanceof Date) return arg;
  if (typeof arg === 'string') return new Date(arg);
  if (typeof arg === 'number') return new Date(arg);
  return arg;
}, z.date());

// Nullable date preprocessor
const nullableDateSchema = z.preprocess((arg) => {
  if (arg === null || arg === undefined) return null;
  if (arg instanceof Date) return arg;
  if (typeof arg === 'string') return new Date(arg);
  if (typeof arg === 'number') return new Date(arg);
  return arg;
}, z.date().nullable());

// Practice Strategy Enums (must match database CHECK constraint)
export const PracticeStrategySchema = z.enum([
  'random',
  'sequential',
  'adaptive',
  'review',
  'weakness'
]);

export const PracticeStrategyCode = {
  QUICK_PRACTICE: 'QUICK_PRACTICE',
  WEAKNESS_REINFORCEMENT: 'WEAKNESS_REINFORCEMENT',
  MISTAKE_REINFORCEMENT: 'MISTAKE_REINFORCEMENT',
} as const;


export const PracticeSessionStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'abandoned'
]);

// Practice Session Schemas
export const CreatePracticeSessionSchema = z.object({
  subject_id: z.string().optional(),
  knowledge_point_ids: z.array(z.string()).min(0),
  question_count: z.number().int().min(1).max(100).default(20),
  time_limit_minutes: z.number().int().min(5).max(180).optional(),
  strategy: PracticeStrategySchema.default('random'),
  shuffle_questions: z.boolean().default(true),
  shuffle_options: z.boolean().default(true),
  allow_review: z.boolean().default(true),
  show_answer_immediately: z.boolean().default(false),
  quiz_types: z.array(z.enum(['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other'])).optional(),
  question_type: z.enum(['new-only', 'with-wrong', 'wrong-only']).optional().default('with-wrong'),
  auto_advance_delay: z.number().int().min(0).max(30).default(0) // Delay in seconds (0 = disabled, max 30 seconds)
});

export const PracticeSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subject_id: z.string().nullable().optional(),
  status: PracticeSessionStatusSchema,
  strategy: PracticeStrategySchema,
  quiz_ids: z.array(z.string().uuid()),
  total_questions: z.number().int(),
  answered_questions: z.number().int().default(0),
  correct_answers: z.number().int().default(0),
  incorrect_answers: z.number().int().default(0),
  skipped_questions: z.number().int().default(0),
  time_limit_minutes: z.number().int().nullable().optional(),
  time_spent_seconds: z.number().int().default(0),
  score: z.number().default(0),
  auto_advance_delay: z.number().int().default(0), // Delay in seconds before auto-advancing
  last_question_index: z.number().int().default(0), // Track current question position for resume
  session_state: z.record(z.any()).default({}), // Store UI state (shuffle seed, timer) as JSON
  started_at: nullableDateSchema.optional(),
  completed_at: nullableDateSchema.optional(),
  created_at: dateSchema,
  updated_at: dateSchema
});

// User answer preprocessor to handle both string and number from JSONB
// Converts numeric strings to numbers for consistent storage
const userAnswerSchema = z.preprocess((arg) => {
  if (arg === null || arg === undefined) return null;
  if (typeof arg === 'number') return arg.toString(); // Convert numbers back to strings for app logic
  if (typeof arg === 'string') return arg;
  return String(arg); // Fallback: convert to string
}, z.string().nullable().optional());

export const PracticeAnswerSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  user_answer: userAnswerSchema,
  is_correct: z.boolean().nullable().optional(),
  time_spent_seconds: z.number().int().default(0),
  answered_at: nullableDateSchema.optional(),
  created_at: dateSchema
});

// Action Schemas
export const SubmitAnswerSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer: z.union([z.string(), z.array(z.string())]), // Accept both string and string array
  time_spent_seconds: z.number().int().min(0)
});

export const SkipQuestionSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  time_spent_seconds: z.number().int().min(0)
});

export const GetNextQuestionSchema = z.object({
  session_id: z.string().uuid()
});

export const PauseSessionSchema = z.object({
  session_id: z.string().uuid()
});

export const ResumeSessionSchema = z.object({
  session_id: z.string().uuid()
});

export const CompleteSessionSchema = z.object({
  session_id: z.string().uuid()
});

// Response Schemas
export const PracticeSessionResponseSchema = z.object({
  session: PracticeSessionSchema,
  quizzes: z.array(z.any()), // Array of QuizItem from quiz service
  submittedAnswers: z.array(PracticeAnswerSchema).default([]), // User's submitted answers
  currentQuestionIndex: z.number().int().default(0) // Current position in the quiz
});

export const PracticeStatisticsSchema = z.object({
  user_id: z.string().uuid(),
  total_sessions: z.number().int(),
  completed_sessions: z.number().int(),
  total_questions_answered: z.number().int(),
  total_correct: z.number().int(),
  total_incorrect: z.number().int(),
  total_skipped: z.number().int(),
  average_accuracy: z.number(),
  total_time_spent_minutes: z.number(),
  knowledge_point_performance: z.array(z.object({
    knowledge_point_id: z.string(),
    knowledge_point_name: z.string(),
    total_questions: z.number().int(),
    correct_answers: z.number().int(),
    accuracy: z.number(),
    average_time_seconds: z.number()
  })),
  recent_sessions: z.array(PracticeSessionSchema).optional()
});

export const PracticeHistoryQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  status: PracticeSessionStatusSchema.optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export const BasicStatisticsSchema = z.object({
  total_sessions: z.string(),
  completed_sessions: z.string(),
  average_score: z.string().nullable()
});

// Strategy-specific schemas
export const StrategyDefinitionSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  requiredHistory: z.boolean().default(false),
  minimumPracticeCount: z.number().int().min(0).default(0),
  minimumMistakeCount: z.number().int().min(0).default(0),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const GeneratePracticeRequestSchema = z.object({
  strategyCode: z.string(),
  knowledgePointIds: z.array(z.string().uuid()).min(1),
  questionCount: z.number().int().min(1).max(100).default(20),
  timeLimit: z.number().int().min(60).max(7200).optional(),
  options: z.object({
    includeExplanations: z.boolean().default(true),
    allowSkip: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    instantFeedback: z.boolean().default(true),
  }).optional(),
});

export const StudentWeaknessSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  knowledgePointId: z.string().uuid(),
  accuracyRate: z.number().min(0).max(100),
  practiceCount: z.number().int().min(0),
  lastPracticed: nullableDateSchema.optional(),
  improvementTrend: z.number().optional(),
  isWeak: z.boolean().default(false),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const StudentMistakeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  quizId: z.string().uuid(),
  sessionId: z.string().uuid(),
  incorrectAnswer: z.string(),
  correctAnswer: z.string(),
  mistakeCount: z.number().int().min(1).default(1),
  lastAttempted: dateSchema,
  isCorrected: z.boolean().default(false),
  correctionCount: z.number().int().min(0).default(0),
  nextReviewDate: nullableDateSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const StrategyRecommendationSchema = z.object({
  strategyCode: z.string(),
  reason: z.string(),
  priority: z.number().int().min(1).max(10),
  metadata: z.record(z.any()).optional(),
});

export const StrategyAnalyticsSchema = z.object({
  strategyCode: z.string(),
  usage: z.object({
    totalSessions: z.number().int(),
    lastUsed: nullableDateSchema.optional(),
    averageScore: z.number().min(0).max(100),
    improvement: z.number(),
  }),
  effectiveness: z.object({
    weakPointsImproved: z.number().int().optional(),
    weakPointsRemaining: z.number().int().optional(),
    averageImprovementRate: z.number().optional(),
    mistakesCorrected: z.number().int().optional(),
    mistakesRemaining: z.number().int().optional(),
  }),
});

// Type exports
export type CreatePracticeSession = z.infer<typeof CreatePracticeSessionSchema>;
export type PracticeSession = z.infer<typeof PracticeSessionSchema>;
export type PracticeAnswer = z.infer<typeof PracticeAnswerSchema>;
export type SubmitAnswer = z.infer<typeof SubmitAnswerSchema>;
export type SkipQuestion = z.infer<typeof SkipQuestionSchema>;
export type PracticeSessionResponse = z.infer<typeof PracticeSessionResponseSchema>;
export type PracticeStatistics = z.infer<typeof PracticeStatisticsSchema>;
export type PracticeStrategy = z.infer<typeof PracticeStrategySchema>;
export type PracticeSessionStatus = z.infer<typeof PracticeSessionStatusSchema>;
export type BasicStatistics = z.infer<typeof BasicStatisticsSchema>;
export type StrategyDefinition = z.infer<typeof StrategyDefinitionSchema>;
export type GeneratePracticeRequest = z.infer<typeof GeneratePracticeRequestSchema>;
export type StudentWeakness = z.infer<typeof StudentWeaknessSchema>;
export type StudentMistake = z.infer<typeof StudentMistakeSchema>;
export type StrategyRecommendation = z.infer<typeof StrategyRecommendationSchema>;
export type StrategyAnalytics = z.infer<typeof StrategyAnalyticsSchema>;

