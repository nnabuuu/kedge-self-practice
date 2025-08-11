import { KnowledgePointSchema } from './knowledge-point.schema';
import {
  QuizItemSchema,
  QuizWithKnowledgePointSchema,
  KnowledgePointMatchResultSchema,
} from './quiz.schema';
import { SubjectSchema } from './subject.schema';
import {
  PracticeSessionSchema,
  CreatePracticeSessionSchema,
  PracticeQuestionSchema,
  SubmitAnswerSchema,
  SkipQuestionSchema,
  PauseSessionSchema,
  ResumeSessionSchema,
  CompleteSessionSchema,
  PracticeSessionResponseSchema,
  PracticeStatisticsSchema,
  PracticeHistoryQuerySchema,
  PracticeStrategySchema,
  PracticeSessionStatusSchema,
  BasicStatisticsSchema,
} from './practice-session.schema';

// Knowledge Point exports
export { KnowledgePointSchema, type KnowledgePoint } from './knowledge-point.schema';

// Quiz exports  
export {
  QuizItemSchema,
  type QuizItem,
  QuizWithKnowledgePointSchema,
  type QuizWithKnowledgePoint,
  KnowledgePointMatchResultSchema,
  type KnowledgePointMatchResult,
} from './quiz.schema';

// Subject exports
export { 
  SubjectSchema, 
  type Subject,
  CreateSubjectSchema,
  type CreateSubjectRequest,
  UpdateSubjectSchema,
  type UpdateSubjectRequest,
} from './subject.schema';

// Practice Session exports
export {
  // Main schemas
  PracticeSessionSchema,
  type PracticeSession,
  CreatePracticeSessionSchema,
  type CreatePracticeSession,
  PracticeQuestionSchema,
  type PracticeQuestion,
  
  // Action schemas
  SubmitAnswerSchema,
  type SubmitAnswer,
  SkipQuestionSchema,
  type SkipQuestion,
  PauseSessionSchema,
  ResumeSessionSchema,
  CompleteSessionSchema,
  
  // Response schemas
  PracticeSessionResponseSchema,
  type PracticeSessionResponse,
  PracticeStatisticsSchema,
  type PracticeStatistics,
  PracticeHistoryQuerySchema,
  
  // Enums
  PracticeStrategySchema,
  type PracticeStrategy,
  PracticeSessionStatusSchema,
  type PracticeSessionStatus,
  
  // Statistics
  BasicStatisticsSchema,
  type BasicStatistics,
} from './practice-session.schema';

export const PracticeSchema = {
  KnowledgePoint: KnowledgePointSchema,
  QuizItem: QuizItemSchema,
  QuizWithKnowledgePoint: QuizWithKnowledgePointSchema,
  KnowledgePointMatchResult: KnowledgePointMatchResultSchema,
  Subject: SubjectSchema,
  PracticeSession: PracticeSessionSchema,
  CreatePracticeSession: CreatePracticeSessionSchema,
  PracticeQuestion: PracticeQuestionSchema,
  SubmitAnswer: SubmitAnswerSchema,
  SkipQuestion: SkipQuestionSchema,
  PracticeSessionResponse: PracticeSessionResponseSchema,
  PracticeStatistics: PracticeStatisticsSchema,
  PracticeStrategy: PracticeStrategySchema,
  PracticeSessionStatus: PracticeSessionStatusSchema,
} as const;