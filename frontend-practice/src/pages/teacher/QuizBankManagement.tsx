import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Upload, Eye, Edit, Trash2, Plus, Calendar, Tag, Target, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { authService } from '../../services/authService';

interface Quiz {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other';
  question: string;
  options?: string[];
  answer: string | string[] | number | number[];
  difficulty?: 'easy' | 'medium' | 'hard';
  knowledgePointId?: string;
  knowledgePoint?: {
    topic: string;
    lesson: string;
    unit: string;
    volume: string;
  };
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

interface QuizBankManagementProps {
  onBack?: () => void;
}

export default function QuizBankManagement({ onBack }: QuizBankManagementProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;

  // Fetch quizzes from backend
  useEffect(() => {
    fetchQuizzes();
  }, [currentPage, searchTerm, selectedType, selectedDifficulty]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/quiz?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.data || []);
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      // Use mock data for development
      setQuizzes(mockQuizzes);
      setTotalPages(Math.ceil(mockQuizzes.length / itemsPerPage));
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const mockQuizzes: Quiz[] = [
    {
      id: '1',
      type: 'single-choice',
      question: '中国古代的"三省六部制"中，负责草拟诏令的是哪个部门？',
      options: ['中书省', '门下省', '尚书省', '吏部'],
      answer: 0,
      difficulty: 'medium',
      knowledgePoint: {
        topic: '三省六部制',
        lesson: '第2课 从三省六部到内阁、军机处',
        unit: '第一单元 中国古代政治制度',
        volume: '中外历史纲要上'
      },
      createdAt: '2024-01-15',
      tags: ['政治制度', '隋唐']
    },
    {
      id: '2',
      type: 'multiple-choice',
      question: '下列哪些是宋代加强中央集权的措施？',
      options: ['设立枢密院', '实行三司制度', '设立通判', '推行科举制'],
      answer: [0, 1, 2],
      difficulty: 'hard',
      knowledgePoint: {
        topic: '宋代中央集权',
        lesson: '第3课 宋元明清的政治制度',
        unit: '第一单元 中国古代政治制度',
        volume: '中外历史纲要上'
      },
      createdAt: '2024-01-16',
      tags: ['政治制度', '宋代']
    },
    {
      id: '3',
      type: 'fill-in-the-blank',
      question: '秦朝建立的中央官制是______制，其中______负责军事。',
      answer: ['三公九卿', '太尉'],
      difficulty: 'easy',
      knowledgePoint: {
        topic: '秦朝政治制度',
        lesson: '第1课 中国古代政治制度的形成与发展',
        unit: '第一单元 中国古代政治制度',
        volume: '中外历史纲要上'
      },
      createdAt: '2024-01-14',
      tags: ['政治制度', '秦汉']
    }
  ];

  const handleSelectQuiz = (quizId: string) => {
    const newSelected = new Set(selectedQuizzes);
    if (newSelected.has(quizId)) {
      newSelected.delete(quizId);
    } else {
      newSelected.add(quizId);
    }
    setSelectedQuizzes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuizzes.size === quizzes.length) {
      setSelectedQuizzes(new Set());
    } else {
      setSelectedQuizzes(new Set(quizzes.map(q => q.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedQuizzes.size === 0) {
      alert('请先选择要删除的题目');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedQuizzes.size} 道题目吗？`)) {
      return;
    }
    
    // TODO: Implement batch delete API call
    console.log('Deleting quizzes:', Array.from(selectedQuizzes));
    setSelectedQuizzes(new Set());
    fetchQuizzes();
  };

  const handleNavigateToQuizParser = () => {
    authService.navigateToQuizParser();
  };

  const getQuizTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'single-choice': '单选题',
      'multiple-choice': '多选题',
      'fill-in-the-blank': '填空题',
      'subjective': '主观题',
      'other': '其他'
    };
    return typeMap[type] || type;
  };

  const getQuizTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'single-choice': 'bg-blue-100 text-blue-800',
      'multiple-choice': 'bg-purple-100 text-purple-800',
      'fill-in-the-blank': 'bg-green-100 text-green-800',
      'subjective': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labelMap: Record<string, string> = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return labelMap[difficulty] || difficulty;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载题库中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">题库管理</h1>
            <p className="text-gray-600">管理和维护题目库</p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleNavigateToQuizParser}
                className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 group"
              >
                <Upload className="w-5 h-5 mr-2" />
                <span>批量导入题目</span>
                <ExternalLink className="w-4 h-4 ml-2 opacity-60 group-hover:opacity-100" />
              </button>
              
              {selectedQuizzes.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  <span>删除选中 ({selectedQuizzes.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索题目内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部题型</option>
                <option value="single-choice">单选题</option>
                <option value="multiple-choice">多选题</option>
                <option value="fill-in-the-blank">填空题</option>
                <option value="subjective">主观题</option>
                <option value="other">其他</option>
              </select>
              
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>

          {/* Quiz List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6">
              {/* Table Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">题目列表</h3>
                <div className="text-sm text-gray-600">
                  共 {quizzes.length} 道题目
                </div>
              </div>

              {/* Select All Checkbox */}
              <div className="border-b border-gray-200 pb-3 mb-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedQuizzes.size === quizzes.length && quizzes.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">全选</span>
                </label>
              </div>

              {/* Quiz Items */}
              {quizzes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">暂无题目</p>
                  <button
                    onClick={handleNavigateToQuizParser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    批量导入题目
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start space-x-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedQuizzes.has(quiz.id)}
                          onChange={() => handleSelectQuiz(quiz.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                        
                        {/* Quiz Content */}
                        <div className="flex-1">
                          {/* Tags and Labels */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuizTypeColor(quiz.type)}`}>
                              {getQuizTypeLabel(quiz.type)}
                            </span>
                            {quiz.difficulty && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                                {getDifficultyLabel(quiz.difficulty)}
                              </span>
                            )}
                            {quiz.tags?.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                <Tag className="w-3 h-3 inline mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Question */}
                          <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{quiz.question}</h4>
                          
                          {/* Options for choice questions */}
                          {quiz.options && quiz.options.length > 0 && (
                            <div className="space-y-1 mb-3">
                              {quiz.options.map((option, index) => {
                                const isCorrect = Array.isArray(quiz.answer) 
                                  ? quiz.answer.includes(index)
                                  : quiz.answer === index;
                                return (
                                  <div key={index} className={`text-sm ${isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                    {String.fromCharCode(65 + index)}. {option}
                                    {isCorrect && <span className="ml-2">✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Knowledge Point */}
                          {quiz.knowledgePoint && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Target className="w-4 h-4 mr-2 text-gray-400" />
                              <span>
                                {quiz.knowledgePoint.volume} / {quiz.knowledgePoint.unit} / {quiz.knowledgePoint.lesson} / {quiz.knowledgePoint.topic}
                              </span>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{quiz.createdAt || '2024-01-15'}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2">
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
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg font-medium transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && (
                    <span className="text-gray-400">...</span>
                  )}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}