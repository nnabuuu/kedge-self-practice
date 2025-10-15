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
});
