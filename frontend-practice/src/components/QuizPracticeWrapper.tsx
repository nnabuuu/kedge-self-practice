import React, { useState, useEffect } from 'react';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { api } from '../services/api';
import { preferencesService } from '../services/preferencesService';
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
  const [resumeData, setResumeData] = useState<{
    submittedAnswers: any[];
    currentQuestionIndex: number;
  } | null>(null);
  const hasLoadedRef = React.useRef<string | null>(null);

  console.log('QuizPracticeWrapper render - questions:', questions, 'loading:', loading, 'error:', error);

  useEffect(() => {
    // Prevent double-fetching in React strict mode
    // Use string comparison to handle both defined and undefined values
    const sessionKey = practiceSessionId || '__new_session__';
    if (hasLoadedRef.current === sessionKey) {
      console.log('[QuizPracticeWrapper] Already loaded session:', sessionKey);
      return;
    }

    hasLoadedRef.current = sessionKey;

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

      // Check if we have cached resume data (from clicking "继续练习")
      const cachedResumeData = sessionStorage.getItem('resumeSessionData');
      console.log('[QuizPracticeWrapper] Checking cache, found:', cachedResumeData ? 'YES' : 'NO');

      if (cachedResumeData) {
        console.log('[QuizPracticeWrapper] Raw cached data:', cachedResumeData.substring(0, 200));
        const resumeData = JSON.parse(cachedResumeData);
        console.log('[QuizPracticeWrapper] Parsed resume data:', resumeData);

        // Clear the cache after using it
        sessionStorage.removeItem('resumeSessionData');

        // Unwrap double-wrapped response: {success, data: {quizzes, ...}}
        const actualData = resumeData.data || resumeData;

        if (actualData.quizzes && actualData.quizzes.length > 0) {
          console.log('[QuizPracticeWrapper] Loaded questions from resume data:', actualData.quizzes.length);
          console.log('[QuizPracticeWrapper] Submitted answers:', actualData.submittedAnswers?.length);
          console.log('[QuizPracticeWrapper] Current question index:', actualData.currentQuestionIndex);

          setQuestions(actualData.quizzes);

          // Convert backend answer objects to frontend answer array format
          // Backend: [{quiz_id, user_answer, is_correct}, ...]
          // Frontend: [answer1, answer2, ...] indexed by question position
          let mappedAnswers: any[] | undefined;
          if (actualData.submittedAnswers && actualData.submittedAnswers.length > 0) {
            console.log('[QuizPracticeWrapper] Raw submitted answers from backend:', actualData.submittedAnswers);

            mappedAnswers = new Array(actualData.quizzes.length).fill(null);
            actualData.submittedAnswers.forEach((answerObj: any, idx: number) => {
              console.log(`[QuizPracticeWrapper] Processing answer ${idx}:`, {
                quiz_id: answerObj.quiz_id,
                user_answer: answerObj.user_answer,
                user_answer_type: typeof answerObj.user_answer,
                is_correct: answerObj.is_correct
              });

              // Find the index of this quiz_id in the quizzes array
              const questionIndex = actualData.quizzes.findIndex((q: any) => q.id === answerObj.quiz_id);
              if (questionIndex >= 0) {
                // user_answer from JSONB column should already be parsed by slonik
                // Just use it directly
                mappedAnswers[questionIndex] = answerObj.user_answer;
              }
            });
            console.log('[QuizPracticeWrapper] Mapped answers to positions:', mappedAnswers);
          }

          // Store resume data for QuizPracticeMain to use
          if (mappedAnswers || actualData.currentQuestionIndex !== undefined) {
            setResumeData({
              submittedAnswers: mappedAnswers || [],
              currentQuestionIndex: actualData.currentQuestionIndex || 0
            });
          }

          setLoading(false);
          return;
        } else {
          console.warn('[QuizPracticeWrapper] Resume data missing questions:', {resumeData, actualData});
        }
      }

      console.log('Fetching session with ID:', practiceSessionId);
      const sessionResponse = await api.practice.getSession(practiceSessionId);
      console.log('Session response:', sessionResponse);

      if (sessionResponse.success && sessionResponse.data) {
        // The GET endpoint now returns full session data including quizzes and answers
        const { session, quizzes, submittedAnswers, currentQuestionIndex } = sessionResponse.data;

        console.log('[QuizPracticeWrapper] Session data from GET:', {
          quizzesCount: quizzes?.length,
          submittedAnswersCount: submittedAnswers?.length,
          currentQuestionIndex
        });

        if (quizzes && quizzes.length > 0) {
          console.log('[QuizPracticeWrapper] Setting questions from GET response:', quizzes.length);
          setQuestions(quizzes);

          // Convert backend answer objects to frontend answer array format
          let mappedAnswers: any[] | undefined;
          if (submittedAnswers && submittedAnswers.length > 0) {
            console.log('[QuizPracticeWrapper] Processing submitted answers:', submittedAnswers);

            mappedAnswers = new Array(quizzes.length).fill(null);
            submittedAnswers.forEach((answerObj: any) => {
              // Find the index of this quiz_id in the quizzes array
              const questionIndex = quizzes.findIndex((q: any) => q.id === answerObj.quiz_id);
              if (questionIndex >= 0) {
                mappedAnswers[questionIndex] = answerObj.user_answer;
              }
            });
            console.log('[QuizPracticeWrapper] Mapped answers:', mappedAnswers);
          }

          // Store resume data for QuizPracticeMain to use
          if (mappedAnswers || currentQuestionIndex !== undefined) {
            setResumeData({
              submittedAnswers: mappedAnswers || [],
              currentQuestionIndex: currentQuestionIndex || 0
            });
          }
        } else {
          console.error('No quizzes found in session');
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

      // Create the session - now returns session with quiz data immediately
      const createResponse = await api.practice.createSession(sessionConfig);
      console.log('Create session response:', createResponse);

      if (createResponse.success && createResponse.data) {
        // The response now contains session object AND quiz data
        const session = createResponse.data.session;
        const quizzes = createResponse.data.quizzes || [];
        const sessionId = session?.id;

        if (!sessionId) {
          console.error('No session ID in create response:', createResponse.data);
          setError('Failed to create practice session - no session ID');
          return;
        }

        console.log('Created session with ID:', sessionId);
        console.log('Session created with quizzes:', quizzes.length);
        setCurrentSessionId(sessionId); // Save the session ID

        if (quizzes.length > 0) {
          // Set the questions from the create response
          setQuestions(quizzes);
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

    // Save hint preference from session to user profile
    try {
      const hintPreferenceStr = sessionStorage.getItem('hintPreference');
      if (hintPreferenceStr !== null) {
        const hintPreference = hintPreferenceStr === 'true';
        await preferencesService.setHintPreference(hintPreference);
        // Clean up session storage
        sessionStorage.removeItem('hintPreference');
      }
    } catch (error) {
      console.error('Failed to save hint preference:', error);
    }

    // Pass the transformed session to the parent handler
    onEndPractice(practiceSession);
  };

  return (
    <QuizPracticeMain
      questions={questions}
      sessionId={currentSessionId}
      resumeData={resumeData}
      onEnd={handleQuizEnd}
      onBack={onBack}
    />
  );
}