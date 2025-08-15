import { z } from 'zod';
import { KnowledgePointSchema } from './knowledge-point.schema';
import { QuizItemSchema } from '../quiz/quiz-item.schema';

// Note: QuizItem and QuizItemSchema are defined in quiz module
// External modules should import from @kedge/models

export const KnowledgePointMatchResultSchema = z.object({
  matched: KnowledgePointSchema.optional(),
  candidates: z.array(KnowledgePointSchema),
  keywords: z.array(z.string()),
  country: z.string(),
  dynasty: z.string(),
});

export type KnowledgePointMatchResult = z.infer<typeof KnowledgePointMatchResultSchema>;

export const QuizWithKnowledgePointSchema = QuizItemSchema.extend({
  knowledgePoint: KnowledgePointSchema.optional(),
  matchingResult: KnowledgePointMatchResultSchema.optional(),
  matchingStatus: z.enum(['pending', 'loading', 'success', 'error']).optional(),
});

export type QuizWithKnowledgePoint = z.infer<typeof QuizWithKnowledgePointSchema>;
