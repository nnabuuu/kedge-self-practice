import React, { useMemo } from 'react';
import { ArrowLeft, TrendingUp, Target, BookOpen, BarChart3, Zap, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
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

          <div className="space-y-8">
              {/* 学习概览 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center tracking-wide">
                  <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                  学习概览
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{overallAccuracy}%</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">总体准确率</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/25">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{totalQuestions}</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">练习题目</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{strongKnowledgePoints}</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">优秀知识点</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/25">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{practiceCount}</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">练习次数</div>
                  </div>
                </div>
              </div>

              {/* 知识点详细分析 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-wide">
                      <BookOpen className="w-6 h-6 text-blue-500 mr-2" />
                      知识点掌握情况
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 ml-8">
                      最近20次练习中的薄弱知识点
                    </p>
                  </div>
                  {weakKnowledgePoints.length > 0 && (
                    <button
                      onClick={() => onEnhancementRound(weakKnowledgePoints)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      <span className="font-medium tracking-wide">强化薄弱点</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {knowledgePointStats.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">太棒了！</h3>
                      <p className="text-gray-600">最近20次练习中没有错题，继续保持！</p>
                    </div>
                  ) : (
                    knowledgePointStats.map(stat => (
                    <div key={stat.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1 tracking-wide">{stat.topic}</div>
                        <div className="text-sm text-gray-600">
                          {stat.volume} • {stat.unit} • {stat.lesson} • {stat.section}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {stat.totalQuestions > 0 ? (
                            <>
                              练习 {stat.totalQuestions} 题，正确 {stat.correctAnswers} 题
                              {stat.lastPracticed && (
                                <span className="ml-2">• 最后练习：{
                                  stat.lastPracticed instanceof Date 
                                    ? stat.lastPracticed.toLocaleDateString() 
                                    : new Date(stat.lastPracticed).toLocaleDateString()
                                }</span>
                              )}
                            </>
                          ) : (
                            '尚未练习'
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{stat.accuracy}%</div>
                          <div className={`text-xs px-2 py-1 rounded-full font-medium ${getMasteryColor(stat.masteryLevel)}`}>
                            {getMasteryText(stat.masteryLevel)}
                          </div>
                        </div>
                        {stat.totalQuestions > 0 && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">{stat.correctAnswers}</span>
                            <XCircle className="w-4 h-4 text-red-500 ml-2" />
                            <span className="text-sm font-medium text-red-600">{stat.totalQuestions - stat.correctAnswers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )))}
                  
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}