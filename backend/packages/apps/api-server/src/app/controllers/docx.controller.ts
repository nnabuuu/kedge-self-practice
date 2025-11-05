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
    
    const paragraphs = await this.docxService.extractAllHighlights(file.buffer);
    
    // Check if legacy service is returning image data (it shouldn't)
    const hasImages = paragraphs.some(p => p.images && p.images.length > 0);
    
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
    
    // Extract paragraphs and images from DOCX
    const { paragraphs, allImages } = await this.enhancedDocxService.extractAllHighlightsWithImages(file.buffer);
    
    
    // Check total content size before processing
    const totalContentSize = JSON.stringify(paragraphs).length;
    
    // Log sample of first few paragraphs (if any)
    if (paragraphs.length > 0) {
      
      if (paragraphs.length > 1) {
      }
      
      // Find first paragraph with images to analyze the structure
      const firstImageParagraph = paragraphs.find(p => p.images && p.images.length > 0);
      if (firstImageParagraph) {
        const firstImage = firstImageParagraph.images[0];
      }
    }
    
    
    // First, create temporary image mappings without uploading
    // We'll only upload images that are actually referenced in the parsed content
    const tempImageIdMap = new Map<string, string>(); // original path → temporary UUID
    const imageDataMap = new Map<string, any>(); // UUID → image data for later upload
    
    // Generate temporary UUIDs for all images
    allImages.forEach(docxImage => {
      const tempUuid = `temp_${Math.random().toString(36).substring(2, 15)}`;
      tempImageIdMap.set(docxImage.id, tempUuid);
      imageDataMap.set(tempUuid, docxImage);
    });
    
    // Create paragraphs for GPT with temporary UUID placeholders
    const paragraphsForGPT: GptParagraphBlock[] = paragraphs.map(para => {
      let processedText = para.paragraph || '';
      
      // Replace {{image:original-path}} with {{image:temp-uuid}}
      tempImageIdMap.forEach((tempUuid, originalPath) => {
        const originalPlaceholder = `{{image:${originalPath}}}`;
        const uuidPlaceholder = `{{image:${tempUuid}}}`;
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
    const gptDataSize = JSON.stringify(paragraphsForGPT).length;
    
    // Generate quiz items using LLM
    const quizItems = await this.llmService.extractQuizItems(paragraphsForGPT);
    
    // Now identify which images are actually referenced in the quiz items
    const referencedImageIds = new Set<string>();
    const imageRegex = /\{\{image:([^}]+)\}\}/g;
    
    // Check quiz items for image references
    quizItems.forEach(item => {
      // Check question text
      const questionMatches = (item.question || '').matchAll(imageRegex);
      for (const match of questionMatches) {
        referencedImageIds.add(match[1]);
      }
      
      // Check options if they exist
      if (item.options) {
        Object.values(item.options).forEach(option => {
          const optionMatches = (option as string).matchAll(imageRegex);
          for (const match of optionMatches) {
            referencedImageIds.add(match[1]);
          }
        });
      }
      
      // Note: Quiz items don't have explanation field in current model
    });
    
    
    // Now only save the referenced images
    const savedImages: Array<{
      id: string;
      url: string;
      filename: string;
      originalDocxId: string;
      size: number;
      contentType: string;
    }> = [];
    
    const tempToRealUuidMap = new Map<string, string>(); // temp UUID → real saved UUID
    
    for (const tempUuid of referencedImageIds) {
      const docxImage = imageDataMap.get(tempUuid);
      if (!docxImage) {
        continue;
      }
      try {
        // Skip empty images
        if (!docxImage.data || docxImage.data.length === 0) {
          continue;
        }
        
        let imageData = docxImage.data;
        let filename = docxImage.filename;
        let contentType = docxImage.contentType;
        
        // Check if it's an EMF/WMF file that needs conversion
        const ext = filename.toLowerCase();
        if (ext.endsWith('.emf') || ext.endsWith('.wmf')) {
          
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
          } else {
            // Skip this image if conversion fails
            continue; // Skip this image
          }
        }
        
        const metadata = await this.storageService.saveAttachment({
          filename: filename,
          data: imageData,
          mimetype: contentType,
        });
        
        // Skip if metadata is null (empty file)
        if (!metadata) {
          continue;
        }
        
        
        // Map temp UUID to real saved UUID
        tempToRealUuidMap.set(tempUuid, metadata.id);
        
        savedImages.push({
          id: metadata.id,
          url: `/v1/attachments/${metadata.storedName}`,
          filename: filename,
          originalDocxId: docxImage.id,
          size: metadata.size,
          contentType: metadata.mimetype,
        });
      } catch (error) {
        console.error(`Failed to process referenced image ${docxImage.filename}:`, error);
      }
    }
    
    
    // Now replace temp UUIDs with real UUIDs in quiz items
    const finalQuizItems = quizItems.map(item => {
      let updatedItem = { ...item };
      
      // Replace temp UUIDs in question
      if (updatedItem.question) {
        tempToRealUuidMap.forEach((realUuid, tempUuid) => {
          updatedItem.question = updatedItem.question.replace(
            new RegExp(`\\{\\{image:${tempUuid}\\}\\}`, 'g'),
            `{{image:${realUuid}}}`
          );
        });
      }
      
      // Replace temp UUIDs in options
      if (updatedItem.options) {
        const updatedOptions: any = {};
        Object.entries(updatedItem.options).forEach(([key, value]) => {
          let updatedValue = value as string;
          tempToRealUuidMap.forEach((realUuid, tempUuid) => {
            updatedValue = updatedValue.replace(
              new RegExp(`\\{\\{image:${tempUuid}\\}\\}`, 'g'),
              `{{image:${realUuid}}}`
            );
          });
          updatedOptions[key] = updatedValue;
        });
        updatedItem.options = updatedOptions;
      }
      
      // Note: Quiz items don't have explanation field in current model
      
      return updatedItem;
    });
    
    // Create final UUID to URL mapping for frontend
    const uuidToUrlMap = new Map<string, string>();
    savedImages.forEach(img => {
      uuidToUrlMap.set(img.id, img.url);
    });
    
    // Create clean paragraphs for response with real UUIDs
    const cleanParagraphs = paragraphs.map(para => {
      let processedText = para.paragraph || '';
      
      // First replace original paths with temp UUIDs
      tempImageIdMap.forEach((tempUuid, originalPath) => {
        const originalPlaceholder = `{{image:${originalPath}}}`;
        const tempPlaceholder = `{{image:${tempUuid}}}`;
        processedText = processedText.replace(
          new RegExp(escapeRegExp(originalPlaceholder), 'g'),
          tempPlaceholder
        );
      });
      
      // Then replace temp UUIDs with real UUIDs (only for referenced images)
      tempToRealUuidMap.forEach((realUuid, tempUuid) => {
        processedText = processedText.replace(
          new RegExp(`\\{\\{image:${tempUuid}\\}\\}`, 'g'),
          `{{image:${realUuid}}}`
        );
      });
      
      return {
        paragraph: processedText,
        highlighted: para.highlighted || []
      };
    });
    
    return {
      success: true,
      quizItems: finalQuizItems, // Use quiz items with real UUIDs
      extractedImages: savedImages,
      paragraphs: cleanParagraphs, // Use clean paragraphs without image data
      imageMapping: Object.fromEntries(uuidToUrlMap),
    };
  }
}
