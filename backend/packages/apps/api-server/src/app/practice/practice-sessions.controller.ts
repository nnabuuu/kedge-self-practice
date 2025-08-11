import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Param, 
  Body, 
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '@kedge/auth';
import { 
  CreatePracticeSessionRequest, 
  UpdatePracticeSessionRequest 
} from '@kedge/models';
import { PracticeSessionService } from '@kedge/practice';

@Controller('api/practice/sessions')
@UseGuards(JwtAuthGuard)
export class PracticeSessionsController {
  constructor(private readonly practiceSessionService: PracticeSessionService) {}

  @Post()
  async createPracticeSession(
    @Request() req: any,
    @Body() createSessionDto: CreatePracticeSessionRequest
  ) {
    try {
      const userId = req.user.sub;
      const session = await this.practiceSessionService.createSession(
        userId, 
        createSessionDto
      );
      
      return {
        success: true,
        data: session,
        message: 'Practice session created successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create practice session',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('active')
  async getActiveSessions(@Request() req: any) {
    try {
      const userId = req.user.sub;
      const sessions = await this.practiceSessionService.getUserActiveSessions(userId);
      
      return {
        success: true,
        data: sessions,
        message: 'Active sessions retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve active sessions',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('history')
  async getPracticeHistory(
    @Request() req: any,
    @Query('subjectId') subjectId?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const userId = req.user.sub;
      const limitNum = limit ? parseInt(limit, 10) : 50;
      
      const history = await this.practiceSessionService.getUserPracticeHistory(
        userId, 
        subjectId, 
        limitNum
      );
      
      return {
        success: true,
        data: history,
        message: 'Practice history retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve practice history',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance')
  async getKnowledgePointPerformance(
    @Request() req: any,
    @Query('subjectId') subjectId?: string
  ) {
    try {
      const userId = req.user.sub;
      const performance = await this.practiceSessionService.getKnowledgePointPerformance(
        userId, 
        subjectId
      );
      
      return {
        success: true,
        data: performance,
        message: 'Knowledge point performance retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge point performance',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('statistics')
  async getSessionStatistics(@Request() req: any) {
    try {
      const userId = req.user.sub;
      const statistics = await this.practiceSessionService.getSessionStatistics(userId);
      
      return {
        success: true,
        data: statistics,
        message: 'Session statistics retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve session statistics',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':sessionId')
  async getPracticeSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.sub;
      const session = await this.practiceSessionService.getSessionById(sessionId, userId);
      
      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: 'Practice session not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: session,
        message: 'Practice session retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve practice session',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':sessionId')
  async updatePracticeSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdatePracticeSessionRequest
  ) {
    try {
      const userId = req.user.sub;
      const session = await this.practiceSessionService.updateSession(
        sessionId, 
        userId, 
        updateSessionDto
      );
      
      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: 'Practice session not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: session,
        message: 'Practice session updated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update practice session',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':sessionId')
  async deletePracticeSession(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    try {
      const userId = req.user.sub;
      const success = await this.practiceSessionService.deleteSession(sessionId, userId);
      
      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'Practice session not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        message: 'Practice session deleted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete practice session',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Convenience endpoint to start a quick practice session
  @Post('quick-start')
  async quickStartPractice(
    @Request() req: any,
    @Body() quickStartDto: {
      subjectId: string;
      knowledgePointIds: string[];
      questionCount?: number;
      questionType?: 'new' | 'with-wrong' | 'wrong-only';
      timeLimit?: number;
    }
  ) {
    try {
      const userId = req.user.sub;
      
      const createSessionDto: CreatePracticeSessionRequest = {
        subjectId: quickStartDto.subjectId,
        knowledgePointIds: quickStartDto.knowledgePointIds,
        config: {
          questionType: quickStartDto.questionType || 'new',
          questionCount: quickStartDto.questionCount || 20,
          timeLimit: quickStartDto.timeLimit,
          shuffleQuestions: true,
          showExplanation: true
        }
      };
      
      const session = await this.practiceSessionService.createSession(
        userId, 
        createSessionDto
      );
      
      return {
        success: true,
        data: session,
        message: 'Quick practice session started successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to start quick practice session',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Endpoint to submit answers in batch
  @Put(':sessionId/submit-answers')
  async submitAnswers(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() submitDto: {
      answers: (string | string[] | null)[];
      questionDurations?: number[];
      completed?: boolean;
    }
  ) {
    try {
      const userId = req.user.sub;
      
      const updateDto: UpdatePracticeSessionRequest = {
        answers: submitDto.answers,
        questionDurations: submitDto.questionDurations,
        completed: submitDto.completed
      };
      
      if (submitDto.completed) {
        updateDto.endTime = new Date();
      }
      
      const session = await this.practiceSessionService.updateSession(
        sessionId, 
        userId, 
        updateDto
      );
      
      if (!session) {
        throw new HttpException(
          {
            success: false,
            message: 'Practice session not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: session,
        message: submitDto.completed 
          ? 'Practice session completed successfully'
          : 'Answers submitted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to submit answers',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}