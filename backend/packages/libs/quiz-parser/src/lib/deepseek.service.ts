import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GptParagraphBlock, QuizItem, QuizExtractionResult, QuizExtractionOptions } from '@kedge/models';
import { getDeepSeekConfig, getModelConfig, getAutoBaseURL } from '@kedge/configs';

type GeneratableQuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

@Injectable()
export class DeepSeekService {
  private readonly deepseek: OpenAI;
  private readonly config = getDeepSeekConfig();

  constructor() {
    // Use the unified config with automatic base URL detection
    const baseURL = this.config.baseURL || getAutoBaseURL('deepseek');
    
    this.deepseek = new OpenAI({
      apiKey: this.config.apiKey || 'dummy',
      baseURL: baseURL,
    });
  }

  async extractQuizItems(
    paragraphs: GptParagraphBlock[], 
    options?: QuizExtractionOptions
  ): Promise<QuizItem[]> {
    console.log('=== DeepSeek Input Debug ===');
    console.log('Number of paragraphs:', paragraphs.length);

    const jsonString = JSON.stringify(paragraphs, null, 2);
    console.log('Total JSON string length:', jsonString.length);
    console.log('Estimated tokens (rough):', Math.ceil(jsonString.length / 4));

    // Check data size limits
    if (jsonString.length > 500000) {
      console.error('Data exceeds safe limits! Rejecting request.');
      return [{
        type: 'other',
        question: '文档内容过大，无法处理。请尝试上传较小的文档或分段处理。',
        answer: `数据大小: ${Math.ceil(jsonString.length / 4)} tokens (超过限制)`
      }] as QuizItem[];
    }

    // Truncate if needed
    if (jsonString.length > 400000) {
      console.warn('Data is large, truncating paragraphs for safety...');
      paragraphs = paragraphs.slice(0, 10);
    }

    // Build allowed types based on options (excluding 'other' type)
    const allowedTypes: GeneratableQuizType[] = options?.targetTypes && options.targetTypes.length > 0 
      ? (options.targetTypes as GeneratableQuizType[])
      : ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'];
    
    // Special handling for fill-in-the-blank only requests
    if (allowedTypes.length === 1 && allowedTypes[0] === 'fill-in-the-blank') {
      console.log('DeepSeek: Using optimized per-paragraph processing for fill-in-the-blank questions');
      return this.extractFillInBlankItemsPerParagraph(paragraphs, options);
    }
    
    const typeDescriptions = allowedTypes.map(type => {
      switch(type) {
        case 'single-choice': return '"single-choice"（单选题）';
        case 'multiple-choice': return '"multiple-choice"（多选题）';
        case 'fill-in-the-blank': return '"fill-in-the-blank"（填空题）';
        case 'subjective': return '"subjective"（主观题）';
        default: return `"${type}"`;
      }
    }).join('、');

    // Create prompt with JSON example for DeepSeek
    const systemPrompt = `你是一个教育出题助手。你的任务是从提供的段落中提取题目，并严格基于高亮部分生成题干和答案。

请遵守以下规则：
1. 只能使用输入中的内容（包括高亮和原文），绝不能添加或虚构任何新的内容、选项或表述
2. 保持完整的题干上下文，包括 {{image:uuid}} 表示的图片占位符
3. 高亮的内容为答案或重要知识点，请据此推断题型和正确答案
4. 题目内容可能跨段落存在，请将这些内容一并包括在题目中
5. 仅在原文中明确列出可供选择的选项时，才生成选择题
6. 若原文中未明确列出多个选项但包含高亮词汇，作为"填空题"处理
7. 若原文中出现大段答案结果且仅有一处高亮，作为"主观题"处理
8. 去除题干/选项/答案开头的编号（如"1."、"①"、"A."等）
9. 只生成以下题型：${typeDescriptions}

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
  从长句中提取核心词汇作为填空内容

请输出 JSON 格式，包含 items 数组，每个题目包含：
- type: ${typeDescriptions}
- question: 题干
- options: 选项数组（仅选择题需要）
- answer: 答案（选择题为索引数组，填空题为字符串数组，其他为字符串）

示例 JSON 输出：
{
  "items": [
    {
      "type": "single-choice",
      "question": "中国的首都是哪个城市？",
      "options": ["北京", "上海", "广州", "深圳"],
      "answer": [0]
    },
    {
      "type": "fill-in-the-blank", 
      "question": "春秋时期，中原各国自称____。",
      "answer": ["华夏"]
    },
    {
      "type": "subjective",
      "question": "简述儒家代表人物孟子的核心思想。",
      "answer": "仁政"
    }
  ]
}`;

    const userPrompt = `请从以下段落中提取题目，输出 JSON 格式：

${JSON.stringify(paragraphs, null, 2)}`;

    try {
      const modelConfig = getModelConfig('quizParser');
      // Use the model from config, which should start with 'deepseek-'
      const model = modelConfig.model.startsWith('deepseek') 
        ? modelConfig.model 
        : 'deepseek-chat'; // Fallback to default DeepSeek model
        
      const response = await this.deepseek.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature ?? 0.7,
        max_tokens: modelConfig.maxTokens ?? 4000,
        top_p: modelConfig.topP,
        response_format: {
          type: 'json_object'
        }
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error('DeepSeek returned empty response');
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
        
        // Process fill-in-the-blank questions
        const processedItems: QuizItem[] = [];
        for (const item of items) {
          if (item.type === 'fill-in-the-blank' && item.question) {
            const blanksCount = item.question.split(/_{2,}/g).length - 1;
            
            if (blanksCount === 0) {
              console.warn(`Fill-in-the-blank question has no blanks: "${item.question}"`);
              
              // First try to fix it locally by replacing answer text with blanks
              let fixedItem = { ...item };
              if (fixedItem.answer) {
                const answers = Array.isArray(fixedItem.answer) ? fixedItem.answer : [fixedItem.answer];
                let fixedQuestion = fixedItem.question;
                
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
                    if (!replaced && fixedQuestion === fixedItem.question) {
                      fixedQuestion = fixedQuestion.replace(/[。？！?!]$/, '') + '____。';
                    }
                  }
                }
                
                if (fixedQuestion !== fixedItem.question) {
                  console.log(`Auto-fixed fill-in-blank locally: "${fixedItem.question}" -> "${fixedQuestion}"`);
                  fixedItem.question = fixedQuestion;
                }
              }
              
              // Check if local fix worked
              const fixedBlanksCount = fixedItem.question.split(/_{2,}/g).length - 1;
              if (fixedBlanksCount > 0) {
                processedItems.push(fixedItem);
              } else {
                // If local fix didn't work, try to regenerate with API
                let retryCount = 0;
                let regeneratedItem = fixedItem;
                
                while (retryCount < 3 && regeneratedItem.question.split(/_{2,}/g).length - 1 === 0) {
                  retryCount++;
                  console.log(`Retrying generation for fill-in-the-blank question (attempt ${retryCount}/3)...`);
                  
                  try {
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
              }
            } else {
              processedItems.push(item);
            }
          } else {
            processedItems.push(item);
          }
        }
        
        return processedItems;
      } catch (error) {
        console.error('Failed to parse DeepSeek response as JSON:', error);
        console.error('Raw response:', content);
        
        // Try to extract JSON from the content
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed: QuizExtractionResult = JSON.parse(jsonMatch[0]);
            return parsed.items ?? [];
          } catch (secondError) {
            console.error('Failed to extract JSON from content:', secondError);
          }
        }
        
