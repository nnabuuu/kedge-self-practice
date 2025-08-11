import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '@kedge/auth';
import { KnowledgePointService } from '@kedge/practice';

@Controller('api/practice/knowledge-points')
@UseGuards(JwtAuthGuard)
export class KnowledgePointsController {
  constructor(private readonly knowledgePointService: KnowledgePointService) {}

  @Get()
  async getAllKnowledgePoints(@Query('subjectId') subjectId?: string) {
    try {
      const knowledgePoints = subjectId 
        ? await this.knowledgePointService.findBySubject(subjectId)
        : await this.knowledgePointService.findAll();
      
      return {
        success: true,
        data: knowledgePoints,
        message: 'Knowledge points retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge points',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search')
  async searchKnowledgePoints(
    @Query('q') query: string,
    @Query('subjectId') subjectId?: string
  ) {
    try {
      const knowledgePoints = await this.knowledgePointService.search(
        query || '', 
        subjectId
      );
      
      return {
        success: true,
        data: knowledgePoints,
        message: 'Search completed successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Search failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('hierarchy/:subjectId')
  async getKnowledgePointHierarchy(@Param('subjectId') subjectId: string) {
    try {
      const hierarchy = await this.knowledgePointService.getHierarchyBySubject(subjectId);
      
      return {
        success: true,
        data: hierarchy,
        message: 'Knowledge point hierarchy retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge point hierarchy',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('by-volume/:subjectId/:volume')
  async getKnowledgePointsByVolume(
    @Param('subjectId') subjectId: string,
    @Param('volume') volume: string
  ) {
    try {
      const knowledgePoints = await this.knowledgePointService.findByVolume(
        subjectId, 
        decodeURIComponent(volume)
      );
      
      return {
        success: true,
        data: knowledgePoints,
        message: 'Knowledge points retrieved by volume successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge points by volume',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('by-unit/:subjectId/:volume/:unit')
  async getKnowledgePointsByUnit(
    @Param('subjectId') subjectId: string,
    @Param('volume') volume: string,
    @Param('unit') unit: string
  ) {
    try {
      const knowledgePoints = await this.knowledgePointService.findByUnit(
        subjectId, 
        decodeURIComponent(volume),
        decodeURIComponent(unit)
      );
      
      return {
        success: true,
        data: knowledgePoints,
        message: 'Knowledge points retrieved by unit successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge points by unit',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('by-lesson/:subjectId/:volume/:unit/:lesson')
  async getKnowledgePointsByLesson(
    @Param('subjectId') subjectId: string,
    @Param('volume') volume: string,
    @Param('unit') unit: string,
    @Param('lesson') lesson: string
  ) {
    try {
      const knowledgePoints = await this.knowledgePointService.findByLesson(
        subjectId, 
        decodeURIComponent(volume),
        decodeURIComponent(unit),
        decodeURIComponent(lesson)
      );
      
      return {
        success: true,
        data: knowledgePoints,
        message: 'Knowledge points retrieved by lesson successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge points by lesson',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getKnowledgePointById(@Param('id') id: string) {
    try {
      const knowledgePoint = await this.knowledgePointService.findById(id);
      
      if (!knowledgePoint) {
        throw new HttpException(
          {
            success: false,
            message: 'Knowledge point not found'
          },
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: knowledgePoint,
        message: 'Knowledge point retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge point',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('batch/:ids')
  async getKnowledgePointsByIds(@Param('ids') idsString: string) {
    try {
      const ids = idsString.split(',').map(id => id.trim());
      const knowledgePoints = await this.knowledgePointService.findByIds(ids);
      
      return {
        success: true,
        data: knowledgePoints,
        message: 'Knowledge points retrieved successfully'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve knowledge points',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}