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
- 图片占位符必须保留在题干中，格式为 {{image:uuid}}
- **组合型选择题识别**：如果看到①②③④等编号的陈述，后面跟着A.B.C.D.选项（选项内容是①②③④的组合），这是组合型选择题
  * 题干应包含所有编号陈述（①②③④的内容）
  * 选项是A.B.C.D.后面的组合（如"①②", "③④"等）
  * 不要把①②③④当作选项`;
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
- 仅在原文中明确列出可供选择的选项(如"A."、"B."、"C."、"D."等)时，才生成选择题
- **重要区分**：
  * 如果看到①②③④这样的编号后跟着A.B.C.D.选项，①②③④是陈述内容，A.B.C.D.才是真正的选项
  * 例如：题目有①②③④四个陈述，然后有"A. ①② B. ①④ C. ②③ D. ③④"，选项应该是["①②", "①④", "②③", "③④"]
  * 不要把①②③④当作选项
- options数组中只包含选项的实际内容，不要添加A.、B.、C.、D.等字母前缀
- 选项可能跨多个段落，要完整收集所有选项
- 例如：正确的格式是 ["①②", "①④", "②③", "③④"] 或 ["聚族定居", "建立国家", "冶炼青铜", "创造文字"]
- 错误的格式是 ["A. ①②", "B. ①④", "C. ②③", "D. ③④"]
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

填空题提示词（hints）说明：
- 为每个空格提供一个简洁的提示词（2-4个字），描述答案的类型
- 提示词应该帮助学生理解需要填写什么类型的内容，但不能透露答案
- 如果答案从上下文很明显，可以不提供提示（使用null）
- 历史题目常用提示词：
  * 时间类：年份、朝代、世纪、时期、年代
  * 人物类：人名、皇帝、领袖、思想家、将领
  * 地理类：地名、国家、都城、地区、关隘
  * 事件类：战争、事件、条约、改革、起义
  * 文化类：著作、发明、制度、学派、文物
  * 其他类：数字、称号、民族、王朝、组织

格式要求：
- **答案格式**：
  * 单个空格：answer: "答案", hints: ["提示"]
  * 多个空格：answer: ["答案1", "答案2"], hints: ["提示1", "提示2"]
  * 不需要提示的空格用null：hints: [null, "提示2"]`;
  }

  private getSubjectiveInstructions(): string {
    return `主观题格式说明：
- 若原文中出现大段答案结果且仅有一处高亮，作为"主观题"处理
- **答案格式**：使用字符串，包含完整的答案内容`;
  }

  private getFormatInstructions(): string {
    const includeHints = this.allowedTypes.includes('fill-in-the-blank');
    return `返回的 JSON 格式必须完全符合以下结构：
{
  "items": [
    {
      "type": "${this.allowedTypes.join(' | ')}",
      "question": "题干（包含{{image:uuid}}占位符）",
      "options": ["选项1", "选项2", ...],  // 选择题必需，其他题型为空数组
      "answer": ${this.getAnswerFormatDescription()}${includeHints ? ',\n      "hints": ["提示1", null, "提示3"]  // 填空题必需，每个空格对应一个提示（可为null）' : ''}
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
    return `单选题示例1（普通选择题）：
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
}

单选题示例2（组合型选择题）：
输入：
- "5. 以下科技发明成果，属于魏晋南北朝时期的是"
- "①蔡伦改进造纸术，纸成为主要书写材料"
- "②算出圆周率在3.1415926-3.1415927之间"
- "③《禹贡地域图》提出绘制地图的方法"
- "④印刷术、火药和指南针三大发明基本成熟"
- "A. ①②    B. ①④    C. ②③    D. ③④" (高亮: C. ②③)

输出：
{
  "items": [{
    "type": "single-choice",
    "question": "以下科技发明成果，属于魏晋南北朝时期的是\\n①蔡伦改进造纸术，纸成为主要书写材料\\n②算出圆周率在3.1415926-3.1415927之间\\n③《禹贡地域图》提出绘制地图的方法\\n④印刷术、火药和指南针三大发明基本成熟",
    "options": ["①②", "①④", "②③", "③④"],
    "answer": [2]
  }]
}`;
  }

  private getFillInBlankExample(): string {
    return `填空题示例1（单个空格）：
输入：
- "东汉时的《神农本草经》是中国古代第一部药物学专著" (高亮: 神农本草经)

输出：
{
  "items": [{
    "type": "fill-in-the-blank",
    "question": "东汉时的《____》是中国古代第一部药物学专著",
    "options": [],
    "answer": "神农本草经",
    "hints": ["著作"]
  }]
}

填空题示例2（多个空格）：
输入：
- "1949年10月1日，毛泽东在北京宣布中华人民共和国成立" (高亮: 1949, 毛泽东)

输出：
{
  "items": [{
    "type": "fill-in-the-blank",
    "question": "____年10月1日，____在北京宣布中华人民共和国成立",
    "options": [],
    "answer": ["1949", "毛泽东"],
    "hints": ["年份", "领袖"]
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
                hints: {
                  type: 'array',
                  items: {
                    anyOf: [
                      { type: 'string' },
                      { type: 'null' }
                    ]
                  },
                  description: '填空题的提示词数组，每个空格对应一个提示'
                },
              },
              required: ['type', 'question', 'options', 'answer', 'hints'],
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