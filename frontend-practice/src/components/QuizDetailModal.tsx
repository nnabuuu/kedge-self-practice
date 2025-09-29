import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Clock, Target, Tag, User, Calendar, FileText, CheckCircle, AlertCircle, BookOpen, Layers } from 'lucide-react';
import { api } from '../services/backendApi';

interface Quiz {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other';
  question: string;
  options?: string[] | { [key: string]: string };
  answer: string | string[] | number | number[];
  alternative_answers?: string[];
  hints?: (string | null)[];
  difficulty?: 'easy' | 'medium' | 'hard';
  knowledgePointId?: string;
  knowledge_point_id?: string;
  knowledgePoint?: {
    id?: string;
    topic: string;
    lesson?: string;
    unit?: string;
    volume?: string;
    section?: string;
  };
  tags?: string[];
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface QuizDetailModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (quiz: Quiz) => void;
  onDelete?: (quizId: string) => void;
  readOnly?: boolean;
  showActions?: boolean;
}

const typeDisplayNames = {
  'single-choice': '单选题',
  'multiple-choice': '多选题',
  'fill-in-the-blank': '填空题',
  'subjective': '主观题',
  'other': '其他'
};

const difficultyDisplayNames = {
  'easy': '简单',
  'medium': '中等',
  'hard': '困难'
};

const difficultyColors = {
  'easy': 'bg-green-100 text-green-700',
  'medium': 'bg-yellow-100 text-yellow-700',
  'hard': 'bg-red-100 text-red-700'
};

