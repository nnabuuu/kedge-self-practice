import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { QuizService, EnhancedQuizStorageService, AttachmentMetadata } from '@kedge/quiz';
import {
  QuizItemSchema,
  QuizWithKnowledgePointSchema,
  QuizWithKnowledgePoint,
  QuizItem,
  CreateQuizSchema,
  CreateMultipleQuizzesSchema,
  CreateQuizRequest,
  CreateMultipleQuizzesRequest,
} from '@kedge/models';
import { z } from 'zod';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';

type CreateQuizDto = CreateQuizRequest;
type CreateMultipleQuizzesDto = CreateMultipleQuizzesRequest;

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('quiz')
@ApiBearerAuth()
@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly storageService: EnhancedQuizStorageService,
  ) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiOperation({ summary: 'Submit a single quiz with optional knowledge point' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid quiz data' })
  async submitQuiz(@Body() body: CreateQuizDto) {
    try {
      const validatedData = CreateQuizSchema.parse(body);
      const { quiz } = validatedData;
      
      // Extract base quiz item (without knowledge point fields)
      const quizItem = {
        type: quiz.type,
        question: quiz.question,
        options: quiz.options,
        answer: quiz.answer,
        originalParagraph: quiz.originalParagraph,
        images: quiz.images,
        alternative_answers: quiz.alternative_answers || [],
        hints: quiz.hints,
        extra_properties: quiz.extra_properties
      };

      const createdQuiz = await this.quizService.createQuiz(quizItem);
      
      // TODO: If knowledge point is provided, create the association
      // This would require extending the quiz service to handle knowledge point associations
      
      return {
        success: true,
        data: createdQuiz,
        knowledgePoint: quiz.knowledgePoint,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Failed to create quiz',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('submit-multiple')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiOperation({ summary: 'Submit multiple quizzes at once' })
  @ApiResponse({ status: 201, description: 'Quizzes created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid quiz data' })
  async submitMultipleQuizzes(@Body() body: CreateMultipleQuizzesDto) {
    try {
      const validatedData = CreateMultipleQuizzesSchema.parse(body);
      const { quizzes } = validatedData;
      
      const results = [];
      const errors = [];

      for (let i = 0; i < quizzes.length; i++) {
        try {
          const quiz = quizzes[i];
          const quizItem = {
            type: quiz.type,
            question: quiz.question,
            options: quiz.options,
            answer: quiz.answer,
            originalParagraph: quiz.originalParagraph,
            images: quiz.images,
            tags: quiz.tags,
            knowledge_point_id: quiz.knowledgePoint?.id,
            alternative_answers: quiz.alternative_answers || [],
            hints: quiz.hints,
            extra_properties: quiz.extra_properties
          };

          const createdQuiz = await this.quizService.createQuiz(quizItem);
          results.push({
            index: i,
            success: true,
            data: createdQuiz,
            knowledgePoint: quiz.knowledgePoint,
          });
        } catch (error) {
          errors.push({
            index: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: errors.length === 0,
        totalSubmitted: quizzes.length,
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Failed to create quizzes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('submit-with-images')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Submit a quiz with image attachments' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quiz: { type: 'string', description: 'JSON string of quiz data' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Quiz with images created successfully' })
  async submitQuizWithImages(
    @Body('quiz') quizData: string,
    @UploadedFiles() files: MulterFile[],
  ) {
    try {
      const parsedQuizData = JSON.parse(quizData);
      const validatedData = QuizWithKnowledgePointSchema.parse(parsedQuizData);
      
      // Save attachments using enhanced storage service
      let attachmentMetadata: AttachmentMetadata[] = [];
      if (files && files.length > 0) {
        const attachmentFiles = files.map(file => ({
          filename: file.originalname,
          data: file.buffer,
          mimetype: file.mimetype,
        }));
        
        attachmentMetadata = await this.storageService.saveAttachments(attachmentFiles);
      }
      
      // Build image URLs using the new simplified format
      const imageUrls = attachmentMetadata.map(meta => {
        // Extract filename from relativePath (e.g., "2025/08/uuid.ext" -> "uuid.ext")
        const filename = meta.relativePath.split('/').pop() || meta.storedName;
        return `/attachments/${filename}`;
      });
      
      const quizItem = {
        type: validatedData.type,
        question: validatedData.question,
        options: validatedData.options,
        answer: validatedData.answer,
        originalParagraph: validatedData.originalParagraph,
        images: imageUrls, // Store URLs instead of file paths
        alternative_answers: validatedData.alternative_answers || [],
        hints: validatedData.hints,
        extra_properties: validatedData.extra_properties
      };

      // For backward compatibility, still use the old storage service
      // but we're storing URLs instead of file paths now
      const imageFiles = files?.map(file => ({
        filename: file.originalname,
        data: file.buffer,
      })) || [];

      const createdQuiz = await this.quizService.createQuiz(quizItem, []);

      return {
        success: true,
        data: createdQuiz,
        knowledgePoint: validatedData.knowledgePoint,
        attachments: attachmentMetadata.map(meta => {
          // Extract filename from relativePath for new simplified format
          const filename = meta.relativePath.split('/').pop() || meta.storedName;
          return {
            id: meta.id,
            url: `/attachments/${filename}`,
            originalName: meta.originalName,
            size: meta.size,
            mimetype: meta.mimetype,
          };
        }),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error instanceof SyntaxError) {
        throw new HttpException(
          'Invalid JSON in quiz data',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Failed to create quiz with images',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // IMPORTANT: Specific routes must come BEFORE generic :id route
  // Otherwise NestJS will match :id first and treat "by-ids" as an ID

  @Get('by-ids')
  @ApiOperation({ summary: 'Get multiple quizzes by their IDs' })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated list of quiz IDs', example: 'id1,id2,id3' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  async getQuizzesByIds(@Query('ids') idsString: string) {
    if (!idsString) {
      return {
        success: true,
        data: []
      };
    }

    // Parse comma-separated IDs
    const ids = idsString.split(',').map(id => id.trim()).filter(id => id);
    
    if (ids.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    const quizzes = await this.quizService.getQuizzesByIds(ids);
    
    return {
      success: true,
      total: quizzes.length,
      data: quizzes
    };
  }

  @Get('search/by-tags')
  @ApiOperation({ summary: 'Search quizzes by tags' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  async searchQuizzesByTags(@Query('tags') tags: string) {
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const quizzes = await this.quizService.searchQuizzesByTags(tagArray);
    return {
      success: true,
      count: quizzes.length,
      data: quizzes,
    };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all available tags' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async getAllTags() {
    const tags = await this.quizService.getAllTags();
    return {
      success: true,
      count: tags.length,
      data: tags,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuiz(@Param('id') id: string) {
    const quiz = await this.quizService.findQuizById(id);
    if (!quiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    return {
      success: true,
      data: quiz,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all quizzes with optional pagination and search' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'knowledge_point_id', required: false, description: 'Filter by knowledge point ID(s) - supports single ID or comma-separated multiple IDs' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for quiz questions' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by quiz type' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  async listQuizzes(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('knowledge_point_id') knowledgePointIds?: string,
    @Query('search') searchTerm?: string,
    @Query('type') quizType?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const offset = (page - 1) * limit;

    // Get all quizzes for now (pagination can be added at repository level later)
    let allQuizzes = await this.quizService.listQuizzes();

    // Filter by search term if provided (supports Chinese characters)
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      allQuizzes = allQuizzes.filter(quiz => {
        // Search in question text
        if (quiz.question && quiz.question.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Also search in options for multiple choice questions
        if (quiz.options && Array.isArray(quiz.options)) {
          return quiz.options.some(option =>
            option && option.toLowerCase().includes(searchLower)
          );
        }
        return false;
      });
    }

    // Filter by type if provided
    if (quizType && quizType !== 'all') {
      allQuizzes = allQuizzes.filter(quiz => quiz.type === quizType);
    }

    // Filter by knowledge point ID(s) if provided
    if (knowledgePointIds) {
      // Support both single ID and comma-separated multiple IDs
      const idsArray = knowledgePointIds.split(',').map(id => id.trim()).filter(id => id);
      if (idsArray.length > 0) {
        allQuizzes = allQuizzes.filter(quiz => quiz.knowledge_point_id && idsArray.includes(quiz.knowledge_point_id));
      }
    }

    // Apply pagination in memory for now
    const paginatedQuizzes = allQuizzes.slice(offset, offset + limit);

    return {
      success: true,
      count: paginatedQuizzes.length,
      total: allQuizzes.length,
      page,
      limit,
      data: paginatedQuizzes,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiOperation({ summary: 'Delete a quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async deleteQuiz(@Param('id') id: string) {
    const deleted = await this.quizService.deleteQuiz(id);
    if (!deleted) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
    return {
      success: true,
      message: 'Quiz deleted successfully',
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiOperation({ summary: 'Update a quiz by ID' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async updateQuiz(@Param('id') id: string, @Body() body: Partial<QuizItem>) {
    try {
      const validatedQuiz = QuizItemSchema.partial().parse(body);
      const updatedQuiz = await this.quizService.updateQuiz(id, validatedQuiz);
      
      if (!updatedQuiz) {
        throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        data: updatedQuiz,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Failed to update quiz',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}