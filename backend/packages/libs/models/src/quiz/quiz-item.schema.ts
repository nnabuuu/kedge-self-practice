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
  originalParagraph: z.string().optional(),
  // Tags/keywords for the quiz item
  tags: z.array(z.string()).optional(),
  // Knowledge point ID this quiz is associated with
  knowledge_point_id: z.string().optional(),
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