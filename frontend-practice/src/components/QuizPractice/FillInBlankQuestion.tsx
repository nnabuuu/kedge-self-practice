import React from 'react';
import { QuizQuestion } from '../../types/quiz';

interface FillInBlankQuestionProps {
  question: QuizQuestion;
  answers: string[];
  showHints: boolean;
  onAnswerChange: (index: number, value: string) => void;
  onToggleHints: () => void;
  renderQuestionWithBlanks: (text: string) => React.ReactNode;
}

export const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  question,
  answers,
  showHints,
  onAnswerChange,
  onToggleHints,
  renderQuestionWithBlanks
}) => {
  const blanksCount = question.question.split(/_{2,}/g).length - 1;

  return (
    <div className="mb-6">
      {/* Hint toggle button for fill-in-blank questions */}
      {question.hints && question.hints.length > 0 && question.hints.some(h => h !== null) && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={onToggleHints}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>{showHints ? '隐藏' : '显示'}提示</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showHints ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
      
      {renderQuestionWithBlanks(question.question)}
      
      {question.images && question.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {question.images.map((url, index) => (
            <img key={index} src={url} alt={`图片 ${index + 1}`} className="max-w-sm rounded-lg shadow-md" />
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
        <span className="font-medium">提示：</span>
        {(() => {
          if (blanksCount === 0) {
            return "请在输入框中填写答案，按 Enter 键提交";
          } else if (blanksCount > 1) {
            return "使用 Tab 键在空格之间切换，Shift+Tab 返回上一个空格。填写完所有空格后按 Enter 键提交答案";
          } else {
            return "填写完空格后按 Enter 键提交答案";
          }
        })()}
      </div>
    </div>
  );
};