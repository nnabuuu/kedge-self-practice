import React, { useEffect, useState } from 'react';
import { QuizItem, QuizWithKnowledgePoint, KnowledgePointMatchResult } from '../types/quiz';
import { matchKnowledgePoint } from '../services/localQuizService';
import { Brain, BookOpen, CheckCircle, AlertCircle, Loader2, ArrowRight, Target, ChevronDown, ChevronUp, Tag, Globe, Crown, Search, Edit3, X, Check } from 'lucide-react';
import { QuizImageDisplay } from './QuizImageDisplay';

interface KnowledgePointMatchingProps {
  quizItems: QuizItem[];
  onComplete: (quizWithKnowledgePoints: QuizWithKnowledgePoint[]) => void;
  onBack: () => void;
  imageMapping?: Record<string, string>; // UUID to URL mapping for images
}

export const KnowledgePointMatching: React.FC<KnowledgePointMatchingProps> = ({
  quizItems,
  onComplete,
  onBack,
  imageMapping = {}
}) => {
  const [quizWithKnowledgePoints, setQuizWithKnowledgePoints] = useState<QuizWithKnowledgePoint[]>([]);
  const [currentMatchingIndex, setCurrentMatchingIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [expandedCandidates, setExpandedCandidates] = useState<{[key: number]: boolean}>({});
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    // Initialize quiz items with matching status
    const initialQuizItems: QuizWithKnowledgePoint[] = quizItems.map(item => ({
      ...item,
      matchingStatus: 'pending'
    }));
    setQuizWithKnowledgePoints(initialQuizItems);
    
    // Start matching process
    matchAllKnowledgePoints(initialQuizItems);
  }, [quizItems]);

  const matchAllKnowledgePoints = async (items: QuizWithKnowledgePoint[]) => {
    const updatedItems = [...items];
    
    for (let i = 0; i < items.length; i++) {
      setCurrentMatchingIndex(i);
      updatedItems[i] = { ...updatedItems[i], matchingStatus: 'loading' };
      setQuizWithKnowledgePoints([...updatedItems]);
      
      try {
        const matchingResult = await matchKnowledgePoint(items[i]);
        updatedItems[i] = {
          ...updatedItems[i],
          knowledgePoint: matchingResult.matched,
          matchingResult,
          matchingStatus: 'success'
        };
      } catch (error) {
        console.error(`Knowledge point matching failed for item ${i}:`, error);
        updatedItems[i] = {
          ...updatedItems[i],
          matchingStatus: 'error'
        };
      }
      
      setQuizWithKnowledgePoints([...updatedItems]);
      
      // Add a small delay between requests to avoid overwhelming the API
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsCompleted(true);
  };

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'single-choice':
        return { icon: Brain, label: '单选题', colorClasses: 'bg-indigo-100 text-indigo-600' };
      case 'multiple-choice':
        return { icon: Brain, label: '多选题', colorClasses: 'bg-purple-100 text-purple-600' };
      case 'fill-in-the-blank':
        return { icon: Brain, label: '填空题', colorClasses: 'bg-blue-100 text-blue-600' };
      case 'subjective':
        return { icon: Brain, label: '主观题', colorClasses: 'bg-green-100 text-green-600' };
      case 'other':
        return { icon: Brain, label: '其他题型', colorClasses: 'bg-gray-100 text-gray-600' };
      default:
        return { icon: Brain, label: '未知题型', colorClasses: 'bg-gray-100 text-gray-600' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const toggleCandidatesExpansion = (index: number) => {
    setExpandedCandidates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectCandidate = (quizIndex: number, candidateIndex: number) => {
    const updatedItems = [...quizWithKnowledgePoints];
    const candidate = updatedItems[quizIndex].matchingResult?.candidates[candidateIndex];
    
    if (candidate) {
      updatedItems[quizIndex] = {
        ...updatedItems[quizIndex],
        knowledgePoint: candidate,
        matchingResult: {
          ...updatedItems[quizIndex].matchingResult!,
          matched: candidate
        }
      };
      setQuizWithKnowledgePoints(updatedItems);
    }
    
    // Exit editing mode
    setEditingKnowledgePoint(prev => ({
      ...prev,
      [quizIndex]: false
    }));
  };

  const handleMarkAsNoMatch = (quizIndex: number) => {
    const updatedItems = [...quizWithKnowledgePoints];
    updatedItems[quizIndex] = {
      ...updatedItems[quizIndex],
      knowledgePoint: undefined,
      matchingResult: {
        ...updatedItems[quizIndex].matchingResult!,
        matched: undefined
      }
    };
    setQuizWithKnowledgePoints(updatedItems);
    
    // Exit editing mode
    setEditingKnowledgePoint(prev => ({
      ...prev,
      [quizIndex]: false
    }));
  };

  const toggleEditingMode = (quizIndex: number) => {
    setEditingKnowledgePoint(prev => ({
      ...prev,
      [quizIndex]: !prev[quizIndex]
    }));
  };

  const renderQuizContent = (item: QuizWithKnowledgePoint) => {
    const { icon: Icon, label, colorClasses } = getQuestionTypeInfo(item.type);
    
    // Handle different answer formats for display
    let correctAnswerIndices: number[] = [];
    if (Array.isArray(item.answer)) {
      if (typeof item.answer[0] === 'number') {
        correctAnswerIndices = item.answer as number[];
      } else {
        correctAnswerIndices = (item.answer as string[]).map(ans => 
          item.options?.findIndex(opt => opt === ans) ?? -1
        ).filter(idx => idx !== -1);
      }
    } else if (typeof item.answer === 'number') {
      correctAnswerIndices = [item.answer];
    } else if (typeof item.answer === 'string' && item.options) {
      const answerIndex = item.options.findIndex(opt => opt === item.answer);
      if (answerIndex !== -1) {
        correctAnswerIndices = [answerIndex];
      }
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`${colorClasses} rounded-full p-1.5`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        
        <div className="mb-3">
          <QuizImageDisplay 
            content={item.question}
            images={item.images}
            imageMapping={imageMapping}
            className="text-lg font-medium text-gray-800"
          />
        </div>
        
        {/* Options for choice questions */}
        {item.options && item.options.length > 0 && (
          <div className="space-y-2 mb-3">
            {item.options.map((option, optionIndex) => {
              const isCorrect = correctAnswerIndices.includes(optionIndex);
              const optionLabel = String.fromCharCode(65 + optionIndex);
              
              return (
                <div
                  key={optionIndex}
                  className={`p-2 rounded border ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {isCorrect ? '✓' : optionLabel}
                    </span>
                    <span className={isCorrect ? 'text-emerald-800 font-medium' : 'text-gray-700'}>
                      {optionLabel}. {option}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Answer display */}
        <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">
              {item.type === 'subjective' ? '参考答案:' : '正确答案:'}
            </span>
          </div>
          <div className="mt-1 text-emerald-800">
            {item.options && correctAnswerIndices.length > 0 ? (
              correctAnswerIndices.map(idx => 
                `${String.fromCharCode(65 + idx)}. ${item.options![idx]}`
              ).join(', ')
            ) : (
              typeof item.answer === 'string' ? item.answer : 
              Array.isArray(item.answer) ? item.answer.join(', ') : 
              String(item.answer)
            )}
          </div>
        </div>
      </div>
    );
  };

  const completedCount = quizWithKnowledgePoints.filter(item => 
    item.matchingStatus === 'success' || item.matchingStatus === 'error'
  ).length;

  const successCount = quizWithKnowledgePoints.filter(item => 
    item.matchingStatus === 'success'
  ).length;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">知识点匹配</h2>
              <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm">
                {completedCount}/{quizItems.length}
              </span>
            </div>
            {!isCompleted && (
              <div className="text-white text-sm">
                正在匹配第 {currentMatchingIndex + 1} 题...
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">匹配进度</span>
              <span className="text-sm text-gray-500">
                {Math.round((completedCount / quizItems.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / quizItems.length) * 100}%` }}
              />
            </div>
            {isCompleted && (
              <div className="mt-2 text-sm text-emerald-600">
                ✅ 匹配完成！成功匹配 {successCount} 个知识点
              </div>
            )}
          </div>

          {/* Quiz Items with Knowledge Points */}
          <div className="space-y-6">
            {quizWithKnowledgePoints.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">题目 #{index + 1}</h3>
                  {getStatusIcon(item.matchingStatus || 'pending')}
                </div>
                
                {/* Quiz Content */}
                {renderQuizContent(item)}
                
                {/* Matching Results */}
                {item.matchingStatus === 'success' && item.matchingResult && (
                  <div className="space-y-4">
                    {/* Main Matched Knowledge Point or No Match State */}
                    <div className="bg-white rounded-lg border border-emerald-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium text-emerald-700">
                            {item.matchingResult.matched ? '匹配的知识点' : '无合适匹配'}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleEditingMode(index)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          {editingKnowledgePoint[index] ? '取消编辑' : '手动调整'}
                        </button>
                      </div>
                      
                      {item.matchingResult.matched ? (
                        <div>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div><span className="text-gray-500">分册:</span> <span className="text-gray-800">{item.matchingResult.matched.volume}</span></div>
                            <div><span className="text-gray-500">单元:</span> <span className="text-gray-800">{item.matchingResult.matched.unit}</span></div>
                            <div><span className="text-gray-500">课程:</span> <span className="text-gray-800">{item.matchingResult.matched.lesson}</span></div>
                            <div><span className="text-gray-500">子目:</span> <span className="text-gray-800">{item.matchingResult.matched.sub}</span></div>
                          </div>
                          <div className="bg-emerald-50 rounded p-3">
                            <span className="text-emerald-800 font-medium">{item.matchingResult.matched.topic}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded p-3 text-center">
                          <span className="text-gray-600">当前题目未匹配到合适的知识点</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Manual Selection Interface */}
                    {editingKnowledgePoint[index] && item.matchingResult.candidates && item.matchingResult.candidates.length > 0 && (
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Edit3 className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-700">选择合适的知识点</span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          {item.matchingResult.candidates.map((candidate, candidateIdx) => (
                            <div 
                              key={candidateIdx} 
                              className="bg-white rounded border border-gray-200 p-3 hover:border-blue-300 transition-colors cursor-pointer"
                              onClick={() => handleSelectCandidate(index, candidateIdx)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                    <div><span className="text-gray-500">分册:</span> <span className="text-gray-800">{candidate.volume}</span></div>
                                    <div><span className="text-gray-500">单元:</span> <span className="text-gray-800">{candidate.unit}</span></div>
                                    <div><span className="text-gray-500">课程:</span> <span className="text-gray-800">{candidate.lesson}</span></div>
                                    <div><span className="text-gray-500">子目:</span> <span className="text-gray-800">{candidate.sub}</span></div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-2">
                                    <span className="text-gray-800 font-medium">{candidate.topic}</span>
                                  </div>
                                </div>
                                <button className="ml-3 p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={() => handleMarkAsNoMatch(index)}
                            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4 mr-2" />
                            标记为无合适匹配
                          </button>
                          
                          <button
                            onClick={() => toggleEditingMode(index)}
                            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Keywords */}
                      {item.matchingResult.keywords.length > 0 && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3 md:col-span-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <Tag className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">关键词</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.matchingResult.keywords.map((keyword, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded text-sm font-medium">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Country and Dynasty - Smaller cards */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Country */}
                      {item.matchingResult.country && (
                        <div className="bg-white rounded border border-purple-200 p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <Globe className="w-3 h-3 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">国家</span>
                          </div>
                          <span className="text-xs text-purple-800">{item.matchingResult.country}</span>
                        </div>
                      )}
                      
                      {/* Dynasty */}
                      {item.matchingResult.dynasty && (
                        <div className="bg-white rounded border border-amber-200 p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span className="text-xs font-medium text-amber-700">朝代</span>
                          </div>
                          <span className="text-xs text-amber-800">{item.matchingResult.dynasty}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Candidates (Collapsible) */}
                    {item.matchingResult.candidates && item.matchingResult.candidates.length > 0 && (
                      <div className={`bg-white rounded-lg border border-gray-200 ${editingKnowledgePoint[index] ? 'opacity-50' : ''}`}>
                        <button
                          onClick={() => toggleCandidatesExpansion(index)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                          disabled={editingKnowledgePoint[index]}
                        >
                          <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {editingKnowledgePoint[index] ? '编辑模式中...' : `候选知识点 (${item.matchingResult.candidates.length})`}
                            </span>
                          </div>
                          {!editingKnowledgePoint[index] && (expandedCandidates[index] ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ))}
                        </button>
                        
                        {expandedCandidates[index] && !editingKnowledgePoint[index] && (
                          <div className="border-t border-gray-200 p-4 space-y-3">
                            {item.matchingResult.candidates.map((candidate, candidateIdx) => (
                              <div key={candidateIdx} className="bg-gray-50 rounded p-3 border">
                                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                  <div><span className="text-gray-500">分册:</span> <span className="text-gray-800">{candidate.volume}</span></div>
                                  <div><span className="text-gray-500">单元:</span> <span className="text-gray-800">{candidate.unit}</span></div>
                                  <div><span className="text-gray-500">课程:</span> <span className="text-gray-800">{candidate.lesson}</span></div>
                                  <div><span className="text-gray-500">子目:</span> <span className="text-gray-800">{candidate.sub}</span></div>
                                </div>
                                <div className="bg-white rounded p-2">
                                  <span className="text-gray-800 font-medium">{candidate.topic}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {item.matchingStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-700">知识点匹配失败</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              返回题目
            </button>
            
            {isCompleted && (
              <button
                onClick={() => onComplete(quizWithKnowledgePoints)}
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                继续
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};