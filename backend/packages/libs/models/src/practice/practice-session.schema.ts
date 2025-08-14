import { z } from 'zod';

// Practice Strategy Enums
export const PracticeStrategySchema = z.enum([
  'random',
  'sequential',
  'difficulty_adaptive',
  'weakness_focused',
  'review_incorrect',
  'QUICK_PRACTICE',
  'WEAKNESS_REINFORCEMENT',
  'MISTAKE_REINFORCEMENT'
]);

export const PracticeStrategyCode = {
  QUICK_PRACTICE: 'QUICK_PRACTICE',
  WEAKNESS_REINFORCEMENT: 'WEAKNESS_REINFORCEMENT',
  MISTAKE_REINFORCEMENT: 'MISTAKE_REINFORCEMENT',
} as const;

export const DifficultyLevel = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  AUTO: 'AUTO',
} as const;

export const PracticeSessionStatusSchema = z.enum([
  'created',
  'in_progress',
  'paused',
  'completed',
  'abandoned'
]);

// Practice Session Schemas
export const CreatePracticeSessionSchema = z.object({
  knowledge_point_ids: z.array(z.string()).min(1),
  question_count: z.number().int().min(1).max(100).default(20),
  time_limit_minutes: z.number().int().min(5).max(180).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  strategy: PracticeStrategySchema.default('random'),
  shuffle_questions: z.boolean().default(true),
  shuffle_options: z.boolean().default(true),
  allow_review: z.boolean().default(true),
  show_answer_immediately: z.boolean().default(false)
});

export const PracticeSessionSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: PracticeSessionStatusSchema,
  strategy: PracticeStrategySchema,
  knowledge_point_ids: z.array(z.string()),
  total_questions: z.number().int(),
  answered_questions: z.number().int().default(0),
  correct_answers: z.number().int().default(0),
  incorrect_answers: z.number().int().default(0),
  skipped_questions: z.number().int().default(0),
  time_limit_minutes: z.number().int().optional(),
  time_spent_seconds: z.number().int().default(0),
  difficulty: z.string(),
  score: z.number().default(0),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export const PracticeQuestionSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  question_number: z.number().int(),
  question: z.string(),
  options: z.array(z.string()),
  correct_answer: z.string().optional(),
  student_answer: z.string().optional(),
  is_correct: z.boolean().optional(),
  time_spent_seconds: z.number().int().default(0),
  answered_at: z.string().datetime().optional(),
  attachments: z.array(z.string()).optional(),
  knowledge_point_id: z.string(),
  difficulty: z.string()
});

// Action Schemas
export const SubmitAnswerSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer: z.string(),
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
  questions: z.array(PracticeQuestionSchema)
});

export const PracticeStatisticsSchema = z.object({
  student_id: z.string().uuid(),
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
  difficulty_performance: z.object({
    easy: z.object({
      total: z.number().int(),
      correct: z.number().int(),
      accuracy: z.number()
    }),
    medium: z.object({
      total: z.number().int(),
      correct: z.number().int(),
      accuracy: z.number()
    }),
    hard: z.object({
      total: z.number().int(),
      correct: z.number().int(),
      accuracy: z.number()
    })
  }),
  recent_sessions: z.array(PracticeSessionSchema).optional()
});

export const PracticeHistoryQuerySchema = z.object({
  student_id: z.string().uuid().optional(),
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
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GeneratePracticeRequestSchema = z.object({
  strategyCode: z.string(),
  knowledgePointIds: z.array(z.string().uuid()).min(1),
  questionCount: z.number().int().min(1).max(100).default(20),
  timeLimit: z.number().int().min(60).max(7200).optional(),
  difficulty: z.string().default('AUTO'),
  options: z.object({
    includeExplanations: z.boolean().default(true),
    allowSkip: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    instantFeedback: z.boolean().default(true),
  }).optional(),
});

export const StudentWeaknessSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  knowledgePointId: z.string().uuid(),
  accuracyRate: z.number().min(0).max(100),
  practiceCount: z.number().int().min(0),
  lastPracticed: z.date().optional(),
  improvementTrend: z.number().optional(),
  isWeak: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const StudentMistakeSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  quizId: z.string().uuid(),
  sessionId: z.string().uuid(),
  incorrectAnswer: z.string(),
  correctAnswer: z.string(),
  mistakeCount: z.number().int().min(1).default(1),
  lastAttempted: z.date(),
  isCorrected: z.boolean().default(false),
  correctionCount: z.number().int().min(0).default(0),
  nextReviewDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
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
    lastUsed: z.date().optional(),
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
export type PracticeQuestion = z.infer<typeof PracticeQuestionSchema>;
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

