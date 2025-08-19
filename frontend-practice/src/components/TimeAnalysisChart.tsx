import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import { Clock, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface TimeAnalysisChartProps {
  questions: any[];
  answers: (string | null)[];
  questionDurations: number[];
  averageTime: number;
}

export default function TimeAnalysisChart({
  questions,
  answers,
  questionDurations,
  averageTime
}: TimeAnalysisChartProps) {
  // Prepare data for the charts
  const chartData = questions.map((question, index) => ({
    question: `题${index + 1}`,
    questionNumber: index + 1,
    time: questionDurations[index] || 0,
    isCorrect: answers[index] === question.answer,
    type: question.type === 'single-choice' ? '单选' : 
          question.type === 'multiple-choice' ? '多选' : 
          question.type === 'essay' ? '问答' : '其他',
    averageLine: averageTime
  }));

  // Calculate statistics for pie chart
  const fastQuestions = chartData.filter(d => d.time < averageTime * 0.7).length;
  const normalQuestions = chartData.filter(d => d.time >= averageTime * 0.7 && d.time <= averageTime * 1.3).length;
  const slowQuestions = chartData.filter(d => d.time > averageTime * 1.3).length;

  const pieData = [
    { name: '快速答题', value: fastQuestions, color: '#10b981' },
    { name: '正常速度', value: normalQuestions, color: '#3b82f6' },
    { name: '用时较长', value: slowQuestions, color: '#f59e0b' }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">用时: {data.time}秒</p>
          <p className="text-sm text-gray-600">题型: {data.type}</p>
          <p className="text-sm">
            答题结果: 
            <span className={`ml-1 font-medium ${data.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {data.isCorrect ? '正确' : '错误'}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Get bar color based on time and correctness
  const getBarColor = (time: number, isCorrect: boolean) => {
    if (!isCorrect) return '#ef4444'; // Red for incorrect
    if (time < averageTime * 0.7) return '#10b981'; // Green for fast
    if (time > averageTime * 1.3) return '#f59e0b'; // Orange for slow
    return '#3b82f6'; // Blue for normal
  };

  return (
    <div className="space-y-6">
      {/* Main Time Chart */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
          答题时间分布图
        </h5>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="question" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              label={{ value: '用时 (秒)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Average time line */}
            <Line 
              type="monotone" 
              dataKey="averageLine" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="平均用时"
              dot={false}
            />
            
            {/* Time bars with colors based on performance */}
            <Bar 
              dataKey="time" 
              name="答题用时"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.time, entry.isCorrect)} 
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">快速且正确</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">正常速度且正确</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-gray-600">用时较长但正确</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">回答错误</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-gray-600">平均用时线</span>
          </div>
        </div>
      </div>

      {/* Speed Distribution Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-orange-500" />
            答题速度分布
          </h5>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time Statistics */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-purple-500" />
            时间统计分析
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最快答题:</span>
              <span className="font-semibold text-green-600">
                第 {chartData.reduce((min, d, i) => d.time < chartData[min].time ? i : min, 0) + 1} 题 
                ({Math.min(...questionDurations.filter(d => d > 0))}秒)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最慢答题:</span>
              <span className="font-semibold text-orange-600">
                第 {chartData.reduce((max, d, i) => d.time > chartData[max].time ? i : max, 0) + 1} 题 
                ({Math.max(...questionDurations)}秒)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">总用时:</span>
              <span className="font-semibold text-blue-600">
                {Math.round(questionDurations.reduce((sum, d) => sum + d, 0))}秒
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均用时:</span>
              <span className="font-semibold text-purple-600">
                {averageTime}秒/题
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
          答题效率建议
        </h5>
        <div className="space-y-2 text-sm">
          {slowQuestions > questions.length * 0.3 && (
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                有 {slowQuestions} 道题用时较长，建议加强相关知识点的熟练度，提高答题速度。
              </span>
            </div>
          )}
          {fastQuestions > questions.length * 0.5 && (
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                答题速度良好！有 {fastQuestions} 道题快速完成，说明基础知识掌握扎实。
              </span>
            </div>
          )}
          {chartData.filter(d => !d.isCorrect && d.time > averageTime).length > 0 && (
            <div className="flex items-start">
              <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                有 {chartData.filter(d => !d.isCorrect && d.time > averageTime).length} 道题用时较长且答错，
                建议重点复习这些题目对应的知识点。
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}