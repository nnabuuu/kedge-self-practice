import { useState, useEffect } from 'react';
import { 
  practiceAnalysisApi, 
  WeakKnowledgePointsResponse,
  WrongQuestionsResponse,
  QuickPracticeSuggestionResponse,
  KnowledgeStatsResponse
} from '../services/practiceAnalysisApi';

export function useWeakKnowledgePoints(userId?: string, limit = 20) {
  const [data, setData] = useState<WeakKnowledgePointsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          setError('Authentication required');
          setData(null);
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const result = await practiceAnalysisApi.getWeakKnowledgePoints(userId, limit);
        setData(result);
        setError(null);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        setData(null);
        
        // If authentication error, could trigger redirect to login
        if (errorMessage.includes('Authentication required')) {
          // You could trigger a redirect here if needed
          // window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, limit]);

  return { data, loading, error };
}

export function useWrongQuestions(userId?: string, limit = 5) {
  const [data, setData] = useState<WrongQuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          setError('Authentication required');
          setData(null);
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const result = await practiceAnalysisApi.getWrongQuestions(userId, limit);
        setData(result);
        setError(null);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        setData(null);
        
        // If authentication error, could trigger redirect to login
        if (errorMessage.includes('Authentication required')) {
          // You could trigger a redirect here if needed
          // window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, limit]);

  return { data, loading, error };
}

export function useQuickPracticeSuggestion(userId?: string) {
  const [data, setData] = useState<QuickPracticeSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          setError('Authentication required');
          setData(null);
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const result = await practiceAnalysisApi.getQuickPracticeSuggestion(userId);
        setData(result);
        setError(null);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        setData(null);
        
        // If authentication error, could trigger redirect to login
        if (errorMessage.includes('Authentication required')) {
          // You could trigger a redirect here if needed
          // window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { data, loading, error };
}

export function useKnowledgePointStats(userId?: string, subjectId?: string, limit = 20) {
  const [data, setData] = useState<KnowledgeStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          setError('Authentication required');
          setData(null);
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const result = await practiceAnalysisApi.getKnowledgePointStats(userId, subjectId, limit);
        setData(result);
        setError(null);
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        setData(null);
        
        // If authentication error, could trigger redirect to login
        if (errorMessage.includes('Authentication required')) {
          // You could trigger a redirect here if needed
          // window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, subjectId, limit]);

  return { data, loading, error };
}