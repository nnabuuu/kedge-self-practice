import { Test, TestingModule } from '@nestjs/testing';
import { PracticeService } from './practice.service';
import { PracticeRepository } from './practice.repository';
import { QuizService } from '@kedge/quiz';
import { QuizRepository } from '@kedge/quiz';
import { PersistentService } from '@kedge/persistent';
import { GptService } from '@kedge/quiz-parser';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock ali-oss to prevent ESM import errors in tests
jest.mock('ali-oss', () => {
  return jest.fn().mockImplementation(() => ({
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }));
});

describe('PracticeService - Answer Submission', () => {
  let service: PracticeService;
  let practiceRepository: jest.Mocked<PracticeRepository>;
  let quizService: jest.Mocked<QuizService>;

  const mockPracticeRepository = {
    getSession: jest.fn(),
    submitAnswer: jest.fn(),
  };

  const mockQuizService = {
    getQuizById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PracticeRepository,
          useValue: mockPracticeRepository,
        },
        {
          provide: QuizService,
          useValue: mockQuizService,
        },
        {
          provide: QuizRepository,
          useValue: {},
        },
        {
          provide: PersistentService,
          useValue: {},
        },
        {
          provide: GptService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
    practiceRepository = module.get(PracticeRepository) as jest.Mocked<PracticeRepository>;
    quizService = module.get(QuizService) as jest.Mocked<QuizService>;

    jest.clearAllMocks();
  });

  describe('submitAnswer - Fill-in-blank with string array', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const questionId = '123e4567-e89b-12d3-a456-426614174001';
    const userId = '123e4567-e89b-12d3-a456-426614174002';

    beforeEach(() => {
      practiceRepository.getSession.mockResolvedValue({
        id: sessionId,
        user_id: userId,
        status: 'in_progress',
        answered_questions: 0,
        total_questions: 5,
      } as any);

      practiceRepository.submitAnswer.mockResolvedValue({
        session_id: sessionId,
        quiz_id: questionId,
        user_answer: 'test',
        is_correct: true,
      } as any);
    });

    it('should accept string array for fill-in-blank answers', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱',
        answer: ['林则徐'],
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['林则徐'], // Array format
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
      expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
        sessionId,
        questionId,
        '林则徐', // Should be converted to string
        true,
        30
      );
    });

    it('should accept string with delimiter for fill-in-blank answers (backward compatibility)', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱',
        answer: ['林则徐'],
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: '林则徐', // String format (old way)
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
      expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
        sessionId,
        questionId,
        '林则徐',
        true,
        30
      );
    });

    it('should handle multiple blanks with array format', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____是中国近代的改革家',
        answer: ['康有为', '梁启超'],
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['康有为', '梁启超'], // Array with multiple elements
          time_spent_seconds: 45,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
      expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
        sessionId,
        questionId,
        '康有为|||梁启超', // Should be joined with |||
        true,
        45
      );
    });

    it('should handle multiple blanks with delimiter string format (backward compatibility)', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____是中国近代的改革家',
        answer: ['康有为', '梁启超'],
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: '康有为|||梁启超', // String with delimiter (old way)
          time_spent_seconds: 45,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
      expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
        sessionId,
        questionId,
        '康有为|||梁启超',
        true,
        45
      );
    });

    it('should correctly validate wrong answers with array format', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱',
        answer: ['林则徐'],
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['错误答案'], // Wrong answer as array
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(false);
      expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
        sessionId,
        questionId,
        '错误答案',
        false,
        30
      );
    });

    it('should handle empty array elements correctly', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____是中国近代的改革家',
        answer: ['康有为', '梁启超'],
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['康有为', ''], // Second blank is empty
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(false);
      expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
        sessionId,
        questionId,
        '康有为|||', // Empty element preserved
        false,
        30
      );
    });

    it('should work with order-independent-groups and array format', async () => {
      const fillInBlankQuiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____都是改革家',
        answer: ['康有为', '梁启超'],
        extra_properties: {
          'order-independent-groups': [[0, 1]], // Both positions can be swapped
        },
      };

      quizService.getQuizById.mockResolvedValue(fillInBlankQuiz as any);

      // Submit in reverse order
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['梁启超', '康有为'], // Swapped order
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('submitAnswer - Other question types', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const questionId = '123e4567-e89b-12d3-a456-426614174001';
    const userId = '123e4567-e89b-12d3-a456-426614174002';

    beforeEach(() => {
      practiceRepository.getSession.mockResolvedValue({
        id: sessionId,
        user_id: userId,
        status: 'in_progress',
        answered_questions: 0,
        total_questions: 5,
      } as any);

      practiceRepository.submitAnswer.mockResolvedValue({
        session_id: sessionId,
        quiz_id: questionId,
        user_answer: 'test',
        is_correct: true,
      } as any);
    });

    it('should handle single-choice with string answer', async () => {
      const singleChoiceQuiz = {
        id: questionId,
        type: 'single-choice',
        question: '谁是禁烟先驱？',
        answer: '0',
        options: ['林则徐', '魏源', '龚自珍'],
      };

      quizService.getQuizById.mockResolvedValue(singleChoiceQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: '0', // String format (index)
          time_spent_seconds: 15,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should handle multiple-choice with comma-separated string', async () => {
      const multipleChoiceQuiz = {
        id: questionId,
        type: 'multiple-choice',
        question: '选择改革家',
        answer: [0, 1],
      };

      quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: '0,1', // String format
          time_spent_seconds: 20,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('submitAnswer - Answer Format Normalization', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const questionId = '123e4567-e89b-12d3-a456-426614174001';
    const userId = '123e4567-e89b-12d3-a456-426614174002';

    beforeEach(() => {
      practiceRepository.getSession.mockResolvedValue({
        id: sessionId,
        user_id: userId,
        status: 'in_progress',
        answered_questions: 0,
        total_questions: 5,
      } as any);

      practiceRepository.submitAnswer.mockResolvedValue({
        session_id: sessionId,
        quiz_id: questionId,
        user_answer: 'test',
        is_correct: true,
      } as any);
    });

    describe('Single-choice normalization', () => {
      const singleChoiceQuiz = {
        id: questionId,
        type: 'single-choice',
        question: '谁是中国近代禁烟运动的先驱？',
        options: ['林则徐', '魏源', '龚自珍', '洪秀全'],
        answer: '林则徐', // Stored as text, should match index 0
      };

      it('should normalize letter "A" to index "0"', async () => {
        quizService.getQuizById.mockResolvedValue(singleChoiceQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: 'A', // Letter format from frontend
            time_spent_seconds: 10,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        // Verify it was normalized to "0" before storage
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '0', // Should be normalized to index
          true,
          10
        );
      });

      it('should normalize letter "B" to index "1"', async () => {
        const quizWithAnswerB = {
          ...singleChoiceQuiz,
          answer: '魏源', // Second option
        };
        quizService.getQuizById.mockResolvedValue(quizWithAnswerB as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: 'B',
            time_spent_seconds: 10,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '1',
          true,
          10
        );
      });

      it('should normalize lowercase letter "c" to index "2"', async () => {
        const quizWithAnswerC = {
          ...singleChoiceQuiz,
          answer: '龚自珍', // Third option
        };
        quizService.getQuizById.mockResolvedValue(quizWithAnswerC as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: 'c', // Lowercase
            time_spent_seconds: 10,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '2',
          true,
          10
        );
      });

      it('should accept numeric string "0" as-is', async () => {
        quizService.getQuizById.mockResolvedValue(singleChoiceQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: '0', // Already in index format
            time_spent_seconds: 10,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '0',
          true,
          10
        );
      });

      it('should accept number 0 and convert to string "0"', async () => {
        quizService.getQuizById.mockResolvedValue(singleChoiceQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: 0 as any, // Number format
            time_spent_seconds: 10,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '0',
          true,
          10
        );
      });
    });

    describe('Multiple-choice normalization', () => {
      const multipleChoiceQuiz = {
        id: questionId,
        type: 'multiple-choice',
        question: '选择中国近代的改革家（多选）',
        options: ['林则徐', '康有为', '梁启超', '洪秀全'],
        answer: [1, 2], // Indices 1 and 2
      };

      it('should normalize letter array ["A", "C"] to ["0", "2"]', async () => {
        const quizWithAnswerAC = {
          ...multipleChoiceQuiz,
          answer: [0, 2],
        };
        quizService.getQuizById.mockResolvedValue(quizWithAnswerAC as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: ['A', 'C'], // Letter format from frontend
            time_spent_seconds: 15,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        // Should be normalized to indices and joined with comma
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '0,2', // Normalized and joined with comma
          true,
          15
        );
      });

      it('should normalize mixed case letters ["b", "C"] to ["1", "2"]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: ['b', 'C'], // Mixed case
            time_spent_seconds: 15,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '1,2',
          true,
          15
        );
      });

      it('should accept numeric string array ["1", "2"] as-is', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: ['1', '2'], // Already in index format
            time_spent_seconds: 15,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          '1,2',
          true,
          15
        );
      });
    });

    describe('Fill-in-blank should NOT be normalized', () => {
      it('should preserve single letter "H" as chemistry answer', async () => {
        const chemistryQuiz = {
          id: questionId,
          type: 'fill-in-the-blank',
          question: '水的化学式是H2____',
          answer: ['O'], // The letter "O" for oxygen
        };
        quizService.getQuizById.mockResolvedValue(chemistryQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: ['O'], // Should NOT be normalized to "14"
            time_spent_seconds: 20,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          'O', // Should remain as "O", not normalized
          true,
          20
        );
      });

      it('should preserve letter "A" as grade answer', async () => {
        const gradeQuiz = {
          id: questionId,
          type: 'fill-in-the-blank',
          question: '你的成绩是____等',
          answer: ['A'],
        };
        quizService.getQuizById.mockResolvedValue(gradeQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: ['A'], // Should NOT be normalized to "0"
            time_spent_seconds: 10,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          'A', // Should remain as "A"
          true,
          10
        );
      });

      it('should preserve multiple letter answers ["H", "O"]', async () => {
        const chemistryQuiz = {
          id: questionId,
          type: 'fill-in-the-blank',
          question: '水是由____和____组成的',
          answer: ['H', 'O'],
        };
        quizService.getQuizById.mockResolvedValue(chemistryQuiz as any);

        const result = await service.submitAnswer(
          {
            session_id: sessionId,
            question_id: questionId,
            answer: ['H', 'O'], // Should NOT be normalized
            time_spent_seconds: 25,
          },
          userId
        );

        expect(result.isCorrect).toBe(true);
        expect(practiceRepository.submitAnswer).toHaveBeenCalledWith(
          sessionId,
          questionId,
          'H|||O', // Should remain as letters, not indices
          true,
          25
        );
      });
    });
  });

  describe('submitAnswer - Flexible Answer Format Validation', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const questionId = '123e4567-e89b-12d3-a456-426614174001';
    const userId = '123e4567-e89b-12d3-a456-426614174002';

    beforeEach(() => {
      practiceRepository.getSession.mockResolvedValue({
        id: sessionId,
        user_id: userId,
        status: 'in_progress',
        answered_questions: 0,
        total_questions: 5,
      } as any);

      practiceRepository.submitAnswer.mockResolvedValue({
        session_id: sessionId,
        quiz_id: questionId,
        user_answer: 'test',
        is_correct: true,
      } as any);
    });

    describe('Single-choice: Backend stored as TEXT, answer_index exists', () => {
      const quizStoredAsText = {
        id: questionId,
        type: 'single-choice',
        question: '原始社会时期,美洲地区居民最早培植出了',
        options: ['大麦、小麦', '芋头', '水稻、粟', '玉米、南瓜'],
        answer: ['玉米、南瓜'], // Stored as text
        answer_index: [3], // Index is also available
      };

      it('should accept index 3 (number)', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 3 as any, time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept index "3" (string)', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: '3', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept letter "D" (uppercase)', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 'D', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept letter "d" (lowercase)', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 'd', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept exact text answer "玉米、南瓜"', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: '玉米、南瓜', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should reject wrong index 0', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 0 as any, time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(false);
      });

      it('should reject wrong letter "A"', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 'A', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(false);
      });

      it('should reject wrong text "大麦、小麦"', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsText as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: '大麦、小麦', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(false);
      });
    });

    describe('Single-choice: Backend stored as INDEX only', () => {
      const quizStoredAsIndex = {
        id: questionId,
        type: 'single-choice',
        question: '谁是禁烟先驱?',
        options: ['林则徐', '魏源', '龚自珍', '洪秀全'],
        answer_index: [0], // Only index stored
      };

      it('should accept index 0 (number)', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsIndex as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 0 as any, time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept index "0" (string)', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsIndex as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: '0', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept letter "A"', async () => {
        quizService.getQuizById.mockResolvedValue(quizStoredAsIndex as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: 'A', time_spent_seconds: 10 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });
    });

    describe('Multiple-choice: Various formats', () => {
      const multipleChoiceQuiz = {
        id: questionId,
        type: 'multiple-choice',
        question: '选择改革家(多选)',
        options: ['林则徐', '康有为', '梁启超', '洪秀全'],
        answer: ['康有为', '梁启超'], // Stored as text
        answer_index: [1, 2], // Indices also available
      };

      it('should accept index array [1, 2]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: [1, 2] as any, time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept string index array ["1", "2"]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: ['1', '2'], time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept letter array ["B", "C"]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: ['B', 'C'], time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept mixed case letters ["b", "c"]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: ['b', 'c'], time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept text array ["康有为", "梁启超"]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: ['康有为', '梁启超'], time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should accept answers in different order [2, 1]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: [2, 1] as any, time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(true);
      });

      it('should reject wrong indices [0, 1]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: [0, 1] as any, time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(false);
      });

      it('should reject wrong letters ["A", "B"]', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: ['A', 'B'], time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(false);
      });

      it('should reject incomplete answer [1] (missing one)', async () => {
        quizService.getQuizById.mockResolvedValue(multipleChoiceQuiz as any);

        const result = await service.submitAnswer(
          { session_id: sessionId, question_id: questionId, answer: [1] as any, time_spent_seconds: 15 },
          userId
        );

        expect(result.isCorrect).toBe(false);
      });
    });
  });

  describe('Session Quiz Data Consistency', () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174000';
    const userId = '123e4567-e89b-12d3-a456-426614174002';
    const quizIds = ['quiz-1', 'quiz-2', 'quiz-3'];

    const mockQuizzes = [
      {
        id: 'quiz-1',
        type: 'single-choice',
        question: 'Question 1',
        options: ['A', 'B', 'C', 'D'],
        answer: '0',
      },
      {
        id: 'quiz-2',
        type: 'fill-in-the-blank',
        question: 'Question 2',
        answer: ['Answer'],
      },
      {
        id: 'quiz-3',
        type: 'multiple-choice',
        question: 'Question 3',
        options: ['A', 'B', 'C', 'D'],
        answer: [0, 1],
      },
    ];

    const mockSession = {
      id: sessionId,
      user_id: userId,
      status: 'in_progress',
      quiz_ids: quizIds,
      answered_questions: 1,
      total_questions: 3,
      last_question_index: 1,
    };

    const mockRepository = {
      getSession: jest.fn(),
      getAnswersBySessionId: jest.fn(),
      updateSessionStatus: jest.fn(),
    };

    const mockQuizServiceImpl = {
      getQuizzesByIds: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return quiz data from quizService.getQuizzesByIds in resumeSession', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PracticeService,
          {
            provide: PracticeRepository,
            useValue: mockRepository,
          },
          {
            provide: QuizService,
            useValue: mockQuizServiceImpl,
          },
          {
            provide: QuizRepository,
            useValue: {},
          },
          {
            provide: PersistentService,
            useValue: {},
          },
          {
            provide: GptService,
            useValue: {},
          },
        ],
      }).compile();

      const service = module.get<PracticeService>(PracticeService);

      mockRepository.getSession.mockResolvedValue(mockSession);
      mockRepository.getAnswersBySessionId.mockResolvedValue([
        { quiz_id: 'quiz-1', user_answer: '0', is_correct: true },
      ]);
      mockQuizServiceImpl.getQuizzesByIds.mockResolvedValue(mockQuizzes);

      const result = await service.resumeSession(sessionId, userId);

      // Verify quizService.getQuizzesByIds was called with correct quiz IDs
      expect(mockQuizServiceImpl.getQuizzesByIds).toHaveBeenCalledWith(quizIds);
      expect(mockQuizServiceImpl.getQuizzesByIds).toHaveBeenCalledTimes(1);

      // Verify the returned data structure matches other session endpoints
      expect(result).toEqual({
        session: mockSession,
        quizzes: mockQuizzes,
        submittedAnswers: expect.any(Array),
        currentQuestionIndex: 1,
      });
    });

    it('should use quizService consistently across createSession, startSession, and resumeSession', async () => {
      // This test documents the consistency requirement:
      // All session endpoints should use quizService.getQuizzesByIds()
      // to ensure quiz data (including options format) is identical

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PracticeService,
          {
            provide: PracticeRepository,
            useValue: {
              ...mockRepository,
              createSession: jest.fn().mockResolvedValue(mockSession),
              updateSessionStatus: jest.fn(),
              getAnswersForSession: jest.fn().mockResolvedValue([]),
            },
          },
          {
            provide: QuizService,
            useValue: {
              ...mockQuizServiceImpl,
              getRandomQuizzesByKnowledgePoints: jest.fn().mockResolvedValue(mockQuizzes),
            },
          },
          {
            provide: QuizRepository,
            useValue: {},
          },
          {
            provide: PersistentService,
            useValue: {},
          },
          {
            provide: GptService,
            useValue: {},
          },
        ],
      }).compile();

      const service = module.get<PracticeService>(PracticeService);
      const quizService = module.get<QuizService>(QuizService);

      // Test startSession - should use quizService
      // Note: startSession requires status 'pending'
      const practiceRepo = module.get(PracticeRepository);
      (practiceRepo as any).getSession.mockResolvedValue({
        ...mockSession,
        status: 'pending',
      });
      (practiceRepo as any).updateSessionStatus.mockResolvedValue({
        ...mockSession,
        status: 'in_progress',
      });
      (practiceRepo as any).getAnswersForSession.mockResolvedValue([]);
      mockQuizServiceImpl.getQuizzesByIds.mockResolvedValue(mockQuizzes);

      const startResult = await service.startSession(sessionId, userId);
      expect(quizService.getQuizzesByIds).toHaveBeenCalled();
      expect(startResult.quizzes).toEqual(mockQuizzes);

      jest.clearAllMocks();

      // Test resumeSession - should also use quizService
      (practiceRepo as any).getSession.mockResolvedValue(mockSession);
      (practiceRepo as any).getAnswersBySessionId.mockResolvedValue([]);
      mockQuizServiceImpl.getQuizzesByIds.mockResolvedValue(mockQuizzes);

      const resumeResult = await service.resumeSession(sessionId, userId);
      expect(quizService.getQuizzesByIds).toHaveBeenCalled();
      expect(resumeResult.quizzes).toEqual(mockQuizzes);

      // Both should return identical quiz data format
      expect(startResult.quizzes).toEqual(resumeResult.quizzes);
    });
  });
});

