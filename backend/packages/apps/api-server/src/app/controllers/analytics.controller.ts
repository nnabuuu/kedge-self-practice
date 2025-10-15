import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { AnalyticsService } from '@kedge/practice';
import { z } from 'zod';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

// Validation schemas
const TimeFrameSchema = z.enum(['7d', '30d', '3m', '6m', 'all']);
const QuizErrorRatesQuerySchema = z.object({
  subjectId: z.string().min(1), // Accept string identifiers like 'history', 'biology'
  knowledgePointId: z.string().uuid().optional(),
  timeFrame: TimeFrameSchema,
  minAttempts: z.coerce.number().int().min(1).default(5),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const QuizErrorDetailsQuerySchema = z.object({
  timeFrame: TimeFrameSchema,
});

const ExportErrorRatesQuerySchema = z.object({
  subjectId: z.string().min(1), // Accept string identifiers like 'history', 'biology'
  knowledgePointId: z.string().uuid().optional(),
  timeFrame: TimeFrameSchema,
  minAttempts: z.coerce.number().int().min(1).default(5),
});

type QuizErrorRatesQuery = z.infer<typeof QuizErrorRatesQuerySchema>;
type QuizErrorDetailsQuery = z.infer<typeof QuizErrorDetailsQuerySchema>;
type ExportErrorRatesQuery = z.infer<typeof ExportErrorRatesQuerySchema>;

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('quiz-error-rates')
  @ApiOperation({
    summary: 'Get quiz error rates with filtering and pagination',
    description: 'Returns quizzes ordered by error rate (highest first) with filtering options for subject, knowledge point, time frame, and minimum attempts threshold.'
  })
  @ApiQuery({ name: 'subjectId', required: true, description: 'Subject ID (e.g., "history", "biology") to filter quizzes' })
  @ApiQuery({ name: 'knowledgePointId', required: false, description: 'Optional knowledge point UUID to narrow down results' })
  @ApiQuery({ name: 'timeFrame', required: true, enum: ['7d', '30d', '3m', '6m', 'all'], description: 'Time frame for analytics' })
  @ApiQuery({ name: 'minAttempts', required: false, type: Number, description: 'Minimum number of attempts required (default: 5)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Error rates retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quiz_id: { type: 'string' },
              quiz_text: { type: 'string' },
              quiz_type: { type: 'string' },
              correct_answer: { type: 'string' },
              knowledge_point_id: { type: 'string', nullable: true },
              knowledge_point_name: { type: 'string', nullable: true },
              total_attempts: { type: 'number' },
              incorrect_attempts: { type: 'number' },
              error_rate: { type: 'number' },
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            total_questions: { type: 'number' },
            avg_error_rate: { type: 'number' },
            high_error_count: { type: 'number' },
            total_attempts: { type: 'number' },
          }
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            pageSize: { type: 'number' },
            totalPages: { type: 'number' },
            totalCount: { type: 'number' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getQuizErrorRates(
    @Query('subjectId') subjectId: string,
    @Query('knowledgePointId') knowledgePointId?: string,
    @Query('timeFrame') timeFrame?: string,
    @Query('minAttempts') minAttempts?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    try {
      // Validate query parameters
      const validatedQuery = QuizErrorRatesQuerySchema.parse({
        subjectId,
        knowledgePointId,
        timeFrame,
        minAttempts,
        page,
        pageSize,
      });

      const result = await this.analyticsService.getQuizErrorRates({
        subjectId: validatedQuery.subjectId,
        knowledgePointId: validatedQuery.knowledgePointId,
        timeFrame: validatedQuery.timeFrame,
        minAttempts: validatedQuery.minAttempts,
        page: validatedQuery.page,
        pageSize: validatedQuery.pageSize,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Invalid query parameters',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get quiz error rates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('quiz/:quizId/error-details')
  @ApiOperation({
    summary: 'Get detailed error analysis for a specific quiz',
    description: 'Returns comprehensive error analysis including quiz details, statistics, and wrong answer distribution.'
  })
  @ApiQuery({ name: 'timeFrame', required: true, enum: ['7d', '30d', '3m', '6m', 'all'], description: 'Time frame for analytics' })
  @ApiResponse({
    status: 200,
    description: 'Quiz error details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        quiz: {
          type: 'object',
          properties: {
            quiz_id: { type: 'string' },
            question: { type: 'string' },
            type: { type: 'string' },
            correct_answer: { type: 'string' },
            options: { type: 'object', nullable: true },
            knowledge_point: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              }
            },
            total_attempts: { type: 'number' },
            correct_count: { type: 'number' },
            incorrect_count: { type: 'number' },
            error_rate: { type: 'number' },
          }
        },
        wrongAnswerDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              count: { type: 'number' },
              percentage: { type: 'number' },
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 404, description: 'Quiz not found or has no attempt data' })
  async getQuizErrorDetails(
    @Param('quizId') quizId: string,
    @Query('timeFrame') timeFrame?: string,
  ) {
    try {
      // Validate UUID format
      const uuidSchema = z.string().uuid();
      uuidSchema.parse(quizId);

      // Validate query parameters
      const validatedQuery = QuizErrorDetailsQuerySchema.parse({
        timeFrame,
      });

      const result = await this.analyticsService.getQuizErrorDetails({
        quizId,
        timeFrame: validatedQuery.timeFrame,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Invalid parameters',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get quiz error details',
        error instanceof Error && error.message.includes('not found')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('quiz-error-rates/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({
    summary: 'Export quiz error rates to CSV',
    description: 'Downloads all quiz error rates as a CSV file with the specified filters.'
  })
  @ApiQuery({ name: 'subjectId', required: true, description: 'Subject ID (e.g., "history", "biology") to filter quizzes' })
  @ApiQuery({ name: 'knowledgePointId', required: false, description: 'Optional knowledge point UUID to narrow down results' })
  @ApiQuery({ name: 'timeFrame', required: true, enum: ['7d', '30d', '3m', '6m', 'all'], description: 'Time frame for analytics' })
  @ApiQuery({ name: 'minAttempts', required: false, type: Number, description: 'Minimum number of attempts required (default: 5)' })
  @ApiResponse({
    status: 200,
    description: 'CSV file downloaded successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async exportQuizErrorRates(
    @Query('subjectId') subjectId: string,
    @Query('knowledgePointId') knowledgePointId?: string,
    @Query('timeFrame') timeFrame?: string,
    @Query('minAttempts') minAttempts?: string,
  ): Promise<string> {
    try {
      // Validate query parameters
      const validatedQuery = ExportErrorRatesQuerySchema.parse({
        subjectId,
        knowledgePointId,
        timeFrame,
        minAttempts,
      });

      const csv = await this.analyticsService.exportErrorRatesToCSV({
        subjectId: validatedQuery.subjectId,
        knowledgePointId: validatedQuery.knowledgePointId,
        timeFrame: validatedQuery.timeFrame,
        minAttempts: validatedQuery.minAttempts,
      });

      // Add BOM for Excel UTF-8 support
      return '\uFEFF' + csv;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Invalid query parameters',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to export quiz error rates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
