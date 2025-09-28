import { z } from 'zod';

/**
 * Quiz item types supported by the system
 */
export const QuizTypeSchema = z.enum([
  'single-choice',
  'multiple-choice', 
  'fill-in-the-blank',
  'subjective',
  'other'
]);

export type QuizType = z.infer<typeof QuizTypeSchema>;

/**
 * Core quiz item structure with image support
 */
export const QuizItemSchema = z.object({
  id: z.string().optional(), // Database generated ID
  type: QuizTypeSchema,
  question: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.array(z.number())
  ]).optional(),
  // Image placeholders in the question text (e.g., "{{img:1}}")
  images: z.array(z.string()).optional(),
  // Original paragraph text from which this quiz was extracted
  originalParagraph: z.string().nullable().optional(),
  // Tags/keywords for the quiz item
  tags: z.array(z.string()).optional(),
  // Knowledge point ID this quiz is associated with
  knowledge_point_id: z.string().nullable().optional(),
  // Alternative correct answers for fill-in-the-blank questions
  alternative_answers: z.array(z.string()).optional().default([]),
  // Educational explanation shown when student answers incorrectly
  explanation: z.string().optional().nullable(),
  // Hints for fill-in-the-blank questions (e.g., ["人名", "朝代", null])
  hints: z.array(z.string().nullable()).optional().nullable(),
  // Full knowledge point information (populated when joining with knowledge_points table)
  knowledgePoint: z.object({
    id: z.string(),
    topic: z.string(),
    volume: z.string().optional(),
    unit: z.string().optional(),
    lesson: z.string().optional(),
  }).nullable().optional(),
});

export type QuizItem = z.infer<typeof QuizItemSchema>;

/**
 * Quiz item with processed image attachments
 */
export const QuizItemWithImagesSchema = QuizItemSchema.extend({
  imageAttachments: z.array(z.object({
    id: z.string(),
    url: z.string(),
    placeholder: z.string(), // e.g., "{{img:1}}"
  })).optional(),
});

export type QuizItemWithImages = z.infer<typeof QuizItemWithImagesSchema>;

/**
 * Quiz extraction result from GPT
 */
export const QuizExtractionResultSchema = z.object({
  items: z.array(QuizItemSchema),
});

export type QuizExtractionResult = z.infer<typeof QuizExtractionResultSchema>;