/**
 * Additional test coverage for frontend compatibility
 */
describe('PracticeService - Position-Specific Alternative Answers', () => {
  let service: PracticeService;
  let practiceRepository: jest.Mocked<PracticeRepository>;
  let quizService: jest.Mocked<QuizService>;

  const sessionId = '123e4567-e89b-12d3-a456-426614174000';
  const questionId = '123e4567-e89b-12d3-a456-426614174001';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const mockPracticeRepository = {
    getSession: jest.fn(),
    submitAnswer: jest.fn(),
  };

  const mockQuizService = {
    getQuizById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PracticeRepository,
          useValue: mockPracticeRepository,
        },
        {
          provide: QuizService,
          useValue: mockQuizService,
        },
        {
          provide: QuizRepository,
          useValue: {},
        },
        {
          provide: PersistentService,
          useValue: {},
        },
        {
          provide: GptService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
    practiceRepository = module.get(PracticeRepository) as jest.Mocked<PracticeRepository>;
    quizService = module.get(QuizService) as jest.Mocked<QuizService>;

    jest.clearAllMocks();

    mockPracticeRepository.getSession.mockResolvedValue({
      id: sessionId,
      user_id: userId,
      status: 'in_progress',
      answered_questions: 0,
      total_questions: 5,
    } as any);

    mockPracticeRepository.submitAnswer.mockResolvedValue({
      session_id: sessionId,
      quiz_id: questionId,
      user_answer: 'test',
      is_correct: true,
    } as any);
  });

  describe('Position-prefixed alternative answers [0], [1] format', () => {
    it('should accept [0] prefixed alternative answer for first blank', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱，主持了____',
        answer: ['林则徐', '虎门销烟'],
        alternative_answers: ['[0]林文忠公', '[1]禁烟运动'],
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // User uses alternative answer for first blank, original for second
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['林文忠公', '虎门销烟'],
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should accept [1] prefixed alternative answer for second blank', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱，主持了____',
        answer: ['林则徐', '虎门销烟'],
        alternative_answers: ['[0]林文忠公', '[1]禁烟运动'],
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // User uses original for first, alternative for second
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['林则徐', '禁烟运动'],
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should accept both alternatives when used at correct positions', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱，主持了____',
        answer: ['林则徐', '虎门销烟'],
        alternative_answers: ['[0]林文忠公', '[1]禁烟运动'],
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // User uses alternatives for both blanks
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['林文忠公', '禁烟运动'],
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should REJECT alternative answer used at wrong position', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱，主持了____',
        answer: ['林则徐', '虎门销烟'],
        alternative_answers: ['[0]林文忠公', '[1]禁烟运动'],
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // User uses [0] alternative at position 1 - should fail
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['林则徐', '林文忠公'], // 林文忠公 is [0] alternative, not valid for position 1
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(false);
    });

    it('should REJECT swapped alternatives at wrong positions', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱，主持了____',
        answer: ['林则徐', '虎门销烟'],
        alternative_answers: ['[0]林文忠公', '[1]禁烟运动'],
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // User swaps alternatives - should fail
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['禁烟运动', '林文忠公'], // Both at wrong positions
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(false);
    });

    it('should handle non-prefixed alternatives for backward compatibility', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是中国近代禁烟运动的先驱',
        answer: ['林则徐'],
        alternative_answers: ['林文忠公'], // No position prefix - applies to any position
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['林文忠公'],
          time_spent_seconds: 30,
        },
        userId
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should handle multiple alternatives for same position', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____发现了青霉素',
        answer: ['弗莱明'],
        alternative_answers: ['[0]亚历山大·弗莱明', '[0]Fleming', '[0]Alexander Fleming'],
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Test first alternative
      let result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['亚历山大·弗莱明'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);

      // Test second alternative
      result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['Fleming'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);

      // Test third alternative
      result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['Alexander Fleming'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);
    });
  });
});

