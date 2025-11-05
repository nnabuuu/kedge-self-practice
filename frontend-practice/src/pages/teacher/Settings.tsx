import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Check, X, Save, RotateCcw, Key, Eye, EyeOff, Users } from 'lucide-react';
import { preferencesService, UserPreferences } from '../../services/preferencesService';
import { authService } from '../../services/authService';
import { systemConfigService } from '../../services/systemConfigService';

interface SettingsProps {
  onBack?: () => void;
}

interface TeacherSettings extends UserPreferences {
  quizManagement?: {
    enablePolish?: boolean;
    enableQuizTypeAdjustment?: boolean;
  };
}

export default function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState<TeacherSettings>({
    quizManagement: {
      enablePolish: true,
      enableQuizTypeAdjustment: true,
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  
  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // System config state (for admins)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [savingSystemConfig, setSavingSystemConfig] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Check user role using authService
      const userData = authService.getCurrentUser();
      const userIsAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
      const userIsStudent = userData?.role === 'student';
      setIsAdmin(userIsAdmin);
      setIsStudent(userIsStudent);
      
      
      // Load user preferences
      const preferences = await preferencesService.getPreferences();
      
      // Merge with default settings
      setSettings({
        ...preferences,
        quizManagement: {
          enablePolish: preferences.quizManagement?.enablePolish ?? true,
          enableQuizTypeAdjustment: preferences.quizManagement?.enableQuizTypeAdjustment ?? true,
        }
      });
      
      // Load system config if admin
      if (userIsAdmin) {
        const demoConfig = await systemConfigService.getConfig('show_demo_accounts');
        if (demoConfig) {
          setShowDemoAccounts(demoConfig.value.enabled);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setting: 'enablePolish' | 'enableQuizTypeAdjustment') => {
    setSettings(prev => ({
      ...prev,
      quizManagement: {
        ...prev.quizManagement,
        [setting]: !prev.quizManagement?.[setting]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await preferencesService.updatePreferences(settings);
      
      if (success) {
        setSavedMessage('设置已保存');
        setTimeout(() => setSavedMessage(''), 3000);
      } else {
        setSavedMessage('保存失败');
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSavedMessage('保存失败');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      quizManagement: {
        enablePolish: true,
        enableQuizTypeAdjustment: true,
      }
    });
  };
  
  const handleDemoAccountsToggle = async () => {
    const newValue = !showDemoAccounts;
    setShowDemoAccounts(newValue);
    
    try {
      setSavingSystemConfig(true);
      const success = await systemConfigService.updateConfig('show_demo_accounts', { enabled: newValue });
      
      if (success) {
        setSavedMessage('系统配置已更新');
        setTimeout(() => setSavedMessage(''), 3000);
      } else {
        // Revert on failure
        setShowDemoAccounts(!newValue);
        setSavedMessage('更新失败');
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update demo accounts config:', error);
      // Revert on error
      setShowDemoAccounts(!newValue);
      setSavedMessage('更新失败');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setSavingSystemConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载设置中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Quiz Management Settings - Only for admins */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">题库管理设置</h3>
        
        <div className="space-y-4">
          {/* Polish Feature Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900">启用题目润色功能</div>
              <div className="text-sm text-gray-600 mt-1">
                允许在题库管理中使用 AI 润色功能优化题目文本
              </div>
            </div>
            <button
              onClick={() => handleToggle('enablePolish')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.quizManagement?.enablePolish 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">启用题目润色</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.quizManagement?.enablePolish 
                    ? 'translate-x-6' 
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quiz Type Adjustment Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-900">启用题型调整功能</div>
              <div className="text-sm text-gray-600 mt-1">
                允许在题库管理中修改题目类型（单选、多选、填空等）
              </div>
            </div>
            <button
              onClick={() => handleToggle('enableQuizTypeAdjustment')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.quizManagement?.enableQuizTypeAdjustment 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">启用题型调整</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.quizManagement?.enableQuizTypeAdjustment 
                    ? 'translate-x-6' 
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Password Reset Section - Available for all users */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">密码管理</h3>
              <p className="text-sm text-gray-600">修改您的登录密码</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowPasswordReset(!showPasswordReset);
              if (!showPasswordReset) {
                // Clear fields when opening
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
                setPasswordSuccess('');
              }
            }}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            {showPasswordReset ? '取消' : '修改密码'}
          </button>
        </div>
        
        {showPasswordReset && (
          <div className="mt-6 space-y-4 pt-6 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前密码
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="输入当前密码"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="输入新密码（至少6位）"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="再次输入新密码"
              />
            </div>
            
            {passwordError && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <X className="w-4 h-4" />
                <span>{passwordError}</span>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="flex items-center space-x-2 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  // Validate inputs
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    setPasswordError('请填写所有密码字段');
                    return;
                  }
                  
                  if (newPassword.length < 6) {
                    setPasswordError('新密码至少需要6个字符');
                    return;
                  }
                  
                  if (newPassword !== confirmPassword) {
                    setPasswordError('两次输入的新密码不一致');
                    return;
                  }
                  
                  // Call API to change password
                  setChangingPassword(true);
                  try {
                    const response = await authService.changePassword(currentPassword, newPassword);
                    if (response.success) {
                      setPasswordSuccess('密码修改成功！');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setTimeout(() => {
                        setShowPasswordReset(false);
                        setPasswordSuccess('');
                      }, 2000);
                    } else {
                      setPasswordError(response.error || '密码修改失败');
                    }
                  } catch (error) {
                    setPasswordError('密码修改失败，请检查当前密码是否正确');
                  } finally {
                    setChangingPassword(false);
                  }
                }}
                disabled={changingPassword}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {changingPassword ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* System Configuration (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">系统配置</h3>
              <p className="text-sm text-gray-600">管理员专属配置</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Demo Accounts Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">显示演示账号快捷登录</div>
                <div className="text-sm text-gray-600 mt-1">
                  在登录页面显示演示账号（学生、教师、管理员）的快速登录按钮
                </div>
              </div>
              <button
                onClick={handleDemoAccountsToggle}
                disabled={savingSystemConfig}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showDemoAccounts 
                    ? 'bg-purple-600' 
                    : 'bg-gray-200'
                } ${savingSystemConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="sr-only">显示演示账号</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDemoAccounts 
                      ? 'translate-x-6' 
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Status Summary - Only for admins */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">当前功能状态</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            {settings.quizManagement?.enablePolish ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <span className="text-gray-700">
              题目润色: {settings.quizManagement?.enablePolish ? '已启用' : '已禁用'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {settings.quizManagement?.enableQuizTypeAdjustment ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <span className="text-gray-700">
              题型调整: {settings.quizManagement?.enableQuizTypeAdjustment ? '已启用' : '已禁用'}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Action Buttons - Only for admins */}
      {isAdmin && (
        <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>恢复默认</span>
        </button>
        
        <div className="flex items-center space-x-4">
          {savedMessage && (
            <span className={`text-sm ${savedMessage === '设置已保存' ? 'text-green-600' : 'text-red-600'}`}>
              {savedMessage}
            </span>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存设置'}</span>
          </button>
        </div>
      </div>
      )}
    </div>
  );
}