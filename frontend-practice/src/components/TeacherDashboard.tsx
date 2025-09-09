import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText, Users, BarChart3, Settings, ExternalLink, Plus, Upload, Download, Cpu, Trophy } from 'lucide-react';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { Teacher } from '../types/teacher';
import { useSubjects, useKnowledgePoints, useQuestionSearch } from '../hooks/useApi';
import { authService } from '../services/authService';
import { preferencesService } from '../services/preferencesService';
import { statisticsService } from '../services/statisticsService';
import KnowledgePointManagement from '../pages/teacher/KnowledgePointManagement';
import QuizBankManagement from '../pages/teacher/QuizBankManagement';
import UserManagement from '../pages/teacher/UserManagement';
import SettingsPage from '../pages/teacher/Settings';
import AIConfigManagement from '../pages/teacher/AIConfigManagement';
import Leaderboard from '../pages/teacher/Leaderboard';

interface TeacherDashboardProps {
  teacher: Teacher;
  selectedSubject?: Subject | null;
  onSelectSubject?: (subject: Subject) => void;
  onBack: () => void;
}

type ActiveTab = 'overview' | 'knowledge-points' | 'questions' | 'users' | 'ai-config' | 'leaderboard' | 'analytics' | 'settings';

interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  monthlyActiveStudents: number;
  totalKnowledgePoints: number;
  totalQuizzes: number;
  totalPracticeSessions: number;
  monthlyPracticeSessions: number;
}

