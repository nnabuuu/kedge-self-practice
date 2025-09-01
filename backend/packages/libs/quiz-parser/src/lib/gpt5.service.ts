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
    
    // Special handling for fill-in-the-blank only requests
    if (allowedTypes.length === 1 && allowedTypes[0] === 'fill-in-the-blank') {
      console.log('Using optimized per-paragraph processing for fill-in-the-blank questions (O1 model)');
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
5. 返回严格的 JSON 格式，结构如下：
{
  "items": [
    {
      "type": "single-choice" | "multiple-choice" | "fill-in-the-blank" | "subjective",
      "question": "题目内容",
      "options": ["内容1", "内容2", "内容3", "内容4"], // 选择题需要，不要包含A.B.C.D.等字母序号
      "answer": "内容" 或 ["内容1", "内容2"] // 答案为选项的内容文本，不要包含字母序号
    }
  ]
}

题目组合规则（极其重要）：
- 题目内容经常跨多个段落，你必须智能组合它们
- 典型模式：
  * 题号和题干（如"1.以下历史地图能反映出什么时代特点"）
  * 图片段落（只包含{{image:uuid}}占位符）
  * 图片说明或标签（如"春秋时期 战国时期 秦朝"）
  * 选项段落（如"A．春秋时期大国争霸B．统一趋势不断增强"）
- 当看到题干提到"图片"、"地图"、"图表"、"下图"、"上图"、"如图"等词汇时，必须包含相邻的图片占位符段落
- 图片占位符必须保留在题干中，格式为 {{image:uuid}}

选择题格式说明：
- options数组中只包含选项的实际内容，不要添加A.、B.、C.、D.等字母前缀
- 选项可能跨多个段落，要完整收集所有选项（如A、B在一个段落，C、D在下一个段落）
- 例如：正确的格式是 ["聚族定居", "建立国家", "冶炼青铜", "创造文字"]
- 错误的格式是 ["A．聚族定居", "B．建立国家", "C．冶炼青铜", "D．创造文字"]
- answer字段也应该只包含选项内容，如 "聚族定居"，而不是 "A．聚族定居"
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
  从长句中提取核心词汇作为填空内容

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

  /**
   * Process fill-in-the-blank questions one paragraph at a time with context
   * Optimized for O1 models with their specific constraints
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
          console.log(`O1: Generated fill-in-blank for paragraph ${i + 1}/${paragraphs.length}`);
        }
      } catch (error) {
        console.error(`O1: Failed to generate quiz for paragraph ${i + 1}:`, error);
        // Continue with next paragraph even if one fails
      }
    }
    
    return results.slice(0, maxItems);
  }

  /**
   * Generate a single fill-in-the-blank question with context (O1 optimized)
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
  "answer": "答案" 或 ["答案1", "答案2"]
}

注意：这是第 ${paragraphNumber} 段，共 ${totalParagraphs} 段。必须为这个段落生成题目，不要跳过。`;

    const modelConfig = getModelConfig('quizParser');
    
    try {
      const response = await this.openai.chat.completions.create({
        model: modelConfig.model,
        // O1 models don't support temperature or top_p
        max_completion_tokens: 500, // Smaller limit for single question
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_object', // O1 models only support json_object
        },
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error(`O1: Empty response for paragraph ${paragraphNumber}`);
        return null;
      }
      
      try {
        const parsed = JSON.parse(content);
        // Ensure options field exists (even as empty array)
        const item: QuizItem = {
          type: 'fill-in-the-blank',
          question: parsed.question || '',
          options: [], // Always include options for consistency
          answer: parsed.answer || '',
          alternative_answers: [], // Required field
        };
        
        // Post-process to ensure blanks exist
        if (!item.question.includes('____')) {
          console.warn(`O1: No blanks in question for paragraph ${paragraphNumber}, attempting to fix...`);
          const fixed = this.autoAddBlanksToQuestion(item);
          return fixed;
        }
        
        return item;
      } catch (parseError) {
        console.error(`O1: Failed to parse response for paragraph ${paragraphNumber}:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`O1: Failed to generate fill-in-blank for paragraph ${paragraphNumber}:`, error);
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
      
      // Ensure options exist for choice questions and clean up prefixes
      if ((item.type === 'single-choice' || item.type === 'multiple-choice')) {
        if (!item.options) {
          item.options = [];
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