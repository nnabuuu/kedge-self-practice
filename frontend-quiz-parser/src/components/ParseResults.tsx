import React, { useState } from 'react';
import { ParagraphData } from '../types/quiz';
import { FileText, Highlighter as Highlight, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';

interface ParseResultsProps {
  results: ParagraphData[];
  onReset?: () => void;
  onGenerateQuiz?: () => void;
  disabled?: boolean;
}

export const ParseResults: React.FC<ParseResultsProps> = ({ results, onReset, onGenerateQuiz, disabled = false }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const renderHighlightedText = (paragraph: string, highlighted: Array<{text: string; color: string}>) => {
    if (highlighted.length === 0) return paragraph;
    
    let result = paragraph;
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

  // Filter out empty paragraphs for display
  const filteredResults = results.filter(item => item.paragraph.trim() !== '');

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">解析结果</h2>
            <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm">
              {filteredResults.length} 项
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
            {filteredResults.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed text-base">
                      {renderHighlightedText(item.paragraph, item.highlighted)}
                    </p>
                    
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
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={onReset}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isGenerating
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              重新上传
            </button>
            
            <button
              onClick={async () => {
                if (!isGenerating && !disabled && onGenerateQuiz) {
                  setIsGenerating(true);
                  await onGenerateQuiz();
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating || disabled}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors ${
                (isGenerating || disabled)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={disabled ? '请至少选择一种题目类型' : ''}
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