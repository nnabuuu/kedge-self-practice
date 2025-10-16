import { z } from 'zod';
import { QuizWithKnowledgePointSchema } from '../practice/quiz.schema';

/**
 * Create single quiz request schema
 */
export const CreateQuizSchema = z.object({
  quiz: QuizWithKnowledgePointSchema,
});

export type CreateQuizRequest = z.infer<typeof CreateQuizSchema>;

/**
 * Create multiple quizzes request schema
 */
export const CreateMultipleQuizzesSchema = z.object({
  quizzes: z.array(QuizWithKnowledgePointSchema),
});

export type CreateMultipleQuizzesRequest = z.infer<typeof CreateMultipleQuizzesSchema>;

/**
 * All quiz API related schemas
 */
export const QuizApiSchemas = {
  CreateQuiz: CreateQuizSchema,
  CreateMultipleQuizzes: CreateMultipleQuizzesSchema,
};
