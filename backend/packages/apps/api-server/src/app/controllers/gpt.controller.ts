import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { GptService } from '@kedge/quiz-parser';
import { QuizItem, GptParagraphBlock } from '@kedge/models';

@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('v1/gpt')
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('extract-quiz')
  async extractQuiz(
    @Body()
    body: {
      paragraphs: GptParagraphBlock[];
    },
  ) {
    console.log('=== DIRECT GPT Controller Debug ===');
    console.log('Direct GPT call - paragraphs count:', body.paragraphs?.length || 0);
    
    if (body.paragraphs && body.paragraphs.length > 0) {
      const totalSize = JSON.stringify(body.paragraphs).length;
      console.log('Direct GPT call - total data size:', totalSize, 'characters');
      console.log('Direct GPT call - using GptParagraphBlock (no images)');
      
      // Check what's actually in the first few paragraphs
      console.log('=== Analyzing received data structure ===');
      body.paragraphs.slice(0, 3).forEach((p, idx) => {
        console.log(`Paragraph ${idx} keys:`, Object.keys(p));
        console.log(`Paragraph ${idx} text length:`, p.paragraph?.length || 0);
        console.log(`Paragraph ${idx} JSON size:`, JSON.stringify(p).length);
        if (p.highlighted) {
          console.log(`Paragraph ${idx} highlights count:`, p.highlighted.length);
        }
        
        // Check if there are any unexpected properties
        const unexpectedKeys = Object.keys(p).filter(key => !['paragraph', 'highlighted'].includes(key));
        if (unexpectedKeys.length > 0) {
          console.error(`Paragraph ${idx} has unexpected keys:`, unexpectedKeys);
          unexpectedKeys.forEach(key => {
            const value = (p as any)[key];
            if (Array.isArray(value)) {
              console.error(`  ${key}: array with ${value.length} items`);
              if (value.length > 0) {
                console.error(`  ${key}[0] keys:`, Object.keys(value[0] || {}));
                if (value[0]?.data) {
                  console.error(`  ${key}[0].data size:`, Buffer.isBuffer(value[0].data) ? value[0].data.length : JSON.stringify(value[0].data).length);
                }
              }
            } else {
              console.error(`  ${key}:`, typeof value, value?.length || 'no length');
            }
          });
        }
      });
      
      // Clean the data to ensure it only has text and highlights
      const cleanedParagraphs: GptParagraphBlock[] = body.paragraphs.map(p => ({
        paragraph: p.paragraph || '',
        highlighted: Array.isArray(p.highlighted) ? p.highlighted.map(h => ({
          text: String(h.text || ''),
          color: String(h.color || '')
        })) : [],
      }));
      
      const cleanedSize = JSON.stringify(cleanedParagraphs).length;
      console.log('After cleaning - size:', cleanedSize, 'characters');
      console.log('After cleaning - estimated tokens:', Math.ceil(cleanedSize / 4));
      
      console.log('=== Calling GPT service with cleaned data ===');
      return this.gptService.extractQuizItems(cleanedParagraphs);
    }
    
    console.log('=== Calling GPT service from direct controller ===');
    return this.gptService.extractQuizItems(body.paragraphs);
  }

  @Post('polish-quiz')
  async polishQuiz(@Body() body: { item: QuizItem; guidance?: string }) {
    return this.gptService.polishQuizItem(body.item, body.guidance);
  }
  
  @Post('polish-question')
  async polishQuestion(@Body() body: { 
    question: string; 
    type?: string;
    options?: string[];
    guidance?: string 
  }) {
    // Create a temporary quiz item for polishing
    const tempItem: QuizItem = {
      type: (body.type as QuizItem['type']) || 'single-choice',
      question: body.question,
      options: body.options || [],
      answer: ''
    };
    
    const polished = await this.gptService.polishQuizItem(tempItem, body.guidance);
    return {
      polishedQuestion: polished.question,
      original: body.question
    };
  }

  @Post('change-quiz-type')
  async changeQuizType(
    @Body() body: { item: QuizItem; newType: QuizItem['type'] },
  ) {
    return this.gptService.changeQuizItemType(body.item, body.newType);
  }
}
