/**
 * QuizType值对象 - 封装题目类型相关的业务规则
 *
 * Value Object特点:
 * 1. Immutable (不可变)
 * 2. 无唯一标识
 * 3. 通过值比较相等性
 * 4. 包含业务规则
 */
export class QuizType {
  private static readonly CHOICE_TYPES = ['single-choice', 'multiple-choice'];
  private static readonly VALID_TYPES = [
    'single-choice',
    'multiple-choice',
    'fill-in-the-blank',
    'subjective',
    'other',
  ];

  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(
        `Invalid quiz type: ${value}. Valid types: ${QuizType.VALID_TYPES.join(', ')}`
      );
    }
  }

  // 工厂方法
  static fromString(type: string): QuizType {
    return new QuizType(type);
  }

  static singleChoice(): QuizType {
    return new QuizType('single-choice');
  }

  static multipleChoice(): QuizType {
    return new QuizType('multiple-choice');
  }

  static fillInTheBlank(): QuizType {
    return new QuizType('fill-in-the-blank');
  }

  static subjective(): QuizType {
    return new QuizType('subjective');
  }

  // 业务规则: 判断是否是选择题
  isChoiceType(): boolean {
    return QuizType.CHOICE_TYPES.includes(this.value);
  }

  // 业务规则: 判断是否需要选项
  requiresOptions(): boolean {
    return this.isChoiceType();
  }

  // 业务规则: 判断是否需要answer_index
  requiresAnswerIndex(): boolean {
    return this.isChoiceType();
  }

  // 业务规则: 是否支持多个答案
  supportsMultipleAnswers(): boolean {
    return this.value === 'multiple-choice';
  }

  isSingleChoice(): boolean {
    return this.value === 'single-choice';
  }

  isMultipleChoice(): boolean {
    return this.value === 'multiple-choice';
  }

  isFillInTheBlank(): boolean {
    return this.value === 'fill-in-the-blank';
  }

  isSubjective(): boolean {
    return this.value === 'subjective';
  }

  toString(): string {
    return this.value;
  }

  equals(other: QuizType): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  private isValid(type: string): boolean {
    return QuizType.VALID_TYPES.includes(type);
  }
}
