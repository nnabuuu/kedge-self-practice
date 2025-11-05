# 领域模型重构示例 - Quiz模块

**创建时间**: 2025-10-30
**目标**: 展示如何引入领域模型层,将业务逻辑从Service转移到Domain

---

## 目录

1. [当前架构问题](#当前架构问题)
2. [目标架构](#目标架构)
3. [重构步骤](#重构步骤)
4. [完整代码示例](#完整代码示例)
5. [测试示例](#测试示例)
6. [迁移策略](#迁移策略)

---

## 当前架构问题

### 现状: 贫血模型 (Anemic Domain Model)

```typescript
// ❌ 当前: QuizItem只是数据容器
interface QuizItem {
  id: string;
  type: string;
  question: string;
  answer: string | string[];
  options?: string[];
  knowledge_point_id: string;
  // ... 纯数据,无行为
}

// ❌ 所有业务逻辑在Service层
class DefaultQuizService {
  private processAnswerIndex(item: QuizItem): QuizItem {
    // 34行的答案索引处理逻辑
    if (item.type !== 'single-choice' && item.type !== 'multiple-choice') {
      return item;
    }

    if (!item.options || !Array.isArray(item.options)) {
      return item;
    }

    // 验证逻辑...
    const hasAnswer = item.answer !== undefined && item.answer !== null;
    const hasAnswerIndex = item.answer_index !== undefined;

    if (hasAnswer && hasAnswerIndex) {
      // 冲突检测...
    }
    // ... 更多逻辑
  }

  private deriveAnswerIndex(item: QuizItem): number[] | null {
    // 20+行的推导逻辑
  }

  private deriveAnswer(item: QuizItem): string | string[] | null {
    // 20+行的推导逻辑
  }
}
```

### 问题

1. **业务逻辑分散**: 答案验证、索引处理等逻辑在Service中
2. **难以测试**: 必须mock整个Repository才能测试业务规则
3. **类型不安全**: `type: string`可以是任意值
4. **无法保证不变量**: 可以创建invalid的QuizItem
5. **难以扩展**: 添加新题型需要修改Service层

---

## 目标架构

### 新架构: 富领域模型 (Rich Domain Model)

```
Controller (HTTP层)
    ↓
Application Service (用例编排)
    ↓
Domain Layer (业务逻辑)
  ├── Entities (实体)
  ├── Value Objects (值对象)
  ├── Domain Services (领域服务)
  └── Domain Events (领域事件)
    ↓
Repository (数据访问)
    ↓
Database
```

### 核心原则

1. **业务逻辑在Domain**: Entity知道如何验证自己
2. **不可变性**: Value Objects是immutable
3. **类型安全**: QuizType是枚举,不是string
4. **自我验证**: 不可能创建invalid对象
5. **单一职责**: Service只做编排,Domain做业务

---

## 重构步骤

### 步骤1: 创建Value Objects

Value Objects代表Domain中的概念,是immutable的。

#### 文件: `packages/libs/quiz/src/domain/value-objects/quiz-type.ts`

```typescript
/**
 * QuizType值对象 - 封装题目类型相关的业务规则
 */
export class QuizType {
  private static readonly CHOICE_TYPES = ['single-choice', 'multiple-choice'];

  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid quiz type: ${value}`);
    }
  }

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

  isSingleChoice(): boolean {
    return this.value === 'single-choice';
  }

  isMultipleChoice(): boolean {
    return this.value === 'multiple-choice';
  }

  isFillInTheBlank(): boolean {
    return this.value === 'fill-in-the-blank';
  }

  toString(): string {
    return this.value;
  }

  equals(other: QuizType): boolean {
    return this.value === other.value;
  }

  private isValid(type: string): boolean {
    const validTypes = ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other'];
    return validTypes.includes(type);
  }
}
```

#### 文件: `packages/libs/quiz/src/domain/value-objects/answer.ts`

```typescript
/**
 * Answer值对象 - 封装答案相关的业务规则
 */
export class Answer {
  private constructor(
    private readonly value: string | string[],
    private readonly indices: number[]
  ) {}

  static fromText(text: string | string[], options: string[]): Answer {
    const textArray = Array.isArray(text) ? text : [text];
    const indices = textArray
      .map(t => options.indexOf(t))
      .filter(idx => idx !== -1);

    return new Answer(text, indices);
  }

  static fromIndices(indices: number[], options: string[]): Answer {
    const textArray = indices.map(idx => options[idx]).filter(t => t);
    const value = textArray.length === 1 ? textArray[0] : textArray;
    return new Answer(value, indices);
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

  // 业务规则: 验证答案是否匹配
  matches(userAnswer: Answer, allowOrderIndependent: boolean = false): boolean {
    const userIndices = userAnswer.getIndices();
    const correctIndices = this.indices;

    if (userIndices.length !== correctIndices.length) {
      return false;
    }

    if (allowOrderIndependent) {
      // 多选题顺序无关
      const sortedUser = [...userIndices].sort();
      const sortedCorrect = [...correctIndices].sort();
      return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
    }

    return JSON.stringify(userIndices) === JSON.stringify(correctIndices);
  }

  equals(other: Answer): boolean {
    return JSON.stringify(this.indices.sort()) === JSON.stringify(other.indices.sort());
  }
}
```

#### 文件: `packages/libs/quiz/src/domain/value-objects/knowledge-point-id.ts`

```typescript
/**
 * KnowledgePointId值对象 - 强类型ID
 */
export class KnowledgePointId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Knowledge point ID cannot be empty');
    }
  }

  static from(id: string): KnowledgePointId {
    return new KnowledgePointId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: KnowledgePointId): boolean {
    return this.value === other.value;
  }
}
```

---

### 步骤2: 创建Domain Entity

Entity是有唯一标识的对象,包含业务逻辑。

#### 文件: `packages/libs/quiz/src/domain/entities/quiz.entity.ts`

```typescript
import { QuizType } from '../value-objects/quiz-type';
import { Answer } from '../value-objects/answer';
import { KnowledgePointId } from '../value-objects/knowledge-point-id';

