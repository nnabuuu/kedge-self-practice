import { Quiz } from './quiz.entity';
import { QuizType } from '../value-objects/quiz-type';
import { Answer } from '../value-objects/answer';
import { KnowledgePointId } from '../value-objects/knowledge-point-id';

/**
 * Domain Entity测试 - 无需Mock!
 *
 * 优势:
 * 1. 直接测试业务逻辑,无需mock Repository
 * 2. 测试速度快 (纯内存计算)
 * 3. 测试清晰 (输入→业务规则→输出)
 */
describe('Quiz Entity - Business Rules', () => {
  describe('Invariant: Choice questions must have options', () => {
    it('should throw error when creating single-choice quiz without options', () => {
      expect(() => {
        Quiz.create({
          type: 'single-choice',
          question: 'Who is the pioneer?',
          answer: 'Lin Zexu',
          options: [], // ❌ 违反业务规则
          knowledge_point_id: 'kp_1',
        });
      }).toThrow('single-choice questions must have options');
    });

    it('should succeed when creating single-choice quiz with options', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Who is the pioneer?',
        answer: 'Lin Zexu',
        options: ['Lin Zexu', 'Wei Yuan', 'Gong Zizhen'], // ✅ 符合规则
        knowledge_point_id: 'kp_1',
      });

      expect(quiz).toBeDefined();
      expect(quiz.getOptions()).toHaveLength(3);
    });

    it('should allow fill-in-blank quiz without options', () => {
      const quiz = Quiz.create({
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱',
        answer: '林则徐',
        knowledge_point_id: 'kp_1',
      });

      expect(quiz).toBeDefined();
      expect(quiz.getOptions()).toHaveLength(0);
    });
  });

  describe('Invariant: Single choice must have exactly one answer', () => {
    it('should throw error when single-choice has multiple answers', () => {
      expect(() => {
        Quiz.create({
          type: 'single-choice',
          question: 'Who is the pioneer?',
          answer: ['Lin Zexu', 'Wei Yuan'], // ❌ 单选题不能有多个答案
          options: ['Lin Zexu', 'Wei Yuan', 'Gong Zizhen'],
          knowledge_point_id: 'kp_1',
        });
      }).toThrow('exactly one answer');
    });

    it('should succeed when single-choice has one answer', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Who is the pioneer?',
        answer: 'Lin Zexu', // ✅ 单个答案
        options: ['Lin Zexu', 'Wei Yuan', 'Gong Zizhen'],
        knowledge_point_id: 'kp_1',
      });

      expect(quiz.getAnswer().getIndices()).toEqual([0]);
    });
  });

  describe('Invariant: Multiple choice must have at least two answers', () => {
    it('should throw error when multiple-choice has only one answer', () => {
      expect(() => {
        Quiz.create({
          type: 'multiple-choice',
          question: 'Select all reformers',
          answer: ['Kang Youwei'], // ❌ 多选题至少两个答案
          options: ['Kang Youwei', 'Liang Qichao', 'Hong Xiuquan'],
          knowledge_point_id: 'kp_1',
        });
      }).toThrow('at least two answers');
    });

    it('should succeed when multiple-choice has multiple answers', () => {
      const quiz = Quiz.create({
        type: 'multiple-choice',
        question: 'Select all reformers',
        answer: ['Kang Youwei', 'Liang Qichao'], // ✅ 多个答案
        options: ['Kang Youwei', 'Liang Qichao', 'Hong Xiuquan'],
        knowledge_point_id: 'kp_1',
      });

      expect(quiz.getAnswer().getIndices()).toEqual([0, 1]);
    });
  });

  describe('Invariant: Answer index must be within options range', () => {
    it('should throw error when answer_index exceeds options length', () => {
      expect(() => {
        Quiz.create({
          type: 'single-choice',
          question: 'Test',
          answer_index: [5], // ❌ 超出范围 (只有3个选项)
          options: ['A', 'B', 'C'],
          knowledge_point_id: 'kp_1',
        });
      }).toThrow('out of options range');
    });

    it('should succeed when answer_index is valid', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test',
        answer_index: [1], // ✅ 在范围内
        options: ['A', 'B', 'C'],
        knowledge_point_id: 'kp_1',
      });

      expect(quiz.getAnswer().getIndices()).toEqual([1]);
      expect(quiz.getAnswer().getText()).toBe('B');
    });
  });
});

