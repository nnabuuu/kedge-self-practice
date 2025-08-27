import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult } from '@kedge/models';
import { getOpenAIConfig, getModelConfig } from '@kedge/configs';
import { createChatCompletionParams } from './openai-utils';

@Injectable()
export class GptService {
  private readonly openai: OpenAI;
  private readonly config = getOpenAIConfig();

  constructor() {
    this.openai = new OpenAI({
      apiKey: this.config.apiKey || 'dummy',
      baseURL: this.config.baseURL,
      organization: this.config.organization,
    });
  }

  async extractQuizItems(paragraphs: GptParagraphBlock[]): Promise<QuizItem[]> {
    console.log(JSON.stringify(paragraphs));
    // Debug logging to see what's causing the huge token count
    console.log('=== GPT Input Debug ===');
    console.log('Number of paragraphs:', paragraphs.length);

    // Check the size of the data being sent
    const jsonString = JSON.stringify(paragraphs, null, 2);
    console.log('Total JSON string length:', jsonString.length);
    console.log('Estimated tokens (rough):', Math.ceil(jsonString.length / 4));

    // Log detailed paragraph analysis
    if (paragraphs.length > 0) {
      console.log('First paragraph sample:', JSON.stringify(paragraphs[0], null, 2).substring(0, 1000));

      // Analyze paragraph sizes
      const sizes = paragraphs.map((p, idx) => {
        const size = JSON.stringify(p).length;
        return { idx, size, textLength: p.paragraph?.length || 0 };
      });

      // Find largest paragraphs
      const largest = sizes.sort((a, b) => b.size - a.size).slice(0, 5);
      console.log('Largest paragraphs by JSON size:', largest);

      // Check for abnormally long text content
      const longTextParagraphs = paragraphs.filter(p => p.paragraph && p.paragraph.length > 10000);
      if (longTextParagraphs.length > 0) {
        console.warn(`Found ${longTextParagraphs.length} paragraphs with text longer than 10k characters`);
        longTextParagraphs.forEach((p, idx) => {
          console.log(`Long paragraph ${idx}: ${p.paragraph?.length} chars, preview: "${p.paragraph?.substring(0, 200)}..."`);
        });
      }
    }

    // If the data is too large, return an error instead of truncating
    if (jsonString.length > 500000) { // ~125k tokens (close to GPT-4's limit)
      console.error('Data exceeds safe limits! Rejecting request.');
      console.log('Data size:', jsonString.length, 'characters');
      console.log('Estimated tokens:', Math.ceil(jsonString.length / 4));

      return [{
        type: 'other',
        question: '文档内容过大，无法处理。请尝试上传较小的文档或分段处理。',
        answer: `数据大小: ${Math.ceil(jsonString.length / 4)} tokens (超过限制)`
      }] as QuizItem[];
    }

    // If the data is moderately large, truncate it
    if (jsonString.length > 400000) { // ~100k tokens
      console.warn('Data is large, truncating paragraphs for safety...');
      console.log('Original paragraphs count:', paragraphs.length);

      // Take only first 10 paragraphs as a safety measure
      paragraphs = paragraphs.slice(0, 10);
      console.log('Truncated to:', paragraphs.length, 'paragraphs');

      // Re-check size after truncation
      const truncatedJsonString = JSON.stringify(paragraphs, null, 2);
      console.log('After truncation - JSON length:', truncatedJsonString.length);
      console.log('After truncation - Estimated tokens:', Math.ceil(truncatedJsonString.length / 4));
    }

    console.log('=== End GPT Input Debug ===');

    const prompt = `
    你是一个教育出题助手。你的任务是从提供的段落中提取题目，并严格基于高亮部分生成题干和答案。请遵守以下规则：
    1. 只能使用输入中的内容（包括高亮和原文），绝不能添加或虚构任何新的内容、选项或表述，尽量保持完整的题干上下文，包括 {{image:uuid}}表示的image placeholder。
    2. 高亮的内容为答案或重要知识点，请据此推断题型和正确答案。
    3. 题目内容可能跨paragraph存在，请将这些内容一并包括在题目中，不要漏掉。
    4. 尤其注意仅包含image的paragraph，其内容应该属于最近的一个题目中描述了“图片”相关内容的题目。请根据语义引入并保持正确的文本顺序。例如：题干中表示"下图..."，则说明前面的一个或多个{paragraph":"{{image:uuid}}}"应该被纳入该题目。
    4. 不要创造新的选项。仅在原文中明确列出可供选择的选项(如"1."、"①"、"A. "等)时，才可生成选择题。
    5. 若原文中未明确列出多个选项，但包含某个高亮词汇，请将其作为"填空题"处理，"填空题"可以有多个高亮指示的空白处。
    6. 若原文中出现大段答案结果且仅有一处高亮，请将其作为"主观题"处理
    7. 如果题干/选项/答案以数字或编号开头(如"1."、"①"、"A. "等)，请将这些部分从题干中去除，仅保留纯粹的题干/选项/答案。
    8. 返回的 JSON 格式必须完全符合以下结构：
    每道题返回：
    - type: "single-choice"、"multiple-choice"、"fill-in-the-blank"、"subjective"、"other"
    - question: 题干
    - options: 可选，仅适用于选择题
    - answer: 正确答案（"single-choice" 和 "multiple-choice" 为索引数组，"fill-in-the-blank" 为字符串数组，"subjective" 和 "other" 为字符串）
    示例：\n{\n  "items": [\n    {\n      "type": "fill-in-the-blank",\n      "question": "春秋时期，中原各国自称______。",\n      "answer": ["华夏"]\n    },\n    {\n      "type": "subjective",\n      "question": "简述儒家代表人物孟子的核心思想。",\n      "answer": "仁政"\n    }\n  ]\n}\n\n请根据下方输入提取题目并返回严格符合上述格式的 JSON。不要包含多余解释、注释或非结构化内容。`;

    const schema = {
      name: 'extract_quiz_items',
      description: '从段落中提取多种类型的题目',
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
                  enum: ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other'],
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
                    { type: 'array', items: { type: 'number' } },
                  ],
                },
              },
              required: ['type', 'question', 'options', 'answer'],
            },
          },
        },
        required: ['items'],
      },
    } as const;

    const modelConfig = getModelConfig('quizParser');
    const completionParams = createChatCompletionParams({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
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
    }, modelConfig.maxTokens);
    const response = await this.openai.chat.completions.create(completionParams);

    const content = response.choices[0]?.message?.content;
    try {
      const parsed: QuizExtractionResult = JSON.parse(content ?? '{}');
      return parsed.items ?? [];
    } catch (error) {
      return [{ type: 'other', question: 'GPT 返回解析失败', answer: content }] as QuizItem[];
    }
  }

  async polishQuizItem(item: QuizItem, userGuidance?: string): Promise<QuizItem> {
    let prompt = `你是一名教育编辑助手，请在保持题目含义、选项和答案不变的情况下润色题干，使其表述更完整或更具有场景感。只修改 question 字段，返回 JSON。`;
    
    // Add user guidance if provided
    if (userGuidance && userGuidance.trim()) {
      prompt += `\n\n用户的特定要求：${userGuidance}`;
    }
    
    const schema = {
      name: 'polish_quiz_item',
      description: '润色题干但保持题目其他部分不变',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
              { type: 'array', items: { type: 'number' } },
            ],
          },
        },
        required: ['type', 'question', 'options', 'answer'],
      },
    } as const;

    const modelConfig = getModelConfig('quizRenderer');
    const completionParams = createChatCompletionParams({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      messages: [{ role: 'user', content: prompt + '\n\n' + JSON.stringify(item) }],
      response_format: { type: 'json_schema', json_schema: schema },
    }, modelConfig.maxTokens);
    const response = await this.openai.chat.completions.create(completionParams);

    const content = response.choices[0]?.message?.content;
    try {
      return JSON.parse(content ?? '{}') as QuizItem;
    } catch (error) {
      return { ...item, question: 'GPT 返回解析失败: ' + content } as QuizItem;
    }
  }

  async changeQuizItemType(item: QuizItem, newType: QuizItem['type']): Promise<QuizItem> {
    const prompt = `请将下列题目转换为 ${newType} 类型，并根据需要调整题干、选项和答案。返回 JSON。`;
    const schema = {
      name: 'change_quiz_item_type',
      description: '将题目转换为其他类型',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other'],
          },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
              { type: 'array', items: { type: 'number' } },
            ],
          },
        },
        required: ['type', 'question', 'options', 'answer'],
      },
    } as const;

    const modelConfig = getModelConfig('quizRenderer');
    const completionParams = createChatCompletionParams({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      messages: [{ role: 'user', content: prompt + '\n\n' + JSON.stringify(item) }],
      response_format: { type: 'json_schema', json_schema: schema },
    }, modelConfig.maxTokens);
    const response = await this.openai.chat.completions.create(completionParams);

    const content = response.choices[0]?.message?.content;
    try {
      return JSON.parse(content ?? '{}') as QuizItem;
    } catch (error) {
      return { ...item, type: newType, question: 'GPT 返回解析失败: ' + content } as QuizItem;
    }
  }

  /**
   * Validate if a user's answer is acceptable for a fill-in-the-blank question
   * using GPT to understand semantic equivalence
   */
  async validateFillInBlankAnswer(
    question: string,
    correctAnswer: string,
    userAnswer: string,
    context?: string
  ): Promise<{ isCorrect: boolean; reasoning?: string }> {
    try {
      // Define the JSON schema for structured output
      const responseSchema = {
        type: 'json_schema',
        json_schema: {
          name: 'answer_validation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              isCorrect: {
                type: 'boolean',
                description: 'Whether the student answer is semantically correct'
              },
              reasoning: {
                type: 'string',
                description: 'Explanation for the validation judgment'
              }
            },
            required: ['isCorrect', 'reasoning'],
            additionalProperties: false
          }
        }
      };

      const prompt = `请判断用户的答案是否正确。

题目：${question}
${context ? `题目背景：${context}` : ''}
标准答案：${correctAnswer}
用户答案：${userAnswer}

请分析用户答案是否与标准答案在语义上等价或表达了相同的意思。
考虑以下几点：
1. 语义等价性（意思相同即可，不需要完全一样的用词）
2. 同义词或近义词的使用
3. 不同的表达方式但意思正确
4. 拼写的细微差异（如简繁体、错别字等）
5. 数字的不同表示形式（如阿拉伯数字和中文数字）

请提供你的判断结果和理由。`;

      const modelConfig = getModelConfig('answerValidator');
      const completionParams = createChatCompletionParams({
        model: modelConfig.model, // Use gpt-4o-mini for better structured output support
        messages: [
          {
            role: 'system',
            content: '你是一个教育评估助手，专门判断学生答案的正确性。你应该对合理的答案持宽容态度，只要意思正确就应该判定为正确。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: modelConfig.temperature || 0.3, // Use config or default to lower temperature
        response_format: responseSchema as any, // Use structured output with JSON schema
      }, modelConfig.maxTokens || 200);
      const response = await this.openai.chat.completions.create(completionParams);

      const content = response.choices[0].message?.content?.trim() || '{}';
      
      // Parse the JSON response (guaranteed to be valid JSON with response_format)
      const result = JSON.parse(content);
      return {
        isCorrect: result.isCorrect || false,
        reasoning: result.reasoning || '无法判断',
      };
    } catch (error) {
      console.error('Error validating answer with GPT:', error);
      // On error, be conservative and return false
      return {
        isCorrect: false,
        reasoning: 'GPT验证失败，无法确认答案正确性',
      };
    }
  }
}
