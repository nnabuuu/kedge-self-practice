import React, { useMemo, useState } from 'react';
import { ArrowLeft, TrendingUp, Target, BookOpen, BarChart3, Zap, CheckCircle2, XCircle, Clock, Award, Info, ChevronDown, ChevronUp, AlertCircle, TrendingDown, Minus, Play, HelpCircle } from 'lucide-react';
import { Subject, PracticeHistory } from '../types/quiz';
import { useKnowledgePoints } from '../hooks/useApi';
import { useKnowledgePointStats } from '../hooks/usePracticeAnalysis';

interface KnowledgeAnalysisProps {
  subject: Subject;
  history: PracticeHistory[];
  onBack: () => void;
  onEnhancementRound: (knowledgePoints: string[]) => void;
}


interface KnowledgePointStats {
  id: string;
  volume: string;
  unit: string;
  lesson: string;
  section: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers?: number;
  accuracy: number;
  lastPracticed?: Date;
  masteryLevel: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

export default function KnowledgeAnalysis({ 
  subject, 
  history, 
  onBack, 
  onEnhancementRound 
}: KnowledgeAnalysisProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'overview' | 'details' | null>('overview');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'weak' | 'strong'>('weak');

  // Use API hook to get knowledge points
  const { data: knowledgePoints = [], loading: knowledgePointsLoading } = useKnowledgePoints(subject.id);
  
  // Use backend API for knowledge point statistics
  const { data: statsData, loading: statsLoading } = useKnowledgePointStats(undefined, subject.id, 20);

  // Convert backend stats to frontend format
  const knowledgePointStats = useMemo<KnowledgePointStats[]>(() => {
    if (!statsData?.statistics || !knowledgePoints || knowledgePoints.length === 0) {
      return [];
    }

    // Only show knowledge points with wrong answers
    return statsData.statistics
      .filter(stat => stat.wrong_answers > 0)
      .map(stat => {
        const kp = knowledgePoints.find(k => k.id === stat.knowledge_point_id);
        if (!kp) return null;
        
        return {
          id: kp.id,
          volume: kp.volume,
          unit: kp.unit,
          lesson: kp.lesson,
          section: kp.section,
          topic: kp.topic,
          totalQuestions: stat.total_questions,
          correctAnswers: stat.correct_answers,
          wrongAnswers: stat.wrong_answers,
          accuracy: stat.accuracy,
          lastPracticed: stat.last_practiced ? new Date(stat.last_practiced) : undefined,
          masteryLevel: stat.mastery_level
        };
      })
      .filter((stat): stat is KnowledgePointStats => stat !== null);
  }, [statsData, knowledgePoints]);

  // 获取薄弱知识点
  const weakKnowledgePoints = knowledgePointStats
    .filter(stat => stat.masteryLevel === 'poor' || stat.masteryLevel === 'needs-improvement')
    .map(stat => stat.id);

  // 获取优势知识点
  const strongKnowledgePoints = knowledgePointStats
    .filter(stat => stat.masteryLevel === 'excellent')
    .length;

  // 计算总体学习统计
  const totalQuestions = knowledgePointStats.reduce((sum, stat) => sum + stat.totalQuestions, 0);
  const totalCorrect = knowledgePointStats.reduce((sum, stat) => sum + stat.correctAnswers, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const practiceCount = statsData?.sessions_analyzed || 0;

  // Filter knowledge points based on selection
  const filteredStats = useMemo(() => {
    switch (selectedFilter) {
      case 'weak':
        return knowledgePointStats.filter(stat => 
          stat.masteryLevel === 'poor' || stat.masteryLevel === 'needs-improvement'
        );
      case 'strong':
        return knowledgePointStats.filter(stat => 
          stat.masteryLevel === 'excellent' || stat.masteryLevel === 'good'
        );
      default:
        return knowledgePointStats;
    }
  }, [knowledgePointStats, selectedFilter]);

  // Get performance trend (mock data for now)
  const getTrend = () => {
    // In real implementation, compare with previous period
    if (overallAccuracy >= 75) return 'up';
    if (overallAccuracy >= 50) return 'stable';
    return 'down';
  };

  const trend = getTrend();


  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMasteryText = (level: string) => {
    switch (level) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'needs-improvement': return '需加强';
      case 'poor': return '较差';
      default: return '未知';
    }
  };

  // Show loading state
  if (knowledgePointsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载分析数据中...</h2>
            <p className="text-gray-600 tracking-wide">正在获取知识点数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={onBack}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回</span>
            </button>
          </div>

          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight tracking-wide">
              {subject.name}知识点分析
            </h1>
            <p className="text-lg text-gray-600 tracking-wide">
              全面分析学习情况，获得个性化学习建议
            </p>
          </div>

          <div className="space-y-6">
              {/* Key Performance Indicator - Most Prominent */}
              <div className={`bg-gradient-to-br ${
                overallAccuracy >= 75 ? 'from-green-50 to-emerald-50 border-green-200' :
                overallAccuracy >= 50 ? 'from-yellow-50 to-amber-50 border-yellow-200' :
                'from-red-50 to-orange-50 border-red-200'
              } backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 pl-2">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                      overallAccuracy >= 75 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                      overallAccuracy >= 50 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                      'bg-gradient-to-br from-red-500 to-orange-600'
                    } shadow-lg`}>
                      <span className="text-3xl font-bold text-white">{overallAccuracy}%</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">总体准确率</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">基于最近 {practiceCount} 次练习</span>
                        {trend === 'up' && (
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">进步中</span>
                          </div>
                        )}
                        {trend === 'down' && (
                          <div className="flex items-center text-red-600">
                            <TrendingDown className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">需要加强</span>
                          </div>
                        )}
                        {trend === 'stable' && (
                          <div className="flex items-center text-gray-600">
                            <Minus className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">保持稳定</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {weakKnowledgePoints.length > 0 && (
                      <button
                        onClick={() => onEnhancementRound(weakKnowledgePoints)}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        <span className="font-medium">强化薄弱点</span>
                      </button>
                    )}
                    <button
                      onClick={() => onEnhancementRound(knowledgePointStats.map(s => s.id))}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      <span className="font-medium">开始练习</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        overallAccuracy >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        overallAccuracy >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                        'bg-gradient-to-r from-red-500 to-orange-600'
                      }`}
                      style={{ width: `${overallAccuracy}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats - Secondary Information */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold text-gray-900">{totalQuestions}</span>
                  </div>
                  <div className="text-sm text-gray-600">练习题目</div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-gray-900">{strongKnowledgePoints}</span>
                  </div>
                  <div className="text-sm text-gray-600">优秀知识点</div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-bold text-gray-900">{weakKnowledgePoints.length}</span>
                  </div>
                  <div className="text-sm text-gray-600">待加强点</div>
                </div>
              </div>

              {/* 知识点详细分析 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
                      className="flex items-center text-gray-900 hover:text-gray-700 transition-colors"
                    >
                      <BookOpen className="w-6 h-6 text-blue-500 mr-2" />
                      <h2 className="text-xl font-bold tracking-wide">知识点详情</h2>
                      {expandedSection === 'details' ? (
                        <ChevronUp className="w-5 h-5 ml-2" />
                      ) : (
                        <ChevronDown className="w-5 h-5 ml-2" />
                      )}
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedFilter('weak')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          selectedFilter === 'weak' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        薄弱 ({weakKnowledgePoints.length})
                      </button>
                      <button
                        onClick={() => setSelectedFilter('strong')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          selectedFilter === 'strong' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        掌握 ({strongKnowledgePoints})
                      </button>
                      <button
                        onClick={() => setSelectedFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          selectedFilter === 'all' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        全部 ({knowledgePointStats.length})
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedSection === 'details' && (
                  <div className="space-y-4">
                    {filteredStats.length === 0 ? (
                      <div className="text-center py-12">
                        {selectedFilter === 'weak' ? (
                          <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">太棒了！</h3>
                            <p className="text-gray-600">没有薄弱知识点，继续保持！</p>
                          </>
                        ) : selectedFilter === 'strong' ? (
                          <>
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">继续努力</h3>
                            <p className="text-gray-600">暂时还没有完全掌握的知识点</p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">开始练习</h3>
                            <p className="text-gray-600">还没有练习记录</p>
                          </>
                        )}
                      </div>
                    ) : (
                      filteredStats.map(stat => (
                        <div key={stat.id} className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                          stat.masteryLevel === 'poor' ? 'border-red-200 bg-red-50/50' :
                          stat.masteryLevel === 'needs-improvement' ? 'border-yellow-200 bg-yellow-50/50' :
                          stat.masteryLevel === 'good' ? 'border-blue-200 bg-blue-50/50' :
                          'border-green-200 bg-green-50/50'
                        } hover:shadow-md`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pl-1">
                                  <div className="font-semibold text-gray-900 text-lg mb-1">{stat.topic}</div>
                                  <div className="text-sm text-gray-600">
                                    {stat.volume} • {stat.unit} • {stat.lesson} • {stat.section}
                                  </div>
                                  <div className="mt-3 flex items-center space-x-4 text-sm">
                                    <div className="flex items-center">
                                      <Target className="w-4 h-4 text-gray-400 mr-1" />
                                      <span className="text-gray-600">{stat.totalQuestions} 题</span>
                                    </div>
                                    <div className="flex items-center">
                                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                                      <span className="text-green-600 font-medium">{stat.correctAnswers} 正确</span>
                                    </div>
                                    <div className="flex items-center">
                                      <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                      <span className="text-red-600 font-medium">{stat.totalQuestions - stat.correctAnswers} 错误</span>
                                    </div>
                                    {stat.lastPracticed && (
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                                        <span className="text-gray-600">
                                          {stat.lastPracticed instanceof Date 
                                            ? stat.lastPracticed.toLocaleDateString() 
                                            : new Date(stat.lastPracticed).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-6 text-center">
                                  <div className={`inline-flex flex-col items-center p-3 rounded-xl ${
                                    stat.masteryLevel === 'poor' ? 'bg-red-100' :
                                    stat.masteryLevel === 'needs-improvement' ? 'bg-yellow-100' :
                                    stat.masteryLevel === 'good' ? 'bg-blue-100' :
                                    'bg-green-100'
                                  }`}>
                                    <div className="text-xs text-gray-500 font-medium mb-1">正确率</div>
                                    <div className={`text-3xl font-bold ${
                                      stat.masteryLevel === 'poor' ? 'text-red-600' :
                                      stat.masteryLevel === 'needs-improvement' ? 'text-yellow-600' :
                                      stat.masteryLevel === 'good' ? 'text-blue-600' :
                                      'text-green-600'
                                    }`}>{stat.accuracy}%</div>
                                    <div className={`text-xs px-2 py-1 rounded-full font-medium mt-2 ${getMasteryColor(stat.masteryLevel)}`}>
                                      {getMasteryText(stat.masteryLevel)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}