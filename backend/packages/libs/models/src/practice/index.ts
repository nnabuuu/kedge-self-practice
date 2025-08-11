import { KnowledgePointSchema } from './knowledge-point.schema';
import {
  QuizItemSchema,
  QuizWithKnowledgePointSchema,
  KnowledgePointMatchResultSchema,
} from './quiz.schema';
import { SubjectSchema } from './subject.schema';
import {
  PracticeSessionSchema,
  PracticeHistorySchema,
  QuizConfigSchema,
  KnowledgePointPerformanceSchema,
} from './practice-session.schema';

export { KnowledgePointSchema, type KnowledgePoint } from './knowledge-point.schema';
export {
  QuizItemSchema,
  type QuizItem,
  QuizWithKnowledgePointSchema,
  type QuizWithKnowledgePoint,
  KnowledgePointMatchResultSchema,
  type KnowledgePointMatchResult,
} from './quiz.schema';
export { 
  SubjectSchema, 
  type Subject,
  CreateSubjectSchema,
  type CreateSubjectRequest,
  UpdateSubjectSchema,
  type UpdateSubjectRequest,
} from './subject.schema';
export {
  PracticeSessionSchema,
  type PracticeSession,
  CreatePracticeSessionSchema,
  type CreatePracticeSessionRequest,
  UpdatePracticeSessionSchema,
  type UpdatePracticeSessionRequest,
  PracticeHistorySchema,
  type PracticeHistory,
  QuizConfigSchema,
  type QuizConfig,
  KnowledgePointPerformanceSchema,
  type KnowledgePointPerformance,
} from './practice-session.schema';

export const PracticeSchema = {
  KnowledgePoint: KnowledgePointSchema,
  QuizItem: QuizItemSchema,
  QuizWithKnowledgePoint: QuizWithKnowledgePointSchema,
  KnowledgePointMatchResult: KnowledgePointMatchResultSchema,
  Subject: SubjectSchema,
  PracticeSession: PracticeSessionSchema,
  PracticeHistory: PracticeHistorySchema,
  QuizConfig: QuizConfigSchema,
  KnowledgePointPerformance: KnowledgePointPerformanceSchema,
} as const;
