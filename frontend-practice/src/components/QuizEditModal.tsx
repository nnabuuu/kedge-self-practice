import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, BookOpen, Tag, Target, AlertTriangle } from 'lucide-react';
import { api } from '../services/backendApi';
import KnowledgePointPicker from './KnowledgePointPicker';

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
  tags?: string[];
  images?: string[];
}

interface QuizEditModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (quiz: Quiz) => void;
  onDelete?: (quizId: string) => void;
}

const typeOptions = [
  { value: 'single-choice', label: '单选题' },
  { value: 'multiple-choice', label: '多选题' },
  { value: 'fill-in-the-blank', label: '填空题' },
  { value: 'subjective', label: '主观题' },
  { value: 'other', label: '其他' }
];

const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
];

export default function QuizEditModal({ quiz, isOpen, onClose, onSave, onDelete }: QuizEditModalProps) {
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKnowledgePointPicker, setShowKnowledgePointPicker] = useState(false);
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([]);
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<any>(null);
  const [newTag, setNewTag] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (quiz && isOpen) {
      loadQuizData();
    }
  }, [quiz, isOpen]);

  const loadQuizData = async () => {
    if (!quiz) return;
    
    // Clone the quiz for editing
    const cloned = JSON.parse(JSON.stringify(quiz));
    
    // Ensure options is an array for editing
    if (cloned.options && !Array.isArray(cloned.options)) {
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      const optionsArray: string[] = [];
      for (const key of keys) {
        if (cloned.options[key]) {
          optionsArray.push(cloned.options[key]);
        }
      }
      cloned.options = optionsArray;
    }
    
    // Ensure answer is in the correct format
    if (cloned.type === 'single-choice' && typeof cloned.answer === 'string') {
      // Convert letter answer to index
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      const index = keys.indexOf(cloned.answer);
      if (index !== -1) {
        cloned.answer = index;
      }
    } else if (cloned.type === 'multiple-choice' && Array.isArray(cloned.answer)) {
      // Convert letter answers to indices
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      cloned.answer = cloned.answer.map((ans: string | number) => {
        if (typeof ans === 'string') {
          const index = keys.indexOf(ans);
          return index !== -1 ? index : ans;
        }
        return ans;
      });
    }
    
    // Initialize tags as array if not present
    if (!cloned.tags) {
      // Check if tags are stored in the quiz object
      if (quiz.tags && Array.isArray(quiz.tags)) {
        cloned.tags = [...quiz.tags];
      } else {
        cloned.tags = [];
      }
    } else if (!Array.isArray(cloned.tags)) {
      // Ensure tags is always an array
      cloned.tags = [];
    }
    
    // Initialize hints for fill-in-the-blank
    if (cloned.type === 'fill-in-the-blank' && !cloned.hints) {
      const blanksCount = (cloned.question?.match(/___/g) || []).length;
      cloned.hints = new Array(blanksCount).fill('');
    }
    
    // Initialize alternative answers if not present
    if (!cloned.alternative_answers) {
      cloned.alternative_answers = [];
    }
    
    setEditingQuiz(cloned);
    
    // Load knowledge points
    try {
      const kpResponse = await api.knowledgePoints.getAll();
      if (kpResponse.success && kpResponse.data) {
        setKnowledgePoints(kpResponse.data);
        
        // Find and set the selected knowledge point
        const kpId = cloned.knowledgePointId || cloned.knowledge_point_id || cloned.relatedKnowledgePointId;
        if (kpId) {
          const foundKp = kpResponse.data.find((kp: any) => 
            kp.id === kpId || 
            kp.id === `kp_${kpId}` || 
            `kp_${kp.id}` === kpId
          );
          if (foundKp) {
            setSelectedKnowledgePoint(foundKp);
          }
        } else if (cloned.knowledgePoint) {
          // If knowledgePoint object is provided directly
          setSelectedKnowledgePoint(cloned.knowledgePoint);
        }
      }
    } catch (error) {
      console.error('Failed to load knowledge points:', error);
    }
  };

  if (!isOpen || !editingQuiz) return null;

  const handleSave = async () => {
    if (!editingQuiz) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Prepare the quiz data for saving
      const dataToSave = { ...editingQuiz };
      
      // Add selected knowledge point ID
      if (selectedKnowledgePoint) {
        dataToSave.knowledgePointId = selectedKnowledgePoint.id;
        dataToSave.knowledge_point_id = selectedKnowledgePoint.id;
      }
      
      // Convert options array back to object format if needed
      if (Array.isArray(dataToSave.options)) {
        const optionsObj: { [key: string]: string } = {};
        const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
        dataToSave.options.forEach((option: string, index: number) => {
          if (index < keys.length && option) {
            optionsObj[keys[index]] = option;
          }
        });
        dataToSave.options = optionsObj;
      }
      
      // Update the quiz
      const response = await api.questions.update(editingQuiz.id, dataToSave);
      
      if (response.success && response.data) {
        onSave(response.data);
        onClose();
      } else {
        setError(response.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setError('保存时发生错误');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingQuiz) return;
    
    setDeleting(true);
    setError(null);
    
    try {
      const response = await api.questions.delete(editingQuiz.id);
      
      if (response.success) {
        if (onDelete) {
          onDelete(editingQuiz.id);
        }
        setShowDeleteConfirm(false);
        onClose();
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      setError('删除时发生错误');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddTag = () => {
    if (!editingQuiz || !newTag.trim()) return;
    
    const tags = editingQuiz.tags || [];
    if (!tags.includes(newTag.trim())) {
      setEditingQuiz({ ...editingQuiz, tags: [...tags, newTag.trim()] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingQuiz) return;
    
    const tags = editingQuiz.tags || [];
    setEditingQuiz({ ...editingQuiz, tags: tags.filter(tag => tag !== tagToRemove) });
  };

  const handleAddHint = () => {
    if (!editingQuiz) return;
    
    const hints = editingQuiz.hints || [];
    setEditingQuiz({ ...editingQuiz, hints: [...hints, ''] });
  };

  const handleHintChange = (index: number, value: string) => {
    if (!editingQuiz) return;
    
    const hints = [...(editingQuiz.hints || [])];
    hints[index] = value;
    setEditingQuiz({ ...editingQuiz, hints });
  };

  const handleRemoveHint = (index: number) => {
    if (!editingQuiz) return;
    
    const hints = editingQuiz.hints || [];
    setEditingQuiz({ ...editingQuiz, hints: hints.filter((_, i) => i !== index) });
  };

  const handleAddOption = () => {
    if (!editingQuiz || !Array.isArray(editingQuiz.options)) return;
    
    const newOptions = [...editingQuiz.options, ''];
    setEditingQuiz({ ...editingQuiz, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (!editingQuiz || !Array.isArray(editingQuiz.options)) return;
    
    const newOptions = editingQuiz.options.filter((_, i) => i !== index);
    setEditingQuiz({ ...editingQuiz, options: newOptions });
    
    // Adjust answer if needed
    if (editingQuiz.type === 'single-choice' && typeof editingQuiz.answer === 'number') {
      if (editingQuiz.answer === index) {
        setEditingQuiz({ ...editingQuiz, options: newOptions, answer: 0 });
      } else if (editingQuiz.answer > index) {
        setEditingQuiz({ ...editingQuiz, options: newOptions, answer: editingQuiz.answer - 1 });
      }
    } else if (editingQuiz.type === 'multiple-choice' && Array.isArray(editingQuiz.answer)) {
      const newAnswer = editingQuiz.answer
        .filter((ans: number) => ans !== index)
        .map((ans: number) => ans > index ? ans - 1 : ans);
      setEditingQuiz({ ...editingQuiz, options: newOptions, answer: newAnswer });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!editingQuiz || !Array.isArray(editingQuiz.options)) return;
    
    const newOptions = [...editingQuiz.options];
    newOptions[index] = value;
    setEditingQuiz({ ...editingQuiz, options: newOptions });
  };

  const handleAnswerChange = (value: any) => {
    if (!editingQuiz) return;
    
    if (editingQuiz.type === 'single-choice') {
      setEditingQuiz({ ...editingQuiz, answer: parseInt(value) });
    } else if (editingQuiz.type === 'multiple-choice') {
      const index = parseInt(value);
      const currentAnswer = Array.isArray(editingQuiz.answer) ? editingQuiz.answer : [];
      
      if (currentAnswer.includes(index)) {
        setEditingQuiz({ 
          ...editingQuiz, 
          answer: currentAnswer.filter((a: number) => a !== index) 
        });
      } else {
        setEditingQuiz({ 
          ...editingQuiz, 
          answer: [...currentAnswer, index].sort() 
        });
      }
    } else {
      setEditingQuiz({ ...editingQuiz, answer: value });
    }
  };

  const renderAnswerInput = () => {
    if (editingQuiz.type === 'single-choice' && Array.isArray(editingQuiz.options)) {
      return (
        <select
          value={typeof editingQuiz.answer === 'number' ? editingQuiz.answer : 0}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {editingQuiz.options.map((_, index) => (
            <option key={index} value={index}>
              {String.fromCharCode(65 + index)}
            </option>
          ))}
        </select>
      );
    } else if (editingQuiz.type === 'multiple-choice' && Array.isArray(editingQuiz.options)) {
      const currentAnswer = Array.isArray(editingQuiz.answer) ? editingQuiz.answer : [];
      return (
        <div className="space-y-2">
          {editingQuiz.options.map((_, index) => (
            <label key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentAnswer.includes(index)}
                onChange={() => handleAnswerChange(index)}
                className="w-4 h-4 text-blue-600"
              />
              <span>{String.fromCharCode(65 + index)}</span>
            </label>
          ))}
        </div>
      );
    } else if (editingQuiz.type === 'fill-in-the-blank') {
      const answers = Array.isArray(editingQuiz.answer) ? editingQuiz.answer : [editingQuiz.answer || ''];
      return (
        <div className="space-y-2">
          {answers.map((ans, index) => (
            <div key={index}>
              <label className="block text-sm text-gray-600 mb-1">空格 {index + 1}</label>
              <input
                type="text"
                value={ans || ''}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[index] = e.target.value;
                  
                  // Auto-sync hints array size with answers
                  const currentHints = editingQuiz.hints || [];
                  const newHints = [...currentHints];
                  while (newHints.length < newAnswers.length) {
                    newHints.push(null);
                  }
                  
                  setEditingQuiz({ ...editingQuiz, answer: newAnswers, hints: newHints });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="输入正确答案"
              />
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <textarea
          value={typeof editingQuiz.answer === 'string' ? editingQuiz.answer : ''}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="输入答案..."
        />
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">编辑题目</h2>
            <span className="text-sm text-gray-600">ID: {editingQuiz.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">题目类型</label>
            <select
              value={editingQuiz.type}
              onChange={(e) => setEditingQuiz({ ...editingQuiz, type: e.target.value as Quiz['type'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">题目内容</label>
            <textarea
              value={editingQuiz.question || ''}
              onChange={(e) => setEditingQuiz({ ...editingQuiz, question: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="输入题目内容..."
            />
          </div>

          {/* Options (for choice questions) */}
          {(editingQuiz.type === 'single-choice' || editingQuiz.type === 'multiple-choice') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">选项</label>
                <button
                  onClick={handleAddOption}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加选项
                </button>
              </div>
              <div className="space-y-2">
                {Array.isArray(editingQuiz.options) && editingQuiz.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 min-w-[24px]">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={option || ''}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                    />
                    {editingQuiz.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              知识点
            </label>
            <div className="flex items-center gap-2">
              {selectedKnowledgePoint ? (
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    {selectedKnowledgePoint.volume} / {selectedKnowledgePoint.unit} / {selectedKnowledgePoint.lesson}
                  </div>
                  <div className="font-medium text-gray-900">{selectedKnowledgePoint.topic}</div>
                </div>
              ) : (
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-500">
                  未选择知识点
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowKnowledgePointPicker(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                选择知识点
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              标签
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {editingQuiz.tags?.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="输入标签..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>

          {/* Hints (for fill-in-the-blank) */}
          {editingQuiz.type === 'fill-in-the-blank' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">填空提示</label>
                  <button
                    type="button"
                    onClick={handleAddHint}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加提示
                  </button>
                </div>
                <div className="space-y-3">
                  {editingQuiz.hints?.map((hint, index) => {
                    const answers = Array.isArray(editingQuiz.answer) ? editingQuiz.answer : [editingQuiz.answer || ''];
                    const correctAnswer = answers[index] || '';
                    
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                              空格 {index + 1}
                            </div>
                            <div className="text-sm text-green-600 font-medium mb-2">
                              正确答案: {correctAnswer || '(未设置)'}
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">提示:</label>
                              <input
                                type="text"
                                value={hint || ''}
                                onChange={(e) => handleHintChange(index, e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="输入提示词，如：人名、地名、朝代等"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveHint(index)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Alternative Answers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备选答案</label>
                <div className="space-y-2">
                  {editingQuiz.alternative_answers?.map((altAnswer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={altAnswer || ''}
                        onChange={(e) => {
                          const newAltAnswers = [...(editingQuiz.alternative_answers || [])];
                          newAltAnswers[index] = e.target.value;
                          setEditingQuiz({ ...editingQuiz, alternative_answers: newAltAnswers });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="备选答案"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newAltAnswers = (editingQuiz.alternative_answers || []).filter((_, i) => i !== index);
                          setEditingQuiz({ ...editingQuiz, alternative_answers: newAltAnswers });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const altAnswers = editingQuiz.alternative_answers || [];
                      setEditingQuiz({ ...editingQuiz, alternative_answers: [...altAnswers, ''] });
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    添加备选答案
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">正确答案</label>
            {renderAnswerInput()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          {/* Delete button on the left */}
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              删除题目
            </button>
          )}
          
          {/* Save and Cancel buttons on the right */}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              disabled={saving || deleting}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Knowledge Point Picker Modal */}
      {showKnowledgePointPicker && (
        <KnowledgePointPicker
          knowledgePoints={knowledgePoints}
          onSelect={(kp: any) => {
            setSelectedKnowledgePoint(kp);
            setShowKnowledgePointPicker(false);
          }}
          onClose={() => setShowKnowledgePointPicker(false)}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">确认删除题目</h3>
                <p className="text-gray-600 text-sm">
                  您确定要删除这道题目吗？此操作不可恢复。
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-medium">题目ID: {editingQuiz?.id}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {editingQuiz?.question}
                  </p>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}