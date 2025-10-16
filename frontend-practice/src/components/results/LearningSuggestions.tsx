import React from 'react';
import { Brain, TrendingUp, Zap } from 'lucide-react';
import { GroupedAnalysis } from './KnowledgePointTree';

interface LearningSuggestionsProps {
  personalizedSuggestions: Array<{
    icon: string;
    title: string;
    content: string;
  }>;
  weakKnowledgePoints: string[];
  knowledgePointAnalysis: any;
  hasEssayQuestions: boolean;
  onEnhancementRound?: (knowledgePoints: string[]) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'text-green-600 bg-green-100';
    case 'good': return 'text-blue-600 bg-blue-100';
    case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
    case 'poor': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'excellent': return '优秀';
    case 'good': return '良好';
    case 'needs-improvement': return '需加强';
    case 'poor': return '较差';
    default: return '未知';
  }
};

export default function LearningSuggestions({
  personalizedSuggestions,
  weakKnowledgePoints,
  knowledgePointAnalysis,
  hasEssayQuestions,
  onEnhancementRound
}: LearningSuggestionsProps) {
  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center tracking-wide">
        <Brain className="w-6 h-6 text-purple-500 mr-2" />
        学习建议
      </h3>

      {/* 实用建议卡片 */}
      <div className="grid md:grid-cols-2 gap-6">
        {personalizedSuggestions.map((suggestion, index) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-lg">{suggestion.icon}</span>
              </div>
              <h4 className="text-lg font-bold text-blue-900 tracking-wide">{suggestion.title}</h4>
            </div>
            <p className="text-blue-800 tracking-wide">{suggestion.content}</p>
          </div>
        ))}
      </div>

      {/* 薄弱点强化建议 */}
      {weakKnowledgePoints.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-lg font-bold text-orange-900 tracking-wide">薄弱点强化建议</h4>
          </div>
          <div className="space-y-4">
            <p className="text-orange-800 tracking-wide">
              发现 {weakKnowledgePoints.length} 个需要重点关注的知识点：
            </p>
            <div className="grid gap-3">
              {Object.values(knowledgePointAnalysis).map((volume: any) =>
                Object.values(volume.units).map((unit: any) =>
                  Object.values(unit.lessons).map((lesson: any) =>
                    lesson.topics
                      .filter((topic: any) => topic.status === 'poor' || topic.status === 'needs-improvement')
                      .slice(0, 5)
                      .map((topic: any) => (
                        <div key={topic.id} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                          <span className="text-gray-900 font-medium tracking-wide">{topic.topic}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{topic.accuracy}%</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(topic.status)}`}>
                              {getStatusText(topic.status)}
                            </span>
                          </div>
                        </div>
                      ))
                  )
                )
              )}
            </div>
            {onEnhancementRound && (
              <button
                onClick={() => onEnhancementRound(weakKnowledgePoints)}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
              >
                <Zap className="w-5 h-5 mr-2" />
                <span className="font-medium tracking-wide">开始薄弱点强化练习</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 学习计划建议 */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-lg font-bold text-purple-900 tracking-wide">后续学习建议</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-purple-700">1</span>
            </div>
            <p className="text-purple-800 tracking-wide">
              {hasEssayQuestions ? '回顾问答题的AI评价，理解逻辑思维的改进方向' : '复习本次练习中的错题，理解错误原因'}
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-purple-700">2</span>
            </div>
            <p className="text-purple-800 tracking-wide">针对薄弱知识点进行专项练习</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-purple-700">3</span>
            </div>
            <p className="text-purple-800 tracking-wide">
              {hasEssayQuestions ? '多练习问答题，提高逻辑表达和知识运用能力' : '定期进行综合练习，检验学习效果'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
