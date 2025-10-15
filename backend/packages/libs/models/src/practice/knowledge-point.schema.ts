import { z } from 'zod';

/**
 * Represents a single knowledge point extracted from the course table.
 * - `volume`: such as "上册" or "下册"
 * - `unit`: e.g. "第一单元"
 * - `lesson`: e.g. "第1课"
 * - `sub`: sub topic or category (renamed from section)
 * - `topic`: actual knowledge point description
 * - `id`: unique identifier for the knowledge point
 * - `subject_id`: subject identifier (e.g. "history", "biology")
 */
export const KnowledgePointSchema = z.object({
  id: z.string(),
  topic: z.string(),
  volume: z.string(),
  unit: z.string(),
  lesson: z.string(),
  sub: z.string(),
  subject_id: z.string(),
});

export type KnowledgePoint = z.infer<typeof KnowledgePointSchema>;
