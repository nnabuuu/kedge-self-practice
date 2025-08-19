import React from 'react';
import { ArrowLeft, Scroll, ChevronRight, Dna } from 'lucide-react';
import { useSubjects } from '../hooks/useApi';
import { Subject } from '../types/quiz';

interface SubjectSelectionProps {
  onSelectSubject: (subject: Subject) => void;
  onBack: () => void;
  currentSubject?: Subject | null;
}

const iconMap = {
  Scroll,
  Dna
};

export default function SubjectSelection({ onSelectSubject, onBack, currentSubject }: SubjectSelectionProps) {
  // Use API hook to get subjects
  const { data: subjects = [], loading, error } = useSubjects();
  
  // Get the last selected subject from localStorage if no current subject
  const lastSelectedSubject = React.useMemo(() => {
    if (currentSubject) return currentSubject;
    
    const saved = localStorage.getItem('lastSelectedSubject');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [currentSubject]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载学科中...</h2>
            <p className="text-gray-600 tracking-wide">正在获取可用学科</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载失败</h2>
            <p className="text-gray-600 mb-6 tracking-wide">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations - 更柔和的渐变 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header - 统一的返回按钮样式 */}
          <div className="flex items-center mb-12">
            <button
              onClick={onBack}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回首页</span>
            </button>
          </div>

          {/* Title Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6 leading-tight tracking-wide">
              选择学科
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed tracking-wide">
              选择您想要学习的学科，开始您的知识探索之旅
            </p>
          </div>

          {/* Subject Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {subjects.map((subject) => {
              const IconComponent = iconMap[subject.icon as keyof typeof iconMap];
              const isHistory = subject.id === 'history';
              const isBiology = subject.id === 'biology';
              const isLastSelected = lastSelectedSubject?.id === subject.id;
              
              return (
                <button
                  key={subject.id}
                  onClick={() => onSelectSubject(subject)}
                  className={`group bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out border text-left relative overflow-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                    isLastSelected 
                      ? 'border-blue-400 ring-2 ring-blue-200 ring-offset-2' 
                      : 'border-white/20'
                  }`}
                >
                  {/* Card background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Recently Used Badge */}
                  {isLastSelected && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        最近使用
                      </span>
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className={`w-20 h-20 ${subject.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 leading-tight tracking-wide">
                          {subject.name}
                        </h3>
                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <p className="text-gray-600 leading-relaxed tracking-wide">
                        {isHistory && "深入学习历史知识体系，掌握重要历史事件、人物和发展规律"}
                        {isBiology && "探索生命科学奥秘，理解生物结构、功能和生命活动规律"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Coming Soon Section - 精简版本 */}
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm rounded-2xl border border-white/20 shadow-md">
              <span className="text-sm text-gray-600 mr-3 font-medium tracking-wide">更多学科即将上线：</span>
              <div className="flex items-center space-x-2">
                {['数学', '物理', '化学'].map((subject, index) => (
                  <React.Fragment key={subject}>
                    <span className="text-sm text-gray-500 font-medium tracking-wide">{subject}</span>
                    {index < 2 && <span className="text-gray-400">•</span>}
                  </React.Fragment>
                ))}
                <span className="text-sm text-gray-400 ml-1">...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}