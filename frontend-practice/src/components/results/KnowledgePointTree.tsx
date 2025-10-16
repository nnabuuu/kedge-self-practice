import React from 'react';
import { CheckCircle2, XCircle, Target, ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryStats {
  correct: number;
  total: number;
  accuracy: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface KnowledgePointAnalysis {
  id: string;
  volume: string;
  unit: string;
  lesson: string;
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface GroupedAnalysis {
  [volume: string]: {
    stats: CategoryStats;
    units: {
      [unit: string]: {
        stats: CategoryStats;
        lessons: {
          [lesson: string]: {
            stats: CategoryStats;
            topics: KnowledgePointAnalysis[];
          };
        };
      };
    };
  };
}

interface KnowledgePointTreeProps {
  knowledgePointAnalysis: GroupedAnalysis;
  expandedVolumes: Set<string>;
  expandedUnits: Set<string>;
  expandedLessons: Set<string>;
  onToggleExpand: (type: 'volume' | 'unit' | 'lesson', key: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'text-green-600 bg-green-100';
    case 'good': return 'text-blue-600 bg-blue-100';
    case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
    case 'poor': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'excellent': return '优秀';
    case 'good': return '良好';
    case 'needs-improvement': return '需加强';
    case 'poor': return '较差';
    default: return '未知';
  }
};

const renderStatsInfo = (stats: CategoryStats) => (
  <div className="flex items-center space-x-4 text-sm">
    <div className="flex items-center space-x-1">
      <CheckCircle2 className="w-4 h-4 text-green-500" />
      <span className="text-green-600 font-medium">{stats.correct}</span>
    </div>
    <div className="flex items-center space-x-1">
      <XCircle className="w-4 h-4 text-red-500" />
      <span className="text-red-600 font-medium">{stats.total - stats.correct}</span>
    </div>
    <div className="flex items-center space-x-1">
      <Target className="w-4 h-4 text-blue-500" />
      <span className="text-blue-600 font-medium">{stats.accuracy}%</span>
    </div>
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.status)}`}>
      {getStatusText(stats.status)}
    </div>
  </div>
);

export default function KnowledgePointTree({
  knowledgePointAnalysis,
  expandedVolumes,
  expandedUnits,
  expandedLessons,
  onToggleExpand
}: KnowledgePointTreeProps) {
  return (
    <>
      {Object.entries(knowledgePointAnalysis).map(([volume, volumeData]) => (
        <div key={volume} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* 册级别 - 包含统计信息 */}
          <button
            onClick={() => onToggleExpand('volume', volume)}
            className="w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="font-bold text-blue-800 text-lg mr-3 tracking-wide">{volume}</span>
                {expandedVolumes.has(volume) ? (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
            {renderStatsInfo(volumeData.stats)}
          </button>

          {expandedVolumes.has(volume) && (
            <div className="bg-white">
              {Object.entries(volumeData.units).map(([unit, unitData]) => (
                <div key={unit} className="border-t border-gray-100">
                  {/* 单元级别 - 包含统计信息 */}
                  <button
                    onClick={() => onToggleExpand('unit', `${volume}-${unit}`)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-800 mr-3 tracking-wide">{unit}</span>
                        {expandedUnits.has(`${volume}-${unit}`) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    </div>
                    {renderStatsInfo(unitData.stats)}
                  </button>

                  {expandedUnits.has(`${volume}-${unit}`) && (
                    <div className="bg-gray-50">
                      {Object.entries(unitData.lessons).map(([lesson, lessonData]) => (
                        <div key={lesson} className="border-t border-gray-200">
                          {/* 课级别 - 包含统计信息 */}
                          <button
                            onClick={() => onToggleExpand('lesson', `${volume}-${unit}-${lesson}`)}
                            className="w-full p-4 hover:bg-gray-100 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 mr-3 tracking-wide">{lesson}</span>
                                {expandedLessons.has(`${volume}-${unit}-${lesson}`) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                            </div>
                            {renderStatsInfo(lessonData.stats)}
                          </button>

                          {expandedLessons.has(`${volume}-${unit}-${lesson}`) && (
                            <div className="bg-white p-4 space-y-3">
                              {lessonData.topics.map(topic => (
                                <div
                                  key={topic.id}
                                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 mb-1 tracking-wide">{topic.topic}</div>
                                    <div className="text-sm text-gray-600">
                                      {topic.correct}/{topic.total} 题正确
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-gray-900">{topic.accuracy}%</div>
                                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(topic.status)}`}>
                                        {getStatusText(topic.status)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