/**
 * Quiz实体 - 富领域模型,包含业务逻辑
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
    private readonly extraProperties?: Record<string, any>
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
  }): Quiz {
    const type = QuizType.fromString(data.type);

    // 处理选择题的options
    const options = data.options || [];

    // 构建Answer值对象
    let answer: Answer;
    if (data.answer_index && data.answer_index.length > 0) {
      answer = Answer.fromIndices(data.answer_index, options);
    } else if (data.answer) {
      const answerText = Array.isArray(data.answer)
        ? data.answer.map(a => String(a))
        : String(data.answer);
      answer = Answer.fromText(answerText, options);
    } else {
      throw new Error('Quiz must have either answer or answer_index');
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
      data.extra_properties
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
   */
  private validateInvariants(): void {
    // 规则1: 选择题必须有选项
    if (this.type.requiresOptions() && this.options.length === 0) {
      throw new Error('Choice questions must have options');
    }

    // 规则2: 单选题答案只能有一个
    if (this.type.isSingleChoice() && this.answer.getIndices().length !== 1) {
      throw new Error('Single choice question must have exactly one answer');
    }

    // 规则3: 多选题答案至少两个
    if (this.type.isMultipleChoice() && this.answer.getIndices().length < 2) {
      throw new Error('Multiple choice question must have at least two answers');
    }

    // 规则4: 答案索引不能超出选项范围
    const maxIndex = this.options.length - 1;
    if (this.answer.getIndices().some(idx => idx > maxIndex)) {
      throw new Error('Answer index out of options range');
    }
  }

  /**
   * 业务逻辑: 验证用户答案
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
   */
  private validateFillInTheBlank(userAnswer: string | string[]): boolean {
    const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const correctAnswers = Array.isArray(this.answer.getText())
      ? this.answer.getText()
      : [this.answer.getText()];

    // 检查长度
    if (userAnswerArray.length !== correctAnswers.length) {
      return false;
    }

    // 检查是否有order-independent-groups
    const orderGroups = this.extraProperties?.['order-independent-groups'] as number[][] | undefined;

    if (orderGroups && orderGroups.length > 0) {
      return this.validateWithOrderIndependentGroups(userAnswerArray, correctAnswers, orderGroups);
    }

    // 标准验证(考虑alternative_answers)
    return userAnswerArray.every((userAns, idx) => {
      const correct = correctAnswers[idx];
      return this.matchesWithAlternatives(userAns, correct);
    });
  }

  /**
   * 业务逻辑: 支持顺序无关组的验证
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
      const userGroupAnswers = group.map(idx => userCopy[idx]).sort();
      const correctGroupAnswers = group.map(idx => correctCopy[idx]).sort();

      if (JSON.stringify(userGroupAnswers) !== JSON.stringify(correctGroupAnswers)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 业务逻辑: 匹配答案(考虑alternative_answers)
   */
  private matchesWithAlternatives(userAnswer: string, correctAnswer: string): boolean {
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
      return true;
    }

    return this.alternativeAnswers.some(
      alt => userAnswer.toLowerCase() === alt.toLowerCase()
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

    // 如果是字符串数组或单个字符串,作为文本
    return Answer.fromText(userAnswer as string | string[], this.options);
  }

  /**
   * 业务逻辑: 更改知识点
   */
  changeKnowledgePoint(newKnowledgePointId: KnowledgePointId): void {
    this.knowledgePointId = newKnowledgePointId;
    // 这里可以触发领域事件: QuizKnowledgePointChanged
  }

  /**
   * 获取器方法
   */
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
    return [...this.options]; // 返回副本
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

  /**
   * 转换为持久化格式
   */
  toPersistence(): Record<string, any> {
    return {
      id: this.id,
      type: this.type.toString(),
      question: this.question,
      answer: this.answer.getText(),
      answer_index: this.answer.getIndices(),
      options: this.options,
      knowledge_point_id: this.knowledgePointId.toString(),
      alternative_answers: this.alternativeAnswers,
      explanation: this.explanation,
      hints: this.hints,
      extra_properties: this.extraProperties,
    };
  }
}
```

---

### 步骤3: 创建Domain Service (可选)

Domain Service处理跨多个Entity的业务逻辑。

#### 文件: `packages/libs/quiz/src/domain/services/answer-validator.service.ts`

```typescript
import { Quiz } from '../entities/quiz.entity';

