import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { QuizReportService } from '@kedge/quiz';
import {
  SubmitQuizReportDto,
  SubmitQuizReportSchema,
  UpdateQuizReportDto,
  UpdateQuizReportSchema,
  UpdateReportStatusDto,
  UpdateReportStatusSchema,
  BulkUpdateReportsDto,
  BulkUpdateReportsSchema,
  GetReportsQueryDto,
  GetReportsQuerySchema,
  QuizReport,
  QuizReportWithRelations
} from '@kedge/models';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Quiz Reports')
@Controller('quiz/report')
export class QuizReportController {
  constructor(private readonly reportService: QuizReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a report for a quiz question' })
  @ApiResponse({
    status: 200,
    description: 'Report submitted successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate report already exists',
  })
  async submitReport(
    @Request() req: any,
    @Body(new ZodValidationPipe(SubmitQuizReportSchema)) data: SubmitQuizReportDto
  ) {
    try {
      const report = await this.reportService.submitReport(req.user.userId, data);
      return {
        success: true,
        data: {
          report_id: report.id,
          message: '感谢您的反馈，我们会尽快处理',
          estimated_resolution: '24-48 hours'
        }
      };
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_REPORT',
            message: '您已经报告过这个问题，我们正在处理中',
            status: 'pending'
          }
        };
      }
      throw error;
    }
  }

  @Get('my-reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user\'s reports' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'reviewing', 'resolved', 'dismissed'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserReports(
    @Request() req: any,
    @Query(new ZodValidationPipe(GetReportsQuerySchema)) query: GetReportsQueryDto
  ) {
    const reports = await this.reportService.getUserReports(req.user.userId, query);
    return {
      success: true,
      data: reports
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user\'s own report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async updateUserReport(
    @Request() req: any,
    @Param('id') reportId: string,
    @Body(new ZodValidationPipe(UpdateQuizReportSchema)) data: UpdateQuizReportDto
  ) {
    try {
      const report = await this.reportService.updateUserReport(
        req.user.userId,
        reportId,
        data
      );
      return {
        success: true,
        data: report
      };
    } catch (error: any) {
      if (error.message === 'Report not found or cannot be updated') {
        throw new NotFoundException('Report not found or cannot be updated');
      }
      throw error;
    }
  }

  @Get('management')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reports for management (teachers/admins)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'reviewing', 'resolved', 'dismissed'] })
  @ApiQuery({ name: 'sort', required: false, enum: ['created_at', 'report_count', 'pending_count'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getReportsForManagement(
    @Query(new ZodValidationPipe(GetReportsQuerySchema)) query: GetReportsQueryDto
  ) {
    const result = await this.reportService.getReportsForManagement(query);
    return {
      success: true,
      data: result.quizzes,
      pagination: {
        total: result.total,
        page: Math.floor(query.offset / query.limit) + 1,
        per_page: query.limit
      }
    };
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update report status (teachers/admins)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async updateReportStatus(
    @Request() req: any,
    @Param('id') reportId: string,
    @Body(new ZodValidationPipe(UpdateReportStatusSchema)) data: UpdateReportStatusDto
  ) {
    try {
      const report = await this.reportService.updateReportStatus(
        reportId,
        req.user.userId,
        data
      );
      
      // Get resolver info
      const resolverInfo = report.resolved_by ? {
        id: req.user.userId,
        name: req.user.name || 'Teacher'
      } : null;

      return {
        success: true,
        data: {
          report_id: report.id,
          status: report.status,
          resolved_by: resolverInfo,
          resolved_at: report.resolved_at
        }
      };
    } catch (error: any) {
      if (error.message === 'Report not found') {
        throw new NotFoundException('Report not found');
      }
      throw error;
    }
  }

  @Put('bulk-update')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update reports (teachers/admins)' })
  async bulkUpdateReports(
    @Request() req: any,
    @Body(new ZodValidationPipe(BulkUpdateReportsSchema)) data: BulkUpdateReportsDto
  ) {
    const result = await this.reportService.bulkUpdateReports(req.user.userId, data);
    return {
      success: true,
      data: {
        updated_count: result.updated_count,
        message: `已批量更新${result.updated_count}条报错记录`
      }
    };
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report analytics' })
  @ApiQuery({ name: 'period', required: false, description: 'Period like 7d, 30d, etc.' })
  async getReportAnalytics(
    @Query('period') period?: string
  ) {
    const analytics = await this.reportService.getReportAnalytics(period);
    return {
      success: true,
      data: analytics
    };
  }
}