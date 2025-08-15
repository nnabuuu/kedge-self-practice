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
    }
    
    console.log('=== Calling GPT service from direct controller ===');
    return this.gptService.extractQuizItems(body.paragraphs);
  }

  @Post('polish-quiz')
  async polishQuiz(@Body() body: { item: QuizItem }) {
    return this.gptService.polishQuizItem(body.item);
  }

  @Post('change-quiz-type')
  async changeQuizType(
    @Body() body: { item: QuizItem; newType: QuizItem['type'] },
  ) {
    return this.gptService.changeQuizItemType(body.item, body.newType);
  }
}