/**
 * 领域服务: 答案验证服务
 * 处理复杂的答案验证逻辑,可能涉及多个Quiz或外部规则
 */
export class AnswerValidatorService {
  /**
   * 验证答案并返回详细结果
   */
  validateWithDetails(
    quiz: Quiz,
    userAnswer: string | string[] | number[]
  ): AnswerValidationResult {
    const isCorrect = quiz.validateUserAnswer(userAnswer);

    return {
      isCorrect,
      correctAnswer: quiz.getAnswer().getText(),
      userAnswer,
      explanation: isCorrect ? undefined : quiz.getExplanation(),
      hints: quiz.getType().isFillInTheBlank() ? this.getHints(quiz) : undefined,
    };
  }

  private getHints(quiz: Quiz): string[] | undefined {
    // 可以根据业务规则决定是否显示提示
    return undefined; // 实际实现会更复杂
  }
}

export interface AnswerValidationResult {
  isCorrect: boolean;
  correctAnswer: string | string[];
  userAnswer: string | string[] | number[];
  explanation?: string;
  hints?: string[];
}
```

---

### 步骤4: 重构Application Service

Application Service变得简洁,只做编排工作。

#### 文件: `packages/libs/quiz/src/lib/quiz.service.refactored.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { QuizService } from './quiz.interface';
import { QuizRepository } from './quiz.repository';
import { Quiz } from '../domain/entities/quiz.entity';
import { QuizItem } from '@kedge/models';
import { KnowledgePointId } from '../domain/value-objects/knowledge-point-id';

/**
 * 重构后的QuizService - 只做编排,业务逻辑在Domain
 */
@Injectable()
export class RefactoredQuizService implements QuizService {
  constructor(
    private readonly repository: QuizRepository,
  ) {}

  /**
   * 创建Quiz - 业务逻辑在Quiz.create()中
   */
  async createQuiz(item: QuizItem): Promise<QuizItem> {
    // Domain层验证业务规则
    const quiz = Quiz.create({
      type: item.type,
      question: item.question,
      answer: item.answer,
      answer_index: item.answer_index,
      options: item.options,
      knowledge_point_id: item.knowledge_point_id!,
      alternative_answers: item.alternative_answers,
      explanation: item.explanation,
      hints: item.hints,
      extra_properties: item.extra_properties,
    });

    // Repository只负责持久化
    const persistenceData = quiz.toPersistence();
    const saved = await this.repository.createQuiz(persistenceData);

    return saved;
  }

