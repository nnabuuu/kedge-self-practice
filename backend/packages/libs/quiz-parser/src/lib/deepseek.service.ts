import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionOptions } from '@kedge/models';
import { getDeepSeekConfig, getModelConfig, getAutoBaseURL } from '@kedge/configs';
import { JsonParserUtility, QuizValidatorUtility, FillInBlankUtility } from './utils';

type GeneratableQuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

/**
 * DeepSeek Service - Clean modular implementation with utilities
 */
@Injectable()
export class DeepSeekService {
  private readonly deepseek: OpenAI;
  private readonly config = getDeepSeekConfig();

  constructor() {
    const baseURL = this.config.baseURL || getAutoBaseURL('deepseek');
    
    this.deepseek = new OpenAI({
      apiKey: this.config.apiKey || 'dummy',
      baseURL: baseURL,
    });
  }

  /**
   * Extract quiz items from paragraphs
   */
  async extractQuizItems(
    paragraphs: GptParagraphBlock[], 
    options?: QuizExtractionOptions
  ): Promise<QuizItem[]> {
    // Validate input size
    if (!this.validateInputSize(paragraphs)) {
      return this.createOversizedErrorResponse();
    }

    // Truncate if needed for safety
    const safeParagraphs = this.truncateIfNeeded(paragraphs);
    
    // Check if we should use optimized per-paragraph processing
    if (this.shouldUsePerParagraphProcessing(options)) {
      return this.extractFillInBlankPerParagraph(safeParagraphs, options);
    }
    
    // Standard batch processing
    return this.extractBatchQuizItems(safeParagraphs, options);
  }

  /**
   * Validate input size
   */
  private validateInputSize(paragraphs: GptParagraphBlock[]): boolean {
    const jsonString = JSON.stringify(paragraphs, null, 2);
    const estimatedTokens = Math.ceil(jsonString.length / 4);
    
    
    if (jsonString.length > 500000) {
      console.error('DeepSeek: Data exceeds safe limits!');
      return false;
    }
    
    return true;
  }

  /**
   * Truncate paragraphs if too large
   */
  private truncateIfNeeded(paragraphs: GptParagraphBlock[]): GptParagraphBlock[] {
    const jsonString = JSON.stringify(paragraphs, null, 2);
    
    if (jsonString.length > 400000) {
      return paragraphs.slice(0, 10);
    }
    
    return paragraphs;
  }

  /**
   * Check if we should use per-paragraph processing
   */
  private shouldUsePerParagraphProcessing(options?: QuizExtractionOptions): boolean {
    return options?.targetTypes?.length === 1 && 
           options.targetTypes[0] === 'fill-in-the-blank';
  }

  /**
   * Create error response for oversized input
   */
  private createOversizedErrorResponse(): QuizItem[] {
    return [{
      type: 'other',
      question: '文档内容过大，无法处理。请尝试上传较小的文档或分段处理。',
      answer: '数据超过限制',
      options: [],
      alternative_answers: []
    }];
  }

  /**
   * Extract quiz items in batch mode
   */
  private async extractBatchQuizItems(
    paragraphs: GptParagraphBlock[],
    options?: QuizExtractionOptions
  ): Promise<QuizItem[]> {
    try {
      // Make API call
      const response = await this.callDeepSeekAPI(
        this.buildSystemPrompt(options),
        this.buildUserPrompt(paragraphs)
      );

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('DeepSeek: Empty response');
        return [];
      }

      // Parse and validate response
      const items = await this.parseAndValidateResponse(content);
      
      // Filter by type if requested
      const filtered = this.filterByType(items, options);
      
      // Process fill-in-the-blank questions
      const processed = await this.processFillInBlankQuestions(filtered);
      
      // Apply max items limit
      return this.applyMaxItemsLimit(processed, options);
      
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  /**
   * Extract fill-in-blank items per paragraph
   */
  private async extractFillInBlankPerParagraph(
    paragraphs: GptParagraphBlock[],
    options?: QuizExtractionOptions
  ): Promise<QuizItem[]> {
    const results: QuizItem[] = [];
    const maxItems = options?.maxItems || Infinity;
    
    for (let i = 0; i < paragraphs.length && results.length < maxItems; i++) {
      const paragraph = paragraphs[i];
      
      // Skip paragraphs without highlights
      if (!paragraph.highlighted || paragraph.highlighted.length === 0) {
        continue;
      }
      
      try {
        const item = await this.generateSingleFillInBlank(paragraph, i + 1, paragraphs.length);
        if (item) {
          results.push(item);
        }
      } catch (error) {
        console.error(`DeepSeek: Failed for paragraph ${i + 1}:`, error);
      }
    }
    
    return results.slice(0, maxItems);
  }

  /**
   * Generate a single fill-in-blank question
   */
  private async generateSingleFillInBlank(
    paragraph: GptParagraphBlock,
    number: number,
    total: number
  ): Promise<QuizItem | null> {
    const systemPrompt = `生成一道填空题，基于高亮内容。使用____作为空格。返回JSON格式。`;
    const userPrompt = `段落 ${number}/${total}:\n${JSON.stringify(paragraph, null, 2)}`;

    try {
      const response = await this.callDeepSeekAPI(systemPrompt, userPrompt, 500);
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        return null;
      }

      const items = await this.parseAndValidateResponse(content);
      if (items.length === 0) {
        return null;
      }
      
      const item = items[0];
      item.type = 'fill-in-the-blank';
      
      // Ensure blanks exist
      if (!FillInBlankUtility.hasBlanks(item.question)) {
        const fixed = FillInBlankUtility.autoAddBlanks(item);
        
        if (!FillInBlankUtility.hasBlanks(fixed.question)) {
          return await this.regenerateFillInBlank(fixed);
        }
        
        return fixed;
      }
      
      return item;
    } catch (error) {
      console.error(`DeepSeek: Error generating for paragraph ${number}:`, error);
      return null;
    }
  }

