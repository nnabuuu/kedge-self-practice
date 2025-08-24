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
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { JwtAuthGuard } from '@kedge/auth';
import { PracticeService, StrategyService } from '@kedge/practice';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    role: string;
  };
}
import {
  CreatePracticeSessionSchema,
  PracticeSessionSchema,
  PracticeSessionResponseSchema,
  SubmitAnswerSchema,
  PracticeHistoryQuerySchema,
  PauseSessionSchema,
  ResumeSessionSchema,
  CompleteSessionSchema,
  GeneratePracticeRequestSchema
} from '@kedge/models';
import { z } from 'zod';

const RecordMistakeSchema = z.object({
  quiz_id: z.string().uuid(),
  incorrect_answer: z.string(),
  correct_answer: z.string(),
});

const RecordCorrectionSchema = z.object({
  quiz_id: z.string().uuid(),
});

class CreatePracticeSessionDto extends createZodDto(CreatePracticeSessionSchema) {}
class PracticeSessionDto extends createZodDto(PracticeSessionSchema) {}
class PracticeSessionResponseDto extends createZodDto(PracticeSessionResponseSchema) {}
class SubmitAnswerDto extends createZodDto(SubmitAnswerSchema) {}
class PracticeHistoryQueryDto extends createZodDto(PracticeHistoryQuerySchema) {}
class PauseSessionDto extends createZodDto(PauseSessionSchema) {}
class ResumeSessionDto extends createZodDto(ResumeSessionSchema) {}
class CompleteSessionDto extends createZodDto(CompleteSessionSchema) {}
class GeneratePracticeRequestDto extends createZodDto(GeneratePracticeRequestSchema) {}
class RecordMistakeDto extends createZodDto(RecordMistakeSchema) {}
class RecordCorrectionDto extends createZodDto(RecordCorrectionSchema) {}

@ApiTags('Practice')
@Controller('practice')
export class PracticeController {
  constructor(
    private readonly practiceService: PracticeService,
    private readonly strategyService: StrategyService
  ) {}

