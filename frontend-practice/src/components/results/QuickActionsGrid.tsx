import React from 'react';
import { Sparkles, RotateCcw, BarChart3, History, BookOpen } from 'lucide-react';

interface QuickActionsGridProps {
  onRetryQuiz?: () => void;
  onRestart?: () => void;
  onViewKnowledgeAnalysis?: () => void;
  onViewHistory?: () => void;
  onReturnToMenu?: () => void;
  onBackToHome?: () => void;
}

export default function QuickActionsGrid({
  onRetryQuiz,
  onRestart,
  onViewKnowledgeAnalysis,
  onViewHistory,
  onReturnToMenu,
  onBackToHome
}: QuickActionsGridProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center tracking-wide">
        <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
        接下来您可以
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(onRetryQuiz || onRestart) && (
          <button
            onClick={onRetryQuiz || onRestart}
            className="group flex flex-col items-center p-4 bg-white rounded-xl hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <RotateCcw className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-medium text-gray-900 group-hover:text-blue-600">重新练习</span>
            <span className="text-xs text-gray-500 mt-1">巩固本次内容</span>
          </button>
        )}

        {onViewKnowledgeAnalysis && (
          <button
            onClick={onViewKnowledgeAnalysis}
            className="group flex flex-col items-center p-4 bg-white rounded-xl hover:bg-purple-50 transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="font-medium text-gray-900 group-hover:text-purple-600">知识点分析</span>
            <span className="text-xs text-gray-500 mt-1">查看整体掌握</span>
          </button>
        )}

        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="group flex flex-col items-center p-4 bg-white rounded-xl hover:bg-green-50 transition-all duration-300 border border-gray-200 hover:border-green-300 hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <History className="w-6 h-6 text-green-600" />
            </div>
            <span className="font-medium text-gray-900 group-hover:text-green-600">练习历史</span>
            <span className="text-xs text-gray-500 mt-1">回顾学习进度</span>
          </button>
        )}

        {(onReturnToMenu || onBackToHome) && (
          <button
            onClick={onReturnToMenu || onBackToHome}
            className="group flex flex-col items-center p-4 bg-white rounded-xl hover:bg-orange-50 transition-all duration-300 border border-gray-200 hover:border-orange-300 hover:shadow-lg"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <span className="font-medium text-gray-900 group-hover:text-orange-600">新的练习</span>
            <span className="text-xs text-gray-500 mt-1">选择其他内容</span>
          </button>
        )}
      </div>
    </div>
  );
}
