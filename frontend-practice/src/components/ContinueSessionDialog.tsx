import React from 'react';
import { PlayCircle, XCircle, PlusCircle, Clock, CheckCircle, FileQuestion } from 'lucide-react';

interface IncompleteSessionData {
  sessionId: string;
  progress: {
    total: number;
    answered: number;
    currentIndex: number;
  };
  configuration: {
    strategy?: string;
    totalQuestions?: number;
  };
  lastActivityAt: string;
}

interface ContinueSessionDialogProps {
  sessionData: IncompleteSessionData;
  onResume: () => void;
  onAbandon: () => void;
  onStartNew: () => void;
  onClose?: () => void;
}

export const ContinueSessionDialog: React.FC<ContinueSessionDialogProps> = ({
  sessionData,
  onResume,
  onAbandon,
  onStartNew,
  onClose
}) => {
  const { progress, lastActivityAt } = sessionData;
  const progressPercentage = Math.round((progress.answered / progress.total) * 100);

  // Format last activity time
  const formatLastActivity = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} 分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前`;
    } else {
      return `${diffDays} 天前`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">发现未完成的练习</h2>
          <p className="text-gray-600">您上次的练习还未完成，是否要继续？</p>
        </div>

        {/* Session Info */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 mb-6 border border-blue-100">
          <div className="space-y-3">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-700">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-medium">答题进度</span>
              </div>
              <span className="text-blue-700 font-bold">
                {progress.answered} / {progress.total} ({progressPercentage}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-200/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Last Activity */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-200">
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">最后活动</span>
              </div>
              <span className="text-sm text-gray-700 font-medium">
                {formatLastActivity(lastActivityAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Resume Button */}
          <button
            onClick={onResume}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center group"
          >
            <PlayCircle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            继续上次练习
          </button>

          {/* Start New Button */}
          <button
            onClick={onStartNew}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center group"
          >
            <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            开始新练习
          </button>

          {/* Abandon Button */}
          <button
            onClick={onAbandon}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group border border-gray-200"
          >
            <XCircle className="w-4 h-4 mr-2 group-hover:text-red-500 transition-colors" />
            放弃上次练习
          </button>
        </div>

        {/* Info Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          💡 提示：继续练习将从上次的位置开始
        </p>
      </div>
    </div>
  );
};

export default ContinueSessionDialog;
