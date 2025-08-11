import { z } from 'zod';

export const QuizConfigSchema = z.object({
  questionType: z.enum(['new', 'with-wrong', 'wrong-only']),
  questionCount: z.union([z.literal('unlimited'), z.number().positive()]),
  timeLimit: z.number().optional(),
  shuffleQuestions: z.boolean().default(true),
  showExplanation: z.boolean().default(true),
});

export type QuizConfig = z.infer<typeof QuizConfigSchema>;

export const PracticeSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string(),
  knowledgePointIds: z.array(z.string()),
  questionIds: z.array(z.string()),
  config: QuizConfigSchema,
  answers: z.array(z.union([z.string(), z.array(z.string()), z.null()])),
  questionDurations: z.array(z.number()).optional(), // in seconds
  startTime: z.date(),
  endTime: z.date().optional(),
  completed: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

export const CreatePracticeSessionSchema = z.object({
  subjectId: z.string(),
  knowledgePointIds: z.array(z.string()),
  config: QuizConfigSchema,
});

export type CreatePracticeSessionRequest = z.infer<typeof CreatePracticeSessionSchema>;

export const UpdatePracticeSessionSchema = z.object({
  answers: z.array(z.union([z.string(), z.array(z.string()), z.null()])).optional(),
  questionDurations: z.array(z.number()).optional(),
  endTime: z.date().optional(),
  completed: z.boolean().optional(),
});

export type UpdatePracticeSessionRequest = z.infer<typeof UpdatePracticeSessionSchema>;

export const PracticeHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  knowledgePointIds: z.array(z.string()),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  wrongAnswers: z.number(),
  completionRate: z.number(), // percentage
  averageTimePerQuestion: z.number().optional(), // in seconds
  totalDuration: z.number(), // in minutes
  practiceDate: z.date(),
  config: QuizConfigSchema,
  createdAt: z.date().optional(),
});

export type PracticeHistory = z.infer<typeof PracticeHistorySchema>;

export const KnowledgePointPerformanceSchema = z.object({
  knowledgePointId: z.string(),
  volume: z.string(),
  unit: z.string(),
  lesson: z.string(),
  section: z.string(),
  topic: z.string(),
  correctCount: z.number(),
  totalCount: z.number(),
  accuracy: z.number(), // percentage
  status: z.enum(['excellent', 'good', 'needs-improvement', 'poor']),
  lastPracticed: z.date(),
});

export type KnowledgePointPerformance = z.infer<typeof KnowledgePointPerformanceSchema>;