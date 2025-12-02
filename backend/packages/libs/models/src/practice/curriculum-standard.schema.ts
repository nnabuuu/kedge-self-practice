import { z } from 'zod';

/**
 * Schema for hierarchy levels stored in JSONB
 * Supports variable depth (level1, level2, level3, ...)
 */
export const HierarchyLevelsSchema = z.record(z.string(), z.string().nullable());

/**
 * Curriculum Standard (课程标准) schema
 * Represents official educational curriculum standards with flexible hierarchy
 */
export const CurriculumStandardSchema = z.object({
  id: z.string().uuid(),
  sequence_number: z.number().int().nullable(),
  grade_level: z.string().min(1),
  subject: z.string().min(1),
  version: z.string().min(1),
  course_content: z.string().min(1),
  type: z.string().min(1),
  hierarchy_levels: HierarchyLevelsSchema,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type CurriculumStandard = z.infer<typeof CurriculumStandardSchema>;

/**
 * Schema for creating a new curriculum standard
 */
export const CurriculumStandardCreateSchema = CurriculumStandardSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CurriculumStandardCreate = z.infer<
  typeof CurriculumStandardCreateSchema
>;

/**
 * Schema for filtering curriculum standards in queries
 */
export const CurriculumStandardFilterSchema = z.object({
  subject: z.string().optional(),
  grade_level: z.string().optional(),
  version: z.string().optional(),
  course_content: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(), // Search across hierarchy levels
});

export type CurriculumStandardFilter = z.infer<
  typeof CurriculumStandardFilterSchema
>;

/**
 * Schema for Excel import data
 */
export const CurriculumStandardImportRowSchema = z.object({
  序号: z.number().int().optional(),
  学段: z.string().min(1),
  学科: z.string().min(1),
  版本: z.string().min(1),
  课程内容: z.string().min(1),
  类型: z.string().min(1),
  层级1: z.string().nullable().optional(),
  层级2: z.string().nullable().optional(),
  层级3: z.string().nullable().optional(),
});

export type CurriculumStandardImportRow = z.infer<
  typeof CurriculumStandardImportRowSchema
>;

/**
 * Schema for import result summary
 */
export const CurriculumStandardImportResultSchema = z.object({
  total_rows: z.number().int(),
  success_count: z.number().int(),
  error_count: z.number().int(),
  skipped_count: z.number().int(),
  errors: z.array(
    z.object({
      row: z.number().int(),
      error: z.string(),
    })
  ),
});

export type CurriculumStandardImportResult = z.infer<
  typeof CurriculumStandardImportResultSchema
>;
