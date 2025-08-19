// Backend API Service - Real backend connection
import { Subject, KnowledgePoint, QuizQuestion, PracticeSession } from '../types/quiz';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';

// API Response interfaces
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface BackendQuiz {
  id: number;
  knowledge_point_id: number;
  question_text: string;
  answer_options?: any;
  correct_answer?: string;
  answer_explanation?: string;
  quiz_type?: string;
  created_at?: string;
  updated_at?: string;
  attachments?: string[];
}

interface BackendKnowledgePoint {
  id: string; // Backend uses string IDs like "kp_1"
  topic?: string;
  volume?: string;
  unit?: string;
  lesson?: string;
  sub?: string; // Backend uses 'sub' instead of 'section'
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
}

class BackendApiService {
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

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Helper function to normalize knowledge point ID
  private normalizeKnowledgePointId(id: string | number): string {
    // If it's already in the format "kp_XXX", return as is
    if (typeof id === 'string' && id.startsWith('kp_')) {
      return id;
    }
    // Otherwise, add the prefix
    return `kp_${id}`;
  }

  // Helper function to extract numeric ID from knowledge point ID
  private extractNumericKnowledgePointId(id: string): number {
    // If it has the "kp_" prefix, remove it
    if (id.startsWith('kp_')) {
      return parseInt(id.substring(3));
    }
    // Otherwise, try to parse directly
    return parseInt(id);
  }

  // Convert backend quiz to frontend format
  private convertQuiz(backendQuiz: BackendQuiz): QuizQuestion {
    let type: QuizQuestion['type'] = 'single-choice';
    let options: QuizQuestion['options'] | undefined;
    let answer: string | string[] | undefined;
    
    // Determine quiz type
    if (backendQuiz.quiz_type === 'multiple-choice' || backendQuiz.quiz_type === '多选题') {
      type = 'multiple-choice';
    } else if (backendQuiz.quiz_type === 'essay' || backendQuiz.quiz_type === '问答题') {
      type = 'essay';
    } else {
      type = 'single-choice';
    }

    // Parse answer options if available
    if (backendQuiz.answer_options) {
      if (typeof backendQuiz.answer_options === 'string') {
        try {
          const parsed = JSON.parse(backendQuiz.answer_options);
          if (parsed && typeof parsed === 'object') {
            options = parsed;
          }
        } catch {
          // If JSON parsing fails, treat as plain text options
          console.warn('Failed to parse answer_options:', backendQuiz.answer_options);
        }
      } else if (typeof backendQuiz.answer_options === 'object') {
        options = backendQuiz.answer_options;
      }
    }

    // Parse correct answer
    if (backendQuiz.correct_answer) {
      if (type === 'multiple-choice') {
        // Try to parse as JSON array for multiple choice
        try {
          answer = JSON.parse(backendQuiz.correct_answer);
        } catch {
          // If not JSON, split by comma or treat as single answer
          answer = backendQuiz.correct_answer.includes(',') 
            ? backendQuiz.correct_answer.split(',').map(a => a.trim())
            : [backendQuiz.correct_answer];
        }
      } else {
        answer = backendQuiz.correct_answer;
      }
    }

    return {
      id: String(backendQuiz.id),
      type,
      question: backendQuiz.question_text,
      options,
      answer,
      standardAnswer: type === 'essay' ? backendQuiz.correct_answer : undefined,
      relatedKnowledgePointId: this.normalizeKnowledgePointId(backendQuiz.knowledge_point_id),
    };
  }

  // Convert backend knowledge point to frontend format
  private convertKnowledgePoint(backendKP: BackendKnowledgePoint): KnowledgePoint {
    return {
      id: backendKP.id,
      subjectId: 'history', // All current KPs are history
      volume: backendKP.volume || '',
      unit: backendKP.unit || '',
      lesson: backendKP.lesson || '',
      section: backendKP.sub || '', // Backend uses 'sub' field
      topic: backendKP.topic || '',
    };
  }

