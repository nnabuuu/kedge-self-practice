import React from 'react';
import { QuizQuestion } from '../../types/quiz';
import { CheckCircle2, XCircle, BookOpen } from 'lucide-react';

interface FillInBlankQuestionProps {
  question: QuizQuestion;
  answers: string[];
  showHints: boolean;
  showResult: boolean;
  isAnswerCorrect: () => boolean;
  onAnswerChange: (index: number, value: string) => void;
  onToggleHints: () => void;
  renderQuestionWithBlanks: (text: string) => React.ReactNode;
}

export const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  question,
  answers,
  showHints,
  showResult,
  isAnswerCorrect,
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
      
      {/* Show result after submission */}
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg ${isAnswerCorrect() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center mb-2">
            {isAnswerCorrect() ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-semibold text-green-800">回答正确！</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-semibold text-red-800">回答错误</span>
              </>
            )}
          </div>
          
          {/* Show correct answers */}
          {!isAnswerCorrect() && (
            <div className="mt-3 text-sm">
              <div className="font-medium text-gray-700 mb-2">正确答案：</div>
              <div className="space-y-1">
                {Array.isArray(question.answer) ? (
                  question.answer.map((ans, idx) => (
                    <div key={idx} className="text-gray-600">
                      空格 {idx + 1}: <span className="font-medium text-green-700">{ans}</span>
                      {answers[idx] && answers[idx] !== ans && (
                        <span className="ml-2 text-red-600">(你的答案: {answers[idx]})</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-green-700 font-medium">{question.answer}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Show explanation if available */}
          {!isAnswerCorrect() && question.explanation && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">💡 题目解析</span>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};