export default function TeacherDashboard({ teacher, selectedSubject: propsSelectedSubject, onSelectSubject, onBack }: TeacherDashboardProps) {
  // Check user role
  const userData = authService.getCurrentUser();
  const isAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
  const isStudent = userData?.role === 'student';
  const isTeacher = userData?.role === 'teacher' || isAdmin;
  
  // Set initial tab based on role
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isStudent ? 'knowledge-points' : 'overview'
  );
  const [quizBankFilters, setQuizBankFilters] = useState<{
    volume?: string;
    unit?: string;
    lesson?: string;
    knowledgePointId?: string;
  } | null>(null);
  
  // Use API hooks to fetch data
  const { data: subjects = [], loading: subjectsLoading } = useSubjects();
  const { data: knowledgePoints = [], loading: knowledgePointsLoading } = useKnowledgePoints();
  const { data: quizQuestions = [], loading: questionsLoading } = useQuestionSearch('');
  
  // Use the selected subject from props, or maintain local state
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(propsSelectedSubject || null);
  
  // Update local state when props change
  useEffect(() => {
    if (propsSelectedSubject) {
      setSelectedSubject(propsSelectedSubject);
    }
  }, [propsSelectedSubject]);
  
  // Handle subject selection
  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    if (onSelectSubject) {
      onSelectSubject(subject);
    }
  };
  const [statistics, setStatistics] = useState<TeacherStats>({
    totalStudents: 0,
    activeStudents: 0,
    monthlyActiveStudents: 0,
    totalKnowledgePoints: 0,
    totalQuizzes: 0,
    totalPracticeSessions: 0,
    monthlyPracticeSessions: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch statistics on component mount (only for teachers/admins, not students)
  useEffect(() => {
    const fetchStatistics = async () => {
      // Skip fetching statistics for students as they don't have permission
      if (isStudent) {
        setStatsLoading(false);
        return;
      }
      
      try {
        setStatsLoading(true);
        const stats = await statisticsService.getTeacherDashboardStats();
        setStatistics(stats);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        // Keep default values if fetch fails
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistics();
  }, [isStudent]);

  // Set selected subject once subjects data is loaded
  // Remember teacher's last accessed subject preference using backend
  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedSubject) {
      const loadLastSubject = async () => {
        try {
          // Try to restore last accessed subject from backend preferences
          const lastSubjectId = await preferencesService.getLastAccessedSubject();
          let subjectToSelect = null;
          
          if (lastSubjectId) {
            subjectToSelect = subjects.find(s => s.id === lastSubjectId);
          }
          
          // Fallback to first available subject if no saved preference or subject not found
          if (!subjectToSelect && subjects.length > 0) {
            subjectToSelect = subjects[0];
          }
          
          if (subjectToSelect) {
            handleSelectSubject(subjectToSelect);
          }
        } catch (error) {
          console.error('Failed to load subject preference:', error);
          // Fallback to first subject
          if (subjects.length > 0) {
            handleSelectSubject(subjects[0]);
          }
        }
      };

      loadLastSubject();
    }
  }, [subjects, selectedSubject]);

  // Save selected subject preference when it changes
  useEffect(() => {
    if (selectedSubject) {
      const saveSubjectPreference = async () => {
        try {
          await preferencesService.setLastAccessedSubject(selectedSubject.id);
        } catch (error) {
          console.error('Failed to save subject preference:', error);
        }
      };

      saveSubjectPreference();
    }
  }, [selectedSubject]);

  // 教师可以访问所有学科 (内部系统)
  const teacherSubjects = subjects || [];

  // 获取当前学科的知识点 - with null checks
  // Since all knowledge points are currently history, show all when history is selected
  const currentSubjectKnowledgePoints = selectedSubject 
    ? (selectedSubject.id === 'history' || selectedSubject.name === '历史') 
      ? (knowledgePoints || [])  // Show all knowledge points for history
      : (knowledgePoints || []).filter(kp => kp.subjectId === selectedSubject.id)
    : (knowledgePoints || []);  // Show all knowledge points when no subject selected (they're all history anyway)

  // 获取当前学科的题目 - with null checks
  const currentSubjectQuestions = selectedSubject
    ? (quizQuestions || []).filter(q => {
        const kp = (knowledgePoints || []).find(kp => kp.id === q.relatedKnowledgePointId);
        return kp?.subjectId === selectedSubject.id;
      })
    : (quizQuestions || []);  // Show all questions when no subject selected (they're all history anyway)

  // Show loading state while data is being fetched
  if (subjectsLoading || knowledgePointsLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // Navigate to quiz parser with authentication sharing
  const navigateToQuizParser = () => {
    authService.navigateToQuizParser();
  };

  // 渲染概览页面
  const renderOverview = () => (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">学生</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {statsLoading ? '...' : statistics.totalStudents}
          </div>
          <div className="text-sm text-gray-600 mb-3">总学生数</div>
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">本月活跃</span>
              <span className="text-lg font-semibold text-purple-600">
                {statsLoading ? '...' : statistics.monthlyActiveStudents || statistics.activeStudents}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">练习</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {statsLoading ? '...' : (statistics.totalPracticeSessions || statistics.monthlyPracticeSessions).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mb-3">总练习次数</div>
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">本月练习</span>
              <span className="text-lg font-semibold text-orange-600">
                {statsLoading ? '...' : statistics.monthlyPracticeSessions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="group flex items-center text-gray-600 hover:text-gray-900 transition-all duration-300 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                返回
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理中心</h1>
                <p className="text-gray-600">欢迎回来，{teacher.name}</p>
              </div>
            </div>

            {/* 学科选择 */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedSubject?.id || ''}
                onChange={(e) => {
                  const subject = subjects.find(s => s.id === e.target.value);
                  if (subject) {
                    handleSelectSubject(subject);
                  }
                }}
                className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">选择学科</option>
                {teacherSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-8">
            <div className="flex overflow-x-auto">
              {[
                // Show different tabs based on role
                ...(isStudent ? [] : [{ id: 'overview', label: '概览', icon: BarChart3 }]),
                { id: 'knowledge-points', label: isStudent ? '知识点列表' : '知识点管理', icon: BookOpen },
                ...(isStudent ? [] : [
                  { id: 'questions', label: '题库管理', icon: FileText },
                  { id: 'leaderboard', label: '排行榜', icon: Trophy }
                ]),
                ...(isAdmin ? [
                  { id: 'users', label: '用户管理', icon: Users },
                  { id: 'ai-config', label: 'AI配置管理', icon: Cpu }
                ] : []),
                // { id: 'analytics', label: '数据分析', icon: BarChart3 }, // Hidden for now
                { id: 'settings', label: '设置', icon: Settings }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as ActiveTab);
                      // Clear quiz bank filters when switching tabs normally
                      if (tab.id !== 'questions') {
                        setQuizBankFilters(null);
                      }
                    }}
                    className={`flex items-center px-6 py-4 font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/30'
                    }`}
                  >
                    <TabIcon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div>
            {activeTab === 'overview' && !isStudent && renderOverview()}
            {activeTab === 'knowledge-points' && (
              <KnowledgePointManagement 
                onNavigateToQuizBank={(filters) => {
                  if (!isStudent) {
                    setQuizBankFilters(filters);
                    setActiveTab('questions');
                  }
                }}
                readOnly={isStudent} // Pass read-only flag for students
              />
            )}
            {activeTab === 'questions' && (
              <QuizBankManagement 
                initialFilters={quizBankFilters || undefined}
              />
            )}
            {activeTab === 'users' && isAdmin && (
              <UserManagement />
            )}
            {activeTab === 'ai-config' && isAdmin && (
              <AIConfigManagement />
            )}
            {activeTab === 'leaderboard' && (
              <Leaderboard />
            )}
            {activeTab === 'analytics' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">数据分析</h3>
                <p className="text-gray-600">数据分析功能开发中...</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <SettingsPage />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}