import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { QuizService, EnhancedQuizStorageService, AttachmentMetadata } from '@kedge/quiz';
import { QuizItemSchema, QuizWithKnowledgePointSchema, QuizWithKnowledgePoint } from '@kedge/models';
import { z } from 'zod';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

const CreateQuizSchema = z.object({
  quiz: QuizWithKnowledgePointSchema,
});

const CreateMultipleQuizzesSchema = z.object({
  quizzes: z.array(QuizWithKnowledgePointSchema),
});

type CreateQuizDto = z.infer<typeof CreateQuizSchema>;
type CreateMultipleQuizzesDto = z.infer<typeof CreateMultipleQuizzesSchema>;

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('quiz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly storageService: EnhancedQuizStorageService,
  ) {}

  @Post('submit')
  @UseGuards(TeacherGuard)
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
  @UseGuards(TeacherGuard)
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
  @UseGuards(TeacherGuard)
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
      
      // Build image URLs that can be accessed via the attachments endpoint
      const imageUrls = attachmentMetadata.map(
        meta => `/attachments/quiz/${meta.relativePath}`
      );
      
      const quizItem = {
        type: validatedData.type,
        question: validatedData.question,
        options: validatedData.options,
        answer: validatedData.answer,
        originalParagraph: validatedData.originalParagraph,
        images: imageUrls, // Store URLs instead of file paths
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
        attachments: attachmentMetadata.map(meta => ({
          id: meta.id,
          url: `/attachments/quiz/${meta.relativePath}`,
          originalName: meta.originalName,
          size: meta.size,
          mimetype: meta.mimetype,
        })),
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
  @ApiOperation({ summary: 'List all quizzes' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  async listQuizzes() {
    const quizzes = await this.quizService.listQuizzes();
    return {
      success: true,
      count: quizzes.length,
      data: quizzes,
    };
  }
}