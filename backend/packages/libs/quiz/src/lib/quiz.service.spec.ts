import { Test, TestingModule } from '@nestjs/testing';
import { DefaultQuizService } from './quiz.service';
import { QuizRepository } from './quiz.repository';
import { QuizStorageService } from './quiz.storage';
import { KnowledgePointStorage } from '@kedge/knowledge-point';
import { QuizItem } from '@kedge/models';

describe('DefaultQuizService', () => {
  let service: DefaultQuizService;
  let repository: jest.Mocked<QuizRepository>;
  let storage: jest.Mocked<QuizStorageService>;
  let knowledgePointStorage: jest.Mocked<KnowledgePointStorage>;

  const mockRepository = {
    createQuiz: jest.fn(),
    findQuizById: jest.fn(),
    getRandomQuizzesByKnowledgePoints: jest.fn(),
    updateQuiz: jest.fn(),
    deleteQuiz: jest.fn(),
    getQuizzesByIds: jest.fn(),
    listQuizzes: jest.fn(),
    searchQuizzesByTags: jest.fn(),
    getAllTags: jest.fn(),
  };

  const mockStorage = {
    saveQuizImage: jest.fn(),
    getQuizImageUrl: jest.fn(),
    deleteQuizImage: jest.fn(),
  };

  const mockKnowledgePointStorage = {
    getKnowledgePointById: jest.fn(),
    getAllKnowledgePoints: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultQuizService,
        {
          provide: QuizRepository,
          useValue: mockRepository,
        },
        {
          provide: QuizStorageService,
          useValue: mockStorage,
        },
        {
          provide: KnowledgePointStorage,
          useValue: mockKnowledgePointStorage,
        },
      ],
    }).compile();

    service = module.get<DefaultQuizService>(DefaultQuizService);
    repository = module.get(QuizRepository) as jest.Mocked<QuizRepository>;
    storage = module.get(QuizStorageService) as jest.Mocked<QuizStorageService>;
    knowledgePointStorage = module.get(KnowledgePointStorage) as jest.Mocked<KnowledgePointStorage>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuiz', () => {
    it('should create a quiz successfully', async () => {
      const quizItem: QuizItem = {
        type: 'single-choice',
        question: 'Test question?',
        options: ['Option A', 'Option B', 'Option C'],
        answer: 'Option B',
        knowledge_point_id: 'kp_1',
        alternative_answers: [],
      };

      const createdQuiz = { ...quizItem, id: 'quiz-123' };
      mockRepository.createQuiz.mockResolvedValue(createdQuiz as any);

      const result = await service.createQuiz(quizItem);

      expect(result).toEqual(createdQuiz);
      expect(repository.createQuiz).toHaveBeenCalled();
    });

    it('should handle quiz creation with multiple choice answers', async () => {
      const quizItem: QuizItem = {
        type: 'multiple-choice',
        question: 'Select all that apply',
        options: ['A', 'B', 'C', 'D'],
        answer: ['A', 'C'],
        knowledge_point_id: 'kp_1',
        alternative_answers: [],
      };

      const createdQuiz = { ...quizItem, id: 'quiz-456' };
      mockRepository.createQuiz.mockResolvedValue(createdQuiz as any);

      const result = await service.createQuiz(quizItem);

      expect(result).toBeDefined();
      expect(result.id).toBe('quiz-456');
    });

    it('should handle fill-in-the-blank questions', async () => {
      const quizItem: QuizItem = {
        type: 'fill-in-the-blank',
        question: 'The capital of France is ____',
        answer: 'Paris',
        alternative_answers: ['paris', 'PARIS'],
        knowledge_point_id: 'kp_1',
      };

      const createdQuiz = { ...quizItem, id: 'quiz-789' };
      mockRepository.createQuiz.mockResolvedValue(createdQuiz as any);

      const result = await service.createQuiz(quizItem);

      expect(result).toBeDefined();
      expect(result.alternative_answers).toEqual(['paris', 'PARIS']);
    });
  });

  describe('findQuizById', () => {
    it('should find quiz by id', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        type: 'single-choice',
        question: 'Test?',
        options: ['A', 'B'],
        answer: 'A',
        knowledge_point_id: 'kp_1',
      };

      mockRepository.findQuizById.mockResolvedValue(mockQuiz as any);

      const result = await service.findQuizById('quiz-123');

      expect(result).toEqual(mockQuiz);
      expect(repository.findQuizById).toHaveBeenCalledWith('quiz-123');
    });

    it('should return null for non-existent quiz', async () => {
      mockRepository.findQuizById.mockResolvedValue(null);

      const result = await service.findQuizById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getRandomQuizzesByKnowledgePoints', () => {
    it('should get random quizzes by knowledge points', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          type: 'single-choice',
          question: 'Q1?',
          knowledge_point_id: 'kp_1',
        },
        {
          id: 'quiz-2',
          type: 'multiple-choice',
          question: 'Q2?',
          knowledge_point_id: 'kp_2',
        },
      ];

      mockRepository.getRandomQuizzesByKnowledgePoints.mockResolvedValue(mockQuizzes as any);

      const result = await service.getRandomQuizzesByKnowledgePoints(['kp_1', 'kp_2'], 10);

      expect(result).toEqual(mockQuizzes);
      expect(repository.getRandomQuizzesByKnowledgePoints).toHaveBeenCalledWith(
        ['kp_1', 'kp_2'],
        10,
        undefined
      );
    });

    it('should filter by quiz types', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          type: 'single-choice',
          question: 'Q1?',
          knowledge_point_id: 'kp_1',
        },
      ];

      mockRepository.getRandomQuizzesByKnowledgePoints.mockResolvedValue(mockQuizzes as any);

      const result = await service.getRandomQuizzesByKnowledgePoints(
        ['kp_1'],
        5,
        ['single-choice', 'multiple-choice']
      );

      expect(result).toEqual(mockQuizzes);
      expect(repository.getRandomQuizzesByKnowledgePoints).toHaveBeenCalledWith(
        ['kp_1'],
        5,
        ['single-choice', 'multiple-choice']
      );
    });

    it('should return empty array when no quizzes found', async () => {
      mockRepository.getRandomQuizzesByKnowledgePoints.mockResolvedValue([]);

      const result = await service.getRandomQuizzesByKnowledgePoints(['kp_999'], 10);

      expect(result).toEqual([]);
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz successfully', async () => {
      const quizId = 'quiz-123';
      const existingQuiz = {
        id: quizId,
        type: 'single-choice' as const,
        question: 'Old question?',
        answer: 'A',
        options: ['A', 'B', 'C'],
        knowledge_point_id: 'kp_1',
        alternative_answers: [],
      };

      const updates: Partial<QuizItem> = {
        question: 'Updated question?',
        answer: 'Updated answer',
      };

      const updatedQuiz = {
        ...existingQuiz,
        ...updates,
      };

      // Mock findQuizById to return existing quiz
      mockRepository.findQuizById.mockResolvedValue(existingQuiz as any);
      // Mock updateQuiz to return updated quiz
      mockRepository.updateQuiz.mockResolvedValue(updatedQuiz as any);

      const result = await service.updateQuiz(quizId, updates);

      expect(result).toBeDefined();
      expect(result?.question).toBe('Updated question?');
      expect(repository.findQuizById).toHaveBeenCalledWith(quizId);
      expect(repository.updateQuiz).toHaveBeenCalled();
    });

    it('should return null when updating non-existent quiz', async () => {
      mockRepository.updateQuiz.mockResolvedValue(null);

      const result = await service.updateQuiz('non-existent', { question: 'New?' });

      expect(result).toBeNull();
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz successfully', async () => {
      mockRepository.deleteQuiz.mockResolvedValue(true);

      const result = await service.deleteQuiz('quiz-123');

      expect(result).toBe(true);
      expect(repository.deleteQuiz).toHaveBeenCalledWith('quiz-123');
    });

    it('should return false when deleting non-existent quiz', async () => {
      mockRepository.deleteQuiz.mockResolvedValue(false);

      const result = await service.deleteQuiz('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getQuizzesByIds', () => {
    it('should get multiple quizzes by ids', async () => {
      const mockQuizzes = [
        { id: 'quiz-1', question: 'Q1', type: 'single-choice' },
        { id: 'quiz-2', question: 'Q2', type: 'multiple-choice' },
      ];

      mockRepository.getQuizzesByIds.mockResolvedValue(mockQuizzes as any);

      const result = await service.getQuizzesByIds(['quiz-1', 'quiz-2']);

      expect(result).toEqual(mockQuizzes);
      expect(repository.getQuizzesByIds).toHaveBeenCalledWith(['quiz-1', 'quiz-2']);
    });

    it('should handle empty ids array', async () => {
      mockRepository.getQuizzesByIds.mockResolvedValue([]);

      const result = await service.getQuizzesByIds([]);

      expect(result).toEqual([]);
    });

    it('should return partial results when some ids do not exist', async () => {
      const mockQuizzes = [
        { id: 'quiz-1', question: 'Q1', type: 'single-choice' },
      ];

      mockRepository.getQuizzesByIds.mockResolvedValue(mockQuizzes as any);

      const result = await service.getQuizzesByIds(['quiz-1', 'non-existent']);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('quiz-1');
    });
  });

  describe('listQuizzes', () => {
    it('should list all quizzes', async () => {
      const mockQuizzes = [
        { id: 'quiz-1', question: 'Q1', type: 'single-choice' },
        { id: 'quiz-2', question: 'Q2', type: 'multiple-choice' },
        { id: 'quiz-3', question: 'Q3', type: 'fill-in-the-blank' },
      ];

      mockRepository.listQuizzes.mockResolvedValue(mockQuizzes as any);

      const result = await service.listQuizzes();

      expect(result).toEqual(mockQuizzes);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no quizzes exist', async () => {
      mockRepository.listQuizzes.mockResolvedValue([]);

      const result = await service.listQuizzes();

      expect(result).toEqual([]);
    });
  });

  describe('searchQuizzesByTags', () => {
    it('should search quizzes by tags', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          question: 'Q1',
          type: 'single-choice',
          tags: ['history', 'ancient'],
        },
        {
          id: 'quiz-2',
          question: 'Q2',
          type: 'single-choice',
          tags: ['history', 'modern'],
        },
      ];

      mockRepository.searchQuizzesByTags.mockResolvedValue(mockQuizzes as any);

      const result = await service.searchQuizzesByTags(['history']);

      expect(result).toEqual(mockQuizzes);
      expect(repository.searchQuizzesByTags).toHaveBeenCalledWith(['history']);
    });

    it('should return empty array for non-matching tags', async () => {
      mockRepository.searchQuizzesByTags.mockResolvedValue([]);

      const result = await service.searchQuizzesByTags(['non-existent-tag']);

      expect(result).toEqual([]);
    });
  });

  describe('getAllTags', () => {
    it('should get all available tags', async () => {
      const mockTags = ['history', 'geography', 'science', 'math'];

      mockRepository.getAllTags.mockResolvedValue(mockTags);

      const result = await service.getAllTags();

      expect(result).toEqual(mockTags);
      expect(result.length).toBe(4);
    });

    it('should return empty array when no tags exist', async () => {
      mockRepository.getAllTags.mockResolvedValue([]);

      const result = await service.getAllTags();

      expect(result).toEqual([]);
    });
  });

  describe('getQuizById (alias)', () => {
    it('should find quiz using getQuizById alias', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        type: 'single-choice',
        question: 'Test?',
        knowledge_point_id: 'kp_1',
      };

      // getQuizById should call findQuizById internally
      mockRepository.findQuizById.mockResolvedValue(mockQuiz as any);

      const result = await service.getQuizById('quiz-123');

      expect(result).toEqual(mockQuiz);
    });
  });
});
