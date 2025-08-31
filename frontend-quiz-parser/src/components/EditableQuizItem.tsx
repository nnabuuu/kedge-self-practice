import React, { useState, useEffect } from 'react';
import { QuizItem } from '../types/quiz';
import { Edit2, Save, X, AlertCircle, Plus, Trash2, Info } from 'lucide-react';

interface EditableQuizItemProps {
  item: QuizItem;
  onSave: (updatedItem: QuizItem) => void;
  onCancel?: () => void;
}

export const EditableQuizItem: React.FC<EditableQuizItemProps> = ({ item, onSave, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<QuizItem>(item);
  const [blanksCount, setBlanksCount] = useState(0);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    // Count blanks when question changes
    if (editedItem.type === 'fill-in-the-blank') {
      const matches = editedItem.question.match(/_{4,}/g);
      const count = matches ? matches.length : 0;
      setBlanksCount(count);
      
      // Update answer array to match blanks count
      if (count > 0) {
        const currentAnswers = Array.isArray(editedItem.answer) 
          ? editedItem.answer 
          : typeof editedItem.answer === 'string' 
            ? [editedItem.answer]
            : [];
        
        // Adjust answer array length
        if (currentAnswers.length !== count) {
          const newAnswers = [...currentAnswers];
          while (newAnswers.length < count) {
            newAnswers.push('');
          }
          while (newAnswers.length > count) {
            newAnswers.pop();
          }
          setEditedItem({ ...editedItem, answer: newAnswers });
        }
      }
    }
  }, [editedItem.question, editedItem.type]);

  const handleQuestionChange = (value: string) => {
    setEditedItem({ ...editedItem, question: value });
    setValidationError('');
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(editedItem.options || [])];
    newOptions[index] = value;
    setEditedItem({ ...editedItem, options: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [...(editedItem.options || []), ''];
    setEditedItem({ ...editedItem, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = (editedItem.options || []).filter((_, i) => i !== index);
    setEditedItem({ ...editedItem, options: newOptions });
    
    // Adjust answer if it references removed option
    if (item.type === 'single-choice' || item.type === 'multiple-choice') {
      if (Array.isArray(editedItem.answer)) {
        const newAnswer = editedItem.answer
          .filter(a => typeof a === 'number' && a !== index)
          .map(a => typeof a === 'number' && a > index ? a - 1 : a);
        setEditedItem({ ...editedItem, answer: newAnswer });
      }
    }
  };

  const handleAnswerChange = (value: string | string[] | number | number[]) => {
    setEditedItem({ ...editedItem, answer: value });
  };

  const handleFillInBlankAnswerChange = (index: number, value: string) => {
    const answers = Array.isArray(editedItem.answer) ? [...editedItem.answer] : [];
    answers[index] = value;
    setEditedItem({ ...editedItem, answer: answers });
  };

  const handleChoiceAnswerToggle = (optionIndex: number) => {
    if (item.type === 'single-choice') {
      setEditedItem({ ...editedItem, answer: [optionIndex] });
    } else if (item.type === 'multiple-choice') {
      const currentAnswer = Array.isArray(editedItem.answer) ? editedItem.answer : [];
      const isSelected = currentAnswer.includes(optionIndex);
      
      if (isSelected) {
        setEditedItem({ 
          ...editedItem, 
          answer: currentAnswer.filter(a => a !== optionIndex) 
        });
      } else {
        setEditedItem({ 
          ...editedItem, 
          answer: [...currentAnswer, optionIndex].sort() 
        });
      }
    }
  };

  const validateAndSave = () => {
    // Validation
    if (!editedItem.question.trim()) {
      setValidationError('题目内容不能为空');
      return;
    }

    if (editedItem.type === 'fill-in-the-blank') {
      if (blanksCount === 0) {
        setValidationError('填空题必须包含至少一个空格（使用至少4个下划线 ____ 表示）');
        return;
      }
      
      const answers = Array.isArray(editedItem.answer) ? editedItem.answer : [];
      const emptyAnswers = answers.filter(a => !String(a).trim()).length;
      if (emptyAnswers > 0) {
        setValidationError(`请填写所有 ${blanksCount} 个空格的答案`);
        return;
      }
    }

    if ((editedItem.type === 'single-choice' || editedItem.type === 'multiple-choice') && 
        (!editedItem.options || editedItem.options.length < 2)) {
      setValidationError('选择题至少需要2个选项');
      return;
    }

    if (editedItem.type === 'single-choice') {
      const answer = Array.isArray(editedItem.answer) ? editedItem.answer : [];
      if (answer.length === 0) {
        setValidationError('请选择一个正确答案');
        return;
      }
    }

    if (editedItem.type === 'multiple-choice') {
      const answer = Array.isArray(editedItem.answer) ? editedItem.answer : [];
      if (answer.length === 0) {
        setValidationError('请选择至少一个正确答案');
        return;
      }
    }

    onSave(editedItem);
    setIsEditing(false);
    setValidationError('');
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
    setValidationError('');
    onCancel?.();
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        <Edit2 className="w-4 h-4 mr-1" />
        编辑内容
      </button>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      {/* Editing Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-blue-900">编辑模式</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={validateAndSave}
            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Save className="w-3 h-3 mr-1" />
            保存
          </button>
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-3 py-1 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            <X className="w-3 h-3 mr-1" />
            取消
          </button>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
          <AlertCircle className="w-4 h-4" />
          {validationError}
        </div>
      )}

      {/* Edit Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          题目内容
          {editedItem.type === 'fill-in-the-blank' && (
            <span className="ml-2 text-xs text-gray-500">
              (使用至少4个下划线 ____ 表示空格)
            </span>
          )}
        </label>
        <textarea
          value={editedItem.question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder={
            editedItem.type === 'fill-in-the-blank' 
              ? '例如：中国的首都是____，最大的城市是____。'
              : '请输入题目内容...'
          }
        />
        {editedItem.type === 'fill-in-the-blank' && blanksCount > 0 && (
          <div className="mt-1 text-sm text-blue-600">
            <Info className="w-3 h-3 inline mr-1" />
            检测到 {blanksCount} 个空格
          </div>
        )}
      </div>

      {/* Edit Options for Choice Questions */}
      {(editedItem.type === 'single-choice' || editedItem.type === 'multiple-choice') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选项 {editedItem.type === 'single-choice' ? '(单选)' : '(多选)'}
          </label>
          <div className="space-y-2">
            {(editedItem.options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type={editedItem.type === 'single-choice' ? 'radio' : 'checkbox'}
                  checked={
                    Array.isArray(editedItem.answer) 
                      ? editedItem.answer.includes(index)
                      : editedItem.answer === index
                  }
                  onChange={() => handleChoiceAnswerToggle(index)}
                  className="flex-shrink-0"
                />
                <span className="flex-shrink-0 text-sm text-gray-600">
                  {String.fromCharCode(65 + index)}.
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  disabled={(editedItem.options || []).length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加选项
            </button>
          </div>
        </div>
      )}

      {/* Edit Answers for Fill-in-the-blank */}
      {editedItem.type === 'fill-in-the-blank' && blanksCount > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            答案 (对应每个空格)
          </label>
          <div className="space-y-2">
            {Array.from({ length: blanksCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-shrink-0 text-sm text-gray-600">
                  空格 {index + 1}:
                </span>
                <input
                  type="text"
                  value={
                    Array.isArray(editedItem.answer) 
                      ? editedItem.answer[index] || ''
                      : index === 0 ? String(editedItem.answer || '') : ''
                  }
                  onChange={(e) => handleFillInBlankAnswerChange(index, e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`第 ${index + 1} 个空格的答案`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Answer for Subjective Questions */}
      {editedItem.type === 'subjective' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            参考答案
          </label>
          <textarea
            value={
              typeof editedItem.answer === 'string' 
                ? editedItem.answer 
                : Array.isArray(editedItem.answer)
                  ? editedItem.answer.join('\n')
                  : ''
            }
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="请输入参考答案..."
          />
        </div>
      )}
    </div>
  );
};