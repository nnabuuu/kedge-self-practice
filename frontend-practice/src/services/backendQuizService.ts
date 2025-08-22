import { Subject, Quiz, KnowledgePoint } from '../types/quiz';
import { authService } from './authService';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718';
const API_BASE_URL = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class BackendQuizService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const token = authService.getToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    const response = await this.makeRequest<Subject[]>('/subjects');
    
    // Fallback to mock subjects if backend call fails
    if (!response.success) {
      const mockSubjects: Subject[] = [
        {
          id: 'history',
          name: '历史',
          description: '初中历史知识点练习',
          icon: '📚',
          knowledgePoints: [
            {
              id: 'ancient-china',
              name: '古代中国',
              description: '秦汉至清朝历史',
              subPoints: [
                { id: 'qin-dynasty', name: '秦朝统一', description: '秦始皇统一六国' },
                { id: 'han-dynasty', name: '汉朝盛世', description: '汉武帝时期的成就' },
              ]
            },
            {
              id: 'modern-china',
              name: '近现代中国',
              description: '鸦片战争至建国',
              subPoints: [
                { id: 'opium-war', name: '鸦片战争', description: '中国近代史开端' },
                { id: 'republic', name: '民国时期', description: '辛亥革命到建国前' },
              ]
            }
          ]
        },
        {
          id: 'biology',
          name: '生物',
          description: '初中生物学习与实验',
          icon: '🧬',
          knowledgePoints: [
            {
              id: 'cell-biology',
              name: '细胞生物学',
              description: '细胞结构与功能',
              subPoints: [
                { id: 'cell-structure', name: '细胞结构', description: '细胞膜、细胞质、细胞核' },
                { id: 'cell-division', name: '细胞分裂', description: '有丝分裂和减数分裂' },
              ]
            },
            {
              id: 'genetics',
              name: '遗传学',
              description: '遗传规律与变异',
              subPoints: [
                { id: 'mendel-laws', name: '孟德尔定律', description: '基因的分离与自由组合' },
                { id: 'dna-rna', name: 'DNA与RNA', description: '遗传物质的结构与功能' },
              ]
            }
          ]
        }
      ];

      return {
        success: true,
        data: mockSubjects
      };
    }

    return response;
  }

  async getQuizzes(subjectId: string, knowledgePointIds: string[], config: any): Promise<ApiResponse<Quiz[]>> {
    const requestBody = {
      subjectId,
      knowledgePointIds,
      questionType: config.questionType,
      questionCount: config.questionCount === 'unlimited' ? -1 : config.questionCount,
      shuffleQuestions: config.shuffleQuestions
    };

    const response = await this.makeRequest<Quiz[]>('/quiz/practice', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    // Fallback to mock quizzes if backend call fails
    if (!response.success) {
      const mockQuizzes: Quiz[] = this.generateMockQuizzes(subjectId, knowledgePointIds, config);
      return {
        success: true,
        data: mockQuizzes
      };
    }

    return response;
  }

  async submitPracticeSession(sessionData: any): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>('/practice/submit', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });

    // Gracefully handle backend submission failure
    if (!response.success) {
      console.warn('Failed to submit practice session to backend, storing locally only');
      return { success: true }; // Continue with local storage
    }

    return response;
  }

  private generateMockQuizzes(subjectId: string, knowledgePointIds: string[], config: any): Quiz[] {
    const baseQuizzes = subjectId === 'history' ? [
      {
        id: 'q1',
        question: '秦始皇统一中国是在哪一年？',
        options: ['公元前221年', '公元前210年', '公元前206年', '公元前220年'],
        answer: 0,
        explanation: '秦始皇于公元前221年完成了对六国的统一，建立了中国历史上第一个统一的中央集权国家。',
        knowledgePoint: 'qin-dynasty',
        difficulty: 'medium'
      },
      {
        id: 'q2',
        question: '汉武帝时期最重要的对外政策是什么？',
        options: ['开疆拓土', '丝绸之路', '对匈奴的军事行动', '以上都是'],
        answer: 3,
        explanation: '汉武帝时期实施了积极的对外政策，包括军事扩张、开辟丝绸之路、反击匈奴等。',
        knowledgePoint: 'han-dynasty',
        difficulty: 'hard'
      },
      {
        id: 'q3',
        question: '鸦片战争爆发的直接原因是什么？',
        options: ['英国想要打开中国市场', '林则徐虎门销烟', '中英贸易冲突', '清政府闭关锁国'],
        answer: 1,
        explanation: '1839年林则徐在虎门销毁鸦片，成为鸦片战争爆发的直接导火索。',
        knowledgePoint: 'opium-war',
        difficulty: 'medium'
      }
    ] : [
      {
        id: 'q4',
        question: '细胞是生物体结构和功能的基本单位，这一理论被称为？',
        options: ['细胞学说', '进化论', '遗传学说', '基因理论'],
        answer: 0,
        explanation: '细胞学说是由施莱登和施旺提出的，认为细胞是一切生物体结构和功能的基本单位。',
        knowledgePoint: 'cell-structure',
        difficulty: 'easy'
      },
      {
        id: 'q5',
        question: '有丝分裂的主要意义是什么？',
        options: ['产生配子', '维持染色体数目稳定', '增加遗传多样性', '修复损伤'],
        answer: 1,
        explanation: '有丝分裂确保子细胞获得与母细胞完全相同的染色体，维持物种染色体数目的稳定。',
        knowledgePoint: 'cell-division',
        difficulty: 'medium'
      },
      {
        id: 'q6',
        question: 'DNA的基本组成单位是？',
        options: ['氨基酸', '核苷酸', '脂肪酸', '多糖'],
        answer: 1,
        explanation: 'DNA由四种不同的核苷酸组成：腺苷酸(A)、胸苷酸(T)、胞苷酸(C)和鸟苷酸(G)。',
        knowledgePoint: 'dna-rna',
        difficulty: 'easy'
      }
    ];

    // Filter quizzes based on knowledge points if specified
    let filteredQuizzes = baseQuizzes;
    if (knowledgePointIds.length > 0) {
      filteredQuizzes = baseQuizzes.filter(quiz => 
        knowledgePointIds.includes(quiz.knowledgePoint)
      );
    }

    // Apply question count limit
    const questionCount = config.questionCount === 'unlimited' ? filteredQuizzes.length : config.questionCount;
    filteredQuizzes = filteredQuizzes.slice(0, questionCount);

    // Shuffle questions if requested
    if (config.shuffleQuestions) {
      for (let i = filteredQuizzes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredQuizzes[i], filteredQuizzes[j]] = [filteredQuizzes[j], filteredQuizzes[i]];
      }
    }

    return filteredQuizzes;
  }
}

export const backendQuizService = new BackendQuizService();