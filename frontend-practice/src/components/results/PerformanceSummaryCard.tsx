import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PerformanceSummaryCardProps {
  performance: {
    level: string;
    color: string;
    bgColor: string;
    icon: LucideIcon;
    message: string;
    motivation: string;
  };
  accuracy: number;
  subjectName: string;
  hasEssayQuestions: boolean;
  hasMultipleChoiceQuestions: boolean;
}

export default function PerformanceSummaryCard({
  performance,
  accuracy,
  subjectName,
  hasEssayQuestions,
  hasMultipleChoiceQuestions
}: PerformanceSummaryCardProps) {
  const PerformanceIcon = performance.icon;

  return (
    <div className="text-center mb-12">
      <div className={`inline-flex items-center justify-center w-24 h-24 ${performance.bgColor} rounded-3xl mb-6 shadow-xl transform hover:scale-105 transition-all duration-300`}>
        <PerformanceIcon className={`w-12 h-12 ${performance.color}`} />
      </div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight tracking-wide">
        {performance.message}
      </h1>
      <div className={`inline-flex items-center px-8 py-4 ${performance.bgColor} rounded-2xl mb-4 shadow-lg`}>
        {hasEssayQuestions && !hasMultipleChoiceQuestions ? (
          <div className="text-center">
            <div className={`text-xl font-bold ${performance.color} tracking-wide`}>{performance.level}</div>
            <div className={`text-sm ${performance.color} opacity-80`}>问答题练习</div>
          </div>
        ) : (
          <>
            <span className={`text-3xl font-bold ${performance.color} mr-3`}>
              {accuracy}%
            </span>
            <div className="text-left">
              <div className={`text-xl font-bold ${performance.color} tracking-wide`}>{performance.level}</div>
              <div className={`text-sm ${performance.color} opacity-80`}>{subjectName}练习</div>
            </div>
          </>
        )}
      </div>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed tracking-wide">
        {performance.motivation}
      </p>
    </div>
  );
}
