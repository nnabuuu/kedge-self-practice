import React, { useState, useEffect } from 'react';
import { X, Trophy, Target, Clock, TrendingUp, Book, Calendar, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import backendApi from '../services/backendApi';

interface UserPracticeDetailsProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface KnowledgePointStat {
  knowledgePointId: string;
  topic: string;
  volume: string;
  unit: string;
  lesson: string;
  sub: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  correctRate: number;
  lastPracticeTime: string;
}

interface PracticeSession {
  sessionId: string;
  subjectId: string;
  createdAt: string;
  completedAt: string;
  strategy: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  correctRate: number;
  totalTimeSeconds: number;
}

interface UserPracticeDetails {
  user: {
    id: string;
    name: string;
    accountId: string;
    class: string;
    role: string;
  };
  overallStatistics: {
    totalSessions: number;
    totalQuestions: number;
    totalCorrect: number;
    totalIncorrect: number;
    overallCorrectRate: number;
    knowledgePointsPracticed: number;
    totalTimeSpentSeconds: number;
    firstPracticeDate: string;
    lastPracticeDate: string;
  };
  knowledgePointStats: KnowledgePointStat[];
  recentSessions: PracticeSession[];
}

export default function UserPracticeDetailsModal({ userId, userName, isOpen, onClose }: UserPracticeDetailsProps) {
  const [details, setDetails] = useState<UserPracticeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'sessions'>('overview');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await backendApi.get<{success: boolean, data: UserPracticeDetails}>(`/leaderboard/user/${userId}/practice-details`);
      if (response.success && response.data) {
        const detailsData = response.data.data || response.data;
        setDetails(detailsData as UserPracticeDetails);
      }
    } catch (err: any) {
      setError('获取用户练习详情失败');
      console.error('Failed to fetch user practice details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Trophy className="w-6 h-6 text-yellow-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">{userName} 的练习详情</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  总览
                </button>
                <button
                  onClick={() => setActiveTab('knowledge')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'knowledge'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  知识点统计
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'sessions'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  最近练习
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Overall Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span className="text-xl font-bold text-blue-900">
                          {details.overallStatistics.totalSessions}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">总练习次数</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-green-900">
                          {details.overallStatistics.totalQuestions}
                        </span>
                      </div>
                      <p className="text-sm text-green-700">总答题数</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        <span className="text-xl font-bold text-purple-900">
                          {details.overallStatistics.overallCorrectRate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-sm text-purple-700">总正确率</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Book className="w-5 h-5 text-orange-600" />
                        <span className="text-xl font-bold text-orange-900">
                          {details.overallStatistics.knowledgePointsPracticed}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">练习知识点</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">答题统计</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">正确数</span>
                          <span className="font-medium text-green-600">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            {details.overallStatistics.totalCorrect}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">错误数</span>
                          <span className="font-medium text-red-600">
                            <XCircle className="w-4 h-4 inline mr-1" />
                            {details.overallStatistics.totalIncorrect}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">总用时</span>
                          <span className="font-medium text-gray-900">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatTime(details.overallStatistics.totalTimeSpentSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">学习时间</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">首次练习</span>
                          <span className="font-medium text-gray-900">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {formatDate(details.overallStatistics.firstPracticeDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">最近练习</span>
                          <span className="font-medium text-gray-900">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {formatDate(details.overallStatistics.lastPracticeDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">知识点</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">位置</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">练习题数</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">正确/错误</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">正确率</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">最近练习</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {details.knowledgePointStats.map((kp) => (
                          <tr key={kp.knowledgePointId} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{kp.topic}</div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {[kp.volume, kp.unit, kp.lesson, kp.sub].filter(Boolean).join(' > ')}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">{kp.totalQuestions}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-green-600">{kp.correctCount}</span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-red-600">{kp.incorrectCount}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-bold ${
                                kp.correctRate >= 80 ? 'text-green-600' :
                                kp.correctRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {kp.correctRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-600">
                              {formatDate(kp.lastPracticeTime)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  {details.recentSessions.map((session) => (
                    <div key={session.sessionId} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {formatDate(session.createdAt)}
                            </p>
                            <p className="font-medium text-gray-900">
                              {session.strategy === 'random' ? '随机练习' : 
                               session.strategy === 'weak' ? '薄弱练习' : 
                               session.strategy === 'review' ? '复习练习' : session.strategy}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            session.correctRate >= 80 ? 'text-green-600' :
                            session.correctRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {session.correctRate.toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-500">正确率</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            题目: <span className="font-medium text-gray-900">{session.totalQuestions}</span>
                          </span>
                          <span className="text-green-600">
                            正确: <span className="font-medium">{session.correctCount}</span>
                          </span>
                          <span className="text-red-600">
                            错误: <span className="font-medium">{session.incorrectCount}</span>
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          用时 {formatTime(session.totalTimeSeconds)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}