  @Post('sessions/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new practice session' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Practice session created successfully',
    type: PracticeSessionResponseDto 
  })
  async createSession(
    @Request() req: AuthenticatedRequest,
    @Body() createSessionDto: CreatePracticeSessionDto
  ): Promise<PracticeSessionResponseDto> {
    // Use the actual authenticated user's ID
    const userId = req.user.userId;
    return await this.practiceService.createSession(userId, createSessionDto);
  }

  @Post('sessions/:sessionId/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice session started',
    type: PracticeSessionResponseDto 
  })
  async startSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string
  ): Promise<PracticeSessionResponseDto> {
    // Use the actual authenticated user's ID
    const userId = req.user.userId;
    return await this.practiceService.startSession(sessionId, userId);
  }

  @Post('sessions/submit-answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an answer to a practice question' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Answer submitted successfully'
  })
  async submitAnswer(
    @Request() req: AuthenticatedRequest,
    @Body() submitAnswerDto: SubmitAnswerDto
  ): Promise<{ isCorrect: boolean }> {
    // Use the actual authenticated user's ID
    const userId = req.user.userId;
    return await this.practiceService.submitAnswer(submitAnswerDto, userId);
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
    @Request() req: AuthenticatedRequest,
    @Body() pauseSessionDto: PauseSessionDto
  ): Promise<PracticeSessionDto> {
    const userId = req.user.userId;
    return await this.practiceService.pauseSession(pauseSessionDto.session_id, userId);
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
    @Request() req: AuthenticatedRequest,
    @Body() resumeSessionDto: ResumeSessionDto
  ): Promise<PracticeSessionResponseDto> {
    const userId = req.user.userId;
    return await this.practiceService.resumeSession(resumeSessionDto.session_id, userId);
  }

  @Post('sessions/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a practice session' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Session completed',
    type: PracticeSessionDto 
  })
  async completeSession(
    @Request() req: AuthenticatedRequest,
    @Body() completeSessionDto: CompleteSessionDto
  ): Promise<PracticeSessionDto> {
    // Use the actual authenticated user's ID
    const userId = req.user.userId;
    return await this.practiceService.completeSession(completeSessionDto.session_id, userId);
  }

  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get practice session details with all questions' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice session details with questions',
    type: PracticeSessionResponseDto 
  })
  async getSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string
  ): Promise<PracticeSessionResponseDto> {
    // Use the actual authenticated user's ID
    const userId = req.user.userId;
    return await this.practiceService.getSession(sessionId, userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get practice session history' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of practice sessions',
    type: [PracticeSessionDto]
  })
  async getHistory(
    @Request() req: AuthenticatedRequest,
    @Query() query: PracticeHistoryQueryDto
  ): Promise<PracticeSessionDto[]> {
    const userId = req.user.userId;
    return await this.practiceService.getSessionHistory(
      userId,
      query.status,
      query.limit,
      query.offset
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get practice statistics for the current student' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice statistics'
  })
  async getStatistics(@Request() req: AuthenticatedRequest): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.getStatistics(userId);
  }

  @Get('statistics/:userId')
  @ApiOperation({ summary: 'Get practice statistics for a specific user (teacher/admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Practice statistics'
  })
  async getUserStatistics(
    @Request() req: AuthenticatedRequest,
    @Param('userId') userId: string
  ): Promise<any> {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only teachers and admins can view other users statistics');
    }
    return await this.practiceService.getStatistics(userId);
  }

  @Get('strategies')
  @ApiOperation({ summary: 'Get available practice strategies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of available practice strategies',
  })
  async getAvailableStrategies(@Request() req: AuthenticatedRequest): Promise<any> {
    const userId = req.user.userId;
    return await this.strategyService.getAvailableStrategies(userId);
  }

  @Post('sessions/create-with-strategy')
  @ApiOperation({ summary: 'Create a practice session using a specific strategy' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Practice session generated successfully',
  })
  async createSessionWithStrategy(
    @Request() req: AuthenticatedRequest,
    @Body() generateRequestDto: GeneratePracticeRequestDto
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.strategyService.generateStrategySession(userId, generateRequestDto);
  }

  @Get('strategies/recommendations')
  @ApiOperation({ summary: 'Get strategy recommendations for the current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Strategy recommendations',
  })
  async getStrategyRecommendations(@Request() req: AuthenticatedRequest): Promise<any> {
    const userId = req.user.userId;
    return await this.strategyService.getStrategyRecommendations(userId);
  }

  @Get('strategies/analytics/:strategyCode')
  @ApiOperation({ summary: 'Get analytics for a specific strategy' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Strategy analytics',
  })
  async getStrategyAnalytics(
    @Request() req: AuthenticatedRequest,
    @Param('strategyCode') strategyCode: string
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.strategyService.getStrategyAnalytics(userId, strategyCode);
  }

  @Post('sessions/:sessionId/record-mistake')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a mistake in the practice session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mistake recorded',
  })
  async recordMistake(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() recordMistakeDto: RecordMistakeDto
  ): Promise<{ success: boolean }> {
    const userId = req.user.userId;
    await this.strategyService.recordMistake(
      userId,
      recordMistakeDto.quiz_id,
      sessionId,
      recordMistakeDto.incorrect_answer,
      recordMistakeDto.correct_answer
    );

    return { success: true };
  }

  @Post('sessions/:sessionId/record-correction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a correction for a previously mistaken question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Correction recorded',
  })
  async recordCorrection(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() recordCorrectionDto: RecordCorrectionDto
  ): Promise<{ success: boolean }> {
    const userId = req.user.userId;
    await this.strategyService.recordCorrection(userId, recordCorrectionDto.quiz_id);
    return { success: true };
  }

  @Get('analysis/weak-knowledge-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weak knowledge points from recent practice sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weak knowledge points analysis',
  })
  async getWeakKnowledgePoints(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit: string = '20'
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.analyzeWeakKnowledgePoints(userId, parseInt(limit));
  }

  @Get('analysis/wrong-questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wrong questions from recent practice sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wrong questions from recent sessions',
  })
  async getWrongQuestions(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit: string = '5'
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.getRecentWrongQuestions(userId, parseInt(limit));
  }

  @Get('analysis/quick-practice-suggestion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested knowledge points for quick practice' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suggested knowledge points based on last practice',
  })
  async getQuickPracticeSuggestion(
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.getLastPracticeKnowledgePoints(userId);
  }

  @Get('analysis/knowledge-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed statistics for knowledge points' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Knowledge point statistics',
  })
  async getKnowledgePointStats(
    @Request() req: AuthenticatedRequest,
    @Query('subjectId') subjectId?: string,
    @Query('limit') limit: string = '20'
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.getKnowledgePointStatistics(
      userId, 
      subjectId,
      parseInt(limit)
    );
  }

  @Get('quick-options-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check availability of quick practice options' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quick practice options availability',
  })
  async getQuickOptionsAvailability(
    @Request() req: AuthenticatedRequest
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.checkQuickOptionsAvailability(userId);
  }

  @Post('sessions/create-wrong-questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a practice session with wrong questions from recent sessions' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Wrong questions practice session created successfully',
  })
  async createWrongQuestionsSession(
    @Request() req: AuthenticatedRequest,
    @Query('sessionLimit') sessionLimit: string = '5'
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.createWrongQuestionsSession(
      userId, 
      parseInt(sessionLimit)
    );
  }

  @Post('sessions/create-quick-practice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a quick practice session based on last practice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quick practice session created successfully',
  })
  async createQuickPracticeSession(
    @Request() req: AuthenticatedRequest,
    @Query('questionLimit') questionLimit: string = '10'
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.createQuickPracticeSession(
      userId, 
      parseInt(questionLimit)
    );
  }

  @Post('sessions/create-weak-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a practice session targeting weak knowledge points' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Weak points practice session created successfully',
  })
  async createWeakPointsSession(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit: string = '20'
  ): Promise<any> {
    const userId = req.user.userId;
    return await this.practiceService.createWeakPointsSession(
      userId, 
      parseInt(limit)
    );
  }
}