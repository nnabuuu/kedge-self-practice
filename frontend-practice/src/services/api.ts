// API Service - Real backend connection only (no mock data)
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { backendApi, api as backendApiMethods } from './backendApi';

// API response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Create standard API response
const createApiResponse = <T>(data: T, success: boolean = true, message?: string, error?: string): ApiResponse<T> => ({
  success,
  data,
  message,
  error,
  timestamp: new Date().toISOString()
});

// API Service class - all methods use real backend
export class ApiService {
  // Get all subjects
  static async getSubjects(): Promise<ApiResponse<Subject[]>> {
    try {
      const response = await backendApiMethods.subjects.getAll();
      if (response.success) {
        return createApiResponse(response.data || [], true);
      }
      return createApiResponse([], false, undefined, response.error || 'Failed to fetch subjects');
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      return createApiResponse([], false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Get knowledge points by subject
  static async getKnowledgePointsBySubject(subjectId: string): Promise<ApiResponse<KnowledgePoint[]>> {
    try {
      const response = await backendApiMethods.knowledgePoints.getBySubject(subjectId);
      if (response.success) {
        return createApiResponse(response.data || [], true);
      }
      return createApiResponse([], false, undefined, response.error || 'Failed to fetch knowledge points');
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
      return createApiResponse([], false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Get questions by knowledge points
  static async getQuestionsByKnowledgePoints(knowledgePointIds: string[]): Promise<ApiResponse<QuizQuestion[]>> {
    try {
      const response = await backendApiMethods.questions.getByKnowledgePoints(knowledgePointIds);
      if (response.success) {
        return createApiResponse(response.data || [], true);
      }
      return createApiResponse([], false, undefined, response.error || 'Failed to fetch questions');
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      return createApiResponse([], false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Get knowledge point by ID
  static async getKnowledgePointById(id: string): Promise<ApiResponse<KnowledgePoint | null>> {
    try {
      // Backend doesn't have this endpoint yet, fetch all and filter
      const response = await backendApiMethods.knowledgePoints.getAll();
      if (response.success && response.data) {
        const knowledgePoint = response.data.find((kp: KnowledgePoint) => kp.id === id);
        return createApiResponse(knowledgePoint || null, true);
      }
      return createApiResponse(null, false, undefined, response.error || 'Failed to fetch knowledge point');
    } catch (error) {
      console.error('Failed to fetch knowledge point:', error);
      return createApiResponse(null, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Get question by ID
  static async getQuestionById(id: string): Promise<ApiResponse<QuizQuestion | null>> {
    try {
      const response = await backendApiMethods.questions.getById(id);
      if (response.success) {
        return createApiResponse(response.data || null, true);
      }
      return createApiResponse(null, false, undefined, response.error || 'Failed to fetch question');
    } catch (error) {
      console.error('Failed to fetch question:', error);
      return createApiResponse(null, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Create knowledge point
  static async createKnowledgePoint(knowledgePoint: Omit<KnowledgePoint, 'id'>): Promise<ApiResponse<KnowledgePoint>> {
    try {
      const response = await backendApiMethods.knowledgePoints.create(knowledgePoint);
      if (response.success && response.data) {
        return createApiResponse(response.data, true, 'Knowledge point created successfully');
      }
      return createApiResponse({} as KnowledgePoint, false, undefined, response.error || 'Failed to create knowledge point');
    } catch (error) {
      console.error('Failed to create knowledge point:', error);
      return createApiResponse({} as KnowledgePoint, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Create question
  static async createQuestion(question: Omit<QuizQuestion, 'id'>): Promise<ApiResponse<QuizQuestion>> {
    try {
      const response = await backendApiMethods.questions.create(question);
      if (response.success && response.data) {
        return createApiResponse(response.data, true, 'Question created successfully');
      }
      return createApiResponse({} as QuizQuestion, false, undefined, response.error || 'Failed to create question');
    } catch (error) {
      console.error('Failed to create question:', error);
      return createApiResponse({} as QuizQuestion, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Update knowledge point
  static async updateKnowledgePoint(id: string, updates: Partial<KnowledgePoint>): Promise<ApiResponse<KnowledgePoint | null>> {
    try {
      const response = await backendApiMethods.knowledgePoints.update(id, updates);
      if (response.success) {
        return createApiResponse(response.data || null, true, 'Knowledge point updated successfully');
      }
      return createApiResponse(null, false, undefined, response.error || 'Failed to update knowledge point');
    } catch (error) {
      console.error('Failed to update knowledge point:', error);
      return createApiResponse(null, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Update question
  static async updateQuestion(id: string, updates: Partial<QuizQuestion>): Promise<ApiResponse<QuizQuestion | null>> {
    try {
      const response = await backendApiMethods.questions.update(id, updates);
      if (response.success) {
        return createApiResponse(response.data || null, true, 'Question updated successfully');
      }
      return createApiResponse(null, false, undefined, response.error || 'Failed to update question');
    } catch (error) {
      console.error('Failed to update question:', error);
      return createApiResponse(null, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Delete knowledge point
  static async deleteKnowledgePoint(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await backendApiMethods.knowledgePoints.delete(id);
      if (response.success) {
        return createApiResponse(true, true, 'Knowledge point deleted successfully');
      }
      return createApiResponse(false, false, undefined, response.error || 'Failed to delete knowledge point');
    } catch (error) {
      console.error('Failed to delete knowledge point:', error);
      return createApiResponse(false, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Delete question
  static async deleteQuestion(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await backendApiMethods.questions.delete(id);
      if (response.success) {
        return createApiResponse(true, true, 'Question deleted successfully');
      }
      return createApiResponse(false, false, undefined, response.error || 'Failed to delete question');
    } catch (error) {
      console.error('Failed to delete question:', error);
      return createApiResponse(false, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Search questions
  static async searchQuestions(query: string, subjectId?: string): Promise<ApiResponse<QuizQuestion[]>> {
    try {
      const response = await backendApiMethods.questions.search(query, subjectId);
      if (response.success) {
        return createApiResponse(response.data || [], true);
      }
      return createApiResponse([], false, undefined, response.error || 'Failed to search questions');
    } catch (error) {
      console.error('Failed to search questions:', error);
      return createApiResponse([], false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Get statistics
  static async getStatistics(subjectId?: string): Promise<ApiResponse<any>> {
    try {
      // Backend doesn't have this endpoint, calculate from available data
      const kpResponse = subjectId 
        ? await backendApiMethods.knowledgePoints.getBySubject(subjectId)
        : await backendApiMethods.knowledgePoints.getAll();
      
      if (!kpResponse.success) {
        return createApiResponse(null, false, undefined, kpResponse.error || 'Failed to fetch statistics');
      }

      const knowledgePoints = kpResponse.data || [];
      const stats = {
        totalKnowledgePoints: knowledgePoints.length,
        totalQuestions: 0, // Would need to fetch all questions to count
        questionsByType: {
          'single-choice': 0,
          'multiple-choice': 0,
          'essay': 0
        },
        lastUpdated: new Date().toISOString()
      };
      
      return createApiResponse(stats, true);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      return createApiResponse(null, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Batch get questions - now using backend endpoint
  static async getBatchQuestions(questionIds: string[]): Promise<ApiResponse<QuizQuestion[]>> {
    try {
      if (questionIds.length === 0) {
        return createApiResponse([], true);
      }
      
      // Use the new backend endpoint for batch fetching
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/quiz/by-ids?ids=${questionIds.join(',')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return createApiResponse(result.data, true);
      }
      
      return createApiResponse([], false, undefined, 'Failed to fetch questions');
    } catch (error) {
      console.error('Failed to batch fetch questions:', error);
      return createApiResponse([], false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Create wrong questions practice session
  static async createWrongQuestionsSession(userId?: string, sessionLimit = 5): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('sessionLimit', sessionLimit.toString());
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/practice/sessions/create-wrong-questions?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.session && result.quizzes) {
        return createApiResponse(result, true);
      }
      
      return createApiResponse(null, false, undefined, result.message || 'Failed to create wrong questions session');
    } catch (error) {
      console.error('Failed to create wrong questions session:', error);
      return createApiResponse(null, false, undefined, error instanceof Error ? error.message : 'Network error');
    }
  }

  // AI analysis (not implemented in backend yet)
  static async analyzeQuestionWithAI(question: string): Promise<ApiResponse<any>> {
    return createApiResponse(null, false, undefined, 'AI analysis not available in backend yet');
  }
}

// Export convenience API functions
export const api = {
  subjects: {
    getAll: () => ApiService.getSubjects()
  },
  knowledgePoints: {
    getBySubject: (subjectId: string) => ApiService.getKnowledgePointsBySubject(subjectId),
    getById: (id: string) => ApiService.getKnowledgePointById(id),
    create: (kp: Omit<KnowledgePoint, 'id'>) => ApiService.createKnowledgePoint(kp),
    update: (id: string, updates: Partial<KnowledgePoint>) => ApiService.updateKnowledgePoint(id, updates),
    delete: (id: string) => ApiService.deleteKnowledgePoint(id)
  },
  questions: {
    getByKnowledgePoints: (kpIds: string[]) => ApiService.getQuestionsByKnowledgePoints(kpIds),
    getById: (id: string) => ApiService.getQuestionById(id),
    getBatch: (ids: string[]) => ApiService.getBatchQuestions(ids),
    create: (question: Omit<QuizQuestion, 'id'>) => ApiService.createQuestion(question),
    update: (id: string, updates: Partial<QuizQuestion>) => ApiService.updateQuestion(id, updates),
    delete: (id: string) => ApiService.deleteQuestion(id),
    search: (query: string, subjectId?: string) => ApiService.searchQuestions(query, subjectId)
  },
  practice: {
    createSession: backendApiMethods.practice.createSession,
    startSession: backendApiMethods.practice.startSession,
    getSession: backendApiMethods.practice.getSession,
    submitAnswer: backendApiMethods.practice.submitAnswer,
    completeSession: backendApiMethods.practice.completeSession,
    createWrongQuestionsSession: (userId?: string, sessionLimit?: number) => ApiService.createWrongQuestionsSession(userId, sessionLimit)
  },
  ai: {
    analyzeQuestion: (question: string) => ApiService.analyzeQuestionWithAI(question)
  },
  stats: {
    get: (subjectId?: string) => ApiService.getStatistics(subjectId)
  }
};

// Default export
export default ApiService;