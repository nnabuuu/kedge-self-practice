import React, { useState, useEffect } from 'react';
import { Cpu, Info, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface LLMConfig {
  configuration: {
    apiKeyConfigured: boolean;
    baseURL: string;
    organization: string;
  };
  models: Record<string, {
    model: string;
    temperature: number;
    maxTokens: number;
    provider: string;
  }>;
  providers: Record<string, string>;
  baseUrls: Record<string, string>;
  envVariables: Record<string, any>;
  tips: string[];
}

export default function AIConfigManagement() {
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLLMConfig();
  }, []);

  const fetchLLMConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/v1/docx/llm-provider');
      if (response.ok) {
        const data = await response.json();
        setLlmConfig(data);
      } else {
        setError('无法获取AI配置信息');
      }
    } catch (error) {
      console.error('Error fetching LLM config:', error);
      setError('获取AI配置时出错');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLLMConfig();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载AI配置中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-800">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          重试
        </button>
      </div>
    );
  }

  if (!llmConfig) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">暂无配置信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Cpu className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 配置管理</h2>
              <p className="text-sm text-gray-600 mt-1">查看和管理AI模型配置信息</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        {/* Configuration Status */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-600" />
            配置状态
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">API密钥</span>
                {llmConfig.configuration.apiKeyConfigured ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className={`text-lg font-semibold mt-1 ${
                llmConfig.configuration.apiKeyConfigured ? 'text-green-600' : 'text-red-600'
              }`}>
                {llmConfig.configuration.apiKeyConfigured ? '已配置' : '未配置'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <span className="text-sm font-medium text-gray-600">基础URL</span>
              <p className="text-lg font-semibold text-gray-900 mt-1 truncate">
                {llmConfig.configuration.baseURL}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <span className="text-sm font-medium text-gray-600">组织ID</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {llmConfig.configuration.organization}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Models Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">模型配置</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用途
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提供商
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  温度
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最大令牌
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">题目解析器</span>
                  <p className="text-xs text-gray-500 mt-1">从文档中提取题目</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {llmConfig.models.quizParser?.model}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    llmConfig.models.quizParser?.provider === 'openai' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {llmConfig.models.quizParser?.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.quizParser?.temperature}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.quizParser?.maxTokens?.toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">题目渲染器</span>
                  <p className="text-xs text-gray-500 mt-1">格式化和优化题目</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {llmConfig.models.quizRenderer?.model}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    llmConfig.models.quizRenderer?.provider === 'openai' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {llmConfig.models.quizRenderer?.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.quizRenderer?.temperature}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.quizRenderer?.maxTokens?.toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">答案验证器</span>
                  <p className="text-xs text-gray-500 mt-1">验证学生答案</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {llmConfig.models.answerValidator?.model}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    llmConfig.models.answerValidator?.provider === 'openai' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {llmConfig.models.answerValidator?.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.answerValidator?.temperature}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.answerValidator?.maxTokens?.toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">知识点提取器</span>
                  <p className="text-xs text-gray-500 mt-1">识别和分类知识点</p>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {llmConfig.models.knowledgePointExtractor?.model}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    llmConfig.models.knowledgePointExtractor?.provider === 'openai' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {llmConfig.models.knowledgePointExtractor?.provider === 'openai' ? 'OpenAI' : 'DeepSeek'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.knowledgePointExtractor?.temperature}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {llmConfig.models.knowledgePointExtractor?.maxTokens?.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">环境变量配置参考</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <pre className="font-mono text-xs overflow-x-auto">
            <code className="text-purple-700">
{`# AI模型配置
export LLM_API_KEY="your-api-key"
export LLM_BASE_URL="${llmConfig.configuration.baseURL}"

# 题目解析器配置
export LLM_MODEL_QUIZ_PARSER="${llmConfig.models.quizParser?.model}"
export LLM_TEMP_QUIZ_PARSER="${llmConfig.models.quizParser?.temperature}"
export LLM_MAX_TOKENS_QUIZ_PARSER="${llmConfig.models.quizParser?.maxTokens}"

# 题目渲染器配置
export LLM_MODEL_QUIZ_RENDERER="${llmConfig.models.quizRenderer?.model}"
export LLM_TEMP_QUIZ_RENDERER="${llmConfig.models.quizRenderer?.temperature}"
export LLM_MAX_TOKENS_QUIZ_RENDERER="${llmConfig.models.quizRenderer?.maxTokens}"

# 答案验证器配置
export LLM_MODEL_ANSWER_VALIDATOR="${llmConfig.models.answerValidator?.model}"
export LLM_TEMP_ANSWER_VALIDATOR="${llmConfig.models.answerValidator?.temperature}"
export LLM_MAX_TOKENS_ANSWER_VALIDATOR="${llmConfig.models.answerValidator?.maxTokens}"

# 知识点提取器配置
export LLM_MODEL_KNOWLEDGE_EXTRACTOR="${llmConfig.models.knowledgePointExtractor?.model}"
export LLM_TEMP_KNOWLEDGE_EXTRACTOR="${llmConfig.models.knowledgePointExtractor?.temperature}"
export LLM_MAX_TOKENS_KNOWLEDGE_EXTRACTOR="${llmConfig.models.knowledgePointExtractor?.maxTokens}"`}
            </code>
          </pre>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">配置提示</h3>
        <ul className="space-y-2">
          {llmConfig.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}