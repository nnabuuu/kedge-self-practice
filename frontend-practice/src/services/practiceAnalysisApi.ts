import { API_BASE_URL } from '../config/api';

export interface WeakKnowledgePoint {
  knowledge_point_id: string;
  error_rate: number;
  total_questions: number;
  correct_answers: number;
}

export interface WeakKnowledgePointsResponse {
  weak_points: WeakKnowledgePoint[];
  sessions_analyzed: number;
  message?: string;
}

export interface WrongQuestionsResponse {
  wrong_question_ids: string[];
  total_count: number;
  sessions_analyzed: number;
  message?: string;
}

export interface QuickPracticeSuggestionResponse {
  knowledge_point_ids: string[];
  session_id?: string;
  session_date?: string;
  message?: string;
}

export interface KnowledgePointStat {
  knowledge_point_id: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  accuracy: number;
  last_practiced?: string;
  mastery_level: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

export interface KnowledgeStatsResponse {
  statistics: KnowledgePointStat[];
  sessions_analyzed: number;
  message?: string;
}

class PracticeAnalysisApi {
  private baseUrl = API_BASE_URL;

  async getWeakKnowledgePoints(userId?: string, limit = 20): Promise<WeakKnowledgePointsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/practice/analysis/weak-knowledge-points?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weak knowledge points: ${response.statusText}`);
    }

    return response.json();
  }

  async getWrongQuestions(userId?: string, limit = 5): Promise<WrongQuestionsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/practice/analysis/wrong-questions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wrong questions: ${response.statusText}`);
    }

    return response.json();
  }

  async getQuickPracticeSuggestion(userId?: string): Promise<QuickPracticeSuggestionResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);

    const response = await fetch(`${this.baseUrl}/practice/analysis/quick-practice-suggestion?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quick practice suggestion: ${response.statusText}`);
    }

    return response.json();
  }

  async getKnowledgePointStats(
    userId?: string, 
    subjectId?: string, 
    limit = 20
  ): Promise<KnowledgeStatsResponse> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (subjectId) params.append('subjectId', subjectId);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/practice/analysis/knowledge-stats?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch knowledge point stats: ${response.statusText}`);
    }

    return response.json();
  }
}

export const practiceAnalysisApi = new PracticeAnalysisApi();