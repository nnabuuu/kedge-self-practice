import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { DocxService, EnhancedDocxService, GptService } from '@kedge/quiz-parser';
import { EnhancedQuizStorageService } from '@kedge/quiz';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ParagraphBlock } from '@kedge/models';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  [key: string]: unknown;
}

@ApiTags('docx')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('v1/docx')
export class DocxController {
  constructor(
    private readonly docxService: DocxService,
    private readonly enhancedDocxService: EnhancedDocxService,
    private readonly gptService: GptService,
    private readonly storageService: EnhancedQuizStorageService,
  ) {}

  @Post('extract-quiz')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Extract quiz from DOCX file (legacy - no images)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Quiz extracted successfully' })
  async extractQuiz(@UploadedFile() file: MulterFile) {
    const paragraphs = await this.docxService.extractAllHighlights(file.buffer);
    return this.gptService.extractQuizItems(paragraphs);
  }

  @Post('extract-quiz-with-images')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Extract quiz from DOCX file including embedded images' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Quiz extracted with images successfully',
    schema: {
      type: 'object',
      properties: {
        quizItems: {
          type: 'array',
          items: { type: 'object' }
        },
        extractedImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' },
              filename: { type: 'string' },
              size: { type: 'number' },
              contentType: { type: 'string' }
            }
          }
        },
        paragraphs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              paragraph: { type: 'string' },
              highlighted: { type: 'array' },
              images: { type: 'array' }
            }
          }
        }
      }
    }
  })
  async extractQuizWithImages(@UploadedFile() file: MulterFile) {
    console.log('=== DOCX Extraction Debug ===');
    console.log('Uploaded file size:', file.buffer.length, 'bytes');
    console.log('File name:', file.originalname);
    
    // Extract paragraphs and images from DOCX
    const { paragraphs, allImages } = await this.enhancedDocxService.extractAllHighlightsWithImages(file.buffer);
    
    console.log('Extracted paragraphs count:', paragraphs.length);
    console.log('Extracted images count:', allImages.length);
    
    // Check total content size before processing
    const totalContentSize = JSON.stringify(paragraphs).length;
    console.log('Total extracted content size:', totalContentSize, 'characters');
    console.log('Estimated tokens from extraction:', Math.ceil(totalContentSize / 4));
    
    // Log sample of first few paragraphs (if any)
    if (paragraphs.length > 0) {
      console.log('First paragraph text length:', paragraphs[0].paragraph?.length || 0);
      console.log('First paragraph sample:', paragraphs[0].paragraph?.substring(0, 200) || 'No text');
      console.log('First paragraph image count:', paragraphs[0].images?.length || 0);
      
      if (paragraphs.length > 1) {
        console.log('Second paragraph text length:', paragraphs[1].paragraph?.length || 0);
      }
    }
    
    console.log('=== End DOCX Extraction Debug ===');
    
    // Save extracted images using the storage service
    const savedImages: Array<{
      id: string;
      url: string;
      filename: string;
      originalDocxId: string;
      size: number;
      contentType: string;
    }> = [];
    for (const docxImage of allImages) {
      try {
        const metadata = await this.storageService.saveAttachment({
          filename: docxImage.filename,
          data: docxImage.data,
          mimetype: docxImage.contentType,
        });
        
        savedImages.push({
          id: metadata.id,
          url: `/attachments/quiz/${metadata.relativePath}`,
          filename: docxImage.filename,
          originalDocxId: docxImage.id,
          size: metadata.size,
          contentType: metadata.mimetype,
        });
      } catch (error) {
        console.error(`Failed to save image ${docxImage.filename}:`, error);
      }
    }
    
    // Create a mapping of original image paths to new URLs for GPT processing
    const imageUrlMap = new Map<string, string>();
    allImages.forEach((docxImage, index) => {
      const savedImage = savedImages.find(img => img.originalDocxId === docxImage.id);
      if (savedImage) {
        imageUrlMap.set(docxImage.id, savedImage.url);
      }
    });
    
    // Create paragraphs for GPT (only text and highlights, empty images array)
    const paragraphsForGPT: ParagraphBlock[] = paragraphs.map(para => ({
      paragraph: para.paragraph,
      highlighted: para.highlighted,
      images: [], // Empty array to satisfy ParagraphBlock type, GPT doesn't process images
    }));
    
    // Update paragraphs to include saved image URLs for response
    const enhancedParagraphs = paragraphs.map(para => ({
      ...para,
      images: para.images.map(img => {
        const savedImage = savedImages.find(saved => saved.originalDocxId === img.id);
        return savedImage ? {
          ...img,
          url: savedImage.url,
          savedId: savedImage.id,
        } : img;
      }),
    }));
    
    // Generate quiz items using GPT with placeholder paragraphs (no image data)
    const quizItems = await this.gptService.extractQuizItems(paragraphsForGPT);
    
    return {
      success: true,
      quizItems,
      extractedImages: savedImages,
      paragraphs: enhancedParagraphs,
      imageMapping: Object.fromEntries(imageUrlMap),
    };
  }
}
