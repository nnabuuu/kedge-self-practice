import React from 'react';
import { BookOpen } from 'lucide-react';
import { QuizQuestion } from '../../../types/quiz';

interface AnswerComparisonDisplayProps {
  question: QuizQuestion;
  answers: string[];
  showResult: boolean;
  isAnswerCorrect: boolean;
}

export const AnswerComparisonDisplay: React.FC<AnswerComparisonDisplayProps> = ({
  question,
  answers,
  showResult,
  isAnswerCorrect,
}) => {
  // Don't show if result is not displayed yet or answer is correct
  if (!showResult || isAnswerCorrect) {
    return null;
  }

  // Extract order-independent-groups
  const orderIndependentGroups = question.extra_properties?.['order-independent-groups'] as number[][] | undefined;

  // Helper: find which group a position belongs to
  const findGroup = (position: number): number | null => {
    if (!orderIndependentGroups) return null;
    const groupIndex = orderIndependentGroups.findIndex(group => group.includes(position));
    return groupIndex >= 0 ? groupIndex : null;
  };

  // Helper: get group color
  const getGroupColor = (groupIndex: number): string => {
    const colors = [
      'bg-blue-50 border-blue-200',
      'bg-purple-50 border-purple-200',
      'bg-green-50 border-green-200',
      'bg-yellow-50 border-yellow-200'
    ];
    return colors[groupIndex % colors.length];
  };

  return (
    <div className="mt-3">
      <div className="space-y-2">
        {Array.isArray(question.answer) ? (
          <>
            {/* Multiple blanks */}
            {question.answer.map((correctAns, idx) => {
              const groupIndex = findGroup(idx);
              const hasGroup = groupIndex !== null;
              const groupColor = hasGroup ? getGroupColor(groupIndex) : 'border-gray-200';

              return (
                <div key={idx} className={`bg-white rounded-lg p-3 border ${groupColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-500">空格 {idx + 1}</div>
                    {hasGroup && (
                      <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                        <span>⇄</span>
                        <span>可互换 (组 {groupIndex! + 1})</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">你的答案</div>
                      <div className={`font-medium ${answers[idx] ? 'text-red-600' : 'text-gray-400'}`}>
                        {answers[idx] || '(未填写)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">正确答案</div>
                      <div className="font-medium text-green-600">
                        {correctAns}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Order-independent groups info box */}
            {orderIndependentGroups && orderIndependentGroups.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-1">💡 提示</div>
                <div className="text-xs text-blue-700">
                  标有 <span className="font-medium">⇄ 可互换</span> 的空格可以任意调换顺序，只要答案正确即可。
                </div>
              </div>
            )}
          </>
        ) : (
          /* Single blank */
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">你的答案</div>
                <div className={`font-medium ${answers[0] ? 'text-red-600' : 'text-gray-400'}`}>
                  {answers[0] || '(未填写)'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">正确答案</div>
                <div className="font-medium text-green-600">
                  {question.answer}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show explanation if available */}
      {question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">💡 题目解析</span>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
