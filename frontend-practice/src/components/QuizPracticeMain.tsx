import React, { useState, useRef, useEffect } from 'react';
import { QuizQuestion } from '../types/quiz';
import { api } from '../services/api';
import ReportModal from './ReportModal';
import MyReports from './MyReports';

import {
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  FillInBlankQuestion,
  EssayQuestion,
  QuizHeader
} from './QuizPractice';

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
  const [showMyReports, setShowMyReports] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isSingleChoice = currentQuestion?.type === 'single-choice';
  const isMultipleChoice = currentQuestion?.type === 'multiple-choice';
  const isFillInBlank = currentQuestion?.type === 'fill-in-the-blank';
  const isEssay = currentQuestion?.type === 'subjective';

  const speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Initialize fill-in-blank answers when question changes
  useEffect(() => {
    if (isFillInBlank && currentQuestion) {
      const blanksCount = (currentQuestion.question.match(/_{2,}/g) || []).length;
      if (fillInBlankAnswers.length !== blanksCount) {
        setFillInBlankAnswers(new Array(blanksCount).fill(''));
      }
    }
  }, [currentQuestionIndex, isFillInBlank]);

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

  // Navigate to previous question
  const handleNavigateToPrevious = () => {
    if (viewingQuestionIndex > 0) {
      setViewingQuestionIndex(viewingQuestionIndex - 1);
      setCurrentQuestionIndex(viewingQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const handleNavigateToNext = () => {
    if (viewingQuestionIndex < questions.length - 1) {
      setViewingQuestionIndex(viewingQuestionIndex + 1);
      setCurrentQuestionIndex(viewingQuestionIndex + 1);
    }
  };

  // Jump to working question
  const handleJumpToWorking = () => {
    setViewingQuestionIndex(workingQuestionIndex);
    setCurrentQuestionIndex(workingQuestionIndex);
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
      return fillInBlankAnswers.every((ans, idx) => ans === correctAnswers[idx]);
    }
    return true;
  };

  // Submit answer (with optional answer for auto-submit)
  const handleSubmitAnswer = (autoSubmitAnswer?: string) => {
    let answer = null;
    if (isSingleChoice) {
      // Use auto-submit answer if provided, otherwise use selected
      answer = autoSubmitAnswer || selectedAnswer;
    } else if (isMultipleChoice) {
      answer = selectedMultipleAnswers;
    } else if (isFillInBlank) {
      answer = fillInBlankAnswers;
    } else if (isEssay) {
      answer = essayAnswer;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  // Continue to next question
  const handleContinue = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setViewingQuestionIndex(currentQuestionIndex + 1);
      setWorkingQuestionIndex(currentQuestionIndex + 1);
      resetQuestionState();
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
    setShowHints(false);
  };

  // Render question with blanks for fill-in-blank
  const renderFillInBlankQuestion = (text: string) => {
    const parts = text.split(/_{2,}/g);
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
                  disabled={showResult}
                  className="mx-2 px-3 py-1 border-b-2 border-blue-500 text-center min-w-[100px] focus:outline-none focus:border-blue-700"
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
        alert('问题已报告，感谢您的反馈！');
        setShowReportModal(false);
      } else {
        alert('报告提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('报告提交失败，请稍后重试');
    }
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
              onShowMyReports={() => setShowMyReports(true)}
            />

            {/* Render question based on type */}
            {isFillInBlank ? (
              <FillInBlankQuestion
                question={currentQuestion}
                answers={fillInBlankAnswers}
                showHints={showHints}
                onAnswerChange={handleFillInBlankChange}
                onToggleHints={() => setShowHints(!showHints)}
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
                  <button
                    onClick={() => handleSubmitAnswer()}
                    disabled={
                      (isMultipleChoice && selectedMultipleAnswers.length === 0) ||
                      (isFillInBlank && (fillInBlankAnswers.length === 0 || fillInBlankAnswers.some(a => !a || a.trim() === ''))) ||
                      (isEssay && !essayAnswer.trim())
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    提交答案
                  </button>
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
      
      {/* My Reports Modal */}
      {showMyReports && (
        <MyReports
          onClose={() => setShowMyReports(false)}
        />
      )}
    </div>
  );
};