import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { QuizQuestion } from '../types/quiz';

export interface QuizReportData {
  quiz_id: string;
  report_type: 'display_error' | 'wrong_answer' | 'wrong_association' | 'duplicate' | 'unclear_wording' | 'other';
  reason?: string;
  user_answer?: string;
  session_id?: string;
}

interface ReportModalProps {
  quiz: QuizQuestion;
  sessionId?: string;
  userAnswer?: string | string[];
  onSubmit: (report: QuizReportData) => void;
  onClose: () => void;
}

const reportTypes = [
  {
    value: 'display_error' as const,
    label: '显示错误',
    description: '图片、格式、乱码等',
    icon: '🖼️'
  },
  {
    value: 'wrong_answer' as const,
    label: '答案错误',
    description: '标准答案有误',
    icon: '❌'
  },
  {
    value: 'wrong_association' as const,
    label: '知识点错误',
    description: '分类不正确',
    icon: '🔗'
  },
  {
    value: 'duplicate' as const,
    label: '题目重复',
    description: '题库中已存在',
    icon: '📑'
  },
  {
    value: 'unclear_wording' as const,
    label: '表述不清',
    description: '题目有歧义',
    icon: '💭'
  },
  {
    value: 'other' as const,
    label: '其他问题',
    description: '',
    icon: '📝'
  }
];

export default function ReportModal({
  quiz,
  sessionId,
  userAnswer,
  onSubmit,
  onClose
}: ReportModalProps) {
  const [reportType, setReportType] = useState<QuizReportData['report_type'] | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reportType) return;

    setIsSubmitting(true);
    
    const reportData: QuizReportData = {
      quiz_id: quiz.id,
      report_type: reportType,
      reason: reason || undefined,
      session_id: sessionId,
      user_answer: Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer
    };

    try {
      await onSubmit(reportData);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to submit report:', error);
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">感谢您的反馈</h3>
          <p className="text-gray-600 text-center">我们会尽快处理您的报告</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">报告问题</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Question Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-600">当前题目：</p>
                  <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">
                    ID: {quiz.id}
                  </span>
                </div>
                <p className="text-gray-800 line-clamp-3">
                  {quiz.question.substring(0, 150)}
                  {quiz.question.length > 150 && '...'}
                </p>
              </div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              请选择问题类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`
                    p-3 border rounded-lg text-left transition-all
                    ${reportType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      {type.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {type.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Details */}
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              问题描述（选填）
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请简要描述您遇到的问题..."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {reason.length}/500
            </div>
          </div>

          {/* Your Answer (if provided) */}
          {userAnswer && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">您的答案</p>
                  <p className="text-sm text-yellow-700">
                    {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reportType || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              '提交报告'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}