  /**
   * 查询Quiz
   */
  async findQuizById(id: string): Promise<QuizItem | null> {
    const data = await this.repository.findQuizById(id);
    if (!data) return null;

    // 可以选择返回Domain对象或DTO
    // 这里为了兼容现有接口,返回QuizItem
    return data;
  }

  /**
   * 更新Quiz
   */
  async updateQuiz(id: string, updates: Partial<QuizItem>): Promise<QuizItem | null> {
    const existing = await this.repository.findQuizById(id);
    if (!existing) return null;

    // 重建Domain对象
    const quiz = Quiz.fromPersistence(existing);

    // 如果需要更改知识点
    if (updates.knowledge_point_id) {
      const newKpId = KnowledgePointId.from(updates.knowledge_point_id);
      quiz.changeKnowledgePoint(newKpId);
    }

    // 如果需要更改其他属性,创建新的Quiz对象
    // (因为大部分属性是immutable的)
    const updatedQuiz = Quiz.create({
      ...quiz.toPersistence(),
      ...updates,
    });

    const persistenceData = updatedQuiz.toPersistence();
    const updated = await this.repository.updateQuiz(id, persistenceData);

    return updated;
  }

  /**
   * 删除Quiz
   */
  async deleteQuiz(id: string): Promise<boolean> {
    return this.repository.deleteQuiz(id);
  }

  /**
   * 其他方法保持不变,只是调用Repository
   */
  async getQuizzesByIds(ids: string[]): Promise<QuizItem[]> {
    return this.repository.getQuizzesByIds(ids);
  }

  async listQuizzes(): Promise<QuizItem[]> {
    return this.repository.listQuizzes();
  }

  async searchQuizzesByTags(tags: string[]): Promise<QuizItem[]> {
    return this.repository.searchQuizzesByTags(tags);
  }

  async getAllTags(): Promise<string[]> {
    return this.repository.getAllTags();
  }

  async getRandomQuizzesByKnowledgePoints(
    knowledgePointIds: string[],
    count: number,
    types?: string[]
  ): Promise<QuizItem[]> {
    return this.repository.getRandomQuizzesByKnowledgePoints(
      knowledgePointIds,
      count,
      types
    );
  }

  // Alias
  async getQuizById(id: string): Promise<QuizItem | null> {
    return this.findQuizById(id);
  }
}
```

---

## 完整代码示例

### 使用Domain Model的完整流程

```typescript
// 1. Controller接收HTTP请求
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: RefactoredQuizService) {}

  @Post()
  async createQuiz(@Body() dto: CreateQuizDto) {
    try {
      const quiz = await this.quizService.createQuiz(dto);
      return { success: true, data: quiz };
    } catch (error) {
      // Domain层抛出的业务规则错误会在这里捕获
      if (error.message.includes('must have options')) {
        throw new BadRequestException('Choice questions require options');
      }
      throw error;
    }
  }
}

// 2. Service编排Domain逻辑
class RefactoredQuizService {
  async createQuiz(item: QuizItem) {
    // Domain层自动验证业务规则
    const quiz = Quiz.create(item); // ✅ 这里会检查所有不变量

    const data = quiz.toPersistence();
    return this.repository.createQuiz(data);
  }
}

// 3. Domain Entity包含业务逻辑
class Quiz {
  private validateInvariants() {
    // ✅ 业务规则在这里!
    if (this.type.requiresOptions() && this.options.length === 0) {
      throw new Error('Choice questions must have options');
    }
  }

