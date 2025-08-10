import { Module } from '@nestjs/common';
import { DocxService } from './docx.service';
import { GptService } from './gpt.service';

@Module({
  providers: [DocxService, GptService],
  exports: [DocxService, GptService],
})
export class QuizParserModule {}
