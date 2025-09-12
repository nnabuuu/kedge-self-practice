import { Module } from '@nestjs/common';
import { DocxService } from './docx.service';
import { EnhancedDocxService } from './docx.service.enhanced';
import { GptService } from './gpt.service';
import { GPT4Service } from './gpt4.service';
import { GPT5Service } from './gpt5.service';
import { DeepSeekService } from './deepseek.service';
import { LLMService } from './llm.service';

@Module({
  providers: [
    DocxService, 
    EnhancedDocxService, 
    GptService,  // Legacy, will be removed
    GPT4Service, // For GPT-4, GPT-4o models with json_schema
    GPT5Service, // For O1, newer models with limited params
    DeepSeekService, // Clean modular implementation
    LLMService
  ],
  exports: [
    DocxService, 
    EnhancedDocxService, 
    GptService,  // Keep for backward compatibility
    GPT4Service,
    GPT5Service,
    DeepSeekService,
    LLMService
  ],
})
export class QuizParserModule {}
