import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Eye, ChevronDown, ChevronUp, Tag, Layers, Book, FileText } from 'lucide-react';

interface KnowledgePoint {
  id: string;
  volume: string;
  unit: string;
  lesson: string;
  sub: string;
  topic: string;
  description?: string;
  count?: number;
}

interface KnowledgePointManagementProps {
  onBack?: () => void;
}

export default function KnowledgePointManagement({ onBack }: KnowledgePointManagementProps) {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolume, setSelectedVolume] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalPoints: 0,
    volumes: 0,
    units: 0,
    quizzes: 0
  });

  // Fetch knowledge points from backend
  useEffect(() => {
    fetchKnowledgePoints();
    fetchStats();
  }, []);

  const fetchKnowledgePoints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/knowledge-points/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKnowledgePoints(data.knowledgePoints || []);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/knowledge-points/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalPoints: data.total || 0,
          volumes: data.byVolume ? Object.keys(data.byVolume).length : 0,
          units: data.byUnit ? Object.keys(data.byUnit).length : 0,
          quizzes: 0 // Backend doesn't provide quiz count in stats endpoint
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Get unique volumes and units for filters
  const volumes = Array.from(new Set(knowledgePoints.map(kp => kp.volume)));
  const units = selectedVolume !== 'all' 
    ? Array.from(new Set(knowledgePoints.filter(kp => kp.volume === selectedVolume).map(kp => kp.unit)))
    : Array.from(new Set(knowledgePoints.map(kp => kp.unit)));

  // Filter knowledge points
  const filteredKnowledgePoints = knowledgePoints.filter(kp => {
    const matchesSearch = searchTerm === '' || 
      kp.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kp.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kp.unit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVolume = selectedVolume === 'all' || kp.volume === selectedVolume;
    const matchesUnit = selectedUnit === 'all' || kp.unit === selectedUnit;
    
    return matchesSearch && matchesVolume && matchesUnit;
  });

  // Group knowledge points by volume and unit for display
  const groupedKnowledgePoints = filteredKnowledgePoints.reduce((acc, kp) => {
    const volumeKey = kp.volume;
    const unitKey = `${kp.volume}__${kp.unit}`;
    
    if (!acc[volumeKey]) {
      acc[volumeKey] = {
        volume: kp.volume,
        units: {}
      };
    }
    
    if (!acc[volumeKey].units[unitKey]) {
      acc[volumeKey].units[unitKey] = {
        unit: kp.unit,
        lessons: {}
      };
    }
    
    const lessonKey = kp.lesson;
    if (!acc[volumeKey].units[unitKey].lessons[lessonKey]) {
      acc[volumeKey].units[unitKey].lessons[lessonKey] = {
        lesson: kp.lesson,
        points: []
      };
    }
    
    acc[volumeKey].units[unitKey].lessons[lessonKey].points.push(kp);
    
    return acc;
  }, {} as any);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载知识点中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">知识点管理</h1>
            <p className="text-gray-600">查看和管理课程知识点体系</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">总知识点</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPoints}</div>
              <div className="text-sm text-gray-600 mt-1">已录入知识点</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">册别</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.volumes}</div>
              <div className="text-sm text-gray-600 mt-1">教材册别</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Book className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">单元</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.units}</div>
              <div className="text-sm text-gray-600 mt-1">教学单元</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">题目</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.quizzes}</div>
              <div className="text-sm text-gray-600 mt-1">关联题目</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索知识点..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={selectedVolume}
                onChange={(e) => {
                  setSelectedVolume(e.target.value);
                  setSelectedUnit('all');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部册别</option>
                {volumes.map(volume => (
                  <option key={volume} value={volume}>{volume}</option>
                ))}
              </select>
              
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全部单元</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Knowledge Points Tree View */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">知识点体系</h3>
              
              {Object.values(groupedKnowledgePoints).length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">暂无匹配的知识点</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(groupedKnowledgePoints).map((volumeGroup: any) => (
                    <div key={volumeGroup.volume} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleExpanded(`volume-${volumeGroup.volume}`)}
                        className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors duration-300 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Layers className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-900">{volumeGroup.volume}</span>
                          <span className="text-sm text-gray-600">
                            ({Object.keys(volumeGroup.units).length} 个单元)
                          </span>
                        </div>
                        {expandedItems.has(`volume-${volumeGroup.volume}`) ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      
                      {expandedItems.has(`volume-${volumeGroup.volume}`) && (
                        <div className="p-4 space-y-3">
                          {Object.values(volumeGroup.units).map((unitGroup: any) => (
                            <div key={unitGroup.unit} className="border border-gray-100 rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleExpanded(`unit-${volumeGroup.volume}-${unitGroup.unit}`)}
                                className="w-full px-4 py-2 bg-green-50 hover:bg-green-100 transition-colors duration-300 flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-3">
                                  <Book className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-gray-800">{unitGroup.unit}</span>
                                  <span className="text-sm text-gray-600">
                                    ({Object.keys(unitGroup.lessons).length} 个课程)
                                  </span>
                                </div>
                                {expandedItems.has(`unit-${volumeGroup.volume}-${unitGroup.unit}`) ? (
                                  <ChevronUp className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                              
                              {expandedItems.has(`unit-${volumeGroup.volume}-${unitGroup.unit}`) && (
                                <div className="p-3 space-y-2">
                                  {Object.values(unitGroup.lessons).map((lessonGroup: any) => (
                                    <div key={lessonGroup.lesson} className="space-y-2">
                                      <div className="font-medium text-gray-700 px-2">{lessonGroup.lesson}</div>
                                      <div className="space-y-1">
                                        {lessonGroup.points.map((point: KnowledgePoint) => (
                                          <div key={point.id} className="flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-300">
                                            <div className="flex items-center space-x-3">
                                              <Tag className="w-4 h-4 text-gray-500" />
                                              <span className="text-gray-700">{point.topic}</span>
                                              {point.sub && (
                                                <span className="text-sm text-gray-500">({point.sub})</span>
                                              )}
                                            </div>
                                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-300">
                                              <Eye className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}