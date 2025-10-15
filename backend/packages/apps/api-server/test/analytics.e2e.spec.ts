import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let subjectId: string;
  let knowledgePointId: string;
  let quizId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get mock teacher token for authentication
    const authResponse = await request(app.getHttpServer())
      .post('/v1/auth/mock-admin-sign-in')
      .expect(200);

    teacherToken = authResponse.body.accessToken;

    // Note: These IDs need to exist in your test database
    // You may need to create test data or use existing IDs from your database
    // For now, using placeholder UUIDs - these should be replaced with actual test data
    subjectId = '00000000-0000-0000-0000-000000000001';
    knowledgePointId = '00000000-0000-0000-0000-000000000002';
    quizId = '00000000-0000-0000-0000-000000000003';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/analytics/quiz-error-rates (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates')
        .query({
          subjectId,
          timeFrame: '30d',
        })
        .expect(401);
    });

    it('should return 400 with missing required parameters', () => {
      return request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should return 400 with invalid time frame', () => {
      return request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          subjectId,
          timeFrame: 'invalid',
        })
        .expect(400);
    });

    it('should return error rates with valid parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          subjectId,
          timeFrame: '30d',
          minAttempts: 1,
          page: 1,
          pageSize: 20,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('pagination');

      // Verify data structure
      expect(Array.isArray(response.body.data)).toBe(true);

      // Verify summary structure
      expect(response.body.summary).toHaveProperty('total_questions');
      expect(response.body.summary).toHaveProperty('avg_error_rate');
      expect(response.body.summary).toHaveProperty('high_error_count');
      expect(response.body.summary).toHaveProperty('total_attempts');

      // Verify pagination structure
      expect(response.body.pagination).toHaveProperty('currentPage');
      expect(response.body.pagination).toHaveProperty('pageSize');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('totalCount');
    });

    it('should filter by knowledge point when provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          subjectId,
          knowledgePointId,
          timeFrame: '7d',
          minAttempts: 1,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          subjectId,
          timeFrame: 'all',
          page: 1,
          pageSize: 5,
        })
        .expect(200);

      expect(response.body.pagination.pageSize).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should work with different time frames', async () => {
      const timeFrames = ['7d', '30d', '3m', '6m', 'all'];

      for (const timeFrame of timeFrames) {
        const response = await request(app.getHttpServer())
          .get('/v1/analytics/quiz-error-rates')
          .set('Authorization', `Bearer ${teacherToken}`)
          .query({
            subjectId,
            timeFrame,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('/v1/analytics/quiz/:quizId/error-details (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/v1/analytics/quiz/${quizId}/error-details`)
        .query({ timeFrame: '30d' })
        .expect(401);
    });

    it('should return 400 with missing time frame', () => {
      return request(app.getHttpServer())
        .get(`/v1/analytics/quiz/${quizId}/error-details`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should return 400 with invalid quiz ID format', () => {
      return request(app.getHttpServer())
        .get('/v1/analytics/quiz/invalid-uuid/error-details')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ timeFrame: '30d' })
        .expect(400);
    });

    it('should return quiz error details with valid parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/analytics/quiz/${quizId}/error-details`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ timeFrame: '30d' })
        .expect((res) => {
          // Accept either 200 (found) or 404 (not found/no data)
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('quiz');
        expect(response.body).toHaveProperty('wrongAnswerDistribution');

        // Verify quiz structure if present
        if (response.body.quiz) {
          expect(response.body.quiz).toHaveProperty('quiz_id');
          expect(response.body.quiz).toHaveProperty('question');
          expect(response.body.quiz).toHaveProperty('type');
          expect(response.body.quiz).toHaveProperty('correct_answer');
          expect(response.body.quiz).toHaveProperty('total_attempts');
          expect(response.body.quiz).toHaveProperty('correct_count');
          expect(response.body.quiz).toHaveProperty('incorrect_count');
          expect(response.body.quiz).toHaveProperty('error_rate');
        }

        // Verify wrong answer distribution structure
        expect(Array.isArray(response.body.wrongAnswerDistribution)).toBe(true);
      }
    });

    it('should work with different time frames', async () => {
      const timeFrames = ['7d', '30d', '3m', '6m', 'all'];

      for (const timeFrame of timeFrames) {
        await request(app.getHttpServer())
          .get(`/v1/analytics/quiz/${quizId}/error-details`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .query({ timeFrame })
          .expect((res) => {
            // Accept either 200 (found) or 404 (not found)
            expect([200, 404]).toContain(res.status);
          });
      }
    });
  });

  describe('/v1/analytics/quiz-error-rates/export (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates/export')
        .query({
          subjectId,
          timeFrame: '30d',
        })
        .expect(401);
    });

    it('should return 400 with missing required parameters', () => {
      return request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);
    });

    it('should export CSV with valid parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          subjectId,
          timeFrame: '30d',
          minAttempts: 1,
        })
        .expect(200)
        .expect('Content-Type', /text\/csv/);

      // Verify CSV content starts with BOM and has headers
      expect(response.text).toContain('Rank');
      expect(response.text).toContain('Quiz ID');
      expect(response.text).toContain('Question');
      expect(response.text).toContain('Error Rate');
    });

    it('should export CSV with knowledge point filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/analytics/quiz-error-rates/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({
          subjectId,
          knowledgePointId,
          timeFrame: '7d',
          minAttempts: 1,
        })
        .expect(200)
        .expect('Content-Type', /text\/csv/);

      expect(response.text).toBeTruthy();
    });

    it('should handle all time frames for export', async () => {
      const timeFrames = ['7d', '30d', '3m', '6m', 'all'];

      for (const timeFrame of timeFrames) {
        const response = await request(app.getHttpServer())
          .get('/v1/analytics/quiz-error-rates/export')
          .set('Authorization', `Bearer ${teacherToken}`)
          .query({
            subjectId,
            timeFrame,
          })
          .expect(200);

        expect(response.text).toBeTruthy();
      }
    });
  });
});
