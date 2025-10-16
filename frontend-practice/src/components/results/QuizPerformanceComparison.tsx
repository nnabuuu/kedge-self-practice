import React from 'react';
import { Clock, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface QuizPerformanceComparisonProps {
  quizId: string;
  userTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  timePercentile: number;
  userCorrect: boolean;
  userAccuracy: number;
  avgAccuracy: number;
  totalAttempts: number;
}

export default function QuizPerformanceComparison({
  userTime,
  avgTime,
  minTime,
  maxTime,
  timePercentile,
  userCorrect,
  userAccuracy,
  avgAccuracy,
  totalAttempts
}: QuizPerformanceComparisonProps) {
  // Calculate time comparison
  const timeDiff = userTime - avgTime;
  const timePercentDiff = avgTime > 0 ? ((timeDiff / avgTime) * 100) : 0;
  const isFaster = timeDiff < 0;
  const isSlower = timeDiff > 0;

  // Calculate accuracy comparison
  const accuracyDiff = userAccuracy - avgAccuracy;
  const isBetter = accuracyDiff > 5; // More than 5% better
  const isWorse = accuracyDiff < -5; // More than 5% worse

  // Format time display
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
      <h4 className="text-lg font-bold text-purple-900 mb-4 tracking-wide">
        📊 答题表现对比分析
      </h4>
      <p className="text-sm text-purple-700 mb-6">
        基于 {totalAttempts} 次答题数据的对比分析
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Time Comparison */}
        <div className="bg-white rounded-xl p-5 border border-purple-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h5 className="font-semibold text-gray-900">答题速度对比</h5>
          </div>

          <div className="space-y-4">
            {/* User Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">您的用时</span>
              <span className="text-lg font-bold text-gray-900">{formatTime(userTime)}</span>
            </div>

            {/* Average Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均用时</span>
              <span className="text-lg font-semibold text-gray-700">{formatTime(avgTime)}</span>
            </div>

            {/* Time Comparison Badge */}
            <div className="pt-3 border-t border-gray-100">
              {isFaster ? (
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">速度优势</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    快 {Math.abs(Math.round(timePercentDiff))}%
                  </span>
                </div>
              ) : isSlower ? (
                <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <TrendingDown className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">可提升空间</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    慢 {Math.abs(Math.round(timePercentDiff))}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <Minus className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-800">与平均相当</span>
                  </div>
                </div>
              )}
            </div>

            {/* Percentile */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-700 font-medium">速度百分位</span>
                <span className="text-sm font-bold text-blue-900">{timePercentile.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${timePercentile}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-2">
                您的答题速度超过了 {timePercentile.toFixed(0)}% 的用户
              </p>
            </div>

            {/* Time Range */}
            <div className="text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>最快: {formatTime(minTime)}</span>
                <span>最慢: {formatTime(maxTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Comparison */}
        <div className="bg-white rounded-xl p-5 border border-purple-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <h5 className="font-semibold text-gray-900">正确率对比</h5>
          </div>

          <div className="space-y-4">
            {/* User Accuracy */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">您的正确率</span>
              <span className="text-lg font-bold text-gray-900">{userAccuracy.toFixed(0)}%</span>
            </div>

            {/* Average Accuracy */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均正确率</span>
              <span className="text-lg font-semibold text-gray-700">{avgAccuracy.toFixed(0)}%</span>
            </div>

            {/* Accuracy Comparison Badge */}
            <div className="pt-3 border-t border-gray-100">
              {isBetter ? (
                <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">表现优秀</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    高 {accuracyDiff.toFixed(0)}%
                  </span>
                </div>
              ) : isWorse ? (
                <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <TrendingDown className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">需要加强</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">
                    低 {Math.abs(accuracyDiff).toFixed(0)}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <Minus className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-800">与平均相当</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {accuracyDiff >= 0 ? '+' : ''}{accuracyDiff.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {/* Current Answer Status */}
            <div className={`rounded-lg p-3 ${userCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${userCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  本次答题
                </span>
                <span className={`text-lg font-bold ${userCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {userCorrect ? '✓ 正确' : '✗ 错误'}
                </span>
              </div>
            </div>

            {/* Historical Performance */}
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-700 mb-2 font-medium">
                历史表现分析
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-600">您在此题上的正确率</span>
                <div className="flex items-center">
                  <div className="w-24 bg-purple-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${userAccuracy}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-purple-900">
                    {userAccuracy.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Performance Summary */}
      <div className="mt-6 bg-white rounded-xl p-4 border border-purple-100">
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-purple-900">综合评价：</span>
          {isFaster && isBetter && (
            <span className="text-green-700">
              您在此题上的表现非常优秀！答题速度快，正确率高，继续保持！
            </span>
          )}
          {isFaster && !isBetter && !isWorse && (
            <span className="text-blue-700">
              您的答题速度较快，正确率与平均水平相当，可以考虑在保证速度的同时提高准确性。
            </span>
          )}
          {isFaster && isWorse && (
            <span className="text-orange-700">
              您答题速度较快，但正确率偏低，建议放慢速度，仔细审题，提高准确性。
            </span>
          )}
          {!isFaster && !isSlower && isBetter && (
            <span className="text-green-700">
              您的正确率高于平均水平，表现优秀！可以尝试适当提升答题速度。
            </span>
          )}
          {!isFaster && !isSlower && !isBetter && !isWorse && (
            <span className="text-gray-700">
              您的表现与平均水平相当，继续努力，稳步提升！
            </span>
          )}
          {isSlower && isBetter && (
            <span className="text-blue-700">
              您的正确率较高，但答题速度偏慢，可以在保证准确性的前提下适当提升速度。
            </span>
          )}
          {isSlower && !isBetter && !isWorse && (
            <span className="text-orange-700">
              您的答题速度偏慢，建议加强练习，提高熟练度和答题效率。
            </span>
          )}
          {isSlower && isWorse && (
            <span className="text-red-700">
              建议加强对此题的练习，多总结错误原因，逐步提高答题速度和准确性。
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
