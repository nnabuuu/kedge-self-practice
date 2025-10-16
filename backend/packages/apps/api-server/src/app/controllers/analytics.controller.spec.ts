import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '@kedge/practice';

// Mock ali-oss module to avoid ESM import issues in tests
jest.mock('ali-oss', () => {
  return jest.fn().mockImplementation(() => ({
    put: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  }));
});

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<AnalyticsService>;

  const mockService = {
    getQuizErrorRates: jest.fn(),
    getQuizErrorDetails: jest.fn(),
    exportErrorRatesToCSV: jest.fn(),
    getQuizPerformanceComparison: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get(AnalyticsService) as jest.Mocked<AnalyticsService>;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuizPerformanceComparison', () => {
    const mockPerformanceData = {
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

    const mockRequest = {
      user: {
        sub: '123e4567-e89b-12d3-a456-426614174010',
      },
    };

    beforeEach(() => {
      service.getQuizPerformanceComparison.mockResolvedValue(mockPerformanceData);
    });

    it('should return performance comparison data with success flag', async () => {
      const result = await controller.getQuizPerformanceComparison(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174005',
        mockRequest
      );

      expect(result).toEqual({
        success: true,
        data: mockPerformanceData,
      });

      expect(service.getQuizPerformanceComparison).toHaveBeenCalledWith({
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174005',
        userId: '123e4567-e89b-12d3-a456-426614174010',
      });
    });

    it('should extract userId from request user object', async () => {
      await controller.getQuizPerformanceComparison(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174005',
        mockRequest
      );

      expect(service.getQuizPerformanceComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123e4567-e89b-12d3-a456-426614174010',
        })
      );
    });

    it('should handle alternative userId field in request', async () => {
      const altRequest = {
        user: {
          userId: '123e4567-e89b-12d3-a456-426614174010',
        },
      };

      await controller.getQuizPerformanceComparison(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174005',
        altRequest
      );

      expect(service.getQuizPerformanceComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '123e4567-e89b-12d3-a456-426614174010',
        })
      );
    });

    it('should throw UNAUTHORIZED when user ID not found in token', async () => {
      const invalidRequest = {
        user: {},
      };

      await expect(
        controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          invalidRequest
        )
      ).rejects.toThrow(
        new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED)
      );
    });

    it('should throw BAD_REQUEST when quiz ID is not a valid UUID', async () => {
      await expect(
        controller.getQuizPerformanceComparison(
          'invalid-uuid',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        )
      ).rejects.toThrow(HttpException);
    });

    it('should throw BAD_REQUEST when session ID is not a valid UUID', async () => {
      await expect(
        controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          'invalid-session-id',
          mockRequest
        )
      ).rejects.toThrow(HttpException);
    });

    it('should throw NOT_FOUND when quiz not found', async () => {
      service.getQuizPerformanceComparison.mockRejectedValue(
        new Error('Quiz with ID 123e4567-e89b-12d3-a456-426614174000 not found')
      );

      await expect(
        controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        )
      ).rejects.toThrow(HttpException);
    });

    it('should throw INTERNAL_SERVER_ERROR for other errors', async () => {
      service.getQuizPerformanceComparison.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        )
      ).rejects.toThrow(HttpException);
    });

    describe('performance comparison edge cases', () => {
      it('should handle user faster than average', async () => {
        const fastUserData = {
          ...mockPerformanceData,
          user_time: 30,
          avg_time: 60,
          time_percentile: 90,
        };

        service.getQuizPerformanceComparison.mockResolvedValue(fastUserData);

        const result = await controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        );

        expect(result.data.user_time).toBeLessThan(result.data.avg_time);
        expect(result.data.time_percentile).toBeGreaterThan(50);
      });

      it('should handle user slower than average', async () => {
        const slowUserData = {
          ...mockPerformanceData,
          user_time: 90,
          avg_time: 60,
          time_percentile: 25,
        };

        service.getQuizPerformanceComparison.mockResolvedValue(slowUserData);

        const result = await controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        );

        expect(result.data.user_time).toBeGreaterThan(result.data.avg_time);
        expect(result.data.time_percentile).toBeLessThan(50);
      });

      it('should handle user with higher accuracy than average', async () => {
        const highAccuracyData = {
          ...mockPerformanceData,
          user_accuracy: 95,
          avg_accuracy: 70,
        };

        service.getQuizPerformanceComparison.mockResolvedValue(highAccuracyData);

        const result = await controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        );

        expect(result.data.user_accuracy).toBeGreaterThan(result.data.avg_accuracy);
      });

      it('should handle user with lower accuracy than average', async () => {
        const lowAccuracyData = {
          ...mockPerformanceData,
          user_accuracy: 40,
          avg_accuracy: 70,
          user_correct: false,
        };

        service.getQuizPerformanceComparison.mockResolvedValue(lowAccuracyData);

        const result = await controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        );

        expect(result.data.user_accuracy).toBeLessThan(result.data.avg_accuracy);
        expect(result.data.user_correct).toBe(false);
      });

      it('should handle quiz with very few attempts', async () => {
        const lowAttemptsData = {
          ...mockPerformanceData,
          total_attempts: 5,
        };

        service.getQuizPerformanceComparison.mockResolvedValue(lowAttemptsData);

        const result = await controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        );

        expect(result.data.total_attempts).toBe(5);
      });

      it('should handle quiz with many attempts', async () => {
        const highAttemptsData = {
          ...mockPerformanceData,
          total_attempts: 10000,
        };

        service.getQuizPerformanceComparison.mockResolvedValue(highAttemptsData);

        const result = await controller.getQuizPerformanceComparison(
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174005',
          mockRequest
        );

        expect(result.data.total_attempts).toBe(10000);
      });
    });
  });
});
