import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import {
  QuizReport,
  QuizReportWithRelations,
  QuizReportSummary,
  ReportAnalytics,
  SubmitQuizReportDto,
  UpdateQuizReportDto,
  UpdateReportStatusDto,
  BulkUpdateReportsDto,
  GetReportsQueryDto,
  ReportStatus,
  ReportType
} from '@kedge/models';

@Injectable()
export class QuizReportService {
  private readonly logger = new Logger(QuizReportService.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * Submit a new report for a quiz
   */
  async submitReport(userId: string, data: SubmitQuizReportDto): Promise<QuizReport> {
    this.logger.log(`User ${userId} submitting report for quiz ${data.quiz_id}`);

    try {
      const result = await this.persistentService.pgPool.query(sql.unsafe`
        INSERT INTO kedge_practice.quiz_reports (
          quiz_id,
          user_id,
          session_id,
          report_type,
          reason,
          user_answer,
          quiz_context
        ) VALUES (
          ${data.quiz_id}::uuid,
          ${userId}::uuid,
          ${data.session_id || null}::uuid,
          ${data.report_type},
          ${data.reason || null},
          ${data.user_answer || null},
          ${data.quiz_context ? JSON.stringify(data.quiz_context) : null}::jsonb
        )
        ON CONFLICT (user_id, quiz_id, report_type) 
        WHERE status != 'dismissed'
        DO UPDATE SET
          reason = EXCLUDED.reason,
          user_answer = EXCLUDED.user_answer,
          quiz_context = EXCLUDED.quiz_context,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `);

      const report = result.rows[0] as QuizReport;
      this.logger.log(`Report submitted successfully with ID: ${report.id}`);
      
      // Refresh materialized view asynchronously
      this.refreshReportSummary().catch(err => 
        this.logger.error('Failed to refresh report summary', err)
      );

      return report;
    } catch (error) {
      this.logger.error('Failed to submit report', error);
      throw error;
    }
  }

  /**
   * Get user's own reports
   */
  async getUserReports(userId: string, query: GetReportsQueryDto): Promise<QuizReportWithRelations[]> {
    const conditions = [sql.unsafe`r.user_id = ${userId}::uuid`];
    
    if (query.status) {
      conditions.push(sql.unsafe`r.status = ${query.status}`);
    }
    
    if (query.report_type) {
      conditions.push(sql.unsafe`r.report_type = ${query.report_type}`);
    }

    const whereClause = conditions.length > 0 
      ? sql.unsafe`WHERE ${sql.join(conditions, sql.unsafe` AND `)}`
      : sql.unsafe``;

    const orderBy = query.sort === 'report_count' 
      ? sql.unsafe`ORDER BY r.created_at ${query.order === 'asc' ? sql.unsafe`ASC` : sql.unsafe`DESC`}`
      : sql.unsafe`ORDER BY r.created_at DESC`;

    const result = await this.persistentService.pgPool.query(sql.unsafe`
      SELECT 
        r.*,
        json_build_object(
          'id', q.id,
          'question', q.question,
          'type', q.type,
          'knowledge_point_id', q.knowledge_point_id
        ) as quiz,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'class', u.class
        ) as reporter,
        CASE 
          WHEN r.resolved_by IS NOT NULL THEN
            json_build_object(
              'id', resolver.id,
              'name', resolver.name
            )
          ELSE NULL
        END as resolver
      FROM kedge_practice.quiz_reports r
      JOIN kedge_practice.quizzes q ON r.quiz_id = q.id
      JOIN kedge_practice.users u ON r.user_id = u.id
      LEFT JOIN kedge_practice.users resolver ON r.resolved_by = resolver.id
      ${whereClause}
      ${orderBy}
      LIMIT ${query.limit}
      OFFSET ${query.offset}
    `);

    return result.rows as QuizReportWithRelations[];
  }

  /**
   * Update user's own report
   */
  async updateUserReport(
    userId: string, 
    reportId: string, 
    data: UpdateQuizReportDto
  ): Promise<QuizReport> {
    const updates = [];
    
    if (data.reason !== undefined) {
      updates.push(sql.unsafe`reason = ${data.reason || null}`);
    }
    
    if (data.report_type !== undefined) {
      updates.push(sql.unsafe`report_type = ${data.report_type}`);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await this.persistentService.pgPool.query(sql.unsafe`
      UPDATE kedge_practice.quiz_reports
      SET ${sql.join(updates, sql.unsafe`, `)}
      WHERE id = ${reportId}::uuid
        AND user_id = ${userId}::uuid
        AND status = 'pending'
      RETURNING *
    `);

    if (result.rows.length === 0) {
      throw new Error('Report not found or cannot be updated');
    }

    return result.rows[0] as QuizReport;
  }

  /**
   * Get reports for teachers/admins (grouped by quiz)
   */
  async getReportsForManagement(query: GetReportsQueryDto): Promise<{
    quizzes: Array<{
      quiz_id: string;
      question: string;
      quiz_type: string;
      knowledge_point?: any;
      report_summary: QuizReportSummary;
      reports: QuizReportWithRelations[];
    }>;
    total: number;
  }> {
    // Get aggregated quiz report data
    const summaryConditions: any[] = [];
    const havingConditions: any[] = [];
    
    // Status filter should be in HAVING clause since we're grouping
    if (query.status) {
      havingConditions.push(sql.unsafe`COUNT(CASE WHEN r.status = ${query.status} THEN 1 END) > 0`);
    }
    
    // Report type filter should also be in HAVING clause
    if (query.report_type) {
      havingConditions.push(sql.unsafe`COUNT(CASE WHEN r.report_type = ${query.report_type} THEN 1 END) > 0`);
    }

    const summaryWhere = summaryConditions.length > 0
      ? sql.unsafe`WHERE ${sql.join(summaryConditions, sql.unsafe` AND `)}`
      : sql.unsafe``;
    
    const havingClause = havingConditions.length > 0
      ? sql.unsafe`HAVING ${sql.join(havingConditions, sql.unsafe` AND `)}`
      : sql.unsafe``;

    const orderByClause = query.sort === 'report_count'
      ? sql.unsafe`ORDER BY total_reports DESC`
      : query.sort === 'pending_count'
      ? sql.unsafe`ORDER BY pending_count DESC`
      : sql.unsafe`ORDER BY last_reported_at DESC`;

    const summaryResult = await this.persistentService.pgPool.query(sql.unsafe`
      WITH report_summary AS (
        SELECT 
          q.id as quiz_id,
          q.question,
          q.type as quiz_type,
          q.knowledge_point_id,
          COUNT(DISTINCT r.id) as total_reports,
          COUNT(DISTINCT r.user_id) as unique_reporters,
          COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_count,
          ARRAY_AGG(DISTINCT r.report_type) as report_types,
          MAX(r.created_at) as last_reported_at,
          MAX(r.resolved_at) as last_resolved_at
        FROM kedge_practice.quizzes q
        INNER JOIN kedge_practice.quiz_reports r ON q.id = r.quiz_id
        ${summaryWhere}
        GROUP BY q.id, q.question, q.type, q.knowledge_point_id
        ${havingClause}
      )
      SELECT 
        rs.*,
        kp.topic as knowledge_point_topic,
        kp.volume as knowledge_point_volume,
        kp.unit as knowledge_point_unit
      FROM report_summary rs
      LEFT JOIN kedge_practice.knowledge_points kp ON rs.knowledge_point_id = kp.id
      ${orderByClause}
      LIMIT ${query.limit}
      OFFSET ${query.offset}
    `);

    // Get total count - need to match the same filtering logic
    const countConditions: any[] = [];
    if (query.status) {
      countConditions.push(sql.unsafe`status = ${query.status}`);
    }
    if (query.report_type) {
      countConditions.push(sql.unsafe`report_type = ${query.report_type}`);
    }
    
    const countWhere = countConditions.length > 0
      ? sql.unsafe`WHERE ${sql.join(countConditions, sql.unsafe` AND `)}`
      : sql.unsafe``;
    
    const countResult = await this.persistentService.pgPool.query(sql.unsafe`
      SELECT COUNT(DISTINCT quiz_id) as count
      FROM kedge_practice.quiz_reports
      ${countWhere}
    `);

    // Get detailed reports for each quiz
    const quizzesWithReports = await Promise.all(
      (summaryResult.rows as any[]).map(async (summary) => {
        const reportsResult = await this.persistentService.pgPool.query(sql.unsafe`
          SELECT 
            r.*,
            json_build_object(
              'id', u.id,
              'name', u.name,
              'class', u.class
            ) as reporter,
            CASE 
              WHEN r.resolved_by IS NOT NULL THEN
                json_build_object(
                  'id', resolver.id,
                  'name', resolver.name
                )
              ELSE NULL
            END as resolver
          FROM kedge_practice.quiz_reports r
          JOIN kedge_practice.users u ON r.user_id = u.id
          LEFT JOIN kedge_practice.users resolver ON r.resolved_by = resolver.id
          WHERE r.quiz_id = ${summary.quiz_id}::uuid
          ${query.status ? sql.unsafe`AND r.status = ${query.status}` : sql.unsafe``}
          ORDER BY r.created_at DESC
          LIMIT 10
        `);

        return {
          quiz_id: summary.quiz_id,
          question: summary.question,
          quiz_type: summary.quiz_type,
          knowledge_point: summary.knowledge_point_id ? {
            id: summary.knowledge_point_id,
            topic: summary.knowledge_point_topic,
            subject: summary.knowledge_point_subject
          } : null,
          report_summary: {
            quiz_id: summary.quiz_id,
            question: summary.question,
            quiz_type: summary.quiz_type,
            knowledge_point_id: summary.knowledge_point_id,
            total_reports: parseInt(summary.total_reports),
            unique_reporters: parseInt(summary.unique_reporters),
            pending_count: parseInt(summary.pending_count),
            resolved_count: parseInt(summary.resolved_count),
            report_types: summary.report_types,
            last_reported_at: summary.last_reported_at,
            last_resolved_at: summary.last_resolved_at
          },
          reports: reportsResult.rows as QuizReportWithRelations[]
        };
      })
    );

    const countRow = countResult.rows[0] as { count: string };
    return {
      quizzes: quizzesWithReports,
      total: parseInt(countRow.count)
    };
  }

  /**
   * Update report status (for teachers/admins)
   */
  async updateReportStatus(
    reportId: string,
    userId: string,
    data: UpdateReportStatusDto
  ): Promise<QuizReport> {
    const result = await this.persistentService.pgPool.query(sql.unsafe`
      UPDATE kedge_practice.quiz_reports
      SET 
        status = ${data.status},
        resolved_by = ${data.status === 'resolved' || data.status === 'dismissed' ? userId : null}::uuid,
        resolved_at = ${data.status === 'resolved' || data.status === 'dismissed' ? sql.unsafe`CURRENT_TIMESTAMP` : null},
        resolution_note = ${data.resolution_note || null}
      WHERE id = ${reportId}::uuid
      RETURNING *
    `);

    if (result.rows.length === 0) {
      throw new Error('Report not found');
    }

    // Refresh materialized view asynchronously
    this.refreshReportSummary().catch(err => 
      this.logger.error('Failed to refresh report summary', err)
    );

    return result.rows[0] as QuizReport;
  }

  /**
   * Bulk update reports (for teachers/admins)
   */
  async bulkUpdateReports(
    userId: string,
    data: BulkUpdateReportsDto
  ): Promise<{ updated_count: number }> {
    const conditions = [];
    
    if (data.quiz_id) {
      conditions.push(sql.unsafe`quiz_id = ${data.quiz_id}::uuid`);
    }
    
    if (data.report_ids && data.report_ids.length > 0) {
      const ids = data.report_ids.map(id => sql.unsafe`${id}::uuid`);
      conditions.push(sql.unsafe`id = ANY(ARRAY[${sql.join(ids, sql.unsafe`, `)}])`);
    }

    if (conditions.length === 0) {
      throw new Error('Must specify either quiz_id or report_ids');
    }

    const result = await this.persistentService.pgPool.query(sql.unsafe`
      WITH updated AS (
        UPDATE kedge_practice.quiz_reports
        SET 
          status = ${data.status},
          resolved_by = ${data.status === 'resolved' || data.status === 'dismissed' ? userId : null}::uuid,
          resolved_at = ${data.status === 'resolved' || data.status === 'dismissed' ? sql.unsafe`CURRENT_TIMESTAMP` : null},
          resolution_note = ${data.resolution_note || null}
        WHERE ${sql.join(conditions, sql.unsafe` AND `)}
        RETURNING 1
      )
      SELECT COUNT(*) as count FROM updated
    `);

    // Refresh materialized view asynchronously
    this.refreshReportSummary().catch(err => 
      this.logger.error('Failed to refresh report summary', err)
    );

    const countRow = result.rows[0] as { count: string };
    return { updated_count: parseInt(countRow.count) };
  }

  /**
   * Get report analytics
   */
  async getReportAnalytics(period?: string): Promise<ReportAnalytics> {
    const periodCondition = period 
      ? sql.unsafe`WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${period}'`
      : sql.unsafe``;

    // Get summary stats
    const summaryResult = await this.persistentService.pgPool.query(sql.unsafe`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
        COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_reports,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours
      FROM kedge_practice.quiz_reports
      ${periodCondition}
    `);

    // Get reports by type
    const byTypeResult = await this.persistentService.pgPool.query(sql.unsafe`
      SELECT report_type, COUNT(*) as count
      FROM kedge_practice.quiz_reports
      ${periodCondition}
      GROUP BY report_type
    `);

    // Get top reporters
    const topReportersResult = await this.persistentService.pgPool.query(sql.unsafe`
      SELECT 
        r.user_id,
        u.name,
        COUNT(*) as report_count
      FROM kedge_practice.quiz_reports r
      JOIN kedge_practice.users u ON r.user_id = u.id
      ${periodCondition}
      GROUP BY r.user_id, u.name
      ORDER BY report_count DESC
      LIMIT 10
    `);

    // Get resolution stats
    const resolutionStatsResult = await this.persistentService.pgPool.query(sql.unsafe`
      SELECT 
        r.resolved_by as id,
        u.name,
        COUNT(*) as resolved_count
      FROM kedge_practice.quiz_reports r
      JOIN kedge_practice.users u ON r.resolved_by = u.id
      WHERE r.status IN ('resolved', 'dismissed')
      ${period ? sql.unsafe`AND r.resolved_at >= CURRENT_TIMESTAMP - INTERVAL '${period}'` : sql.unsafe``}
      GROUP BY r.resolved_by, u.name
      ORDER BY resolved_count DESC
    `);

    const summary = summaryResult.rows[0] as any;
    const byType: Record<ReportType, number> = {} as any;
    (byTypeResult.rows as any[]).forEach(row => {
      byType[row.report_type as ReportType] = parseInt(row.count);
    });

    // Find most reported type
    let mostReportedType: ReportType | undefined;
    let maxCount = 0;
    for (const [type, count] of Object.entries(byType)) {
      if (count > maxCount) {
        maxCount = count;
        mostReportedType = type as ReportType;
      }
    }

    return {
      summary: {
        total_reports: parseInt(summary.total_reports),
        pending_reports: parseInt(summary.pending_reports),
        resolved_reports: parseInt(summary.resolved_reports),
        dismissed_reports: parseInt(summary.dismissed_reports),
        avg_resolution_time: summary.avg_resolution_hours 
          ? `${Math.round(summary.avg_resolution_hours)} hours`
          : undefined,
        most_reported_type: mostReportedType
      },
      by_type: byType,
      top_reporters: (topReportersResult.rows as any[]).map((row) => ({
        user_id: row.user_id,
        name: row.name,
        report_count: parseInt(row.report_count)
      })),
      resolution_stats: {
        teachers: (resolutionStatsResult.rows as any[]).map((row) => ({
          id: row.id,
          name: row.name,
          resolved_count: parseInt(row.resolved_count)
        }))
      }
    };
  }

  /**
   * Refresh materialized view
   */
  private async refreshReportSummary(): Promise<void> {
    try {
      await this.persistentService.pgPool.query(sql.unsafe`
        REFRESH MATERIALIZED VIEW CONCURRENTLY kedge_practice.quiz_report_summary
      `);
    } catch (error) {
      // Ignore errors as this is optional optimization
      this.logger.warn('Failed to refresh materialized view', error);
    }
  }
}