  /**
   * Regenerate fill-in-blank with proper blanks
   */
  private async regenerateFillInBlank(
    item: QuizItem, 
    attempt: number = 1
  ): Promise<QuizItem> {
    if (attempt > 3) {
      return FillInBlankUtility.createFallbackQuestion(item);
    }

    const systemPrompt = `修正填空题，确保包含____空格。`;
    const userPrompt = `请修正：${JSON.stringify(item)}`;

    try {
      const response = await this.callDeepSeekAPI(
        systemPrompt, 
        userPrompt, 
        1000,
        0.2 + (attempt * 0.1)
      );
      
      const content = response.choices[0]?.message?.content;
      if (content) {
        const items = await this.parseAndValidateResponse(content);
        if (items.length > 0 && FillInBlankUtility.hasBlanks(items[0].question)) {
          return items[0];
        }
      }
    } catch (error) {
      console.error(`DeepSeek: Regeneration attempt ${attempt} failed:`, error);
    }
    
    // Retry with increased temperature
    return this.regenerateFillInBlank(item, attempt + 1);
  }

  /**
   * Process fill-in-the-blank questions
   */
  private async processFillInBlankQuestions(items: QuizItem[]): Promise<QuizItem[]> {
    const processed: QuizItem[] = [];
    
    for (const item of items) {
      if (item.type === 'fill-in-the-blank' && !FillInBlankUtility.hasBlanks(item.question)) {
        // Try to fix locally first
        let fixed = FillInBlankUtility.autoAddBlanks(item);
        
        // If still no blanks, regenerate
        if (!FillInBlankUtility.hasBlanks(fixed.question)) {
          fixed = await this.regenerateFillInBlank(fixed);
        }
        
        processed.push(fixed);
      } else {
        processed.push(item);
      }
    }
    
    return processed;
  }

  /**
   * Parse and validate JSON response
   */
  private async parseAndValidateResponse(content: string): Promise<QuizItem[]> {
    // Parse JSON with recovery strategies
    const parsed = JsonParserUtility.parseWithRecovery(content);
    
    if (!parsed) {
      console.error('DeepSeek: Failed to parse JSON response');
      console.error('Content preview:', content.substring(0, 200));
      return [];
    }
    
    // Log parsing strategy for debugging
    const strategy = JsonParserUtility.getParsingStrategy(content);
    if (strategy !== 'direct') {
    }
    
    // Validate and normalize response
    const validated = QuizValidatorUtility.validateResponse(parsed);
    return validated.items;
  }

  /**
   * Filter items by requested types
   */
  private filterByType(items: QuizItem[], options?: QuizExtractionOptions): QuizItem[] {
    if (!options?.targetTypes || options.targetTypes.length === 0) {
      return items;
    }
    
    return items.filter(item => 
      item.type !== 'other' && options.targetTypes!.includes(item.type as any)
    );
  }

  /**
   * Apply max items limit
   */
  private applyMaxItemsLimit(items: QuizItem[], options?: QuizExtractionOptions): QuizItem[] {
    if (options?.maxItems && items.length > options.maxItems) {
      return items.slice(0, options.maxItems);
    }
    return items;
  }

  /**
   * Call DeepSeek API
   */
  private async callDeepSeekAPI(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 4000,
    temperature?: number
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const modelConfig = getModelConfig('quizParser');
    const model = modelConfig.model.startsWith('deepseek') 
      ? modelConfig.model 
      : 'deepseek-chat';
      
    return this.deepseek.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature ?? modelConfig.temperature ?? 0.7,
      max_tokens: maxTokens,
      top_p: modelConfig.topP,
      response_format: {
        type: 'json_object'
      }
    });
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(options?: QuizExtractionOptions): string {
    const allowedTypes = this.getAllowedTypes(options);
    const typeDescriptions = this.formatTypeDescriptions(allowedTypes);

    return `你是一个教育出题助手。从段落中提取题目，基于高亮内容生成题干和答案。

规则：
1. 只使用输入内容，不虚构
2. 保持完整上下文和图片占位符
3. 高亮内容为答案或重要知识点
4. 只生成：${typeDescriptions}
5. 填空题使用____标记空格

输出JSON格式：
{
  "items": [
    {
      "type": "题型",
      "question": "题干",
      "options": ["选项"],
      "answer": "答案"
    }
  ]
}`;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(paragraphs: GptParagraphBlock[]): string {
    return `请从以下段落提取题目：\n\n${JSON.stringify(paragraphs, null, 2)}`;
  }

  /**
   * Get allowed quiz types
   */
  private getAllowedTypes(options?: QuizExtractionOptions): GeneratableQuizType[] {
    if (options?.targetTypes && options.targetTypes.length > 0) {
      return options.targetTypes as GeneratableQuizType[];
    }
    return ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'];
  }

  /**
   * Format type descriptions for prompt
   */
  private formatTypeDescriptions(types: GeneratableQuizType[]): string {
    const descriptions = types.map(type => {
      switch(type) {
        case 'single-choice': return '"single-choice"（单选题）';
        case 'multiple-choice': return '"multiple-choice"（多选题）';
        case 'fill-in-the-blank': return '"fill-in-the-blank"（填空题）';
        case 'subjective': return '"subjective"（主观题）';
        default: return `"${type}"`;
      }
    });
    
    return descriptions.join('、');
  }
}