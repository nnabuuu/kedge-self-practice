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
    console.log('=== Verifying paragraphsForGPT ===');
    const gptDataSize = JSON.stringify(paragraphsForGPT).length;
    console.log('paragraphsForGPT JSON size:', gptDataSize, 'characters');
    console.log('paragraphsForGPT estimated tokens:', Math.ceil(gptDataSize / 4));
    console.log('=== End Verification ===');
    
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
    
    console.log(`Found ${referencedImageIds.size} referenced images out of ${allImages.length} total images`);
    console.log('Referenced image IDs:', Array.from(referencedImageIds));
    
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
        console.log(`Warning: Referenced image ${tempUuid} not found in image data map`);
        continue;
      }
      try {
        // Skip empty images
        if (!docxImage.data || docxImage.data.length === 0) {
          console.log(`Skipping empty referenced image: ${docxImage.filename} (size: 0 bytes)`);
          continue;
        }
        
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
            // Skip this image if conversion fails
            console.warn(`Failed to convert ${filename}: ${conversionResult.error || 'Unknown error'}`);
            console.log(`Skipping ${filename} due to conversion failure`);
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
          console.log(`Skipped saving empty attachment: ${filename} (returned null from storage)`);
          continue;
        }
        
        console.log(`Saved referenced image: ${filename} (size: ${metadata.size} bytes, id: ${metadata.id})`);
        
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
    
    console.log(`Uploaded ${savedImages.length} images that were referenced in quiz content`);
    
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
