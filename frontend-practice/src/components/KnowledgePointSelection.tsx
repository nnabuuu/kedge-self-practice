import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Play, Minus, ChevronRight, ChevronDown, RotateCcw, Settings, Target, Clock, Shuffle, BookOpen, History, CheckSquare, Square, Zap, Sparkles, TrendingUp, Info, X, Brain, AlertCircle, FileText, Sliders } from 'lucide-react';
import { Subject } from '../types/quiz';
import { useKnowledgePoints } from '../hooks/useApi';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Slider } from '@/components/ui/slider';
import { preferencesService } from '../services/preferencesService';

interface KnowledgePointSelectionProps {
  subject: Subject;
  preSelectedPoints?: string[];
  onStartQuiz: (selectedPoints: string[], config: QuizConfig) => void;
  onBack: () => void;
}

interface QuizConfig {
  questionType: 'new' | 'with-wrong' | 'wrong-only';
  questionCount: 'unlimited' | number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  showExplanation: boolean;
  quizTypes?: ('single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other')[];
  autoAdvanceDelay?: number; // Delay in seconds before auto-advancing to next question after correct answer (0 = disabled)
}

interface GroupedKnowledgePoints {
  [volume: string]: {
    [unit: string]: {
      [lesson: string]: {
        [section: string]: {
          id: string;
          topic: string;
        }[];
      };
    };
  };
}

type SelectionState = 'none' | 'partial' | 'all';

