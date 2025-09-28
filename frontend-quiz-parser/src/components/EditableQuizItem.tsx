import React, { useState, useEffect, useRef } from 'react';
import { QuizItem } from '../types/quiz';
import { Edit2, Save, X, AlertCircle, Plus, Trash2, Info, Image, Upload } from 'lucide-react';

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
  const [uploadedImages, setUploadedImages] = useState<{ [key: number]: { file: File; preview: string } }>({});
  const [existingImages, setExistingImages] = useState<{ [key: number]: string }>({});
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize existing images when editing starts
  useEffect(() => {
    if (isEditing && item.images && item.images.length > 0) {
      // Parse existing image placeholders from the question
      const placeholderMatches = item.question.match(/\{\{img:(\d+)\}\}/g);
      if (placeholderMatches) {
        const existingImagesMap: { [key: number]: string } = {};
        placeholderMatches.forEach((placeholder, index) => {
          const imageIndex = parseInt(placeholder.match(/\d+/)?.[0] || '0');
          if (item.images && item.images[index]) {
            existingImagesMap[imageIndex] = item.images[index];
          }
        });
        setExistingImages(existingImagesMap);
        
        // Set next index to be higher than existing indices
        const maxIndex = Math.max(...Object.keys(existingImagesMap).map(Number), 0);
        setNextImageIndex(maxIndex + 1);
      }
    }
  }, [isEditing, item]);

  useEffect(() => {
    // Count blanks when question changes
    if (editedItem.type === 'fill-in-the-blank') {
      const matches = editedItem.question.match(/_{4,}/g);
      const count = matches ? matches.length : 0;
      setBlanksCount(count);
      
      // Update answer and hints arrays to match blanks count
      if (count > 0) {
        const currentAnswers = Array.isArray(editedItem.answer) 
          ? editedItem.answer 
          : typeof editedItem.answer === 'string' 
            ? [editedItem.answer]
            : [];
        
        const currentHints = Array.isArray(editedItem.hints)
          ? editedItem.hints
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
          setEditedItem(prev => ({ ...prev, answer: newAnswers }));
        }
        
        // Adjust hints array length
        if (currentHints.length !== count) {
          const newHints = [...currentHints];
          while (newHints.length < count) {
            newHints.push(null);
          }
          while (newHints.length > count) {
            newHints.pop();
          }
          setEditedItem(prev => ({ ...prev, hints: newHints }));
        }
      }
    }
  }, [editedItem.question, editedItem.type]);

  const handleQuestionChange = (value: string) => {
    setEditedItem({ ...editedItem, question: value });
    setValidationError('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setValidationError('请选择图片文件');
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    const imageIndex = nextImageIndex;
    
    // Store the uploaded image
    setUploadedImages(prev => ({
      ...prev,
      [imageIndex]: { file, preview }
    }));

    // Insert placeholder at cursor position
    insertImagePlaceholder(imageIndex);
    
    // Increment next image index
    setNextImageIndex(prev => prev + 1);
    
    // Clear file input for next upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertImagePlaceholder = (imageIndex: number) => {
    const textarea = questionTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const placeholder = `{{img:${imageIndex}}}`;
    
    const newText = text.substring(0, start) + placeholder + text.substring(end);
    
    // Update the question text
    handleQuestionChange(newText);
    
    // Restore cursor position after placeholder
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
      textarea.focus();
    }, 0);
  };

  const removeImage = (imageIndex: number) => {
    // Remove from uploaded images
    const newImages = { ...uploadedImages };
    delete newImages[imageIndex];
    setUploadedImages(newImages);
    
    // Remove placeholder from question text
    const placeholder = `{{img:${imageIndex}}}`;
    const newQuestion = editedItem.question.replace(placeholder, '');
    handleQuestionChange(newQuestion);
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

  const handleHintChange = (index: number, value: string) => {
    const hints = Array.isArray(editedItem.hints) ? [...editedItem.hints] : [];
    // Empty string or null are both treated as no hint
    hints[index] = value.trim() === '' ? null : value;
    setEditedItem({ ...editedItem, hints });
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

    // Convert uploaded images to base64 and include in the item
    const imagePromises = Object.entries(uploadedImages).map(async ([index, img]) => {
      return new Promise<{ index: number; base64: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({ index: Number(index), base64: e.target?.result as string });
        };
        reader.readAsDataURL(img.file);
      });
    });

    Promise.all(imagePromises).then(images => {
      // Combine existing and new images
      const allImagesMap: { [key: number]: string } = { ...existingImages };
      
      // Add newly uploaded images
      images.forEach(img => {
        allImagesMap[img.index] = img.base64;
      });
      
      // Sort by index and create final images array
      const sortedIndices = Object.keys(allImagesMap).map(Number).sort((a, b) => a - b);
      const finalImages = sortedIndices.map(index => allImagesMap[index]);
      
      // Update the item with images
      const itemWithImages = {
        ...editedItem,
        images: finalImages.length > 0 ? finalImages : undefined
      };
      
      onSave(itemWithImages);
      setIsEditing(false);
      setValidationError('');
      setUploadedImages({});
      setExistingImages({});
      setNextImageIndex(1);
    });
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
    setValidationError('');
    setUploadedImages({});
    setExistingImages({});
    setNextImageIndex(1);
    onCancel?.();
  };

  // Clean up preview URLs when component unmounts or editing is canceled
  useEffect(() => {
    return () => {
      Object.values(uploadedImages).forEach(img => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [uploadedImages]);

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
        <div className="space-y-2">
          <textarea
            ref={questionTextareaRef}
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
          
          {/* Image Upload Button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-1" />
              上传图片
            </label>
            <span className="text-xs text-gray-500">
              点击上传图片，将在光标位置插入图片占位符
            </span>
          </div>
          
          {editedItem.type === 'fill-in-the-blank' && blanksCount > 0 && (
            <div className="mt-1 text-sm text-blue-600">
              <Info className="w-3 h-3 inline mr-1" />
              检测到 {blanksCount} 个空格
            </div>
          )}
        </div>
        
        {/* Images Preview (both existing and newly uploaded) */}
        {(Object.keys(uploadedImages).length > 0 || Object.keys(existingImages).length > 0) && (
          <div className="mt-3 space-y-2">
            <div className="text-sm font-medium text-gray-700">图片：</div>
            <div className="grid grid-cols-2 gap-2">
              {/* Existing images */}
              {Object.entries(existingImages).map(([index, imgSrc]) => (
                <div key={`existing-${index}`} className="relative group">
                  <img 
                    src={imgSrc} 
                    alt={`现有图片 ${index}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <div className="absolute top-2 left-2 bg-blue-600 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {`{{img:${index}}}`}
                  </div>
                  <button
                    onClick={() => {
                      const newExisting = { ...existingImages };
                      delete newExisting[Number(index)];
                      setExistingImages(newExisting);
                      
                      // Remove placeholder from question text
                      const placeholder = `{{img:${index}}}`;
                      const newQuestion = editedItem.question.replace(placeholder, '');
                      handleQuestionChange(newQuestion);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {/* Newly uploaded images */}
              {Object.entries(uploadedImages).map(([index, img]) => (
                <div key={`new-${index}`} className="relative group">
                  <img 
                    src={img.preview} 
                    alt={`新上传图片 ${index}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <div className="absolute top-2 left-2 bg-green-600 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {`{{img:${index}}} (新)`}
                  </div>
                  <button
                    onClick={() => removeImage(Number(index))}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
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

      {/* Edit Answers and Hints for Fill-in-the-blank */}
      {editedItem.type === 'fill-in-the-blank' && blanksCount > 0 && (
        <>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              提示词 (可选，帮助学生理解需要填写的内容类型)
              <Info className="w-3 h-3 inline ml-1 text-gray-500" />
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
                      Array.isArray(editedItem.hints)
                        ? editedItem.hints[index] || ''
                        : ''
                    }
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="如：人名、朝代、年份、地名等"
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <div className="font-medium mb-1">常用提示词参考：</div>
              <div className="space-y-0.5">
                <div><span className="font-medium">时间类：</span>年份、朝代、世纪、时期、年代</div>
                <div><span className="font-medium">人物类：</span>人名、皇帝、领袖、思想家、将领</div>
                <div><span className="font-medium">地理类：</span>地名、国家、都城、地区、关隘</div>
                <div><span className="font-medium">事件类：</span>战争、事件、条约、改革、起义</div>
                <div><span className="font-medium">文化类：</span>著作、发明、制度、学派、文物</div>
                <div><span className="font-medium">其他类：</span>数字、称号、民族、王朝、组织</div>
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              提示词会在练习时显示在空格后，如"____（人名）"
            </div>
          </div>
        </>
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