/**
 * Tests for shuffle_questions feature
 *
 * NOTE: shuffle_options is defined in the schema but NOT IMPLEMENTED!
 * The schema has: shuffle_options: z.boolean().default(true)
 * But practice.service.ts only implements shuffle_questions (quiz order),
 * NOT shuffle_options (option order within each quiz).
 *
 * This means options A, B, C, D are always in the same order,
 * which could allow students to memorize positions.
 *
 * TODO: Implement shuffle_options if this feature is required.
 */
describe('PracticeService - Shuffle Questions Feature', () => {
  let service: PracticeService;
  let practiceRepository: jest.Mocked<PracticeRepository>;
  let quizService: jest.Mocked<QuizService>;
  let quizRepository: jest.Mocked<QuizRepository>;

  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const mockQuizzes = [
    { id: 'quiz-1', question: 'Question 1', type: 'single-choice', options: ['A', 'B', 'C', 'D'] },
    { id: 'quiz-2', question: 'Question 2', type: 'single-choice', options: ['A', 'B', 'C', 'D'] },
    { id: 'quiz-3', question: 'Question 3', type: 'single-choice', options: ['A', 'B', 'C', 'D'] },
    { id: 'quiz-4', question: 'Question 4', type: 'single-choice', options: ['A', 'B', 'C', 'D'] },
    { id: 'quiz-5', question: 'Question 5', type: 'single-choice', options: ['A', 'B', 'C', 'D'] },
  ];

  const mockPracticeRepository = {
    createSession: jest.fn(),
    updateSessionStatus: jest.fn(),
    getSession: jest.fn(),
  };

  const mockQuizServiceImpl = {
    getRandomQuizzesByKnowledgePoints: jest.fn(),
    getQuizzesByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PracticeRepository,
          useValue: mockPracticeRepository,
        },
        {
          provide: QuizService,
          useValue: mockQuizServiceImpl,
        },
        {
          provide: QuizRepository,
          useValue: {},
        },
        {
          provide: PersistentService,
          useValue: {},
        },
        {
          provide: GptService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
    practiceRepository = module.get(PracticeRepository) as jest.Mocked<PracticeRepository>;
    quizService = module.get(QuizService) as jest.Mocked<QuizService>;

    jest.clearAllMocks();
  });

  describe('shuffle_questions behavior', () => {
    beforeEach(() => {
      mockQuizServiceImpl.getRandomQuizzesByKnowledgePoints.mockResolvedValue([...mockQuizzes]);
      mockPracticeRepository.createSession.mockResolvedValue({
        id: 'session-1',
        user_id: userId,
        status: 'pending',
        quiz_ids: mockQuizzes.map(q => q.id),
      } as any);
      mockPracticeRepository.updateSessionStatus.mockResolvedValue({
        id: 'session-1',
        user_id: userId,
        status: 'in_progress',
        quiz_ids: mockQuizzes.map(q => q.id),
      } as any);
    });

    it('should shuffle quiz order when shuffle_questions is true', async () => {
      // Call createSession multiple times with shuffle_questions: true
      // At least one should have different order due to random shuffle
      const orders: string[][] = [];

      for (let i = 0; i < 10; i++) {
        // Reset mock to return fresh copy
        mockQuizServiceImpl.getRandomQuizzesByKnowledgePoints.mockResolvedValue(
          mockQuizzes.map(q => ({ ...q }))
        );

        const result = await service.createSession(
          userId,
          {
            knowledge_point_ids: ['kp-1'],
            shuffle_questions: true,
          } as any // Zod schema will apply defaults for other fields at runtime
        );

        orders.push(result.quizzes.map(q => q.id));
      }

      // Check that not all orders are identical (shuffle should produce variation)
      const firstOrder = JSON.stringify(orders[0]);
      const hasVariation = orders.some(order => JSON.stringify(order) !== firstOrder);

      // With 10 attempts, it's extremely unlikely all would be identical if shuffling works
      expect(hasVariation).toBe(true);
    });

    it('should preserve original order when shuffle_questions is false', async () => {
      const result = await service.createSession(
        userId,
        {
          knowledge_point_ids: ['kp-1'],
          shuffle_questions: false,
        } as any
      );

      // Order should match original
      const originalOrder = mockQuizzes.map(q => q.id);
      const returnedOrder = result.quizzes.map(q => q.id);

      expect(returnedOrder).toEqual(originalOrder);
    });

    it('should not shuffle when shuffle_questions is falsy (undefined)', async () => {
      // When shuffle_questions is not specified/undefined, the ternary check
      // data.shuffle_questions ? shuffle : preserve will preserve order
      const result = await service.createSession(
        userId,
        {
          knowledge_point_ids: ['kp-1'],
          shuffle_questions: undefined, // Explicitly undefined
        } as any
      );

      // When falsy (undefined), should preserve original order
      const originalOrder = mockQuizzes.map(q => q.id);
      const returnedOrder = result.quizzes.map(q => q.id);

      expect(returnedOrder).toEqual(originalOrder);
    });
  });

  describe('shuffle_options behavior (CURRENTLY NOT IMPLEMENTED)', () => {
    /**
     * IMPORTANT: These tests document the EXPECTED behavior for shuffle_options,
     * but the feature is NOT YET IMPLEMENTED in practice.service.ts.
     *
     * Currently, options are NEVER shuffled regardless of shuffle_options value.
     * These tests should FAIL until the feature is implemented.
     *
     * Uncomment and fix implementation when shuffle_options is needed.
     */

    it.skip('should shuffle options when shuffle_options is true (NOT IMPLEMENTED)', async () => {
      // TODO: Implement shuffle_options feature
      // When implemented, this test should verify that:
      // 1. Options within each quiz are shuffled
      // 2. answer_index is updated to match new positions
      // 3. Original answer text still works for validation
    });

    it.skip('should preserve option order when shuffle_options is false (NOT IMPLEMENTED)', async () => {
      // TODO: Implement shuffle_options feature
      // When implemented, this test should verify that:
      // Options remain in original A, B, C, D order
    });

    it('should currently NOT shuffle options (documenting current behavior)', async () => {
      mockQuizServiceImpl.getRandomQuizzesByKnowledgePoints.mockResolvedValue([
        {
          id: 'quiz-1',
          question: 'Test question',
          type: 'single-choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          answer_index: [0],
        },
      ]);
      mockPracticeRepository.createSession.mockResolvedValue({
        id: 'session-1',
        user_id: userId,
        status: 'pending',
        quiz_ids: ['quiz-1'],
      } as any);
      mockPracticeRepository.updateSessionStatus.mockResolvedValue({
        id: 'session-1',
        user_id: userId,
        status: 'in_progress',
        quiz_ids: ['quiz-1'],
      } as any);

      const result = await service.createSession(
        userId,
        {
          knowledge_point_ids: ['kp-1'],
          shuffle_questions: false,
          // shuffle_options: true, // Even if set, options won't be shuffled
        } as any
      );

      // Options should be in original order (NOT shuffled - current behavior)
      expect(result.quizzes[0].options).toEqual(['Option A', 'Option B', 'Option C', 'Option D']);
    });
  });
});

