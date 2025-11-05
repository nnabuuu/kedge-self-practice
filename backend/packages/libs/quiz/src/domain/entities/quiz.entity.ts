import { QuizType } from '../value-objects/quiz-type';
import { Answer } from '../value-objects/answer';
import { KnowledgePointId } from '../value-objects/knowledge-point-id';

/**
 * Quiz实体 - 富领域模型
 *
 * 职责:
 * 1. 封装Quiz相关的业务逻辑
 * 2. 保证业务不变量 (invariants)
 * 3. 提供业务操作方法
 *
 * 特点:
 * - 有唯一标识 (id)
 * - 包含状态和行为
 * - 自我验证
 */
export class Quiz {
  private constructor(
    private readonly id: string | undefined,
    private readonly type: QuizType,
    private readonly question: string,
    private readonly answer: Answer,
    private readonly options: string[],
    private knowledgePointId: KnowledgePointId,
    private readonly alternativeAnswers: string[],
    private readonly explanation?: string,
    private readonly hints?: (string | null)[],
    private readonly extraProperties?: Record<string, any>,
    private readonly images?: string[],
    private readonly tags?: string[]
  ) {
    this.validateInvariants();
  }

  /**
   * 工厂方法: 从原始数据创建Quiz实体
   */
  static create(data: {
    id?: string;
    type: string;
    question: string;
    answer?: string | string[] | number[];
    answer_index?: number[];
    options?: string[];
    knowledge_point_id: string;
    alternative_answers?: string[];
    explanation?: string;
    hints?: (string | null)[];
    extra_properties?: Record<string, any>;
    images?: string[];
    tags?: string[];
  }): Quiz {
    const type = QuizType.fromString(data.type);

    // 处理选择题的options
    const options = data.options || [];

    // 构建Answer值对象
    let answer: Answer;
    if (type.isChoiceType()) {
      // 选择题: 优先使用answer_index,其次使用answer文本
      if (data.answer_index && data.answer_index.length > 0) {
        answer = Answer.fromIndices(data.answer_index, options);
      } else if (data.answer) {
        const answerText = Array.isArray(data.answer)
          ? data.answer.map((a) => String(a))
          : String(data.answer);
        answer = Answer.fromText(answerText, options);
      } else {
        throw new Error('Choice questions must have either answer or answer_index');
      }
    } else {
      // 填空题/主观题: 直接使用文本答案
      if (!data.answer) {
        throw new Error('Quiz must have an answer');
      }
      answer = Answer.fromRawText(data.answer as string | string[]);
    }

    const knowledgePointId = KnowledgePointId.from(data.knowledge_point_id);

    return new Quiz(
      data.id,
      type,
      data.question,
      answer,
      options,
      knowledgePointId,
      data.alternative_answers || [],
      data.explanation,
      data.hints,
      data.extra_properties,
      data.images,
      data.tags
    );
  }

  /**
   * 工厂方法: 从持久化数据恢复
   */
  static fromPersistence(data: any): Quiz {
    return Quiz.create(data);
  }

  /**
   * 业务规则验证 - 不变量检查
   * 这些规则在Quiz的整个生命周期内都必须满足
   */
  private validateInvariants(): void {
    // 规则1: 选择题必须有选项
    if (this.type.requiresOptions() && this.options.length === 0) {
      throw new Error(
        `${this.type.toString()} questions must have options. Question: "${this.question}"`
      );
    }

    // 规则2: 单选题答案只能有一个
    if (this.type.isSingleChoice() && this.answer.getIndices().length !== 1) {
      throw new Error(
        `Single choice question must have exactly one answer. Got ${
          this.answer.getIndices().length
        } answers`
      );
    }

    // 规则3: 多选题答案至少两个
    if (this.type.isMultipleChoice() && this.answer.getIndices().length < 2) {
      throw new Error(
        `Multiple choice question must have at least two answers. Got ${
          this.answer.getIndices().length
        } answer(s)`
      );
    }

    // 规则4: 答案索引不能超出选项范围
    if (this.answer.hasIndices()) {
      const maxIndex = this.options.length - 1;
      if (this.answer.getIndices().some((idx) => idx > maxIndex || idx < 0)) {
        throw new Error(
          `Answer index out of options range. Indices: [${this.answer
            .getIndices()
            .join(', ')}], Options length: ${this.options.length}`
        );
      }
    }

    // 规则5: 题目不能为空
    if (!this.question || this.question.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }
  }

