import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Check, X, Save, RotateCcw } from 'lucide-react';
import { preferencesService, UserPreferences } from '../../services/preferencesService';

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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const preferences = await preferencesService.getPreferences();
      
      // Merge with default settings
      setSettings({
        ...preferences,
        quizManagement: {
          enablePolish: preferences.quizManagement?.enablePolish ?? true,
          enableQuizTypeAdjustment: preferences.quizManagement?.enableQuizTypeAdjustment ?? true,
        }
      });
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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">系统设置</h2>
            <p className="text-sm text-gray-600">配置系统功能和偏好设置</p>
          </div>
        </div>
      </div>

      {/* Quiz Management Settings */}
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

      {/* Feature Status Summary */}
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

      {/* Action Buttons */}
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
    </div>
  );
}