/**
 * Frontend Response Format Tests
 *
 * These tests verify that the practice service returns data in the exact format
 * expected by the frontend application, ensuring API contract compliance.
 */
describe('PracticeService - Frontend Response Format', () => {
  let service: PracticeService;

  const userId = '123e4567-e89b-12d3-a456-426614174002';
  const sessionId = '123e4567-e89b-12d3-a456-426614174000';

  const mockSingleChoiceQuiz = {
    id: 'quiz-1',
    type: 'single-choice',
    question: '中国第一个不平等条约是什么？',
    options: ['《南京条约》', '《北京条约》', '《天津条约》', '《马关条约》'],
    answer: '《南京条约》',
    answer_index: [0],
    knowledge_point_id: 'kp-1',
    alternative_answers: [],
  };

  const mockMultiChoiceQuiz = {
    id: 'quiz-2',
    type: 'multiple-choice',
    question: '以下哪些是鸦片战争的后果？',
    options: ['割让香港岛', '开放五口通商', '赔款2100万银元', '允许传教'],
    answer: ['割让香港岛', '开放五口通商', '赔款2100万银元'],
    answer_index: [0, 1, 2],
    knowledge_point_id: 'kp-1',
  };

  const mockFillBlankQuiz = {
    id: 'quiz-3',
    type: 'fill-in-the-blank',
    question: '____是中国近代禁烟运动的先驱',
    answer: ['林则徐'],
    knowledge_point_id: 'kp-2',
    alternative_answers: ['林文忠公'],
    hints: ['人名'],
  };

  const mockSession = {
    id: sessionId,
    user_id: userId,
    status: 'in_progress',
    strategy: 'random',
    quiz_ids: ['quiz-1', 'quiz-2', 'quiz-3'],
    total_questions: 3,
    answered_questions: 0,
    correct_answers: 0,
    incorrect_answers: 0,
    skipped_questions: 0,
    time_limit_minutes: 30,
    time_spent_seconds: 0,
    score: 0,
    auto_advance_delay: 0,
    last_question_index: 0,
    session_state: {},
    started_at: new Date(),
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPracticeRepository = {
    createSession: jest.fn(),
    updateSessionStatus: jest.fn(),
    getSession: jest.fn(),
    getAnswersForSession: jest.fn(),
    getAnswersBySessionId: jest.fn(),
    submitAnswer: jest.fn(),
  };

  const mockQuizServiceImpl = {
    getRandomQuizzesByKnowledgePoints: jest.fn(),
    getQuizzesByIds: jest.fn(),
    getQuizById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PracticeRepository,
          useValue: mockPracticeRepository,
        },
        {
          provide: QuizService,
          useValue: mockQuizServiceImpl,
        },
        {
          provide: QuizRepository,
          useValue: {},
        },
        {
          provide: PersistentService,
          useValue: {},
        },
        {
          provide: GptService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);

    jest.clearAllMocks();
  });

  describe('createSession response format', () => {
    beforeEach(() => {
      mockQuizServiceImpl.getRandomQuizzesByKnowledgePoints.mockResolvedValue([
        mockSingleChoiceQuiz,
        mockMultiChoiceQuiz,
        mockFillBlankQuiz,
      ]);
      mockPracticeRepository.createSession.mockResolvedValue({
        ...mockSession,
        status: 'pending',
      });
      mockPracticeRepository.updateSessionStatus.mockResolvedValue(mockSession);
    });

    it('should return PracticeSessionResponse with all required fields', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1', 'kp-2'],
        shuffle_questions: false,
      } as any);

      // Verify top-level structure
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('quizzes');
      expect(result).toHaveProperty('submittedAnswers');
      expect(result).toHaveProperty('currentQuestionIndex');
    });

    it('should return session object with required fields for frontend', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1'],
        shuffle_questions: false,
      } as any);

      const session = result.session;

      // Required fields for frontend
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('status');
      expect(session).toHaveProperty('quiz_ids');
      expect(session).toHaveProperty('total_questions');
      expect(session).toHaveProperty('answered_questions');
      expect(session).toHaveProperty('correct_answers');
      expect(session).toHaveProperty('incorrect_answers');
      expect(session).toHaveProperty('time_limit_minutes');
      expect(session).toHaveProperty('auto_advance_delay');

      // Type checks
      expect(typeof session.id).toBe('string');
      expect(typeof session.status).toBe('string');
      expect(Array.isArray(session.quiz_ids)).toBe(true);
      expect(typeof session.total_questions).toBe('number');
    });

    it('should return quizzes as array with correct structure', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1'],
        shuffle_questions: false,
      } as any);

      expect(Array.isArray(result.quizzes)).toBe(true);
      expect(result.quizzes.length).toBe(3);

      // Verify each quiz type has correct structure
      const singleChoice = result.quizzes[0];
      expect(singleChoice).toHaveProperty('id');
      expect(singleChoice).toHaveProperty('type');
      expect(singleChoice).toHaveProperty('question');
      expect(singleChoice).toHaveProperty('options');
      expect(singleChoice).toHaveProperty('answer');
      expect(singleChoice).toHaveProperty('answer_index');
      expect(Array.isArray(singleChoice.options)).toBe(true);
      expect(Array.isArray(singleChoice.answer_index)).toBe(true);
    });

    it('should return options as array NOT plain object', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1'],
        shuffle_questions: false,
      } as any);

      // Critical: options must be array, not plain object
      // Frontend expects: ["A选项", "B选项", "C选项", "D选项"]
      // NOT: { 0: "A选项", 1: "B选项" }
      result.quizzes.forEach((quiz: any) => {
        if (quiz.options) {
          // Must be a real array (Array.isArray), not just array-like object
          expect(Array.isArray(quiz.options)).toBe(true);
          // Verify it's an array by checking constructor name
          expect(quiz.options.constructor.name).toBe('Array');
          // Verify it has array methods
          expect(typeof quiz.options.map).toBe('function');
          expect(typeof quiz.options.forEach).toBe('function');
        }
      });
    });

    it('should return submittedAnswers as empty array for new session', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1'],
        shuffle_questions: false,
      } as any);

      expect(Array.isArray(result.submittedAnswers)).toBe(true);
      expect(result.submittedAnswers).toHaveLength(0);
    });

    it('should return currentQuestionIndex as 0 for new session', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1'],
        shuffle_questions: false,
      } as any);

      expect(result.currentQuestionIndex).toBe(0);
    });

    it('should include answer_index for choice questions', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-1'],
        shuffle_questions: false,
      } as any);

      // Single choice should have answer_index
      const singleChoice = result.quizzes.find((q: any) => q.type === 'single-choice');
      expect(singleChoice.answer_index).toBeDefined();
      expect(Array.isArray(singleChoice.answer_index)).toBe(true);
      expect(singleChoice.answer_index[0]).toBe(0); // First option is correct

      // Multiple choice should have answer_index
      const multiChoice = result.quizzes.find((q: any) => q.type === 'multiple-choice');
      expect(multiChoice.answer_index).toBeDefined();
      expect(Array.isArray(multiChoice.answer_index)).toBe(true);
    });

    it('should include hints for fill-in-blank questions when available', async () => {
      const result = await service.createSession(userId, {
        knowledge_point_ids: ['kp-2'],
        shuffle_questions: false,
      } as any);

      const fillBlank = result.quizzes.find((q: any) => q.type === 'fill-in-the-blank');
      // hints may or may not be present depending on quiz
      if (fillBlank.hints) {
        expect(Array.isArray(fillBlank.hints)).toBe(true);
      }
    });
  });

  describe('submitAnswer response format', () => {
    beforeEach(() => {
      mockPracticeRepository.getSession.mockResolvedValue(mockSession);
      mockPracticeRepository.submitAnswer.mockResolvedValue({
        session_id: sessionId,
        quiz_id: 'quiz-1',
        user_answer: '0',
        is_correct: true,
      });
    });

    it('should return { isCorrect: boolean } for correct answer', async () => {
      mockQuizServiceImpl.getQuizById.mockResolvedValue(mockSingleChoiceQuiz);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: 'quiz-1',
          answer: '0', // Index-based answer
          time_spent_seconds: 10,
        },
        userId
      );

      expect(result).toHaveProperty('isCorrect');
      expect(typeof result.isCorrect).toBe('boolean');
      expect(result.isCorrect).toBe(true);
    });

    it('should return { isCorrect: boolean } for incorrect answer', async () => {
      mockQuizServiceImpl.getQuizById.mockResolvedValue(mockSingleChoiceQuiz);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: 'quiz-1',
          answer: '1', // Wrong index
          time_spent_seconds: 10,
        },
        userId
      );

      expect(result).toHaveProperty('isCorrect');
      expect(typeof result.isCorrect).toBe('boolean');
      expect(result.isCorrect).toBe(false);
    });

    it('should ONLY return isCorrect (minimal response)', async () => {
      mockQuizServiceImpl.getQuizById.mockResolvedValue(mockSingleChoiceQuiz);

      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: 'quiz-1',
          answer: '0',
          time_spent_seconds: 10,
        },
        userId
      );

      // Response should be minimal - just { isCorrect }
      // No extra fields like correctAnswer, explanation, etc.
      const keys = Object.keys(result);
      expect(keys).toContain('isCorrect');
      expect(keys.length).toBe(1); // Only isCorrect
    });
  });

  describe('getSession (resume) response format', () => {
    const previousAnswers = [
      {
        id: 'answer-1',
        session_id: sessionId,
        quiz_id: 'quiz-1',
        user_answer: '0',
        is_correct: true,
        time_spent_seconds: 15,
        answered_at: new Date(),
        created_at: new Date(),
      },
    ];

    beforeEach(() => {
      mockPracticeRepository.getSession.mockResolvedValue({
        ...mockSession,
        answered_questions: 1,
        last_question_index: 1,
      });
      mockPracticeRepository.getAnswersForSession.mockResolvedValue(previousAnswers);
      mockQuizServiceImpl.getQuizzesByIds.mockResolvedValue([
        mockSingleChoiceQuiz,
        mockMultiChoiceQuiz,
        mockFillBlankQuiz,
      ]);
    });

    it('should return same structure as createSession', async () => {
      const result = await service.getSession(sessionId, userId);

      // Should have same top-level fields as createSession
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('quizzes');
      expect(result).toHaveProperty('submittedAnswers');
      expect(result).toHaveProperty('currentQuestionIndex');
    });

    it('should include previously submitted answers', async () => {
      const result = await service.getSession(sessionId, userId);

      expect(Array.isArray(result.submittedAnswers)).toBe(true);
      expect(result.submittedAnswers.length).toBe(1);

      const answer = result.submittedAnswers[0];
      expect(answer).toHaveProperty('quiz_id');
      expect(answer).toHaveProperty('user_answer');
      expect(answer).toHaveProperty('is_correct');
    });

    it('should return correct currentQuestionIndex for resume', async () => {
      const result = await service.getSession(sessionId, userId);

      // currentQuestionIndex should be last_question_index from session
      expect(result.currentQuestionIndex).toBe(1);
    });

    it('should return ALL quizzes (not just remaining)', async () => {
      const result = await service.getSession(sessionId, userId);

      // Frontend needs all quizzes to display review or navigate back
      expect(result.quizzes.length).toBe(3);
    });
  });
});