  /**
   * 业务逻辑: 验证用户答案
   * 这是Quiz最重要的业务方法之一
   */
  validateUserAnswer(userAnswer: string | string[] | number[]): boolean {
    // 填空题特殊处理
    if (this.type.isFillInTheBlank()) {
      return this.validateFillInTheBlank(userAnswer);
    }

    // 选择题处理
    const userAnswerObj = this.parseUserAnswer(userAnswer);
    const isOrderIndependent = this.type.isMultipleChoice();

    return this.answer.matches(userAnswerObj, isOrderIndependent);
  }

  /**
   * 业务逻辑: 填空题验证
   * 支持:
   * - Alternative answers (备选答案)
   * - Order-independent groups (顺序无关组)
   * - 不区分大小写
   */
  private validateFillInTheBlank(userAnswer: string | string[] | number[]): boolean {
    const userAnswerArray = Array.isArray(userAnswer)
      ? userAnswer.map(a => String(a))
      : [String(userAnswer)];
    const correctAnswer = this.answer.getText();
    const correctAnswers = Array.isArray(correctAnswer)
      ? correctAnswer
      : [correctAnswer];

    // 检查长度
    if (userAnswerArray.length !== correctAnswers.length) {
      return false;
    }

    // 检查是否有order-independent-groups
    const orderGroups = this.extraProperties?.[
      'order-independent-groups'
    ] as number[][] | undefined;

    if (orderGroups && orderGroups.length > 0) {
      return this.validateWithOrderIndependentGroups(
        userAnswerArray,
        correctAnswers as string[],
        orderGroups
      );
    }

    // 标准验证(考虑alternative_answers)
    return userAnswerArray.every((userAns, idx) => {
      const correct = correctAnswers[idx] as string;
      return this.matchesWithAlternatives(userAns, correct);
    });
  }

