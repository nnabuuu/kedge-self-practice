import React from 'react';

interface AnswerDistributionChartProps {
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  totalQuestions: number;
}

export default function AnswerDistributionChart({
  correctAnswers,
  wrongAnswers,
  unansweredQuestions,
  totalQuestions
}: AnswerDistributionChartProps) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">答题分布</h4>
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="w-20 text-sm text-gray-600 tracking-wide">正确</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 mx-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-medium text-green-600">{correctAnswers}题</div>
        </div>
        <div className="flex items-center">
          <div className="w-20 text-sm text-gray-600 tracking-wide">错误</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 mx-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${(wrongAnswers / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-medium text-red-600">{wrongAnswers}题</div>
        </div>
        <div className="flex items-center">
          <div className="w-20 text-sm text-gray-600 tracking-wide">未答</div>
          <div className="flex-1 bg-gray-200 rounded-full h-3 mx-3">
            <div
              className="bg-gray-400 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${(unansweredQuestions / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-medium text-gray-600">{unansweredQuestions}题</div>
        </div>
      </div>
    </div>
  );
}