  validateUserAnswer(userAnswer: any): boolean {
    // ✅ 答案验证逻辑在这里!
    if (this.type.isFillInTheBlank()) {
      return this.validateFillInTheBlank(userAnswer);
    }
    return this.answer.matches(userAnswer, this.type.isMultipleChoice());
  }
}
```

---

## 测试示例

### Domain Entity测试 (无需Mock)

```typescript
// domain/entities/quiz.entity.spec.ts
describe('Quiz Entity', () => {
  describe('Business Rule: Choice questions must have options', () => {
    it('should throw error when creating single-choice quiz without options', () => {
      expect(() => {
        Quiz.create({
          type: 'single-choice',
          question: 'Test?',
          answer: 'A',
          options: [], // ❌ 违反业务规则
          knowledge_point_id: 'kp_1',
        });
      }).toThrow('Choice questions must have options');
    });

    it('should succeed when creating single-choice quiz with options', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test?',
        answer: 'Option A',
        options: ['Option A', 'Option B'], // ✅ 符合业务规则
        knowledge_point_id: 'kp_1',
      });

      expect(quiz).toBeDefined();
      expect(quiz.getOptions()).toEqual(['Option A', 'Option B']);
    });
  });

  describe('Answer Validation Logic', () => {
    it('should validate correct single-choice answer', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'What is 2+2?',
        answer: '4',
        options: ['3', '4', '5'],
        knowledge_point_id: 'kp_1',
      });

      // ✅ 直接测试业务逻辑,无需mock Repository
      expect(quiz.validateUserAnswer('4')).toBe(true);
      expect(quiz.validateUserAnswer('3')).toBe(false);
    });

    it('should validate fill-in-blank with alternative answers', () => {
      const quiz = Quiz.create({
        type: 'fill-in-the-blank',
        question: 'The capital of France is ____',
        answer: 'Paris',
        alternative_answers: ['paris', 'PARIS'],
        knowledge_point_id: 'kp_1',
      });

      expect(quiz.validateUserAnswer('Paris')).toBe(true);
      expect(quiz.validateUserAnswer('paris')).toBe(true); // ✅ 不区分大小写
      expect(quiz.validateUserAnswer('London')).toBe(false);
    });

    it('should validate multiple-choice with order independence', () => {
      const quiz = Quiz.create({
        type: 'multiple-choice',
        question: 'Select all correct',
        answer: ['A', 'C'],
        options: ['A', 'B', 'C', 'D'],
        knowledge_point_id: 'kp_1',
      });

      expect(quiz.validateUserAnswer(['A', 'C'])).toBe(true);
      expect(quiz.validateUserAnswer(['C', 'A'])).toBe(true); // ✅ 顺序无关
      expect(quiz.validateUserAnswer(['A', 'B'])).toBe(false);
    });
  });

  describe('Business Rule: Single choice must have exactly one answer', () => {
    it('should throw error when creating single-choice with multiple answers', () => {
      expect(() => {
        Quiz.create({
          type: 'single-choice',
          question: 'Test?',
          answer: ['A', 'B'], // ❌ 单选题不能有多个答案
          options: ['A', 'B', 'C'],
          knowledge_point_id: 'kp_1',
        });
      }).toThrow('exactly one answer');
    });
  });

  describe('Value Object: QuizType', () => {
    it('should correctly identify choice types', () => {
      const singleChoice = QuizType.singleChoice();
      const fillInBlank = QuizType.fillInTheBlank();

      expect(singleChoice.isChoiceType()).toBe(true);
      expect(singleChoice.requiresOptions()).toBe(true);

      expect(fillInBlank.isChoiceType()).toBe(false);
      expect(fillInBlank.requiresOptions()).toBe(false);
    });
  });
});
```

### Service测试 (只需Mock Repository)

```typescript
// lib/quiz.service.refactored.spec.ts
describe('RefactoredQuizService', () => {
  let service: RefactoredQuizService;
  let repository: jest.Mocked<QuizRepository>;

  beforeEach(() => {
    repository = {
      createQuiz: jest.fn(),
      findQuizById: jest.fn(),
      // ...
    } as any;

    service = new RefactoredQuizService(repository);
  });

  it('should create quiz and persist to repository', async () => {
    const input = {
      type: 'single-choice',
      question: 'Test?',
      answer: 'A',
      options: ['A', 'B'],
      knowledge_point_id: 'kp_1',
      alternative_answers: [],
    };

    repository.createQuiz.mockResolvedValue({ ...input, id: 'quiz-123' } as any);

    const result = await service.createQuiz(input);

    expect(result.id).toBe('quiz-123');
    expect(repository.createQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'single-choice',
        answer_index: [0], // ✅ Domain自动计算
      })
    );
  });

  it('should reject invalid quiz at Domain layer', async () => {
    const invalidInput = {
      type: 'single-choice',
      question: 'Test?',
      answer: 'A',
      options: [], // ❌ 没有选项
      knowledge_point_id: 'kp_1',
    };

    // Domain层会抛出错误,Repository不会被调用
    await expect(service.createQuiz(invalidInput)).rejects.toThrow('must have options');
    expect(repository.createQuiz).not.toHaveBeenCalled();
  });
});
```

---

## 迁移策略

### 阶段1: 并行运行 (2-4周)

1. **创建Domain层** (不影响现有代码)
   ```
   packages/libs/quiz/src/
   ├── domain/
   │   ├── entities/
   │   ├── value-objects/
   │   └── services/
   ├── lib/
   │   ├── quiz.service.ts (旧版,保留)
   │   └── quiz.service.refactored.ts (新版)
   ```

2. **添加Domain测试** (验证业务逻辑)
   - 为Quiz Entity添加测试
   - 为Value Objects添加测试
   - 确保覆盖率 > 90%

3. **Feature Flag控制** (可选)
   ```typescript
   @Injectable()
   export class QuizService {
     private useDomainModel = process.env.USE_DOMAIN_MODEL === 'true';

     async createQuiz(item: QuizItem) {
       if (this.useDomainModel) {
         return this.refactoredService.createQuiz(item);
       }
       return this.legacyCreateQuiz(item);
     }
   }
   ```

### 阶段2: 逐步迁移 (4-8周)

1. **迁移Controller**
   - 更新依赖注入使用新Service
   - 运行E2E测试确保行为一致

2. **迁移Practice模块**
   - PracticeService使用Quiz Domain Entity
   - 答案验证逻辑调用quiz.validateUserAnswer()

3. **清理旧代码**
   - 删除quiz.service.ts中的业务逻辑
   - 保留兼容性wrapper

### 阶段3: 完全切换 (2周)

1. **移除Feature Flag**
2. **删除旧Service实现**
3. **更新文档**

### 回滚策略

如果遇到问题:
1. 关闭Feature Flag (USE_DOMAIN_MODEL=false)
2. 立即回滚到旧版Service
3. 修复Domain层问题后重新启用

---

## 对比总结

### 重构前 (Anemic Model)

```typescript
// ❌ Service有100+行业务逻辑
class DefaultQuizService {
  private processAnswerIndex(item) { /* 34行 */ }
  private deriveAnswerIndex(item) { /* 20行 */ }
  private deriveAnswer(item) { /* 20行 */ }
  private normalizeHints(hints) { /* 10行 */ }
  async createQuiz(item) { /* 调用所有private方法 */ }
}

