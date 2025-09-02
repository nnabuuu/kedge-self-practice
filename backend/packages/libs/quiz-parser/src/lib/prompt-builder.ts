import { QuizExtractionOptions } from '@kedge/models';

type GeneratableQuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

export class QuizPromptBuilder {
  private allowedTypes: GeneratableQuizType[];
  
  constructor(options?: QuizExtractionOptions) {
    this.allowedTypes = options?.targetTypes && options.targetTypes.length > 0 
      ? (options.targetTypes as GeneratableQuizType[])
      : ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'];
  }

  /**
   * Build the complete prompt based on allowed types
   */
  buildPrompt(): string {
    const basePrompt = this.getBasePrompt();
    const typeSpecificInstructions = this.getTypeSpecificInstructions();
    const formatInstructions = this.getFormatInstructions();
    const exampleSection = this.getExampleSection();
    
    return `${basePrompt}

${typeSpecificInstructions}

${formatInstructions}

${exampleSection}

请根据下方输入提取题目并返回严格符合上述格式的 JSON。不要包含多余解释、注释或非结构化内容。`;
  }

  private getBasePrompt(): string {
    const typeDescriptions = this.getTypeDescriptions();
    
    return `你是一名出题专家，基于提供的文本段落生成中学教育题目。

要求：
1. 根据高亮内容生成题目（黄色、绿色等高亮表示重要内容）
2. 只生成以下题型：${typeDescriptions}
3. 确保题目符合中学生的认知水平
4. 所有题目都必须包含 options 字段（即使是空数组）
5. 返回 JSON 格式，包含 items 数组

题目组合规则（极其重要）：
- 题目内容经常跨多个段落，你必须智能组合它们
- 当看到题干提到"图片"、"地图"、"图表"、"下图"、"上图"、"如图"等词汇时，必须包含相邻的图片占位符段落
- 图片占位符必须保留在题干中，格式为 {{image:uuid}}`;
  }

  private getTypeDescriptions(): string {
    return this.allowedTypes.map(type => {
      switch(type) {
        case 'single-choice': return 'single-choice（单选题）';
        case 'multiple-choice': return 'multiple-choice（多选题）';
        case 'fill-in-the-blank': return 'fill-in-the-blank（填空题）';
        case 'subjective': return 'subjective（主观题）';
        default: return type;
      }
    }).join('、');
  }

  private getTypeSpecificInstructions(): string {
    const instructions: string[] = [];
    
    // Choice questions instructions
    if (this.hasChoiceQuestions()) {
      instructions.push(this.getChoiceInstructions());
    }
    
    // Fill-in-the-blank instructions
    if (this.allowedTypes.includes('fill-in-the-blank')) {
      instructions.push(this.getFillInBlankInstructions());
    }
    
    // Subjective questions instructions
    if (this.allowedTypes.includes('subjective')) {
      instructions.push(this.getSubjectiveInstructions());
    }
    
    return instructions.join('\n\n');
  }

  private getChoiceInstructions(): string {
    const isSingleChoiceOnly = this.allowedTypes.length === 1 && this.allowedTypes[0] === 'single-choice';
    const isMultipleChoiceOnly = this.allowedTypes.length === 1 && this.allowedTypes[0] === 'multiple-choice';
    
    let answerFormat = '';
    if (isSingleChoiceOnly) {
      answerFormat = '- **答案格式**：必须使用 [索引] 格式，如 [0] 表示第一个选项，[2] 表示第三个选项';
    } else if (isMultipleChoiceOnly) {
      answerFormat = '- **答案格式**：必须使用 [索引1, 索引2] 格式，如 [0,2] 表示第一和第三个选项';
    } else if (this.hasChoiceQuestions()) {
      answerFormat = `- **答案格式**：
  * single-choice: 使用 [索引] 格式，如 [0]
  * multiple-choice: 使用 [索引1, 索引2] 格式，如 [0,2]`;
    }
    
    return `选择题格式说明：
- 仅在原文中明确列出可供选择的选项(如"A."、"B."、"①"、"②"等)时，才生成选择题
- options数组中只包含选项的实际内容，不要添加A.、B.、C.、D.等字母前缀
- 选项可能跨多个段落，要完整收集所有选项
- 例如：正确的格式是 ["聚族定居", "建立国家", "冶炼青铜", "创造文字"]
- 错误的格式是 ["A．聚族定居", "B．建立国家", "C．冶炼青铜", "D．创造文字"]
${answerFormat}`;
  }

