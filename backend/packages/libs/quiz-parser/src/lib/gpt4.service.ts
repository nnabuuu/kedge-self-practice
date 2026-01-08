import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult, QuizExtractionOptions } from '@kedge/models';
import { getOpenAIConfig, getModelConfig } from '@kedge/configs';
import { QuizPromptBuilder } from './prompt-builder';

type GeneratableQuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

/**
 * GPT-4 Service - For GPT-4, GPT-4 Turbo, GPT-4o models
 * These models support json_schema response format for structured output
 */
@Injectable()
export class GPT4Service {
  private readonly openai: OpenAI;
  private readonly config = getOpenAIConfig();

  constructor() {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      organization: this.config.organization,
    });
  }

  async extractQuizItems(
    paragraphs: GptParagraphBlock[], 
    options?: QuizExtractionOptions
  ): Promise<QuizItem[]> {
    // Special handling for fill-in-the-blank only requests
    if (options?.targetTypes?.length === 1 && options.targetTypes[0] === 'fill-in-the-blank') {
      return this.extractFillInBlankItemsPerParagraph(paragraphs, options);
    }
    
    // Use the prompt builder for clean, conditional prompt generation
    const promptBuilder = new QuizPromptBuilder(options);
    const prompt = promptBuilder.buildPrompt();

    const schema = promptBuilder.getResponseSchema();

    const modelConfig = getModelConfig('quizParser');
    const maxTokens = modelConfig.maxTokens || 8000; // Increase default to prevent truncation

    const userContent = prompt + '\n\n' + JSON.stringify(paragraphs, null, 2);

    const requestBody = {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: schema,
      },
    };

    const startTime = Date.now();
    console.log('='.repeat(80));
    console.log('[LLM Request]');
    console.log(`  URL: ${this.openai.baseURL}/chat/completions`);
    console.log(`  Headers: Authorization: Bearer ${this.config.apiKey?.substring(0, 10)}...`);
    console.log(`  Body: ${JSON.stringify(requestBody, null, 2)}`);
    console.log('='.repeat(80));

    try {
      const response = await this.openai.chat.completions.create(requestBody as any);

      const duration = Date.now() - startTime;
      const usage = response.usage;
      console.log('='.repeat(80));
      console.log('[LLM Response]');
      console.log(`  Duration: ${duration}ms`);
      console.log(`  Tokens: prompt=${usage?.prompt_tokens}, completion=${usage?.completion_tokens}, total=${usage?.total_tokens}`);
      console.log(`  Content preview: ${response.choices[0]?.message?.content?.substring(0, 200)}...`);
      console.log('='.repeat(80));

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('GPT-4 returned empty response');
        return [];
      }
      
      try {
        const parsed: QuizExtractionResult = JSON.parse(content);
        let items = parsed.items ?? [];
        
        // Filter to only requested types if specified (excluding 'other' type)
        if (options?.targetTypes && options.targetTypes.length > 0) {
          items = items.filter(item => 
            item.type !== 'other' && options.targetTypes!.includes(item.type as any)
          );
        }
        
        // Apply max items limit if specified
        if (options?.maxItems && items.length > options.maxItems) {
          items = items.slice(0, options.maxItems);
        }
        
        return this.postProcessQuizItems(items);
      } catch (parseError) {
        console.error('Failed to parse GPT-4 response as JSON:', parseError);
        console.error('Response length:', content.length);
        console.error('Last 200 chars:', content.slice(-200));
        
        // Try to extract valid JSON from the response
        const extracted = this.extractJSON(content);
        if (extracted) {
          try {
            const parsed: QuizExtractionResult = JSON.parse(extracted);
            return this.postProcessQuizItems(parsed.items ?? []);
          } catch (secondError) {
            console.error('Failed to parse extracted JSON:', secondError);
          }
        }
        
        // If we still can't parse, return empty array
        console.error('Unable to extract valid JSON from GPT-4 response');
        return [];
      }
    } catch (error) {
      console.error('GPT-4 quiz extraction failed:', error);
      return [];
    }
  }

  /**
   * Process fill-in-the-blank questions one paragraph at a time with context
   * This ensures each paragraph generates a quiz and prevents skipping
   */
  private async extractFillInBlankItemsPerParagraph(
    paragraphs: GptParagraphBlock[],
    options?: QuizExtractionOptions
  ): Promise<QuizItem[]> {
    const results: QuizItem[] = [];
    const maxItems = options?.maxItems || Infinity;
    
    // Process each paragraph individually
    for (let i = 0; i < paragraphs.length && results.length < maxItems; i++) {
      const currentParagraph = paragraphs[i];
      
      // Skip paragraphs without highlights
      if (!currentParagraph.highlighted || currentParagraph.highlighted.length === 0) {
        continue;
      }
      
      // Build context with previous and next paragraphs
      const context = {
        previous: i > 0 ? paragraphs[i - 1] : null,
        current: currentParagraph,
        next: i < paragraphs.length - 1 ? paragraphs[i + 1] : null,
      };
      
      try {
        const item = await this.generateSingleFillInBlank(context, i + 1, paragraphs.length);
        if (item) {
          results.push(item);
        }
      } catch (error) {
        console.error(`Failed to generate quiz for paragraph ${i + 1}:`, error);
        // Continue with next paragraph even if one fails
      }
    }
    
    return results.slice(0, maxItems);
  }

  /**
   * Generate a single fill-in-the-blank question with context
   */
  private async generateSingleFillInBlank(
    context: { 
      previous: GptParagraphBlock | null;
      current: GptParagraphBlock;
      next: GptParagraphBlock | null;
    },
    paragraphNumber: number,
    totalParagraphs: number
  ): Promise<QuizItem | null> {
    const prompt = `你是一名出题专家，为以下段落生成一道填空题。

当前段落（第 ${paragraphNumber}/${totalParagraphs} 段）：
${JSON.stringify(context.current, null, 2)}

${context.previous ? `上文（仅供理解上下文）：
${JSON.stringify(context.previous, null, 2)}` : ''}

${context.next ? `下文（仅供理解上下文）：
${JSON.stringify(context.next, null, 2)}` : ''}

要求：
1. 必须基于当前段落的高亮内容生成填空题
2. 使用至少4个下划线（____）表示空格
3. 高亮验证：忽略超过10个字的高亮（可能是解析错误）
4. 如果所有高亮都过长，提取其中的关键概念（人名、地名、时间、数字、专有名词）
5. 确保答案对应完整、有意义的内容
6. 为每个空格提供一个简洁的提示词（2-4个字）

提示词类别（历史题目）：
- 时间类：年份、朝代、世纪、时期、年代
- 人物类：人名、皇帝、领袖、思想家、将领
- 地理类：地名、国家、都城、地区、关隘
- 事件类：战争、事件、条约、改革、起义
- 文化类：著作、发明、制度、学派、文物
- 其他类：数字、称号、民族、王朝、组织

填空题示例：
- 如果高亮是"神农本草经"，正确：东汉时的《____》是中国古代第一部药物学专著。
- 答案："神农本草经"，提示：["著作"]

必须返回以下 JSON 格式：
{
  "type": "fill-in-the-blank",
  "question": "题目内容，包含____空格",
  "options": [],
  "answer": "答案" 或 ["答案1", "答案2"],
  "hints": ["提示1"] 或 ["提示1", "提示2"]
}

注意：这是第 ${paragraphNumber} 段，共 ${totalParagraphs} 段。必须为这个段落生成题目，不要跳过。`;

    const schema = {
      name: 'single_fill_in_blank',
      description: '单个填空题',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { 
            type: 'string', 
            enum: ['fill-in-the-blank']
          },
          question: { type: 'string' },
          options: { 
            type: 'array', 
            items: { type: 'string' }
          },
          answer: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
          hints: {
            type: 'array',
            items: {
              anyOf: [
                { type: 'string' },
                { type: 'null' }
              ]
            },
            description: '提示词数组'
          },
        },
        required: ['type', 'question', 'options', 'answer', 'hints'],
      },
    } as const;

    const modelConfig = getModelConfig('quizParser');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        temperature: modelConfig.temperature || 0.3,
        top_p: modelConfig.topP,
        max_tokens: 1000, // Smaller token limit for single question
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error(`Empty response for paragraph ${paragraphNumber}`);
        return null;
      }
      
      const item = JSON.parse(content) as QuizItem;
      
      // Post-process to ensure blanks exist
      if (!item.question.includes('____')) {
        const fixed = this.autoAddBlanksToQuestion(item);
        return fixed;
      }
      
      return item;
    } catch (error) {
      console.error(`Failed to generate fill-in-blank for paragraph ${paragraphNumber}:`, error);
      return null;
    }
  }

  /**
   * Auto-fix fill-in-blank questions that are missing blanks
   */
  private autoAddBlanksToQuestion(item: QuizItem): QuizItem {
    if (!item.answer) return item;
    
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    let fixedQuestion = item.question;
    
    for (const ans of answers) {
      if (typeof ans === 'string' && ans.trim()) {
        const answerText = ans.trim();
        
        // Try different patterns to find the answer in the question
        const patterns = [
          new RegExp(`《${answerText}》`, 'g'),
          new RegExp(`"${answerText}"`, 'g'),
          new RegExp(`'${answerText}'`, 'g'),
          new RegExp(`${answerText}`, 'g'),
        ];
        
        for (const pattern of patterns) {
          if (fixedQuestion.match(pattern)) {
            fixedQuestion = fixedQuestion.replace(pattern, '____');
            break;
          }
        }
      }
    }
    
    // If we still don't have blanks, append at the end
    if (!fixedQuestion.includes('____')) {
      fixedQuestion = fixedQuestion.replace(/[。？！?!]$/, '') + '____。';
    }
    
    return { ...item, question: fixedQuestion };
  }

  async polishQuizItem(item: QuizItem, userGuidance?: string): Promise<QuizItem> {
    let prompt = `你是一名教育编辑助手，请在保持题目含义、选项和答案不变的情况下润色题干，使其表述更完整或更具有场景感。

要求：
1. 只修改 question 字段
2. 保持 type, options, answer 字段完全不变
3. options 字段必须存在（即使是空数组）
4. 返回完整的 JSON 对象`;
    
    if (userGuidance) {
      prompt = `你是一名教育编辑助手。

用户要求：${userGuidance}

注意：
1. 请按照用户的要求修改题目
2. options 字段必须存在（即使是空数组）
3. 返回完整的 JSON 对象`;
    }

    const schema = {
      name: 'polish_quiz',
      description: '润色题目',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { 
            type: 'string', 
            enum: ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'] 
          },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        },
        // In strict mode, ALL properties must be in required array
        required: ['type', 'question', 'options', 'answer'],
      },
    } as const;

    const modelConfig = getModelConfig('quizRenderer');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        temperature: modelConfig.temperature || 0.3,
        top_p: modelConfig.topP,
        max_tokens: modelConfig.maxTokens || 500,
        messages: [
          { 
            role: 'user', 
            content: prompt + '\n\n' + JSON.stringify(item) 
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('GPT-4 returned empty response for polish');
        return item;
      }
      
      return JSON.parse(content) as QuizItem;
    } catch (error) {
      console.error('GPT-4 polish failed:', error);
      return item;
    }
  }

  async changeQuizType(
    item: QuizItem, 
    newType: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective'
  ): Promise<QuizItem> {
    const prompt = `你是一名教育编辑助手。请将这道题目转换为${this.getTypeDescription(newType)}题型。
    
要求：
1. 保持题目的核心知识点不变
2. 根据新题型调整题目格式
3. 填空题使用至少4个下划线（____）表示空格
4. options 字段必须存在：选择题需要4个选项，填空题和主观题可以是空数组
5. 返回完整的 JSON 格式，包含 type, question, options, answer 所有字段`;

    const schema = {
      name: 'change_quiz_type',
      description: '转换题型',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: [newType] },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        },
        // In strict mode, ALL properties must be in required array
        required: ['type', 'question', 'options', 'answer'],
      },
    } as const;

    const modelConfig = getModelConfig('quizRenderer');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        max_tokens: modelConfig.maxTokens,
        messages: [
          { 
            role: 'user', 
            content: prompt + '\n\n' + JSON.stringify(item) 
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('GPT-4 returned empty response for type change');
        return { ...item, type: newType };
      }
      
      return JSON.parse(content) as QuizItem;
    } catch (error) {
      console.error('GPT-4 type change failed:', error);
      return { ...item, type: newType };
    }
  }

  private getTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'single-choice': '单选',
      'multiple-choice': '多选',
      'fill-in-the-blank': '填空',
      'subjective': '主观',
    };
    return descriptions[type] || type;
  }

  /**
   * Attempt to extract valid JSON from a potentially malformed response
   */
  private extractJSON(content: string): string | null {
    // Try to find JSON object boundaries
    const patterns = [
      // Complete JSON object
      /^\s*(\{[\s\S]*\})\s*$/,
      // JSON wrapped in markdown code block
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
      // Find the first complete JSON object
      /(\{(?:[^{}]|{[^{}]*})*\})/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        try {
          // Attempt to clean common issues
          let cleaned = match[1]
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes
          
          // Validate it's parseable
          JSON.parse(cleaned);
          return cleaned;
        } catch {
          // Continue to next pattern
        }
      }
    }

    // Try to fix truncated JSON by closing open structures
    if (content.includes('{') && !content.includes('}')) {
      // Count open brackets and arrays
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      
      let fixed = content;
      
      // Close any unterminated strings
      const quoteCount = (fixed.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        fixed += '"';
      }
      
      // Close arrays
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixed += ']';
      }
      
      // Close objects
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixed += '}';
      }
      
      try {
        JSON.parse(fixed);
        return fixed;
      } catch {
        // Could not fix
      }
    }

    return null;
  }

  private postProcessQuizItems(items: QuizItem[]): QuizItem[] {
    return items.map(item => {
      // Ensure options always exists (required by strict schema)
      if (!item.options) {
        item.options = [];
      }
      
      // Ensure fill-in-the-blank questions have proper blanks
      if (item.type === 'fill-in-the-blank') {
        const blanksCount = (item.question.match(/____+/g) || []).length;
        if (blanksCount === 0) {
          // Try to auto-fix by replacing answer text with blanks
          if (item.answer) {
            const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
            let fixedQuestion = item.question;
            
            for (const ans of answers) {
              if (typeof ans === 'string' && ans.trim()) {
                // Try to find and replace the answer text in the question
                const answerText = ans.trim();
                
                // Try different patterns to find the answer in the question
                const patterns = [
                  new RegExp(`《${answerText}》`, 'g'), // Book title format
                  new RegExp(`"${answerText}"`, 'g'),   // Quoted format
                  new RegExp(`'${answerText}'`, 'g'),   // Single quoted
                  new RegExp(`${answerText}`, 'g'),     // Plain text
                ];
                
                let replaced = false;
                for (const pattern of patterns) {
                  if (fixedQuestion.match(pattern)) {
                    fixedQuestion = fixedQuestion.replace(pattern, '____');
                    replaced = true;
                    break;
                  }
                }
                
                // If we couldn't find the answer in the text, append blank at the end
                if (!replaced && fixedQuestion === item.question) {
                  fixedQuestion = fixedQuestion.replace(/[。？！?!]$/, '') + '____。';
                }
              }
            }
            
            if (fixedQuestion !== item.question) {
              item.question = fixedQuestion;
            }
          }
        }
      }
      
      // Clean up choice questions and warn if they don't have options
      if ((item.type === 'single-choice' || item.type === 'multiple-choice')) {
        if (item.options.length === 0) {
        } else {
          // Remove A./B./C./D. prefixes from options
          item.options = item.options.map(option => {
            if (typeof option === 'string') {
              // Remove common prefixes like "A.", "A．", "A、", "(A)", etc.
              return option.replace(/^[A-Z][\.\．、）)]\s*/i, '').trim();
            }
            return option;
          });
          
          // Clean up answer as well
          if (typeof item.answer === 'string') {
            // If answer contains prefix, remove it
            const cleanAnswer = item.answer.replace(/^[A-Z][\.\．、）)]\s*/i, '').trim();
            // Try to find the clean answer in options
            const matchIndex = item.options.findIndex(opt => 
              opt === cleanAnswer || (typeof item.answer === 'string' && opt === item.answer.replace(/^[A-Z][\.\．、）)]\s*/i, '').trim())
            );
            if (matchIndex !== -1) {
              item.answer = item.options[matchIndex];
            } else {
              item.answer = cleanAnswer;
            }
          } else if (Array.isArray(item.answer)) {
            // For multiple choice, clean each answer
            const cleanedAnswers: string[] = [];
            for (const ans of item.answer) {
              if (typeof ans === 'string') {
                const cleanAnswer = ans.replace(/^[A-Z][\.\．、）)]\s*/i, '').trim();
                // Find matching option
                const matchIndex = item.options?.findIndex(opt => 
                  opt === cleanAnswer || opt === ans.replace(/^[A-Z][\.\．、）)]\s*/i, '').trim()
                ) ?? -1;
                if (matchIndex !== -1 && item.options) {
                  cleanedAnswers.push(item.options[matchIndex]);
                } else {
                  cleanedAnswers.push(cleanAnswer);
                }
              } else if (typeof ans === 'number' && item.options && item.options[ans]) {
                // If answer is an index, use the option at that index
                cleanedAnswers.push(item.options[ans]);
              }
            }
            item.answer = cleanedAnswers;
          }
        }
      }
      
      return item;
    });
  }
}