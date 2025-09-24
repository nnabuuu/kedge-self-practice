import { z } from 'zod';

// Report type enum
export const ReportTypeSchema = z.enum([
  'display_error',
  'wrong_answer',
  'wrong_association',
  'duplicate',
  'unclear_wording',
  'other'
]);

export type ReportType = z.infer<typeof ReportTypeSchema>;

// Report status enum
export const ReportStatusSchema = z.enum([
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
]);

export type ReportStatus = z.infer<typeof ReportStatusSchema>;

// Submit report request
export const SubmitQuizReportSchema = z.object({
  quiz_id: z.string().uuid(),
  report_type: ReportTypeSchema,
  reason: z.string().max(500).optional(),
  user_answer: z.string().optional(),
  session_id: z.string().uuid().optional(),
  quiz_context: z.record(z.any()).optional()
});

export type SubmitQuizReportDto = z.infer<typeof SubmitQuizReportSchema>;

// Update report request (for students to modify their reports)
export const UpdateQuizReportSchema = z.object({
  reason: z.string().max(500).optional(),
  report_type: ReportTypeSchema.optional()
});

export type UpdateQuizReportDto = z.infer<typeof UpdateQuizReportSchema>;

// Update report status request (for teachers/admins)
export const UpdateReportStatusSchema = z.object({
  status: ReportStatusSchema,
  resolution_note: z.string().optional()
});

export type UpdateReportStatusDto = z.infer<typeof UpdateReportStatusSchema>;

// Bulk update reports request
export const BulkUpdateReportsSchema = z.object({
  quiz_id: z.string().uuid().optional(),
  report_ids: z.array(z.string().uuid()).optional(),
  status: ReportStatusSchema,
  resolution_note: z.string().optional()
});

export type BulkUpdateReportsDto = z.infer<typeof BulkUpdateReportsSchema>;

// Query filters
export const GetReportsQuerySchema = z.object({
  status: ReportStatusSchema.optional(),
  report_type: ReportTypeSchema.optional(),
  quiz_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  sort: z.enum(['created_at', 'report_count', 'pending_count']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
});

export type GetReportsQueryDto = z.infer<typeof GetReportsQuerySchema>;

// Report entity
export interface QuizReport {
  id: string;
  quiz_id: string;
  user_id: string;
  session_id?: string;
  report_type: ReportType;
  reason?: string;
  user_answer?: string;
  quiz_context?: Record<string, any>;
  status: ReportStatus;
  resolved_by?: string;
  resolved_at?: Date;
  resolution_note?: string;
  created_at: Date;
  updated_at: Date;
}

// Report with relations
export interface QuizReportWithRelations extends QuizReport {
  quiz?: {
    id: string;
    question: string;
    type: string;
    knowledge_point_id?: string;
  };
  reporter?: {
    id: string;
    name: string;
    class?: string;
  };
  resolver?: {
    id: string;
    name: string;
  };
}

// Report summary
export interface QuizReportSummary {
  quiz_id: string;
  question: string;
  quiz_type: string;
  knowledge_point_id?: string;
  total_reports: number;
  unique_reporters: number;
  pending_count: number;
  resolved_count: number;
  report_types: ReportType[];
  last_reported_at: Date;
  last_resolved_at?: Date;
}

// Report analytics
export interface ReportAnalytics {
  summary: {
    total_reports: number;
    pending_reports: number;
    resolved_reports: number;
    dismissed_reports: number;
    avg_resolution_time?: string;
    most_reported_type?: ReportType;
  };
  by_type: Record<ReportType, number>;
  by_subject?: Record<string, number>;
  top_reporters?: Array<{
    user_id: string;
    name: string;
    report_count: number;
  }>;
  resolution_stats?: {
    teachers: Array<{
      id: string;
      name: string;
      resolved_count: number;
    }>;
  };
}