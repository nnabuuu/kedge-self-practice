import { Controller, Get, Query, UseGuards, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@kedge/auth';
import { LeaderboardService, SessionNotFoundException, UserNotFoundException } from '@kedge/leaderboard';
import { CurrentUser } from '@kedge/auth';

@ApiTags('Leaderboard')
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * Get users by practice count (most/least quizzes practiced)
   */
  @Get('practice-count')
  @ApiOperation({ summary: 'Get users ranked by practice count (Teacher/Admin only)' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class' })
  @ApiQuery({ name: 'order', required: false, enum: ['most', 'least'], description: 'Order by most or least' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'List of users ranked by practice count' })
  async getUsersByPracticeCount(
    @CurrentUser() user: any,
    @Query('class') classFilter?: string,
    @Query('order') order?: 'most' | 'least',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      // Check if user is teacher or admin
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw new HttpException('Only teachers and admins can view leaderboards', HttpStatus.FORBIDDEN);
      }

      const result = await this.leaderboardService.getUsersByPracticeCount({
        class: classFilter,
        order: order || 'most',
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching practice count leaderboard:', error);
      throw new HttpException('Failed to fetch leaderboard', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get users by correct rate (highest/lowest accuracy)
   */
  @Get('correct-rate')
  @ApiOperation({ summary: 'Get users ranked by correct rate (Teacher/Admin only)' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class' })
  @ApiQuery({ name: 'order', required: false, enum: ['highest', 'lowest'], description: 'Order by highest or lowest' })
  @ApiQuery({ name: 'minQuizzes', required: false, type: Number, description: 'Minimum quizzes required' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'List of users ranked by correct rate' })
  async getUsersByCorrectRate(
    @CurrentUser() user: any,
    @Query('class') classFilter?: string,
    @Query('order') order?: 'highest' | 'lowest',
    @Query('minQuizzes') minQuizzes?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      // Check if user is teacher or admin
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw new HttpException('Only teachers and admins can view leaderboards', HttpStatus.FORBIDDEN);
      }

      const result = await this.leaderboardService.getUsersByCorrectRate({
        class: classFilter,
        order: order || 'highest',
        minQuizzes: minQuizzes ? parseInt(minQuizzes, 10) : 5,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching correct rate leaderboard:', error);
      throw new HttpException('Failed to fetch leaderboard', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get class statistics
   */
  @Get('class-stats')
  @ApiOperation({ summary: 'Get statistics for all classes (Teacher/Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics for each class' })
  async getClassStatistics(@CurrentUser() user: any) {
    try {
      // Check if user is teacher or admin
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw new HttpException('Only teachers and admins can view class statistics', HttpStatus.FORBIDDEN);
      }

      const result = await this.leaderboardService.getClassStatistics();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching class statistics:', error);
      throw new HttpException('Failed to fetch class statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get detailed practice information for a specific user
   */
  @Get('user/:userId/practice-details')
  @ApiOperation({ summary: 'Get detailed practice information for a specific user (Teacher/Admin only)' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({ status: 200, description: 'User practice details including knowledge point stats and recent sessions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPracticeDetails(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
  ) {
    try {
      // Check if user is teacher or admin
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw new HttpException('Only teachers and admins can view user practice details', HttpStatus.FORBIDDEN);
      }

      const result = await this.leaderboardService.getUserPracticeDetails(userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error instanceof UserNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      console.error('Error fetching user practice details:', error);
      throw new HttpException('Failed to fetch user practice details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get detailed information for a specific practice session
   */
  @Get('session/:sessionId/details')
  @ApiOperation({ summary: 'Get detailed practice session information (Teacher/Admin only)' })
  @ApiParam({ name: 'sessionId', description: 'The ID of the practice session' })
  @ApiResponse({ status: 200, description: 'Practice session details including all questions and answers' })
  @ApiResponse({ status: 404, description: 'Practice session not found' })
  async getPracticeSessionDetails(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    try {
      // Check if user is teacher or admin
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw new HttpException('Only teachers and admins can view practice session details', HttpStatus.FORBIDDEN);
      }

      const result = await this.leaderboardService.getPracticeSessionDetails(sessionId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error instanceof SessionNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      if (error instanceof UserNotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      console.error('Error fetching practice session details:', error);
      throw new HttpException('Failed to fetch practice session details', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get overall leaderboard summary
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get leaderboard summary with top performers and statistics (Teacher/Admin only)' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class' })
  @ApiResponse({ status: 200, description: 'Leaderboard summary with top performers and statistics' })
  async getLeaderboardSummary(
    @CurrentUser() user: any,
    @Query('class') classFilter?: string,
  ) {
    try {
      // Check if user is teacher or admin
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw new HttpException('Only teachers and admins can view leaderboard summary', HttpStatus.FORBIDDEN);
      }

      const result = await this.leaderboardService.getLeaderboardSummary(classFilter);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching leaderboard summary:', error);
      throw new HttpException('Failed to fetch leaderboard summary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}