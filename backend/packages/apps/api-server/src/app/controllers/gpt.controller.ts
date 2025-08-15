import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, TeacherGuard } from '@kedge/auth';
import { GptService } from '@kedge/quiz-parser';
import { QuizItem, ParagraphBlock } from '@kedge/models';

@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('v1/gpt')
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('extract-quiz')
  async extractQuiz(
    @Body()
    body: {
      paragraphs: ParagraphBlock[];
    },
  ) {
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
