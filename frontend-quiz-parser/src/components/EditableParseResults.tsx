import React, { useState, useEffect } from 'react';
import { ParagraphData } from '../types/quiz';
import { FileText, Highlighter as Highlight, ArrowRight, RotateCcw, Loader2, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

interface EditableParseResultsProps {
  results: ParagraphData[];
  onReset?: () => void;
  onGenerateQuiz?: (updatedResults: ParagraphData[]) => void;
  disabled?: boolean;
}

export const EditableParseResults: React.FC<EditableParseResultsProps> = ({ 
  results, 
  onReset, 
  onGenerateQuiz, 
  disabled = false 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editableResults, setEditableResults] = useState<ParagraphData[]>(results);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ParagraphData | null>(null);
  const [newHighlightText, setNewHighlightText] = useState('');

  useEffect(() => {
    setEditableResults(results);
  }, [results]);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...editableResults[index] });
    setNewHighlightText('');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingItem(null);
    setNewHighlightText('');
  };

  const saveEditing = () => {
    if (editingItem && editingIndex !== null) {
      const newResults = [...editableResults];
      newResults[editingIndex] = editingItem;
      setEditableResults(newResults);
      cancelEditing();
    }
  };

  const updateHighlight = (highlightIndex: number, newText: string) => {
    if (editingItem) {
      const newHighlights = [...editingItem.highlighted];
      newHighlights[highlightIndex] = { ...newHighlights[highlightIndex], text: newText };
      setEditingItem({ ...editingItem, highlighted: newHighlights });
    }
  };

  const removeHighlight = (highlightIndex: number) => {
    if (editingItem) {
      const newHighlights = editingItem.highlighted.filter((_, i) => i !== highlightIndex);
      setEditingItem({ ...editingItem, highlighted: newHighlights });
    }
  };

  const addHighlight = () => {
    if (editingItem && newHighlightText.trim()) {
      const newHighlight = { text: newHighlightText.trim(), color: 'yellow' };
      setEditingItem({
        ...editingItem,
        highlighted: [...editingItem.highlighted, newHighlight]
      });
      setNewHighlightText('');
    }
  };

  const updateParagraphText = (newText: string) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, paragraph: newText });
    }
  };

  const renderHighlightedText = (paragraph: string, highlighted: Array<{text: string; color: string}>) => {
    if (highlighted.length === 0) return paragraph;
    
    const parts: Array<{ text: string; isHighlighted: boolean; color?: string }> = [];
    let lastIndex = 0;
    
    // Sort highlighted terms by their position in the paragraph
    const sortedHighlighted = highlighted
      .map(item => ({ ...item, index: paragraph.indexOf(item.text) }))
      .filter(item => item.index !== -1)
      .sort((a, b) => a.index - b.index);
    
    sortedHighlighted.forEach(({ text, color, index }) => {
      // Add non-highlighted text before this term
      if (index > lastIndex) {
        parts.push({ text: paragraph.substring(lastIndex, index), isHighlighted: false });
      }
      
      // Add highlighted term
      parts.push({ text, isHighlighted: true, color });
      lastIndex = index + text.length;
    });
    
    // Add remaining text
    if (lastIndex < paragraph.length) {
      parts.push({ text: paragraph.substring(lastIndex), isHighlighted: false });
    }
    
    return parts.map((part, index) => (
      <span
        key={index}
        className={part.isHighlighted ? 'bg-yellow-200 px-1 py-0.5 rounded font-medium' : ''}
      >
        {part.text}
      </span>
    ));
  };

  const renderEditingItem = (item: ParagraphData, index: number) => {
    if (!editingItem) return null;

    return (
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        {/* Edit Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-blue-900">编辑段落 #{index + 1}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={saveEditing}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Save className="w-3 h-3 mr-1" />
              保存
            </button>
            <button
              onClick={cancelEditing}
              className="inline-flex items-center px-3 py-1 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              <X className="w-3 h-3 mr-1" />
              取消
            </button>
          </div>
        </div>

        {/* Edit Paragraph Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">段落内容</label>
          <textarea
            value={editingItem.paragraph}
            onChange={(e) => updateParagraphText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
          />
        </div>

        {/* Edit Highlights */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">高亮内容</label>
          <div className="space-y-2">
            {editingItem.highlighted.map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={highlight.text}
                  onChange={(e) => updateHighlight(idx, e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="高亮文本"
                />
                <button
                  onClick={() => removeHighlight(idx)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Add new highlight */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newHighlightText}
                onChange={(e) => setNewHighlightText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="添加新的高亮文本"
              />
              <button
                onClick={addHighlight}
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            提示：高亮的内容将用于生成题目的答案和关键知识点
          </p>
        </div>
      </div>
    );
  };

  const handleGenerateQuiz = async () => {
    if (!isGenerating && !disabled && onGenerateQuiz) {
      setIsGenerating(true);
      await onGenerateQuiz(editableResults);
      setIsGenerating(false);
    }
  };

  // Filter out empty paragraphs for display and track original indices
  const filteredResultsWithIndices = editableResults
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => item.paragraph.trim() !== '');
  
  // Find duplicate paragraphs (same text but potentially different highlights)
  const duplicateGroups = new Map<string, number[]>();
  filteredResultsWithIndices.forEach(({ item }, displayIndex) => {
    const text = item.paragraph.trim();
    if (!duplicateGroups.has(text)) {
      duplicateGroups.set(text, []);
    }
    duplicateGroups.get(text)!.push(displayIndex);
  });
  
  // Mark which items are duplicates
  const isDuplicate = (displayIndex: number): boolean => {
    const item = filteredResultsWithIndices[displayIndex];
    if (!item) return false;
    const group = duplicateGroups.get(item.item.paragraph.trim());
    return group ? group.length > 1 : false;
  };
  
  const getDuplicateInfo = (displayIndex: number): { count: number; index: number } | null => {
    const item = filteredResultsWithIndices[displayIndex];
    if (!item) return null;
    const group = duplicateGroups.get(item.item.paragraph.trim());
    if (!group || group.length <= 1) return null;
    return {
      count: group.length,
      index: group.indexOf(displayIndex) + 1
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">解析结果</h2>
            <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm">
              {filteredResultsWithIndices.length} 项
            </span>
          </div>
        </div>
        
        <div className="p-6">
          {isGenerating && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    正在通过 AI 分析内容并生成题目...
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    这可能需要 10-30 秒，请勿重复点击或离开页面
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-4">
            {filteredResultsWithIndices.map(({ item, originalIndex }, displayIndex) => (
              <div
                key={originalIndex}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {editingIndex === originalIndex ? (
                  renderEditingItem(item, displayIndex + 1)
                ) : (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                        <span className="text-sm font-bold">{displayIndex + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {getDuplicateInfo(displayIndex) && (
                              <div className="inline-flex items-center gap-1 mb-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                <span>重复段落</span>
                                <span className="font-bold">
                                  {getDuplicateInfo(displayIndex)!.index}/{getDuplicateInfo(displayIndex)!.count}
                                </span>
                                <span>- 高亮内容不同</span>
                              </div>
                            )}
                            <p className="text-gray-800 leading-relaxed text-base">
                              {renderHighlightedText(item.paragraph, item.highlighted)}
                            </p>
                          </div>
                          <button
                            onClick={() => startEditing(originalIndex)}
                            className="ml-3 inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            编辑
                          </button>
                        </div>
                        
                        {item.highlighted.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Highlight className="w-4 h-4 mr-1" />
                              高亮内容:
                            </div>
                            {item.highlighted.map((highlight, termIndex) => (
                              <span
                                key={termIndex}
                                className="inline-flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-medium"
                              >
                                {highlight.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={onReset}
              disabled={isGenerating || editingIndex !== null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                (isGenerating || editingIndex !== null)
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              重新上传
            </button>
            
            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating || disabled || editingIndex !== null}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors ${
                (isGenerating || disabled || editingIndex !== null)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={
                editingIndex !== null 
                  ? '请先保存或取消编辑' 
                  : disabled 
                    ? '请至少选择一种题目类型' 
                    : ''
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在生成题目...
                </>
              ) : (
                <>
                  生成题目
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};