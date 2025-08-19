import React, { useState } from 'react';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, BookOpen, CheckCircle2, XCircle, RotateCcw, Share2, Download, ChevronRight, ChevronDown, Award, Zap, Brain, Star, Sparkles, Gift, MessageSquare, Loader2 } from 'lucide-react';
import { Subject, PracticeSession, QuizQuestion } from '../types/quiz';
import { useKnowledgePoints } from '../hooks/useApi';
import TimeAnalysisChart from './TimeAnalysisChart';

interface QuizResultsProps {
  subject: Subject;
  session: PracticeSession;
  onReturnToMenu: () => void;
  onRetryQuiz: () => void;
  onEnhancementRound: (knowledgePoints: string[]) => void;
}

interface KnowledgePointAnalysis {
  id: string;
  volume: string;
  unit: string;
  lesson: string;
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface CategoryStats {
  correct: number;
  total: number;
  accuracy: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface GroupedAnalysis {
  [volume: string]: {
    stats: CategoryStats;
    units: {
      [unit: string]: {
        stats: CategoryStats;
        lessons: {
          [lesson: string]: {
            stats: CategoryStats;
            topics: KnowledgePointAnalysis[];
          };
        };
      };
    };
  };
}

export default function QuizResults({ 
  subject, 
  session, 
  onReturnToMenu, 
  onRetryQuiz, 
  onEnhancementRound 
}: QuizResultsProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'suggestions'>('overview');

  // Use API hook to get knowledge points
  const { data: knowledgePoints, loading: knowledgePointsLoading } = useKnowledgePoints(subject.id);

  // Show loading state while knowledge points are being fetched
  if (knowledgePointsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">正在加载结果...</h3>
              <p className="text-gray-600">请稍候，正在分析您的练习结果</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 计算基础统计 - 优先使用后端返回的统计数据
  const totalQuestions = session.questions.length;
  
  // Use backend statistics if available, otherwise calculate locally
  const answeredQuestions = session.answeredQuestions !== undefined 
    ? session.answeredQuestions 
    : session.answers.filter(a => a !== null).length;
  
  const correctAnswers = session.correctAnswers !== undefined
    ? session.correctAnswers
    : session.answers.filter(
        (answer, index) => {
          const question = session.questions[index];
          if (question?.type === 'multiple-choice') {
            return answer === question.answer;
          } else if (question?.type === 'essay') {
            // 问答题暂时按回答了就算正确（实际应该根据AI评分）
            return answer !== null && answer.trim() !== '';
          }
          return false;
        }
      ).length;
  
  const wrongAnswers = session.incorrectAnswers !== undefined
    ? session.incorrectAnswers
    : session.answers.filter(
        (answer, index) => {
          const question = session.questions[index];
          if (question?.type === 'multiple-choice') {
            return answer !== null && answer !== question.answer;
          } else if (question?.type === 'essay') {
            // 问答题的错误判断需要基于AI评分
            return false; // 暂时不计算错误
          }
          return false;
        }
      ).length;
  
  const unansweredQuestions = totalQuestions - answeredQuestions;
  
  // Use backend score if available, otherwise calculate
  const accuracy = session.score !== undefined 
    ? Math.round(session.score)
    : (totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0);
  
  const completionRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  
  const duration = session.endTime && session.startTime 
    ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
    : 0;
  
  const avgTimePerQuestion = answeredQuestions > 0 ? Math.round(duration / answeredQuestions * 10) / 10 : 0;

  // 分析每题用时
  const analyzeQuestionTiming = () => {
    if (!session.questionDurations) return { slowQuestions: [], averageTime: 0 };
    
    const durations = session.questionDurations.filter(d => d > 0);
    if (durations.length === 0) return { slowQuestions: [], averageTime: 0 };
    
    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const threshold = averageTime * 1.5; // 超过平均时间1.5倍视为用时过长
    
    const slowQuestions = session.questionDurations
      .map((duration, index) => ({ index, duration }))
      .filter(item => item.duration > threshold && item.duration > 60) // 至少超过60秒
      .map(item => item.index);
    
    return { slowQuestions, averageTime: Math.round(averageTime) };
  };

  const timingAnalysis = analyzeQuestionTiming();

  // 检查是否包含问答题
  const hasEssayQuestions = session.questions.some(q => q.type === 'essay');
  const hasMultipleChoiceQuestions = session.questions.some(q => q.type === 'multiple-choice');

  // 获取知识点信息 - 添加防御性编程
  const getKnowledgePointById = (pointId: string) => {
    // Ensure knowledgePoints is an array before calling find
    const points = knowledgePoints || [];
    return points.find(kp => kp.id === pointId);
  };

  // 计算状态等级
  const getStatusFromAccuracy = (accuracy: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' => {
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 75) return 'good';
    if (accuracy >= 60) return 'needs-improvement';
    return 'poor';
  };

  // 计算知识点分析 - 包含分层统计
  const calculateKnowledgePointAnalysis = (): GroupedAnalysis => {
    const analysis: GroupedAnalysis = {};
    const statsMap = new Map<string, { correct: number; total: number }>();
    
    // 初始化统计
    session.knowledgePoints.forEach(kpId => {
      statsMap.set(kpId, { correct: 0, total: 0 });
    });

    // 计算每个知识点的统计
    session.questions.forEach((question, index) => {
      const kpId = question.relatedKnowledgePointId;
      if (session.knowledgePoints.includes(kpId)) {
        const stat = statsMap.get(kpId);
        if (stat) {
          stat.total++;
          
          if (question.type === 'multiple-choice') {
            if (session.answers[index] === question.answer) {
              stat.correct++;
            }
          } else if (question.type === 'essay') {
            // 问答题暂时按回答了就算正确
            if (session.answers[index] !== null && session.answers[index]?.trim() !== '') {
              stat.correct++;
            }
          }
        }
      }
    });

    // 构建分组分析，包含各层级统计
    session.knowledgePoints.forEach(kpId => {
      const kp = getKnowledgePointById(kpId);
      const stat = statsMap.get(kpId);
      
      if (kp && stat && stat.total > 0) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        const status = getStatusFromAccuracy(accuracy);

        // 初始化册级别
        if (!analysis[kp.volume]) {
          analysis[kp.volume] = {
            stats: { correct: 0, total: 0, accuracy: 0, status: 'poor' },
            units: {}
          };
        }

        // 初始化单元级别
        if (!analysis[kp.volume].units[kp.unit]) {
          analysis[kp.volume].units[kp.unit] = {
            stats: { correct: 0, total: 0, accuracy: 0, status: 'poor' },
            lessons: {}
          };
        }

        // 初始化课级别
        if (!analysis[kp.volume].units[kp.unit].lessons[kp.lesson]) {
          analysis[kp.volume].units[kp.unit].lessons[kp.lesson] = {
            stats: { correct: 0, total: 0, accuracy: 0, status: 'poor' },
            topics: []
          };
        }
        
        // 添加知识点
        analysis[kp.volume].units[kp.unit].lessons[kp.lesson].topics.push({
          id: kp.id,
          volume: kp.volume,
          unit: kp.unit,
          lesson: kp.lesson,
          topic: kp.topic,
          correct: stat.correct,
          total: stat.total,
          accuracy,
          status
        });

        // 累加统计到各级别
        analysis[kp.volume].stats.correct += stat.correct;
        analysis[kp.volume].stats.total += stat.total;
        
        analysis[kp.volume].units[kp.unit].stats.correct += stat.correct;
        analysis[kp.volume].units[kp.unit].stats.total += stat.total;
        
        analysis[kp.volume].units[kp.unit].lessons[kp.lesson].stats.correct += stat.correct;
        analysis[kp.volume].units[kp.unit].lessons[kp.lesson].stats.total += stat.total;
      }
    });

    // 计算各级别的准确率和状态
    Object.values(analysis).forEach(volume => {
      if (volume.stats.total > 0) {
        volume.stats.accuracy = Math.round((volume.stats.correct / volume.stats.total) * 100);
        volume.stats.status = getStatusFromAccuracy(volume.stats.accuracy);
      }

      Object.values(volume.units).forEach(unit => {
        if (unit.stats.total > 0) {
          unit.stats.accuracy = Math.round((unit.stats.correct / unit.stats.total) * 100);
          unit.stats.status = getStatusFromAccuracy(unit.stats.accuracy);
        }

        Object.values(unit.lessons).forEach(lesson => {
          if (lesson.stats.total > 0) {
            lesson.stats.accuracy = Math.round((lesson.stats.correct / lesson.stats.total) * 100);
            lesson.stats.status = getStatusFromAccuracy(lesson.stats.accuracy);
          }
        });
      });
    });

    return analysis;
  };

  const knowledgePointAnalysis = calculateKnowledgePointAnalysis();

  // 获取需要加强的知识点
  const getWeakKnowledgePoints = (): string[] => {
    const weakPoints: string[] = [];
    Object.values(knowledgePointAnalysis).forEach(volume => {
      Object.values(volume.units).forEach(unit => {
        Object.values(unit.lessons).forEach(lesson => {
          lesson.topics.forEach(topic => {
            if (topic.status === 'poor' || topic.status === 'needs-improvement') {
              weakPoints.push(topic.id);
            }
          });
        });
      });
    });
    return weakPoints;
  };

  const weakKnowledgePoints = getWeakKnowledgePoints();

  // 获取表现等级 - 专注于客观评价
  const getPerformanceLevel = () => {
    if (hasEssayQuestions && hasMultipleChoiceQuestions) {
      return {
        level: '练习完成',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: MessageSquare,
        message: '混合题型练习完成！',
        motivation: '您完成了包含选择题和问答题的综合练习，展现了全面的学习能力。'
      };
    } else if (hasEssayQuestions) {
      return {
        level: '思维训练完成',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: Brain,
        message: '问答题练习完成！',
        motivation: '您完成了问答题练习，锻炼了逻辑思维和表达能力。'
      };
    } else {
      // 原有的选择题评级逻辑
      if (accuracy >= 90) return { 
        level: '优秀', 
        color: 'text-green-600', 
        bgColor: 'bg-green-100', 
        icon: Trophy,
        message: '练习完成，表现优秀！',
        motivation: '知识掌握程度很好，可以尝试更有挑战性的内容。'
      };
      if (accuracy >= 75) return { 
        level: '良好', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100', 
        icon: Award,
        message: '练习完成，表现良好！',
        motivation: '大部分知识点掌握较好，继续巩固薄弱环节。'
      };
      if (accuracy >= 60) return { 
        level: '及格', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100', 
        icon: Target,
        message: '练习完成，基础扎实！',
        motivation: '基础知识掌握可以，重点加强薄弱知识点。'
      };
      return { 
        level: '需要加强', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100', 
        icon: TrendingUp,
        message: '练习完成，还有提升空间！',
        motivation: '建议系统性复习相关知识点，多做针对性练习。'
      };
    }
  };

  const performance = getPerformanceLevel();
  const PerformanceIcon = performance.icon;

  const toggleExpand = (type: 'volume' | 'unit' | 'lesson', key: string) => {
    const setters = {
      volume: setExpandedVolumes,
      unit: setExpandedUnits,
      lesson: setExpandedLessons
    };
    
    const setter = setters[type];
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes}分钟`;
  };

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

  // 渲染统计信息组件
  const renderStatsInfo = (stats: CategoryStats, label: string) => (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-green-600 font-medium">{stats.correct}</span>
      </div>
      <div className="flex items-center space-x-1">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-red-600 font-medium">{stats.total - stats.correct}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Target className="w-4 h-4 text-blue-500" />
        <span className="text-blue-600 font-medium">{stats.accuracy}%</span>
      </div>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.status)}`}>
        {getStatusText(stats.status)}
      </div>
    </div>
  );

  // 生成实用的学习建议
  const getPersonalizedSuggestions = () => {
    const suggestions = [];
    
    if (hasEssayQuestions) {
      suggestions.push({
        icon: '🧠',
        title: '逻辑思维训练',
        content: '问答题练习有助于培养逻辑思维能力，建议多关注答题的条理性和完整性。'
      });
      
      suggestions.push({
        icon: '✍️',
        title: '表达能力提升',
        content: '通过问答题练习可以提高文字表达能力，注意使用准确的生物学术语。'
      });
    }
    
    if (hasMultipleChoiceQuestions) {
      if (accuracy >= 80) {
        suggestions.push({
          icon: '🎯',
          title: '知识掌握良好',
          content: '选择题表现优秀，可以尝试更有挑战性的题目，或者学习新的知识领域。'
        });
      } else if (accuracy >= 60) {
        suggestions.push({
          icon: '📚',
          title: '重点复习错题',
          content: '建议重点复习选择题中的错题，理解错误原因，加深对相关知识点的理解。'
        });
      } else {
        suggestions.push({
          icon: '🔧',
          title: '系统性学习',
          content: '建议从基础开始，系统性地学习相关知识点，可以参考教材或相关资料。'
        });
      }
    }

    if (avgTimePerQuestion > 3) {
      suggestions.push({
        icon: '⏰',
        title: '提高答题效率',
        content: '答题时间较长，建议多做练习熟悉题型，提高答题速度和准确性。'
      });
    }

    if (weakKnowledgePoints.length > 0) {
      suggestions.push({
        icon: '🎯',
        title: '针对性强化',
        content: `发现 ${weakKnowledgePoints.length} 个薄弱知识点，建议进行专项练习加强掌握。`
      });
    }

    return suggestions;
  };

  const personalizedSuggestions = getPersonalizedSuggestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header - 统一样式 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onReturnToMenu}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回菜单</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {/* TODO: 实现分享功能 */}}
                className="group flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out border border-white/20 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <Share2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium tracking-wide">分享结果</span>
              </button>
              <button
                onClick={() => {/* TODO: 实现导出功能 */}}
                className="group flex items-center px-4 py-2 text-gray-600 hover:text-green-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out border border-white/20 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
              >
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium tracking-wide">导出报告</span>
              </button>
            </div>
          </div>

          {/* Title Section - 客观展示结果 */}
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
                    <div className={`text-sm ${performance.color} opacity-80`}>{subject.name}练习</div>
                  </div>
                </>
              )}
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed tracking-wide">
              {performance.motivation}
            </p>
          </div>

          {/* Quick Stats */}
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

          {/* Action Buttons - 清晰的下一步行动 */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={onRetryQuiz}
              className="group flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-out shadow-xl shadow-blue-500/25 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <RotateCcw className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-300" />
              <div>
                <div className="font-bold tracking-wide">重新练习</div>
                <div className="text-xs opacity-90">巩固学习效果</div>
              </div>
            </button>

            {weakKnowledgePoints.length > 0 && (
              <button
                onClick={() => onEnhancementRound(weakKnowledgePoints)}
                className="group flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-out shadow-xl shadow-orange-500/25 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
              >
                <Zap className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <div className="font-bold tracking-wide">薄弱点强化</div>
                  <div className="text-xs opacity-90">{weakKnowledgePoints.length} 个知识点</div>
                </div>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-8">
            <div className="flex border-b border-gray-200">
              {[
                { id: 'overview', label: '总览分析', icon: TrendingUp },
                { id: 'detailed', label: '详细分析', icon: BookOpen },
                { id: 'suggestions', label: '学习建议', icon: Brain }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-6 py-4 font-medium transition-all duration-300 ease-out tracking-wide ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/30'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none`}
                  >
                    <TabIcon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Performance Overview */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center tracking-wide">
                      <Star className="w-6 h-6 text-yellow-500 mr-2" />
                      练习概览
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">总题数</span>
                          <span className="font-semibold">{totalQuestions} 题</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">已答题数</span>
                          <span className="font-semibold">{answeredQuestions} 题</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">完成率</span>
                          <span className="font-semibold text-blue-600">{completionRate}%</span>
                        </div>
                        {hasMultipleChoiceQuestions && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 tracking-wide">准确率</span>
                            <span className={`font-semibold ${performance.color}`}>{accuracy}%</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">用时</span>
                          <span className="font-semibold">{formatDuration(duration)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">平均每题用时</span>
                          <span className="font-semibold">{avgTimePerQuestion} 分钟</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">未答题数</span>
                          <span className="font-semibold text-gray-500">{unansweredQuestions} 题</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 tracking-wide">知识点覆盖</span>
                          <span className="font-semibold">{session.knowledgePoints.length} 个</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 题型分布 */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">题型分布</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {hasMultipleChoiceQuestions && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="font-medium text-blue-800 tracking-wide">选择题</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {session.questions.filter(q => q.type === 'multiple-choice').length}
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
                            {session.questions.filter(q => q.type === 'essay').length}
                          </div>
                          <div className="text-sm text-purple-600">道题目</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar - 只在有选择题时显示 */}
                  {hasMultipleChoiceQuestions && (
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
                  )}
                </div>
              )}

              {activeTab === 'detailed' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center tracking-wide">
                    <BookOpen className="w-6 h-6 text-blue-500 mr-2" />
                    详细分析报告
                  </h3>
                  
                  {/* 题目用时分析 - 使用可视化图表组件 */}
                  {session.questionDurations && session.questionDurations.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center tracking-wide">
                        <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        答题用时分析
                      </h4>
                      
                      <TimeAnalysisChart
                        questions={session.questions}
                        answers={session.answers}
                        questionDurations={session.questionDurations}
                        averageTime={timingAnalysis.averageTime}
                      />
                    </div>
                  )}
                  
                  {/* 知识点分析 */}
                  {Object.entries(knowledgePointAnalysis).map(([volume, volumeData]) => (
                    <div key={volume} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* 册级别 - 包含统计信息 */}
                      <button
                        onClick={() => toggleExpand('volume', volume)}
                        className="w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="font-bold text-blue-800 text-lg mr-3 tracking-wide">{volume}</span>
                            {expandedVolumes.has(volume) ? (
                              <ChevronDown className="w-5 h-5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                        {renderStatsInfo(volumeData.stats, '册')}
                      </button>

                      {expandedVolumes.has(volume) && (
                        <div className="bg-white">
                          {Object.entries(volumeData.units).map(([unit, unitData]) => (
                            <div key={unit} className="border-t border-gray-100">
                              {/* 单元级别 - 包含统计信息 */}
                              <button
                                onClick={() => toggleExpand('unit', `${volume}-${unit}`)}
                                className="w-full p-4 hover:bg-gray-50 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center">
                                    <span className="font-semibold text-gray-800 mr-3 tracking-wide">{unit}</span>
                                    {expandedUnits.has(`${volume}-${unit}`) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                </div>
                                {renderStatsInfo(unitData.stats, '单元')}
                              </button>

                              {expandedUnits.has(`${volume}-${unit}`) && (
                                <div className="bg-gray-50">
                                  {Object.entries(unitData.lessons).map(([lesson, lessonData]) => (
                                    <div key={lesson} className="border-t border-gray-200">
                                      {/* 课级别 - 包含统计信息 */}
                                      <button
                                        onClick={() => toggleExpand('lesson', `${volume}-${unit}-${lesson}`)}
                                        className="w-full p-4 hover:bg-gray-100 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center">
                                            <span className="font-medium text-gray-700 mr-3 tracking-wide">{lesson}</span>
                                            {expandedLessons.has(`${volume}-${unit}-${lesson}`) ? (
                                              <ChevronDown className="w-4 h-4 text-gray-600" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-gray-600" />
                                            )}
                                          </div>
                                        </div>
                                        {renderStatsInfo(lessonData.stats, '课')}
                                      </button>

                                      {expandedLessons.has(`${volume}-${unit}-${lesson}`) && (
                                        <div className="bg-white p-4 space-y-3">
                                          {lessonData.topics.map(topic => (
                                            <div
                                              key={topic.id}
                                              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
                                            >
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-900 mb-1 tracking-wide">{topic.topic}</div>
                                                <div className="text-sm text-gray-600">
                                                  {topic.correct}/{topic.total} 题正确
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-3">
                                                <div className="text-right">
                                                  <div className="text-2xl font-bold text-gray-900">{topic.accuracy}%</div>
                                                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(topic.status)}`}>
                                                    {getStatusText(topic.status)}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'suggestions' && (
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
                          {Object.values(knowledgePointAnalysis).map(volume =>
                            Object.values(volume.units).map(unit =>
                              Object.values(unit.lessons).map(lesson =>
                                lesson.topics
                                  .filter(topic => topic.status === 'poor' || topic.status === 'needs-improvement')
                                  .slice(0, 5)
                                  .map(topic => (
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
                        <button
                          onClick={() => onEnhancementRound(weakKnowledgePoints)}
                          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          <span className="font-medium tracking-wide">开始薄弱点强化练习</span>
                        </button>
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}