describe('Quiz Entity - Answer Validation', () => {
  describe('Single-choice validation', () => {
    const quiz = Quiz.create({
      type: 'single-choice',
      question: '谁是中国近代禁烟运动的先驱?',
      options: ['林则徐', '魏源', '龚自珍', '洪秀全'],
      answer: '林则徐', // Index 0
      knowledge_point_id: 'kp_1',
    });

    it('should validate correct answer by text', () => {
      expect(quiz.validateUserAnswer('林则徐')).toBe(true);
    });

    it('should validate correct answer by index', () => {
      expect(quiz.validateUserAnswer([0])).toBe(true);
      expect(quiz.validateUserAnswer('0')).toBe(true); // 字符串索引也可以
    });

    it('should reject wrong answer', () => {
      expect(quiz.validateUserAnswer('魏源')).toBe(false);
      expect(quiz.validateUserAnswer([1])).toBe(false);
    });
  });

  describe('Multiple-choice validation with order independence', () => {
    const quiz = Quiz.create({
      type: 'multiple-choice',
      question: '选择中国近代的改革家(多选)',
      options: ['林则徐', '康有为', '梁启超', '洪秀全'],
      answer: ['康有为', '梁启超'], // Indices 1, 2
      knowledge_point_id: 'kp_1',
    });

    it('should validate correct answers in order', () => {
      expect(quiz.validateUserAnswer(['康有为', '梁启超'])).toBe(true);
      expect(quiz.validateUserAnswer([1, 2])).toBe(true);
    });

    it('should validate correct answers out of order', () => {
      // ✅ 多选题顺序无关
      expect(quiz.validateUserAnswer(['梁启超', '康有为'])).toBe(true);
      expect(quiz.validateUserAnswer([2, 1])).toBe(true);
    });

    it('should reject incomplete answers', () => {
      expect(quiz.validateUserAnswer(['康有为'])).toBe(false); // 只选了一个
      expect(quiz.validateUserAnswer([1])).toBe(false);
    });

    it('should reject wrong answers', () => {
      expect(quiz.validateUserAnswer(['林则徐', '康有为'])).toBe(false);
      expect(quiz.validateUserAnswer([0, 1])).toBe(false);
    });
  });

  describe('Fill-in-blank validation with alternative answers', () => {
    const quiz = Quiz.create({
      type: 'fill-in-the-blank',
      question: 'The capital of France is ____',
      answer: 'Paris',
      alternative_answers: ['paris', 'PARIS', 'Paree'], // 不区分大小写
      knowledge_point_id: 'kp_1',
    });

    it('should validate exact answer', () => {
      expect(quiz.validateUserAnswer('Paris')).toBe(true);
    });

    it('should validate alternative answers (case insensitive)', () => {
      expect(quiz.validateUserAnswer('paris')).toBe(true);
      expect(quiz.validateUserAnswer('PARIS')).toBe(true);
      expect(quiz.validateUserAnswer('Paree')).toBe(true);
    });

    it('should reject wrong answer', () => {
      expect(quiz.validateUserAnswer('London')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(quiz.validateUserAnswer(' Paris ')).toBe(true);
    });
  });

  describe('Fill-in-blank with multiple blanks', () => {
    const quiz = Quiz.create({
      type: 'fill-in-the-blank',
      question: '____和____是中国近代的改革家',
      answer: ['康有为', '梁启超'],
      knowledge_point_id: 'kp_1',
    });

    it('should validate correct answers', () => {
      expect(quiz.validateUserAnswer(['康有为', '梁启超'])).toBe(true);
    });

    it('should reject wrong order (without order-independent-groups)', () => {
      // ❌ 默认情况下顺序相关
      expect(quiz.validateUserAnswer(['梁启超', '康有为'])).toBe(false);
    });

    it('should reject incomplete answers', () => {
      expect(quiz.validateUserAnswer(['康有为'])).toBe(false);
      expect(quiz.validateUserAnswer(['康有为', ''])).toBe(false);
    });
  });

  describe('Fill-in-blank with order-independent-groups', () => {
    const quiz = Quiz.create({
      type: 'fill-in-the-blank',
      question: '____和____都是改革家',
      answer: ['康有为', '梁启超'],
      extra_properties: {
        'order-independent-groups': [[0, 1]], // 两个空格可以互换
      },
      knowledge_point_id: 'kp_1',
    });

    it('should validate correct answers in order', () => {
      expect(quiz.validateUserAnswer(['康有为', '梁启超'])).toBe(true);
    });

    it('should validate correct answers out of order', () => {
      // ✅ 顺序无关
      expect(quiz.validateUserAnswer(['梁启超', '康有为'])).toBe(true);
    });

    it('should reject wrong answers', () => {
      expect(quiz.validateUserAnswer(['林则徐', '梁启超'])).toBe(false);
    });
  });
});

describe('Quiz Entity - Factory Methods', () => {
  describe('create() with answer text', () => {
    it('should auto-derive answer_index from answer text', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test',
        answer: 'B', // 会自动推导为索引1
        options: ['A', 'B', 'C'],
        knowledge_point_id: 'kp_1',
      });

      const persistenceData = quiz.toPersistence();
      expect(persistenceData['answer_index']).toEqual([1]);
    });

    it('should handle multiple-choice with text array', () => {
      const quiz = Quiz.create({
        type: 'multiple-choice',
        question: 'Test',
        answer: ['B', 'C'], // 会自动推导为索引[1, 2]
        options: ['A', 'B', 'C', 'D'],
        knowledge_point_id: 'kp_1',
      });

      const persistenceData = quiz.toPersistence();
      expect(persistenceData['answer_index']).toEqual([1, 2]);
    });
  });

  describe('create() with answer_index', () => {
    it('should auto-derive answer text from answer_index', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test',
        answer_index: [1], // 会自动推导为文本'B'
        options: ['A', 'B', 'C'],
        knowledge_point_id: 'kp_1',
      });

      const persistenceData = quiz.toPersistence();
      expect(persistenceData['answer']).toBe('B');
    });
  });

  describe('fromPersistence()', () => {
    it('should reconstruct Quiz from database data', () => {
      const dbData = {
        id: 'quiz-123',
        type: 'single-choice',
        question: 'Test',
        answer: 'B',
        answer_index: [1],
        options: ['A', 'B', 'C'],
        knowledge_point_id: 'kp_1',
        alternative_answers: [],
      };

      const quiz = Quiz.fromPersistence(dbData);

      expect(quiz.getId()).toBe('quiz-123');
      expect(quiz.getQuestion()).toBe('Test');
      expect(quiz.validateUserAnswer('B')).toBe(true);
    });
  });
});

