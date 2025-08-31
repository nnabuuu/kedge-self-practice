import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult } from '@kedge/models';
import { getOpenAIConfig, getModelConfig } from '@kedge/configs';

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

  async extractQuizItems(paragraphs: GptParagraphBlock[]): Promise<QuizItem[]> {
    const prompt = `你是一名出题专家，基于提供的文本段落生成中学教育题目。

要求：
1. 根据高亮内容生成题目（黄色、绿色等高亮表示重要内容）
2. 题型包括：single-choice（单选）、multiple-choice（多选）、fill-in-the-blank（填空）、subjective（主观题）
3. 填空题的空格用至少4个下划线表示（____）
4. 确保题目符合中学生的认知水平
5. 所有题目都必须包含 options 字段（即使是空数组）
6. 选择题的 options 需要包含选项，填空题和主观题的 options 可以是空数组
7. 返回 JSON 格式，包含 items 数组`;

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
                  enum: ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'],
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
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        max_tokens: modelConfig.maxTokens,
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
      
      const parsed: QuizExtractionResult = JSON.parse(content);
      return this.postProcessQuizItems(parsed.items ?? []);
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
          // Try to auto-fix by adding blanks based on answers
          if (Array.isArray(item.answer) && item.answer.length > 0) {
            // This is a simple heuristic - in production you might want to use GPT to fix it
            item.question = item.question + ' ____';
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