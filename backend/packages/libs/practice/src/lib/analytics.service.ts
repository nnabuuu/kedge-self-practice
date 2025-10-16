import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AnalyticsRepository, QuizErrorRate, QuizErrorDetails, ErrorRateSummary, WrongAnswerDistribution } from './analytics.repository';

type TimeFrame = '7d' | '30d' | '3m' | '6m' | 'all';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  /**
   * Convert time frame string to Date objects
   */
  private getTimeRange(timeFrame: TimeFrame): { start?: Date; end?: Date } {
    const now = new Date();
    const end = now;
    let start: Date | undefined;

    switch (timeFrame) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        start = undefined;
        break;
    }

    return { start, end };
  }

  /**
   * Get quiz error rates with filtering and pagination
   */
  async getQuizErrorRates(params: {
    subjectId: string;
    knowledgePointId?: string;
    volume?: string;
    unit?: string;
    timeFrame: TimeFrame;
    minAttempts: number;
    page: number;
    pageSize: number;
  }): Promise<{
    data: QuizErrorRate[];
    summary: ErrorRateSummary;
    pagination: {
      currentPage: number;
      pageSize: number;
      totalPages: number;
      totalCount: number;
    };
  }> {
    const { subjectId, knowledgePointId, volume, unit, timeFrame, minAttempts, page, pageSize } = params;

    this.logger.log(
      `Getting error rates for subject ${subjectId}, volume: ${volume || 'all'}, unit: ${unit || 'all'}, timeFrame: ${timeFrame}, page: ${page}`
    );

    const { start, end } = this.getTimeRange(timeFrame);
    const offset = (page - 1) * pageSize;

    // Get paginated data
    const {data, total} = await this.analyticsRepository.getQuizErrorRates({
      subjectId,
      knowledgePointId,
      volume,
      unit,
      timeFrameStart: start,
      timeFrameEnd: end,
      minAttempts,
      limit: pageSize,
      offset,
    });

    // Get summary statistics
    const summary = await this.analyticsRepository.getErrorRateSummary({
      subjectId,
      knowledgePointId,
      volume,
      unit,
      timeFrameStart: start,
      timeFrameEnd: end,
      minAttempts,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      summary,
      pagination: {
        currentPage: page,
        pageSize,
        totalPages,
        totalCount: total,
      },
    };
  }

  /**
   * Get detailed error analysis for a specific quiz
   */
  async getQuizErrorDetails(params: {
    quizId: string;
    timeFrame: TimeFrame;
  }): Promise<{
    quiz: QuizErrorDetails;
    wrongAnswerDistribution: WrongAnswerDistribution[];
  }> {
    const { quizId, timeFrame } = params;

    this.logger.log(`Getting error details for quiz ${quizId}, timeFrame: ${timeFrame}`);

    const { start, end } = this.getTimeRange(timeFrame);

    // Get quiz details
    const quiz = await this.analyticsRepository.getQuizErrorDetails({
      quizId,
      timeFrameStart: start,
      timeFrameEnd: end,
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found or has no attempt data`);
    }

    // Get wrong answer distribution
    const wrongAnswerDistribution = await this.analyticsRepository.getWrongAnswerDistribution({
      quizId,
      timeFrameStart: start,
      timeFrameEnd: end,
    });

    return {
      quiz,
      wrongAnswerDistribution,
    };
  }

  /**
   * Export error rates to CSV format
   */
  async exportErrorRatesToCSV(params: {
    subjectId: string;
    knowledgePointId?: string;
    volume?: string;
    unit?: string;
    timeFrame: TimeFrame;
    minAttempts: number;
  }): Promise<string> {
    const { subjectId, knowledgePointId, volume, unit, timeFrame, minAttempts } = params;

    this.logger.log(`Exporting error rates for subject ${subjectId} to CSV`);

    const { start, end } = this.getTimeRange(timeFrame);

    // Get all data (no pagination limit)
    const { data } = await this.analyticsRepository.getQuizErrorRates({
      subjectId,
      knowledgePointId,
      volume,
      unit,
      timeFrameStart: start,
      timeFrameEnd: end,
      minAttempts,
      limit: 10000, // Large limit for export
      offset: 0,
    });

    // Build CSV with Simplified Chinese headers
    const headers = [
      '排名',
      '题目ID',
      '题目内容',
      '题型',
      '知识点',
      '错误率',
      '总答题次数',
      '错误次数',
      '正确次数',
      '选项',
      '正确答案',
      '错误答案分布',
    ];

    const rows = data.map((row, index) => {
      // Format options for single-choice questions
      let optionsStr = '';
      let correctAnswerStr = '';
      if (row.quiz_type === 'single-choice' && row.options) {
        try {
          const options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
          if (Array.isArray(options)) {
            optionsStr = options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join(' | ');
          }

          // Get correct answer from answer_index (much simpler!)
          if (row.answer_index && Array.isArray(row.answer_index) && row.answer_index.length > 0) {
            const answerIndex = row.answer_index[0];
            correctAnswerStr = String.fromCharCode(65 + answerIndex);
          }
        } catch (e) {
          optionsStr = '';
          correctAnswerStr = '';
        }
      }

      // Format wrong answer distribution
      let wrongAnswersStr = '';
      if (row.wrong_answer_distribution) {
        try {
          const dist = typeof row.wrong_answer_distribution === 'string'
            ? JSON.parse(row.wrong_answer_distribution)
            : row.wrong_answer_distribution;
          if (Array.isArray(dist)) {
            wrongAnswersStr = dist.map(item => {
              // Convert numeric answer to letter for single-choice
              let answerDisplay = item.answer;
              if (row.quiz_type === 'single-choice') {
                const numAnswer = parseInt(item.answer);
                if (!isNaN(numAnswer)) {
                  answerDisplay = String.fromCharCode(65 + numAnswer);
                }
              }
              return `${answerDisplay}: ${item.count}次 (${item.percentage}%)`;
            }).join(' | ');
          }
        } catch (e) {
          wrongAnswersStr = '';
        }
      }

      return [
        (index + 1).toString(),
        row.quiz_id,
        `"${row.quiz_text.replace(/"/g, '""')}"`, // Escape quotes
        row.quiz_type,
        row.knowledge_point_name || '无',
        `${row.error_rate}%`,
        row.total_attempts.toString(),
        row.incorrect_attempts.toString(),
        (row.total_attempts - row.incorrect_attempts).toString(),
        `"${optionsStr.replace(/"/g, '""')}"`, // Escape quotes
        correctAnswerStr,
        `"${wrongAnswersStr.replace(/"/g, '""')}"`, // Escape quotes
      ];
    });

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return csv;
  }
}
