import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Check, Book, Layers, FileText, Target } from 'lucide-react';

interface KnowledgePoint {
  id: string;
  topic: string;
  lesson: string;
  unit: string;
  volume: string;
}

interface KnowledgePointPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (knowledgePoint: KnowledgePoint) => void;
  currentKnowledgePoint?: KnowledgePoint;
  knowledgePoints?: KnowledgePoint[];
}

export default function KnowledgePointPicker({
  isOpen,
  onClose,
  onSelect,
  currentKnowledgePoint,
  knowledgePoints: initialKnowledgePoints
}: KnowledgePointPickerProps) {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>(initialKnowledgePoints || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<KnowledgePoint | null>(currentKnowledgePoint || null);

  // Get unique values for filters
  const uniqueVolumes = [...new Set(knowledgePoints.map(kp => kp.volume).filter(Boolean))];
  const uniqueUnits = [...new Set(
    knowledgePoints
      .filter(kp => !selectedVolume || kp.volume === selectedVolume)
      .map(kp => kp.unit)
      .filter(Boolean)
  )];
  const uniqueLessons = [...new Set(
    knowledgePoints
      .filter(kp => 
        (!selectedVolume || kp.volume === selectedVolume) &&
        (!selectedUnit || kp.unit === selectedUnit)
      )
      .map(kp => kp.lesson)
      .filter(Boolean)
  )];

  // Filter knowledge points based on selections
  const filteredKnowledgePoints = knowledgePoints.filter(kp => {
    const matchesSearch = !searchTerm || 
      kp.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kp.lesson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kp.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kp.volume?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVolume = !selectedVolume || kp.volume === selectedVolume;
    const matchesUnit = !selectedUnit || kp.unit === selectedUnit;
    const matchesLesson = !selectedLesson || kp.lesson === selectedLesson;
    
    return matchesSearch && matchesVolume && matchesUnit && matchesLesson;
  });

  useEffect(() => {
    if (isOpen && (!initialKnowledgePoints || initialKnowledgePoints.length === 0)) {
      fetchKnowledgePoints();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentKnowledgePoint) {
      setSelectedKnowledgePoint(currentKnowledgePoint);
      // Initialize filters based on current knowledge point
      if (currentKnowledgePoint.volume) setSelectedVolume(currentKnowledgePoint.volume);
      if (currentKnowledgePoint.unit) setSelectedUnit(currentKnowledgePoint.unit);
      if (currentKnowledgePoint.lesson) setSelectedLesson(currentKnowledgePoint.lesson);
    }
  }, [currentKnowledgePoint]);

  const fetchKnowledgePoints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
        ? import.meta.env.VITE_API_BASE_URL
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1`;

      const response = await fetch(`${apiUrl}/knowledge-points/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setKnowledgePoints(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching knowledge points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedKnowledgePoint) {
      onSelect(selectedKnowledgePoint);
      onClose();
    }
  };

  const handleClearSelection = () => {
    setSelectedKnowledgePoint(null);
    setSelectedVolume('');
    setSelectedUnit('');
    setSelectedLesson('');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">选择知识点</h2>
              <p className="text-sm text-gray-500 mt-1">通过层级筛选或搜索找到对应的知识点</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Current Selection */}
        {selectedKnowledgePoint && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">当前选择：</span>
                <span className="text-sm text-blue-700">
                  {selectedKnowledgePoint.volume} → {selectedKnowledgePoint.unit} → 
                  {selectedKnowledgePoint.lesson} → {selectedKnowledgePoint.topic}
                </span>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                清除选择
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Side - Filters */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                搜索知识点
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入关键词搜索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Volume Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Book className="w-4 h-4 inline mr-1" />
                册次
              </label>
              <select
                value={selectedVolume}
                onChange={(e) => {
                  setSelectedVolume(e.target.value);
                  setSelectedUnit('');
                  setSelectedLesson('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全部册次</option>
                {uniqueVolumes.map(volume => (
                  <option key={volume} value={volume}>{volume}</option>
                ))}
              </select>
            </div>

            {/* Unit Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="w-4 h-4 inline mr-1" />
                单元
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setSelectedLesson('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedVolume}
              >
                <option value="">全部单元</option>
                {uniqueUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Lesson Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                课程
              </label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedUnit}
              >
                <option value="">全部课程</option>
                {uniqueLessons.map(lesson => (
                  <option key={lesson} value={lesson}>{lesson}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                找到 <span className="font-semibold text-gray-900">{filteredKnowledgePoints.length}</span> 个知识点
              </p>
            </div>
          </div>

          {/* Right Side - Knowledge Points List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : filteredKnowledgePoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Target className="w-12 h-12 mb-3 text-gray-300" />
                <p>没有找到匹配的知识点</p>
                <p className="text-sm mt-1">请调整筛选条件或搜索关键词</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredKnowledgePoints.map(kp => (
                  <div
                    key={kp.id}
                    onClick={() => setSelectedKnowledgePoint(kp)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedKnowledgePoint?.id === kp.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {kp.topic}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <span>{kp.volume}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{kp.unit}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{kp.lesson}</span>
                        </div>
                      </div>
                      {selectedKnowledgePoint?.id === kp.id && (
                        <Check className="w-5 h-5 text-blue-600 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedKnowledgePoint}
            className={`px-6 py-2 rounded-lg transition-colors ${
              selectedKnowledgePoint
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}