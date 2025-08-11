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
  HttpCode,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { JwtAuthGuard } from '@kedge/auth';
import { PracticeService } from '@kedge/practice';
import {
  CreatePracticeSessionSchema,
  PracticeSessionSchema,
  PracticeSessionResponseSchema,
  SubmitAnswerSchema,
  SkipQuestionSchema,
  PracticeStatisticsSchema,
  PracticeHistoryQuerySchema,
  PauseSessionSchema,
  ResumeSessionSchema,
  CompleteSessionSchema
} from '@kedge/models';

class CreatePracticeSessionDto extends createZodDto(CreatePracticeSessionSchema) {}
class PracticeSessionDto extends createZodDto(PracticeSessionSchema) {}
class PracticeSessionResponseDto extends createZodDto(PracticeSessionResponseSchema) {}
class SubmitAnswerDto extends createZodDto(SubmitAnswerSchema) {}
class SkipQuestionDto extends createZodDto(SkipQuestionSchema) {}
class PracticeStatisticsDto extends createZodDto(PracticeStatisticsSchema) {}
class PracticeHistoryQueryDto extends createZodDto(PracticeHistoryQuerySchema) {}
class PauseSessionDto extends createZodDto(PauseSessionSchema) {}
class ResumeSessionDto extends createZodDto(ResumeSessionSchema) {}
class CompleteSessionDto extends createZodDto(CompleteSessionSchema) {}

@ApiTags('Practice')
@Controller('api/v1/practice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('sessions/create')
  @ApiOperation({ summary: 'Create a new practice session' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Practice session created successfully',
    type: PracticeSessionResponseDto 
  })
  async createSession(
    @Request() req,
    @Body() createSessionDto: CreatePracticeSessionDto
  ): Promise<PracticeSessionResponseDto> {
    const studentId = req.user.userId;
    return await this.practiceService.createSession(studentId, createSessionDto);
  }

  @Post('sessions/:sessionId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice session started',
    type: PracticeSessionResponseDto 
  })
  async startSession(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<PracticeSessionResponseDto> {
    const studentId = req.user.userId;
    return await this.practiceService.startSession(sessionId, studentId);
  }

  @Post('sessions/submit-answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an answer to a practice question' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Answer submitted successfully',
    type: PracticeSessionResponseDto 
  })
  async submitAnswer(
    @Request() req,
    @Body() submitAnswerDto: SubmitAnswerDto
  ): Promise<PracticeSessionResponseDto> {
    const studentId = req.user.userId;
    return await this.practiceService.submitAnswer(submitAnswerDto, studentId);
  }

  @Post('sessions/skip-question')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip a practice question' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Question skipped',
    type: PracticeSessionResponseDto 
  })
  async skipQuestion(
    @Request() req,
    @Body() skipQuestionDto: SkipQuestionDto
  ): Promise<PracticeSessionResponseDto> {
    const studentId = req.user.userId;
    return await this.practiceService.skipQuestion(skipQuestionDto, studentId);
  }

  @Post('sessions/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session paused',
    type: PracticeSessionDto 
  })
  async pauseSession(
    @Request() req,
    @Body() pauseSessionDto: PauseSessionDto
  ): Promise<PracticeSessionDto> {
    const studentId = req.user.userId;
    return await this.practiceService.pauseSession(pauseSessionDto.session_id, studentId);
  }

  @Post('sessions/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session resumed',
    type: PracticeSessionResponseDto 
  })
  async resumeSession(
    @Request() req,
    @Body() resumeSessionDto: ResumeSessionDto
  ): Promise<PracticeSessionResponseDto> {
    const studentId = req.user.userId;
    return await this.practiceService.resumeSession(resumeSessionDto.session_id, studentId);
  }

  @Post('sessions/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session completed',
    type: PracticeSessionDto 
  })
  async completeSession(
    @Request() req,
    @Body() completeSessionDto: CompleteSessionDto
  ): Promise<PracticeSessionDto> {
    const studentId = req.user.userId;
    return await this.practiceService.completeSession(completeSessionDto.session_id, studentId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get practice session details' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice session details',
    type: PracticeSessionDto 
  })
  async getSession(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<PracticeSessionDto> {
    const studentId = req.user.userId;
    return await this.practiceService.getSession(sessionId, studentId);
  }

  @Get('sessions/:sessionId/current-question')
  @ApiOperation({ summary: 'Get current question for a practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Current question'
  })
  async getCurrentQuestion(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    const studentId = req.user.userId;
    await this.practiceService.getSession(sessionId, studentId);
    return await this.practiceService.getCurrentQuestion(sessionId);
  }

  @Get('sessions/:sessionId/next-question')
  @ApiOperation({ summary: 'Get next unanswered question' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Next question'
  })
  async getNextQuestion(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    const studentId = req.user.userId;
    await this.practiceService.getSession(sessionId, studentId);
    return await this.practiceService.getNextQuestion(sessionId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get practice session history' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of practice sessions',
    type: [PracticeSessionDto]
  })
  async getHistory(
    @Request() req,
    @Query() query: PracticeHistoryQueryDto
  ): Promise<PracticeSessionDto[]> {
    const studentId = req.user.userId;
    return await this.practiceService.getSessionHistory(
      studentId,
      query.status,
      query.limit,
      query.offset
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get practice statistics for the current student' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice statistics',
    type: PracticeStatisticsDto 
  })
  async getStatistics(@Request() req): Promise<PracticeStatisticsDto> {
    const studentId = req.user.userId;
    return await this.practiceService.getStatistics(studentId);
  }

  @Get('statistics/:studentId')
  @ApiOperation({ summary: 'Get practice statistics for a specific student (teacher/admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice statistics',
    type: PracticeStatisticsDto 
  })
  async getStudentStatistics(
    @Request() req,
    @Param('studentId') studentId: string
  ): Promise<PracticeStatisticsDto> {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only teachers and admins can view other students statistics');
    }
    return await this.practiceService.getStatistics(studentId);
  }
}