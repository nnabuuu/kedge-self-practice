// Backend API Service - Real backend connection
import { Subject, KnowledgePoint, QuizQuestion, PracticeSession } from '../types/quiz';
import { authService } from './authService';
import { letterToIndex } from '../utils/answerConversion';

// Direct connection to backend - add /v1 if not already present
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
  ? import.meta.env.VITE_API_BASE_URL
  : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1`;

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
          statusCode: response.status,
          ...data
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
  private convertQuiz(backendQuiz: any): QuizQuestion {
    // Determine quiz type - use the backend type directly if it matches our types
    let type: QuizQuestion['type'] = 'single-choice';
    if (backendQuiz.type === 'single-choice' || backendQuiz.type === 'multiple-choice' || 
        backendQuiz.type === 'essay' || backendQuiz.type === 'fill-in-the-blank' ||
        backendQuiz.type === 'subjective' || backendQuiz.type === 'other') {
      type = backendQuiz.type;
    }

    // Keep options in their original format (object or array)
    let options = backendQuiz.options;
    
    // If options is an array and we need object format for compatibility
    if (Array.isArray(backendQuiz.options) && (type === 'single-choice' || type === 'multiple-choice')) {
      options = {};
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      backendQuiz.options.forEach((option: string, index: number) => {
        if (index < keys.length) {
          options[keys[index]] = option;
        }
      });
    }

    // Convert answer format from backend
    let answer = backendQuiz.answer;
    let answer_index = backendQuiz.answer_index;
    
    if ((type === 'single-choice' || type === 'multiple-choice')) {
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      // Prefer answer_index if available
      if (answer_index && Array.isArray(answer_index) && answer_index.length > 0) {
        // Use answer_index directly - it's the most reliable
        if (type === 'single-choice') {
          answer = keys[answer_index[0]] || String(answer_index[0]);
        } else {
          answer = answer_index.map((idx: number) => keys[idx] || String(idx));
        }
      } else {
        // Fallback to old logic for backward compatibility
        if (typeof answer === 'number') {
          // Answer is already a numeric index (0, 1, 2, 3)
          answer = keys[answer] || String(answer);
        } else if (typeof answer === 'string' && /^\d+$/.test(answer)) {
          // Answer is a string number like "0", "1", "2"
          const index = parseInt(answer, 10);
          answer = keys[index] || answer;
        } else if (Array.isArray(answer) && answer.length > 0) {
          // Answer is an array - need to handle based on content
          if (typeof answer[0] === 'string' && !keys.includes(answer[0])) {
            // Answer contains actual text values (e.g., ["冯子材"])
            // Find the index of each answer in the options array
            if (Array.isArray(backendQuiz.options)) {
              answer = answer.map((answerText: string) => {
                const index = backendQuiz.options.indexOf(answerText);
                return index !== -1 ? keys[index] : answerText;
              });
            }
          } else if (typeof answer[0] === 'number') {
            // Answer contains numeric indices
            answer = answer.map((idx: number) => keys[idx] || String(idx));
          }
          
          // For single-choice, extract just the first answer
          if (type === 'single-choice' && Array.isArray(answer)) {
            answer = answer[0];
          }
        } else if (typeof answer === 'string' && Array.isArray(backendQuiz.options)) {
          // Single answer text - find its index in options
          const index = backendQuiz.options.indexOf(answer);
          if (index !== -1) {
            answer = keys[index];
          }
        }
      }
    }

    // Determine the knowledge point ID to use
    let relatedKnowledgePointId = backendQuiz.knowledge_point_id || backendQuiz.knowledgePointId;
    
    // If backend provides knowledgePoint object, use its ID
    if (backendQuiz.knowledgePoint && backendQuiz.knowledgePoint.id) {
      relatedKnowledgePointId = backendQuiz.knowledgePoint.id;
    }

    return {
      id: String(backendQuiz.id),
      type,
      question: backendQuiz.question,
      options,
      answer,
      standardAnswer: type === 'essay' ? backendQuiz.answer : undefined,
      relatedKnowledgePointId,
      knowledge_point_id: relatedKnowledgePointId, // Include both forms
      images: backendQuiz.images || [],
      hints: backendQuiz.hints || undefined,
      alternative_answers: backendQuiz.alternative_answers || undefined,
      tags: backendQuiz.tags || [], // Include tags
      difficulty: backendQuiz.difficulty,
      // Store the full knowledge point data if available
      knowledgePoint: backendQuiz.knowledgePoint
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

  // Get all subjects from backend
  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    try {
      // Fetch from backend /subjects endpoint
      const response = await this.makeRequest<any>('/subjects');
      
      if (response.success && response.data) {
        // The backend returns {success: true, data: [...]}
        // Extract the actual data array
        const subjectsData = response.data.data || response.data;
        
        // Convert backend format to frontend Subject format
        const subjects: Subject[] = subjectsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          icon: s.emoji || s.icon, // Use emoji as icon
          color: s.color
        }));
        
        return {
          success: true,
          data: subjects
        };
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch subjects from backend:', error);
      
      // Return empty array on error
      return {
        success: false,
        data: [],
        error: 'Failed to fetch subjects'
      };
    }
  }

  // Get knowledge points by subject
  async getKnowledgePointsBySubject(subjectId: string): Promise<ApiResponse<KnowledgePoint[]>> {
    
    // Backend doesn't have subject filtering yet, so get all and filter client-side
    const response = await this.getAllKnowledgePoints();
    
    if (response.success && response.data) {
      // Filter by subject - for now, all knowledge points are history
      // In the future, this could be enhanced with proper subject classification
      const filteredKPs = response.data.filter(kp => 
        subjectId === 'history' || !subjectId // For now, all KPs are history
      );
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

  // Match knowledge point for a quiz
  async matchKnowledgePoint(
    quizText: string,
    targetHints?: {
      volume?: string;
      unit?: string;
      lesson?: string;
      sub?: string;
    }
  ): Promise<ApiResponse<{
    matched: BackendKnowledgePoint | null;
    candidates: BackendKnowledgePoint[];
    keywords: string[];
    country: string;
    dynasty: string;
  }>> {
    const body = {
      quizText,
      maxMatches: 3,
      targetHints
    };

    const response = await this.makeRequest<any>('/knowledge-points/match', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response;
  }

  // Get knowledge point hierarchy options
  async getHierarchyOptions(filters?: {
    volume?: string;
    unit?: string;
    lesson?: string;
  }): Promise<ApiResponse<{
    volumes: string[];
    units: string[];
    lessons: string[];
    subs: string[];
  }>> {
    const params = new URLSearchParams();
    if (filters?.volume) params.append('volume', filters.volume);
    if (filters?.unit) params.append('unit', filters.unit);
    if (filters?.lesson) params.append('lesson', filters.lesson);
    
    const response = await this.makeRequest<{
      volumes: string[];
      units: string[];
      lessons: string[];
      subs: string[];
    }>(`/knowledge-points/hierarchy-options?${params.toString()}`);

    return response;
  }

  // Get quizzes by knowledge points - optimized to use single API call
  async getQuizzesByKnowledgePoints(knowledgePointIds: string[]): Promise<ApiResponse<QuizQuestion[]>> {
    
    // Backend expects string IDs like "kp_305"
    const validIds = knowledgePointIds.filter(id => id && id.trim() !== '');
    
    if (validIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Use single API call with comma-separated knowledge point IDs
    const idsParam = validIds.join(',');
    
    const response = await this.makeRequest<{success: boolean, data: BackendQuiz[], count: number, total: number}>(
      `/quiz?knowledge_point_id=${idsParam}`
    );
    
    
    if (response.success && response.data && response.data.data) {
      const quizzes = response.data.data.map(quiz => this.convertQuiz(quiz));
      return {
        success: true,
        data: quizzes
      };
    }

    return {
      success: true,
      data: []
    };
  }

  // Get quiz by ID
  async getQuizById(id: string): Promise<ApiResponse<QuizQuestion | null>> {
    const response = await this.makeRequest<any>(`/quiz/${id}`);

    if (response.success && response.data) {
      // Check if data is nested (some endpoints return data.data)
      const backendQuiz = response.data.data || response.data;
      
      if (!backendQuiz || !backendQuiz.id) {
        return {
          success: false,
          data: null,
          error: 'Invalid quiz data received'
        };
      }
      
      const quiz = this.convertQuiz(backendQuiz);
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
  async updateQuiz(id: string, updates: Partial<any>): Promise<ApiResponse<QuizQuestion | null>> {
    // Convert frontend quiz format to backend format
    const backendUpdates: any = {};
    
    // Handle basic fields
    if (updates.question !== undefined) {
      backendUpdates.question = updates.question;
    }
    if (updates.type !== undefined) {
      backendUpdates.type = updates.type;
    }
    if (updates.difficulty !== undefined) {
      backendUpdates.difficulty = updates.difficulty;
    }
    
    // Handle options - convert object to array if needed
    if (updates.options !== undefined) {
      if (Array.isArray(updates.options)) {
        backendUpdates.options = updates.options;
      } else if (typeof updates.options === 'object' && updates.options !== null) {
        // Convert object {A: "...", B: "..."} to array ["...", "..."]
        const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
        const optionsArray: string[] = [];
        for (const key of keys) {
          if ((updates.options as any)[key]) {
            optionsArray.push((updates.options as any)[key]);
          }
        }
        backendUpdates.options = optionsArray;
      } else {
        backendUpdates.options = [];
      }
    }
    
    // Handle answer - keep as is (string, number, or array)
    if (updates.answer !== undefined) {
      backendUpdates.answer = updates.answer;
    }
    
    // Handle knowledge point ID - pass through as-is
    if (updates.knowledgePointId !== undefined || updates.knowledge_point_id !== undefined) {
      backendUpdates.knowledge_point_id = updates.knowledgePointId || updates.knowledge_point_id;
    }
    
    // Handle tags array
    if (updates.tags !== undefined) {
      backendUpdates.tags = updates.tags;
    }
    
    // Handle hints array
    if (updates.hints !== undefined) {
      backendUpdates.hints = updates.hints;
    }
    
    // Handle alternative answers
    if (updates.alternative_answers !== undefined) {
      backendUpdates.alternative_answers = updates.alternative_answers;
    }

    console.log('Backend updates being sent:', JSON.stringify(backendUpdates, null, 2));
    
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
    subject_id?: string;
    knowledge_point_ids: string[];
    question_count?: number;
    time_limit_minutes?: number;
    strategy?: string;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    allow_review?: boolean;
    show_answer_immediately?: boolean;
    quiz_types?: string[];
    question_type?: 'new-only' | 'with-wrong' | 'wrong-only';
  }): Promise<ApiResponse<{session: any, quizzes: any[]}>> {
    
    const sessionData = {
      subject_id: config.subject_id,
      knowledge_point_ids: config.knowledge_point_ids,
      question_count: config.question_count || 20,
      time_limit_minutes: config.time_limit_minutes,
      strategy: config.strategy || 'random',
      shuffle_questions: config.shuffle_questions !== false,
      shuffle_options: config.shuffle_options !== false,
      allow_review: config.allow_review !== false,
      show_answer_immediately: config.show_answer_immediately || false,
      quiz_types: config.quiz_types,
      question_type: config.question_type || 'with-wrong'
    };
    
    console.log('Creating practice session with config:', sessionData);
    console.log('Quiz types being sent:', config.quiz_types);

    const response = await this.makeRequest<{session: any, quizzes: BackendQuiz[]}>('/practice/sessions/create', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });

    
    // Convert the quizzes to frontend format if they exist
    if (response.success && response.data && response.data.quizzes) {
      console.log('Received quizzes from backend:', response.data.quizzes.length);
      console.log('Quiz types in response:', response.data.quizzes.map((q: any) => q.type));
      const convertedQuizzes = response.data.quizzes.map(quiz => this.convertQuiz(quiz));
      return {
        ...response,
        data: {
          ...response.data,
          quizzes: convertedQuizzes
        }
      };
    }
    
    return response;
  }

  async startPracticeSession(sessionId: string): Promise<ApiResponse<{session: any, quizzes: any[]}>> {
    
    const response = await this.makeRequest<{session: any, quizzes: BackendQuiz[]}>(`/practice/sessions/${sessionId}/start`, {
      method: 'POST'
    });

    
    // Convert the quizzes to frontend format
    if (response.success && response.data && response.data.quizzes) {
      const convertedQuizzes = response.data.quizzes.map(quiz => this.convertQuiz(quiz));
      return {
        ...response,
        data: {
          ...response.data,
          quizzes: convertedQuizzes
        }
      };
    }
    
    return response;
  }

  async getPracticeSession(sessionId: string): Promise<ApiResponse<{session: any, quizzes: any[]}>> {
    
    const response = await this.makeRequest<{session: any, quizzes: BackendQuiz[]}>(`/practice/sessions/${sessionId}`);

    
    // Convert the quizzes to frontend format
    if (response.success && response.data && response.data.quizzes) {
      const convertedQuizzes = response.data.quizzes.map(quiz => this.convertQuiz(quiz));
      return {
        ...response,
        data: {
          ...response.data,
          quizzes: convertedQuizzes
        }
      };
    }
    
    return response;
  }

  async submitPracticeAnswer(sessionId: string, questionId: string, answer: string | number, timeSpent: number): Promise<ApiResponse<{isCorrect: boolean}>> {
    
    const answerData = {
      session_id: sessionId,
      question_id: questionId,
      answer: String(answer), // Convert to string as backend expects string
      time_spent_seconds: timeSpent
    };

    const response = await this.makeRequest<{isCorrect: boolean}>('/practice/sessions/submit-answer', {
      method: 'POST',
      body: JSON.stringify(answerData)
    });

    return response;
  }

  async completePracticeSession(sessionId: string): Promise<ApiResponse<any>> {

    const response = await this.makeRequest<any>('/practice/sessions/complete', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId })
    });

    return response;
  }

  // Get incomplete session for current user
  async getIncompleteSession(): Promise<ApiResponse<{
    sessionId: string;
    progress: { total: number; answered: number; currentIndex: number };
    configuration: any;
    lastActivityAt: string;
    answers: any[];
  } | null>> {
    const response = await this.makeRequest<{
      sessionId: string;
      progress: { total: number; answered: number; currentIndex: number };
      configuration: any;
      lastActivityAt: string;
      answers: any[];
    } | null>('/practice/incomplete-session');

    return response;
  }

  // Resume a practice session
  async resumePracticeSession(sessionId: string): Promise<ApiResponse<{
    session: any;
    questions: any[];
    previousAnswers: any[];
    currentQuestionIndex: number;
  }>> {
    const response = await this.makeRequest<{
      session: any;
      questions: any[];
      previousAnswers: any[];
      currentQuestionIndex: number;
    }>(`/practice/resume/${sessionId}`, {
      method: 'POST'
    });

    return response;
  }

  // Abandon a practice session
  async abandonPracticeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.makeRequest<{ message: string }>(`/practice/abandon/${sessionId}`, {
      method: 'POST'
    });

    return response;
  }

  // Get quiz type distribution for a session
  async getSessionTypeDistribution(sessionId: string): Promise<ApiResponse<{
    distribution: Array<{
      type: string;
      displayName: string;
      count: number;
      percentage: number;
    }>;
    total: number;
  }>> {
    const response = await this.makeRequest<{
      distribution: Array<{
        type: string;
        displayName: string;
        count: number;
        percentage: number;
      }>;
      total: number;
    }>(`/practice/sessions/${sessionId}/type-distribution`);

    return response;
  }

  // Report Management Methods for Teachers/Admins
  async getReportsForManagement(params?: {
    status?: ('pending' | 'reviewing' | 'resolved' | 'dismissed')[];
    sort?: 'created_at' | 'report_count' | 'pending_count';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<any>> {
    if (!params) {
      return this.makeRequest('/quiz/report/management');
    }

    // Build query string manually to handle array parameters
    const queryParts: string[] = [];

    if (params.status && params.status.length > 0) {
      params.status.forEach(s => queryParts.push(`status=${encodeURIComponent(s)}`));
    }
    if (params.sort) {
      queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
    }
    if (params.limit !== undefined) {
      queryParts.push(`limit=${params.limit}`);
    }
    if (params.offset !== undefined) {
      queryParts.push(`offset=${params.offset}`);
    }

    const queryString = queryParts.join('&');
    return this.makeRequest(`/quiz/report/management${queryString ? '?' + queryString : ''}`);
  }

  async updateReportStatus(
    reportId: string,
    data: {
      status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
      resolution_note?: string;
    }
  ): Promise<ApiResponse<any>> {
    return this.makeRequest(`/quiz/report/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async bulkUpdateReports(data: {
    report_ids: string[];
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    resolution_note?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/quiz/report/bulk-update', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getReportAnalytics(period?: string): Promise<ApiResponse<any>> {
    const queryString = period ? `?period=${period}` : '';
    return this.makeRequest(`/quiz/report/analytics${queryString}`);
  }

  // Generic GET request method for external use
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint);
  }

  // Generic POST request method for external use
  async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
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
    delete: (id: string) => backendApi.deleteKnowledgePoint(id),
    match: (quizText: string, targetHints?: any) => backendApi.matchKnowledgePoint(quizText, targetHints),
    getHierarchyOptions: (filters?: any) => backendApi.getHierarchyOptions(filters)
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
    submitAnswer: (sessionId: string, questionId: string, answer: string, timeSpent: number) => {
      // Convert letter answers to indices for more efficient backend processing
      // The backend expects indices as strings for single-choice questions
      let convertedAnswer = answer;

      // Check if this looks like a single letter answer (A, B, C, D, etc.)
      if (answer && answer.length === 1 && /^[A-F]$/i.test(answer)) {
        const index = letterToIndex(answer);
        if (typeof index === 'number') {
          convertedAnswer = String(index);
        }
      } else if (answer && answer.includes(',')) {
        // Multiple choice: convert comma-separated letters to indices
        const letters = answer.split(',').map(s => s.trim());
        const indices = letters.map(letter => {
          const index = letterToIndex(letter);
          return typeof index === 'number' ? index : letter;
        });
        convertedAnswer = indices.join(',');
      }

      return backendApi.submitPracticeAnswer(sessionId, questionId, convertedAnswer, timeSpent);
    },
    completeSession: (sessionId: string) => backendApi.completePracticeSession(sessionId),
    getTypeDistribution: (sessionId: string) => backendApi.getSessionTypeDistribution(sessionId),
    getIncompleteSession: () => backendApi.getIncompleteSession(),
    resumeSession: (sessionId: string) => backendApi.resumePracticeSession(sessionId),
    abandonSession: (sessionId: string) => backendApi.abandonPracticeSession(sessionId)
  },
  reports: {
    getManagementReports: (params?: any) => backendApi.getReportsForManagement(params),
    updateStatus: (reportId: string, data: any) => backendApi.updateReportStatus(reportId, data),
    bulkUpdate: (data: any) => backendApi.bulkUpdateReports(data),
    getAnalytics: (period?: string) => backendApi.getReportAnalytics(period)
  }
};

export default backendApi;