describe('Quiz Entity - Business Methods', () => {
  describe('changeKnowledgePoint()', () => {
    it('should change knowledge point', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test',
        answer: 'A',
        options: ['A', 'B'],
        knowledge_point_id: 'kp_1',
      });

      const newKpId = KnowledgePointId.from('kp_2');
      quiz.changeKnowledgePoint(newKpId);

      expect(quiz.getKnowledgePointId().toString()).toBe('kp_2');
    });

    it('should not change if same knowledge point', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test',
        answer: 'A',
        options: ['A', 'B'],
        knowledge_point_id: 'kp_1',
      });

      const sameKpId = KnowledgePointId.from('kp_1');
      quiz.changeKnowledgePoint(sameKpId); // 无变化

      expect(quiz.getKnowledgePointId().toString()).toBe('kp_1');
    });
  });

  describe('needsImprovement()', () => {
    const quiz = Quiz.create({
      type: 'single-choice',
      question: 'Test',
      answer: 'A',
      options: ['A', 'B'],
      knowledge_point_id: 'kp_1',
    });

    it('should return true when error rate > 50%', () => {
      expect(quiz.needsImprovement(0.6)).toBe(true);
    });

    it('should return false when error rate <= 50%', () => {
      expect(quiz.needsImprovement(0.4)).toBe(false);
    });
  });

  describe('toPersistence()', () => {
    it('should convert to database format', () => {
      const quiz = Quiz.create({
        type: 'single-choice',
        question: 'Test Question',
        answer: 'Option B',
        options: ['Option A', 'Option B', 'Option C'],
        knowledge_point_id: 'kp_1',
        alternative_answers: [],
        explanation: 'This is because...',
        images: ['{{img:1}}'],
        tags: ['history', 'modern'],
      });

      const data = quiz.toPersistence();

      expect(data).toEqual({
        id: undefined, // 新创建的没有ID
        type: 'single-choice',
        question: 'Test Question',
        answer: 'Option B',
        answer_index: [1],
        options: ['Option A', 'Option B', 'Option C'],
        knowledge_point_id: 'kp_1',
        alternative_answers: [],
        explanation: 'This is because...',
        hints: undefined,
        extra_properties: undefined,
        images: ['{{img:1}}'],
        tags: ['history', 'modern'],
      });
    });
  });

  describe('toApiResponse()', () => {
    const quiz = Quiz.create({
      type: 'single-choice',
      question: 'Test',
      answer: 'A',
      options: ['A', 'B'],
      knowledge_point_id: 'kp_1',
      explanation: 'Secret explanation',
    });

    it('should include answer when includeAnswer=true', () => {
      const response = quiz.toApiResponse(true);

      expect(response['answer']).toBe('A');
      expect(response['explanation']).toBe('Secret explanation');
    });

    it('should hide answer when includeAnswer=false', () => {
      const response = quiz.toApiResponse(false);

      expect(response['answer']).toBeUndefined();
      expect(response['explanation']).toBeUndefined();
      expect(response['question']).toBe('Test'); // 题目仍然可见
    });
  });
});

