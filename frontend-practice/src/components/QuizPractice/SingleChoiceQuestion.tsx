import React from 'react';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';
import { KnowledgePointDisplay } from './KnowledgePointDisplay';

interface SingleChoiceQuestionProps {
  question: QuizQuestion;
  selectedAnswer: string | null;
  showResult: boolean;
  onAnswerSelect: (answer: string) => void;
  getCorrectAnswerLetter: (question: QuizQuestion) => string;
  isAnswerCorrect: () => boolean;
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  selectedAnswer,
  showResult,
  onAnswerSelect,
  getCorrectAnswerLetter,
  isAnswerCorrect
}) => {
  if (!question.options) return null;

  // Convert array options to object with letter keys (A, B, C, D...)
  const optionsWithLetters = Array.isArray(question.options)
    ? question.options.map((option, index) => ({
        key: String.fromCharCode(65 + index), // 65 is 'A' in ASCII
        value: option
      }))
    : Object.entries(question.options).map(([key, option]) => ({
        key,
        value: option
      }));

  return (
    <>
      <div className="space-y-4 mb-8">
        {optionsWithLetters.map(({ key, value: option }) => (
          <button
            key={key}
            onClick={() => !showResult && onAnswerSelect(key)}
            disabled={showResult}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ease-out ${
              showResult
                ? key === getCorrectAnswerLetter(question)
                  ? 'border-green-500 bg-green-50 text-green-800 shadow-lg shadow-green-500/25'
                  : key === selectedAnswer && key !== getCorrectAnswerLetter(question)
                  ? 'border-red-500 bg-red-50 text-red-800 shadow-lg shadow-red-500/25'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
                : selectedAnswer === key
                ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-lg shadow-blue-500/25'
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium tracking-wide">{key}. {option}</span>
              {showResult && key === getCorrectAnswerLetter(question) && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              {showResult && key === selectedAnswer && key !== getCorrectAnswerLetter(question) && (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* 单选题解析 - 仅在答错时显示 */}
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

      {/* 知识点 - 仅在答错时显示 */}
      {showResult && !isAnswerCorrect() && <KnowledgePointDisplay question={question} />}
    </>
  );
};