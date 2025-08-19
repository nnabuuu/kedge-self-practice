import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';

// 通用的API Hook状态类型
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 通用的API Hook
export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data: T; message?: string }>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || response.message || '请求失败'
        });
      }
    } catch (error) {
      let errorMessage = '网络错误';
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = '无法连接到服务器，请检查后端服务是否运行';
        } else {
          errorMessage = error.message;
        }
      }
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

// 学科相关的Hook
export function useSubjects() {
  return useApi(() => api.subjects.getAll());
}

// 知识点相关的Hook
export function useKnowledgePoints(subjectId: string | null) {
  return useApi(
    () => subjectId ? api.knowledgePoints.getBySubject(subjectId) : Promise.resolve({ success: true, data: [] }),
    [subjectId]
  );
}

// 题目相关的Hook
export function useQuestions(knowledgePointIds: string[]) {
  return useApi(
    () => knowledgePointIds.length > 0 
      ? api.questions.getByKnowledgePoints(knowledgePointIds)
      : Promise.resolve({ success: true, data: [] }),
    [knowledgePointIds.join(',')]
  );
}

// 搜索题目的Hook
export function useQuestionSearch(query: string, subjectId?: string) {
  const [state, setState] = useState<ApiState<QuizQuestion[]>>({
    data: null,
    loading: false,
    error: null
  });

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await api.questions.search(searchQuery, subjectId);
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || response.message || '搜索失败'
        });
      }
    } catch (error) {
      let errorMessage = '搜索错误';
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = '无法连接到服务器，请检查后端服务是否运行';
        } else {
          errorMessage = error.message;
        }
      }
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
    }
  }, [subjectId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300); // 防抖

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  return {
    ...state,
    search
  };
}

// 统计信息的Hook
export function useStatistics(subjectId?: string) {
  return useApi(() => api.stats.get(subjectId), [subjectId]);
}

// 异步操作的Hook（用于创建、更新、删除等操作）
export function useAsyncOperation<T, P = any>() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  const execute = useCallback(async (
    operation: (params: P) => Promise<{ success: boolean; data: T; message?: string }>,
    params: P
  ) => {
    setState({ loading: true, error: null, success: false });
    
    try {
      const response = await operation(params);
      if (response.success) {
        setState({ loading: false, error: null, success: true });
        return response.data;
      } else {
        setState({ loading: false, error: response.message || '操作失败', success: false });
        return null;
      }
    } catch (error) {
      setState({ 
        loading: false, 
        error: error instanceof Error ? error.message : '操作错误', 
        success: false 
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, success: false });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// AI分析的Hook
export function useAIAnalysis() {
  const [state, setState] = useState<{
    data: any | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const analyze = useCallback(async (question: string) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const response = await api.ai.analyzeQuestion(question);
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null
        });
        return response.data;
      } else {
        setState({
          data: null,
          loading: false,
          error: response.message || 'AI分析失败'
        });
        return null;
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'AI分析错误'
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    analyze,
    reset
  };
}

// 批量操作的Hook
export function useBatchOperation<T>() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    progress: number;
    results: T[];
  }>({
    loading: false,
    error: null,
    progress: 0,
    results: []
  });

  const executeBatch = useCallback(async <P>(
    operations: Array<() => Promise<{ success: boolean; data: T; message?: string }>>,
    onProgress?: (progress: number) => void
  ) => {
    setState({ loading: true, error: null, progress: 0, results: [] });
    
    const results: T[] = [];
    const total = operations.length;
    
    try {
      for (let i = 0; i < operations.length; i++) {
        const response = await operations[i]();
        if (response.success) {
          results.push(response.data);
        }
        
        const progress = Math.round(((i + 1) / total) * 100);
        setState(prev => ({ ...prev, progress, results: [...results] }));
        onProgress?.(progress);
      }
      
      setState(prev => ({ ...prev, loading: false }));
      return results;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : '批量操作错误' 
      }));
      return results;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, progress: 0, results: [] });
  }, []);

  return {
    ...state,
    executeBatch,
    reset
  };
}

// Practice Session Hook
export function usePracticeSession(config: {
  knowledge_point_ids: string[];
  question_count?: number;
  time_limit_minutes?: number;
  strategy?: string;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  allow_review?: boolean;
  show_answer_immediately?: boolean;
} | null) {
  const [state, setState] = useState<{
    session: any | null;
    questions: any[] | null;
    loading: boolean;
    error: string | null;
    sessionId: string | null;
  }>({
    session: null,
    questions: null,
    loading: false,
    error: null,
    sessionId: null
  });

  const createSession = useCallback(async () => {
    if (!config || config.knowledge_point_ids.length === 0) {
      setState({
        session: null,
        questions: null,
        loading: false,
        error: null,
        sessionId: null
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await api.practice.createSession(config);
      
      if (response.success && response.data) {
        
        // Start the session immediately after creation
        const startResponse = await api.practice.startSession(response.data.session.id);
        
        if (startResponse.success && startResponse.data) {
          setState({
            session: startResponse.data.session,
            questions: startResponse.data.quizzes, // Backend returns 'quizzes', not 'questions'
            loading: false,
            error: null,
            sessionId: startResponse.data.session.id
          });
        } else {
          throw new Error(startResponse.error || 'Failed to start practice session');
        }
      } else {
        throw new Error(response.error || 'Failed to create practice session');
      }
    } catch (error) {
      console.error('Practice session creation failed:', error);
      let errorMessage = 'Practice session creation failed';
      if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = '无法连接到服务器，请检查后端服务是否运行';
        } else {
          errorMessage = error.message;
        }
      }
      setState({
        session: null,
        questions: null,
        loading: false,
        error: errorMessage,
        sessionId: null
      });
    }
  }, [config]);

  const submitAnswer = useCallback(async (questionId: string, answer: string, timeSpent: number) => {
    if (!state.sessionId) {
      throw new Error('No active session');
    }

    const response = await api.practice.submitAnswer(state.sessionId, questionId, answer, timeSpent);
    return response;
  }, [state.sessionId]);

  const completeSession = useCallback(async () => {
    if (!state.sessionId) {
      throw new Error('No active session');
    }

    const response = await api.practice.completeSession(state.sessionId);
    return response;
  }, [state.sessionId]);

  useEffect(() => {
    createSession();
  }, [createSession]);

  return {
    ...state,
    submitAnswer,
    completeSession,
    refetch: createSession
  };
}