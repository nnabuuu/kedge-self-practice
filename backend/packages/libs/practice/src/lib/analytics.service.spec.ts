import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { NotFoundException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: jest.Mocked<AnalyticsRepository>;

  const mockRepository = {
    getQuizErrorRates: jest.fn(),
    getErrorRateSummary: jest.fn(),
    getQuizErrorDetails: jest.fn(),
    getWrongAnswerDistribution: jest.fn(),
    getQuizPerformanceComparison: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get(AnalyticsRepository) as jest.Mocked<AnalyticsRepository>;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuizErrorRates', () => {
    const mockErrorRates = [
      {
        quiz_id: '123e4567-e89b-12d3-a456-426614174000',
        quiz_text: 'Test question',
        quiz_type: 'single_choice',
        correct_answer: 'A',
        answer_index: [0],
        options: null,
        knowledge_point_id: '123e4567-e89b-12d3-a456-426614174001',
        knowledge_point_name: 'Test KP',
        total_attempts: 100,
        incorrect_attempts: 60,
        error_rate: 60.0,
        wrong_answer_distribution: null,
      },
    ];

    const mockSummary = {
      total_questions: 10,
      avg_error_rate: 45.5,
      high_error_count: 3,
      total_attempts: 1000,
    };

    beforeEach(() => {
      repository.getQuizErrorRates.mockResolvedValue({
        data: mockErrorRates,
        total: 10,
      });
      repository.getErrorRateSummary.mockResolvedValue(mockSummary);
    });

    it('should return paginated error rates with summary', async () => {
      const result = await service.getQuizErrorRates({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
        page: 1,
        pageSize: 20,
      });

      expect(result).toEqual({
        data: mockErrorRates,
        summary: mockSummary,
        pagination: {
          currentPage: 1,
          pageSize: 20,
          totalPages: 1,
          totalCount: 10,
        },
      });

      expect(repository.getQuizErrorRates).toHaveBeenCalledWith({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        knowledgePointId: undefined,
        timeFrameStart: expect.any(Date),
        timeFrameEnd: expect.any(Date),
        minAttempts: 5,
        limit: 20,
        offset: 0,
      });

      expect(repository.getErrorRateSummary).toHaveBeenCalledWith({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        knowledgePointId: undefined,
        timeFrameStart: expect.any(Date),
        timeFrameEnd: expect.any(Date),
        minAttempts: 5,
      });
    });

    it('should handle knowledge point filter', async () => {
      await service.getQuizErrorRates({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        knowledgePointId: '123e4567-e89b-12d3-a456-426614174001',
        timeFrame: '7d',
        minAttempts: 10,
        page: 1,
        pageSize: 20,
      });

      expect(repository.getQuizErrorRates).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgePointId: '123e4567-e89b-12d3-a456-426614174001',
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      repository.getQuizErrorRates.mockResolvedValue({
        data: mockErrorRates,
        total: 45,
      });

      const result = await service.getQuizErrorRates({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
        page: 2,
        pageSize: 10,
      });

      expect(result.pagination).toEqual({
        currentPage: 2,
        pageSize: 10,
        totalPages: 5,
        totalCount: 45,
      });

      expect(repository.getQuizErrorRates).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10,
        })
      );
    });

    describe('time frame conversion', () => {
      it('should convert 7d time frame correctly', async () => {
        await service.getQuizErrorRates({
          subjectId: '123e4567-e89b-12d3-a456-426614174002',
          timeFrame: '7d',
          minAttempts: 5,
          page: 1,
          pageSize: 20,
        });

        const call = repository.getQuizErrorRates.mock.calls[0][0];
        const start = call.timeFrameStart as Date;
        const end = call.timeFrameEnd as Date;

        const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBeCloseTo(7, 0);
      });

      it('should convert 30d time frame correctly', async () => {
        await service.getQuizErrorRates({
          subjectId: '123e4567-e89b-12d3-a456-426614174002',
          timeFrame: '30d',
          minAttempts: 5,
          page: 1,
          pageSize: 20,
        });

        const call = repository.getQuizErrorRates.mock.calls[0][0];
        const start = call.timeFrameStart as Date;
        const end = call.timeFrameEnd as Date;

        const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBeCloseTo(30, 0);
      });

      it('should handle "all" time frame (no date filter)', async () => {
        await service.getQuizErrorRates({
          subjectId: '123e4567-e89b-12d3-a456-426614174002',
          timeFrame: 'all',
          minAttempts: 5,
          page: 1,
          pageSize: 20,
        });

        const call = repository.getQuizErrorRates.mock.calls[0][0];
        expect(call.timeFrameStart).toBeUndefined();
      });
    });
  });

  describe('getQuizErrorDetails', () => {
    const mockQuizDetails = {
      quiz_id: '123e4567-e89b-12d3-a456-426614174000',
      question: 'What is 2+2?',
      type: 'single_choice',
      correct_answer: '4',
      options: ['2', '3', '4', '5'],
      knowledge_point: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Basic Math',
      },
      total_attempts: 100,
      correct_count: 40,
      incorrect_count: 60,
      error_rate: 60.0,
    };

    const mockWrongAnswers = [
      { answer: '3', count: 30, percentage: 50.0 },
      { answer: '2', count: 20, percentage: 33.33 },
      { answer: '5', count: 10, percentage: 16.67 },
    ];

    beforeEach(() => {
      repository.getQuizErrorDetails.mockResolvedValue(mockQuizDetails);
      repository.getWrongAnswerDistribution.mockResolvedValue(mockWrongAnswers);
    });

    it('should return quiz details with wrong answer distribution', async () => {
      const result = await service.getQuizErrorDetails({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        timeFrame: '30d',
      });

      expect(result).toEqual({
        quiz: mockQuizDetails,
        wrongAnswerDistribution: mockWrongAnswers,
      });

      expect(repository.getQuizErrorDetails).toHaveBeenCalledWith({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        timeFrameStart: expect.any(Date),
        timeFrameEnd: expect.any(Date),
      });

      expect(repository.getWrongAnswerDistribution).toHaveBeenCalledWith({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        timeFrameStart: expect.any(Date),
        timeFrameEnd: expect.any(Date),
      });
    });

    it('should throw NotFoundException when quiz not found', async () => {
      repository.getQuizErrorDetails.mockResolvedValue(null);

      await expect(
        service.getQuizErrorDetails({
          quizId: '123e4567-e89b-12d3-a456-426614174000',
          timeFrame: '30d',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle different time frames', async () => {
      await service.getQuizErrorDetails({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        timeFrame: '7d',
      });

      const call = repository.getQuizErrorDetails.mock.calls[0][0];
      const start = call.timeFrameStart as Date;
      const end = call.timeFrameEnd as Date;

      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeCloseTo(7, 0);
    });
  });

  describe('exportErrorRatesToCSV', () => {
    const mockErrorRates = [
      {
        quiz_id: '123e4567-e89b-12d3-a456-426614174000',
        quiz_text: 'What is "2+2"?',
        quiz_type: 'single_choice',
        correct_answer: 'A',
        answer_index: [0],
        options: null,
        knowledge_point_id: '123e4567-e89b-12d3-a456-426614174001',
        knowledge_point_name: 'Math Basics',
        total_attempts: 100,
        incorrect_attempts: 60,
        error_rate: 60.0,
        wrong_answer_distribution: null,
      },
      {
        quiz_id: '123e4567-e89b-12d3-a456-426614174002',
        quiz_text: 'Simple question',
        quiz_type: 'fill_in_blank',
        correct_answer: 'answer',
        answer_index: null,
        options: null,
        knowledge_point_id: null,
        knowledge_point_name: null,
        total_attempts: 50,
        incorrect_attempts: 10,
        error_rate: 20.0,
        wrong_answer_distribution: null,
      },
    ];

    beforeEach(() => {
      repository.getQuizErrorRates.mockResolvedValue({
        data: mockErrorRates,
        total: 2,
      });
    });

    it('should generate CSV with correct headers', async () => {
      const csv = await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
      });

      const lines = csv.split('\n');
      const headers = lines[0];

      // Check for Chinese headers
      expect(headers).toContain('排名'); // Rank
      expect(headers).toContain('题目ID'); // Quiz ID
      expect(headers).toContain('题目内容'); // Question
      expect(headers).toContain('题型'); // Type
      expect(headers).toContain('知识点'); // Knowledge Point
      expect(headers).toContain('错误率'); // Error Rate
      expect(headers).toContain('总答题次数'); // Total Attempts
      expect(headers).toContain('错误次数'); // Incorrect
      expect(headers).toContain('正确次数'); // Correct
    });

    it('should generate CSV with correct data rows', async () => {
      const csv = await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
      });

      const lines = csv.split('\n');

      // First data row
      expect(lines[1]).toContain('1'); // Rank
      expect(lines[1]).toContain('123e4567-e89b-12d3-a456-426614174000');
      expect(lines[1]).toContain('60%'); // Error rate

      // Second data row
      expect(lines[2]).toContain('2'); // Rank
      expect(lines[2]).toContain('123e4567-e89b-12d3-a456-426614174002');
      expect(lines[2]).toContain('20%'); // Error rate
    });

    it('should escape quotes in quiz text', async () => {
      const csv = await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
      });

      // The quiz text with quotes should be properly escaped
      expect(csv).toContain('""2+2""');
    });

    it('should handle null knowledge point names', async () => {
      const csv = await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
      });

      expect(csv).toContain('无'); // For null knowledge point (Chinese)
    });

    it('should calculate correct answers from total and incorrect', async () => {
      const csv = await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
      });

      const lines = csv.split('\n');

      // First row: 100 total - 60 incorrect = 40 correct
      expect(lines[1]).toContain(',40');

      // Second row: 50 total - 10 incorrect = 40 correct
      expect(lines[2]).toContain(',40');
    });

    it('should use large limit for export (no pagination)', async () => {
      await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        timeFrame: '30d',
        minAttempts: 5,
      });

      expect(repository.getQuizErrorRates).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10000,
          offset: 0,
        })
      );
    });

    it('should handle knowledge point filter in export', async () => {
      await service.exportErrorRatesToCSV({
        subjectId: '123e4567-e89b-12d3-a456-426614174002',
        knowledgePointId: '123e4567-e89b-12d3-a456-426614174001',
        timeFrame: '7d',
        minAttempts: 10,
      });

      expect(repository.getQuizErrorRates).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgePointId: '123e4567-e89b-12d3-a456-426614174001',
        })
      );
    });
  });

  describe('getQuizPerformanceComparison', () => {
    const mockPerformanceComparison = {
      quiz_id: '123e4567-e89b-12d3-a456-426614174000',
      user_time: 45,
      avg_time: 60,
      min_time: 20,
      max_time: 120,
      time_percentile: 75,
      user_correct: true,
      user_accuracy: 85,
      avg_accuracy: 65,
      total_attempts: 150,
    };

    beforeEach(() => {
      repository.getQuizPerformanceComparison.mockResolvedValue(mockPerformanceComparison);
    });

    it('should return quiz performance comparison data', async () => {
      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result).toEqual(mockPerformanceComparison);

      expect(repository.getQuizPerformanceComparison).toHaveBeenCalledWith({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });
    });

    it('should throw NotFoundException when performance data not found', async () => {
      repository.getQuizPerformanceComparison.mockResolvedValue(null as any);

      await expect(
        service.getQuizPerformanceComparison({
          quizId: '123e4567-e89b-12d3-a456-426614174000',
          sessionId: '123e4567-e89b-12d3-a456-426614174005',
          userId: '123e4567-e89b-12d3-a456-426614174010',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle quiz where user was faster than average', async () => {
      const fastUserData = {
        ...mockPerformanceComparison,
        user_time: 30,
        avg_time: 60,
        time_percentile: 90, // Faster than 90% of users
      };

      repository.getQuizPerformanceComparison.mockResolvedValue(fastUserData);

      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result.user_time).toBeLessThan(result.avg_time);
      expect(result.time_percentile).toBeGreaterThan(50);
    });

    it('should handle quiz where user was slower than average', async () => {
      const slowUserData = {
        ...mockPerformanceComparison,
        user_time: 90,
        avg_time: 60,
        time_percentile: 25, // Faster than only 25% of users
      };

      repository.getQuizPerformanceComparison.mockResolvedValue(slowUserData);

      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result.user_time).toBeGreaterThan(result.avg_time);
      expect(result.time_percentile).toBeLessThan(50);
    });

    it('should handle quiz where user accuracy is above average', async () => {
      const highAccuracyData = {
        ...mockPerformanceComparison,
        user_accuracy: 95,
        avg_accuracy: 70,
        user_correct: true,
      };

      repository.getQuizPerformanceComparison.mockResolvedValue(highAccuracyData);

      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result.user_accuracy).toBeGreaterThan(result.avg_accuracy);
      expect(result.user_correct).toBe(true);
    });

    it('should handle quiz where user accuracy is below average', async () => {
      const lowAccuracyData = {
        ...mockPerformanceComparison,
        user_accuracy: 40,
        avg_accuracy: 70,
        user_correct: false,
      };

      repository.getQuizPerformanceComparison.mockResolvedValue(lowAccuracyData);

      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result.user_accuracy).toBeLessThan(result.avg_accuracy);
      expect(result.user_correct).toBe(false);
    });

    it('should handle edge case: user answered correctly but historical accuracy is low', async () => {
      const edgeCaseData = {
        ...mockPerformanceComparison,
        user_correct: true,
        user_accuracy: 33, // Only 1 out of 3 historical attempts correct
        avg_accuracy: 70,
      };

      repository.getQuizPerformanceComparison.mockResolvedValue(edgeCaseData);

      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result.user_correct).toBe(true);
      expect(result.user_accuracy).toBeLessThan(result.avg_accuracy);
    });

    it('should handle quiz with high number of total attempts', async () => {
      const popularQuizData = {
        ...mockPerformanceComparison,
        total_attempts: 5000,
      };

      repository.getQuizPerformanceComparison.mockResolvedValue(popularQuizData);

      const result = await service.getQuizPerformanceComparison({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });

      expect(result.total_attempts).toBe(5000);
    });
  });
});
