import React from 'react';
import { CheckCircle2, MessageSquare, BookOpen, Loader2 } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';

interface TypeDistribution {
  distribution: Array<{
    type: string;
    displayName: string;
    count: number;
    percentage: number;
  }>;
  total: number;
}

interface QuestionTypeDistributionProps {
  typeDistribution: TypeDistribution | null;
  typeDistributionLoading: boolean;
  hasMultipleChoiceQuestions: boolean;
  hasEssayQuestions: boolean;
  questions: QuizQuestion[];
}

export default function QuestionTypeDistribution({
  typeDistribution,
  typeDistributionLoading,
  hasMultipleChoiceQuestions,
  hasEssayQuestions,
  questions
}: QuestionTypeDistributionProps) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">题型分布</h4>
      {typeDistributionLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">加载题型分布...</span>
        </div>
      ) : typeDistribution && typeDistribution.distribution.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {typeDistribution.distribution.map((item) => {
            // Choose icon based on type
            const Icon =
              item.type === 'single-choice' || item.type === 'multiple-choice' ? CheckCircle2 :
              item.type === 'essay' || item.type === 'subjective' ? MessageSquare :
              BookOpen;

            // Get style classes based on type
            let bgClass, textClass, textBoldClass;
            if (item.type === 'single-choice') {
              bgClass = 'bg-blue-50';
              textClass = 'text-blue-800';
              textBoldClass = 'text-blue-600';
            } else if (item.type === 'multiple-choice') {
              bgClass = 'bg-indigo-50';
              textClass = 'text-indigo-800';
              textBoldClass = 'text-indigo-600';
            } else if (item.type === 'fill-in-the-blank') {
              bgClass = 'bg-green-50';
              textClass = 'text-green-800';
              textBoldClass = 'text-green-600';
            } else if (item.type === 'essay' || item.type === 'subjective') {
              bgClass = 'bg-purple-50';
              textClass = 'text-purple-800';
              textBoldClass = 'text-purple-600';
            } else {
              bgClass = 'bg-gray-50';
              textClass = 'text-gray-800';
              textBoldClass = 'text-gray-600';
            }

            return (
              <div key={item.type} className={`${bgClass} rounded-lg p-4`}>
                <div className="flex items-center mb-2">
                  <Icon className={`w-5 h-5 ${textBoldClass} mr-2`} />
                  <span className={`font-medium ${textClass} tracking-wide`}>
                    {item.displayName}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${textBoldClass}`}>
                  {item.count}
                </div>
                <div className={`text-sm ${textBoldClass}`}>
                  道题目 ({item.percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback to old display if no distribution data
        <div className="grid grid-cols-2 gap-4">
          {hasMultipleChoiceQuestions && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800 tracking-wide">选择题</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {questions.filter(q => q.type === 'multiple-choice').length}
              </div>
              <div className="text-sm text-blue-600">道题目</div>
            </div>
          )}
          {hasEssayQuestions && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <MessageSquare className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-800 tracking-wide">问答题</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {questions.filter(q => q.type === 'essay').length}
              </div>
              <div className="text-sm text-purple-600">道题目</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