  /**
   * 业务逻辑: 支持顺序无关组的验证
   * 例如: "____和____是改革家" 答案可以是 ["康有为", "梁启超"] 或 ["梁启超", "康有为"]
   */
  private validateWithOrderIndependentGroups(
    userAnswers: string[],
    correctAnswers: string[],
    orderGroups: number[][]
  ): boolean {
    const userCopy = [...userAnswers];
    const correctCopy = [...correctAnswers];

    // 对每个顺序无关组,排序后比较
    for (const group of orderGroups) {
      const userGroupAnswers = group.map((idx) => userCopy[idx]).sort();
      const correctGroupAnswers = group.map((idx) => correctCopy[idx]).sort();

      // 每个答案都要匹配(考虑alternative_answers)
      const allMatch = userGroupAnswers.every((userAns, idx) => {
        const correctAns = correctGroupAnswers[idx];
        return this.matchesWithAlternatives(userAns, correctAns);
      });

      if (!allMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * 业务逻辑: 匹配答案(考虑alternative_answers)
   */
  private matchesWithAlternatives(userAnswer: string, correctAnswer: string): boolean {
    const userLower = userAnswer.trim().toLowerCase();
    const correctLower = correctAnswer.trim().toLowerCase();

    if (userLower === correctLower) {
      return true;
    }

    return this.alternativeAnswers.some(
      (alt) => userLower === alt.trim().toLowerCase()
    );
  }

  /**
   * 辅助方法: 解析用户答案为Answer对象
   */
  private parseUserAnswer(userAnswer: string | string[] | number[]): Answer {
    // 如果是数字数组,直接作为索引
    if (Array.isArray(userAnswer) && typeof userAnswer[0] === 'number') {
      return Answer.fromIndices(userAnswer as number[], this.options);
    }

    // 如果是字符串数组或单个字符串,尝试作为文本或索引
    if (typeof userAnswer === 'string' || Array.isArray(userAnswer)) {
      // 先尝试作为文本
      try {
        return Answer.fromText(userAnswer as string | string[], this.options);
      } catch {
        // 如果文本不在options中,尝试作为字符串索引 "0", "1"
        if (typeof userAnswer === 'string' && !isNaN(Number(userAnswer))) {
          return Answer.fromIndices([Number(userAnswer)], this.options);
        }
        if (
          Array.isArray(userAnswer) &&
          userAnswer.every((a) => typeof a === 'string' && !isNaN(Number(a)))
        ) {
          return Answer.fromIndices(
            userAnswer.map((a) => Number(a)),
            this.options
          );
        }
        throw new Error(`Unable to parse user answer: ${userAnswer}`);
      }
    }

    throw new Error(`Unsupported user answer format: ${typeof userAnswer}`);
  }

  /**
   * 业务逻辑: 更改知识点
   * 这可能会触发领域事件: QuizKnowledgePointChanged
   */
  changeKnowledgePoint(newKnowledgePointId: KnowledgePointId): void {
    if (this.knowledgePointId.equals(newKnowledgePointId)) {
      return; // 无变化
    }

    this.knowledgePointId = newKnowledgePointId;
    // TODO: 触发领域事件
    // this.addDomainEvent(new QuizKnowledgePointChanged(this.id, newKnowledgePointId));
  }

  /**
   * 业务逻辑: 检查是否需要改进(根据错误率)
   */
  needsImprovement(errorRate: number): boolean {
    return errorRate > 0.5; // 错误率超过50%
  }

  /**
   * 业务逻辑: 是否应该显示提示
   */
  shouldShowHints(attemptCount: number): boolean {
    return this.type.isFillInTheBlank() && attemptCount >= 2;
  }

  // ==================== Getters ====================

  getId(): string | undefined {
    return this.id;
  }

  getType(): QuizType {
    return this.type;
  }

  getQuestion(): string {
    return this.question;
  }

  getAnswer(): Answer {
    return this.answer;
  }

  getOptions(): string[] {
    return [...this.options]; // 返回副本保证不可变性
  }

  getKnowledgePointId(): KnowledgePointId {
    return this.knowledgePointId;
  }

  getAlternativeAnswers(): string[] {
    return [...this.alternativeAnswers];
  }

  getExplanation(): string | undefined {
    return this.explanation;
  }

  getHints(): (string | null)[] | undefined {
    return this.hints ? [...this.hints] : undefined;
  }

  getImages(): string[] | undefined {
    return this.images ? [...this.images] : undefined;
  }

  getTags(): string[] | undefined {
    return this.tags ? [...this.tags] : undefined;
  }

  // ==================== Persistence ====================

  /**
   * 转换为持久化格式 (数据库/API)
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id,
      type: this.type.toString(),
      question: this.question,
      answer: this.answer.getText(),
      answer_index: this.answer.hasIndices() ? this.answer.getIndices() : null,
      options: this.options.length > 0 ? this.options : undefined,
      knowledge_point_id: this.knowledgePointId.toString(),
      alternative_answers: this.alternativeAnswers,
      explanation: this.explanation,
      hints: this.hints,
      extra_properties: this.extraProperties,
      images: this.images,
      tags: this.tags,
    };
  }

  /**
   * 转换为API响应格式 (可能需要隐藏答案)
   */
  toApiResponse(includeAnswer: boolean = true): Record<string, any> {
    const response: any = {
      id: this.id,
      type: this.type.toString(),
      question: this.question,
      options: this.options.length > 0 ? this.options : undefined,
      images: this.images,
      tags: this.tags,
      hints: this.hints,
    };

    if (includeAnswer) {
      response.answer = this.answer.getText();
      response.answer_index = this.answer.hasIndices()
        ? this.answer.getIndices()
        : undefined;
      response.alternative_answers = this.alternativeAnswers;
      response.explanation = this.explanation;
    }

    return response;
  }
}