        return [];
      }
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  /**
   * Process fill-in-the-blank questions one paragraph at a time with context
   * Optimized for DeepSeek models
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
          console.log(`DeepSeek: Generated fill-in-blank for paragraph ${i + 1}/${paragraphs.length}`);
        }
      } catch (error) {
        console.error(`DeepSeek: Failed to generate quiz for paragraph ${i + 1}:`, error);
        // Continue with next paragraph even if one fails
      }
    }
    
    return results.slice(0, maxItems);
  }

  /**
   * Generate a single fill-in-the-blank question with context (DeepSeek optimized)
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
    const systemPrompt = `你是一个教育出题助手。为当前段落生成一道填空题。

规则：
1. 必须基于当前段落的高亮内容生成填空题
2. 使用至少4个下划线（____）作为空格标记
3. 高亮验证：忽略超过10个字的高亮（可能是解析错误）
4. 如果所有高亮都过长，提取关键概念：人名、地名、时间、数字、专有名词
5. 答案应该是完整的、有意义的内容
6. 返回 JSON 格式

填空题示例：
- 如果高亮是"神农本草经"，题目：东汉时的《____》是中国古代第一部药物学专著。
- 答案："神农本草经"（完整名称）

输出 JSON 格式：
{
  "type": "fill-in-the-blank",
  "question": "题目内容，包含____空格",
  "answer": ["答案"] 或 ["答案1", "答案2"]
}`;

    const userPrompt = `当前段落（第 ${paragraphNumber}/${totalParagraphs} 段）：
${JSON.stringify(context.current, null, 2)}

${context.previous ? `上文（仅供理解上下文）：
${JSON.stringify(context.previous, null, 2)}` : ''}

${context.next ? `下文（仅供理解上下文）：
${JSON.stringify(context.next, null, 2)}` : ''}

请为当前段落生成一道填空题。这是第 ${paragraphNumber} 段，共 ${totalParagraphs} 段，必须生成题目。`;

    try {
      const modelConfig = getModelConfig('quizParser');
      const model = modelConfig.model.startsWith('deepseek') 
        ? modelConfig.model 
        : 'deepseek-chat';
        
      const response = await this.deepseek.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: modelConfig.temperature ?? 0.3,
        max_tokens: 500, // Smaller limit for single question
        top_p: modelConfig.topP,
        response_format: {
          type: 'json_object'
        }
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content || content.trim() === '') {
        console.error(`DeepSeek: Empty response for paragraph ${paragraphNumber}`);
        return null;
      }

      try {
        const parsed = JSON.parse(content);
        const item: QuizItem = {
          type: 'fill-in-the-blank',
          question: parsed.question || '',
          options: [], // Always include empty options for consistency
          answer: parsed.answer || '',
          alternative_answers: [], // Required field
        };
        
        // Post-process to ensure blanks exist
        if (!item.question.includes('____')) {
          console.warn(`DeepSeek: No blanks in question for paragraph ${paragraphNumber}, attempting to fix...`);
          // Try local fix first
          const fixed = this.autoAddBlanksToQuestion(item);
          if (fixed.question.includes('____')) {
            return fixed;
          }
          // If local fix failed, try regeneration (existing method)
          return await this.regenerateFillInBlankWithBlanks(item);
        }
        
        return item;
      } catch (parseError) {
        console.error(`DeepSeek: Failed to parse response for paragraph ${paragraphNumber}:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`DeepSeek: API error for paragraph ${paragraphNumber}:`, error);
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

  private async regenerateFillInBlankWithBlanks(item: QuizItem): Promise<QuizItem> {
    const systemPrompt = `你是一个教育出题助手。请修正以下填空题，确保包含正确的空格标记。

规则：
1. 使用至少4个下划线（____）作为空格标记
2. 空格位置应对应答案数组中的每个答案
3. 保持题目核心内容不变
4. 输出完整的 JSON 格式

示例输出：
{
  "type": "fill-in-the-blank",
  "question": "中国的首都是____，最大的城市是____。",
  "answer": ["北京", "上海"]
}`;

    const userPrompt = `请修正这个填空题，添加正确的空格标记（____）：

${JSON.stringify(item, null, 2)}

输出修正后的 JSON：`;

    try {
      const response = await this.deepseek.chat.completions.create({
        model: this.config.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: {
          type: 'json_object'
        }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as QuizItem;
      }
    } catch (error) {
      console.error('Failed to regenerate fill-in-the-blank:', error);
    }
    
    return item;
  }
}