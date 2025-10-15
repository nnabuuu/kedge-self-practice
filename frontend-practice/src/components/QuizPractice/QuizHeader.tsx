import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Home, CheckCircle, Volume2, Flag } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';

interface QuizHeaderProps {
  currentQuestionIndex: number;
  viewingQuestionIndex: number;
  workingQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: QuizQuestion;
  answers: any[];
  isEssay: boolean;
  onBack: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onJumpToWorking: () => void;
  onEndPractice: () => void;
  onReadQuestion: () => void;
  onShowReportModal: () => void;
  renderHintButton?: () => React.ReactNode;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentQuestionIndex,
  viewingQuestionIndex,
  workingQuestionIndex,
  totalQuestions,
  currentQuestion,
  answers,
  isEssay,
  onBack,
  onNavigatePrevious,
  onNavigateNext,
  onJumpToWorking,
  onEndPractice,
  onReadQuestion,
  onShowReportModal,
  renderHintButton
}) => {
  const getQuestionTypeLabel = () => {
    switch (currentQuestion.type) {
      case 'single-choice': return '单选';
      case 'multiple-choice': return '多选';
      case 'fill-in-the-blank': return '填空';
      case 'subjective': return '问答';
      default: return '其他';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-3 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium tracking-wide text-sm">返回</span>
        </button>
        
        {/* Extended progress bar for desktop */}
        <div className="hidden md:flex flex-1 items-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl shadow-lg px-3 py-1.5">
          <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="text-xs font-medium text-gray-600 ml-2">
            {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation buttons - always visible */}
          <div className="flex items-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl shadow-lg">
            <button
              onClick={onNavigatePrevious}
              disabled={viewingQuestionIndex === 0}
              className="p-1.5 text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded-l-xl"
              title="上一题"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={viewingQuestionIndex !== workingQuestionIndex ? onJumpToWorking : undefined}
              disabled={viewingQuestionIndex === workingQuestionIndex}
              className={`px-2 py-1.5 transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none border-x border-gray-200 ${
                viewingQuestionIndex === workingQuestionIndex
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
              title={viewingQuestionIndex !== workingQuestionIndex ? `返回当前题 (第${workingQuestionIndex + 1}题)` : '当前题'}
            >
              <Home className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateNext}
              disabled={viewingQuestionIndex === totalQuestions - 1}
              className="p-1.5 text-gray-600 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded-r-xl"
              title="下一题"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm text-gray-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg font-medium tracking-wide">
            <span className="flex items-center gap-1">
              {getQuestionTypeLabel()} •
              <span className={viewingQuestionIndex !== workingQuestionIndex ? 'text-orange-600' : ''}>
                {currentQuestionIndex + 1}
              </span>
              /{totalQuestions}
              {answers[currentQuestionIndex] !== null && answers[currentQuestionIndex] !== undefined && (
                <CheckCircle className="w-3 h-3 text-green-600 ml-1" />
              )}
            </span>
          </div>
          
          {isEssay && (
            <button
              onClick={onReadQuestion}
              className="p-1.5 text-gray-600 hover:text-blue-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              title="朗读题目"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onEndPractice}
            className="px-3 py-1.5 text-sm bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm text-gray-700 hover:text-gray-900 rounded-xl hover:bg-white/90 transition-all duration-300 ease-out shadow-lg hover:shadow-xl font-medium tracking-wide focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
          >
            结束练习
          </button>
        </div>
      </div>

      {/* Mobile progress bar */}
      <div className="md:hidden mb-4 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5 font-medium tracking-wide">
          <span>进度</span>
          <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question header with hint and report buttons */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">
              第 {currentQuestionIndex + 1} 题 / 共 {totalQuestions} 题
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500">
              {currentQuestion.type === 'single-choice' && '单选题'}
              {currentQuestion.type === 'multiple-choice' && '多选题'}
              {currentQuestion.type === 'fill-in-the-blank' && '填空题'}
              {currentQuestion.type === 'subjective' && '问答题'}
              {currentQuestion.type === 'other' && '其他'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderHintButton && renderHintButton()}
          <button
            onClick={onShowReportModal}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="报告问题"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">报告问题</span>
          </button>
        </div>
      </div>
    </>
  );
};