/**
 * Order-Independent Groups Integration Tests
 *
 * Tests for fill-in-the-blank questions where certain blanks can be
 * answered in any order within a group.
 */
describe('PracticeService - Order-Independent Groups', () => {
  let service: PracticeService;
  let practiceRepository: jest.Mocked<PracticeRepository>;
  let quizService: jest.Mocked<QuizService>;

  const sessionId = '123e4567-e89b-12d3-a456-426614174000';
  const questionId = '123e4567-e89b-12d3-a456-426614174001';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const mockPracticeRepository = {
    getSession: jest.fn(),
    submitAnswer: jest.fn(),
  };

  const mockQuizService = {
    getQuizById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeService,
        {
          provide: PracticeRepository,
          useValue: mockPracticeRepository,
        },
        {
          provide: QuizService,
          useValue: mockQuizService,
        },
        {
          provide: QuizRepository,
          useValue: {},
        },
        {
          provide: PersistentService,
          useValue: {},
        },
        {
          provide: GptService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PracticeService>(PracticeService);
    practiceRepository = module.get(PracticeRepository) as jest.Mocked<PracticeRepository>;
    quizService = module.get(QuizService) as jest.Mocked<QuizService>;

    jest.clearAllMocks();

    // Default session mock
    mockPracticeRepository.getSession.mockResolvedValue({
      id: sessionId,
      user_id: userId,
      status: 'in_progress',
      answered_questions: 0,
      total_questions: 5,
    } as any);

    mockPracticeRepository.submitAnswer.mockResolvedValue({
      session_id: sessionId,
      quiz_id: questionId,
      user_answer: 'test',
      is_correct: true,
    } as any);
  });

  describe('Single group - blanks can swap within group', () => {
    it('should accept answers in any order within same group', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '与北宋并立的民族政权有____和____',
        answer: ['辽', '西夏'],
        extra_properties: {
          'order-independent-groups': [[0, 1]],
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Original order
      let result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['辽', '西夏'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);

      // Swapped order - should also be correct
      result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['西夏', '辽'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);
    });

    it('should reject incorrect answers even with swapping', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '与北宋并立的民族政权有____和____',
        answer: ['辽', '西夏'],
        extra_properties: {
          'order-independent-groups': [[0, 1]],
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Wrong answers
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['金', '蒙古'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Mixed grouped and non-grouped blanks', () => {
    it('should require exact position for non-grouped blanks', async () => {
      // Quiz: "____建立了____，定都____"
      // answer: ['元朝', '忽必烈', '大都']
      // groups: [[0, 1]] - first two can swap, but third is fixed
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____建立了____，定都____',
        answer: ['忽必烈', '元朝', '大都'],
        extra_properties: {
          'order-independent-groups': [[0, 1]],
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Correct: first two swapped, third in place
      let result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['元朝', '忽必烈', '大都'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);

      // Wrong: third position changed
      result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['忽必烈', '元朝', '北京'], // 北京 != 大都
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Multiple independent groups', () => {
    it('should handle multiple independent groups', async () => {
      // Quiz: "____和____统一了____和____"
      // Groups: [[0, 1], [2, 3]]
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____统一了____和____',
        answer: ['秦始皇', '嬴政', '六国', '天下'],
        extra_properties: {
          'order-independent-groups': [[0, 1], [2, 3]],
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // All swapped within groups
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['嬴政', '秦始皇', '天下', '六国'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);
    });

    it('should reject cross-group swapping', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____统一了____和____',
        answer: ['秦始皇', '嬴政', '六国', '天下'],
        extra_properties: {
          'order-independent-groups': [[0, 1], [2, 3]],
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Cross-group swap (秦始皇 to position 2)
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['嬴政', '六国', '秦始皇', '天下'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('No order-independent-groups (strict order)', () => {
    it('should require exact order when no groups defined', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是____年发生的事件',
        answer: ['辛亥革命', '1911'],
        // No order-independent-groups - strict order
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Correct order
      let result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['辛亥革命', '1911'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);

      // Swapped - should fail without groups
      result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['1911', '辛亥革命'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Empty order-independent-groups array', () => {
    it('should treat empty groups array as strict order', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____是____年发生的事件',
        answer: ['辛亥革命', '1911'],
        extra_properties: {
          'order-independent-groups': [], // Empty array
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Swapped - should fail with empty groups
      const result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['1911', '辛亥革命'],
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Order-independent with alternatives', () => {
    it('should combine order-independent-groups with position-specific alternatives', async () => {
      const quiz = {
        id: questionId,
        type: 'fill-in-the-blank',
        question: '____和____是维新变法的领袖',
        answer: ['康有为', '梁启超'],
        alternative_answers: ['[0]南海先生', '[1]任公'],
        extra_properties: {
          'order-independent-groups': [[0, 1]],
        },
      };

      quizService.getQuizById.mockResolvedValue(quiz as any);

      // Use alternative in swapped position
      // Note: alternatives are position-specific, but groups allow swapping
      // This is a complex case - the alternative [0]南海先生 is for position 0
      // When groups allow swapping, we check within the group

      // Original positions with alternatives
      let result = await service.submitAnswer(
        {
          session_id: sessionId,
          question_id: questionId,
          answer: ['南海先生', '梁启超'], // [0] alternative at position 0
          time_spent_seconds: 30,
        },
        userId
      );
      expect(result.isCorrect).toBe(true);
    });
  });
});
