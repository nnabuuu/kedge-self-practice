import { Injectable, Logger } from '@nestjs/common';
import { CurriculumStandardRepository } from './curriculum-standard.repository';
import {
  CurriculumStandard,
  CurriculumStandardCreate,
  CurriculumStandardFilter,
  CurriculumStandardImportRow,
  CurriculumStandardImportResult,
} from '@kedge/models';

@Injectable()
export class CurriculumStandardService {
  private readonly logger = new Logger(CurriculumStandardService.name);

  constructor(
    private readonly curriculumStandardRepository: CurriculumStandardRepository
  ) {}

  /**
   * Create a new curriculum standard
   */
  async createCurriculumStandard(
    data: CurriculumStandardCreate
  ): Promise<CurriculumStandard> {
    this.logger.log(
      `Creating curriculum standard: ${data.subject} - ${data.course_content}`
    );
    return this.curriculumStandardRepository.createCurriculumStandard(data);
  }

  /**
   * Find curriculum standard by ID
   */
  async findCurriculumStandardById(
    id: string
  ): Promise<CurriculumStandard | null> {
    return this.curriculumStandardRepository.findCurriculumStandardById(id);
  }

  /**
   * List curriculum standards with filters
   */
  async listCurriculumStandards(
    filters: CurriculumStandardFilter = {}
  ): Promise<CurriculumStandard[]> {
    return this.curriculumStandardRepository.listCurriculumStandards(filters);
  }

  /**
   * Find quizzes associated with a curriculum standard
   */
  async findQuizzesByCurriculumStandardId(id: string): Promise<any[]> {
    return this.curriculumStandardRepository.findQuizzesByCurriculumStandardId(
      id
    );
  }

  /**
   * Delete curriculum standard by ID
   */
  async deleteCurriculumStandard(id: string): Promise<boolean> {
    this.logger.log(`Deleting curriculum standard: ${id}`);
    return this.curriculumStandardRepository.deleteCurriculumStandard(id);
  }

  /**
   * Import curriculum standards from Excel data
   */
  async importCurriculumStandards(
    rows: CurriculumStandardImportRow[]
  ): Promise<CurriculumStandardImportResult> {
    this.logger.log(`Importing ${rows.length} curriculum standard rows`);

    const result: CurriculumStandardImportResult = {
      total_rows: rows.length,
      success_count: 0,
      error_count: 0,
      skipped_count: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Excel rows start at 1, plus header row

      try {
        // Build hierarchy levels object
        const hierarchy_levels: Record<string, string | null> = {};
        if (row.层级1) hierarchy_levels['level1'] = row.层级1;
        if (row.层级2) hierarchy_levels['level2'] = row.层级2;
        if (row.层级3) hierarchy_levels['level3'] = row.层级3;

        // Create curriculum standard data
        const data: CurriculumStandardCreate = {
          sequence_number: row.序号 ?? null,
          grade_level: row.学段,
          subject: row.学科,
          version: row.版本,
          course_content: row.课程内容,
          type: row.类型,
          hierarchy_levels,
        };

        // Check for duplicates
        const duplicate =
          await this.curriculumStandardRepository.findDuplicate(data);
        if (duplicate) {
          this.logger.log(`Skipping duplicate row ${rowNumber}`);
          result.skipped_count++;
          continue;
        }

        // Create curriculum standard
        await this.curriculumStandardRepository.createCurriculumStandard(data);
        result.success_count++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(`Error importing row ${rowNumber}: ${errorMessage}`);
        result.error_count++;
        result.errors.push({
          row: rowNumber,
          error: errorMessage,
        });
      }
    }

    this.logger.log(
      `Import complete: ${result.success_count} created, ${result.skipped_count} skipped, ${result.error_count} errors`
    );
    return result;
  }
}
