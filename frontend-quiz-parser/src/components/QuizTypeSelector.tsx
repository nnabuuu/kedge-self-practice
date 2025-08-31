import React from 'react';
import { Check } from 'lucide-react';

export type QuizType = 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective';

interface QuizTypeSelectorProps {
  selectedTypes: QuizType[];
  onChange: (types: QuizType[]) => void;
}

const quizTypeInfo = [
  {
    type: 'single-choice' as QuizType,
    label: '单选题',
    description: '只有一个正确答案的选择题',
    icon: '🔘',
  },
  {
    type: 'multiple-choice' as QuizType,
    label: '多选题',
    description: '有多个正确答案的选择题',
    icon: '☑️',
  },
  {
    type: 'fill-in-the-blank' as QuizType,
    label: '填空题',
    description: '需要填写答案的题目',
    icon: '✏️',
  },
  {
    type: 'subjective' as QuizType,
    label: '主观题',
    description: '需要详细回答的开放式题目',
    icon: '📝',
  },
];

export const QuizTypeSelector: React.FC<QuizTypeSelectorProps> = ({ selectedTypes, onChange }) => {
  const handleToggle = (type: QuizType) => {
    if (selectedTypes.includes(type)) {
      // Remove type
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      // Add type
      onChange([...selectedTypes, type]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === quizTypeInfo.length) {
      onChange([]);
    } else {
      onChange(quizTypeInfo.map(info => info.type));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">选择题目类型</h3>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {selectedTypes.length === quizTypeInfo.length ? '取消全选' : '全选'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {quizTypeInfo.map((info) => (
          <button
            key={info.type}
            onClick={() => handleToggle(info.type)}
            className={`
              relative flex flex-col items-start p-4 rounded-lg border-2 transition-all
              ${selectedTypes.includes(info.type)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            {/* Checkbox indicator */}
            <div className={`
              absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center
              ${selectedTypes.includes(info.type)
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300 bg-white'
              }
            `}>
              {selectedTypes.includes(info.type) && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{info.icon}</span>
              <span className="font-medium text-gray-900">{info.label}</span>
            </div>
            <p className="text-sm text-gray-600 text-left">{info.description}</p>
          </button>
        ))}
      </div>
      
      {selectedTypes.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            请至少选择一种题目类型
          </p>
        </div>
      )}
    </div>
  );
};