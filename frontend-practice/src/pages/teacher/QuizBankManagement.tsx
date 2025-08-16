import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Upload, Eye, Edit, Trash2, Plus, Calendar, Tag, Target, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const itemsPerPage = 10;

  // Mock data for development - defined early so it can be used in fetchQuizzes
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
    },
    {
      id: '4',
      type: 'single-choice',
      question: '下图展示了古代中国的行政区划演变。请问该图反映的是哪个朝代的制度？\n{{img:0}}',
      options: ['秦朝', '汉朝', '唐朝', '元朝'],
      answer: 2,
      difficulty: 'medium',
      images: ['https://via.placeholder.com/400x300/4F46E5/ffffff?text=唐朝行政区划图'],
      knowledgePoint: {
        topic: '行政区划',
        lesson: '第4课 古代行政制度',
        unit: '第一单元 中国古代政治制度',
        volume: '中外历史纲要上'
      },
      createdAt: '2024-01-17',
      tags: ['政治制度', '唐朝', '含图片']
    }
  ];

  // Store whether we're using mock data
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  // Track if data has been initially loaded
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch quizzes from backend - only on initial load for mock data
  useEffect(() => {
    // Always fetch on initial load
    if (!dataLoaded) {
      fetchQuizzes();
      return;
    }
    
    // If using mock data, don't refetch when filters change
    // The mock data deletions should persist until page refresh
    if (isUsingMockData) {
      console.log('Using mock data, skipping refetch');
      return;
    }
    
    // For real backend data, refetch when filters change
    fetchQuizzes();
  }, [currentPage, searchTerm, selectedType, selectedDifficulty, selectedTags]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedDifficulty, selectedTags]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      
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
        console.log('API response:', data);
        console.log('First quiz raw from API:', data.data?.[0]);
        // Check if we actually got quiz data
        if (data.data && data.data.length > 0) {
          // Ensure each quiz has an id field
          const quizzesWithIds = data.data.map((quiz: any, index: number) => {
            console.log(`Quiz ${index}:`, quiz, 'has ID:', quiz.id);
            return {
              ...quiz,
              id: quiz.id || quiz._id || `quiz-${index}` // Fallback to generated ID if missing
            };
          });
          console.log('Processed quizzes:', quizzesWithIds);
          setQuizzes(quizzesWithIds);
          setIsUsingMockData(false);
          setTotalPages(Math.ceil((data.count || data.data.length) / itemsPerPage));
          
          // Extract available tags from the quizzes
          const allTags = new Set<string>();
          quizzesWithIds.forEach((quiz: any) => {
            if (quiz.tags && Array.isArray(quiz.tags)) {
              quiz.tags.forEach((tag: string) => allTags.add(tag));
            }
          });
          setAvailableTags(Array.from(allTags).sort());
        } else {
          // No quizzes in database, use mock data
          console.log('No quizzes found in database, using mock data');
          setQuizzes([...mockQuizzes]); // Create a copy to avoid reference issues
          setIsUsingMockData(true);
          setTotalPages(Math.ceil(mockQuizzes.length / itemsPerPage));
          
          // Extract available tags from mock data
          const allTags = new Set<string>();
          mockQuizzes.forEach(quiz => {
            if (quiz.tags && Array.isArray(quiz.tags)) {
              quiz.tags.forEach(tag => allTags.add(tag));
            }
          });
          setAvailableTags(Array.from(allTags).sort());
        }
      } else {
        // API call failed, use mock data
        console.log('API call failed with status:', response.status, ', using mock data');
        setQuizzes([...mockQuizzes]); // Create a copy to avoid reference issues
        setIsUsingMockData(true);
        setTotalPages(Math.ceil(mockQuizzes.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      // Use mock data for development
      setQuizzes([...mockQuizzes]); // Create a copy to avoid reference issues
      setIsUsingMockData(true);
      setTotalPages(Math.ceil(mockQuizzes.length / itemsPerPage));
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

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
    
    // Remove selected quizzes from local state
    const quizIdsToDelete = Array.from(selectedQuizzes);
    console.log('Deleting quizzes:', quizIdsToDelete);
    
    // Filter out the deleted quizzes
    setQuizzes(prev => {
      const filtered = prev.filter(q => !selectedQuizzes.has(q.id));
      console.log(`Batch deleted ${selectedQuizzes.size} quizzes, remaining: ${filtered.length}`);
      return filtered;
    });
    
    // Clear selections
    setSelectedQuizzes(new Set());
    
    // Don't refetch - we've already updated the local state
    // Only refetch if we're working with real backend data
    if (!isUsingMockData) {
      // TODO: Implement batch delete API call
      // For now, just update local state
    }
  };

  const handleNavigateToQuizParser = () => {
    authService.navigateToQuizParser();
  };

  const handleDeleteQuiz = async (quizId: string) => {
    console.log('Attempting to delete quiz with ID:', quizId);
    
    if (!quizId) {
      console.error('Cannot delete quiz: ID is undefined');
      alert('无法删除题目：题目ID无效');
      return;
    }
    
    if (!confirm('确定要删除这道题目吗？此操作不可恢复。')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/quiz/${quizId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Remove from local state
        setQuizzes(prev => {
          const filtered = prev.filter(q => q.id !== quizId);
          console.log(`Deleted quiz ${quizId}, remaining quizzes:`, filtered.length);
          return filtered;
        });
        // Clear selection if this quiz was selected
        setSelectedQuizzes(prev => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
      } else {
        // For now, just remove from local state even if API fails (mock data scenario)
        console.log('Delete API failed, removing from local state anyway');
        setQuizzes(prev => {
          const filtered = prev.filter(q => q.id !== quizId);
          console.log(`Deleted quiz ${quizId} (API failed), remaining quizzes:`, filtered.length);
          return filtered;
        });
        // Clear selection if this quiz was selected
        setSelectedQuizzes(prev => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      // Remove from local state anyway for demo purposes
      setQuizzes(prev => {
        const filtered = prev.filter(q => q.id !== quizId);
        console.log(`Deleted quiz ${quizId} (error), remaining quizzes:`, filtered.length);
        return filtered;
      });
      // Clear selection if this quiz was selected
      setSelectedQuizzes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quizId);
        return newSet;
      });
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setNewTag(''); // Clear the new tag input
    setShowEditModal(true);
  };

  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/quiz/${updatedQuiz.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quiz: updatedQuiz })
        }
      );

      if (response.ok) {
        // Update in local state
        setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      } else {
        // For now, just update local state even if API fails (mock data scenario)
        console.log('Update API failed, updating local state anyway');
        setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      }
    } catch (error) {
      console.error('Failed to update quiz:', error);
      // Update local state anyway for demo purposes
      setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
    }
    
    setShowEditModal(false);
    setEditingQuiz(null);
    setNewTag('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && editingQuiz) {
      const trimmedTag = newTag.trim();
      const currentTags = editingQuiz.tags || [];
      
      // Check if tag already exists
      if (!currentTags.includes(trimmedTag)) {
        setEditingQuiz({
          ...editingQuiz,
          tags: [...currentTags, trimmedTag]
        });
      }
      
      // Clear the input
      setNewTag('');
    }
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

  // Render question text with embedded images
  const renderQuestionWithImages = (text: string, images?: string[]) => {
    if (!text) return null;
    
    // Handle different image placeholder formats
    // Format 1: {{img:0}}, {{img:1}}, etc. (index-based)
    // Format 2: {{image:uuid}} (UUID-based)
    
    const parts = text.split(/(\{\{(?:img|image):[^}]+\}\})/g);
    
    return (
      <>
        {parts.map((part, index) => {
          // Check if this part is an image placeholder
          const imgMatch = part.match(/\{\{(?:img|image):([^}]+)\}\}/);
          
          if (imgMatch) {
            const imageRef = imgMatch[1];
            let imageUrl: string | undefined;
            
            // Check if it's an index (number)
            if (/^\d+$/.test(imageRef)) {
              const imageIndex = parseInt(imageRef);
              imageUrl = images?.[imageIndex];
            } else {
              // It's a UUID or filename, construct the URL
              // Check if it's already a full URL or relative path
              if (imageRef.startsWith('http') || imageRef.startsWith('/')) {
                imageUrl = imageRef;
              } else if (imageRef.includes('/')) {
                // Already has path structure (e.g., "2025/08/uuid.png")
                imageUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/attachments/quiz/${imageRef}`;
              } else {
                // Just a UUID, try to construct path with current year/month
                // This is a guess - in production, the full path should be stored with the quiz
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                
                // Check if imageRef already has extension
                const hasExtension = /\.\w+$/.test(imageRef);
                const filename = hasExtension ? imageRef : `${imageRef}.png`; // Default to .png if no extension
                
                imageUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/attachments/quiz/${year}/${month}/${filename}`;
              }
            }
            
            if (imageUrl) {
              // Add JWT token to image URL if needed for authentication
              const token = localStorage.getItem('jwt_token');
              const authenticatedUrl = token && imageUrl.includes('/attachments/') 
                ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
                : imageUrl;
                
              return (
                <div key={index} className="my-3">
                  <img
                    src={authenticatedUrl}
                    alt={`Quiz image ${imageRef}`}
                    className="max-w-full h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=';
                      target.alt = 'Image not available';
                    }}
                  />
                </div>
              );
            } else {
              // No image URL available, show placeholder
              return (
                <div key={index} className="my-3 p-4 bg-gray-100 rounded-lg text-gray-500 text-sm">
                  <Tag className="w-4 h-4 inline mr-2" />
                  图片加载失败: {imageRef}
                </div>
              );
            }
          } else {
            // Regular text
            return <span key={index}>{part}</span>;
          }
        })}
      </>
    );
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Search Input - takes up more space */}
              <div className="lg:col-span-5 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索题目内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Type Select */}
              <div className="lg:col-span-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部题型</option>
                  <option value="single-choice">单选题</option>
                  <option value="multiple-choice">多选题</option>
                  <option value="fill-in-the-blank">填空题</option>
                  <option value="subjective">主观题</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              {/* Difficulty Select */}
              <div className="lg:col-span-2">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>

              {/* Tags Filter */}
              <div className="lg:col-span-3">
                <div className="relative">
                  <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={selectedTags.length > 0 ? selectedTags[0] : 'all'}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setSelectedTags([]);
                      } else {
                        setSelectedTags([e.target.value]);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">全部标签</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
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
              {(() => {
                // Apply filters
                let filteredQuizzes = quizzes;

                // Filter by search term
                if (searchTerm) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                    (quiz.knowledgePoint && (
                      quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                    ))
                  );
                }

                // Filter by type
                if (selectedType !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                }

                // Filter by difficulty
                if (selectedDifficulty !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                }

                // Filter by tags
                if (selectedTags.length > 0) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                  );
                }

                // Calculate pagination for filtered results
                const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);

                return {
                  filteredQuizzes,
                  paginatedQuizzes,
                  totalFilteredPages
                };
              })().filteredQuizzes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {quizzes.length === 0 ? (
                    <>
                      <p className="text-gray-600 mb-4">暂无题目</p>
                      <button
                        onClick={handleNavigateToQuizParser}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                      >
                        批量导入题目
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-600">没有符合筛选条件的题目</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Re-calculate for render (this is not ideal but needed due to current structure)
                    let filteredQuizzes = quizzes;
                    if (searchTerm) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                        (quiz.knowledgePoint && (
                          quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                        ))
                      );
                    }
                    if (selectedType !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                    }
                    if (selectedDifficulty !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                    }
                    if (selectedTags.length > 0) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                      );
                    }
                    
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    return filteredQuizzes.slice(startIndex, endIndex);
                  })().map((quiz) => (
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
                          
                          {/* Question with image rendering */}
                          <div className="font-medium text-gray-900 mb-2">
                            {renderQuestionWithImages(quiz.question, quiz.images)}
                          </div>
                          
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
                          <button 
                            onClick={() => handleEditQuiz(quiz)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-300"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditQuiz(quiz)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-300"
                            title="编辑题目"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-300"
                            title="删除题目"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(() => {
                // Calculate filtered pagination info
                let filteredQuizzes = quizzes;
                if (searchTerm) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                    (quiz.knowledgePoint && (
                      quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                    ))
                  );
                }
                if (selectedType !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                }
                if (selectedDifficulty !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                }
                if (selectedTags.length > 0) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                  );
                }
                const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                return totalFilteredPages;
              })() > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {(() => {
                    // Calculate filtered pages for pagination buttons
                    let filteredQuizzes = quizzes;
                    if (searchTerm) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                        (quiz.knowledgePoint && (
                          quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                        ))
                      );
                    }
                    if (selectedType !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                    }
                    if (selectedDifficulty !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                    }
                    if (selectedTags.length > 0) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                      );
                    }
                    const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                    
                    return Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
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
                    });
                  })()}
                  
                  {(() => {
                    let filteredQuizzes = quizzes;
                    if (searchTerm) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                        (quiz.knowledgePoint && (
                          quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                        ))
                      );
                    }
                    if (selectedType !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                    }
                    if (selectedDifficulty !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                    }
                    if (selectedTags.length > 0) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                      );
                    }
                    const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                    
                    return totalFilteredPages > 5 && (
                      <span className="text-gray-400">...</span>
                    );
                  })()}
                  
                  <button
                    onClick={() => {
                      // Calculate max page for filtered results
                      let filteredQuizzes = quizzes;
                      if (searchTerm) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                          (quiz.knowledgePoint && (
                            quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                          ))
                        );
                      }
                      if (selectedType !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                      }
                      if (selectedDifficulty !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                      }
                      if (selectedTags.length > 0) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                        );
                      }
                      const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                      setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1));
                    }}
                    disabled={(() => {
                      let filteredQuizzes = quizzes;
                      if (searchTerm) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                          (quiz.knowledgePoint && (
                            quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                          ))
                        );
                      }
                      if (selectedType !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                      }
                      if (selectedDifficulty !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                      }
                      if (selectedTags.length > 0) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                        );
                      }
                      const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                      return currentPage === totalFilteredPages;
                    })()}
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

      {/* Edit Modal */}
      {showEditModal && editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">编辑题目</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingQuiz(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">题目类型</label>
                <select
                  value={editingQuiz.type}
                  onChange={(e) => setEditingQuiz({...editingQuiz, type: e.target.value as Quiz['type']})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="single-choice">单选题</option>
                  <option value="multiple-choice">多选题</option>
                  <option value="fill-in-the-blank">填空题</option>
                  <option value="subjective">主观题</option>
                  <option value="other">其他</option>
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">题目内容</label>
                <textarea
                  value={editingQuiz.question}
                  onChange={(e) => setEditingQuiz({...editingQuiz, question: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                {/* Preview with images */}
                {editingQuiz.question && editingQuiz.question.includes('{{') && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">预览:</p>
                    {renderQuestionWithImages(editingQuiz.question, editingQuiz.images as string[])}
                  </div>
                )}
              </div>

              {/* Options for choice questions */}
              {(editingQuiz.type === 'single-choice' || editingQuiz.type === 'multiple-choice') && editingQuiz.options && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
                  {editingQuiz.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">{String.fromCharCode(65 + index)}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...editingQuiz.options!];
                          newOptions[index] = e.target.value;
                          setEditingQuiz({...editingQuiz, options: newOptions});
                        }}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingQuiz({...editingQuiz, options: [...(editingQuiz.options || []), '']})}
                    className="mt-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    + 添加选项
                  </button>
                </div>
              )}

              {/* Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">答案</label>
                {editingQuiz.type === 'single-choice' && editingQuiz.options ? (
                  <select
                    value={typeof editingQuiz.answer === 'number' ? editingQuiz.answer : 0}
                    onChange={(e) => setEditingQuiz({...editingQuiz, answer: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {editingQuiz.options.map((_, index) => (
                      <option key={index} value={index}>
                        {String.fromCharCode(65 + index)}
                      </option>
                    ))}
                  </select>
                ) : editingQuiz.type === 'multiple-choice' && editingQuiz.options ? (
                  <div className="space-y-2">
                    {editingQuiz.options.map((_, index) => (
                      <label key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={Array.isArray(editingQuiz.answer) ? editingQuiz.answer.includes(index) : false}
                          onChange={(e) => {
                            const currentAnswers = Array.isArray(editingQuiz.answer) ? editingQuiz.answer : [];
                            if (e.target.checked) {
                              setEditingQuiz({...editingQuiz, answer: [...currentAnswers, index]});
                            } else {
                              setEditingQuiz({...editingQuiz, answer: currentAnswers.filter(a => a !== index)});
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span>{String.fromCharCode(65 + index)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={Array.isArray(editingQuiz.answer) ? editingQuiz.answer.join(', ') : editingQuiz.answer}
                    onChange={(e) => setEditingQuiz({...editingQuiz, answer: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={editingQuiz.type === 'fill-in-the-blank' ? '多个答案用逗号分隔' : '输入答案'}
                  />
                )}
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
                <select
                  value={editingQuiz.difficulty || 'medium'}
                  onChange={(e) => setEditingQuiz({...editingQuiz, difficulty: e.target.value as Quiz['difficulty']})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <div className="space-y-2">
                  {/* Current tags display */}
                  <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border border-gray-300 rounded-lg bg-gray-50">
                    {(editingQuiz.tags || []).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                      >
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = (editingQuiz.tags || []).filter((_, i) => i !== index);
                            setEditingQuiz({...editingQuiz, tags: newTags});
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(!editingQuiz.tags || editingQuiz.tags.length === 0) && (
                      <span className="text-gray-400 text-sm">暂无标签</span>
                    )}
                  </div>
                  
                  {/* Add new tag input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="输入新标签"
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingQuiz(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleSaveQuiz(editingQuiz)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}