import React, { useState } from 'react';
import { GraduationCap, User, Lock, Eye, EyeOff, BookOpen, Brain, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';

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
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    role: 'student' as 'student' | 'teacher'
  });

  // Demo accounts for testing (fallback when backend is not available)
  const demoAccounts = [
    {
      email: 'student@example.com',
      password: '11223344',
      name: '张同学',
      role: 'student' as const
    },
    {
      email: 'teacher@example.com', 
      password: '11223344',
      name: '张老师',
      role: 'teacher' as const
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        // Handle registration
        const response = await authService.register({
          email: formData.email,
          password: formData.password,
          name: registerData.name,
          role: registerData.role
        });

        if (response.success && response.data) {
          const userData = {
            ...response.data.user,
            subjects: response.data.user.role === 'teacher' ? ['history', 'biology'] : undefined
          };
          onLogin(response.data.user.role as 'student' | 'teacher', userData);
        } else {
          setError(response.error || '注册失败');
        }
      } else {
        // Handle login
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        });

        if (response.success && response.data) {
          const userRole = response.data.user.role as 'student' | 'teacher';
          const userData = {
            ...response.data.user,
            subjects: userRole === 'teacher' ? ['history', 'biology'] : undefined
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
              : {
                  id: 'teacher-001',
                  name: demoAccount.name,
                  email: formData.email,
                  subjects: ['history', 'biology'],
                  role: 'teacher'
                };
            onLogin(demoAccount.role, userData);
          } else {
            setError(response.error || '登录失败：用户名或密码错误');
          }
        }
      }
    } catch (err) {
      setError('网络连接失败，请检查后端服务是否启动');
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'name' || e.target.name === 'role') {
      setRegisterData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    }
  };

  const fillDemoAccount = (accountType: 'student' | 'teacher') => {
    const demo = demoAccounts.find(acc => acc.role === accountType);
    if (demo) {
      setFormData({
        email: demo.email,
        password: demo.password
      });
      if (isRegisterMode) {
        setRegisterData({
          name: demo.name,
          role: demo.role
        });
      }
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
              智能练习测验系统
            </h1>
            <p className="text-gray-600 tracking-wide">
              请使用您的账户登录
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            {/* Login/Register Mode Toggle */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    !isRegisterMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isRegisterMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  注册
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input (Registration only) */}
              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                    姓名
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={registerData.name}
                      onChange={handleInputChange}
                      placeholder="请输入真实姓名"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      required={isRegisterMode}
                    />
                  </div>
                </div>
              )}

              {/* Role Selection (Registration only) */}
              {isRegisterMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                    身份
                  </label>
                  <select
                    name="role"
                    value={registerData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                    required={isRegisterMode}
                  >
                    <option value="student">学生</option>
                    <option value="teacher">教师</option>
                  </select>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 tracking-wide">
                  邮箱地址
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱地址"
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

              {/* Demo Account Helper */}
              {!isRegisterMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-900 mb-2">演示账户</h4>
                    <div className="grid grid-cols-2 gap-2">
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
                    {isRegisterMode ? '注册中...' : '登录中...'}
                  </div>
                ) : (
                  isRegisterMode ? '注册账户' : '登录系统'
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