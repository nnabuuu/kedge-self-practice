import React, { useState, useEffect } from 'react';
import { GraduationCap, User, Lock, Eye, EyeOff, BookOpen, Brain, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import { systemConfigService } from '../services/systemConfigService';

interface LoginPageProps {
  onLogin: (userType: 'student' | 'teacher', userData: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  useEffect(() => {
    // Check if demo accounts should be shown
    const checkDemoAccountsVisibility = async () => {
      try {
        const shouldShow = await systemConfigService.shouldShowDemoAccounts();
        setShowDemoAccounts(shouldShow);
      } catch (error) {
        // Default to showing demo accounts if config check fails
        setShowDemoAccounts(true);
      }
    };
    
    checkDemoAccountsVisibility();
  }, []);

  // Demo accounts for testing (fallback when backend is not available)
  const demoAccounts = [
    {
      email: 'student@example.com',
      password: '11223344',
      name: 'Demo Student',
      role: 'student' as const
    },
    {
      email: 'teacher@example.com', 
      password: '11223344',
      name: 'Demo Teacher',
      role: 'teacher' as const
    },
    {
      email: 'admin@example.com',
      password: '11223344',
      name: 'Demo Admin',
      role: 'admin' as const,
      isAdmin: true
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Handle login
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      if (response.success && response.data) {
        // Treat admin role as teacher for UI purposes
        const actualRole = response.data.user.role;
        const userRole = (actualRole === 'admin' ? 'teacher' : actualRole) as 'student' | 'teacher';
        const userData = {
          ...response.data.user,
          role: actualRole, // Keep the actual role in userData
          isAdmin: actualRole === 'admin',
          subjects: (userRole === 'teacher') ? ['history', 'biology'] : undefined
        };
        onLogin(userRole, userData);
      } else {
        // Fallback to demo authentication if backend login fails
        const demoAccount = demoAccounts.find(account => 
          account.email === formData.email && account.password === formData.password
        );
        
        if (demoAccount) {
          const userData = demoAccount.role === 'student' 
            ? {
                id: 'student-001',
                name: demoAccount.name,
                email: formData.email,
                role: 'student'
              }
            : demoAccount.role === 'admin'
            ? {
                id: 'admin-001',
                name: demoAccount.name,
                email: formData.email,
                subjects: ['history', 'biology'],
                role: 'admin',
                isAdmin: true
              }
            : {
                id: 'teacher-001',
                name: demoAccount.name,
                email: formData.email,
                subjects: ['history', 'biology'],
                role: 'teacher'
              };
          onLogin(demoAccount.role === 'admin' ? 'teacher' : demoAccount.role, userData);
        } else {
          setError(response.error || '登录失败：用户名或密码错误');
        }
      }
    } catch (err) {
      setError('网络连接失败，请检查后端服务是否启动');
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const fillDemoAccount = (accountType: 'student' | 'teacher' | 'admin') => {
    const demo = demoAccounts.find(acc => acc.role === accountType);
    if (demo) {
      setFormData({
        email: demo.email,
        password: demo.password
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/4 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-6 shadow-xl shadow-blue-500/25">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2 leading-tight tracking-wide">
              {import.meta.env.VITE_ORG_NAME || ''}智能练习测验系统
            </h1>
            <p className="text-gray-600 tracking-wide">
              请使用您的账户登录
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                  账号
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入账号"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                  密码
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Demo Account Helper - Only show if enabled */}
              {showDemoAccounts && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-900 mb-2">演示账户</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemoAccount('student')}
                        className="px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg hover:bg-blue-200 transition-colors duration-300"
                      >
                        学生账户
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoAccount('teacher')}
                        className="px-3 py-2 bg-indigo-100 text-indigo-800 text-sm rounded-lg hover:bg-indigo-200 transition-colors duration-300"
                      >
                        教师账户
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemoAccount('admin')}
                        className="px-3 py-2 bg-purple-100 text-purple-800 text-sm rounded-lg hover:bg-purple-200 transition-colors duration-300"
                      >
                        管理员
                      </button>
                    </div>
                    <p className="text-xs text-blue-700">
                      点击按钮自动填入对应的演示账户信息
                    </p>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    登录中...
                  </div>
                ) : (
                  '登录系统'
                )}
              </button>
            </form>
          </div>

          {/* Features Preview */}
          <div className="mt-8 text-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-blue-500/20">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs text-gray-600 font-medium tracking-wide">个性化练习</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-purple-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs text-gray-600 font-medium tracking-wide">AI学习助手</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs text-gray-600 font-medium tracking-wide">智能分析</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}