import React from 'react';
import { ArrowLeft, Play, History, BookOpen, Brain, Zap, Timer, BarChart3, Clock, Target, TrendingUp, Sparkles } from 'lucide-react';
import { Subject } from '../types/quiz';

interface PracticeMenuProps {
  subject: Subject;
  onStartPractice: () => void;
  onViewHistory: () => void;
  onViewKnowledgeAnalysis: () => void;
  onBack: () => void;
}

export default function PracticeMenu({ 
  subject, 
  onStartPractice, 
  onViewHistory, 
  onViewKnowledgeAnalysis,
  onBack 
}: PracticeMenuProps) {
  
  // 快速练习处理函数 - 直接开始练习，跳过配置
  const handleQuickPractice = (type: 'quick' | 'weak-points' | 'wrong-only') => {
    // TODO: 根据类型设置预设配置，直接跳转到练习
    // 这里暂时调用原有的开始练习函数
    // 实际应该传递预设的配置参数
    onStartPractice();
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
                  <button
                    onClick={() => handleQuickPractice('quick')}
                    className="group bg-gradient-to-br from-blue-50 to-blue-50 hover:bg-blue-100 rounded-xl p-4 border border-blue-200 hover:border-blue-300 transition-all duration-300 ease-out transform hover:scale-105 shadow-md hover:shadow-lg text-left focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                        <Timer className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight tracking-wide">
                          快速练习
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">5-10分钟</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed tracking-wide">
                      智能推荐知识点，快速开始练习
                    </p>
                  </button>

                  {/* 薄弱点强化 */}
                  <button
                    onClick={() => handleQuickPractice('weak-points')}
                    className="group bg-gradient-to-br from-purple-50 to-purple-50 hover:bg-purple-100 rounded-xl p-4 border border-purple-200 hover:border-purple-300 transition-all duration-300 ease-out transform hover:scale-105 shadow-md hover:shadow-lg text-left focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 leading-tight tracking-wide">
                          薄弱点强化
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">10-15分钟</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed tracking-wide">
                      针对薄弱知识点进行强化练习
                    </p>
                  </button>

                  {/* 错题强化 */}
                  <button
                    onClick={() => handleQuickPractice('wrong-only')}
                    className="group bg-gradient-to-br from-orange-50 to-orange-50 hover:bg-orange-100 rounded-xl p-4 border border-orange-200 hover:border-orange-300 transition-all duration-300 ease-out transform hover:scale-105 shadow-md hover:shadow-lg text-left focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300 leading-tight tracking-wide">
                          错题强化
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">根据错题数量</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed tracking-wide">
                      重新练习之前的错题
                    </p>
                  </button>
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