  // Get all subjects (currently hardcoded as backend doesn't have subjects endpoint)
  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    // For now, return hardcoded subjects as backend doesn't have a subjects endpoint
    const subjects: Subject[] = [
      {
        id: 'history',
        name: '历史',
        icon: 'Scroll',
        color: 'bg-amber-500'
      },
      {
        id: 'biology',
        name: '生物',
        icon: 'Dna',
        color: 'bg-green-500'
      }
    ];
    
    return {
      success: true,
      data: subjects
    };
  }

  // Get knowledge points by subject
  async getKnowledgePointsBySubject(subjectId: string): Promise<ApiResponse<KnowledgePoint[]>> {
    console.log('🔍 [DEBUG] Getting knowledge points for subject:', subjectId);
    
    // Backend doesn't have subject filtering yet, so get all and filter client-side
    const response = await this.getAllKnowledgePoints();
    
    if (response.success && response.data) {
      // Filter by subject - for now, all knowledge points are history
      // In the future, this could be enhanced with proper subject classification
      const filteredKPs = response.data.filter(kp => 
        subjectId === 'history' || !subjectId // For now, all KPs are history
      );
      console.log(`📚 [DEBUG] Found ${filteredKPs.length} knowledge points for ${subjectId}:`, filteredKPs.map(kp => `${kp.id}: ${kp.topic}`));
      return {
        success: true,
        data: filteredKPs
      };
    }

    return response as ApiResponse<KnowledgePoint[]>;
  }

  // Get all knowledge points
  async getAllKnowledgePoints(): Promise<ApiResponse<KnowledgePoint[]>> {
    const response = await this.makeRequest<{knowledgePoints: BackendKnowledgePoint[], total: number}>('/knowledge-points/all');

    if (response.success && response.data && response.data.knowledgePoints) {
      const knowledgePoints = response.data.knowledgePoints.map(kp => this.convertKnowledgePoint(kp));
      return {
        success: true,
        data: knowledgePoints
      };
    }

    return {
      success: false,
      error: 'Failed to fetch knowledge points'
    } as ApiResponse<KnowledgePoint[]>;
  }

  // Get quizzes by knowledge points - optimized to use single API call
  async getQuizzesByKnowledgePoints(knowledgePointIds: string[]): Promise<ApiResponse<QuizQuestion[]>> {
    console.log('🔍 [DEBUG] Requesting quizzes for knowledge points:', knowledgePointIds);
    
    // Backend expects string IDs like "kp_305"
    const validIds = knowledgePointIds.filter(id => id && id.trim() !== '');
    
    if (validIds.length === 0) {
      console.log('⚠️ [DEBUG] No valid knowledge point IDs provided');
      return {
        success: true,
        data: []
      };
    }

    // Use single API call with comma-separated knowledge point IDs
    const idsParam = validIds.join(',');
    console.log(`🌐 [DEBUG] Making optimized API request: /quiz?knowledge_point_id=${idsParam}`);
    
    const response = await this.makeRequest<{success: boolean, data: BackendQuiz[], count: number, total: number}>(
      `/quiz?knowledge_point_id=${idsParam}`
    );
    
    console.log(`📊 [DEBUG] API response:`, response);
    
    if (response.success && response.data && response.data.data) {
      const quizzes = response.data.data.map(quiz => this.convertQuiz(quiz));
      console.log(`✅ [DEBUG] Found ${quizzes.length} total quizzes for ${validIds.length} knowledge points`);
      return {
        success: true,
        data: quizzes
      };
    }

    console.log(`❌ [DEBUG] No quizzes found for knowledge points: ${validIds.join(', ')}`);
    return {
      success: true,
      data: []
    };
  }

  // Get quiz by ID
  async getQuizById(id: string): Promise<ApiResponse<QuizQuestion | null>> {
    const response = await this.makeRequest<BackendQuiz>(`/quiz/${id}`);

    if (response.success && response.data) {
      const quiz = this.convertQuiz(response.data);
      return {
        success: true,
        data: quiz
      };
    }

    return response as ApiResponse<QuizQuestion | null>;
  }

  // Create a new quiz
  async createQuiz(quiz: Omit<QuizQuestion, 'id'>): Promise<ApiResponse<QuizQuestion>> {
    const backendQuiz = {
      knowledge_point_id: this.extractNumericKnowledgePointId(quiz.relatedKnowledgePointId),
      question_text: quiz.question,
      answer_options: quiz.options ? JSON.stringify(quiz.options) : null,
      correct_answer: quiz.type === 'multiple-choice' 
        ? JSON.stringify(quiz.answer)
        : String(quiz.answer || quiz.standardAnswer || ''),
      quiz_type: quiz.type === 'multiple-choice' ? '多选题' : 
                 quiz.type === 'essay' ? '问答题' : '单选题',
    };

    const response = await this.makeRequest<BackendQuiz>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(backendQuiz)
    });

    if (response.success && response.data) {
      const createdQuiz = this.convertQuiz(response.data);
      return {
        success: true,
        data: createdQuiz,
        message: '题目创建成功'
      };
    }

    return response as ApiResponse<QuizQuestion>;
  }

  // Update a quiz
  async updateQuiz(id: string, updates: Partial<QuizQuestion>): Promise<ApiResponse<QuizQuestion | null>> {
    const backendUpdates: any = {};
    
    if (updates.question !== undefined) {
      backendUpdates.question_text = updates.question;
    }
    if (updates.options !== undefined) {
      backendUpdates.answer_options = JSON.stringify(updates.options);
    }
    if (updates.answer !== undefined) {
      backendUpdates.correct_answer = updates.type === 'multiple-choice'
        ? JSON.stringify(updates.answer)
        : String(updates.answer);
    }
    if (updates.type !== undefined) {
      backendUpdates.quiz_type = updates.type === 'multiple-choice' ? '多选题' :
                                 updates.type === 'essay' ? '问答题' : '单选题';
    }
    if (updates.relatedKnowledgePointId !== undefined) {
      backendUpdates.knowledge_point_id = this.extractNumericKnowledgePointId(updates.relatedKnowledgePointId);
    }

    const response = await this.makeRequest<BackendQuiz>(`/quiz/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates)
    });

    if (response.success && response.data) {
      const updatedQuiz = this.convertQuiz(response.data);
      return {
        success: true,
        data: updatedQuiz,
        message: '题目更新成功'
      };
    }

    return response as ApiResponse<QuizQuestion | null>;
  }

  // Delete a quiz
  async deleteQuiz(id: string): Promise<ApiResponse<boolean>> {
    const response = await this.makeRequest<void>(`/quiz/${id}`, {
      method: 'DELETE'
    });

    if (response.success) {
      return {
        success: true,
        data: true,
        message: '题目删除成功'
      };
    }

    return {
      success: false,
      data: false,
      error: response.error || '题目删除失败'
    };
  }

  // Create a knowledge point
  async createKnowledgePoint(knowledgePoint: Omit<KnowledgePoint, 'id'>): Promise<ApiResponse<KnowledgePoint>> {
    const backendKP = {
      subject_id: knowledgePoint.subjectId,
      volume: knowledgePoint.volume,
      unit: knowledgePoint.unit,
      lesson: knowledgePoint.lesson,
      section: knowledgePoint.section,
      topic: knowledgePoint.topic,
    };

    const response = await this.makeRequest<BackendKnowledgePoint>('/knowledge-points', {
      method: 'POST',
      body: JSON.stringify(backendKP)
    });

    if (response.success && response.data) {
      const createdKP = this.convertKnowledgePoint(response.data);
      return {
        success: true,
        data: createdKP,
        message: '知识点创建成功'
      };
    }

    return response as ApiResponse<KnowledgePoint>;
  }

  // Update a knowledge point
  async updateKnowledgePoint(id: string, updates: Partial<KnowledgePoint>): Promise<ApiResponse<KnowledgePoint | null>> {
    const backendUpdates: any = {};
    
    if (updates.subjectId !== undefined) backendUpdates.subject_id = updates.subjectId;
    if (updates.volume !== undefined) backendUpdates.volume = updates.volume;
    if (updates.unit !== undefined) backendUpdates.unit = updates.unit;
    if (updates.lesson !== undefined) backendUpdates.lesson = updates.lesson;
    if (updates.section !== undefined) backendUpdates.section = updates.section;
    if (updates.topic !== undefined) backendUpdates.topic = updates.topic;

    const response = await this.makeRequest<BackendKnowledgePoint>(`/knowledge-points/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates)
    });

    if (response.success && response.data) {
      const updatedKP = this.convertKnowledgePoint(response.data);
      return {
        success: true,
        data: updatedKP,
        message: '知识点更新成功'
      };
    }

    return response as ApiResponse<KnowledgePoint | null>;
  }

  // Delete a knowledge point
  async deleteKnowledgePoint(id: string): Promise<ApiResponse<boolean>> {
    const response = await this.makeRequest<void>(`/knowledge-points/${id}`, {
      method: 'DELETE'
    });

    if (response.success) {
      return {
        success: true,
        data: true,
        message: '知识点删除成功'
      };
    }

    return {
      success: false,
      data: false,
      error: response.error || '知识点删除失败'
    };
  }

  // Submit practice session results
  async submitPracticeSession(session: PracticeSession): Promise<ApiResponse<void>> {
    // Convert session data to backend format
    const backendSession = {
      subject_id: session.subjectId,
      knowledge_point_ids: session.knowledgePoints.map(id => parseInt(id)).filter(id => !isNaN(id)),
      quiz_ids: session.questions.map(q => parseInt(q.id)).filter(id => !isNaN(id)),
      answers: session.answers,
      durations: session.questionDurations,
      start_time: session.startTime,
      end_time: session.endTime,
      completed: session.completed
    };

    const response = await this.makeRequest<void>('/practice/submit', {
      method: 'POST',
      body: JSON.stringify(backendSession)
    });

    return response;
  }

  // Get practice statistics
  async getPracticeStatistics(userId?: string): Promise<ApiResponse<any>> {
    const endpoint = userId ? `/practice/stats?user_id=${userId}` : '/practice/stats';
    return this.makeRequest<any>(endpoint);
  }

  // Search quizzes
  async searchQuizzes(query: string, subjectId?: string): Promise<ApiResponse<QuizQuestion[]>> {
    let endpoint = `/quiz/search?q=${encodeURIComponent(query)}`;
    if (subjectId) {
      endpoint += `&subject_id=${subjectId}`;
    }

    const response = await this.makeRequest<BackendQuiz[]>(endpoint);

    if (response.success && response.data) {
      const quizzes = response.data.map(quiz => this.convertQuiz(quiz));
      return {
        success: true,
        data: quizzes
      };
    }

    return response as ApiResponse<QuizQuestion[]>;
  }

  // Practice Session Methods
  async createPracticeSession(config: {
    knowledge_point_ids: string[];
    question_count?: number;
    time_limit_minutes?: number;
    strategy?: string;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    allow_review?: boolean;
    show_answer_immediately?: boolean;
  }): Promise<ApiResponse<{session: any, quizzes: any[]}>> {
    console.log('🔥 [DEBUG] Creating practice session with config:', config);
    
    const sessionData = {
      knowledge_point_ids: config.knowledge_point_ids,
      question_count: config.question_count || 20,
      time_limit_minutes: config.time_limit_minutes,
      strategy: config.strategy || 'random',
      shuffle_questions: config.shuffle_questions !== false,
      shuffle_options: config.shuffle_options !== false,
      allow_review: config.allow_review !== false,
      show_answer_immediately: config.show_answer_immediately || false
    };

    const response = await this.makeRequest<{session: any, quizzes: any[]}>('/practice/sessions/create', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });

    console.log('📊 [DEBUG] Practice session creation response:', response);
    return response;
  }

  async startPracticeSession(sessionId: string): Promise<ApiResponse<{session: any, quizzes: any[]}>> {
    console.log('🎯 [DEBUG] Starting practice session:', sessionId);
    
    const response = await this.makeRequest<{session: any, quizzes: any[]}>(`/practice/sessions/${sessionId}/start`, {
      method: 'POST'
    });

    console.log('📊 [DEBUG] Practice session start response:', response);
    return response;
  }

  async getPracticeSession(sessionId: string): Promise<ApiResponse<{session: any, quizzes: any[]}>> {
    console.log('📖 [DEBUG] Getting practice session:', sessionId);
    
    const response = await this.makeRequest<{session: any, quizzes: any[]}>(`/practice/sessions/${sessionId}`);

    console.log('📊 [DEBUG] Practice session get response:', response);
    return response;
  }

  async submitPracticeAnswer(sessionId: string, questionId: string, answer: string, timeSpent: number): Promise<ApiResponse<{isCorrect: boolean}>> {
    console.log('✅ [DEBUG] Submitting answer for session:', sessionId, 'question:', questionId);
    
    const answerData = {
      session_id: sessionId,
      question_id: questionId,
      answer: answer,
      time_spent_seconds: timeSpent
    };

    const response = await this.makeRequest<{isCorrect: boolean}>('/practice/sessions/submit-answer', {
      method: 'POST',
      body: JSON.stringify(answerData)
    });

    console.log('📊 [DEBUG] Answer submission response:', response);
    return response;
  }

  async completePracticeSession(sessionId: string): Promise<ApiResponse<any>> {
    console.log('🏁 [DEBUG] Completing practice session:', sessionId);
    
    const response = await this.makeRequest<any>('/practice/sessions/complete', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId })
    });

    console.log('📊 [DEBUG] Session completion response:', response);
    return response;
  }
}

