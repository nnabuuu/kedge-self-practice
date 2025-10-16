import { z } from 'zod';

/**
 * Record mistake schema - for tracking student mistakes
 */
export const RecordMistakeSchema = z.object({
  quiz_id: z.string().uuid(),
  incorrect_answer: z.string(),
  correct_answer: z.string(),
});

export type RecordMistake = z.infer<typeof RecordMistakeSchema>;

/**
 * Record correction schema - for tracking when students correct their mistakes
 */
export const RecordCorrectionSchema = z.object({
  quiz_id: z.string().uuid(),
});

export type RecordCorrection = z.infer<typeof RecordCorrectionSchema>;

/**
 * All practice API related schemas
 */
export const PracticeApiSchemas = {
  RecordMistake: RecordMistakeSchema,
  RecordCorrection: RecordCorrectionSchema,
};
