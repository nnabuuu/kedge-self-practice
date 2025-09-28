import React from 'react';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';

interface MultipleChoiceQuestionProps {
  question: QuizQuestion;
  selectedAnswers: string[];
  showResult: boolean;
  onAnswerToggle: (answer: string) => void;
  isAnswerCorrect: () => boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  selectedAnswers,
  showResult,
  onAnswerToggle,
  isAnswerCorrect
}) => {
  if (!question.options) return null;

  return (
    <>
      <div className="space-y-4 mb-8">
        <div className="text-sm text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <span className="font-medium text-yellow-800">多选题提示：</span>
          <span className="text-yellow-700">请选择所有正确答案，可以选择多个选项</span>
        </div>
        {Object.entries(question.options).map(([key, option]) => {
          const isSelected = selectedAnswers.includes(key);
          const isCorrect = Array.isArray(question.answer) && question.answer.includes(key);
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowWrong = showResult && isSelected && !isCorrect;
          
          return (
            <button
              key={key}
              onClick={() => !showResult && onAnswerToggle(key)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ease-out ${
                shouldShowCorrect
                  ? 'border-green-500 bg-green-50 text-green-800 shadow-lg shadow-green-500/25'
                  : shouldShowWrong
                  ? 'border-red-500 bg-red-50 text-red-800 shadow-lg shadow-red-500/25'
                  : showResult
                  ? 'border-gray-200 bg-gray-50 text-gray-500'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-lg shadow-blue-500/25'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium tracking-wide">{key}. {option}</span>
                </div>
                {shouldShowCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {shouldShowWrong && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* 多选题解析 - 仅在答错时显示 */}
      {showResult && !isAnswerCorrect() && question.explanation && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center mb-2">
            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-semibold text-blue-800">💡 题目解析</span>
          </div>
          <p className="text-blue-700 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </>
  );
};