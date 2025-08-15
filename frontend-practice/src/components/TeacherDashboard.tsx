import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText, Users, BarChart3, Settings, ExternalLink, Plus, Upload, Download } from 'lucide-react';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { Teacher } from '../types/teacher';
import { useSubjects, useKnowledgePoints, useQuestionSearch } from '../hooks/useApi';
import { authService } from '../services/authService';
import KnowledgePointManagement from '../pages/teacher/KnowledgePointManagement';
import QuizBankManagement from '../pages/teacher/QuizBankManagement';

interface TeacherDashboardProps {
  teacher: Teacher;
  onBack: () => void;
}

type ActiveTab = 'overview' | 'knowledge-points' | 'questions' | 'analytics' | 'settings';

export default function TeacherDashboard({ teacher, onBack }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // Use API hooks to fetch data
  const { data: subjects = [], loading: subjectsLoading } = useSubjects();
  const { data: knowledgePoints = [], loading: knowledgePointsLoading } = useKnowledgePoints();
  const { data: quizQuestions = [], loading: questionsLoading } = useQuestionSearch('');
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Set selected subject once subjects data is loaded
  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedSubject) {
      const teacherSubject = subjects.find(s => teacher.subjects.includes(s.id));
      if (teacherSubject) {
        setSelectedSubject(teacherSubject);
      }
    }
  }, [subjects, teacher.subjects, selectedSubject]);

  // 获取教师可管理的学科 - with null check
  const teacherSubjects = (subjects || []).filter(s => teacher.subjects.includes(s.id));

  // 获取当前学科的知识点 - with null checks
  const currentSubjectKnowledgePoints = selectedSubject 
    ? (knowledgePoints || []).filter(kp => kp.subjectId === selectedSubject.id)
    : [];

  // 获取当前学科的题目 - with null checks
  const currentSubjectQuestions = selectedSubject
    ? (quizQuestions || []).filter(q => {
        const kp = (knowledgePoints || []).find(kp => kp.id === q.relatedKnowledgePointId);
        return kp?.subjectId === selectedSubject.id;
      })
    : [];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">知识点</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {currentSubjectKnowledgePoints.length}
          </div>
          <div className="text-sm text-gray-600">已创建知识点</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">题目</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {currentSubjectQuestions.length}
          </div>
          <div className="text-sm text-gray-600">已创建题目</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">学生</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">156</div>
          <div className="text-sm text-gray-600">活跃学生数</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">练习</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">1,234</div>
          <div className="text-sm text-gray-600">本月练习次数</div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">快速操作</h3>
          <button
            onClick={navigateToQuizParser}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 group"
            title="打开DOCX题库解析器 - 上传Word文档提取题目"
          >
            <FileText className="w-4 h-4 mr-2" />
            <span>题库解析器</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-60 group-hover:opacity-100" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('knowledge-points')}
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-300"
          >
            <BookOpen className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-blue-800">知识点管理</span>
          </button>
          
          <button
            onClick={() => setActiveTab('questions')}
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-300"
          >
            <FileText className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-green-800">题库管理</span>
          </button>
          
          <button 
            onClick={navigateToQuizParser}
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-300"
          >
            <Upload className="w-5 h-5 text-purple-600 mr-3" />
            <span className="font-medium text-purple-800">批量导入</span>
          </button>
          
          <button className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors duration-300">
            <Download className="w-5 h-5 text-orange-600 mr-3" />
            <span className="font-medium text-orange-800">导出数据</span>
          </button>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">最近活动</h3>
        <div className="space-y-4">
          {[
            { action: '批量导入题目', target: '历史练习题 15道', time: '2小时前', type: 'question' },
            { action: '查看了知识点', target: '中国古代政治制度', time: '4小时前', type: 'knowledge' },
            { action: '导出了题库', target: '第一单元题目集', time: '1天前', type: 'export' },
            { action: '查看数据分析', target: '学生练习统计', time: '2天前', type: 'analytics' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-300">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'question' ? 'bg-blue-100' :
                activity.type === 'knowledge' ? 'bg-green-100' :
                activity.type === 'export' ? 'bg-orange-100' :
                'bg-purple-100'
              }`}>
                {activity.type === 'question' ? (
                  <FileText className="w-4 h-4 text-blue-600" />
                ) : activity.type === 'knowledge' ? (
                  <BookOpen className="w-4 h-4 text-green-600" />
                ) : activity.type === 'export' ? (
                  <Download className="w-4 h-4 text-orange-600" />
                ) : (
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">
                  {activity.action} <span className="font-medium">{activity.target}</span>
                </div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
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
                <h1 className="text-2xl font-bold text-gray-900">教师管理中心</h1>
                <p className="text-gray-600">欢迎回来，{teacher.name}</p>
              </div>
            </div>

            {/* 学科选择 */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedSubject?.id || ''}
                onChange={(e) => setSelectedSubject(subjects.find(s => s.id === e.target.value) || null)}
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
                { id: 'overview', label: '概览', icon: BarChart3 },
                { id: 'knowledge-points', label: '知识点管理', icon: BookOpen },
                { id: 'questions', label: '题库管理', icon: FileText },
                { id: 'analytics', label: '数据分析', icon: BarChart3 },
                { id: 'settings', label: '设置', icon: Settings }
              ].map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
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
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'knowledge-points' && <KnowledgePointManagement />}
            {activeTab === 'questions' && <QuizBankManagement />}
            {activeTab === 'analytics' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">数据分析</h3>
                <p className="text-gray-600">数据分析功能开发中...</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">系统设置</h3>
                <p className="text-gray-600">设置功能开发中...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}