describe('Value Objects', () => {
  describe('QuizType', () => {
    it('should correctly identify choice types', () => {
      const singleChoice = QuizType.singleChoice();
      const multipleChoice = QuizType.multipleChoice();
      const fillInBlank = QuizType.fillInTheBlank();

      expect(singleChoice.isChoiceType()).toBe(true);
      expect(singleChoice.requiresOptions()).toBe(true);
      expect(singleChoice.supportsMultipleAnswers()).toBe(false);

      expect(multipleChoice.isChoiceType()).toBe(true);
      expect(multipleChoice.supportsMultipleAnswers()).toBe(true);

      expect(fillInBlank.isChoiceType()).toBe(false);
      expect(fillInBlank.requiresOptions()).toBe(false);
    });

    it('should throw error for invalid type', () => {
      expect(() => {
        QuizType.fromString('invalid-type');
      }).toThrow('Invalid quiz type');
    });
  });

  describe('Answer', () => {
    it('should create from text', () => {
      const answer = Answer.fromText('B', ['A', 'B', 'C']);

      expect(answer.getText()).toBe('B');
      expect(answer.getIndices()).toEqual([1]);
    });

    it('should create from indices', () => {
      const answer = Answer.fromIndices([1, 2], ['A', 'B', 'C', 'D']);

      expect(answer.getText()).toEqual(['B', 'C']);
      expect(answer.getIndices()).toEqual([1, 2]);
    });

    it('should validate equality', () => {
      const answer1 = Answer.fromIndices([1, 2], ['A', 'B', 'C', 'D']);
      const answer2 = Answer.fromIndices([2, 1], ['A', 'B', 'C', 'D']); // 顺序不同

      expect(answer1.equals(answer2)).toBe(true); // 但值相等
    });
  });

  describe('KnowledgePointId', () => {
    it('should create valid ID', () => {
      const kpId = KnowledgePointId.from('kp_123');

      expect(kpId.toString()).toBe('kp_123');
    });

    it('should throw error for empty ID', () => {
      expect(() => {
        KnowledgePointId.from('');
      }).toThrow('cannot be empty');
    });

    it('should validate equality', () => {
      const kpId1 = KnowledgePointId.from('kp_1');
      const kpId2 = KnowledgePointId.from('kp_1');
      const kpId3 = KnowledgePointId.from('kp_2');

      expect(kpId1.equals(kpId2)).toBe(true);
      expect(kpId1.equals(kpId3)).toBe(false);
    });
  });
});
