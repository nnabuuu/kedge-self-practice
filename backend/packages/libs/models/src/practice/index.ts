import { KnowledgePointSchema } from './knowledge-point.schema';
import {
  QuizItemSchema,
  QuizWithKnowledgePointSchema,
  KnowledgePointMatchResultSchema,
} from './quiz.schema';

export { KnowledgePointSchema, type KnowledgePoint } from './knowledge-point.schema';
export {
  QuizItemSchema,
  type QuizItem,
  QuizWithKnowledgePointSchema,
  type QuizWithKnowledgePoint,
  KnowledgePointMatchResultSchema,
  type KnowledgePointMatchResult,
} from './quiz.schema';

export const PracticeSchema = {
  KnowledgePoint: KnowledgePointSchema,
  QuizItem: QuizItemSchema,
  QuizWithKnowledgePoint: QuizWithKnowledgePointSchema,
  KnowledgePointMatchResult: KnowledgePointMatchResultSchema,
} as const;