export default function QuizDetailModal({ 
  quiz, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  readOnly = false,
  showActions = true 
}: QuizDetailModalProps) {
  const [fullKnowledgePoint, setFullKnowledgePoint] = useState<any>(null);
  const [loadingKnowledgePoint, setLoadingKnowledgePoint] = useState(false);

  useEffect(() => {
    if (isOpen && quiz && (quiz.knowledgePointId || quiz.knowledge_point_id)) {
      fetchFullKnowledgePoint();
    }
  }, [isOpen, quiz]);

  const fetchFullKnowledgePoint = async () => {
    if (!quiz) return;
    
    const kpId = quiz.knowledgePointId || quiz.knowledge_point_id;
    if (!kpId) return;

    setLoadingKnowledgePoint(true);
    try {
      // Fetch all knowledge points and find the matching one
      const response = await api.knowledgePoints.getAll();
      if (response.success && response.data) {
        const knowledgePoint = response.data.find(kp => 
          kp.id === kpId || kp.id === `kp_${kpId}` || `kp_${kp.id}` === kpId
        );
        if (knowledgePoint) {
          setFullKnowledgePoint(knowledgePoint);
        }
      }
    } catch (error) {
      console.error('Failed to fetch knowledge point:', error);
    } finally {
      setLoadingKnowledgePoint(false);
    }
  };

  if (!isOpen || !quiz) return null;

  const renderAnswer = () => {
    if (!quiz) return '无答案';
    
    if (quiz.type === 'single-choice' || quiz.type === 'multiple-choice') {
      if (Array.isArray(quiz.answer)) {
        if (quiz.answer.length > 0 && typeof quiz.answer[0] === 'number') {
          // Convert indices to letters
          const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
          return quiz.answer.map(idx => keys[idx as number] || idx).join(', ');
        }
        return quiz.answer.join(', ');
      }
      return quiz.answer || '无答案';
    } else if (quiz.type === 'fill-in-the-blank') {
      if (Array.isArray(quiz.answer)) {
        return (
          <div className="space-y-2">
            {quiz.answer.map((ans, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">空格 {idx + 1}:</span>
                <span className="font-medium">{ans}</span>
              </div>
            ))}
            {quiz.alternative_answers && quiz.alternative_answers.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-sm text-gray-600">备选答案: </span>
                <span className="text-sm">{quiz.alternative_answers.join(' / ')}</span>
              </div>
            )}
          </div>
        );
      }
      return quiz.answer || '无答案';
    } else {
      return quiz.answer || '主观题答案';
    }
  };

  const renderOptions = () => {
    if (!quiz.options) return null;

    // Handle both array and object formats
    if (Array.isArray(quiz.options)) {
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      return quiz.options.map((option, index) => (
        <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
          <span className="font-medium text-gray-600 min-w-[24px]">{keys[index]}.</span>
          <span className="text-gray-800">{option}</span>
        </div>
      ));
    } else {
      return Object.entries(quiz.options).map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
          <span className="font-medium text-gray-600 min-w-[24px]">{key}.</span>
          <span className="text-gray-800">{value}</span>
        </div>
      ));
    }
  };

  const renderHints = () => {
    if (!quiz.hints || quiz.hints.length === 0) return null;
    
    const answers = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer || ''];

    return quiz.hints.map((hint, index) => {
      const correctAnswer = answers[index] || '';
      
      return (
        <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-gray-700 mb-1">空格 {index + 1}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-600">正确答案:</span>
              <div className="text-sm font-medium text-green-600">{correctAnswer || '(未设置)'}</div>
            </div>
            <div>
              <span className="text-xs text-gray-600">提示:</span>
              <div className="text-sm text-blue-800">{hint || '(无提示)'}</div>
            </div>
          </div>
        </div>
      );
    });
  };

  const renderQuestionWithImages = (text: string | undefined) => {
    if (!text) return '';
    // Replace image placeholders with visual indicators
    return text.replace(/\{\{img:(\d+)\}\}/g, (match, num) => {
      return `[图片${num}]`;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">题目详情</h2>
            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-mono">
              ID: {quiz.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              基本信息
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">题型:</span>
                <span className="ml-2 px-2 py-1 bg-white rounded text-sm font-medium text-blue-700">
                  {quiz.type && typeDisplayNames[quiz.type] ? typeDisplayNames[quiz.type] : quiz.type || '未知'}
                </span>
              </div>
              
              {quiz.difficulty && (
                <div>
                  <span className="text-sm text-gray-600">难度:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${difficultyColors[quiz.difficulty]}`}>
                    {difficultyDisplayNames[quiz.difficulty]}
                  </span>
                </div>
              )}
              
              {quiz.createdAt && (
                <div>
                  <span className="text-sm text-gray-600">创建时间:</span>
                  <span className="ml-2 text-sm text-gray-800">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {quiz.tags && quiz.tags.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-600">标签:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {quiz.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Point */}
          {(quiz.knowledgePoint || fullKnowledgePoint) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                关联知识点
              </h3>
              
              {loadingKnowledgePoint ? (
                <div className="text-center py-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-sm text-gray-600">加载知识点信息...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {(fullKnowledgePoint || quiz.knowledgePoint) && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Layers className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">层级:</span>
                        <div className="flex items-center gap-1">
                          {(fullKnowledgePoint?.volume || quiz.knowledgePoint?.volume) && (
                            <span className="font-medium text-gray-800">
                              {fullKnowledgePoint?.volume || quiz.knowledgePoint?.volume}
                            </span>
                          )}
                          {(fullKnowledgePoint?.unit || quiz.knowledgePoint?.unit) && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className="font-medium text-gray-800">
                                {fullKnowledgePoint?.unit || quiz.knowledgePoint?.unit}
                              </span>
                            </>
                          )}
                          {(fullKnowledgePoint?.lesson || quiz.knowledgePoint?.lesson) && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className="font-medium text-gray-800">
                                {fullKnowledgePoint?.lesson || quiz.knowledgePoint?.lesson}
                              </span>
                            </>
                          )}
                          {(fullKnowledgePoint?.section || quiz.knowledgePoint?.section) && (
                            <>
                              <span className="text-gray-400">/</span>
                              <span className="font-medium text-gray-800">
                                {fullKnowledgePoint?.section || quiz.knowledgePoint?.section}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm text-gray-600">知识点:</span>
                        <span className="font-medium text-gray-900">
                          {fullKnowledgePoint?.topic || quiz.knowledgePoint?.topic}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Question Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">题目内容</h3>
            <div className="bg-white rounded p-4 border">
              <div className="text-gray-900 whitespace-pre-wrap">
                {quiz.question ? renderQuestionWithImages(quiz.question) : '无题目内容'}
              </div>
            </div>
            
            {/* Images indicator */}
            {quiz.images && quiz.images.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-600">包含图片: </span>
                <span className="text-sm font-medium text-blue-600">{quiz.images.length} 张</span>
              </div>
            )}
          </div>

          {/* Options (for choice questions) */}
          {quiz.options && (quiz.type === 'single-choice' || quiz.type === 'multiple-choice') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">选项</h3>
              <div className="space-y-2">
                {renderOptions()}
              </div>
            </div>
          )}

          {/* Hints (for fill-in-the-blank) */}
          {quiz.type === 'fill-in-the-blank' && quiz.hints && quiz.hints.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">填空提示</h3>
              <div className="space-y-2">
                {renderHints()}
              </div>
            </div>
          )}

          {/* Answer */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              正确答案
            </h3>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="text-green-900 font-medium">
                {renderAnswer()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        {showActions && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                关闭
              </button>
              
              {!readOnly && (
                <div className="flex gap-3">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(quiz.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(quiz)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}