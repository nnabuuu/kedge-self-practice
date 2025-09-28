import React, { useState, useEffect } from 'react';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { api } from '../services/api';
import QuizPracticeMain from './QuizPracticeMain';

interface QuizPracticeWrapperProps {
  subject: Subject;
  selectedKnowledgePoints: KnowledgePoint[];
  config: {
    questionType: 'new' | 'with-wrong' | 'wrong-only';
    questionCount: 'unlimited' | number;
    timeLimit?: number;
    shuffleQuestions: boolean;
    selectedQuestionTypes?: string[];
  };
  practiceSessionId?: string;
  onEndPractice: (results: any) => void;
  onBack: () => void;
}

export default function QuizPracticeWrapper({
  subject,
  selectedKnowledgePoints,
  config,
  practiceSessionId,
  onEndPractice,
  onBack
}: QuizPracticeWrapperProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [subject, selectedKnowledgePoints, config]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // If there's a practice session ID, fetch the session questions
      if (practiceSessionId) {
        const sessionResponse = await api.practice.getSession(practiceSessionId);
        if (sessionResponse.success && sessionResponse.data) {
          const sessionQuestions = sessionResponse.data.questions || sessionResponse.data.quiz_ids || [];
          
          // If we have quiz IDs, fetch the actual questions
          if (sessionQuestions.length > 0 && typeof sessionQuestions[0] === 'string') {
            const questionsResponse = await api.questions.getBatch(sessionQuestions);
            if (questionsResponse.success && questionsResponse.data) {
              setQuestions(questionsResponse.data);
            } else {
              setError('Failed to load practice questions');
            }
          } else if (sessionQuestions.length > 0) {
            // If we already have question objects
            setQuestions(sessionQuestions);
          } else {
            setError('No questions found in practice session');
          }
        } else {
          setError('Failed to load practice session');
        }
      } else {
        // Fetch questions based on knowledge points
        const knowledgePointIds = selectedKnowledgePoints.map(kp => kp.id);
        const response = await api.questions.getByKnowledgePoints(knowledgePointIds);
        
        if (response.success && response.data) {
          let fetchedQuestions = response.data;
          
          // Filter by question types if specified
          if (config.selectedQuestionTypes && config.selectedQuestionTypes.length > 0) {
            fetchedQuestions = fetchedQuestions.filter(q => 
              config.selectedQuestionTypes?.includes(q.type)
            );
          }
          
          // Shuffle if needed
          if (config.shuffleQuestions) {
            fetchedQuestions = [...fetchedQuestions].sort(() => Math.random() - 0.5);
          }
          
          // Limit the number of questions
          if (config.questionCount !== 'unlimited' && typeof config.questionCount === 'number') {
            fetchedQuestions = fetchedQuestions.slice(0, config.questionCount);
          }
          
          setQuestions(fetchedQuestions);
        } else {
          setError('Failed to load questions');
        }
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">加载题目中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <QuizPracticeMain
      questions={questions}
      onEnd={onEndPractice}
      onBack={onBack}
    />
  );
}