  private getFillInBlankInstructions(): string {
    return `填空题格式说明：
- 使用至少4个下划线（____）表示空格
- 如果高亮的是完整的专有名词（如"神农本草经"），应该把整个名词作为空格
  正确：东汉时的《____》是中国古代第一部药物学专著。（答案：神农本草经）
  错误：东汉时的《____本草经》是中国古代第一部药物学专著。（答案：神农）
- 空格应该对应完整的、有意义的答案，而不是词语的片段
- 高亮验证：忽略超过10个字的高亮（可能是解析错误）
- **答案格式**：使用字符串，如 "神农本草经"`;
  }

  private getSubjectiveInstructions(): string {
    return `主观题格式说明：
- 若原文中出现大段答案结果且仅有一处高亮，作为"主观题"处理
- **答案格式**：使用字符串，包含完整的答案内容`;
  }

  private getFormatInstructions(): string {
    return `返回的 JSON 格式必须完全符合以下结构：
{
  "items": [
    {
      "type": "${this.allowedTypes.join(' | ')}",
      "question": "题干（包含{{image:uuid}}占位符）",
      "options": ["选项1", "选项2", ...],  // 选择题必需，其他题型为空数组
      "answer": ${this.getAnswerFormatDescription()}
    }
  ]
}`;
  }

  private getAnswerFormatDescription(): string {
    const formats = new Set<string>();
    
    if (this.allowedTypes.includes('fill-in-the-blank') || this.allowedTypes.includes('subjective')) {
      formats.add('"答案"');
    }
    if (this.allowedTypes.includes('single-choice')) {
      formats.add('[0]');
    }
    if (this.allowedTypes.includes('multiple-choice')) {
      formats.add('[0, 1]');
    }
    
    return Array.from(formats).join(' 或 ');
  }

  private getExampleSection(): string {
    // Only show examples relevant to the allowed types
    const examples: string[] = [];
    
    if (this.allowedTypes.includes('single-choice')) {
      examples.push(this.getSingleChoiceExample());
    }
    
    if (this.allowedTypes.includes('fill-in-the-blank')) {
      examples.push(this.getFillInBlankExample());
    }
    
    if (examples.length === 0) {
      return '';
    }
    
    return `示例：
${examples.join('\n\n')}`;
  }

  private getSingleChoiceExample(): string {
    return `单选题示例：
输入：
- "1.以下历史地图能反映出什么时代特点"
- "{{image:uuid1}}{{image:uuid2}}{{image:uuid3}}"
- "春秋时期 战国时期 秦朝"
- "A．春秋时期大国争霸 B．统一趋势不断增强" (高亮: B．统一趋势不断增强)
- "C．战国时期百家争鸣 D．战争不止社会倒退"

输出：
{
  "items": [{
    "type": "single-choice",
    "question": "以下历史地图能反映出什么时代特点\\n{{image:uuid1}}{{image:uuid2}}{{image:uuid3}}\\n春秋时期 战国时期 秦朝",
    "options": ["春秋时期大国争霸", "统一趋势不断增强", "战国时期百家争鸣", "战争不止社会倒退"],
    "answer": [1]
  }]
}`;
  }

  private getFillInBlankExample(): string {
    return `填空题示例：
输入：
- "东汉时的《神农本草经》是中国古代第一部药物学专著" (高亮: 神农本草经)

输出：
{
  "items": [{
    "type": "fill-in-the-blank",
    "question": "东汉时的《____》是中国古代第一部药物学专著",
    "options": [],
    "answer": "神农本草经"
  }]
}`;
  }

  private hasChoiceQuestions(): boolean {
    return this.allowedTypes.includes('single-choice') || this.allowedTypes.includes('multiple-choice');
  }

  /**
   * Get JSON schema for the expected response format
   */
  getResponseSchema() {
    return {
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
                  enum: this.allowedTypes,
                },
                question: { type: 'string' },
                options: {
                  type: 'array',
                  items: { type: 'string' },
                },
                answer: {
                  anyOf: this.getAnswerSchemaTypes(),
                },
              },
              required: ['type', 'question', 'options', 'answer'],
            },
          },
        },
        required: ['items'],
      },
    } as const;
  }

  private getAnswerSchemaTypes() {
    const types: any[] = [];
    
    // String answer for fill-in-blank and subjective
    if (this.allowedTypes.includes('fill-in-the-blank') || this.allowedTypes.includes('subjective')) {
      types.push({ type: 'string' });
    }
    
    // Array of strings for multiple-choice with text answers (legacy support)
    if (this.allowedTypes.includes('multiple-choice')) {
      types.push({ type: 'array', items: { type: 'string' } });
    }
    
    // Array of numbers for choice questions with index answers
    if (this.hasChoiceQuestions()) {
      types.push({ type: 'array', items: { type: 'number' } });
    }
    
    return types;
  }
}