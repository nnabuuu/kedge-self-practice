import React, { useMemo, useState } from 'react';
import { ArrowLeft, Play, History, BookOpen, Brain, Zap, Timer, BarChart3, Clock, Target, TrendingUp, Sparkles, AlertCircle, Info } from 'lucide-react';
import { Subject, PracticeHistory } from '../types/quiz';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useWeakKnowledgePoints, useWrongQuestions, useQuickPracticeSuggestion } from '../hooks/usePracticeAnalysis';

interface PracticeMenuProps {
  subject: Subject;
  onStartPractice: () => void;
  onQuickPractice?: (knowledgePoints: string[], questionCount: number) => void;
  onWeakPointsPractice?: (knowledgePoints: string[]) => void;
  onWrongQuestionsPractice?: (questionIds: string[]) => void;
  onViewHistory: () => void;
  onViewKnowledgeAnalysis: () => void;
  onBack: () => void;
}

export default function PracticeMenu({ 
  subject, 
  onStartPractice,
  onQuickPractice,
  onWeakPointsPractice,
  onWrongQuestionsPractice,
  onViewHistory, 
  onViewKnowledgeAnalysis,
  onBack 
}: PracticeMenuProps) {
  
  // State for showing tooltips
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Use backend APIs for analysis
  const { data: weakData } = useWeakKnowledgePoints(undefined, 20);
  const { data: wrongData } = useWrongQuestions(undefined, 5);
  const { data: quickData } = useQuickPracticeSuggestion();
  
  // Extract data from API responses
  const lastKnowledgePoints = quickData?.knowledge_point_ids || [];
  const weakKnowledgePoints = weakData?.weak_points?.map(wp => wp.knowledge_point_id) || [];
  const recentWrongQuestions = wrongData?.wrong_question_ids || [];
  
  // Check if user has any practice history
  const hasNoHistory = quickData?.message === 'No completed sessions found';
  
  // Quick practice handler - 5-10 min practice with last knowledge points
  const handleQuickPractice = () => {
    if (lastKnowledgePoints.length > 0) {
      // Use last knowledge points, limit to 5-10 questions for quick practice
      onQuickPractice?.(lastKnowledgePoints, 8);
    } else {
      // No history, fall back to regular practice
      onStartPractice();
    }
  };
  
  // Weak points practice handler
  const handleWeakPointsPractice = () => {
    if (weakKnowledgePoints.length > 0) {
      onWeakPointsPractice?.(weakKnowledgePoints);
    } else {
      // No weak points identified, show message or fall back
      alert('暂无薄弱知识点。请先完成几次练习后再使用此功能。');
    }
  };
  
  // Wrong questions practice handler
  const handleWrongQuestionsPractice = () => {
    if (recentWrongQuestions.length > 0) {
      onWrongQuestionsPractice?.(recentWrongQuestions);
    } else {
      alert('暂无错题记录。请先完成几次练习后再使用此功能。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations - 更柔和的渐变 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/4 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header - 三栏布局：返回按钮 | 学科信息 | 空白 */}
          <div className="grid grid-cols-3 items-center mb-12">
            {/* 左侧：返回按钮 */}
            <div className="flex justify-start">
              <button
                onClick={onBack}
                className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium tracking-wide">返回学科选择</span>
              </button>
            </div>

            {/* 中间：当前学科信息 */}
            <div className="flex justify-center">
              <div className="relative">
                {/* 延伸背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 rounded-xl shadow-lg transform scale-x-110 origin-center"></div>
                
                {/* 内容区域 */}
                <div className="relative bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${subject.color} rounded-lg mr-3 flex items-center justify-center shadow-md`}>
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-blue-100 font-medium leading-tight">当前选择学科</div>
                      <div className="text-xl font-bold text-white leading-tight tracking-wide">{subject.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：空白占位 */}
            <div></div>
          </div>

          {/* Notice banner for new users */}
          {hasNoHistory && (
            <div className="max-w-5xl mx-auto mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">欢迎开始学习之旅！</h4>
                  <p className="text-sm text-blue-700">
                    完成您的第一次练习后，系统将为您解锁智能推荐功能，包括快速练习、薄弱点强化和错题复习等个性化学习选项。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 统一的练习方式选择区域 */}
          <div className="space-y-8 max-w-5xl mx-auto">
            
            {/* 练习方式选择 */}
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl">
              {/* 主要练习方式：自定义练习 - 突出显示 */}
              <div className="mb-8">
                {/* 在自定义练习上方添加说明文字 */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight tracking-wide">开始学习</h2>
                  <p className="text-gray-600 leading-relaxed tracking-wide">选择适合您的练习方式</p>
                </div>

                <button
                  onClick={onStartPractice}
                  className="group w-full bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl p-8 border-2 border-green-200 hover:border-green-300 transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl text-left relative overflow-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                >
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-green-500/25">
                          <Play className="w-7 h-7 text-white ml-0.5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-900 group-hover:text-green-700 transition-colors duration-300 mb-1 leading-tight tracking-wide">
                            自定义练习
                          </h3>
                          <p className="text-green-700 leading-relaxed tracking-wide">个性化配置，精准练习</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-sm text-green-600 bg-green-100 rounded-full px-4 py-1 mb-2 whitespace-nowrap font-medium">
                          💡 推荐使用
                        </div>
                        <div className="text-sm text-green-600 whitespace-nowrap font-medium">
                          15-30分钟
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-green-800 leading-relaxed mb-4 tracking-wide">
                      选择知识点，配置练习参数，开始个性化的学习体验。支持题目类型、数量、难度等全面自定义。
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-green-700">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        <span className="font-medium">精准定位</span>
                      </div>
                      <div className="flex items-center">
                        <Brain className="w-4 h-4 mr-2" />
                        <span className="font-medium">智能推荐</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        <span className="font-medium">详细分析</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* 快速练习选项 - 弱化标题颜色 */}
              <div>
                <h3 className="text-lg font-medium text-gray-500 mb-4 text-center leading-tight tracking-wide">快速开始选项</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 快速练习 */}
                  <div
                    onClick={lastKnowledgePoints.length > 0 ? handleQuickPractice : undefined}
                    className={`group rounded-xl p-4 border transition-all duration-300 ease-out transform shadow-md hover:shadow-lg text-left ${
                      lastKnowledgePoints.length === 0
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-gradient-to-br from-blue-50 to-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 hover:scale-105 cursor-pointer'
                    }`}
                    role="button"
                    tabIndex={lastKnowledgePoints.length === 0 ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && lastKnowledgePoints.length > 0) {
                        handleQuickPractice();
                      }
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-transform duration-300 ${
                        lastKnowledgePoints.length === 0
                          ? 'bg-gray-400'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600 group-hover:scale-110'
                      }`}>
                        <Timer className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold transition-colors duration-300 leading-tight tracking-wide ${
                          lastKnowledgePoints.length === 0
                            ? 'text-gray-500'
                            : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          快速练习
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">5-10分钟</p>
                      </div>
                      {/* Info button */}
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setActiveTooltip('quick')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === 'quick' ? null : 'quick');
                          }}
                          className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                        >
                          <Info className="w-4 h-4 text-blue-500" />
                        </button>
                        {activeTooltip === 'quick' && (
                          <div className="absolute right-0 top-8 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                            <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                            <div className="text-sm text-gray-700">
                              <div className="font-semibold mb-2 text-blue-600 flex items-center">
                                <Timer className="w-4 h-4 mr-1" />
                                智能推荐逻辑
                              </div>
                              <ul className="space-y-1.5 text-xs">
                                <li className="flex items-start">
                                  <span className="text-blue-400 mr-1.5 mt-0.5">✓</span>
                                  <span>使用上次练习的知识点</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-blue-400 mr-1.5 mt-0.5">✓</span>
                                  <span>自动选择8道题目</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-blue-400 mr-1.5 mt-0.5">✓</span>
                                  <span>5-10分钟快速巩固</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed tracking-wide">
                      {lastKnowledgePoints.length > 0 
                        ? `继续上次的 ${lastKnowledgePoints.length} 个知识点练习`
                        : hasNoHistory 
                          ? '请先完成一次完整的练习以解锁此功能'
                          : '正在加载练习记录...'}
                    </p>
                  </div>

                  {/* 薄弱点强化 */}
                  <div
                    onClick={weakKnowledgePoints.length > 0 ? handleWeakPointsPractice : undefined}
                    className={`group rounded-xl p-4 border transition-all duration-300 ease-out transform shadow-md hover:shadow-lg text-left ${
                      weakKnowledgePoints.length === 0
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-gradient-to-br from-purple-50 to-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 hover:scale-105 cursor-pointer'
                    }`}
                    role="button"
                    tabIndex={weakKnowledgePoints.length === 0 ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && weakKnowledgePoints.length > 0) {
                        handleWeakPointsPractice();
                      }
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-transform duration-300 ${
                        weakKnowledgePoints.length === 0
                          ? 'bg-gray-400'
                          : 'bg-gradient-to-br from-purple-500 to-purple-600 group-hover:scale-110'
                      }`}>
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold transition-colors duration-300 leading-tight tracking-wide ${
                          weakKnowledgePoints.length === 0
                            ? 'text-gray-500'
                            : 'text-gray-900 group-hover:text-purple-600'
                        }`}>
                          薄弱点强化
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">10-15分钟</p>
                      </div>
                      {/* Info button */}
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setActiveTooltip('weak')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === 'weak' ? null : 'weak');
                          }}
                          className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                        >
                          <Info className="w-4 h-4 text-purple-500" />
                        </button>
                        {activeTooltip === 'weak' && (
                          <div className="absolute right-0 top-8 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                            <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                            <div className="text-sm text-gray-700">
                              <div className="font-semibold mb-2 text-purple-600 flex items-center">
                                <Target className="w-4 h-4 mr-1" />
                                分析逻辑
                              </div>
                              <ul className="space-y-1.5 text-xs">
                                <li className="flex items-start">
                                  <span className="text-purple-400 mr-1.5 mt-0.5">✓</span>
                                  <span>分析最近5次练习</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-purple-400 mr-1.5 mt-0.5">✓</span>
                                  <span>找出错误率{'>'} 40%的知识点</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-purple-400 mr-1.5 mt-0.5">✓</span>
                                  <span>针对薄弱点强化训练</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed tracking-wide">
                      {weakKnowledgePoints.length > 0 
                        ? `发现 ${weakKnowledgePoints.length} 个需要强化的知识点`
                        : '需要更多练习数据分析'}
                    </p>
                    {weakKnowledgePoints.length > 0 && (
                      <div className="mt-2 text-xs text-purple-600 font-medium">
                        错误率 &gt;40%
                      </div>
                    )}
                  </div>

                  {/* 错题强化 */}
                  <div
                    onClick={recentWrongQuestions.length > 0 ? handleWrongQuestionsPractice : undefined}
                    className={`group rounded-xl p-4 border transition-all duration-300 ease-out transform shadow-md hover:shadow-lg text-left ${
                      recentWrongQuestions.length === 0
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-gradient-to-br from-orange-50 to-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300 hover:scale-105 cursor-pointer'
                    }`}
                    role="button"
                    tabIndex={recentWrongQuestions.length === 0 ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recentWrongQuestions.length > 0) {
                        handleWrongQuestionsPractice();
                      }
                    }}
                  >
                    <div className="flex items-center mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-transform duration-300 ${
                        recentWrongQuestions.length === 0
                          ? 'bg-gray-400'
                          : 'bg-gradient-to-br from-orange-500 to-red-600 group-hover:scale-110'
                      }`}>
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold transition-colors duration-300 leading-tight tracking-wide ${
                          recentWrongQuestions.length === 0
                            ? 'text-gray-500'
                            : 'text-gray-900 group-hover:text-orange-600'
                        }`}>
                          错题强化
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">
                          {recentWrongQuestions.length > 0 
                            ? `${recentWrongQuestions.length} 道错题`
                            : '暂无错题'}
                        </p>
                      </div>
                      {/* Info button */}
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setActiveTooltip('wrong')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === 'wrong' ? null : 'wrong');
                          }}
                          className="p-1 hover:bg-orange-100 rounded-full transition-colors"
                        >
                          <Info className="w-4 h-4 text-orange-500" />
                        </button>
                        {activeTooltip === 'wrong' && (
                          <div className="absolute right-0 top-8 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                            <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                            <div className="text-sm text-gray-700">
                              <div className="font-semibold mb-2 text-orange-600 flex items-center">
                                <Brain className="w-4 h-4 mr-1" />
                                复习策略
                              </div>
                              <ul className="space-y-1.5 text-xs">
                                <li className="flex items-start">
                                  <span className="text-orange-400 mr-1.5 mt-0.5">✓</span>
                                  <span>收集最近5次的错题</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-orange-400 mr-1.5 mt-0.5">✓</span>
                                  <span>去重后重新练习</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-orange-400 mr-1.5 mt-0.5">✓</span>
                                  <span>避免重复犯错</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed tracking-wide">
                      {recentWrongQuestions.length > 0 
                        ? `最近5次练习中的错题`
                        : '继续努力，保持优秀！'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 学习分析和历史记录 - 辅助功能区域 */}
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={onViewKnowledgeAnalysis}
                className="group bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 border border-white/20 text-left focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight tracking-wide">
                      知识点分析
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">全面分析 • AI助手</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed tracking-wide">
                  查看所有知识点的掌握情况，获得AI学习建议
                </p>
              </button>

              <button
                onClick={onViewHistory}
                className="group bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 border border-white/20 text-left focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 leading-tight tracking-wide">
                      学习记录
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">进度分析 • 错题回顾</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed tracking-wide">
                  查看详细的练习历史，分析学习进度
                </p>
              </button>
            </div>
          </div>

          {/* 学习概览信息 - 保持低调 */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center px-8 py-4 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-xl border border-white/20 shadow-md">
              <span className="text-sm text-gray-600 mr-4 font-medium tracking-wide">学习概览：</span>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium tracking-wide">50+ 知识要点</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium tracking-wide">500+ 练习题目</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium tracking-wide">24/7 随时学习</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}