import React, { useState } from 'react';
import { Target, ChevronRight, ChevronDown } from 'lucide-react';

interface KnowledgePointData {
  knowledge_point_id: string;
  name: string;
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

interface GroupedData {
  [volume: string]: {
    [unit: string]: {
      [lesson: string]: KnowledgePointData[];
    };
  };
}

export default function KnowledgePointHeatmap({ data }: KnowledgePointHeatmapProps) {
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Group data by volume, unit, lesson
  const groupedData: GroupedData = {};
  data.forEach(item => {
    const volume = item.volume || '未分类';
    const unit = item.unit || '未分类';
    const lesson = item.lesson || '未分类';

    if (!groupedData[volume]) groupedData[volume] = {};
    if (!groupedData[volume][unit]) groupedData[volume][unit] = {};
    if (!groupedData[volume][unit][lesson]) groupedData[volume][unit][lesson] = [];

    groupedData[volume][unit][lesson].push(item);
  });

  // Get color based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500 text-white';
    if (accuracy >= 60) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  // Get background color for cards
  const getAccuracyBgColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-50 border-green-200';
    if (accuracy >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Toggle expansion
  const toggleVolume = (volume: string) => {
    const newSet = new Set(expandedVolumes);
    if (newSet.has(volume)) {
      newSet.delete(volume);
    } else {
      newSet.add(volume);
    }
    setExpandedVolumes(newSet);
  };

  const toggleUnit = (key: string) => {
    const newSet = new Set(expandedUnits);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedUnits(newSet);
  };

  const toggleLesson = (key: string) => {
    const newSet = new Set(expandedLessons);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedLessons(newSet);
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
          <span className="text-sm text-gray-700">待提高 (<60%)</span>
        </div>
      </div>

      {/* Hierarchical Data Display */}
      {data.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedData).map(([volume, units]) => (
            <div key={volume} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Volume Level */}
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
                </div>
              </button>

              {/* Unit Level */}
              {expandedVolumes.has(volume) && (
                <div className="bg-white">
                  {Object.entries(units).map(([unit, lessons]) => {
                    const unitKey = `${volume}-${unit}`;
                    return (
                      <div key={unitKey} className="border-t border-gray-100">
                        <button
                          onClick={() => toggleUnit(unitKey)}
                          className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            {expandedUnits.has(unitKey) ? (
                              <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                            )}
                            <span className="font-semibold text-gray-800">{unit}</span>
                          </div>
                        </button>

                        {/* Lesson Level */}
                        {expandedUnits.has(unitKey) && (
                          <div className="bg-gray-50">
                            {Object.entries(lessons).map(([lesson, topics]) => {
                              const lessonKey = `${volume}-${unit}-${lesson}`;
                              return (
                                <div key={lessonKey} className="border-t border-gray-200">
                                  <button
                                    onClick={() => toggleLesson(lessonKey)}
                                    className="w-full p-4 hover:bg-gray-100 transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center">
                                      {expandedLessons.has(lessonKey) ? (
                                        <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                                      )}
                                      <span className="font-medium text-gray-700">{lesson}</span>
                                    </div>
                                  </button>

                                  {/* Topics Grid */}
                                  {expandedLessons.has(lessonKey) && (
                                    <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {topics.map(topic => (
                                        <div
                                          key={topic.knowledge_point_id}
                                          className={`p-4 rounded-lg border-2 ${getAccuracyBgColor(topic.correct_rate)} transition-all hover:shadow-md`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900 line-clamp-1">
                                              {topic.topic}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAccuracyColor(topic.correct_rate)}`}>
                                              {topic.correct_rate.toFixed(0)}%
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            练习 {topic.attempt_count} 次
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
