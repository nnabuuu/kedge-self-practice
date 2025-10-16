import React, { useState, useRef, useEffect } from 'react';
import { QuizQuestion } from '../types/quiz';
import { api } from '../services/api';
import ReportModal from './ReportModal';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
  resumeData?: {
    submittedAnswers: any[];
    currentQuestionIndex: number;
  } | null;
  onEnd: (results: any) => void;
  onBack: () => void;
}

export default function QuizPractice({
  questions,
  sessionId,
  resumeData,
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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(resumeData?.currentQuestionIndex || 0);
  const [viewingQuestionIndex, setViewingQuestionIndex] = useState(resumeData?.currentQuestionIndex || 0);
  const [workingQuestionIndex, setWorkingQuestionIndex] = useState(resumeData?.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<any[]>(() => {
    if (resumeData?.submittedAnswers && resumeData.submittedAnswers.length > 0) {
      console.log('[QuizPracticeMain] Restoring submitted answers:', resumeData.submittedAnswers);
      return resumeData.submittedAnswers;
    }
    return Array(questions.length).fill(null);
  });
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
  const lastSubmissionTime = useRef<number>(0); // Track when answer was last submitted
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

      // Check if enough time has passed since last submission (prevent accidental double-Enter)
      const timeSinceSubmission = Date.now() - lastSubmissionTime.current;
      const minDelay = 300; // 300ms delay to ensure user sees the result

      // Verify current question has been answered before allowing continue
      const currentQuestionAnswered = answers[currentQuestionIndex] !== null && answers[currentQuestionIndex] !== undefined;

      if (e.key === 'Enter' && showResult && !isInputField && timeSinceSubmission >= minDelay && currentQuestionAnswered) {
        e.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showResult, currentQuestionIndex, questions.length, answers]);

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
    // Don't overwrite already-submitted answers
    // If showResult is true, the answer has already been submitted via handleSubmitAnswer()
    if (showResult) {
      return;
    }

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
    setUserGaveUp(false);

    // Check if this question has been answered (submitted)
    const hasBeenAnswered = savedAnswer !== null && savedAnswer !== undefined;

    // Load saved answer if exists
    if (hasBeenAnswered) {
      // Show result if question was already answered
      console.log('[loadAnswerForQuestion] Question has been answered, setting showResult=true, savedAnswer:', savedAnswer);
      setShowResult(true);

      if (targetQuestion.type === 'single-choice') {
        console.log('[loadAnswerForQuestion] Setting selectedAnswer for single-choice:', savedAnswer);
        setSelectedAnswer(savedAnswer);
      } else if (targetQuestion.type === 'multiple-choice') {
        setSelectedMultipleAnswers(Array.isArray(savedAnswer) ? savedAnswer : []);
      } else if (targetQuestion.type === 'fill-in-the-blank') {
        setFillInBlankAnswers(Array.isArray(savedAnswer) ? savedAnswer : []);
      } else if (targetQuestion.type === 'subjective') {
        setEssayAnswer(savedAnswer);
      }
    } else {
      // Question not yet answered
      console.log('[loadAnswerForQuestion] Question not answered yet, setting showResult=false');
      setShowResult(false);
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

  // Jump to first unanswered question
  const handleJumpToWorking = () => {
    saveCurrentAnswer();

    // Find the first unanswered question
    const firstUnansweredIndex = answers.findIndex(answer => answer === null || answer === undefined);

    // If all questions are answered, go to the last question
    const targetIndex = firstUnansweredIndex !== -1 ? firstUnansweredIndex : questions.length - 1;

    setViewingQuestionIndex(targetIndex);
    setCurrentQuestionIndex(targetIndex);
    setWorkingQuestionIndex(targetIndex);
    loadAnswerForQuestion(targetIndex);
  };

  // Check if all questions have been answered
  const hasUnansweredQuestions = () => {
    return answers.some((answer, index) => {
      // Check if this question exists and was not answered
      return index < questions.length && (answer === null || answer === undefined);
    });
  };

  // Get the index of the first unanswered question
  const getFirstUnansweredIndex = () => {
    return answers.findIndex((answer, index) => {
      return index < questions.length && (answer === null || answer === undefined);
    });
  };

  // Navigate to the first unanswered question
  const goToFirstUnanswered = () => {
    const firstUnanswered = getFirstUnansweredIndex();
    if (firstUnanswered >= 0) {
      saveCurrentAnswer();
      setCurrentQuestionIndex(firstUnanswered);
      setViewingQuestionIndex(firstUnanswered);
      setWorkingQuestionIndex(firstUnanswered);
      loadAnswerForQuestion(firstUnanswered);
    }
  };

  // End practice
  const handleEndPractice = () => {
    onEnd({
      answers,
      totalTime: Date.now() - startTime.current,
      completedCount: answers.filter(a => a !== null).length
    });
  };

  /**
   * Get correct answer INDEX for single choice questions.
   * STANDARD: Use indices (numbers) as single source of truth, not letters.
   * Returns: 0 for A, 1 for B, 2 for C, etc.
   */
  const getCorrectAnswerIndex = (question: QuizQuestion): number => {
    // Primary: Use answer_index if available
    if (question.answer_index && Array.isArray(question.answer_index) && question.answer_index.length > 0) {
      const index = question.answer_index[0];
      console.log('[getCorrectAnswerIndex] ✅ Using answer_index:', index);
      return index;
    }

    // Fallback 1: If answer is a letter, convert to index
    let answerValue = '';
    if (typeof question.answer === 'string') {
      answerValue = question.answer;
    } else if (Array.isArray(question.answer) && question.answer.length > 0) {
      answerValue = question.answer[0];
    }

    if (answerValue && /^[A-Z]$/i.test(answerValue)) {
      const index = answerValue.toUpperCase().charCodeAt(0) - 65;
      console.log('[getCorrectAnswerIndex] ⚠️ Converted letter to index:', answerValue, '→', index);
      return index;
    }

    // Fallback 2: If answer is option text, find it in options
    if (question.options && Array.isArray(question.options)) {
      const index = question.options.findIndex(opt => opt === answerValue);
      if (index >= 0) {
        console.log('[getCorrectAnswerIndex] ⚠️ Found answer in options at index:', index);
        return index;
      }
    }

    console.error('[getCorrectAnswerIndex] ❌ Could not determine correct answer index!', {
      answer: question.answer,
      answer_index: question.answer_index,
      options: question.options
    });
    return -1;
  };

  /**
   * Get user's selected answer INDEX.
   * Converts letter format to index.
   */
  const getSelectedAnswerIndex = (answer: string | null): number => {
    if (!answer) return -1;

    // If it's a letter, convert to index
    if (answer.length === 1 && /^[A-Z]$/i.test(answer)) {
      const index = answer.toUpperCase().charCodeAt(0) - 65;
      return index;
    }

    // If it's already a number string, parse it
    const parsed = parseInt(answer, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }

    return -1;
  };

  /**
   * Legacy function for backward compatibility - converts index to letter for display.
   */
  const getCorrectAnswerLetter = (question: QuizQuestion): string => {
    const index = getCorrectAnswerIndex(question);
    if (index >= 0) {
      return String.fromCharCode(65 + index);
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
    lastSubmissionTime.current = Date.now(); // Record submission time to prevent accidental double-Enter

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

  // Render question with inline images (replaces {{img:N}} placeholders)
  const renderQuestionWithImages = (text: string, images?: string[]) => {
    if (!text) return null;

    // Handle different image placeholder formats
    // Format 1: {{img:0}}, {{img:1}}, etc. (index-based)
    // Format 2: {{image:uuid}} (UUID-based)

    const parts = text.split(/(\{\{(?:img|image):[^}]+\}\})/g);

    return (
      <>
        {parts.map((part, index) => {
          // Check if this part is an image placeholder
          const imgMatch = part.match(/\{\{(?:img|image):([^}]+)\}\}/);

          if (imgMatch) {
            const imageRef = imgMatch[1];
            let imageUrl: string | undefined;

            // Check if it's an index (number)
            if (/^\d+$/.test(imageRef)) {
              const imageIndex = parseInt(imageRef);
              imageUrl = images?.[imageIndex];
            } else {
              // It's a UUID or filename, construct the URL
              // Check if it's already a full URL
              if (imageRef.startsWith('http') || imageRef.startsWith('/')) {
                imageUrl = imageRef;
              } else {
                // Use the simplified attachment API: /attachments/:fileId
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
                  ? import.meta.env.VITE_API_BASE_URL
                  : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1`;

                const hasExtension = /\.\w+$/.test(imageRef);
                const fileId = hasExtension ? imageRef : `${imageRef}.png`;
                imageUrl = `${API_BASE_URL}/attachments/${fileId}`;
              }
            }

            if (imageUrl) {
              // Add JWT token to image URL if needed for authentication
              const token = localStorage.getItem('jwt_token');
              const authenticatedUrl = token && imageUrl.includes('/attachments/')
                ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
                : imageUrl;

              return (
                <div key={index} className="my-3">
                  <img
                    src={authenticatedUrl}
                    alt={`Quiz image ${imageRef}`}
                    className="max-w-full h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=';
                      target.alt = 'Image not available';
                    }}
                  />
                </div>
              );
            } else {
              // No image URL available, show placeholder
              return (
                <div key={index} className="my-3 p-4 bg-gray-100 rounded-lg text-gray-500 text-sm">
                  图片加载失败: {imageRef}
                </div>
              );
            }
          } else {
            // Regular text
            return <span key={index}>{part}</span>;
          }
        })}
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
            {isSingleChoice && !isFillInBlank && currentQuestion.options && (() => {
              const correctIndex = getCorrectAnswerIndex(currentQuestion);
              const selectedIndex = getSelectedAnswerIndex(selectedAnswer);
              const correctLetter = String.fromCharCode(65 + correctIndex);
              console.log('[QuizPracticeMain] Rendering SingleChoiceQuestion:', {
                questionId: currentQuestion.id,
                selectedAnswer_letter: selectedAnswer,
                selectedAnswer_index: selectedIndex,
                correctAnswer_letter: correctLetter,
                correctAnswer_index: correctIndex,
                showResult,
                matches: selectedIndex === correctIndex
              });
              return (
                <SingleChoiceQuestion
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  showResult={showResult}
                  onAnswerSelect={handleSingleChoiceSelect}
                  getCorrectAnswerLetter={getCorrectAnswerLetter}
                  isAnswerCorrect={isAnswerCorrect}
                />
              );
            })()}

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
                          // Submit with placeholder text to indicate user gave up
                          const blanksCount = (currentQuestion.question.match(/_{2,}/g) || []).length;
                          const placeholderAnswers = new Array(Math.max(1, blanksCount)).fill('(未填写)');
                          setFillInBlankAnswers(placeholderAnswers);
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
                // After answering: show Previous and Next/Continue buttons
                <>
                  <button
                    onClick={handleNavigateToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="w-36 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium shadow-lg hover:shadow-xl relative"
                  >
                    <ChevronLeft className="w-5 h-5 absolute left-3" />
                    <span>上一题</span>
                  </button>
                  <div className="flex flex-col items-center gap-1">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        <button
                          onClick={handleContinue}
                          className="w-36 h-12 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-lg font-medium shadow-lg hover:shadow-xl relative"
                        >
                          <span className="relative">
                            下一题
                            <ChevronRight className="w-5 h-5 absolute -right-7 top-1/2 -translate-y-1/2" />
                          </span>
                        </button>
                        <span className="text-xs text-gray-500">(回车键)</span>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={hasUnansweredQuestions() ? goToFirstUnanswered : handleContinue}
                          className={`w-36 h-12 rounded-lg transition-colors flex items-center justify-center text-lg font-medium shadow-lg hover:shadow-xl ${
                            hasUnansweredQuestions()
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <span>{hasUnansweredQuestions() ? '查看未答题' : '结束练习'}</span>
                        </button>
                        {hasUnansweredQuestions() ? (
                          <span className="text-xs text-orange-600 font-medium">还有题目未完成</span>
                        ) : (
                          <span className="text-xs text-gray-500">(回车键)</span>
                        )}
                      </>
                    )}
                  </div>
                </>
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