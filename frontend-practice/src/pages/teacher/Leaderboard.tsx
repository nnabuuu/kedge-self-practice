import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Users, Award, Target, Activity, Filter } from 'lucide-react';
import backendApi from '../../services/backendApi';

interface UserStats {
  userId: string;
  userName: string;
  account: string;
  userClass: string | null;
  totalQuizzes: number;
  correctCount: number;
  incorrectCount: number;
  correctRate: number;
}

interface ClassStats {
  class: string;
  studentCount: number;
  totalAnswers: number;
  avgCorrectRate: number;
  totalCorrect: number;
  totalIncorrect: number;
}

interface LeaderboardSummary {
  topPerformers: UserStats[];
  mostActive: UserStats[];
  statistics: {
    totalStudents: number;
    totalQuizzesAnswered: number;
    overallCorrectRate: number;
    totalSessions: number;
  };
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'practice' | 'accuracy' | 'class' | 'summary'>('summary');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<string[]>([]);
  const [practiceOrder, setPracticeOrder] = useState<'most' | 'least'>('most');
  const [accuracyOrder, setAccuracyOrder] = useState<'highest' | 'lowest'>('highest');
  const [minQuizzes, setMinQuizzes] = useState<number>(5);
  
  const [practiceData, setPracticeData] = useState<UserStats[]>([]);
  const [accuracyData, setAccuracyData] = useState<UserStats[]>([]);
  const [classData, setClassData] = useState<ClassStats[]>([]);
  const [summaryData, setSummaryData] = useState<LeaderboardSummary | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available classes
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch data when tab or filters change
  useEffect(() => {
    fetchData();
  }, [activeTab, selectedClass, practiceOrder, accuracyOrder, minQuizzes]);

