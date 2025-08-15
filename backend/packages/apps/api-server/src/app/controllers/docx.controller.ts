import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { DocxService, EnhancedDocxService, GptService } from '@kedge/quiz-parser';
import { EnhancedQuizStorageService } from '@kedge/quiz';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ParagraphBlock, GptParagraphBlock } from '@kedge/models';

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
    console.log('=== LEGACY DOCX Extraction Debug (extract-quiz endpoint) ===');
    console.log('Uploaded file size:', file.buffer.length, 'bytes');
    console.log('File name:', file.originalname);
    
    const paragraphs = await this.docxService.extractAllHighlights(file.buffer);
    console.log('Legacy extraction - paragraphs count:', paragraphs.length);
    
    // Check if legacy service is returning image data (it shouldn't)
    const hasImages = paragraphs.some(p => p.images && p.images.length > 0);
    console.log('Legacy extraction - has images:', hasImages);
    
    if (hasImages) {
      console.error('ERROR: Legacy service returned image data!');
      paragraphs.forEach((p, idx) => {
        if (p.images && p.images.length > 0) {
          console.error(`Legacy paragraph ${idx} has ${p.images.length} images`);
          p.images.forEach((img: any, imgIdx: number) => {
            if (img.data) {
              console.error(`Legacy image ${imgIdx} has data size:`, Buffer.isBuffer(img.data) ? img.data.length : JSON.stringify(img.data).length);
            }
          });
        }
      });
    }
    
    // Convert to GPT-safe format (remove images)
    const gptParagraphs: GptParagraphBlock[] = paragraphs.map(para => ({
      paragraph: para.paragraph || '',
      highlighted: Array.isArray(para.highlighted) ? para.highlighted.map(h => ({
        text: h.text || '',
        color: h.color || ''
      })) : [],
    }));
    
    console.log('=== Calling GPT with legacy paragraphs (converted to GPT format) ===');
    return this.gptService.extractQuizItems(gptParagraphs);
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
    console.log('=== DOCX Extraction Debug (extract-quiz-with-images endpoint) ===');
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
      
      // Find first paragraph with images to analyze the structure
      const firstImageParagraph = paragraphs.find(p => p.images && p.images.length > 0);
      if (firstImageParagraph) {
        console.log('First paragraph with images has', firstImageParagraph.images.length, 'images');
        const firstImage = firstImageParagraph.images[0];
        console.log('First image structure keys:', Object.keys(firstImage));
        console.log('First image has data?', !!firstImage.data);
        console.log('First image data size:', firstImage.data ? (Buffer.isBuffer(firstImage.data) ? firstImage.data.length : JSON.stringify(firstImage.data).length) : 0);
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
    
    // Create paragraphs for GPT (only text and highlights, NO images or Buffer data)
    const paragraphsForGPT: GptParagraphBlock[] = paragraphs.map(para => ({
      paragraph: para.paragraph || '',
      highlighted: Array.isArray(para.highlighted) ? para.highlighted.map(h => ({
        text: h.text || '',
        color: h.color || ''
      })) : [],
    }));
    
    // Debug: Verify paragraphsForGPT doesn't contain Buffer data
    console.log('=== Verifying paragraphsForGPT ===');
    const gptDataSize = JSON.stringify(paragraphsForGPT).length;
    console.log('paragraphsForGPT JSON size:', gptDataSize, 'characters');
    console.log('paragraphsForGPT estimated tokens:', Math.ceil(gptDataSize / 4));
    
    // Check if any paragraphsForGPT has image data (should be none)
    const hasImageDataInGPT = paragraphsForGPT.some(p => p.images && p.images.length > 0);
    console.log('paragraphsForGPT has any images:', hasImageDataInGPT);
    
    if (hasImageDataInGPT) {
      console.error('ERROR: paragraphsForGPT still contains image data!');
      paragraphsForGPT.forEach((p, idx) => {
        if (p.images && p.images.length > 0) {
          console.error(`paragraphsForGPT[${idx}] has ${p.images.length} images`);
        }
      });
    }
    console.log('=== End Verification ===');
    
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
