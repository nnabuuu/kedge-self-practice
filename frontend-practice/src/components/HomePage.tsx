import React from 'react';
import { GraduationCap, TrendingUp, Award, Sparkles, ArrowRight, Target, Brain, Users, LogOut, BarChart3 } from 'lucide-react';

interface HomePageProps {
  onStartPractice: () => void;
  onManagementCenter?: () => void;
  onMyAnalytics?: () => void;
  onLogout: () => void;
  currentUser: any;
  userType: 'student' | 'teacher' | null;
}

export default function HomePage({
  onStartPractice,
  onManagementCenter,
  onMyAnalytics,
  onLogout,
  currentUser,
  userType
}: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations - 更柔和的渐变 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/4 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-6xl w-full">
          {/* Header with User Info and Logout */}
          <div className="flex justify-end mb-8">
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    userType === 'teacher' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    {userType === 'teacher' ? (
                      <Users className={`w-4 h-4 ${userType === 'teacher' ? 'text-purple-600' : 'text-blue-600'}`} />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{currentUser?.name}</div>
                    <div className="text-xs text-gray-600">
                      {currentUser?.role === 'admin' ? '管理员' : userType === 'teacher' ? '教师' : '学生'}
                    </div>
                  </div>
                </div>
              </div>

              {/* My Analytics Button - For all users who can practice */}
              {onMyAnalytics && (
                <button
                  onClick={onMyAnalytics}
                  className="group flex items-center px-4 py-2 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 ease-out shadow-lg hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="font-medium tracking-wide">我的学习数据</span>
                </button>
              )}

              {/* Management Center Button - Available for both teachers and students */}
              {onManagementCenter && (
                <button
                  onClick={onManagementCenter}
                  className="group flex items-center px-4 py-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 ease-out shadow-lg hover:shadow-xl focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="font-medium tracking-wide">管理中心</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="group flex items-center px-4 py-2 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm text-gray-700 hover:text-red-600 rounded-xl hover:bg-white/90 transition-all duration-300 ease-out shadow-lg hover:shadow-xl border-2 border-transparent hover:border-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="font-medium tracking-wide">退出登录</span>
              </button>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Welcome Message */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                欢迎回来，{currentUser?.name}！
              </h2>
            </div>

            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-8 shadow-xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight tracking-wide">
                {import.meta.env.VITE_ORG_NAME || ''}智能练习测验系统
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed tracking-wide">
                通过<span className="text-blue-600 font-semibold">个性化练习</span>和
                <span className="text-purple-600 font-semibold">数据分析</span>，
                提升学习效率和知识掌握程度
              </p>
            </div>

            {/* 主要CTA - 降低认知负荷 */}
            <div className="mt-12">
              <button
                onClick={onStartPractice}
                className="group inline-flex items-center px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl font-bold rounded-3xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 ease-out shadow-2xl shadow-blue-500/30 hover:shadow-3xl hover:shadow-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <Sparkles className="w-8 h-8 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="tracking-wide">开始练习</span>
                <ArrowRight className="w-8 h-8 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>

            {/* 简化的价值提示 */}
            <p className="text-sm text-gray-500 mt-6 tracking-wide">
              💡 选择知识点即可开始，系统会自动生成个性化练习方案
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}