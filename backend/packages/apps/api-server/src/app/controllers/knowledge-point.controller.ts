import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  KnowledgePointGPTService,
  KnowledgePointStorage,
  KnowledgePointBootstrapService,
  KnowledgePointSuggestionService,
} from '@kedge/knowledge-point';
import { KnowledgePoint } from '@kedge/models';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

interface MatchKnowledgePointRequest {
  quizText: string;
  maxMatches?: number;
  targetHints?: {
    volume?: string;    // 册别 (e.g., "上册", "下册")
    unit?: string;      // 单元 (e.g., "第一单元")
    lesson?: string;    // 课程 (e.g., "第1课")
    sub?: string;       // 子目 (e.g., "夏朝的建立")
  };
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
  totalQuizzes: number;
}

@ApiTags('Knowledge Points')
@Controller('knowledge-points')
export class KnowledgePointController {
  private readonly logger = new Logger(KnowledgePointController.name);

  constructor(
    private readonly gptService: KnowledgePointGPTService,
    private readonly storage: KnowledgePointStorage,
    private readonly persistentService: PersistentService,
    private readonly bootstrapService: KnowledgePointBootstrapService,
    private readonly suggestionService: KnowledgePointSuggestionService,
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
      const { quizText, maxMatches = 3, targetHints } = request;
      
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

      // If target hints are provided, use them to filter candidate points directly
      if (targetHints && Object.keys(targetHints).length > 0) {
        this.logger.log(`Using target hints for knowledge point matching: ${JSON.stringify(targetHints)}`);
        
        // Filter knowledge points based on hints
        let candidatePoints = allPoints;
        
        if (targetHints.volume) {
          candidatePoints = candidatePoints.filter(kp => kp.volume === targetHints.volume);
          this.logger.log(`Filtered by volume "${targetHints.volume}": ${candidatePoints.length} points`);
        }
        
        if (targetHints.unit) {
          candidatePoints = candidatePoints.filter(kp => kp.unit === targetHints.unit);
          this.logger.log(`Filtered by unit "${targetHints.unit}": ${candidatePoints.length} points`);
        }
        
        if (targetHints.lesson) {
          candidatePoints = candidatePoints.filter(kp => kp.lesson === targetHints.lesson);
          this.logger.log(`Filtered by lesson "${targetHints.lesson}": ${candidatePoints.length} points`);
        }
        
        if (targetHints.sub) {
          candidatePoints = candidatePoints.filter(kp => kp.sub === targetHints.sub);
          this.logger.log(`Filtered by sub "${targetHints.sub}": ${candidatePoints.length} points`);
        }
        
        if (candidatePoints.length === 0) {
          this.logger.warn('No knowledge points found matching the provided hints');
          return {
            matched: null,
            candidates: [],
            keywords: [],
            country: '未知',
            dynasty: '无',
          };
        }
        
        // Use GPT to select the best match from filtered candidates
        const {selectedId, candidateIds} = await this.gptService.disambiguateTopicFromCandidates(
          quizText,
          candidatePoints,
        );
        
        const matched = this.storage.getKnowledgePointById(selectedId);
        const candidates = this.storage.getKnowledgePointsByIds(candidateIds);
        
        // Still extract keywords for reference
        const {keywords, country, dynasty} = await this.gptService.extractKeywordsFromQuiz(quizText);
        
        return {
          matched,
          candidates,
          keywords,
          country,
          dynasty,
        };
      }

      // Original flow without target hints
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
      this.logger.log(`Total units available: ${units.length}`);
      this.logger.log(`All units: ${JSON.stringify(units)}`);
      
      const unitFilter = await this.gptService.suggestUnitsByCountryAndDynasty(quizText, units);
      
      this.logger.log(`Suggested units (${unitFilter.length}): ${JSON.stringify(unitFilter)}`);

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
      this.logger.log(`First 5 candidates: ${JSON.stringify(candidatePoints.slice(0, 5).map(p => ({id: p.id, topic: p.topic})))}`);

      // Step 4: Use GPT to disambiguate and select best matches
      const {selectedId, candidateIds} = await this.gptService.disambiguateTopicFromCandidates(
        quizText,
        candidatePoints,
      );

      this.logger.log(`GPT disambiguation results: selectedId=${selectedId}, candidateIds=${JSON.stringify(candidateIds)}`);

      // Step 5: Build response - exactly as in example-gist
      const matched = this.storage.getKnowledgePointById(selectedId);
      const candidates = this.storage.getKnowledgePointsByIds(candidateIds);
      
      this.logger.log(`=== Controller Debug ===`);
      this.logger.log(`matched ID: ${matched?.id}, topic: ${matched?.topic}`);
      this.logger.log(`candidateIds array: ${JSON.stringify(candidateIds)}`);
      this.logger.log(`candidateIds length: ${candidateIds?.length}`);
      this.logger.log(`candidates retrieved: ${candidates.length}`);
      this.logger.log(`candidates details: ${JSON.stringify(candidates.map(c => ({id: c.id, topic: c.topic})))}`);
      this.logger.log(`=== End Controller Debug ===`);

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
      
      // Get total quiz count from database
      let totalQuizzes = 0;
      try {
        const quizCountResult = await this.persistentService.pgPool.query(
          sql.unsafe`SELECT COUNT(*) as count FROM kedge_practice.quizzes`
        );
        totalQuizzes = parseInt(quizCountResult.rows[0]?.count || '0', 10);
      } catch (dbError) {
        this.logger.warn('Failed to get quiz count from database:', dbError);
        // Continue with 0 count if database query fails
      }
      
      this.logger.log(`Retrieved stats for ${stats.total} knowledge points and ${totalQuizzes} quizzes`);

      return {
        ...stats,
        totalQuizzes,
      };
    } catch (error) {
      this.logger.error('Failed to get knowledge point stats', error);
      throw error;
    }
  }

  @Get('hierarchy-options')
  @ApiOperation({ summary: 'Get available options for knowledge point hierarchy' })
  @ApiQuery({ name: 'volume', description: 'Filter by volume', required: false })
  @ApiQuery({ name: 'unit', description: 'Filter by unit', required: false })
  @ApiQuery({ name: 'lesson', description: 'Filter by lesson', required: false })
  @ApiResponse({
    status: 200,
    description: 'Hierarchy options retrieved successfully',
  })
  async getHierarchyOptions(
    @Query('volume') volume?: string,
    @Query('unit') unit?: string,
    @Query('lesson') lesson?: string,
  ): Promise<{
    volumes: string[];
    units: string[];
    lessons: string[];
    subs: string[];
  }> {
    try {
      const options = this.storage.getHierarchyOptions({
        volume,
        unit,
        lesson,
      });
      
      this.logger.log(`Retrieved hierarchy options: ${options.volumes.length} volumes, ${options.units.length} units, ${options.lessons.length} lessons, ${options.subs.length} subs`);
      
      return options;
    } catch (error) {
      this.logger.error('Failed to get hierarchy options', error);
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
      
      // Get quiz counts for each knowledge point
      const quizCounts = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT 
            knowledge_point_id,
            COUNT(*) as quiz_count
          FROM kedge_practice.quizzes
          WHERE knowledge_point_id IS NOT NULL
          GROUP BY knowledge_point_id
        `
      );
      
      // Create a map of knowledge_point_id to quiz_count
      const quizCountMap = new Map<string, number>();
      quizCounts.rows.forEach(row => {
        quizCountMap.set(row.knowledge_point_id, parseInt(row.quiz_count, 10));
      });
      
      // Add quiz_count to each knowledge point
      const knowledgePointsWithCounts = knowledgePoints.map(kp => ({
        ...kp,
        quiz_count: quizCountMap.get(kp.id) || 0
      }));
      
      this.logger.log(`Retrieved ${knowledgePoints.length} knowledge points with quiz counts`);

      return {
        knowledgePoints: knowledgePointsWithCounts,
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

  @Get('bootstrap/info')
  @ApiOperation({ summary: 'Get knowledge points bootstrap information' })
  @ApiResponse({
    status: 200,
    description: 'Bootstrap information retrieved successfully',
  })
  async getBootstrapInfo(): Promise<{
    count: number;
    lastUpdated: Date | null;
    currentHash: string | null;
  }> {
    try {
      const info = await this.bootstrapService.getBootstrapInfo();
      this.logger.log(`Bootstrap info: ${JSON.stringify(info)}`);
      return info;
    } catch (error) {
      this.logger.error('Failed to get bootstrap info', error);
      throw error;
    }
  }

  @Post('bootstrap/refresh')
  @ApiOperation({ summary: 'Force refresh knowledge points from Excel file' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge points refreshed successfully',
  })
  async forceRefreshKnowledgePoints(): Promise<{
    message: string;
    count: number;
    lastUpdated: Date | null;
  }> {
    try {
      await this.bootstrapService.forceRefresh();
      const info = await this.bootstrapService.getBootstrapInfo();
      
      this.logger.log(`Force refresh completed: ${info.count} knowledge points`);

      return {
        message: 'Knowledge points refreshed successfully from Excel file',
        count: info.count,
        lastUpdated: info.lastUpdated,
      };
    } catch (error) {
      this.logger.error('Failed to force refresh knowledge points', error);
      throw error;
    }
  }

  @Get('smart-suggestions')
  @ApiOperation({ summary: 'Get smart knowledge point suggestions based on user learning history' })
  @ApiQuery({ name: 'userId', description: 'User ID for personalized suggestions', required: false })
  @ApiQuery({ name: 'subjectId', description: 'Subject ID to filter suggestions', required: false })
  @ApiQuery({ name: 'maxPoints', description: 'Maximum number of suggestions (default: 10)', required: false })
  @ApiQuery({ 
    name: 'strategy', 
    description: 'Suggestion strategy: adaptive, balanced, weak_areas, new_topics, review',
    required: false,
    enum: ['adaptive', 'balanced', 'weak_areas', 'new_topics', 'review']
  })
  @ApiResponse({
    status: 200,
    description: 'Smart suggestions retrieved successfully',
  })
  async getSmartSuggestions(
    @Query('userId') userId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('maxPoints') maxPoints?: string,
    @Query('strategy') strategy?: 'adaptive' | 'balanced' | 'weak_areas' | 'new_topics' | 'review',
  ): Promise<{
    success: boolean;
    suggestions: any[];
    metadata: {
      strategy: string;
      userId?: string;
      subjectId?: string;
      generatedAt: string;
    };
  }> {
    try {
      // Default to mock user if not provided (for testing)
      const effectiveUserId = userId || 'anonymous';
      const limit = maxPoints ? parseInt(maxPoints) : 10;

      this.logger.log(`Generating smart suggestions for user: ${effectiveUserId}, strategy: ${strategy || 'adaptive'}`);

      const suggestions = await this.suggestionService.getSmartSuggestions({
        userId: effectiveUserId,
        subjectId,
        maxPoints: limit,
        strategy: strategy || 'adaptive',
      });

      return {
        success: true,
        suggestions,
        metadata: {
          strategy: strategy || 'adaptive',
          userId: effectiveUserId,
          subjectId,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate smart suggestions', error);
      
      // Return basic suggestions as fallback
      return {
        success: false,
        suggestions: [],
        metadata: {
          strategy: 'fallback',
          userId,
          subjectId,
          generatedAt: new Date().toISOString(),
        },
      };
    }
  }
}