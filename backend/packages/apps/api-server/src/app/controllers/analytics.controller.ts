import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Header,
  Request,
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
  volume: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
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
  volume: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  timeFrame: TimeFrameSchema,
  minAttempts: z.coerce.number().int().min(1).default(5),
});

type QuizErrorRatesQuery = z.infer<typeof QuizErrorRatesQuerySchema>;
type QuizErrorDetailsQuery = z.infer<typeof QuizErrorDetailsQuerySchema>;
type ExportErrorRatesQuery = z.infer<typeof ExportErrorRatesQuerySchema>;

// Validation schema for quiz performance comparison
const QuizPerformanceComparisonQuerySchema = z.object({
  sessionId: z.string().uuid(),
});

type QuizPerformanceComparisonQuery = z.infer<typeof QuizPerformanceComparisonQuerySchema>;

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('quiz-error-rates')
  @ApiOperation({
    summary: 'Get quiz error rates with filtering and pagination',
    description: 'Returns quizzes ordered by error rate (highest first) with filtering options for subject, volume, unit, time frame, and minimum attempts threshold.'
  })
  @ApiQuery({ name: 'subjectId', required: true, description: 'Subject ID (e.g., "history", "biology") to filter quizzes' })
  @ApiQuery({ name: 'knowledgePointId', required: false, description: 'Optional knowledge point UUID to narrow down results' })
  @ApiQuery({ name: 'volume', required: false, description: 'Optional volume (册别) to filter by' })
  @ApiQuery({ name: 'unit', required: false, description: 'Optional unit (单元) to filter by' })
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
    @Query('volume') volume?: string,
    @Query('unit') unit?: string,
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
        volume,
        unit,
        timeFrame,
        minAttempts,
        page,
        pageSize,
      });

      const result = await this.analyticsService.getQuizErrorRates({
        subjectId: validatedQuery.subjectId,
        knowledgePointId: validatedQuery.knowledgePointId,
        volume: validatedQuery.volume,
        unit: validatedQuery.unit,
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
  @ApiQuery({ name: 'volume', required: false, description: 'Optional volume (册别) to filter by' })
  @ApiQuery({ name: 'unit', required: false, description: 'Optional unit (单元) to filter by' })
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
    @Query('volume') volume?: string,
    @Query('unit') unit?: string,
    @Query('timeFrame') timeFrame?: string,
    @Query('minAttempts') minAttempts?: string,
  ): Promise<string> {
    try {
      // Validate query parameters
      const validatedQuery = ExportErrorRatesQuerySchema.parse({
        subjectId,
        knowledgePointId,
        volume,
        unit,
        timeFrame,
        minAttempts,
      });

      const csv = await this.analyticsService.exportErrorRatesToCSV({
        subjectId: validatedQuery.subjectId,
        knowledgePointId: validatedQuery.knowledgePointId,
        volume: validatedQuery.volume,
        unit: validatedQuery.unit,
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

  @Get('quiz/:quizId/performance-comparison')
  @UseGuards(JwtAuthGuard) // Allow all authenticated users, not just teachers
  @ApiOperation({
    summary: 'Get quiz performance comparison (time and accuracy)',
    description: 'Returns comparison of user\'s time and accuracy against average for a specific quiz. Shows user\'s time spent, average time, time percentile, and accuracy comparison.'
  })
  @ApiQuery({ name: 'sessionId', required: true, description: 'Session UUID for the specific practice session' })
  @ApiResponse({
    status: 200,
    description: 'Quiz performance comparison retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            quiz_id: { type: 'string', format: 'uuid' },
            user_time: { type: 'number', description: 'User\'s time spent in seconds' },
            avg_time: { type: 'number', description: 'Average time across all users in seconds' },
            min_time: { type: 'number', description: 'Minimum time across all users' },
            max_time: { type: 'number', description: 'Maximum time across all users' },
            time_percentile: { type: 'number', description: 'User\'s time percentile (0-100)' },
            user_correct: { type: 'boolean', description: 'Whether user answered correctly' },
            user_accuracy: { type: 'number', description: 'User\'s historical accuracy on this quiz (%)' },
            avg_accuracy: { type: 'number', description: 'Average accuracy across all users (%)' },
            total_attempts: { type: 'number', description: 'Total attempts by all users' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 404, description: 'Quiz or session not found' })
  async getQuizPerformanceComparison(
    @Param('quizId') quizId: string,
    @Query('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    try {
      // Validate UUID formats
      const uuidSchema = z.string().uuid();
      uuidSchema.parse(quizId);

      // Validate query parameters
      const validatedQuery = QuizPerformanceComparisonQuerySchema.parse({
        sessionId,
      });

      // Get user ID from JWT token
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
      }

      const result = await this.analyticsService.getQuizPerformanceComparison({
        quizId,
        sessionId: validatedQuery.sessionId,
        userId,
      });

      return {
        success: true,
        data: result,
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
        error instanceof Error ? error.message : 'Failed to get quiz performance comparison',
        error instanceof Error && error.message.includes('not found')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