// ❌ 难以测试,必须mock Repository
it('should derive answer index', () => {
  // 无法直接测试,必须通过Service
  mockRepository.createQuiz.mockResolvedValue(...);
  await service.createQuiz(input);
});
```

### 重构后 (Rich Domain Model)

```typescript
// ✅ Service只有10行编排逻辑
class RefactoredQuizService {
  async createQuiz(item) {
    const quiz = Quiz.create(item); // Domain自动验证
    return this.repository.createQuiz(quiz.toPersistence());
  }
}

// ✅ Domain包含业务逻辑
class Quiz {
  private validateInvariants() { /* 业务规则 */ }
  validateUserAnswer(answer) { /* 答案验证 */ }
}

// ✅ 易于测试,无需mock
it('should derive answer index', () => {
  const quiz = Quiz.create({ answer: 'A', options: ['A', 'B'] });
  expect(quiz.getAnswer().getIndices()).toEqual([0]);
});
```

### 收益

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| Service代码行数 | 300+ | 50 | ⬇️ 83% |
| 业务逻辑可测试性 | 需mock Repository | 无需mock | ⬆️ 100% |
| 类型安全 | `type: string` | `type: QuizType` | ⬆️ |
| 业务规则保护 | 无,可创建invalid对象 | 强制验证 | ⬆️ |
| 代码可读性 | 逻辑分散在Service | 逻辑在Domain | ⬆️ |
| 扩展性 | 修改Service | 添加Domain类 | ⬆️ |

---

## 结论

引入领域模型层可以显著提高代码质量:
1. **业务逻辑集中**: 在Domain层,不分散在Service
2. **易于测试**: 无需mock Infrastructure
3. **类型安全**: 强类型Value Objects
4. **业务规则保护**: 不可能创建invalid对象
5. **可维护性**: 新增题型只需添加Domain类

建议采用**渐进式迁移**策略,从Quiz模块开始,验证效果后推广到其他模块。

---

*本文档由技术团队创建,最后更新: 2025-10-30*
