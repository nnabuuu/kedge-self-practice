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
        setLoading(true);
        const result = await practiceAnalysisApi.getWeakKnowledgePoints(userId, limit);
        setData(result);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setData(null);
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
        setLoading(true);
        const result = await practiceAnalysisApi.getWrongQuestions(userId, limit);
        setData(result);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setData(null);
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
        setLoading(true);
        const result = await practiceAnalysisApi.getQuickPracticeSuggestion(userId);
        setData(result);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setData(null);
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
        setLoading(true);
        const result = await practiceAnalysisApi.getKnowledgePointStats(userId, subjectId, limit);
        setData(result);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, subjectId, limit]);

  return { data, loading, error };
}