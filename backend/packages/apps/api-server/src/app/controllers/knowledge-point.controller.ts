import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  KnowledgePointGPTService,
  KnowledgePointStorage,
} from '@kedge/knowledge-point';
import { KnowledgePoint } from '@kedge/models';

interface MatchKnowledgePointRequest {
  quizText: string;
  maxMatches?: number;
}

interface MatchKnowledgePointResponse {
  matched: KnowledgePoint | null;
  candidates: KnowledgePoint[];
  keywords: string[];
  country: string;
  dynasty: string;
}

interface SearchKnowledgePointsResponse {
  knowledgePoints: KnowledgePoint[];
  total: number;
}

interface KnowledgePointStatsResponse {
  total: number;
  byVolume: Record<string, number>;
  byUnit: Record<string, number>;
}

@ApiTags('Knowledge Points')
@Controller('v1/knowledge-points')
export class KnowledgePointController {
  private readonly logger = new Logger(KnowledgePointController.name);

  constructor(
    private readonly gptService: KnowledgePointGPTService,
    private readonly storage: KnowledgePointStorage,
  ) {}

  @Post('match')
  @ApiOperation({ summary: 'Match quiz text to knowledge points using AI' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge points matched successfully',
  })
  async matchKnowledgePoints(
    @Body() request: MatchKnowledgePointRequest,
  ): Promise<MatchKnowledgePointResponse> {
    try {
      const { quizText, maxMatches = 3 } = request;
      
      if (!quizText || quizText.trim().length === 0) {
        throw new Error('Quiz text is required');
      }

      const allPoints = this.storage.getAllKnowledgePoints();
      
      if (allPoints.length === 0) {
        this.logger.warn('No knowledge points available for matching');
        return {
          matched: null,
          candidates: [],
          keywords: [],
          country: '未知',
          dynasty: '无',
        };
      }

      // Step 1: Extract keywords
      const {keywords, country, dynasty} = await this.gptService.extractKeywordsFromQuiz(quizText);
      if (keywords.length === 0) {
        this.logger.warn('No keywords extracted from quiz text');
        return {
          matched: null,
          candidates: [],
          keywords,
          country,
          dynasty,
        };
      }

      this.logger.log(`Extracted keywords: ${JSON.stringify({keywords, country, dynasty})}`);

      // Step 2: Get all units and filter by country/dynasty
      const units = this.storage.getAllUnits();
      const unitFilter = await this.gptService.suggestUnitsByCountryAndDynasty(quizText, units);
      
      this.logger.log(`Suggested units: ${JSON.stringify(unitFilter)}`);

      // Step 3: Get candidate knowledge points from filtered units
      const candidatePoints = this.storage.getKnowledgePointsByUnits(unitFilter);
      
      if (candidatePoints.length === 0) {
        this.logger.warn('No candidate points found in suggested units');
        return {
          matched: null,
          candidates: [],
          keywords,
          country,
          dynasty,
        };
      }

      this.logger.log(`Found ${candidatePoints.length} candidate knowledge points`);

      // Step 4: Use GPT to disambiguate and select best matches
      const {selectedId, candidateIds} = await this.gptService.disambiguateTopicFromCandidates(
        quizText,
        candidatePoints,
      );

      this.logger.log(`GPT disambiguation results: selectedId=${selectedId}, candidateIds=${JSON.stringify(candidateIds)}`);

      // Step 5: Build response - exactly as in example-gist
      const matched = this.storage.getKnowledgePointById(selectedId);
      const candidates = this.storage.getKnowledgePointsByIds(candidateIds);
      
      this.logger.log(`matched: ${matched?.topic}, candidates: ${candidates.length}`);

      return {
        matched,
        candidates,
        keywords,
        country,
        dynasty,
      };
    } catch (error) {
      this.logger.error('Failed to match knowledge points', error);
      throw error;
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search knowledge points by query' })
  @ApiQuery({ name: 'q', description: 'Search query', required: false })
  @ApiQuery({ name: 'limit', description: 'Maximum results', required: false })
  @ApiResponse({
    status: 200,
    description: 'Knowledge points retrieved successfully',
  })
  async searchKnowledgePoints(
    @Query('q') query?: string,
    @Query('limit') limitStr?: string,
  ): Promise<SearchKnowledgePointsResponse> {
    try {
      const limit = limitStr ? parseInt(limitStr, 10) : 50;
      const knowledgePoints = this.storage.searchKnowledgePoints(query || '', limit);
      
      this.logger.log(`Found ${knowledgePoints.length} knowledge points for query: "${query}"`);

      return {
        knowledgePoints,
        total: knowledgePoints.length,
      };
    } catch (error) {
      this.logger.error('Failed to search knowledge points', error);
      throw error;
    }
  }

  @Get('by-volume')
  @ApiOperation({ summary: 'Get knowledge points by volume (册别)' })
  @ApiQuery({ name: 'volume', description: 'Volume name (e.g., 上册, 下册)' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge points retrieved successfully',
  })
  async getKnowledgePointsByVolume(
    @Query('volume') volume: string,
  ): Promise<SearchKnowledgePointsResponse> {
    try {
      if (!volume) {
        throw new Error('Volume parameter is required');
      }

      const knowledgePoints = this.storage.getKnowledgePointsByVolume(volume);
      
      this.logger.log(`Found ${knowledgePoints.length} knowledge points for volume: "${volume}"`);

      return {
        knowledgePoints,
        total: knowledgePoints.length,
      };
    } catch (error) {
      this.logger.error('Failed to get knowledge points by volume', error);
      throw error;
    }
  }

  @Get('by-unit')
  @ApiOperation({ summary: 'Get knowledge points by unit (单元)' })
  @ApiQuery({ name: 'unit', description: 'Unit name (e.g., 第一单元)' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge points retrieved successfully',
  })
  async getKnowledgePointsByUnit(
    @Query('unit') unit: string,
  ): Promise<SearchKnowledgePointsResponse> {
    try {
      if (!unit) {
        throw new Error('Unit parameter is required');
      }

      const knowledgePoints = this.storage.getKnowledgePointsByUnit(unit);
      
      this.logger.log(`Found ${knowledgePoints.length} knowledge points for unit: "${unit}"`);

      return {
        knowledgePoints,
        total: knowledgePoints.length,
      };
    } catch (error) {
      this.logger.error('Failed to get knowledge points by unit', error);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get knowledge points statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getKnowledgePointStats(): Promise<KnowledgePointStatsResponse> {
    try {
      const stats = this.storage.getKnowledgePointStats();
      
      this.logger.log(`Retrieved stats for ${stats.total} knowledge points`);

      return stats;
    } catch (error) {
      this.logger.error('Failed to get knowledge point stats', error);
      throw error;
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all knowledge points' })
  @ApiResponse({
    status: 200,
    description: 'All knowledge points retrieved successfully',
  })
  async getAllKnowledgePoints(): Promise<SearchKnowledgePointsResponse> {
    try {
      const knowledgePoints = this.storage.getAllKnowledgePoints();
      
      this.logger.log(`Retrieved ${knowledgePoints.length} knowledge points`);

      return {
        knowledgePoints,
        total: knowledgePoints.length,
      };
    } catch (error) {
      this.logger.error('Failed to get all knowledge points', error);
      throw error;
    }
  }

  @Post('reload')
  @ApiOperation({ summary: 'Reload knowledge points from Excel file' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge points reloaded successfully',
  })
  async reloadKnowledgePoints(): Promise<{ message: string; total: number }> {
    try {
      await this.storage.reloadKnowledgePoints();
      const total = this.storage.getAllKnowledgePoints().length;
      
      this.logger.log(`Reloaded ${total} knowledge points from Excel file`);

      return {
        message: 'Knowledge points reloaded successfully',
        total,
      };
    } catch (error) {
      this.logger.error('Failed to reload knowledge points', error);
      throw error;
    }
  }
}