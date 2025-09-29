import React, { useState, useEffect } from 'react';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { api } from '../services/api';
import QuizPracticeMain from './QuizPracticeMain';

interface QuizPracticeWrapperProps {
  subject: Subject;
  selectedKnowledgePoints: string[];  // Array of knowledge point IDs
  config: {
    questionType: 'new' | 'with-wrong' | 'wrong-only';
    questionCount: 'unlimited' | number;
    timeLimit?: number;
    shuffleQuestions: boolean;
    quizTypes?: string[];  // Changed from selectedQuestionTypes to match what's passed
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
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(practiceSessionId);
  
  console.log('QuizPracticeWrapper render - questions:', questions, 'loading:', loading, 'error:', error);

  useEffect(() => {
    if (practiceSessionId) {
      fetchSessionQuestions();
    } else {
      createAndFetchSession();
    }
  }, [practiceSessionId]);

  const fetchSessionQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching session with ID:', practiceSessionId);
      const sessionResponse = await api.practice.getSession(practiceSessionId);
      console.log('Session response:', sessionResponse);
      
      if (sessionResponse.success && sessionResponse.data) {
        // Check if response has session object or direct quiz_ids
        const session = sessionResponse.data.session || sessionResponse.data;
        const sessionQuizIds = session.quiz_ids || [];
        console.log('Session quiz IDs:', sessionQuizIds);
        
        // Fetch the actual questions using the quiz IDs
        if (sessionQuizIds.length > 0) {
          console.log('Fetching batch questions for IDs:', sessionQuizIds);
          const questionsResponse = await api.questions.getBatch(sessionQuizIds);
          console.log('Batch questions response:', questionsResponse);
          
          if (questionsResponse.success && questionsResponse.data) {
            console.log('Setting questions:', questionsResponse.data);
            setQuestions(questionsResponse.data);
          } else {
            console.error('Failed to load questions:', questionsResponse);
            setError('Failed to load practice questions');
          }
        } else {
          console.error('No quiz IDs found in session');
          setError('No questions found in practice session');
        }
      } else {
        setError('Failed to load practice session');
      }
    } catch (err) {
      console.error('Error loading session questions:', err);
      setError('Failed to load practice session');
    } finally {
      setLoading(false);
    }
  };

  const createAndFetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating new session with config:', {
        selectedKnowledgePoints,
        config
      });

      // Use the knowledge point IDs directly (already strings)
      const knowledgePointIds = selectedKnowledgePoints.filter(id => id && id.length > 0);
      
      console.log('Valid knowledge point IDs:', knowledgePointIds);

      // Create session configuration
      const sessionConfig = {
        subject_id: subject?.id,
        knowledge_point_ids: knowledgePointIds,
        question_count: config.questionCount === 'unlimited' ? 50 : config.questionCount,
        quiz_types: config.quizTypes || [],  // Fixed: use quizTypes instead of selectedQuestionTypes
        shuffle_questions: config.shuffleQuestions,
        time_limit_minutes: config.timeLimit,
        question_type: config.questionType === 'new' ? 'new-only' : 
                      config.questionType === 'wrong-only' ? 'wrong-only' : 'with-wrong'
      };

      console.log('Creating session with config:', sessionConfig);
      
      // Create the session
      const createResponse = await api.practice.createSession(sessionConfig);
      console.log('Create session response:', createResponse);
      
      if (createResponse.success && createResponse.data) {
        // The response contains a 'session' object with the session details
        const session = createResponse.data.session;
        const sessionId = session?.id;
        
        if (!sessionId) {
          console.error('No session ID in create response:', createResponse.data);
          setError('Failed to create practice session - no session ID');
          return;
        }
        
        console.log('Created session with ID:', sessionId);
        setCurrentSessionId(sessionId); // Save the session ID
        
        // The create response already includes the quizzes
        const quizzes = createResponse.data.quizzes || [];
        console.log('Session created with quizzes:', quizzes);
        
        if (quizzes.length > 0) {
          // Start the session
          const startResponse = await api.practice.startSession(sessionId);
          console.log('Start session response:', startResponse);
          
          if (startResponse.success) {
            // Set the questions directly from the create response
            setQuestions(quizzes);
          } else {
            console.error('Failed to start session:', startResponse.error);
            setError('Failed to start practice session');
          }
        } else {
          console.log('No questions found for the selected criteria');
          setError('没有找到符合条件的题目');
        }
      } else {
        setError('Failed to create practice session');
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

  const handleQuizEnd = async (results: any) => {
    // Transform the simple results into a PracticeSession object
    const practiceSession = {
      id: currentSessionId || `temp-${Date.now()}`,
      subjectId: subject.id,
      knowledgePoints: selectedKnowledgePoints,
      questions: questions,
      answers: results.answers,
      questionDurations: results.questionDurations,
      startTime: new Date(Date.now() - results.totalTime),
      endTime: new Date(),
      completed: true,
      // Calculate statistics
      correctAnswers: results.answers.filter(
        (answer: any, index: number) => {
          const question = questions[index];
          if (!question) return false;
          
          // Check if answer is correct based on question type
          if (question.type === 'single-choice') {
            return answer === question.answer;
          } else if (question.type === 'multiple-choice') {
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [];
            return Array.isArray(answer) && 
              answer.length === correctAnswers.length &&
              answer.every((a: string) => correctAnswers.includes(a));
          } else if (question.type === 'fill-in-the-blank') {
            // For fill-in-blank, need to check against answer and alternatives
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
            const alternativeAnswers = question.alternative_answers || [];
            
            if (!Array.isArray(answer)) return false;
            
            return answer.every((userAns: string, idx: number) => {
              const normalizedUserAns = userAns?.trim().toLowerCase() || '';
              const normalizedCorrectAns = String(correctAnswers[idx]).trim().toLowerCase();
              
              if (normalizedUserAns === normalizedCorrectAns) return true;
              
              // Check alternatives
              const positionSpecific = alternativeAnswers
                .filter((alt: string) => alt.startsWith(`[${idx}]`))
                .map((alt: string) => alt.replace(`[${idx}]`, '').trim().toLowerCase());
              
              const general = alternativeAnswers
                .filter((alt: string) => !alt.includes('['))
                .map((alt: string) => alt.trim().toLowerCase());
              
              return positionSpecific.includes(normalizedUserAns) || general.includes(normalizedUserAns);
            });
          }
          return false;
        }
      ).length,
      incorrectAnswers: results.completedCount - results.answers.filter(
        (answer: any, index: number) => {
          const question = questions[index];
          if (!question || answer === null) return false;
          
          // Same logic as above for checking correctness
          if (question.type === 'single-choice') {
            return answer === question.answer;
          } else if (question.type === 'multiple-choice') {
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [];
            return Array.isArray(answer) && 
              answer.length === correctAnswers.length &&
              answer.every((a: string) => correctAnswers.includes(a));
          } else if (question.type === 'fill-in-the-blank') {
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
            const alternativeAnswers = question.alternative_answers || [];
            
            if (!Array.isArray(answer)) return false;
            
            return answer.every((userAns: string, idx: number) => {
              const normalizedUserAns = userAns?.trim().toLowerCase() || '';
              const normalizedCorrectAns = String(correctAnswers[idx]).trim().toLowerCase();
              
              if (normalizedUserAns === normalizedCorrectAns) return true;
              
              const positionSpecific = alternativeAnswers
                .filter((alt: string) => alt.startsWith(`[${idx}]`))
                .map((alt: string) => alt.replace(`[${idx}]`, '').trim().toLowerCase());
              
              const general = alternativeAnswers
                .filter((alt: string) => !alt.includes('['))
                .map((alt: string) => alt.trim().toLowerCase());
              
              return positionSpecific.includes(normalizedUserAns) || general.includes(normalizedUserAns);
            });
          }
          return false;
        }
      ).length,
      totalTime: results.totalTime,
      averageAnswerTime: results.totalTime / questions.length,
      completedQuestions: results.completedCount
    };
    
    // Complete the session on backend if we have a session ID
    if (currentSessionId) {
      try {
        await api.practice.completeSession(currentSessionId, {
          completed: true
        });
      } catch (error) {
        console.error('Failed to complete session on backend:', error);
      }
    }
    
    // Pass the transformed session to the parent handler
    onEndPractice(practiceSession);
  };

  return (
    <QuizPracticeMain
      questions={questions}
      sessionId={currentSessionId}
      onEnd={handleQuizEnd}
      onBack={onBack}
    />
  );
}