import { Controller, Post, UploadedFile, UseInterceptors, UseGuards, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { DocxService, EnhancedDocxService, GptService, LLMService } from '@kedge/quiz-parser';
import { EnhancedQuizStorageService, ImageConverterService } from '@kedge/quiz';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ParagraphBlock, GptParagraphBlock } from '@kedge/models';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  [key: string]: unknown;
}

// Utility function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@ApiTags('docx')
@Controller('docx')
export class DocxController {
  constructor(
    private readonly docxService: DocxService,
    private readonly enhancedDocxService: EnhancedDocxService,
    private readonly gptService: GptService,
    private readonly llmService: LLMService,
    private readonly storageService: EnhancedQuizStorageService,
    private readonly imageConverter: ImageConverterService,
  ) {}

  @Get('llm-provider')
  @ApiOperation({ summary: 'Get comprehensive LLM configuration and provider information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Current LLM configuration details (excluding sensitive data)',
    schema: {
      type: 'object',
      properties: {
        configuration: {
          type: 'object',
          properties: {
            apiKeyConfigured: { type: 'boolean' },
            baseURL: { type: 'string' },
            organization: { type: 'string' }
          }
        },
        models: {
          type: 'object',
          description: 'Model configurations for each use case'
        },
        providers: {
          type: 'object',
          description: 'Detected providers for each use case'
        },
        baseUrls: {
          type: 'object',
          description: 'Base URLs for each provider'
        },
        envVariables: {
          type: 'object',
          description: 'Environment variable names for configuration'
        },
        tips: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  getLLMProvider() {
    return this.llmService.getFullConfiguration();
  }

  @Post('extract-quiz')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiBearerAuth()
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
    
    console.log('=== Calling LLM with legacy paragraphs (converted to GPT format) ===');
    return this.llmService.extractQuizItems(gptParagraphs);
  }

  @Post('extract-quiz-with-images')
  @UseGuards(JwtAuthGuard, TeacherGuard)
  @ApiBearerAuth()
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
        let imageData = docxImage.data;
        let filename = docxImage.filename;
        let contentType = docxImage.contentType;
        
        // Check if it's an EMF/WMF file that needs conversion
        const ext = filename.toLowerCase();
        if (ext.endsWith('.emf') || ext.endsWith('.wmf')) {
          console.log(`Converting ${filename} from EMF/WMF to PNG...`);
          
          const conversionResult = await this.imageConverter.convertEmfWmf(
            docxImage.data,
            ext.endsWith('.emf') ? 'emf' : 'wmf',
            { format: 'png', quality: 95 }
          );
          
          if (conversionResult.success && conversionResult.outputBuffer) {
            // Use converted image
            imageData = conversionResult.outputBuffer;
            filename = filename.replace(/\.(emf|wmf)$/i, '.png');
            contentType = 'image/png';
            console.log(`Successfully converted ${docxImage.filename} to PNG`);
          } else {
            console.warn(`Failed to convert ${filename}: ${conversionResult.error}`);
            // Continue with original file, but it may not display
          }
        }
        
        const metadata = await this.storageService.saveAttachment({
          filename: filename,
          data: imageData,
          mimetype: contentType,
        });
        
        savedImages.push({
          id: metadata.id,
          url: `/v1/attachments/${metadata.storedName}`,
          filename: filename,
          originalDocxId: docxImage.id,
          size: metadata.size,
          contentType: metadata.mimetype,
        });
      } catch (error) {
        console.error(`Failed to process image ${docxImage.filename}:`, error);
      }
    }
    
    // Create a mapping of original image paths to saved image UUIDs
    const imageIdMap = new Map<string, string>();
    const imageUrlMap = new Map<string, string>();
    const uuidToUrlMap = new Map<string, string>(); // UUID → URL for frontend
    allImages.forEach((docxImage, index) => {
      const savedImage = savedImages.find(img => img.originalDocxId === docxImage.id);
      if (savedImage) {
        imageIdMap.set(docxImage.id, savedImage.id); // original path → saved UUID
        imageUrlMap.set(docxImage.id, savedImage.url); // original path → saved URL  
        uuidToUrlMap.set(savedImage.id, savedImage.url); // saved UUID → saved URL (for frontend)
      }
    });
    
    // Create paragraphs for GPT with UUID-based image placeholders
    const paragraphsForGPT: GptParagraphBlock[] = paragraphs.map(para => {
      let processedText = para.paragraph || '';
      
      // Replace {{image:original-path}} with {{image:uuid}}
      imageIdMap.forEach((savedUuid, originalPath) => {
        const originalPlaceholder = `{{image:${originalPath}}}`;
        const uuidPlaceholder = `{{image:${savedUuid}}}`;
        processedText = processedText.replace(new RegExp(escapeRegExp(originalPlaceholder), 'g'), uuidPlaceholder);
      });
      
      return {
        paragraph: processedText,
        highlighted: Array.isArray(para.highlighted) ? para.highlighted.map(h => ({
          text: h.text || '',
          color: h.color || ''
        })) : [],
      };
    });
    
    // Debug: Verify paragraphsForGPT doesn't contain Buffer data
    console.log('=== Verifying paragraphsForGPT ===');
    const gptDataSize = JSON.stringify(paragraphsForGPT).length;
    console.log('paragraphsForGPT JSON size:', gptDataSize, 'characters');
    console.log('paragraphsForGPT estimated tokens:', Math.ceil(gptDataSize / 4));
    
    // paragraphsForGPT should never have images (GptParagraphBlock type doesn't include images)
    console.log('paragraphsForGPT uses GptParagraphBlock type (no images by design)');
    console.log('=== End Verification ===');
    
    // Update paragraphs to include saved image URLs AND UUID placeholders for response
    const enhancedParagraphs = paragraphs.map(para => {
      let processedText = para.paragraph || '';
      
      // Replace {{image:original-path}} with {{image:uuid}} in the response paragraphs too
      imageIdMap.forEach((savedUuid, originalPath) => {
        const originalPlaceholder = `{{image:${originalPath}}}`;
        const uuidPlaceholder = `{{image:${savedUuid}}}`;
        processedText = processedText.replace(new RegExp(escapeRegExp(originalPlaceholder), 'g'), uuidPlaceholder);
      });
      
      return {
        ...para,
        paragraph: processedText, // Use the UUID-processed text
        images: para.images.map(img => {
          const savedImage = savedImages.find(saved => saved.originalDocxId === img.id);
          return savedImage ? {
            ...img,
            url: savedImage.url,
            savedId: savedImage.id,
          } : img;
        }),
      };
    });
    
    // Generate quiz items using configured LLM (OpenAI or DeepSeek) with placeholder paragraphs (no image data)
    const quizItems = await this.llmService.extractQuizItems(paragraphsForGPT);
    
    return {
      success: true,
      quizItems,
      extractedImages: savedImages,
      paragraphs: enhancedParagraphs,
      imageMapping: Object.fromEntries(uuidToUrlMap),
    };
  }
}
