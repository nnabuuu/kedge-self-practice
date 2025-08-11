import { z } from 'zod';

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Subject = z.infer<typeof SubjectSchema>;

export const CreateSubjectSchema = SubjectSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export type CreateSubjectRequest = z.infer<typeof CreateSubjectSchema>;

export const UpdateSubjectSchema = SubjectSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpdateSubjectRequest = z.infer<typeof UpdateSubjectSchema>;