import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, BookOpen, Award, Zap, Brain, Star, MessageSquare, Loader2, RotateCcw } from 'lucide-react';
import { Subject, PracticeSession, QuizQuestion } from '../types/quiz';
import { useKnowledgePoints } from '../hooks/useApi';
import TimeAnalysisChart from './TimeAnalysisChart';
import { api } from '../services/backendApi';
import PerformanceSummaryCard from './results/PerformanceSummaryCard';
import QuickStatsGrid from './results/QuickStatsGrid';
import QuestionTypeDistribution from './results/QuestionTypeDistribution';
import AnswerDistributionChart from './results/AnswerDistributionChart';
import KnowledgePointTree from './results/KnowledgePointTree';
import LearningSuggestions from './results/LearningSuggestions';
import QuickActionsGrid from './results/QuickActionsGrid';
import QuizPerformanceComparison from './results/QuizPerformanceComparison';

interface QuizResultsProps {
  subject?: Subject;
  session: PracticeSession;
  onReturnToMenu?: () => void;
  onRetryQuiz?: () => void;
  onEnhancementRound?: (knowledgePoints: string[]) => void;
  onViewHistory?: () => void;
  onViewKnowledgeAnalysis?: () => void;
  onReturnHome?: () => void;
  onRestart?: () => void;
  onBackToHome?: () => void;
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
  onEnhancementRound,
  onViewHistory,
  onViewKnowledgeAnalysis,
  onReturnHome,
  onRestart,
  onBackToHome
}: QuizResultsProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'suggestions'>('overview');
  const [typeDistribution, setTypeDistribution] = useState<{
    distribution: Array<{
      type: string;
      displayName: string;
      count: number;
      percentage: number;
    }>;
    total: number;
  } | null>(null);
  const [typeDistributionLoading, setTypeDistributionLoading] = useState(false);
  const [performanceComparisons, setPerformanceComparisons] = useState<{
    [quizId: string]: {
      quiz_id: string;
      user_time: number;
      avg_time: number;
      min_time: number;
      max_time: number;
      time_percentile: number;
      user_correct: boolean;
      user_accuracy: number;
      avg_accuracy: number;
      total_attempts: number;
    };
  }>({});
  const [performanceLoading, setPerformanceLoading] = useState<Set<string>>(new Set());
  const [expandedPerformanceQuizzes, setExpandedPerformanceQuizzes] = useState<Set<string>>(new Set());

  // Use API hook to get knowledge points
  const { data: knowledgePoints, loading: knowledgePointsLoading } = useKnowledgePoints(subject?.id || session.subjectId);

  // Fetch type distribution from backend
  useEffect(() => {
    if (session.id) {
      setTypeDistributionLoading(true);
      api.practice.getTypeDistribution(session.id)
        .then(response => {
          if (response.success && response.data) {
            setTypeDistribution(response.data);
          } else {
            console.error('Failed to fetch type distribution:', response.error);
            // Fall back to local calculation if backend fails
            calculateLocalTypeDistribution();
          }
        })
        .catch(error => {
          console.error('Error fetching type distribution:', error);
          // Fall back to local calculation if request fails
          calculateLocalTypeDistribution();
        })
        .finally(() => {
          setTypeDistributionLoading(false);
        });
    }
  }, [session.id]);

  // Local calculation fallback
  const calculateLocalTypeDistribution = () => {
    const typeCount = new Map<string, number>();
    session.questions.forEach(q => {
      const type = q.type || 'other';
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    const typeDisplayNames: Record<string, string> = {
      'single-choice': '单选题',
      'multiple-choice': '多选题',
      'fill-in-the-blank': '填空题',
      'essay': '问答题',
      'subjective': '主观题',
      'other': '其他'
    };

    const total = session.questions.length;
    const distribution = Array.from(typeCount.entries()).map(([type, count]) => ({
      type,
      displayName: typeDisplayNames[type] || type,
      count,
      percentage: Math.round((count / total) * 100)
    }));

    distribution.sort((a, b) => b.count - a.count);

    setTypeDistribution({
      distribution,
      total
    });
  };

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
  
  const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
  const endTime = session.endTime ? (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : null;
  
  const duration = endTime && startTime 
    ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))
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

          // Check if answer is correct based on question type
          const userAnswer = session.answers[index];

          if (question.type === 'single-choice') {
            // Single choice: compare letter answers
            if (userAnswer === question.answer) {
              stat.correct++;
            }
          } else if (question.type === 'multiple-choice') {
            // Multiple choice: compare arrays
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [];
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
            if (userAnswers.length === correctAnswers.length &&
                userAnswers.every((a: string) => correctAnswers.includes(a))) {
              stat.correct++;
            }
          } else if (question.type === 'fill-in-the-blank') {
            // Fill-in-blank: compare arrays with alternative answers support
            const correctAnswers = Array.isArray(question.answer) ? question.answer : [question.answer];
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
            const alternativeAnswers = question.alternativeAnswers || [];

            const isCorrect = userAnswers.every((ans: string, idx: number) => {
              const normalizedUserAns = ans?.trim().toLowerCase() || '';
              const normalizedCorrectAns = String(correctAnswers[idx]).trim().toLowerCase();

              if (normalizedUserAns === normalizedCorrectAns) return true;

              // Check alternatives
              const positionSpecific = alternativeAnswers
                .filter((alt: string) => alt.startsWith(`[${idx}]`))
                .map((alt: string) => alt.replace(`[${idx}]`, '').trim().toLowerCase());

              const general = alternativeAnswers
                .filter((alt: string) => !alt.includes('['))
                .map((alt: string) => alt.trim().toLowerCase());

              return positionSpecific.includes(normalizedUserAns) || general.includes(normalizedUserAns);
            });

            if (isCorrect) {
              stat.correct++;
            }
          } else if (question.type === 'essay') {
            // 问答题暂时按回答了就算正确
            if (userAnswer !== null && userAnswer?.trim() !== '') {
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
          {(onReturnToMenu || onBackToHome) && (
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onReturnToMenu || onBackToHome}
                className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium tracking-wide">返回菜单</span>
              </button>
            </div>
          )}

          {/* Title Section - 客观展示结果 */}
          <PerformanceSummaryCard
            performance={performance}
            accuracy={accuracy}
            subjectName={subject?.name || ''}
            hasEssayQuestions={hasEssayQuestions}
            hasMultipleChoiceQuestions={hasMultipleChoiceQuestions}
          />

          {/* Quick Stats */}
          <QuickStatsGrid
            correctAnswers={correctAnswers}
            wrongAnswers={wrongAnswers}
            accuracy={accuracy}
            completionRate={completionRate}
            duration={duration}
            hasEssayQuestions={hasEssayQuestions}
            hasMultipleChoiceQuestions={hasMultipleChoiceQuestions}
          />

          {/* Action Buttons - 清晰的下一步行动 */}
          <div className="space-y-6 mb-12">
            {/* Primary Actions - 主要练习操作 */}
            <div className="flex flex-wrap justify-center gap-4">
              {(onRetryQuiz || onRestart) && (
                <button
                  onClick={onRetryQuiz || onRestart}
                  className="group flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-out shadow-xl shadow-blue-500/25 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <RotateCcw className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-300" />
                  <div>
                    <div className="font-bold tracking-wide">重新练习</div>
                    <div className="text-xs opacity-90">巩固学习效果</div>
                  </div>
                </button>
              )}

              {weakKnowledgePoints.length > 0 && onEnhancementRound && (
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

            {/* Secondary Navigation - 查看分析和历史 */}
            <div className="flex flex-wrap justify-center gap-4">
              {onViewKnowledgeAnalysis && (
                <button
                  onClick={onViewKnowledgeAnalysis}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-xl hover:from-purple-200 hover:to-indigo-200 transform hover:scale-105 transition-all duration-300 ease-out shadow-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
                >
                  <BarChart3 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium tracking-wide">查看知识点分析</span>
                </button>
              )}

              {onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl hover:from-green-200 hover:to-emerald-200 transform hover:scale-105 transition-all duration-300 ease-out shadow-lg border border-green-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                >
                  <History className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium tracking-wide">查看练习历史</span>
                </button>
              )}

              {onReturnToMenu && (
                <button
                  onClick={onReturnToMenu}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 rounded-xl hover:from-gray-200 hover:to-slate-200 transform hover:scale-105 transition-all duration-300 ease-out shadow-lg border border-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                >
                  <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium tracking-wide">返回练习菜单</span>
                </button>
              )}

              {onReturnHome && (
                <button
                  onClick={onReturnHome}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 rounded-xl hover:from-blue-200 hover:to-sky-200 transform hover:scale-105 transition-all duration-300 ease-out shadow-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium tracking-wide">返回首页</span>
                </button>
              )}
            </div>
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
                  <QuestionTypeDistribution
                    typeDistribution={typeDistribution}
                    typeDistributionLoading={typeDistributionLoading}
                    hasMultipleChoiceQuestions={hasMultipleChoiceQuestions}
                    hasEssayQuestions={hasEssayQuestions}
                    questions={session.questions}
                  />

                  {/* Progress Bar - 只在有选择题时显示 */}
                  {hasMultipleChoiceQuestions && (
                    <AnswerDistributionChart
                      correctAnswers={correctAnswers}
                      wrongAnswers={wrongAnswers}
                      unansweredQuestions={unansweredQuestions}
                      totalQuestions={totalQuestions}
                    />
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

                  {/* 单题表现对比 - 只显示第一题作为示例 */}
                  {session.questions.length > 0 && session.id && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center tracking-wide">
                        <Target className="w-5 h-5 text-purple-500 mr-2" />
                        单题表现对比分析
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        点击题目查看您在该题上的表现与平均水平的对比
                      </p>

                      {/* Show list of questions with inline performance comparison */}
                      <div className="space-y-3 mb-4">
                        {session.questions.map((question, index) => {
                          const answer = session.answers[index];
                          const isCorrect = answer === question.answer ||
                                          (Array.isArray(answer) && Array.isArray(question.answer) &&
                                           JSON.stringify(answer.sort()) === JSON.stringify(question.answer.sort()));

                          return (
                            <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Question Card - Clickable header */}
                              <button
                                onClick={async () => {
                                  // Toggle expansion
                                  if (expandedPerformanceQuizzes.has(question.id)) {
                                    setExpandedPerformanceQuizzes(prev => {
                                      const next = new Set(prev);
                                      next.delete(question.id);
                                      return next;
                                    });
                                    return;
                                  }

                                  // Check if we already have the data
                                  if (performanceComparisons[question.id]) {
                                    setExpandedPerformanceQuizzes(prev => new Set(prev).add(question.id));
                                    return;
                                  }

                                  // Fetch performance comparison
                                  setPerformanceLoading(prev => new Set(prev).add(question.id));
                                  try {
                                    const response = await api.practice.getQuizPerformanceComparison(
                                      question.id,
                                      session.id!
                                    );

                                    if (response.success && response.data) {
                                      // Handle double-wrapped response
                                      const data = response.data.data || response.data;
                                      setPerformanceComparisons(prev => ({
                                        ...prev,
                                        [question.id]: data
                                      }));
                                      setExpandedPerformanceQuizzes(prev => new Set(prev).add(question.id));
                                    }
                                  } catch (error) {
                                    console.error('Failed to fetch performance comparison:', error);
                                  } finally {
                                    setPerformanceLoading(prev => {
                                      const next = new Set(prev);
                                      next.delete(question.id);
                                      return next;
                                    });
                                  }
                                }}
                                className={`w-full text-left p-4 transition-all duration-200 ${
                                  expandedPerformanceQuizzes.has(question.id)
                                    ? 'bg-purple-50'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-700 mr-2">
                                        {index + 1}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900 line-clamp-1">
                                        {question.question.substring(0, 60)}
                                        {question.question.length > 60 && '...'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 ml-8">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        isCorrect
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {isCorrect ? '✓ 正确' : '✗ 错误'}
                                      </span>
                                      {session.questionDurations && session.questionDurations[index] && (
                                        <span className="text-xs text-gray-500">
                                          用时: {session.questionDurations[index]}秒
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    {performanceLoading.has(question.id) ? (
                                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                                    ) : (
                                      <span className="text-purple-600 text-sm">
                                        {expandedPerformanceQuizzes.has(question.id) ? '收起' : '查看对比'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Inline Performance Comparison - Shows directly below the question */}
                              {expandedPerformanceQuizzes.has(question.id) && performanceComparisons[question.id] && (
                                <div className="border-t border-gray-200 bg-white p-4">
                                  <QuizPerformanceComparison
                                    quizId={performanceComparisons[question.id].quiz_id}
                                    userTime={performanceComparisons[question.id].user_time}
                                    avgTime={performanceComparisons[question.id].avg_time}
                                    minTime={performanceComparisons[question.id].min_time}
                                    maxTime={performanceComparisons[question.id].max_time}
                                    timePercentile={performanceComparisons[question.id].time_percentile}
                                    userCorrect={performanceComparisons[question.id].user_correct}
                                    userAccuracy={performanceComparisons[question.id].user_accuracy}
                                    avgAccuracy={performanceComparisons[question.id].avg_accuracy}
                                    totalAttempts={performanceComparisons[question.id].total_attempts}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 知识点分析 */}
                  {Object.keys(knowledgePointAnalysis).length > 0 ? (
                    <KnowledgePointTree
                      knowledgePointAnalysis={knowledgePointAnalysis}
                      expandedVolumes={expandedVolumes}
                      expandedUnits={expandedUnits}
                      expandedLessons={expandedLessons}
                      onToggleExpand={toggleExpand}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">暂无知识点分析数据</h4>
                      <p className="text-gray-500">
                        本次练习未关联知识点信息，因此无法生成详细的知识点分析报告。
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'suggestions' && (
                <LearningSuggestions
                  personalizedSuggestions={personalizedSuggestions}
                  weakKnowledgePoints={weakKnowledgePoints}
                  knowledgePointAnalysis={knowledgePointAnalysis}
                  hasEssayQuestions={hasEssayQuestions}
                  onEnhancementRound={onEnhancementRound}
                />
              )}

            </div>
          </div>

          {/* Quick Actions - 快速操作建议 */}
          <QuickActionsGrid
            onRetryQuiz={onRetryQuiz}
            onRestart={onRestart}
            onViewKnowledgeAnalysis={onViewKnowledgeAnalysis}
            onViewHistory={onViewHistory}
            onReturnToMenu={onReturnToMenu}
            onBackToHome={onBackToHome}
          />
        </div>
      </div>
    </div>
  );
}