export default function KnowledgePointSelection({ 
  subject, 
  preSelectedPoints = [], 
  onStartQuiz, 
  onBack 
}: KnowledgePointSelectionProps) {
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set(preSelectedPoints));
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [smartSuggestions, setSmartSuggestions] = useState<Map<string, { reason: string; priority: number; metadata?: any }>>(new Map());
  const [showSmartSuggestionInfo, setShowSmartSuggestionInfo] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  const [lastSelection, setLastSelection] = useLocalStorage<string[]>(`last-selection-${subject.id}`, []);
  
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    questionType: 'new',
    questionCount: 20,
    shuffleQuestions: true,
    showExplanation: true,
    autoAdvanceDelay: 3, // Default to 3 seconds auto-advance
    quizTypes: ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other'] // Default to all quiz types
  });

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const settings = await preferencesService.getQuizSettings();
        if (settings) {
          setQuizConfig(prev => ({
            ...prev,
            autoAdvanceDelay: settings.autoAdvanceDelay ?? 3,
            shuffleQuestions: settings.shuffleQuestions ?? true,
            showExplanation: settings.showExplanation ?? true
          }));
        }
      } catch (error) {
        console.error('Failed to load quiz preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Save preferences when quiz config changes
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await preferencesService.updateQuizSettings({
          autoAdvanceDelay: quizConfig.autoAdvanceDelay,
          shuffleQuestions: quizConfig.shuffleQuestions,
          showExplanation: quizConfig.showExplanation
        });
      } catch (error) {
        console.error('Failed to save quiz preferences:', error);
      }
    };
    
    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(savePreferences, 500);
    return () => clearTimeout(timeoutId);
  }, [quizConfig.autoAdvanceDelay, quizConfig.shuffleQuestions, quizConfig.showExplanation]);

  // 使用API Hook获取知识点数据
  const { data: knowledgePoints, loading, error } = useKnowledgePoints(subject.id);

  // Group knowledge points by hierarchy
  const groupedKnowledgePoints: GroupedKnowledgePoints = {};
  
  if (knowledgePoints) {
    knowledgePoints.forEach(kp => {
      if (!groupedKnowledgePoints[kp.volume]) {
        groupedKnowledgePoints[kp.volume] = {};
      }
      if (!groupedKnowledgePoints[kp.volume][kp.unit]) {
        groupedKnowledgePoints[kp.volume][kp.unit] = {};
      }
      if (!groupedKnowledgePoints[kp.volume][kp.unit][kp.lesson]) {
        groupedKnowledgePoints[kp.volume][kp.unit][kp.lesson] = [];
      }
      if (!groupedKnowledgePoints[kp.volume][kp.unit][kp.lesson][kp.section]) {
        groupedKnowledgePoints[kp.volume][kp.unit][kp.lesson][kp.section] = [];
      }
      groupedKnowledgePoints[kp.volume][kp.unit][kp.lesson][kp.section].push({
        id: kp.id,
        topic: kp.topic
      });
    });
  }

  const getPointsInVolume = (volume: string): string[] => {
    const points: string[] = [];
    Object.values(groupedKnowledgePoints[volume] || {}).forEach(units => {
      Object.values(units).forEach(lessons => {
        Object.values(lessons).forEach(sections => {
          sections.forEach(topic => points.push(topic.id));
        });
      });
    });
    return points;
  };

  const getPointsInUnit = (volume: string, unit: string): string[] => {
    const points: string[] = [];
    Object.values(groupedKnowledgePoints[volume]?.[unit] || {}).forEach(lessons => {
      Object.values(lessons).forEach(sections => {
        sections.forEach(topic => points.push(topic.id));
      });
    });
    return points;
  };

  const getPointsInLesson = (volume: string, unit: string, lesson: string): string[] => {
    const points: string[] = [];
    Object.values(groupedKnowledgePoints[volume]?.[unit]?.[lesson] || {}).forEach(sections => {
      sections.forEach(topic => points.push(topic.id));
    });
    return points;
  };

  const getPointsInSection = (volume: string, unit: string, lesson: string, section: string): string[] => {
    return (groupedKnowledgePoints[volume]?.[unit]?.[lesson]?.[section] || []).map(topic => topic.id);
  };

  const getSelectionState = (allPoints: string[]): SelectionState => {
    const selectedCount = allPoints.filter(id => selectedPoints.has(id)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === allPoints.length) return 'all';
    return 'partial';
  };

  const toggleExpand = (type: 'volume' | 'unit' | 'lesson' | 'section', key: string) => {
    const setters = {
      volume: setExpandedVolumes,
      unit: setExpandedUnits,
      lesson: setExpandedLessons,
      section: setExpandedSections
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

  const togglePoint = (pointId: string) => {
    const newSelected = new Set(selectedPoints);
    if (newSelected.has(pointId)) {
      newSelected.delete(pointId);
    } else {
      newSelected.add(pointId);
    }
    setSelectedPoints(newSelected);
  };

  const toggleLevel = (allPoints: string[]) => {
    const newSelected = new Set(selectedPoints);
    const currentState = getSelectionState(allPoints);
    
    if (currentState === 'all') {
      allPoints.forEach(id => newSelected.delete(id));
    } else {
      allPoints.forEach(id => newSelected.add(id));
    }
    
    setSelectedPoints(newSelected);
  };

  const useLastSelection = () => {
    setSelectedPoints(new Set(lastSelection));
    setSmartSuggestions(new Map());
    setShowSmartSuggestionInfo(false);
  };

  const selectAllPoints = () => {
    if (knowledgePoints) {
      const allPoints = knowledgePoints.map(kp => kp.id);
      setSelectedPoints(new Set(allPoints));
    }
  };

  const clearAllSelections = () => {
    setSelectedPoints(new Set());
    setSmartSuggestions(new Map());
    setShowSmartSuggestionInfo(false);
  };

  // 智能推荐功能 - 使用后端AI推荐
  const useSmartRecommendation = async () => {
    try {
      // Show loading state (you could add a loading spinner here)
      const token = localStorage.getItem('jwt_token');
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      // Call backend smart suggestions API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
        ? import.meta.env.VITE_API_BASE_URL
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1`;
      
      const params = new URLSearchParams({
        userId: currentUser.id || 'anonymous',
        subjectId: subject.id,
        maxPoints: '10',
        strategy: 'adaptive', // Use adaptive strategy for best results
      });
      
      const response = await fetch(`${apiBaseUrl}/knowledge-points/smart-suggestions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.suggestions?.length > 0) {
          // Extract knowledge point IDs from suggestions and store reasons
          const suggestedIds = data.suggestions.map((s: any) => s.knowledgePointId);
          const suggestionMap = new Map();
          data.suggestions.forEach((s: any) => {
            suggestionMap.set(s.knowledgePointId, {
              reason: s.reason,
              priority: s.priority,
              metadata: s.metadata
            });
          });
          
          setSelectedPoints(new Set(suggestedIds));
          setSmartSuggestions(suggestionMap);
          setShowSmartSuggestionInfo(false); // Default to collapsed
          
          console.log('Smart suggestions applied:', data.suggestions);
        } else {
          // Fallback to simple logic if no suggestions
          fallbackSmartRecommendation();
        }
      } else {
        // Fallback to simple logic on error
        fallbackSmartRecommendation();
      }
    } catch (error) {
      console.error('Failed to get smart suggestions:', error);
      // Fallback to simple logic on error
      fallbackSmartRecommendation();
    }
  };
  
  // Fallback recommendation logic (original simple logic)
  const fallbackSmartRecommendation = () => {
    const recommendedPoints: string[] = [];
    Object.entries(groupedKnowledgePoints).forEach(([volume, units]) => {
      const firstUnit = Object.keys(units)[0];
      if (firstUnit) {
        const lessons = units[firstUnit];
        Object.values(lessons).forEach(sections => {
          Object.values(sections).forEach(topics => {
            // 每个子目选择前1个知识点
            topics.slice(0, 1).forEach(topic => {
              recommendedPoints.push(topic.id);
            });
          });
        });
      }
    });
    setSelectedPoints(new Set(recommendedPoints.slice(0, 10))); // 限制在10个知识点
  };

  const handleProceedToConfig = () => {
    if (selectedPoints.size > 0) {
      setLastSelection(Array.from(selectedPoints));
      setShowConfig(true);
    }
  };

  const handleStartQuiz = () => {
    const selected = Array.from(selectedPoints);
    onStartQuiz(selected, quizConfig);
  };

  const renderCheckbox = (state: SelectionState, onChange: () => void, label: string, className: string = "") => {
    return (
      <div 
        className={`flex items-center space-x-2 cursor-pointer transition-all duration-200 ${className}`}
        onClick={onChange}
      >
        <div className="relative">
          <input
            type="checkbox"
            checked={state === 'all'}
            onChange={() => {}}
            className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-1 transition-all duration-200"
          />
          {state === 'partial' && (
            <Minus className="w-2.5 h-2.5 text-blue-600 absolute top-0.5 left-0.5 pointer-events-none" />
          )}
        </div>
        <span className="flex-1 select-none text-sm font-medium tracking-wide">{label}</span>
        {state === 'all' && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
    );
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载知识点中...</h2>
            <p className="text-gray-600 tracking-wide">正在获取{subject.name}学科的知识点数据</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载失败</h2>
            <p className="text-gray-600 mb-6 tracking-wide">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header - 统一样式和布局 */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setShowConfig(false)}
                className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium tracking-wide">返回知识点选择</span>
              </button>

              {/* 强化的开始测验按钮 - 强触发器 */}
              <button
                onClick={handleStartQuiz}
                disabled={!quizConfig.quizTypes || quizConfig.quizTypes.length === 0}
                className={`group flex items-center px-8 py-4 text-lg font-bold rounded-2xl transform transition-all duration-300 ease-out relative overflow-hidden focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  quizConfig.quizTypes && quizConfig.quizTypes.length > 0
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:scale-105 hover:-translate-y-1 shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40 focus:ring-green-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center">
                  <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <div className="tracking-wide">开始测验</div>
                    <div className="text-xs opacity-90">预计用时 {typeof quizConfig.questionCount === 'number' ? Math.ceil(quizConfig.questionCount * 1.5) : '10-15'} 分钟</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Title Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2 leading-tight tracking-wide">
                测验配置
              </h1>
              <p className="text-lg text-gray-600 tracking-wide">
                已选择 <span className="font-semibold text-blue-600">{selectedPoints.size}</span> 个知识点
              </p>
            </div>

            {/* Practice Mode Presets - New Design */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setQuizConfig(prev => ({
                    ...prev,
                    questionCount: 10,
                    shuffleQuestions: true,
                    showExplanation: true
                  }))}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    quizConfig.questionCount === 10
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  <span className="mr-2">⚡</span>
                  快速练习
                  <span className="ml-2 text-sm opacity-80">10题</span>
                </button>
                
                <button
                  onClick={() => setQuizConfig(prev => ({
                    ...prev,
                    questionCount: 20,
                    shuffleQuestions: true,
                    showExplanation: true
                  }))}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    quizConfig.questionCount === 20
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  <span className="mr-2">📚</span>
                  标准练习
                  <span className="ml-2 text-sm opacity-80">20题</span>
                </button>
                
                <button
                  onClick={() => setQuizConfig(prev => ({
                    ...prev,
                    questionCount: 'unlimited',
                    shuffleQuestions: true,
                    showExplanation: true
                  }))}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    quizConfig.questionCount === 'unlimited'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md border border-gray-200'
                  }`}
                >
                  <span className="mr-2">♾️</span>
                  完整练习
                  <span className="ml-2 text-sm opacity-80">全部题目</span>
                </button>
                
              </div>
            </div>

            {/* 配置选项 - 重新组织为三个主要部分 */}
            <div className="space-y-4">
              {/* 第一部分：基础设置（题目类型和数量） */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center mb-5 pb-3 border-b border-gray-200">
                  <Settings className="w-6 h-6 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900 tracking-wide">基础设置</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* 题目来源 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Target className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">题目来源</h3>
                    </div>
                    <div className="space-y-2">
                      {[
                        { value: 'new', label: '只包含新题', icon: '🆕', desc: '适合初次学习' },
                        { value: 'with-wrong', label: '包含错题', icon: '🔄', desc: '巩固薄弱环节' },
                        { value: 'wrong-only', label: '只包含错题', icon: '❌', desc: '专项突破' }
                      ].map(option => (
                        <label key={option.value} className="group flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-blue-50/50 transition-all duration-300 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
                          <input
                            type="radio"
                            name="questionType"
                            value={option.value}
                            checked={quizConfig.questionType === option.value}
                            onChange={(e) => setQuizConfig(prev => ({ ...prev, questionType: e.target.value as any }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-lg">{option.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 tracking-wide">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 题目数量 */}
                  <div>
                    <div className="flex items-center mb-4">
                      <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">题目数量</h3>
                    </div>
                    <div className="space-y-2">
                      <label className="group flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-blue-50/50 transition-all duration-300 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
                        <input
                          type="radio"
                          name="questionCount"
                          checked={quizConfig.questionCount === 'unlimited'}
                          onChange={() => setQuizConfig(prev => ({ ...prev, questionCount: 'unlimited' }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-lg">♾️</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 tracking-wide">无限制</div>
                          <div className="text-xs text-gray-500">完整练习所有相关题目</div>
                        </div>
                      </label>
                      
                      <label className="group flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-blue-50/50 transition-all duration-300 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
                        <input
                          type="radio"
                          name="questionCount"
                          checked={typeof quizConfig.questionCount === 'number'}
                          onChange={() => setQuizConfig(prev => ({ ...prev, questionCount: 20 }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-lg">🎯</span>
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300 tracking-wide">指定数量</div>
                            <div className="text-xs text-gray-500">推荐 15-25 题，约 20-30 分钟</div>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={typeof quizConfig.questionCount === 'number' ? quizConfig.questionCount : 20}
                            onChange={(e) => setQuizConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 20 }))}
                            onClick={() => setQuizConfig(prev => ({ ...prev, questionCount: typeof prev.questionCount === 'number' ? prev.questionCount : 20 }))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-sm font-semibold"
                          />
                          <span className="text-gray-600 text-sm">题</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第二部分：题型选择 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center mb-5 pb-3 border-b border-gray-200">
                  <FileText className="w-6 h-6 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900 tracking-wide">题型设置</h2>
                </div>
                
                <div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">选择要包含的题目类型，建议全选以获得更全面的练习体验</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'single-choice', label: '单选题', icon: '☑️', desc: '每题一个正确答案' },
                      { value: 'multiple-choice', label: '多选题', icon: '✅', desc: '可能有多个正确答案' },
                      { value: 'fill-in-the-blank', label: '填空题', icon: '📝', desc: '填写正确答案' },
                      { value: 'subjective', label: '主观题', icon: '✍️', desc: '开放式回答' },
                      { value: 'other', label: '其他题型', icon: '❓', desc: '判断题等其他类型' }
                    ].map(type => (
                      <label key={type.value} className="group flex items-start space-x-2 cursor-pointer bg-white/50 hover:bg-blue-50 p-3 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={quizConfig.quizTypes?.includes(type.value as any) ?? false}
                          onChange={(e) => {
                            const currentTypes = quizConfig.quizTypes || [];
                            if (e.target.checked) {
                              setQuizConfig(prev => ({
                                ...prev,
                                quizTypes: [...currentTypes, type.value as any]
                              }));
                            } else {
                              setQuizConfig(prev => ({
                                ...prev,
                                quizTypes: currentTypes.filter(t => t !== type.value)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded flex-shrink-0 mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{type.icon}</span>
                            <span className="font-medium text-gray-900 group-hover:text-blue-600">{type.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {(!quizConfig.quizTypes || quizConfig.quizTypes.length === 0) && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      请至少选择一种题型
                    </p>
                  )}
                </div>
              </div>

              {/* 第三部分：高级选项 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center mb-5 pb-3 border-b border-gray-200">
                  <Sliders className="w-6 h-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900 tracking-wide">高级选项</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 左列：时间和顺序 */}
                  <div className="space-y-4">
                    {/* 时间限制 */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-purple-600 mr-2" />
                          <div className="font-medium text-gray-900">时间限制</div>
                        </div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!quizConfig.timeLimit}
                            onChange={(e) => setQuizConfig(prev => ({
                              ...prev,
                              timeLimit: e.target.checked ? 30 : undefined
                            }))}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-gray-600">
                            {quizConfig.timeLimit ? '启用' : '不限时'}
                          </span>
                        </label>
                      </div>
                      {quizConfig.timeLimit && (
                        <div className="space-y-2">
                          <Slider
                            value={[quizConfig.timeLimit]}
                            onValueChange={(value) => setQuizConfig(prev => ({
                              ...prev,
                              timeLimit: value[0]
                            }))}
                            min={5}
                            max={120}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>5分钟</span>
                            <span className="font-medium text-purple-600">{quizConfig.timeLimit}分钟</span>
                            <span>120分钟</span>
                          </div>
                          <div className="text-center">
                            <div className="inline-flex space-x-2 mt-2">
                              {[15, 30, 45, 60].map(minutes => (
                                <button
                                  key={minutes}
                                  onClick={() => setQuizConfig(prev => ({ ...prev, timeLimit: minutes }))}
                                  className={`px-3 py-1 text-xs rounded-lg transition-all duration-200 ${
                                    quizConfig.timeLimit === minutes
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {minutes}分钟
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 随机顺序 */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quizConfig.shuffleQuestions}
                          onChange={(e) => setQuizConfig(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <Shuffle className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">随机题目顺序</div>
                          <div className="text-sm text-gray-600">打乱题目顺序，避免记忆答案位置</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* 右列：反馈和自动化 */}
                  <div className="space-y-4">
                    {/* 答案解析 */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quizConfig.showExplanation}
                          onChange={(e) => setQuizConfig(prev => ({ ...prev, showExplanation: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <BookOpen className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">显示答案解析</div>
                          <div className="text-sm text-gray-600">答题后立即查看详细解析</div>
                        </div>
                      </label>
                    </div>
                    
                    {/* 自动跳转 */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(quizConfig.autoAdvanceDelay ?? 0) > 0}
                          onChange={(e) => setQuizConfig(prev => ({
                            ...prev,
                            autoAdvanceDelay: e.target.checked ? 3 : 0
                          }))}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <ArrowRight className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">自动进入下一题</div>
                          <div className="text-sm text-gray-600">
                            {(quizConfig.autoAdvanceDelay ?? 0) > 0 
                              ? `答对后 ${quizConfig.autoAdvanceDelay} 秒自动跳转` 
                              : '需要手动点击下一题'}
                          </div>
                        </div>
                        {(quizConfig.autoAdvanceDelay ?? 0) > 0 && (
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuizConfig(prev => ({
                                  ...prev,
                                  autoAdvanceDelay: Math.max(1, (prev.autoAdvanceDelay || 3) - 1)
                                }));
                              }}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-purple-600">
                              {quizConfig.autoAdvanceDelay}s
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuizConfig(prev => ({
                                  ...prev,
                                  autoAdvanceDelay: Math.min(10, (prev.autoAdvanceDelay || 3) + 1)
                                }));
                              }}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 预期效果提示 - 增强动机 */}
            <div className="text-center">
              <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-2xl">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium tracking-wide">
                  预计练习时间：{typeof quizConfig.questionCount === 'number' ? Math.ceil(quizConfig.questionCount * 1.5) : '10-15'} 分钟，
                  完成后可获得详细的学习分析报告
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/90 shadow-md hover:shadow-lg border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回{subject.name}学习中心</span>
            </button>

            {/* 强化的下一步按钮 - 强触发器 */}
            <button
              onClick={handleProceedToConfig}
              disabled={selectedPoints.size === 0}
              className={`group flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-out ${
                selectedPoints.size > 0
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 hover:-translate-y-1 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Settings className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              <div>
                <div className="tracking-wide">下一步：配置测验</div>
                <div className="text-xs opacity-90">({selectedPoints.size} 个知识点)</div>
              </div>
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3 leading-tight tracking-wide">
              选择知识点
            </h1>
            <p className="text-lg text-gray-600 mb-4 tracking-wide">
              选择您要练习的<span className="font-semibold text-blue-600">{subject.name}</span>知识点
            </p>
            
            {/* 进度提示 - 降低门槛 */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-800 text-sm tracking-wide">
                💡 建议选择 5-10 个知识点，约需 15-20 分钟完成练习
              </span>
            </div>
          </div>

          {/* 智能推荐和快速操作 - 降低能力门槛 */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              {/* 智能推荐按钮 */}
              <button
                onClick={useSmartRecommendation}
                className="group flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-out focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
                title="AI智能推荐适合的知识点组合"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm font-medium tracking-wide">智能推荐</span>
              </button>
              
              {lastSelection.length > 0 && (
                <button
                  onClick={useLastSelection}
                  className="group flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm hover:bg-white/90 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-out border border-white/20 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  title={`恢复上次选择的 ${lastSelection.length} 个知识点`}
                >
                  <History className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-sm font-medium tracking-wide">上次选择</span>
                </button>
              )}
              
              <div className="flex items-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-lg shadow-md border border-white/20 overflow-hidden">
                <button
                  onClick={selectAllPoints}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50/50 transition-all duration-300 ease-out focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                  title="选择所有知识点"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium tracking-wide">全选</span>
                </button>
                
                <div className="w-px h-6 bg-gray-200"></div>
                
                <button
                  onClick={clearAllSelections}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300 ease-out focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                  title="清空所有选择"
                >
                  <Square className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium tracking-wide">清空</span>
                </button>
              </div>
            </div>
          </div>

          {/* Smart Suggestion Toggle Button - Show when suggestions exist but panel is collapsed */}
          {!showSmartSuggestionInfo && smartSuggestions.size > 0 && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={() => setShowSmartSuggestionInfo(true)}
                className="group flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-purple-200"
              >
                <Brain className="w-4 h-4 mr-2" />
                <span className="font-medium">查看智能推荐理由</span>
                <ChevronDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Smart Suggestion Info Panel - Expanded View */}
          {showSmartSuggestionInfo && smartSuggestions.size > 0 && (
            <div className="mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-6 border-2 border-purple-300 shadow-xl animate-fade-in relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Brain className="w-6 h-6 text-purple-600 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">智能推荐理由</h3>
                  <span className="ml-3 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">AI 分析</span>
                </div>
                <button
                  onClick={() => setShowSmartSuggestionInfo(false)}
                  className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                  title="收起"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Array.from(selectedPoints).map(pointId => {
                  const suggestion = smartSuggestions.get(pointId);
                  if (!suggestion) return null;
                  
                  const point = knowledgePoints.find(kp => kp.id === pointId);
                  if (!point) return null;
                  
                  // Determine icon and color based on reason
                  let icon = <Target className="w-4 h-4" />;
                  let bgColor = "bg-blue-50";
                  let textColor = "text-blue-700";
                  
                  if (suggestion.reason.includes("需要加强") || suggestion.reason.includes("错误率")) {
                    icon = <AlertCircle className="w-4 h-4" />;
                    bgColor = "bg-red-50";
                    textColor = "text-red-700";
                  } else if (suggestion.reason.includes("复习")) {
                    icon = <History className="w-4 h-4" />;
                    bgColor = "bg-orange-50";
                    textColor = "text-orange-700";
                  } else if (suggestion.reason.includes("新知识")) {
                    icon = <Sparkles className="w-4 h-4" />;
                    bgColor = "bg-green-50";
                    textColor = "text-green-700";
                  } else if (suggestion.reason.includes("基础")) {
                    icon = <BookOpen className="w-4 h-4" />;
                    bgColor = "bg-purple-50";
                    textColor = "text-purple-700";
                  }
                  
                  return (
                    <div key={pointId} className={`flex items-start p-3 rounded-lg ${bgColor} border border-opacity-20`}>
                      <div className={`${textColor} mr-3 mt-0.5`}>
                        {icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{point.topic}</div>
                        <div className={`text-sm ${textColor} mt-1`}>{suggestion.reason}</div>
                        {suggestion.metadata && (
                          <div className="text-xs text-gray-500 mt-1 space-x-3">
                            {suggestion.metadata.accuracy !== undefined && (
                              <span>正确率: {suggestion.metadata.accuracy}%</span>
                            )}
                            {suggestion.metadata.practiceCount !== undefined && (
                              <span>练习次数: {suggestion.metadata.practiceCount}</span>
                            )}
                            {suggestion.metadata.difficulty && (
                              <span className="capitalize">难度: {
                                suggestion.metadata.difficulty === 'hard' ? '困难' :
                                suggestion.metadata.difficulty === 'medium' ? '中等' : '简单'
                              }</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 text-xs text-gray-600 italic">
                <Info className="w-3 h-3 inline mr-1" />
                推荐基于您的学习历史、错误率、复习间隔等多维度分析
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {Object.entries(groupedKnowledgePoints).map(([volume, units]) => {
              const volumePoints = getPointsInVolume(volume);
              const volumeState = getSelectionState(volumePoints);
              const isVolumeExpanded = expandedVolumes.has(volume);
              
              return (
                <div key={volume} className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-white/20">
                  {/* Volume Level */}
                  <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-blue-100/50">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpand('volume', volume)}
                        className="p-1.5 hover:bg-blue-100/50 rounded-lg transition-all duration-300 group focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                      >
                        {isVolumeExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                        )}
                      </button>
                      <div 
                        className="flex items-center space-x-3 cursor-pointer flex-1 p-2 rounded-lg hover:bg-blue-100/30 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                        onClick={() => toggleLevel(volumePoints)}
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={volumeState === 'all'}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 border-2 border-blue-300 rounded focus:ring-blue-500 focus:ring-1 transition-all duration-200"
                          />
                          {volumeState === 'partial' && (
                            <Minus className="w-2.5 h-2.5 text-blue-600 absolute top-0.5 left-0.5 pointer-events-none" />
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-blue-900 flex-1 tracking-wide">{volume}</h3>
                        <div className="text-sm text-blue-700 font-medium">
                          {volumePoints.filter(id => selectedPoints.has(id)).length}/{volumePoints.length}
                        </div>
                        {volumeState === 'all' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Units, Lessons, Topics */}
                  {isVolumeExpanded && (
                    <div className="p-3">
                      <div className="space-y-2">
                        {Object.entries(units).map(([unit, lessons]) => {
                          const unitPoints = getPointsInUnit(volume, unit);
                          const unitState = getSelectionState(unitPoints);
                          const isUnitExpanded = expandedUnits.has(`${volume}-${unit}`);
                          
                          return (
                            <div key={unit} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex items-center space-x-2 py-1.5">
                                <button
                                  onClick={() => toggleExpand('unit', `${volume}-${unit}`)}
                                  className="p-1 hover:bg-gray-100 rounded transition-all duration-300 group focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                >
                                  {isUnitExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                                  )}
                                </button>
                                {renderCheckbox(
                                  unitState,
                                  () => toggleLevel(unitPoints),
                                  unit,
                                  "text-gray-800 hover:bg-gray-50 p-2 rounded-lg transition-all duration-300"
                                )}
                                <div className="text-xs text-gray-500 ml-auto font-medium">
                                  {unitPoints.filter(id => selectedPoints.has(id)).length}/{unitPoints.length}
                                </div>
                              </div>

                              {isUnitExpanded && (
                                <div className="ml-4 space-y-1.5 border-l border-gray-200 pl-3">
                                  {Object.entries(lessons).map(([lesson, sections]) => {
                                    const lessonPoints = getPointsInLesson(volume, unit, lesson);
                                    const lessonState = getSelectionState(lessonPoints);
                                    const isLessonExpanded = expandedLessons.has(`${volume}-${unit}-${lesson}`);
                                    
                                    return (
                                      <div key={lesson}>
                                        <div className="flex items-center space-x-2 py-1">
                                          <button
                                            onClick={() => toggleExpand('lesson', `${volume}-${unit}-${lesson}`)}
                                            className="p-1 hover:bg-gray-100 rounded transition-all duration-300 group focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                          >
                                            {isLessonExpanded ? (
                                              <ChevronDown className="w-3 h-3 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                                            )}
                                          </button>
                                          {renderCheckbox(
                                            lessonState,
                                            () => toggleLevel(lessonPoints),
                                            lesson,
                                            "text-gray-700 hover:bg-gray-50 p-1.5 rounded-lg transition-all duration-300"
                                          )}
                                          <div className="text-xs text-gray-500 ml-auto font-medium">
                                            {lessonPoints.filter(id => selectedPoints.has(id)).length}/{lessonPoints.length}
                                          </div>
                                        </div>

                                        {isLessonExpanded && (
                                          <div className="ml-4 space-y-1.5 border-l border-gray-100 pl-3">
                                            {Object.entries(sections).map(([section, topics]) => {
                                              const sectionPoints = getPointsInSection(volume, unit, lesson, section);
                                              const sectionState = getSelectionState(sectionPoints);
                                              const isSectionExpanded = expandedSections.has(`${volume}-${unit}-${lesson}-${section}`);
                                              
                                              return (
                                                <div key={section}>
                                                  <div className="flex items-center space-x-2 py-1">
                                                    <button
                                                      onClick={() => toggleExpand('section', `${volume}-${unit}-${lesson}-${section}`)}
                                                      className="p-1 hover:bg-gray-100 rounded transition-all duration-300 group focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                                    >
                                                      {isSectionExpanded ? (
                                                        <ChevronDown className="w-3 h-3 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                                                      ) : (
                                                        <ChevronRight className="w-3 h-3 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                                                      )}
                                                    </button>
                                                    {renderCheckbox(
                                                      sectionState,
                                                      () => toggleLevel(sectionPoints),
                                                      section,
                                                      "text-gray-600 hover:bg-gray-50 p-1 rounded transition-all duration-300 text-sm"
                                                    )}
                                                    <div className="text-xs text-gray-500 ml-auto font-medium">
                                                      {sectionPoints.filter(id => selectedPoints.has(id)).length}/{sectionPoints.length}
                                                    </div>
                                                  </div>

                                                  {isSectionExpanded && (
                                                    <div className="ml-4 space-y-1 border-l border-gray-50 pl-3">
                                                      {topics.map(topic => {
                                                        const topicState = selectedPoints.has(topic.id) ? 'all' : 'none';
                                                        
                                                        return (
                                                          <div key={topic.id} className="py-0.5">
                                                            {renderCheckbox(
                                                              topicState,
                                                              () => togglePoint(topic.id),
                                                              topic.topic,
                                                              "text-gray-900 hover:bg-gray-50 p-1.5 rounded transition-all duration-300 text-sm"
                                                            )}
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部状态栏 - 增强动机 */}
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-2xl border border-white/20 shadow-md">
              <span className="text-sm text-gray-600 mr-3 font-medium tracking-wide">选择状态：</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium tracking-wide">已选择 {selectedPoints.size} 个知识点</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium tracking-wide">
                    预计用时 {Math.max(5, selectedPoints.size * 2)} 分钟
                  </span>
                </div>
                {selectedPoints.size > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium tracking-wide">点击右上角进入配置</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}