// Create and export the service instance
export const backendApi = new BackendApiService();

// Export convenience functions for compatibility with existing code
export const api = {
  subjects: {
    getAll: () => backendApi.getSubjects()
  },
  knowledgePoints: {
    getBySubject: (subjectId: string) => backendApi.getKnowledgePointsBySubject(subjectId),
    getAll: () => backendApi.getAllKnowledgePoints(),
    create: (kp: Omit<KnowledgePoint, 'id'>) => backendApi.createKnowledgePoint(kp),
    update: (id: string, updates: Partial<KnowledgePoint>) => backendApi.updateKnowledgePoint(id, updates),
    delete: (id: string) => backendApi.deleteKnowledgePoint(id)
  },
  questions: {
    getByKnowledgePoints: (kpIds: string[]) => backendApi.getQuizzesByKnowledgePoints(kpIds),
    getById: (id: string) => backendApi.getQuizById(id),
    create: (question: Omit<QuizQuestion, 'id'>) => backendApi.createQuiz(question),
    update: (id: string, updates: Partial<QuizQuestion>) => backendApi.updateQuiz(id, updates),
    delete: (id: string) => backendApi.deleteQuiz(id),
    search: (query: string, subjectId?: string) => backendApi.searchQuizzes(query, subjectId)
  },
  practice: {
    submit: (session: PracticeSession) => backendApi.submitPracticeSession(session),
    getStats: (userId?: string) => backendApi.getPracticeStatistics(userId),
    createSession: (config: any) => backendApi.createPracticeSession(config),
    startSession: (sessionId: string) => backendApi.startPracticeSession(sessionId),
    getSession: (sessionId: string) => backendApi.getPracticeSession(sessionId),
    submitAnswer: (sessionId: string, questionId: string, answer: string, timeSpent: number) => 
      backendApi.submitPracticeAnswer(sessionId, questionId, answer, timeSpent),
    completeSession: (sessionId: string) => backendApi.completePracticeSession(sessionId)
  }
};

export default backendApi;