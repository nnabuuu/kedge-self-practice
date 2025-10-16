import React, { useState } from 'react';
import { Target, ChevronRight, ChevronDown } from 'lucide-react';

interface KnowledgePointData {
  knowledge_point_id: string;
  volume: string | null;
  unit: string | null;
  lesson: string | null;
  topic: string;
  correct_rate: number;
  attempt_count: number;
}

interface KnowledgePointHeatmapProps {
  data: KnowledgePointData[];
}

interface GroupedByVolume {
  [volume: string]: KnowledgePointData[];
}

export default function KnowledgePointHeatmap({ data }: KnowledgePointHeatmapProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());

  // Group data by volume only (flat structure within each volume)
  const groupedData: GroupedByVolume = {};
  data.forEach(item => {
    const volume = item.volume || '未分类';
    if (!groupedData[volume]) groupedData[volume] = [];
    groupedData[volume].push(item);
  });

  // Get color based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500 text-white';
    if (accuracy >= 60) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  // Get background color for cards
  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-50 border-green-200 hover:border-green-300';
    if (accuracy >= 60) return 'bg-yellow-50 border-yellow-200 hover:border-yellow-300';
    return 'bg-red-50 border-red-200 hover:border-red-300';
  };

  // Toggle volume expansion
  const toggleVolume = (volume: string) => {
    const newSet = new Set(expandedVolumes);
    if (newSet.has(volume)) {
      newSet.delete(volume);
    } else {
      newSet.add(volume);
    }
    setExpandedVolumes(newSet);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-purple-500/25">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900">知识点掌握热力图</h4>
          <p className="text-sm text-gray-600">各知识点的掌握程度一目了然</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600 font-medium">掌握程度:</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">优秀 (≥80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-700">良好 (60-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-700">待提高 (&lt;60%)</span>
        </div>
      </div>

      {/* Data Display */}
      {data.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedData).map(([volume, topics]) => (
            <div key={volume} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Volume Header - Clickable */}
              <button
                onClick={() => toggleVolume(volume)}
                className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center">
                  {expandedVolumes.has(volume) ? (
                    <ChevronDown className="w-5 h-5 text-blue-600 mr-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-blue-600 mr-2" />
                  )}
                  <span className="font-bold text-blue-900 text-lg">{volume}</span>
                  <span className="ml-4 text-sm text-blue-700 font-medium">
                    {topics.length} 个知识点
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  平均正确率: {Math.round(topics.reduce((sum, t) => sum + t.correct_rate, 0) / topics.length)}%
                </div>
              </button>

              {/* Topics Grid - All visible when expanded */}
              {expandedVolumes.has(volume) && (
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {topics.map(topic => (
                      <div
                        key={topic.knowledge_point_id}
                        className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getAccuracyBgColor(topic.correct_rate)}`}
                      >
                        {/* Topic Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 mr-2">
                            <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                              {topic.topic}
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              {topic.unit && <div>单元: {topic.unit}</div>}
                              {topic.lesson && <div>课时: {topic.lesson}</div>}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getAccuracyColor(topic.correct_rate)}`}>
                            {topic.correct_rate.toFixed(0)}%
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
                          <span>练习 {topic.attempt_count} 次</span>
                          <span className="font-medium">
                            {topic.correct_rate >= 80 ? '✓ 已掌握' : topic.correct_rate >= 60 ? '进步中' : '需加强'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
          <Target className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium mb-2">暂无数据</p>
          <p className="text-sm text-center">
            完成练习后，这里将显示您在各知识点的掌握情况
          </p>
        </div>
      )}
    </div>
  );
}
