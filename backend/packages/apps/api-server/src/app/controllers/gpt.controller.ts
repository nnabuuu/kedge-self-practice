import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { GptService, LLMService } from '@kedge/quiz-parser';
import { QuizItem, GptParagraphBlock, QuizExtractionOptions } from '@kedge/models';

@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('gpt')
export class GptController {
  constructor(
    private readonly gptService: GptService,
    private readonly llmService: LLMService
  ) {}

  @Post('extract-quiz')
  async extractQuiz(
    @Body()
    body: {
      paragraphs: GptParagraphBlock[];
      options?: QuizExtractionOptions;
    },
  ) {
    
    if (body.paragraphs && body.paragraphs.length > 0) {
      const totalSize = JSON.stringify(body.paragraphs).length;
      
      // Check what's actually in the first few paragraphs
      body.paragraphs.forEach((p, idx) => {
        // Log paragraphs with images
        if (p.paragraph && p.paragraph.includes('{{image:')) {
        }
        // Log paragraphs with highlights
        if (p.highlighted && p.highlighted.length > 0) {
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
      
      if (body.options?.targetTypes) {
      }
      const results = await this.llmService.extractQuizItems(cleanedParagraphs, body.options);
      results.forEach((item, idx) => {
        if (item.question?.includes('{{image:')) {
        }
      });
      return results;
    }
    
    if (body.options?.targetTypes) {
    }
    const results = await this.llmService.extractQuizItems(body.paragraphs, body.options);
    return results;
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
      answer: '',
      alternative_answers: []
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