  const fetchClasses = async () => {
    try {
      const response = await backendApi.get<ClassStats[]>('/leaderboard/class-stats');
      if (response.success && response.data) {
        const uniqueClasses = [...new Set(response.data.map((item: ClassStats) => item.class))];
        setClasses(uniqueClasses.filter(c => c));
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'summary':
          const summaryUrl = selectedClass 
            ? `/leaderboard/summary?class=${encodeURIComponent(selectedClass)}`
            : '/leaderboard/summary';
          const summaryResponse = await backendApi.get<LeaderboardSummary>(summaryUrl);
          if (summaryResponse.success && summaryResponse.data) {
            setSummaryData(summaryResponse.data);
          }
          break;
          
        case 'practice':
          const practiceParams = new URLSearchParams();
          if (selectedClass) practiceParams.append('class', selectedClass);
          practiceParams.append('order', practiceOrder);
          practiceParams.append('limit', '50');
          const practiceUrl = `/leaderboard/practice-count?${practiceParams.toString()}`;
          const practiceResponse = await backendApi.get<UserStats[]>(practiceUrl);
          if (practiceResponse.success && practiceResponse.data) {
            setPracticeData(practiceResponse.data);
          }
          break;
          
        case 'accuracy':
          const accuracyParams = new URLSearchParams();
          if (selectedClass) accuracyParams.append('class', selectedClass);
          accuracyParams.append('order', accuracyOrder);
          accuracyParams.append('minQuizzes', String(minQuizzes));
          accuracyParams.append('limit', '50');
          const accuracyUrl = `/leaderboard/correct-rate?${accuracyParams.toString()}`;
          const accuracyResponse = await backendApi.get<UserStats[]>(accuracyUrl);
          if (accuracyResponse.success && accuracyResponse.data) {
            setAccuracyData(accuracyResponse.data);
          }
          break;
          
        case 'class':
          const classResponse = await backendApi.get<ClassStats[]>('/leaderboard/class-stats');
          if (classResponse.success && classResponse.data) {
            setClassData(classResponse.data);
          }
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '获取排行榜数据失败');
      console.error('Failed to fetch leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSummary = () => {
    if (!summaryData) return null;
    
    return (
      <div className="space-y-6">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">{summaryData.statistics.totalStudents}</span>
            </div>
            <p className="text-sm text-blue-700">总学生数</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-green-900">{summaryData.statistics.totalQuizzesAnswered.toLocaleString()}</span>
            </div>
            <p className="text-sm text-green-700">总答题数</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">{summaryData.statistics.overallCorrectRate.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-purple-700">整体正确率</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-900">{summaryData.statistics.totalSessions}</span>
            </div>
            <p className="text-sm text-orange-700">练习次数</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">表现最佳</h3>
            </div>
            <div className="space-y-3">
              {summaryData.topPerformers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{user.userName}</p>
                      <p className="text-xs text-gray-500">{user.userClass || '未分班'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{user.correctRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{user.totalQuizzes} 题</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Active */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Activity className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">最活跃学生</h3>
            </div>
            <div className="space-y-3">
              {summaryData.mostActive.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{user.userName}</p>
                      <p className="text-xs text-gray-500">{user.userClass || '未分班'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{user.totalQuizzes} 题</p>
                    <p className="text-xs text-gray-500">正确率 {user.correctRate.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPracticeLeaderboard = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">练习量排行榜</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPracticeOrder('most')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              practiceOrder === 'most' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            最多
          </button>
          <button
            onClick={() => setPracticeOrder('least')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              practiceOrder === 'least' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            最少
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">排名</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">学生姓名</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">班级</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">练习题数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">正确数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">错误数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">正确率</th>
            </tr>
          </thead>
          <tbody>
            {practiceData.map((user, index) => (
              <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                    ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">{user.userName}</td>
                <td className="py-3 px-4 text-gray-600">{user.userClass || '-'}</td>
                <td className="py-3 px-4 text-right font-bold text-blue-600">{user.totalQuizzes}</td>
                <td className="py-3 px-4 text-right text-green-600">{user.correctCount}</td>
                <td className="py-3 px-4 text-right text-red-600">{user.incorrectCount}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-bold ${user.correctRate >= 80 ? 'text-green-600' : user.correctRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {user.correctRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccuracyLeaderboard = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">正确率排行榜</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">最少题数:</label>
            <input
              type="number"
              min="1"
              value={minQuizzes}
              onChange={(e) => setMinQuizzes(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAccuracyOrder('highest')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                accuracyOrder === 'highest' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              最高
            </button>
            <button
              onClick={() => setAccuracyOrder('lowest')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                accuracyOrder === 'lowest' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              最低
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">排名</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">学生姓名</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">班级</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">正确率</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">练习题数</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">正确/错误</th>
            </tr>
          </thead>
          <tbody>
            {accuracyData.map((user, index) => (
              <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                    ${accuracyOrder === 'highest' 
                      ? (index === 0 ? 'bg-green-500' : index === 1 ? 'bg-green-400' : index === 2 ? 'bg-green-300' : 'bg-gray-300')
                      : 'bg-red-400'}`}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">{user.userName}</td>
                <td className="py-3 px-4 text-gray-600">{user.userClass || '-'}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end">
                    {user.correctRate >= 80 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : user.correctRate < 60 ? (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    ) : null}
                    <span className={`text-xl font-bold ${
                      user.correctRate >= 80 ? 'text-green-600' : 
                      user.correctRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {user.correctRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-gray-600">{user.totalQuizzes}</td>
                <td className="py-3 px-4 text-right">
                  <span className="text-green-600">{user.correctCount}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-red-600">{user.incorrectCount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderClassStatistics = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">班级统计</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classData.map((classInfo) => (
          <div key={classInfo.class} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">{classInfo.class}</h4>
              <span className="text-sm text-gray-500">{classInfo.studentCount} 名学生</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">总答题数</span>
                <span className="font-medium text-gray-900">{classInfo.totalAnswers.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">平均正确率</span>
                <span className={`font-bold ${
                  classInfo.avgCorrectRate >= 80 ? 'text-green-600' : 
                  classInfo.avgCorrectRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {classInfo.avgCorrectRate.toFixed(1)}%
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">正确 {classInfo.totalCorrect}</span>
                  <span className="text-red-600">错误 {classInfo.totalIncorrect}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">学习排行榜</h2>
          </div>
          
          {/* Class Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部班级</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'practice'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            练习量排行
          </button>
          <button
            onClick={() => setActiveTab('accuracy')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'accuracy'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            正确率排行
          </button>
          <button
            onClick={() => setActiveTab('class')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'class'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            班级统计
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {activeTab === 'summary' && renderSummary()}
          {activeTab === 'practice' && renderPracticeLeaderboard()}
          {activeTab === 'accuracy' && renderAccuracyLeaderboard()}
          {activeTab === 'class' && renderClassStatistics()}
        </>
      )}
    </div>
  );
}