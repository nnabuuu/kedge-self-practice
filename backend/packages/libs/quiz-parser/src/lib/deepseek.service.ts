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

填空题特别说明：
- 如果高亮的是完整的专有名词（如"神农本草经"），应该把整个名词作为空格
  正确：东汉时的《____》是中国古代第一部药物学专著。（答案：神农本草经）
  错误：东汉时的《____本草经》是中国古代第一部药物学专著。（答案：神农）
- 如果高亮的是短语或概念，应该把核心部分作为空格
- 空格应该对应完整的、有意义的答案，而不是词语的片段

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