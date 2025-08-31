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
    
    // Special handling for fill-in-the-blank only requests
    if (allowedTypes.length === 1 && allowedTypes[0] === 'fill-in-the-blank') {
      console.log('Using optimized per-paragraph processing for fill-in-the-blank questions');
      return this.extractFillInBlankItemsPerParagraph(paragraphs, options);
    }
    
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

极其重要的说明：
- 必须为每个包含高亮内容的段落生成至少一道题目
- 不要跳过任何段落，即使内容相似
- 按照段落出现的顺序依次处理，不要遗漏
- 每个段落独立处理，即使段落文字相同但高亮不同，也要生成不同的题目
- 例如：
  段落1：九一八事变和华北事变... (高亮: 九一八, 事变)
  段落2：九一八事变和华北事变... (高亮: 华北)
  段落3：1931年9月18日... (高亮: 局部)
  应该生成3道不同的题目，分别基于各自的高亮内容
- 绝对不要因为内容相关就合并段落或跳过某些段落

填空题特别说明：
- 如果高亮的是完整的专有名词（如"神农本草经"），应该把整个名词作为空格
  正确：东汉时的《____》是中国古代第一部药物学专著。（答案：神农本草经）
  错误：东汉时的《____本草经》是中国古代第一部药物学专著。（答案：神农）
- 如果高亮的是短语或概念，应该把核心部分作为空格
- 空格应该对应完整的、有意义的答案，而不是词语的片段

高亮解析验证：
- 对于填空题：如果一个段落有多个高亮，且某些高亮覆盖了整个句子或句子的大部分（超过10个字），
  这很可能是解析错误，应该忽略这些过长的高亮
- 填空题的高亮应该是关键词、短语或概念（通常2-10个字），而不是整句话
- 如果所有高亮都过长，从中选择最可能作为考察内容的部分：
  优先选择：人名、地名、时间、数字、专有名词、关键概念
  从长句中提取核心词汇作为填空内容`;

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
          console.log(`Generated fill-in-blank for paragraph ${i + 1}/${paragraphs.length}`);
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
6. 返回 JSON 格式

填空题示例：
- 如果高亮是"神农本草经"，正确：东汉时的《____》是中国古代第一部药物学专著。
- 答案应该是完整的"神农本草经"，而不是"神农"

必须返回以下 JSON 格式：
{
  "type": "fill-in-the-blank",
  "question": "题目内容，包含____空格",
  "options": [],
  "answer": "答案" 或 ["答案1", "答案2"]
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
        },
        required: ['type', 'question', 'options', 'answer'],
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
        console.warn(`No blanks in question for paragraph ${paragraphNumber}, attempting to fix...`);
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