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


  useEffect(() => {
    // Prevent double-fetching in React strict mode
    // Use string comparison to handle both defined and undefined values
    const sessionKey = practiceSessionId || '__new_session__';
    if (hasLoadedRef.current === sessionKey) {
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

      if (cachedResumeData) {
        const resumeData = JSON.parse(cachedResumeData);

        // Clear the cache after using it
        sessionStorage.removeItem('resumeSessionData');

        // Unwrap double-wrapped response: {success, data: {quizzes, ...}}
        const actualData = resumeData.data || resumeData;

        if (actualData.quizzes && actualData.quizzes.length > 0) {

          setQuestions(actualData.quizzes);

          // Convert backend answer objects to frontend answer array format
          // Backend: [{quiz_id, user_answer, is_correct}, ...]
          // Frontend: [answer1, answer2, ...] indexed by question position
          // Note: Backend stores answers as indices (0,1,2) for single/multiple choice
          //       Frontend displays them as letters (A,B,C)
          let mappedAnswers: any[] | undefined;
          if (actualData.submittedAnswers && actualData.submittedAnswers.length > 0) {

            mappedAnswers = new Array(actualData.quizzes.length).fill(null);
            actualData.submittedAnswers.forEach((answerObj: any, idx: number) => {
              // Find the index of this quiz_id in the quizzes array
              const questionIndex = actualData.quizzes.findIndex((q: any) => q.id === answerObj.quiz_id);
              if (questionIndex >= 0) {
                const question = actualData.quizzes[questionIndex];
                let convertedAnswer = answerObj.user_answer;

                // Convert backend format to frontend format based on question type
                if (question.type === 'single-choice') {
                  // Backend stores "0", "1", "2", etc. - convert to "A", "B", "C"
                  const answerIndex = parseInt(convertedAnswer, 10);
                  if (!isNaN(answerIndex)) {
                    convertedAnswer = String.fromCharCode(65 + answerIndex); // 65 is 'A'
                  }
                } else if (question.type === 'multiple-choice') {
                  // Backend stores "0,1,2" - convert to ["A", "B", "C"]
                  const indices = convertedAnswer.split(',').map((s: string) => s.trim());
                  convertedAnswer = indices.map((idx: string) => {
                    const num = parseInt(idx, 10);
                    return !isNaN(num) ? String.fromCharCode(65 + num) : idx;
                  });
                } else if (question.type === 'fill-in-the-blank') {
                  // Backend stores "answer1|||answer2|||answer3" - convert to array
                  if (typeof convertedAnswer === 'string' && convertedAnswer.includes('|||')) {
                    convertedAnswer = convertedAnswer.split('|||');
                  } else if (!Array.isArray(convertedAnswer)) {
                    convertedAnswer = [convertedAnswer];
                  }
                }

                mappedAnswers[questionIndex] = convertedAnswer;
              }
            });
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
        }
      }

      const sessionResponse = await api.practice.getSession(practiceSessionId);

      if (sessionResponse.success && sessionResponse.data) {
        // The GET endpoint now returns full session data including quizzes and answers
        const { session, quizzes, submittedAnswers, currentQuestionIndex } = sessionResponse.data;

        if (quizzes && quizzes.length > 0) {
          setQuestions(quizzes);

          // Convert backend answer objects to frontend answer array format
          // Note: Backend stores answers as indices (0,1,2) for single/multiple choice
          //       Frontend displays them as letters (A,B,C)
          let mappedAnswers: any[] | undefined;
          if (submittedAnswers && submittedAnswers.length > 0) {

            mappedAnswers = new Array(quizzes.length).fill(null);
            submittedAnswers.forEach((answerObj: any) => {
              // Find the index of this quiz_id in the quizzes array
              const questionIndex = quizzes.findIndex((q: any) => q.id === answerObj.quiz_id);
              if (questionIndex >= 0) {
                const question = quizzes[questionIndex];
                let convertedAnswer = answerObj.user_answer;

                // Convert backend format to frontend format based on question type
                if (question.type === 'single-choice') {
                  // Backend stores "0", "1", "2", etc. - convert to "A", "B", "C"
                  const answerIndex = parseInt(convertedAnswer, 10);
                  if (!isNaN(answerIndex)) {
                    convertedAnswer = String.fromCharCode(65 + answerIndex); // 65 is 'A'
                  }
                } else if (question.type === 'multiple-choice') {
                  // Backend stores "0,1,2" - convert to ["A", "B", "C"]
                  const indices = convertedAnswer.split(',').map((s: string) => s.trim());
                  convertedAnswer = indices.map((idx: string) => {
                    const num = parseInt(idx, 10);
                    return !isNaN(num) ? String.fromCharCode(65 + num) : idx;
                  });
                } else if (question.type === 'fill-in-the-blank') {
                  // Backend stores "answer1|||answer2|||answer3" - convert to array
                  if (typeof convertedAnswer === 'string' && convertedAnswer.includes('|||')) {
                    convertedAnswer = convertedAnswer.split('|||');
                  } else if (!Array.isArray(convertedAnswer)) {
                    convertedAnswer = [convertedAnswer];
                  }
                }

                mappedAnswers[questionIndex] = convertedAnswer;
              }
            });
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

      // Use the knowledge point IDs directly (already strings)
      const knowledgePointIds = selectedKnowledgePoints.filter(id => id && id.length > 0);
      

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


      // Create the session - now returns session with quiz data immediately
      const createResponse = await api.practice.createSession(sessionConfig);

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

        setCurrentSessionId(sessionId); // Save the session ID

        if (quizzes.length > 0) {
          // Set the questions from the create response
          setQuestions(quizzes);
        } else {
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