import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult, QuizExtractionOptions } from '@kedge/models';
import { getOpenAIConfig, getModelConfig } from '@kedge/configs';

type GeneratableQuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

/**
 * GPT-5 Service - For O1, O1-mini and future models
 * These models have restrictions:
 * - No temperature control (always 1)
 * - No top_p parameter
 * - Use max_completion_tokens instead of max_tokens
 * - Limited response_format support (only json_object, not json_schema)
 */
@Injectable()
export class GPT5Service {
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
5. 返回严格的 JSON 格式，结构如下：
{
  "items": [
    {
      "type": "single-choice" | "multiple-choice" | "fill-in-the-blank" | "subjective",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"], // 选择题需要
      "answer": "答案" 或 ["答案1", "答案2"] // 单个或多个答案
    }
  ]
}

填空题特别说明：
- 如果高亮的是完整的专有名词（如"神农本草经"），应该把整个名词作为空格
  正确：东汉时的《____》是中国古代第一部药物学专著。（答案：神农本草经）
  错误：东汉时的《____本草经》是中国古代第一部药物学专著。（答案：神农）
- 如果高亮的是短语或概念，应该把核心部分作为空格
- 空格应该对应完整的、有意义的答案，而不是词语的片段

请确保返回有效的 JSON，不要包含任何额外的文本或解释。`;

    const modelConfig = getModelConfig('quizParser');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        // O1 models don't support temperature or top_p
        max_completion_tokens: modelConfig.maxTokens || 4000,
        messages: [
          {
            role: 'user',
            content: prompt + '\n\n' + JSON.stringify(paragraphs, null, 2),
          },
        ],
        response_format: {
          type: 'json_object', // O1 models only support json_object, not json_schema
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('O1 model returned empty response');
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
        console.error('Failed to parse O1 response:', parseError);
        console.error('Raw content:', content);
        
        // Try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed: QuizExtractionResult = JSON.parse(jsonMatch[0]);
            return this.postProcessQuizItems(parsed.items ?? []);
          } catch (secondError) {
            console.error('Failed to extract JSON from O1 response:', secondError);
          }
        }
        
        return [];
      }
    } catch (error) {
      console.error('O1 model quiz extraction failed:', error);
      return [];
    }
  }

  async polishQuizItem(item: QuizItem, userGuidance?: string): Promise<QuizItem> {
    let prompt = `你是一名教育编辑助手，请在保持题目含义、选项和答案不变的情况下润色题干，使其表述更完整或更具有场景感。

当前题目：
${JSON.stringify(item, null, 2)}

要求：
1. 只修改 question 字段
2. 保持其他所有字段不变
3. 返回完整的 JSON 对象，格式与输入相同`;
    
    if (userGuidance) {
      prompt = `你是一名教育编辑助手。

用户要求：${userGuidance}

当前题目：
${JSON.stringify(item, null, 2)}

请按照用户的要求修改题目，返回完整的 JSON 对象。`;
    }

    const modelConfig = getModelConfig('quizRenderer');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        max_completion_tokens: modelConfig.maxTokens || 500,
        messages: [
          { 
            role: 'user', 
            content: prompt
          }
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('O1 model returned empty response for polish');
        return item;
      }
      
      try {
        const polished = JSON.parse(content) as QuizItem;
        // Ensure we preserve all original fields
        return { ...item, ...polished };
      } catch (parseError) {
        console.error('Failed to parse O1 polish response:', parseError);
        return item;
      }
    } catch (error) {
      console.error('O1 model polish failed:', error);
      return item;
    }
  }

  async changeQuizType(
    item: QuizItem, 
    newType: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective'
  ): Promise<QuizItem> {
    const prompt = `你是一名教育编辑助手。请将这道题目转换为${this.getTypeDescription(newType)}题型。

当前题目：
${JSON.stringify(item, null, 2)}

要求：
1. 保持题目的核心知识点不变
2. 根据新题型调整题目格式
3. 如果是填空题，使用至少4个下划线（____）表示空格
4. 如果是选择题，提供4个选项
5. 返回完整的 JSON 格式，包含 type, question, options (如果需要), answer 字段

新题型必须是: ${newType}`;

    const modelConfig = getModelConfig('quizRenderer');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        max_completion_tokens: modelConfig.maxTokens || 500,
        messages: [
          { 
            role: 'user', 
            content: prompt
          }
        ],
        response_format: {
          type: 'json_object',
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('O1 model returned empty response for type change');
        return { ...item, type: newType };
      }
      
      try {
        const changed = JSON.parse(content) as QuizItem;
        // Ensure the type is correctly set
        changed.type = newType;
        return changed;
      } catch (parseError) {
        console.error('Failed to parse O1 type change response:', parseError);
        return { ...item, type: newType };
      }
    } catch (error) {
      console.error('O1 model type change failed:', error);
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
      
      // Ensure options exist for choice questions
      if ((item.type === 'single-choice' || item.type === 'multiple-choice') && !item.options) {
        item.options = [];
      }
      
      return item;
    });
  }
}