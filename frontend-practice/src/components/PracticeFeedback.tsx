import React, { useState, useEffect } from 'react';
import {
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Brain,
  Sparkles,
  BarChart3,
  Zap,
  Medal,
  Star,
  Gift,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';

interface FeedbackProps {
  sessionId: string;
  onClose: () => void;
  onReviewAnswers: () => void;
  onStartNewPractice: () => void;
}

interface SessionAnalysis {
  accuracy_percentage: number;
  speed_percentile?: number;
  consistency_score?: number;
  improvement_rate?: number;
  total_time_seconds: number;
  average_time_per_question: number;
  identified_strengths: Array<{
    knowledge_point_id: string;
    knowledge_point_name: string;
    score: number;
  }>;
  identified_weaknesses: Array<{
    knowledge_point_id: string;
    knowledge_point_name: string;
    score: number;
    suggested_focus: boolean;
  }>;
  perceived_difficulty?: 'easy' | 'moderate' | 'challenging' | 'very_challenging';
}

interface Achievement {
  achievement_name: string;
  achievement_description?: string;
  badge_icon?: string;
  badge_color?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward_points: number;
}

interface Recommendation {
  title: string;
  description: string;
  recommendation_type: string;
  urgency: 'immediate' | 'high' | 'normal' | 'low';
  action_items: Array<{ action: string; completed: boolean }>;
}

export const PracticeFeedback: React.FC<FeedbackProps> = ({
  sessionId,
  onClose,
  onReviewAnswers,
  onStartNewPractice,
}) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['strengths', 'weaknesses']));
  
  // Mock data - replace with actual API call
  const [feedbackData, setFeedbackData] = useState<{
    session_analysis: SessionAnalysis;
    new_achievements: Achievement[];
    recommendations: Recommendation[];
    feedback_message: {
      title: string;
      message: string;
      encouragement?: string;
      tips: string[];
    };
  } | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFeedbackData({
        session_analysis: {
          accuracy_percentage: 85,
          speed_percentile: 72,
          consistency_score: 88,
          improvement_rate: 12,
          total_time_seconds: 1200,
          average_time_per_question: 60,
          identified_strengths: [
            { knowledge_point_id: 'kp_1', knowledge_point_name: '古代诗词鉴赏', score: 92 },
            { knowledge_point_id: 'kp_2', knowledge_point_name: '文言文阅读', score: 88 },
          ],
          identified_weaknesses: [
            { knowledge_point_id: 'kp_3', knowledge_point_name: '现代文阅读理解', score: 65, suggested_focus: true },
            { knowledge_point_id: 'kp_4', knowledge_point_name: '写作技巧', score: 70, suggested_focus: false },
          ],
          perceived_difficulty: 'moderate',
        },
        new_achievements: [
          {
            achievement_name: '连续练习7天',
            achievement_description: '坚持就是胜利！',
            badge_color: 'gold',
            rarity: 'uncommon',
            reward_points: 50,
          },
          {
            achievement_name: '速度之星',
            achievement_description: '答题速度超过80%的用户',
            badge_color: 'blue',
            rarity: 'rare',
            reward_points: 100,
          },
        ],
        recommendations: [
          {
            title: '加强现代文阅读练习',
            description: '您在现代文阅读理解方面还有提升空间，建议每天练习2-3篇。',
            recommendation_type: 'practice_more',
            urgency: 'high',
            action_items: [
              { action: '完成5篇现代文阅读练习', completed: false },
              { action: '总结阅读技巧笔记', completed: false },
            ],
          },
        ],
        feedback_message: {
          title: '👍 表现出色！',
          message: '您的正确率达到85%，比上次提升了12%！',
          encouragement: '继续保持这个势头，您正在稳步进步！',
          tips: [
            '注意审题，避免粗心错误',
            '加强薄弱知识点的复习',
            '保持规律的练习节奏',
          ],
        },
      });
      setLoading(false);
    }, 1000);
  }, [sessionId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white';
      case 'uncommon': return 'bg-gradient-to-r from-green-400 to-teal-400 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'normal': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">正在生成练习报告...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!feedbackData) return null;

  const { session_analysis, new_achievements, recommendations, feedback_message } = feedbackData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{feedback_message.title}</h2>
              <p className="text-white/90">{feedback_message.message}</p>
              {feedback_message.encouragement && (
                <p className="text-white/80 mt-2 italic">{feedback_message.encouragement}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{session_analysis.accuracy_percentage}%</div>
              <div className="text-sm text-white/80">正确率</div>
            </div>
            {session_analysis.improvement_rate !== undefined && (
              <div className="text-center">
                <div className="text-3xl font-bold flex items-center justify-center">
                  {session_analysis.improvement_rate > 0 ? '+' : ''}{session_analysis.improvement_rate}%
                  {session_analysis.improvement_rate > 0 ? (
                    <ArrowUp className="w-5 h-5 ml-1" />
                  ) : session_analysis.improvement_rate < 0 ? (
                    <ArrowDown className="w-5 h-5 ml-1" />
                  ) : (
                    <Minus className="w-5 h-5 ml-1" />
                  )}
                </div>
                <div className="text-sm text-white/80">进步率</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-3xl font-bold">{formatTime(session_analysis.total_time_seconds)}</div>
              <div className="text-sm text-white/80">总用时</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{Math.round(session_analysis.average_time_per_question)}秒</div>
              <div className="text-sm text-white/80">平均答题时间</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            详细分析
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 py-3 px-4 font-medium transition-colors relative ${
              activeTab === 'recommendations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            学习建议
            {recommendations.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {recommendations.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* New Achievements */}
              {new_achievements.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    新获得成就
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {new_achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-4 ${getRarityColor(achievement.rarity)}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{achievement.achievement_name}</h4>
                            {achievement.achievement_description && (
                              <p className="text-sm opacity-90 mt-1">{achievement.achievement_description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Award className="w-8 h-8 mb-1" />
                            <span className="text-xs">+{achievement.reward_points}分</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {session_analysis.speed_percentile !== undefined && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Zap className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="font-medium">答题速度</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      超过{session_analysis.speed_percentile}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">的其他学习者</p>
                  </div>
                )}
                
                {session_analysis.consistency_score !== undefined && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Target className="w-5 h-5 mr-2 text-green-600" />
                      <span className="font-medium">稳定性</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {session_analysis.consistency_score}分
                    </div>
                    <p className="text-sm text-gray-600 mt-1">答题节奏稳定</p>
                  </div>
                )}
                
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center mb-2">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    <span className="font-medium">难度感知</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {session_analysis.perceived_difficulty === 'easy' && '简单'}
                    {session_analysis.perceived_difficulty === 'moderate' && '适中'}
                    {session_analysis.perceived_difficulty === 'challenging' && '有挑战'}
                    {session_analysis.perceived_difficulty === 'very_challenging' && '很有挑战'}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">题目难度</p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-gray-600" />
                  学习建议
                </h3>
                <ul className="space-y-2">
                  {feedback_message.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Strengths */}
              <div>
                <button
                  onClick={() => toggleSection('strengths')}
                  className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-green-600" />
                    强项知识点 ({session_analysis.identified_strengths.length})
                  </h3>
                  {expandedSections.has('strengths') ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has('strengths') && (
                  <div className="mt-4 space-y-3">
                    {session_analysis.identified_strengths.map((strength, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{strength.knowledge_point_name}</span>
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${strength.score}%` }}
                              />
                            </div>
                            <span className={`font-bold ${getScoreColor(strength.score)}`}>
                              {strength.score}分
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weaknesses */}
              <div>
                <button
                  onClick={() => toggleSection('weaknesses')}
                  className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <h3 className="text-lg font-semibold flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                    薄弱知识点 ({session_analysis.identified_weaknesses.length})
                  </h3>
                  {expandedSections.has('weaknesses') ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {expandedSections.has('weaknesses') && (
                  <div className="mt-4 space-y-3">
                    {session_analysis.identified_weaknesses.map((weakness, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="font-medium">{weakness.knowledge_point_name}</span>
                            {weakness.suggested_focus && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                建议加强
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${weakness.score}%` }}
                              />
                            </div>
                            <span className={`font-bold ${getScoreColor(weakness.score)}`}>
                              {weakness.score}分
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white rounded-lg border shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{rec.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyBadge(rec.urgency)}`}>
                        {rec.urgency === 'immediate' && '立即'}
                        {rec.urgency === 'high' && '高优先级'}
                        {rec.urgency === 'normal' && '一般'}
                        {rec.urgency === 'low' && '低优先级'}
                      </span>
                    </div>
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-gray-600 mb-4">{rec.description}</p>
                  
                  {rec.action_items.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">行动项：</h4>
                      {rec.action_items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            className="mr-2"
                            readOnly
                          />
                          <span className={item.completed ? 'line-through text-gray-400' : ''}>
                            {item.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {recommendations.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">太棒了！暂时没有特别的学习建议。</p>
                  <p className="text-gray-500 text-sm mt-2">继续保持良好的学习状态！</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={onReviewAnswers}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              查看答题详情
            </button>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={onStartNewPractice}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                开始新练习
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};