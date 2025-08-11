import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText, Users, BarChart3, Settings, Plus, Search, Filter, Download, Upload, Brain, Sparkles, Target, Clock, CheckCircle, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { Subject, KnowledgePoint, QuizQuestion } from '../types/quiz';
import { Teacher, QuestionDraft, KnowledgePointDraft, AIAnalysisResult } from '../types/teacher';
import { useSubjects, useKnowledgePoints, useQuestionSearch } from '../hooks/useApi';

interface TeacherDashboardProps {
  teacher: Teacher;
  onBack: () => void;
}

type ActiveTab = 'overview' | 'knowledge-points' | 'questions' | 'analytics' | 'settings';
type QuestionTab = 'list' | 'add' | 'import';
type KnowledgeTab = 'list' | 'add' | 'structure';

export default function TeacherDashboard({ teacher, onBack }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [questionTab, setQuestionTab] = useState<QuestionTab>('list');
  const [knowledgeTab, setKnowledgeTab] = useState<KnowledgeTab>('list');
  
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

  // 题目管理状态
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>({
    type: 'multiple-choice',
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    answer: '',
    difficulty: 'medium',
    tags: [],
    createdBy: teacher.id,
    createdAt: new Date(),
    status: 'draft'
  });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 知识点管理状态
  const [knowledgePointDrafts, setKnowledgePointDrafts] = useState<KnowledgePointDraft[]>([]);
  const [currentKnowledgePoint, setCurrentKnowledgePoint] = useState<KnowledgePointDraft>({
    subjectId: selectedSubject?.id || '',
    volume: '',
    unit: '',
    lesson: '',
    section: '',
    topic: '',
    description: '',
    prerequisites: [],
    relatedPoints: [],
    createdBy: teacher.id,
    createdAt: new Date(),
    status: 'draft'
  });

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved' | 'review'>('all');

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

  // 模拟AI分析功能
  const analyzeQuestionWithAI = async (question: QuestionDraft): Promise<AIAnalysisResult> => {
    setIsAnalyzing(true);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // 模拟AI分析结果
    const relevantKnowledgePoints = currentSubjectKnowledgePoints
      .filter(kp => 
        question.question.toLowerCase().includes(kp.topic.toLowerCase()) ||
        question.question.toLowerCase().includes(kp.lesson.toLowerCase())
      )
      .slice(0, 3)
      .map(kp => ({
        id: kp.id,
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
        reason: `题目内容与"${kp.topic}"高度相关`
      }));

    const result: AIAnalysisResult = {
      suggestedKnowledgePoints: relevantKnowledgePoints,
      suggestedAnswer: question.type === 'multiple-choice' ? 'A' : undefined,
      suggestedExplanation: question.type === 'multiple-choice' 
        ? '根据题目内容分析，选项A最符合相关知识点的核心概念。'
        : '建议从结构特点、功能机制、实际应用等角度进行分析。',
      suggestedDifficulty: Math.random() > 0.5 ? 'medium' : 'hard',
      suggestedTags: ['核心概念', '理解应用'],
      qualityScore: Math.random() * 30 + 70, // 70-100
      improvements: [
        '建议在题目中增加更具体的情境描述',
        '可以考虑增加干扰选项的迷惑性',
        '题目表述可以更加简洁明确'
      ]
    };

    setIsAnalyzing(false);
    return result;
  };

  // 处理AI分析
  const handleAIAnalysis = async () => {
    if (!currentQuestion.question.trim()) {
      alert('请先输入题目内容');
      return;
    }

    try {
      const result = await analyzeQuestionWithAI(currentQuestion);
      setAiAnalysis(result);
      
      // 自动应用AI建议
      if (result.suggestedKnowledgePoints.length > 0) {
        setCurrentQuestion(prev => ({
          ...prev,
          relatedKnowledgePointId: result.suggestedKnowledgePoints[0].id
        }));
      }
      
      if (result.suggestedAnswer && currentQuestion.type === 'multiple-choice') {
        setCurrentQuestion(prev => ({
          ...prev,
          answer: result.suggestedAnswer
        }));
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      alert('AI分析失败，请稍后重试');
    }
  };

  // 保存题目
  const handleSaveQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('请输入题目内容');
      return;
    }

    if (currentQuestion.type === 'multiple-choice') {
      if (!currentQuestion.options?.A || !currentQuestion.options?.B || 
          !currentQuestion.options?.C || !currentQuestion.options?.D) {
        alert('请完善所有选项');
        return;
      }
      if (!currentQuestion.answer) {
        alert('请选择正确答案');
        return;
      }
    }

    if (!currentQuestion.relatedKnowledgePointId) {
      alert('请选择相关知识点');
      return;
    }

    const newQuestion: QuestionDraft = {
      ...currentQuestion,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setQuestionDrafts(prev => [newQuestion, ...prev]);
    
    // 重置表单
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: { A: '', B: '', C: '', D: '' },
      answer: '',
      difficulty: 'medium',
      tags: [],
      createdBy: teacher.id,
      createdAt: new Date(),
      status: 'draft'
    });
    setAiAnalysis(null);
    
    alert('题目保存成功！');
  };

  // 保存知识点
  const handleSaveKnowledgePoint = () => {
    if (!currentKnowledgePoint.volume || !currentKnowledgePoint.unit || 
        !currentKnowledgePoint.lesson || !currentKnowledgePoint.section || 
        !currentKnowledgePoint.topic) {
      alert('请完善知识点信息');
      return;
    }

    const newKnowledgePoint: KnowledgePointDraft = {
      ...currentKnowledgePoint,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setKnowledgePointDrafts(prev => [newKnowledgePoint, ...prev]);
    
    // 重置表单
    setCurrentKnowledgePoint({
      subjectId: selectedSubject?.id || '',
      volume: '',
      unit: '',
      lesson: '',
      section: '',
      topic: '',
      description: '',
      prerequisites: [],
      relatedPoints: [],
      createdBy: teacher.id,
      createdAt: new Date(),
      status: 'draft'
    });
    
    alert('知识点保存成功！');
  };

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
        <h3 className="text-lg font-bold text-gray-900 mb-6">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              setActiveTab('questions');
              setQuestionTab('add');
            }}
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-300"
          >
            <Plus className="w-5 h-5 text-blue-600 mr-3" />
            <span className="font-medium text-blue-800">添加题目</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('knowledge-points');
              setKnowledgeTab('add');
            }}
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-300"
          >
            <Plus className="w-5 h-5 text-green-600 mr-3" />
            <span className="font-medium text-green-800">添加知识点</span>
          </button>
          
          <button className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-300">
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
            { action: '创建了新题目', target: '中国古代政治制度选择题', time: '2小时前', type: 'question' },
            { action: '修改了知识点', target: '先秦时期的政治制度', time: '4小时前', type: 'knowledge' },
            { action: '审核通过题目', target: '细胞膜结构问答题', time: '1天前', type: 'review' },
            { action: '添加了知识点', target: '基因的分离定律', time: '2天前', type: 'knowledge' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-300">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'question' ? 'bg-blue-100' :
                activity.type === 'knowledge' ? 'bg-green-100' :
                'bg-purple-100'
              }`}>
                {activity.type === 'question' ? (
                  <FileText className={`w-4 h-4 ${
                    activity.type === 'question' ? 'text-blue-600' :
                    activity.type === 'knowledge' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                ) : activity.type === 'knowledge' ? (
                  <BookOpen className="w-4 h-4 text-green-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-purple-600" />
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

  // 渲染题目管理页面
  const renderQuestionManagement = () => (
    <div className="space-y-6">
      {/* 标签页 */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'list', label: '题目列表', icon: FileText },
          { id: 'add', label: '添加题目', icon: Plus },
          { id: 'import', label: '批量导入', icon: Upload }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setQuestionTab(tab.id as QuestionTab)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                questionTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TabIcon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {questionTab === 'list' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {/* 搜索和筛选 */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索题目..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="draft">草稿</option>
                <option value="review">待审核</option>
                <option value="approved">已通过</option>
              </select>
            </div>
          </div>

          {/* 题目列表 */}
          <div className="p-6">
            <div className="space-y-4">
              {questionDrafts.map((question) => (
                <div key={question.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.type === 'multiple-choice' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.type === 'multiple-choice' ? '选择题' : '问答题'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty === 'easy' ? '简单' : 
                           question.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          question.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                          question.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.status === 'draft' ? '草稿' :
                           question.status === 'review' ? '待审核' :
                           question.status === 'approved' ? '已通过' : '已拒绝'}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {question.question}
                      </h4>
                      <div className="text-sm text-gray-600">
                        创建时间：{question.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {questionDrafts.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无题目</h3>
                  <p className="text-gray-600 mb-4">开始创建您的第一个题目</p>
                  <button
                    onClick={() => setQuestionTab('add')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    添加题目
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {questionTab === 'add' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 题目编辑区 */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">创建题目</h3>
            
            <div className="space-y-6">
              {/* 题目类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">题目类型</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="questionType"
                      value="multiple-choice"
                      checked={currentQuestion.type === 'multiple-choice'}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">选择题</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="questionType"
                      value="essay"
                      checked={currentQuestion.type === 'essay'}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">问答题</span>
                  </label>
                </div>
              </div>

              {/* 题目内容 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">题目内容</label>
                <textarea
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="请输入题目内容..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* 选择题选项 */}
              {currentQuestion.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">选项设置</label>
                  <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map(option => (
                      <div key={option} className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {option}
                        </span>
                        <input
                          type="text"
                          value={currentQuestion.options?.[option as keyof typeof currentQuestion.options] || ''}
                          onChange={(e) => setCurrentQuestion(prev => ({
                            ...prev,
                            options: { ...prev.options!, [option]: e.target.value }
                          }))}
                          placeholder={`选项${option}内容`}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={option}
                            checked={currentQuestion.answer === option}
                            onChange={(e) => setCurrentQuestion(prev => ({ ...prev, answer: e.target.value }))}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="ml-1 text-sm text-gray-600">正确</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 问答题标准答案 */}
              {currentQuestion.type === 'essay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标准答案</label>
                  <textarea
                    value={currentQuestion.standardAnswer || ''}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, standardAnswer: e.target.value }))}
                    placeholder="请输入标准答案..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              )}

              {/* 知识点选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">相关知识点</label>
                <select
                  value={currentQuestion.relatedKnowledgePointId || ''}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, relatedKnowledgePointId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择知识点</option>
                  {currentSubjectKnowledgePoints.map(kp => (
                    <option key={kp.id} value={kp.id}>
                      {kp.volume} - {kp.unit} - {kp.lesson} - {kp.section} - {kp.topic}
                    </option>
                  ))}
                </select>
              </div>

              {/* 难度和标签 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">难度等级</label>
                  <select
                    value={currentQuestion.difficulty}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <input
                    type="text"
                    placeholder="输入标签，用逗号分隔"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing || !currentQuestion.question.trim()}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      AI分析中...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      AI智能分析
                    </>
                  )}
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  保存题目
                </button>
              </div>
            </div>
          </div>

          {/* AI分析结果 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
              AI智能助手
            </h3>
            
            {!aiAnalysis && !isAnalyzing && (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">
                  输入题目内容后，点击"AI智能分析"获取智能建议
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-purple-600 font-medium">AI正在分析题目...</p>
                <p className="text-gray-600 text-sm mt-2">
                  正在分析知识点关联、难度评估和质量检查
                </p>
              </div>
            )}

            {aiAnalysis && (
              <div className="space-y-6">
                {/* 质量评分 */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">题目质量评分</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {Math.round(aiAnalysis.qualityScore)}
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${aiAnalysis.qualityScore}%` }}
                    />
                  </div>
                </div>

                {/* 推荐知识点 */}
                {aiAnalysis.suggestedKnowledgePoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">推荐知识点</h4>
                    <div className="space-y-2">
                      {aiAnalysis.suggestedKnowledgePoints.map((suggestion, index) => {
                        const kp = currentSubjectKnowledgePoints.find(k => k.id === suggestion.id);
                        return (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-blue-800">
                                {kp?.topic}
                              </span>
                              <span className="text-xs text-blue-600">
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-blue-700">{suggestion.reason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI建议 */}
                {aiAnalysis.suggestedAnswer && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">AI推荐答案</h4>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">{aiAnalysis.suggestedAnswer}</p>
                    </div>
                  </div>
                )}

                {/* 改进建议 */}
                {aiAnalysis.improvements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">改进建议</h4>
                    <div className="space-y-2">
                      {aiAnalysis.improvements.map((improvement, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-orange-600">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{improvement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {questionTab === 'import' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">批量导入题目</h3>
          
          <div className="space-y-6">
            {/* 导入方式选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">导入方式</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-300 cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">Excel文件导入</h4>
                  <p className="text-sm text-gray-600">支持.xlsx, .xls格式</p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-300 cursor-pointer">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">文本批量导入</h4>
                  <p className="text-sm text-gray-600">复制粘贴题目文本</p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-300 cursor-pointer">
                  <Brain className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-2">AI智能生成</h4>
                  <p className="text-sm text-gray-600">基于知识点生成题目</p>
                </div>
              </div>
            </div>

            {/* 模板下载 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">下载导入模板</h4>
                  <p className="text-sm text-blue-700">使用标准模板可以确保导入成功率</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300">
                  <Download className="w-4 h-4 mr-2 inline" />
                  下载模板
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染知识点管理页面
  const renderKnowledgePointManagement = () => (
    <div className="space-y-6">
      {/* 标签页 */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'list', label: '知识点列表', icon: BookOpen },
          { id: 'add', label: '添加知识点', icon: Plus },
          { id: 'structure', label: '知识结构', icon: Target }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setKnowledgeTab(tab.id as KnowledgeTab)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                knowledgeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TabIcon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {knowledgeTab === 'add' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">添加知识点</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">册/模块</label>
                <input
                  type="text"
                  value={currentKnowledgePoint.volume}
                  onChange={(e) => setCurrentKnowledgePoint(prev => ({ ...prev, volume: e.target.value }))}
                  placeholder="如：中外历史纲要上"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">单元</label>
                <input
                  type="text"
                  value={currentKnowledgePoint.unit}
                  onChange={(e) => setCurrentKnowledgePoint(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="如：第一单元 从中华文明起源到秦汉统一..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">课/节</label>
                <input
                  type="text"
                  value={currentKnowledgePoint.lesson}
                  onChange={(e) => setCurrentKnowledgePoint(prev => ({ ...prev, lesson: e.target.value }))}
                  placeholder="如：第1课 中华文明的起源与早期国家"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">子目</label>
                <input
                  type="text"
                  value={currentKnowledgePoint.section}
                  onChange={(e) => setCurrentKnowledgePoint(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="如：第一子目 石器时代的古人类和文化遗存"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">知识点</label>
                <input
                  type="text"
                  value={currentKnowledgePoint.topic}
                  onChange={(e) => setCurrentKnowledgePoint(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="如：旧石器时代与新石器文明"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">知识点描述</label>
              <textarea
                value={currentKnowledgePoint.description || ''}
                onChange={(e) => setCurrentKnowledgePoint(prev => ({ ...prev, description: e.target.value }))}
                placeholder="详细描述该知识点的内容和要求..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveKnowledgePoint}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                保存知识点
              </button>
            </div>
          </div>
        </div>
      )}

      {knowledgeTab === 'list' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">知识点列表</h3>
          
          <div className="space-y-4">
            {currentSubjectKnowledgePoints.map((kp) => (
              <div key={kp.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{kp.topic}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>册次：{kp.volume}</div>
                      <div>单元：{kp.unit}</div>
                      <div>课程：{kp.lesson}</div>
                      <div>子目：{kp.section}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-300">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
            {activeTab === 'knowledge-points' && renderKnowledgePointManagement()}
            {activeTab === 'questions' && renderQuestionManagement()}
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