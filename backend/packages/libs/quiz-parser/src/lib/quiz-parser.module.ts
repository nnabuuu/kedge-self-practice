import { Module } from '@nestjs/common';
import { DocxService } from './docx.service';
import { EnhancedDocxService } from './docx.service.enhanced';
import { GptService } from './gpt.service';
import { DeepSeekService } from './deepseek.service';
import { LLMService } from './llm.service';

@Module({
  providers: [DocxService, EnhancedDocxService, GptService, DeepSeekService, LLMService],
  exports: [DocxService, EnhancedDocxService, GptService, DeepSeekService, LLMService],
})
export class QuizParserModule {}
