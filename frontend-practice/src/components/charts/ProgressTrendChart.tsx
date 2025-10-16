import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

interface ProgressTrendData {
  date: string;
  total_questions: number;
  correct_count: number;
  accuracy: number;
}

interface ProgressTrendChartProps {
  data: ProgressTrendData[];
  timeFrame: '7d' | '30d' | 'all';
  onTimeFrameChange?: (timeFrame: '7d' | '30d' | 'all') => void;
}

export default function ProgressTrendChart({ data, timeFrame, onTimeFrameChange }: ProgressTrendChartProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(data.date).toLocaleDateString('zh-CN')}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">正确率:</span> {data.accuracy}%
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">答题数:</span> {data.total_questions}题
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">正确:</span> {data.correct_count}题
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/25">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900">学习进度趋势</h4>
            <p className="text-sm text-gray-600">您的练习表现随时间变化</p>
          </div>
        </div>

        {/* Time Frame Selector */}
        {onTimeFrameChange && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onTimeFrameChange('7d')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeFrame === '7d'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7天
            </button>
            <button
              onClick={() => onTimeFrameChange('30d')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeFrame === '30d'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30天
            </button>
            <button
              onClick={() => onTimeFrameChange('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeFrame === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: '正确率 (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="正确率"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
          <Calendar className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium mb-2">暂无数据</p>
          <p className="text-sm text-center">
            选择的时间范围内没有练习记录<br />完成更多练习后，这里将显示您的学习进度趋势
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length)}%
            </p>
            <p className="text-xs text-blue-700 mt-1">平均正确率</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {data.reduce((sum, d) => sum + d.total_questions, 0)}
            </p>
            <p className="text-xs text-green-700 mt-1">总答题数</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {data.length}
            </p>
            <p className="text-xs text-purple-700 mt-1">练习天数</p>
          </div>
        </div>
      )}
    </div>
  );
}
