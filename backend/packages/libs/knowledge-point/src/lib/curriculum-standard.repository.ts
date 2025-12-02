import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql, SqlToken } from 'slonik';
import {
  CurriculumStandardSchema,
  CurriculumStandard,
  CurriculumStandardCreate,
  CurriculumStandardFilter,
} from '@kedge/models';

@Injectable()
export class CurriculumStandardRepository {
  private readonly logger = new Logger(CurriculumStandardRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  /**
   * Create a new curriculum standard
   */
  async createCurriculumStandard(
    data: CurriculumStandardCreate
  ): Promise<CurriculumStandard> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(CurriculumStandardSchema)`
          INSERT INTO kedge_practice.curriculum_standards (
            sequence_number,
            grade_level,
            subject,
            version,
            course_content,
            type,
            hierarchy_levels
          )
          VALUES (
            ${data.sequence_number ?? null},
            ${data.grade_level},
            ${data.subject},
            ${data.version},
            ${data.course_content},
            ${data.type},
            ${sql.json(data.hierarchy_levels)}
          )
          RETURNING
            id,
            sequence_number,
            grade_level,
            subject,
            version,
            course_content,
            type,
            hierarchy_levels,
            created_at,
            updated_at
        `
      );
      return result.rows[0];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating curriculum standard: ${errorMessage}`);
      throw new Error('Failed to create curriculum standard');
    }
  }

  /**
   * Find curriculum standard by ID
   */
  async findCurriculumStandardById(
    id: string
  ): Promise<CurriculumStandard | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(CurriculumStandardSchema)`
          SELECT
            id,
            sequence_number,
            grade_level,
            subject,
            version,
            course_content,
            type,
            hierarchy_levels,
            created_at,
            updated_at
          FROM kedge_practice.curriculum_standards
          WHERE id = ${id}
        `
      );
      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error finding curriculum standard by id: ${errorMessage}`
      );
      throw new Error('Failed to find curriculum standard');
    }
  }

  /**
   * List curriculum standards with optional filters
   */
  async listCurriculumStandards(
    filters: CurriculumStandardFilter = {}
  ): Promise<CurriculumStandard[]> {
    try {
      const conditions: SqlToken[] = [];

      if (filters.subject) {
        conditions.push(sql.fragment`subject = ${filters.subject}`);
      }
      if (filters.grade_level) {
        conditions.push(sql.fragment`grade_level = ${filters.grade_level}`);
      }
      if (filters.version) {
        conditions.push(sql.fragment`version = ${filters.version}`);
      }
      if (filters.course_content) {
        conditions.push(
          sql.fragment`course_content = ${filters.course_content}`
        );
      }
      if (filters.type) {
        conditions.push(sql.fragment`type = ${filters.type}`);
      }
      if (filters.search) {
        // Search across hierarchy levels using JSONB text search
        conditions.push(
          sql.fragment`hierarchy_levels::text ILIKE ${`%${filters.search}%`}`
        );
      }

      const whereClause =
        conditions.length > 0
          ? sql.fragment`WHERE ${sql.join(conditions, sql.fragment` AND `)}`
          : sql.fragment``;

      const result = await this.persistentService.pgPool.query(
        sql.type(CurriculumStandardSchema)`
          SELECT
            id,
            sequence_number,
            grade_level,
            subject,
            version,
            course_content,
            type,
            hierarchy_levels,
            created_at,
            updated_at
          FROM kedge_practice.curriculum_standards
          ${whereClause}
          ORDER BY sequence_number ASC NULLS LAST, created_at ASC
        `
      );
      return [...result.rows];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error listing curriculum standards: ${errorMessage}`
      );
      throw new Error('Failed to list curriculum standards');
    }
  }

  /**
   * Find quizzes associated with a curriculum standard
   */
  async findQuizzesByCurriculumStandardId(id: string): Promise<any[]> {
    try {
      const result = await this.persistentService.pgPool.query(sql.unsafe`
          SELECT
            id,
            type,
            question,
            options,
            answer,
            original_paragraph,
            curriculum_standard_id
          FROM kedge_practice.quizzes
          WHERE curriculum_standard_id = ${id}
        `);
      return [...result.rows];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error finding quizzes by curriculum standard: ${errorMessage}`
      );
      throw new Error('Failed to find quizzes');
    }
  }

  /**
   * Delete curriculum standard by ID
   * Note: Foreign key constraint will set quiz references to NULL
   */
  async deleteCurriculumStandard(id: string): Promise<boolean> {
    try {
      const result = await this.persistentService.pgPool.query(sql.unsafe`
          DELETE FROM kedge_practice.curriculum_standards
          WHERE id = ${id}
        `);
      return result.rowCount > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error deleting curriculum standard: ${errorMessage}`
      );
      throw new Error('Failed to delete curriculum standard');
    }
  }

  /**
   * Check if a curriculum standard with same data already exists
   * Used for duplicate detection during import
   */
  async findDuplicate(
    data: CurriculumStandardCreate
  ): Promise<CurriculumStandard | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(CurriculumStandardSchema)`
          SELECT
            id,
            sequence_number,
            grade_level,
            subject,
            version,
            course_content,
            type,
            hierarchy_levels,
            created_at,
            updated_at
          FROM kedge_practice.curriculum_standards
          WHERE
            subject = ${data.subject}
            AND version = ${data.version}
            AND grade_level = ${data.grade_level}
            AND course_content = ${data.course_content}
            AND type = ${data.type}
            AND hierarchy_levels = ${sql.json(data.hierarchy_levels)}
          LIMIT 1
        `
      );
      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding duplicate: ${errorMessage}`);
      throw new Error('Failed to find duplicate');
    }
  }
}
