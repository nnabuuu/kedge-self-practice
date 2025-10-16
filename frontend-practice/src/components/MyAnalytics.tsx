import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { Subject } from '../types/quiz';
import { api } from '../services/backendApi';
import ProgressTrendChart from './charts/ProgressTrendChart';
import KnowledgePointHeatmap from './charts/KnowledgePointHeatmap';

interface MyAnalyticsProps {
  onBack: () => void;
  selectedSubject?: Subject | null;
}

export default function MyAnalytics({ onBack, selectedSubject }: MyAnalyticsProps) {
  // Progress trend state
  const [progressTrendData, setProgressTrendData] = useState<Array<{
    date: string;
    total_questions: number;
    correct_count: number;
    accuracy: number;
  }> | null>(null);
  const [progressTrendLoading, setProgressTrendLoading] = useState(false);
  const [progressTrendTimeFrame, setProgressTrendTimeFrame] = useState<'7d' | '30d' | 'all'>('30d');

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState<Array<{
    knowledge_point_id: string;
    volume: string | null;
    unit: string | null;
    lesson: string | null;
    topic: string;
    correct_rate: number;
    attempt_count: number;
  }> | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  // Fetch data on mount and when time frame changes
  useEffect(() => {
    // Fetch progress trend data
    setProgressTrendLoading(true);
    api.analytics.getProgressTrend({
      timeFrame: progressTrendTimeFrame,
      subjectId: selectedSubject?.id
    })
      .then(response => {
        if (response.success && response.data) {
          setProgressTrendData(response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching progress trend:', error);
      })
      .finally(() => {
        setProgressTrendLoading(false);
      });

    // Fetch heatmap data only once (it doesn't depend on timeFrame)
    if (!heatmapData) {
      setHeatmapLoading(true);
      api.analytics.getKnowledgePointHeatmap(selectedSubject?.id)
        .then(response => {
          if (response.success && response.data) {
            setHeatmapData(response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching knowledge point heatmap:', error);
        })
        .finally(() => {
          setHeatmapLoading(false);
        });
    }
  }, [progressTrendTimeFrame, selectedSubject?.id]);

  // Refetch progress trend when time frame changes
  const handleTimeFrameChange = (newTimeFrame: '7d' | '30d' | 'all') => {
    setProgressTrendTimeFrame(newTimeFrame);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="group flex items-center text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">返回首页</span>
          </button>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-wide">我的学习数据</h1>
              <p className="text-blue-100 mt-1">查看您的学习进度和知识点掌握情况</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Progress Trend Chart */}
          <div>
            {progressTrendLoading ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
                <span className="text-gray-600">加载学习进度趋势...</span>
              </div>
            ) : progressTrendData && progressTrendData.length > 0 ? (
              <ProgressTrendChart
                data={progressTrendData}
                timeFrame={progressTrendTimeFrame}
                onTimeFrameChange={handleTimeFrameChange}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">暂无学习进度数据</p>
                <p className="text-gray-500">完成更多练习后，这里将显示您的学习进度趋势</p>
              </div>
            )}
          </div>

          {/* Knowledge Point Heatmap */}
          <div>
            {heatmapLoading ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mr-3" />
                <span className="text-gray-600">加载知识点掌握热力图...</span>
              </div>
            ) : heatmapData && heatmapData.length > 0 ? (
              <KnowledgePointHeatmap data={heatmapData} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">暂无知识点数据</p>
                <p className="text-gray-500">完成更多练习后，这里将显示您在各知识点的掌握情况</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
