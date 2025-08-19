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
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}:${JSON.stringify(args)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getWeakKnowledgePoints(userId?: string, limit = 20): Promise<WeakKnowledgePointsResponse> {
    const cacheKey = this.getCacheKey('weakKnowledgePoints', userId, limit);
    const cached = this.getFromCache<WeakKnowledgePointsResponse>(cacheKey);
    if (cached) return cached;

    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/practice/analysis/weak-knowledge-points?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch weak knowledge points: ${response.statusText}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }

  async getWrongQuestions(userId?: string, limit = 5): Promise<WrongQuestionsResponse> {
    const cacheKey = this.getCacheKey('wrongQuestions', userId, limit);
    const cached = this.getFromCache<WrongQuestionsResponse>(cacheKey);
    if (cached) return cached;

    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/practice/analysis/wrong-questions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch wrong questions: ${response.statusText}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }

  async getQuickPracticeSuggestion(userId?: string): Promise<QuickPracticeSuggestionResponse> {
    const cacheKey = this.getCacheKey('quickPracticeSuggestion', userId);
    const cached = this.getFromCache<QuickPracticeSuggestionResponse>(cacheKey);
    if (cached) return cached;

    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/practice/analysis/quick-practice-suggestion`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch quick practice suggestion: ${response.statusText}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }

  async getKnowledgePointStats(
    userId?: string, 
    subjectId?: string, 
    limit = 20
  ): Promise<KnowledgeStatsResponse> {
    const cacheKey = this.getCacheKey('knowledgePointStats', userId, subjectId, limit);
    const cached = this.getFromCache<KnowledgeStatsResponse>(cacheKey);
    if (cached) return cached;

    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/practice/analysis/knowledge-stats?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch knowledge point stats: ${response.statusText}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }

  // Clear cache method for logout or data refresh
  clearCache(): void {
    this.cache.clear();
  }
}

export const practiceAnalysisApi = new PracticeAnalysisApi();