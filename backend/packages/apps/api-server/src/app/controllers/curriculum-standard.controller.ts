import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@kedge/auth';
import { CurriculumStandardService } from '@kedge/knowledge-point';
import {
  CurriculumStandardCreateSchema,
  CurriculumStandardFilterSchema,
  CurriculumStandardImportRowSchema,
  CurriculumStandard,
  CurriculumStandardCreate,
  CurriculumStandardFilter,
  CurriculumStandardImportResult,
} from '@kedge/models';

@ApiTags('Curriculum Standards')
@Controller('v1/curriculum-standards')
export class CurriculumStandardController {
  constructor(
    private readonly curriculumStandardService: CurriculumStandardService
  ) {}

  /**
   * Create a new curriculum standard
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new curriculum standard' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Curriculum standard created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createCurriculumStandard(
    @Body() body: unknown
  ): Promise<CurriculumStandard> {
    const data = CurriculumStandardCreateSchema.parse(body);
    return this.curriculumStandardService.createCurriculumStandard(data);
  }

  /**
   * List curriculum standards with optional filters
   */
  @Get()
  @ApiOperation({ summary: 'List curriculum standards' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of curriculum standards',
  })
  async listCurriculumStandards(
    @Query() query: unknown
  ): Promise<CurriculumStandard[]> {
    const filters = CurriculumStandardFilterSchema.parse(query);
    return this.curriculumStandardService.listCurriculumStandards(filters);
  }

  /**
   * Get curriculum standard by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get curriculum standard by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curriculum standard found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Curriculum standard not found',
  })
  async getCurriculumStandard(
    @Param('id') id: string
  ): Promise<CurriculumStandard> {
    const standard =
      await this.curriculumStandardService.findCurriculumStandardById(id);
    if (!standard) {
      throw new BadRequestException('Curriculum standard not found');
    }
    return standard;
  }

  /**
   * Get quizzes associated with a curriculum standard
   */
  @Get(':id/quizzes')
  @ApiOperation({ summary: 'Get quizzes for curriculum standard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of quizzes',
  })
  async getQuizzesByCurriculumStandard(
    @Param('id') id: string
  ): Promise<any[]> {
    return this.curriculumStandardService.findQuizzesByCurriculumStandardId(
      id
    );
  }

  /**
   * Delete curriculum standard by ID
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete curriculum standard' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Curriculum standard deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Curriculum standard not found',
  })
  async deleteCurriculumStandard(@Param('id') id: string): Promise<void> {
    const deleted =
      await this.curriculumStandardService.deleteCurriculumStandard(id);
    if (!deleted) {
      throw new BadRequestException('Curriculum standard not found');
    }
  }

  /**
   * Import curriculum standards from Excel file
   */
  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import curriculum standards from Excel' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Import completed with summary',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or data',
  })
  async importCurriculumStandards(
    @UploadedFile() file: Express.Multer.File
  ): Promise<CurriculumStandardImportResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Import Excel parsing utility
    const ExcelImportUtility = await import(
      '@kedge/knowledge-point/excel-import'
    );
    const rows = await ExcelImportUtility.parseExcelFile(file.buffer);

    // Validate rows
    const validatedRows = rows.map((row) =>
      CurriculumStandardImportRowSchema.parse(row)
    );

    return this.curriculumStandardService.importCurriculumStandards(
      validatedRows
    );
  }
}
