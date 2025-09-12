import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult } from '@kedge/models';
import { getOpenAIConfig, getModelConfig, getLLMProvider, getAutoBaseURL } from '@kedge/configs';
import { createChatCompletionParams, supportsJsonSchema } from './openai-utils';

@Injectable()
export class GptService {
  private readonly openai: OpenAI;
  private readonly config = getOpenAIConfig();

  constructor() {
    const provider = getLLMProvider('quizParser');
    const baseURL = provider === 'openai' 
      ? (this.config.baseURL || getAutoBaseURL('openai'))
      : this.config.baseURL;
      
    this.openai = new OpenAI({
      apiKey: this.config.apiKey || 'dummy',
      baseURL: baseURL,
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
    你是一个教育出题助手。你的任务是从提供的段落中提取题目，并严格基于高亮部分生成题干和答案。

    重要规则：
    1. 只能使用输入中的内容（包括高亮和原文），绝不能添加或虚构任何新的内容、选项或表述
    2. 保持完整的题干上下文，包括 {{image:uuid}} 格式的图片占位符
    3. 高亮的内容为答案或重要知识点，请据此推断题型和正确答案
    
    题目组合规则（极其重要）：
    - 题目内容经常跨多个paragraph，你必须智能组合它们
    - 典型模式：
      * 题号和题干（如"1.以下历史地图能反映出什么时代特点"）
      * 图片段落（只包含{{image:uuid}}占位符）
      * 图片说明或标签（如"春秋时期 战国时期 秦朝"）
      * 选项段落（如"A．春秋时期大国争霸B．统一趋势不断增强"）
    - 当看到题干提到"图片"、"地图"、"图表"、"下图"、"上图"、"如图"等词汇时，必须包含相邻的图片占位符段落
    - 图片占位符必须保留在题干中，格式为 {{image:uuid}}
    
    选择题特别说明：
    - 仅在原文中明确列出可供选择的选项(如"A."、"B."、"①"、"②"等)时，才生成选择题
    - 选项可能跨多个段落，要完整收集所有选项（如A、B在一个段落，C、D在下一个段落）
    - 去除选项前的字母标号，只保留选项内容
    - 答案使用选项索引（从0开始）：
      * single-choice: [0]表示第一个选项，[2]表示第三个选项
      * multiple-choice: [0,2]表示第一和第三个选项
    
    其他题型：
    - 若原文中未明确列出多个选项，但包含某个高亮词汇，作为"填空题"处理
    - 若原文中出现大段答案结果且仅有一处高亮，作为"主观题"处理
    
    返回的 JSON 格式必须完全符合以下结构：
    {
      "items": [
        {
          "type": "single-choice" | "multiple-choice" | "fill-in-the-blank" | "subjective" | "other",
          "question": "题干（包含{{image:uuid}}占位符）",
          "options": ["选项1", "选项2", "选项3", "选项4"],  // 仅选择题需要
          "answer": "答案"  // fill-in-the-blank和subjective
                   或 [0]  // single-choice（单个索引）
                   或 [0, 1]  // multiple-choice（多个索引）
        }
      ]
    }
    
    示例（包含图片的选择题）：
    输入段落：
    - "1.以下历史地图能反映出什么时代特点"
    - "{{image:uuid1}}{{image:uuid2}}{{image:uuid3}}"
    - "春秋时期 战国时期 秦朝"
    - "A．春秋时期大国争霸B．统一趋势不断增强" (高亮: B．统一趋势不断增强)
    - "C．战国时期百家争鸣 D．战争不止社会倒退"
    
    输出：
    {
      "items": [{
        "type": "single-choice",
        "question": "以下历史地图能反映出什么时代特点\n{{image:uuid1}}{{image:uuid2}}{{image:uuid3}}\n春秋时期 战国时期 秦朝",
        "options": ["春秋时期大国争霸", "统一趋势不断增强", "战国时期百家争鸣", "战争不止社会倒退"],
        "answer": [1]
      }]
    }
    
    请根据下方输入提取题目并返回严格符合上述格式的 JSON。不要包含多余解释、注释或非结构化内容。`;

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
    
    // Determine response format based on model capabilities
    const responseFormat = supportsJsonSchema(modelConfig.model)
      ? {
          type: 'json_schema' as const,
          json_schema: schema,
        }
      : {
          type: 'json_object' as const,
        };
    
    // Add JSON format instruction to prompt if not using json_schema
    const finalPrompt = !supportsJsonSchema(modelConfig.model)
      ? prompt + '\n\n请确保返回严格的JSON格式，包含一个items数组。\n\n' + JSON.stringify(paragraphs, null, 2)
      : prompt + '\n\n' + JSON.stringify(paragraphs, null, 2);
    
    const completionParams = createChatCompletionParams({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      messages: [
        {
          role: 'user',
          content: finalPrompt,
        },
      ],
      response_format: responseFormat,
    }, modelConfig.maxTokens);
    const response = await this.openai.chat.completions.create(completionParams);

    const content = response.choices[0]?.message?.content;
    
    // Check if content is empty or undefined
    if (!content || content.trim() === '') {
      console.error('GPT returned empty response for quiz extraction');
      console.error('Response object:', JSON.stringify(response, null, 2));
      return []; // Return empty array if no response
    }
    
    try {
      const parsed: QuizExtractionResult = JSON.parse(content);
      const items = parsed.items ?? [];
      
      // Check for fill-in-the-blank questions without blanks and retry
      const processedItems: QuizItem[] = [];
      for (const item of items) {
        if (item.type === 'fill-in-the-blank' && item.question) {
          const blanksCount = item.question.split(/_{2,}/g).length - 1;
          
          if (blanksCount === 0) {
            console.warn(`Fill-in-the-blank question has no blanks: "${item.question}"`);
            
            // Retry regenerating this specific quiz item up to 3 times
            let retryCount = 0;
            let regeneratedItem = item;
            
            while (retryCount < 3 && regeneratedItem.question.split(/_{2,}/g).length - 1 === 0) {
              retryCount++;
              console.log(`Retrying generation for fill-in-the-blank question (attempt ${retryCount}/3)...`);
              
              try {
                // Call polishQuizItem with specific guidance to add blanks
                regeneratedItem = await this.regenerateFillInBlankWithBlanks(regeneratedItem);
                
                const newBlanksCount = regeneratedItem.question.split(/_{2,}/g).length - 1;
                if (newBlanksCount > 0) {
                  console.log(`Successfully regenerated with ${newBlanksCount} blank(s)`);
                  break;
                }
              } catch (retryError) {
                console.error(`Retry ${retryCount} failed:`, retryError);
              }
            }
            
            processedItems.push(regeneratedItem);
          } else {
            processedItems.push(item);
          }
        } else {
          processedItems.push(item);
        }
      }
      
      return processedItems;
    } catch (error) {
      console.error('Failed to parse GPT response as JSON:', error);
      console.error('Raw GPT response:', content);
      
      // Try to extract JSON from the content if it's wrapped in markdown or has extra text
      const jsonMatch = content?.match(/```json\s*([\s\S]*?)\s*```/) || content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const cleanedContent = jsonMatch[0].replace(/```json\s*/, '').replace(/```\s*$/, '');
          const parsed: QuizExtractionResult = JSON.parse(cleanedContent);
          return parsed.items ?? [];
        } catch (secondError) {
          console.error('Failed to extract JSON from content:', secondError);
        }
      }
      
      // Return empty array instead of error quiz
      console.error('Unable to parse GPT response, returning empty array');
      return [];
    }
  }

  /**
   * Regenerate a fill-in-the-blank question to properly include blanks
   */
  private async regenerateFillInBlankWithBlanks(item: QuizItem): Promise<QuizItem> {
    const prompt = `你是一个教育出题助手。以下填空题没有正确的空格标记（____），请重新生成题目，确保：
1. 在需要填空的位置使用至少4个下划线（____）作为空格标记
2. 空格位置应该对应答案数组中的每个答案
3. 保持题目的核心内容和知识点不变
4. 返回完整的 JSON 格式

原始题目：
${JSON.stringify(item, null, 2)}

请返回修正后的题目，确保 question 字段包含正确的空格标记（____）。`;

    const schema = {
      name: 'fix_fill_in_blank',
      description: '修正填空题的空格标记',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: { type: 'string', enum: ['fill-in-the-blank'] },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: {
            anyOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
        },
        required: ['type', 'question', 'answer'],
      },
    } as const;

    try {
      const modelConfig = getModelConfig('quizRenderer');
      
      // Determine response format based on model capabilities
      const responseFormat = supportsJsonSchema(modelConfig.model)
        ? { type: 'json_schema' as const, json_schema: schema }
        : { type: 'json_object' as const };
      
      const completionParams = createChatCompletionParams({
        model: modelConfig.model,
        temperature: modelConfig.temperature || 0.3,
        top_p: modelConfig.topP,
        messages: [{ role: 'user', content: prompt }],
        response_format: responseFormat,
      }, modelConfig.maxTokens || 500);

      const response = await this.openai.chat.completions.create(completionParams);
      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('GPT returned empty response for blank regeneration');
        return item;
      }
      
      const regenerated = JSON.parse(content) as QuizItem;
      // Preserve any additional fields from the original item
      return { ...item, ...regenerated };
    } catch (error) {
      console.error('Failed to regenerate fill-in-blank question:', error);
      return item; // Return original if regeneration fails
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
    
    // Determine response format based on model capabilities
    const responseFormat = supportsJsonSchema(modelConfig.model)
      ? { type: 'json_schema' as const, json_schema: schema }
      : { type: 'json_object' as const };
    
    const completionParams = createChatCompletionParams({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      messages: [{ role: 'user', content: prompt + '\n\n' + JSON.stringify(item) }],
      response_format: responseFormat,
    }, modelConfig.maxTokens);
    const response = await this.openai.chat.completions.create(completionParams);

    const content = response.choices[0]?.message?.content;
    
    // Check if content is empty or undefined
    if (!content || content.trim() === '') {
      console.error('GPT returned empty response');
      console.error('Response object:', JSON.stringify(response, null, 2));
      return item; // Return original item if no response
    }
    
    try {
      return JSON.parse(content) as QuizItem;
    } catch (error) {
      console.error('Failed to parse GPT polish response as JSON:', error);
      console.error('Raw GPT response:', content);
      
      // Try to extract JSON from the content if it's wrapped in markdown
      const jsonMatch = content?.match(/```json\s*([\s\S]*?)\s*```/) || content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const cleanedContent = jsonMatch[0].replace(/```json\s*/, '').replace(/```\s*$/, '');
          return JSON.parse(cleanedContent) as QuizItem;
        } catch (secondError) {
          console.error('Failed to extract JSON from polish content:', secondError);
        }
      }
      
      // Return original item if parsing fails
      console.error('Unable to parse GPT polish response, returning original item');
      return item;
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
    
    // Determine response format based on model capabilities
    const responseFormat = supportsJsonSchema(modelConfig.model)
      ? { type: 'json_schema' as const, json_schema: schema }
      : { type: 'json_object' as const };
    
    const completionParams = createChatCompletionParams({
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      messages: [{ role: 'user', content: prompt + '\n\n' + JSON.stringify(item) }],
      response_format: responseFormat,
    }, modelConfig.maxTokens);
    const response = await this.openai.chat.completions.create(completionParams);

    const content = response.choices[0]?.message?.content;
    
    // Check if content is empty or undefined
    if (!content || content.trim() === '') {
      console.error('GPT returned empty response');
      console.error('Response object:', JSON.stringify(response, null, 2));
      return item; // Return original item if no response
    }
    
    try {
      return JSON.parse(content) as QuizItem;
    } catch (error) {
      console.error('Failed to parse GPT type change response as JSON:', error);
      console.error('Raw GPT response:', content);
      
      // Try to extract JSON from the content if it's wrapped in markdown
      const jsonMatch = content?.match(/```json\s*([\s\S]*?)\s*```/) || content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const cleanedContent = jsonMatch[0].replace(/```json\s*/, '').replace(/```\s*$/, '');
          return JSON.parse(cleanedContent) as QuizItem;
        } catch (secondError) {
          console.error('Failed to extract JSON from type change content:', secondError);
        }
      }
      
      // Return original item with new type if parsing fails
      console.error('Unable to parse GPT type change response, returning original item with new type');
      return { ...item, type: newType };
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
      const provider = getLLMProvider('answerValidator');
      
      // Check if provider supports structured output
      const supportsStructuredOutput = provider === 'openai' && supportsJsonSchema(modelConfig.model);
      
      // Adjust prompt for non-structured output providers
      const finalPrompt = supportsStructuredOutput ? prompt : `${prompt}

请以JSON格式返回，格式如下：
{
  "isCorrect": true或false,
  "reasoning": "判断理由"
}`;

      const completionParams = createChatCompletionParams({
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一个教育评估助手，专门判断学生答案的正确性。你应该对合理的答案持宽容态度，只要意思正确就应该判定为正确。',
          },
          {
            role: 'user',
            content: finalPrompt,
          },
        ],
        temperature: modelConfig.temperature || 0.3,
        // Only use structured output if supported
        ...(supportsStructuredOutput ? { response_format: responseSchema as any } : {}),
      }, modelConfig.maxTokens || 200);
      
      const response = await this.openai.chat.completions.create(completionParams);

      const content = response.choices[0].message?.content?.trim() || '{}';
      
      // Try to parse JSON response
      let result;
      try {
        // For DeepSeek or other providers, extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        // Fallback: try to extract boolean from response
        const isCorrectMatch = content.toLowerCase().includes('正确') || 
                               content.toLowerCase().includes('true') ||
                               content.toLowerCase().includes('correct');
        return {
          isCorrect: isCorrectMatch,
          reasoning: content.substring(0, 200), // Use first 200 chars as reasoning
        };
      }
      
      return {
        isCorrect: result.isCorrect || false,
        reasoning: result.reasoning || '无法判断',
      };
    } catch (error) {
      console.error('Error validating answer with AI:', error);
      // More informative error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isCorrect: false,
        reasoning: `AI验证失败: ${errorMessage.substring(0, 100)}`,
      };
    }
  }
}
