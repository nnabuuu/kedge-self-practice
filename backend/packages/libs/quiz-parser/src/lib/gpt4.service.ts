import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult, QuizExtractionOptions } from '@kedge/models';
import { getOpenAIConfig, getModelConfig } from '@kedge/configs';

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
    // Build allowed types based on options (excluding 'other' type)
    const allowedTypes: GeneratableQuizType[] = options?.targetTypes && options.targetTypes.length > 0 
      ? (options.targetTypes as GeneratableQuizType[])
      : ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'];
    
    const typeDescriptions = allowedTypes.map(type => {
      switch(type) {
        case 'single-choice': return 'single-choice（单选题）';
        case 'multiple-choice': return 'multiple-choice（多选题）';
        case 'fill-in-the-blank': return 'fill-in-the-blank（填空题）';
        case 'subjective': return 'subjective（主观题）';
        default: return type;
      }
    }).join('、');

    const prompt = `你是一名出题专家，基于提供的文本段落生成中学教育题目。

要求：
1. 根据高亮内容生成题目（黄色、绿色等高亮表示重要内容）
2. 只生成以下题型：${typeDescriptions}
3. 填空题的空格用至少4个下划线表示（____）
4. 确保题目符合中学生的认知水平
5. 所有题目都必须包含 options 字段（即使是空数组）
6. 选择题的 options 需要包含选项，填空题和主观题的 options 可以是空数组
7. 返回 JSON 格式，包含 items 数组

填空题特别说明：
- 如果高亮的是完整的专有名词（如"神农本草经"），应该把整个名词作为空格
  正确：东汉时的《____》是中国古代第一部药物学专著。（答案：神农本草经）
  错误：东汉时的《____本草经》是中国古代第一部药物学专著。（答案：神农）
- 如果高亮的是短语或概念，应该把核心部分作为空格
- 空格应该对应完整的、有意义的答案，而不是词语的片段`;

    const schema = {
      name: 'quiz_extraction',
      description: '题目提取结果',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                type: {
                  type: 'string',
                  enum: allowedTypes, // Use the filtered types
                },
                question: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                },
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
          },
        },
        required: ['items'],
      },
    } as const;

    const modelConfig = getModelConfig('quizParser');
    const maxTokens = modelConfig.maxTokens || 8000; // Increase default to prevent truncation
    
    console.log(`GPT-4 extractQuizItems - Model: ${modelConfig.model}, MaxTokens: ${maxTokens}`);
    console.log(`Processing ${paragraphs.length} paragraphs`);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt + '\n\n' + JSON.stringify(paragraphs, null, 2),
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      });

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
            console.log('Successfully extracted and parsed JSON from response');
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
        console.log('Successfully fixed truncated JSON');
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
          console.warn('Fill-in-the-blank question missing blanks:', item.question);
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
              console.log(`Auto-fixed fill-in-blank: "${item.question}" -> "${fixedQuestion}"`);
              item.question = fixedQuestion;
            }
          }
        }
      }
      
      // Warn if choice questions don't have options
      if ((item.type === 'single-choice' || item.type === 'multiple-choice') && item.options.length === 0) {
        console.warn(`${item.type} question missing options:`, item.question);
      }
      
      return item;
    });
  }
}