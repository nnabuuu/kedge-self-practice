/**
 * Answer值对象 - 封装答案相关的业务规则
 *
 * 支持多种答案格式:
 * - 单个文本答案: "Paris"
 * - 多个文本答案: ["Paris", "London"]
 * - 索引答案: [0, 2]
 */
export class Answer {
  private constructor(
    private readonly value: string | string[],
    private readonly indices: number[]
  ) {}

  /**
   * 从文本创建Answer (适用于选择题)
   */
  static fromText(text: string | string[], options: string[]): Answer {
    const textArray = Array.isArray(text) ? text : [text];
    const indices = textArray
      .map((t) => options.indexOf(t))
      .filter((idx) => idx !== -1);

    if (indices.length === 0) {
      throw new Error(`Answer text not found in options: ${textArray.join(', ')}`);
    }

    return new Answer(text, indices);
  }

  /**
   * 从索引创建Answer (适用于选择题)
   */
  static fromIndices(indices: number[], options: string[]): Answer {
    // 验证索引有效性
    const maxIndex = options.length - 1;
    const invalidIndices = indices.filter((idx) => idx < 0 || idx > maxIndex);
    if (invalidIndices.length > 0) {
      throw new Error(
        `Invalid answer indices: ${invalidIndices.join(', ')}. Options length: ${
          options.length
        }`
      );
    }

    const textArray = indices.map((idx) => options[idx]).filter((t) => t);
    const value = textArray.length === 1 ? textArray[0] : textArray;

    return new Answer(value, indices);
  }

  /**
   * 从原始文本创建Answer (适用于填空题)
   */
  static fromRawText(text: string | string[]): Answer {
    return new Answer(text, []);
  }

  getText(): string | string[] {
    return this.value;
  }

  getIndices(): number[] {
    return [...this.indices]; // 返回副本保证不可变性
  }

  getSingleIndex(): number {
    if (this.indices.length !== 1) {
      throw new Error('Answer has multiple indices');
    }
    return this.indices[0];
  }

  hasIndices(): boolean {
    return this.indices.length > 0;
  }

  /**
   * 业务规则: 验证答案是否匹配
   * @param userAnswer 用户答案
   * @param allowOrderIndependent 是否允许顺序无关 (多选题)
   */
  matches(userAnswer: Answer, allowOrderIndependent: boolean = false): boolean {
    const userIndices = userAnswer.getIndices();
    const correctIndices = this.indices;

    if (userIndices.length !== correctIndices.length) {
      return false;
    }

    if (allowOrderIndependent) {
      // 多选题顺序无关
      const sortedUser = [...userIndices].sort((a, b) => a - b);
      const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
      return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    }

    // 单选题或顺序相关
    return JSON.stringify(userIndices) === JSON.stringify(correctIndices);
  }

  /**
   * 文本匹配 (适用于填空题,不区分大小写)
   */
  matchesText(
    userText: string | string[],
    alternativeAnswers: string[] = []
  ): boolean {
    const userArray = Array.isArray(userText) ? userText : [userText];
    const correctArray = Array.isArray(this.value) ? this.value : [this.value];

    if (userArray.length !== correctArray.length) {
      return false;
    }

    return userArray.every((userAns, idx) => {
      const correct = correctArray[idx];
      return this.matchesSingleText(userAns, correct, alternativeAnswers);
    });
  }

  private matchesSingleText(
    userAns: string,
    correctAns: string,
    alternativeAnswers: string[]
  ): boolean {
    // 不区分大小写比较
    const userLower = userAns.trim().toLowerCase();
    const correctLower = correctAns.trim().toLowerCase();

    if (userLower === correctLower) {
      return true;
    }

    // 检查alternative_answers
    return alternativeAnswers.some((alt) => userLower === alt.trim().toLowerCase());
  }

  equals(other: Answer): boolean {
    if (!other) return false;

    // 如果有索引,比较索引
    if (this.indices.length > 0 && other.indices.length > 0) {
      const sortedThis = [...this.indices].sort((a, b) => a - b);
      const sortedOther = [...other.indices].sort((a, b) => a - b);
      return JSON.stringify(sortedThis) === JSON.stringify(sortedOther);
    }

    // 否则比较文本
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
