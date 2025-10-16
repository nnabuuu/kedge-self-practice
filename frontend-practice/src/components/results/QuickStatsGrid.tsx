import React from 'react';
import { CheckCircle2, XCircle, Target, Clock } from 'lucide-react';

interface QuickStatsGridProps {
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  completionRate: number;
  duration: number;
  hasEssayQuestions: boolean;
  hasMultipleChoiceQuestions: boolean;
}

export default function QuickStatsGrid({
  correctAnswers,
  wrongAnswers,
  accuracy,
  completionRate,
  duration,
  hasEssayQuestions,
  hasMultipleChoiceQuestions
}: QuickStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300 ease-out">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-green-600 mb-1">{correctAnswers}</div>
        <div className="text-sm text-gray-600 font-medium tracking-wide">
          {hasEssayQuestions ? '完成答题' : '正确答题'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300 ease-out">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
          <XCircle className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-red-600 mb-1">{wrongAnswers}</div>
        <div className="text-sm text-gray-600 font-medium tracking-wide">错误题目</div>
      </div>

      <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300 ease-out">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-blue-600 mb-1">
          {hasEssayQuestions && !hasMultipleChoiceQuestions ? completionRate : accuracy}%
        </div>
        <div className="text-sm text-gray-600 font-medium tracking-wide">
          {hasEssayQuestions && !hasMultipleChoiceQuestions ? '完成率' : '准确率'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 text-center transform hover:scale-105 transition-all duration-300 ease-out">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-purple-600 mb-1">{duration}</div>
        <div className="text-sm text-gray-600 font-medium tracking-wide">用时(分钟)</div>
      </div>
    </div>
  );
}
