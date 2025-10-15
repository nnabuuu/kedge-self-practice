import React, { useState, useRef, useEffect } from 'react';
import { QuizQuestion } from '../types/quiz';
import { api } from '../services/api';
import ReportModal from './ReportModal';
import { Eye } from 'lucide-react';
import { useToast, ToastContainer } from './Toast';

import {
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  FillInBlankQuestion,
  EssayQuestion,
  QuizHeader
} from './QuizPractice';
import { Lightbulb } from 'lucide-react';

interface QuizPracticeProps {
  questions: QuizQuestion[];
  sessionId?: string;
  onEnd: (results: any) => void;
  onBack: () => void;
}

export default function QuizPractice({
  questions,
  sessionId,
  onEnd,
  onBack
}: QuizPracticeProps) {
  // Safety check for questions
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">没有找到题目</p>
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewingQuestionIndex, setViewingQuestionIndex] = useState(0);
  const [workingQuestionIndex, setWorkingQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>(Array(questions.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<string[]>([]);
  const [essayAnswer, setEssayAnswer] = useState<string>('');
  const [fillInBlankAnswers, setFillInBlankAnswers] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [userGaveUp, setUserGaveUp] = useState(false); // Track if user clicked "直接看答案"
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render when AI approves answer
  const { success, error, toasts, removeToast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const isSingleChoice = currentQuestion?.type === 'single-choice';
  const isMultipleChoice = currentQuestion?.type === 'multiple-choice';
  const isFillInBlank = currentQuestion?.type === 'fill-in-the-blank';
  const isEssay = currentQuestion?.type === 'subjective';

  const speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Initialize fill-in-blank answers when question changes
  useEffect(() => {
    if (isFillInBlank && currentQuestion) {
      const blanksCount = (currentQuestion.question.match(/____/g) || []).length;
      // Use Math.max(1, blanksCount) to ensure at least 1 blank for non-blank fill-in questions
      const actualBlanksCount = Math.max(1, blanksCount);
      if (fillInBlankAnswers.length !== actualBlanksCount) {
        setFillInBlankAnswers(new Array(actualBlanksCount).fill(''));
      }
    }
  }, [currentQuestionIndex, isFillInBlank]);

  // Global keyboard handler for Enter key when showing result
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter when showing result AND not focused on input/textarea
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Enter' && showResult && !isInputField) {
        e.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showResult, currentQuestionIndex, questions.length]);

  // Handle single choice selection with auto-submit
  const handleSingleChoiceSelect = (key: string) => {
    setSelectedAnswer(key);
    // Auto-submit for single-choice questions
    if (!showResult) {
      // Small delay to show selection before submitting
      setTimeout(() => {
        handleSubmitAnswer(key);
      }, 200);
    }
  };

  // Handle multiple choice toggle
  const handleMultipleChoiceToggle = (key: string) => {
    const isSelected = selectedMultipleAnswers.includes(key);
    if (isSelected) {
      setSelectedMultipleAnswers(selectedMultipleAnswers.filter(a => a !== key));
    } else {
      setSelectedMultipleAnswers([...selectedMultipleAnswers, key].sort());
    }
  };

  // Handle essay answer change
  const handleEssayChange = (value: string) => {
    setEssayAnswer(value);
  };

  // Handle fill in blank answer change
  const handleFillInBlankChange = (index: number, value: string) => {
    const newAnswers = [...fillInBlankAnswers];
    newAnswers[index] = value;
    setFillInBlankAnswers(newAnswers);
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Add speech recognition logic here
  };

  // Read question aloud
  const readQuestion = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-save current answer before navigating
  const saveCurrentAnswer = () => {
    const newAnswers = [...answers];
    let currentAnswer = null;

    if (isSingleChoice) {
      currentAnswer = selectedAnswer;
    } else if (isMultipleChoice) {
      currentAnswer = selectedMultipleAnswers.length > 0 ? selectedMultipleAnswers : null;
    } else if (isFillInBlank) {
      // Save even if incomplete - user might have filled some blanks
      const hasContent = fillInBlankAnswers.some(a => a && a.trim());
      currentAnswer = hasContent ? fillInBlankAnswers : null;
    } else if (isEssay) {
      currentAnswer = essayAnswer.trim() ? essayAnswer : null;
    }

    newAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(newAnswers);
  };

  // Load answer for the target question
  const loadAnswerForQuestion = (targetIndex: number) => {
    const targetQuestion = questions[targetIndex];
    const savedAnswer = answers[targetIndex];

    // Reset current state first
    setSelectedAnswer(null);
    setSelectedMultipleAnswers([]);
    setEssayAnswer('');
    setFillInBlankAnswers([]);
    setShowResult(false);
    setUserGaveUp(false);

    // Load saved answer if exists
    if (savedAnswer !== null && savedAnswer !== undefined) {
      if (targetQuestion.type === 'single-choice') {
        setSelectedAnswer(savedAnswer);
      } else if (targetQuestion.type === 'multiple-choice') {
        setSelectedMultipleAnswers(Array.isArray(savedAnswer) ? savedAnswer : []);
      } else if (targetQuestion.type === 'fill-in-the-blank') {
        setFillInBlankAnswers(Array.isArray(savedAnswer) ? savedAnswer : []);
      } else if (targetQuestion.type === 'subjective') {
        setEssayAnswer(savedAnswer);
      }
    }
  };

  // Navigate to previous question
  const handleNavigateToPrevious = () => {
    if (viewingQuestionIndex > 0) {
      saveCurrentAnswer();
      const targetIndex = viewingQuestionIndex - 1;
      setViewingQuestionIndex(targetIndex);
      setCurrentQuestionIndex(targetIndex);
      loadAnswerForQuestion(targetIndex);
    }
  };

  // Navigate to next question
  const handleNavigateToNext = () => {
    if (viewingQuestionIndex < questions.length - 1) {
      saveCurrentAnswer();
      const targetIndex = viewingQuestionIndex + 1;
      setViewingQuestionIndex(targetIndex);
      setCurrentQuestionIndex(targetIndex);
      loadAnswerForQuestion(targetIndex);

      // Update working question if moving forward to a new question
      if (targetIndex > workingQuestionIndex) {
        setWorkingQuestionIndex(targetIndex);
      }
    }
  };

  // Jump to working question
  const handleJumpToWorking = () => {
    saveCurrentAnswer();
    setViewingQuestionIndex(workingQuestionIndex);
    setCurrentQuestionIndex(workingQuestionIndex);
    loadAnswerForQuestion(workingQuestionIndex);
  };

  // End practice
  const handleEndPractice = () => {
    onEnd({
      answers,
      totalTime: Date.now() - startTime.current,
      completedCount: answers.filter(a => a !== null).length
    });
  };

  // Get correct answer letter for single choice
  const getCorrectAnswerLetter = (question: QuizQuestion) => {
    if (typeof question.answer === 'string') {
      return question.answer;
    }
    if (Array.isArray(question.answer) && question.answer.length > 0) {
      return question.answer[0];
    }
    return '';
  };

  // Check if answer is correct
  const isAnswerCorrect = () => {
    if (isSingleChoice) {
      return selectedAnswer === getCorrectAnswerLetter(currentQuestion);
    }
    if (isMultipleChoice) {
      const correctAnswers = Array.isArray(currentQuestion.answer) ? currentQuestion.answer : [];
      return selectedMultipleAnswers.length === correctAnswers.length &&
        selectedMultipleAnswers.every(a => correctAnswers.includes(a));
    }
    if (isFillInBlank) {
      const correctAnswers = Array.isArray(currentQuestion.answer) ? currentQuestion.answer : [currentQuestion.answer];
      const alternativeAnswers = currentQuestion.alternative_answers || [];
      const orderIndependentGroups = currentQuestion.extra_properties?.['order-independent-groups'] as number[][] | undefined;

      // Helper: normalize answer text
      const normalize = (text: string) => text.trim().toLowerCase();

      // Helper: check if a single answer matches (considering position-specific alternatives)
      const checkAnswerMatch = (userAns: string, correctAns: string, position: number): boolean => {
        const normalizedUserAns = normalize(userAns);
        const normalizedCorrectAns = normalize(String(correctAns));

        // Check main answer
        if (normalizedUserAns === normalizedCorrectAns) {
          return true;
        }

        // Check position-specific alternative answers
        const positionSpecific = alternativeAnswers
          .filter(alt => alt.startsWith(`[${position}]`))
          .map(alt => normalize(alt.replace(`[${position}]`, '')));

        if (positionSpecific.includes(normalizedUserAns)) {
          return true;
        }

        // Check general alternative answers
        const general = alternativeAnswers
          .filter(alt => !alt.includes('['))
          .map(alt => normalize(alt));

        return general.includes(normalizedUserAns);
      };

      // If no order-independent-groups, check exact positions only
      if (!orderIndependentGroups || orderIndependentGroups.length === 0) {
        return fillInBlankAnswers.every((userAns, idx) =>
          checkAnswerMatch(userAns, correctAnswers[idx], idx)
        );
      }

      // With order-independent-groups: implement bipartite matching
      const userMatched = new Array(fillInBlankAnswers.length).fill(false);
      const correctMatched = new Array(correctAnswers.length).fill(false);

      // Build map of position to group index
      const positionToGroup = new Map<number, number>();
      orderIndependentGroups.forEach((group, groupIndex) => {
        group.forEach(pos => positionToGroup.set(pos, groupIndex));
      });

      // Process each order-independent group
      for (const group of orderIndependentGroups) {
        for (const userIdx of group) {
          if (userMatched[userIdx]) continue;

          let matchFound = false;
          for (const correctIdx of group) {
            if (correctMatched[correctIdx]) continue;

            if (checkAnswerMatch(fillInBlankAnswers[userIdx], correctAnswers[correctIdx], correctIdx)) {
              userMatched[userIdx] = true;
              correctMatched[correctIdx] = true;
              matchFound = true;
              break;
            }
          }

          if (!matchFound) {
            return false;
          }
        }
      }

      // Check positions not in any group (must match exactly)
      for (let i = 0; i < correctAnswers.length; i++) {
        if (!positionToGroup.has(i)) {
          if (!checkAnswerMatch(fillInBlankAnswers[i], correctAnswers[i], i)) {
            return false;
          }
        }
      }

      return true;
    }
    return true;
  };

  // Submit answer (with optional answer for auto-submit)
  const handleSubmitAnswer = async (autoSubmitAnswer?: string) => {
    let answer = null;
    let answerPayload: string | string[] = ''; // Can be string or array for API

    if (isSingleChoice) {
      // Use auto-submit answer if provided, otherwise use selected
      answer = autoSubmitAnswer || selectedAnswer;
      answerPayload = answer || '';
    } else if (isMultipleChoice) {
      answer = selectedMultipleAnswers;
      answerPayload = selectedMultipleAnswers.join(',');
    } else if (isFillInBlank) {
      answer = fillInBlankAnswers;
      // For fill-in-blank, send array directly to backend
      // Only include answers up to the actual number of blanks in the question
      const blanksCount = (currentQuestion.question.match(/____/g) || []).length;
      const trimmedAnswers = fillInBlankAnswers.slice(0, Math.max(1, blanksCount));
      answerPayload = trimmedAnswers; // Send as array
    } else if (isEssay) {
      answer = essayAnswer;
      answerPayload = essayAnswer;
    }

    // Update answers and show result immediately (frontend validation)
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setShowResult(true);

    // Submit to backend asynchronously (doesn't block UI)
    if (sessionId && currentQuestion) {
      // Use setTimeout to ensure this runs after the UI updates
      setTimeout(async () => {
        try {
          const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
          const response = await api.practice.submitAnswer(
            sessionId,
            currentQuestion.id,
            answerPayload, // Send as string or array
            timeSpent
          );
          
          // Store the result from backend
          if (response.success) {
            console.log('Answer submitted to backend, is correct:', response.data?.isCorrect);
          }
        } catch (error) {
          console.error('Failed to submit answer to backend:', error);
          // Don't show error to user since the frontend already validated
        }
      }, 0);
    }
  };

  // Continue to next question
  const handleContinue = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setViewingQuestionIndex(nextIndex);
      setWorkingQuestionIndex(nextIndex);
      loadAnswerForQuestion(nextIndex);
    } else {
      handleEndPractice();
    }
  };

  // Reset question state
  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setSelectedMultipleAnswers([]);
    setEssayAnswer('');
    setFillInBlankAnswers([]);
    setShowResult(false);
    // Don't reset showHints - keep user's preference across questions
    setUserGaveUp(false); // Reset the gave up flag
  };

  // Render question with blanks for fill-in-blank
  const renderFillInBlankQuestion = (text: string) => {
    const parts = text.split(/____/);
    const hints = currentQuestion.hints || [];

    return (
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-tight tracking-wide">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < parts.length - 1 && (
                <input
                  type="text"
                  value={fillInBlankAnswers[index] || ''}
                  onChange={(e) => handleFillInBlankChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (showResult) {
                        // After showing result, Enter continues to next question
                        handleContinue();
                      } else {
                        // Before submission, Enter submits the answer
                        if (fillInBlankAnswers.some(a => a && a.trim())) {
                          handleSubmitAnswer();
                        }
                      }
                    } else if (e.key === 'Tab' && !e.shiftKey && index < parts.length - 2) {
                      // Tab to next blank (if not the last one)
                      e.preventDefault();
                      const nextInput = e.currentTarget.parentElement?.parentElement?.querySelectorAll('input')[index + 1];
                      if (nextInput instanceof HTMLInputElement) {
                        nextInput.focus();
                      }
                    } else if (e.key === 'Tab' && e.shiftKey && index > 0) {
                      // Shift+Tab to previous blank (if not the first one)
                      e.preventDefault();
                      const prevInput = e.currentTarget.parentElement?.parentElement?.querySelectorAll('input')[index - 1];
                      if (prevInput instanceof HTMLInputElement) {
                        prevInput.focus();
                      }
                    }
                  }}
                  readOnly={showResult}
                  className={`mx-2 px-3 py-1 border-b-2 ${showResult ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-blue-500'} text-center min-w-[100px] focus:outline-none focus:border-blue-700`}
                  placeholder={showHints && hints[index] ? hints[index] : ''}
                />
              )}
            </React.Fragment>
          ))}
        </h2>
      </div>
    );
  };

  // Render question with images
  const renderQuestionWithImages = (text: string, images?: string[]) => {
    return (
      <>
        <span>{text}</span>
        {images && images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4">
            {images.map((url, index) => (
              <img key={index} src={url} alt={`图片 ${index + 1}`} className="max-w-sm rounded-lg shadow-md" />
            ))}
          </div>
        )}
      </>
    );
  };

  const startTime = useRef(Date.now());

  // Handle report submission
  const handleReportSubmit = async (report: any) => {
    try {
      const response = await api.submitQuizReport(report);
      if (response.success) {
        success('问题已报告，感谢您的反馈！');
        setShowReportModal(false);
      } else {
        error('报告提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('报告提交失败，请稍后重试');
    }
  };

  // Render hint button for fill-in-blank questions
  const renderHintButton = () => {
    // Only show for fill-in-blank questions with hints
    if (!isFillInBlank) return null;
    if (!currentQuestion.hints || currentQuestion.hints.length === 0) return null;
    if (!currentQuestion.hints.some(h => h !== null)) return null;

    return (
      <button
        onClick={() => setShowHints(!showHints)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
          showHints
            ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
            : 'text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        <Lightbulb className="w-4 h-4" />
        <span>{showHints ? '隐藏提示' : '显示提示'}</span>
        <span className="text-xs opacity-75">({currentQuestion.hints.filter(h => h !== null).length})</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <QuizHeader
              currentQuestionIndex={currentQuestionIndex}
              viewingQuestionIndex={viewingQuestionIndex}
              workingQuestionIndex={workingQuestionIndex}
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answers={answers}
              isEssay={isEssay}
              onBack={onBack}
              onNavigatePrevious={handleNavigateToPrevious}
              onNavigateNext={handleNavigateToNext}
              onJumpToWorking={handleJumpToWorking}
              onEndPractice={handleEndPractice}
              onReadQuestion={readQuestion}
              onShowReportModal={() => setShowReportModal(true)}
              renderHintButton={renderHintButton}
            />

            {/* Render question based on type */}
            {isFillInBlank ? (
              <FillInBlankQuestion
                question={currentQuestion}
                answers={fillInBlankAnswers}
                showHints={showHints}
                showResult={showResult}
                isAnswerCorrect={isAnswerCorrect}
                sessionId={sessionId}
                userGaveUp={userGaveUp}
                onAnswerChange={handleFillInBlankChange}
                onToggleHints={() => setShowHints(!showHints)}
                onAiApproved={(userAnswer) => {
                  // Add the AI-approved answer to the question's alternative answers
                  if (currentQuestion.alternative_answers) {
                    currentQuestion.alternative_answers.push(userAnswer);
                  } else {
                    currentQuestion.alternative_answers = [userAnswer];
                  }
                  console.log('AI-approved answer added to alternatives:', userAnswer);
                  // Force re-render to update isAnswerCorrect() check
                  setForceUpdate(prev => prev + 1);
                }}
                renderQuestionWithBlanks={renderFillInBlankQuestion}
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-tight tracking-wide">
                {renderQuestionWithImages(currentQuestion.question, currentQuestion.images)}
              </h2>
            )}

            {/* Render answer options based on type */}
            {isSingleChoice && !isFillInBlank && currentQuestion.options && (
              <SingleChoiceQuestion
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                showResult={showResult}
                onAnswerSelect={handleSingleChoiceSelect}
                getCorrectAnswerLetter={getCorrectAnswerLetter}
                isAnswerCorrect={isAnswerCorrect}
              />
            )}

            {isMultipleChoice && currentQuestion.options && (
              <MultipleChoiceQuestion
                question={currentQuestion}
                selectedAnswers={selectedMultipleAnswers}
                showResult={showResult}
                onAnswerToggle={handleMultipleChoiceToggle}
                isAnswerCorrect={isAnswerCorrect}
              />
            )}

            {isEssay && (
              <EssayQuestion
                essayAnswer={essayAnswer}
                showResult={showResult}
                speechSupported={speechSupported}
                isListening={isListening}
                voiceTranscript={voiceTranscript}
                onAnswerChange={handleEssayChange}
                onToggleVoiceInput={toggleVoiceInput}
                onReadQuestion={readQuestion}
              />
            )}

            {/* Submit/Continue buttons */}
            <div className="flex justify-between mt-6">
              {!showResult ? (
                // Only show submit button for non-single-choice questions
                !isSingleChoice ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSubmitAnswer()}
                      disabled={
                        (isMultipleChoice && selectedMultipleAnswers.length === 0) ||
                        (isFillInBlank && (fillInBlankAnswers.length === 0 || fillInBlankAnswers.every(a => !a || a.trim() === ''))) ||
                        (isEssay && !essayAnswer.trim())
                      }
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      提交答案
                    </button>
                    {/* Show "Don't know" button for fill-in-blank questions */}
                    {isFillInBlank && (
                      <button
                        onClick={() => {
                          // Submit with empty answers to see the correct answers
                          const emptyAnswers = new Array(
                            (currentQuestion.question.match(/_{2,}/g) || []).length
                          ).fill('');
                          setFillInBlankAnswers(emptyAnswers);
                          setUserGaveUp(true); // Mark that user gave up
                          handleSubmitAnswer();
                        }}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        不知道，直接看答案
                      </button>
                    )}
                  </div>
                ) : (
                  // For single-choice, show hint text
                  <div className="text-sm text-gray-500 italic">
                    点击选项即可查看答案
                  </div>
                )
              ) : (
                <button
                  onClick={handleContinue}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {currentQuestionIndex < questions.length - 1 ? '继续' : '结束练习'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && currentQuestion && (
        <ReportModal
          quiz={currentQuestion}
          sessionId={sessionId}
          userAnswer={
            isSingleChoice ? (selectedAnswer || '') : 
            isMultipleChoice ? (selectedMultipleAnswers.length > 0 ? selectedMultipleAnswers.join(',') : '') :
            isFillInBlank ? (fillInBlankAnswers.length > 0 ? fillInBlankAnswers.join(',') : '') :
            (essayAnswer || '')
          }
          onSubmit={handleReportSubmit}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};