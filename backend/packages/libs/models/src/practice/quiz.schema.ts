import { z } from 'zod';
import { KnowledgePointSchema } from './knowledge-point.schema';

export const QuizItemSchema = z.object({
  type: z.enum(['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other']),
  question: z.string(),
  options: z.array(z.string()),
  // Images can be embedded via Markdown or URLs in question/options strings
  answer: z.union([z.string(), z.array(z.string()), z.array(z.number())]),
  originalParagraph: z.string().optional(),
});

export type QuizItem = z.infer<typeof QuizItemSchema>;

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
