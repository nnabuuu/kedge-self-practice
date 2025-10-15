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
        knowledge_point_id: '123e4567-e89b-12d3-a456-426614174001',
        knowledge_point_name: 'Test KP',
        total_attempts: 100,
        incorrect_attempts: 60,
        error_rate: 60.0,
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
        knowledge_point_id: '123e4567-e89b-12d3-a456-426614174001',
        knowledge_point_name: 'Math Basics',
        total_attempts: 100,
        incorrect_attempts: 60,
        error_rate: 60.0,
      },
      {
        quiz_id: '123e4567-e89b-12d3-a456-426614174002',
        quiz_text: 'Simple question',
        quiz_type: 'fill_in_blank',
        correct_answer: 'answer',
        knowledge_point_id: null,
        knowledge_point_name: null,
        total_attempts: 50,
        incorrect_attempts: 10,
        error_rate: 20.0,
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

      expect(headers).toContain('Rank');
      expect(headers).toContain('Quiz ID');
      expect(headers).toContain('Question');
      expect(headers).toContain('Type');
      expect(headers).toContain('Knowledge Point');
      expect(headers).toContain('Error Rate');
      expect(headers).toContain('Total Attempts');
      expect(headers).toContain('Incorrect');
      expect(headers).toContain('Correct');
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

      expect(csv).toContain('N/A'); // For null knowledge point
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
});
