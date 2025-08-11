import { Module } from '@nestjs/common';
import { DocxService } from './docx.service';
import { EnhancedDocxService } from './docx.service.enhanced';
import { GptService } from './gpt.service';

@Module({
  providers: [DocxService, EnhancedDocxService, GptService],
  exports: [DocxService, EnhancedDocxService, GptService],
})
export class QuizParserModule {}
