import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, Book, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import backendApi from '../services/backendApi';

interface PracticeSessionDetailsProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Answer {
  answerId: string;
  quizId: string;
  questionText: string;
  quizType: string;
  answerOptions: any;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  answerExplanation?: string;
  answeredAt: string;
  knowledgePoint: {
    id: string;
    topic: string;
    location: string;
  };
}

interface SessionDetails {
  session: {
    id: string;
    userId: string;
    userName: string;
    userAccount: string;
    userClass: string;
    subjectId: string;
    createdAt: string;
    completedAt: string;
    strategy: string;
    timeLimitMinutes: number;
    questionCount: number;
  };
  statistics: {
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    correctRate: string;
    totalTimeSeconds: number;
    averageTimePerQuestion: number;
  };
  answers: Answer[];
  knowledgePointBreakdown: Array<{
    knowledgePointId: string;
    topic: string;
    location: string;
    questions: any[];
    correct: number;
    incorrect: number;
  }>;
}

export default function PracticeSessionDetailsModal({ sessionId, isOpen, onClose }: PracticeSessionDetailsProps) {
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'correct' | 'incorrect' | 'knowledge'>('all');

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetails();
    }
  }, [isOpen, sessionId]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    setError(null);
    
    // Check if sessionId is a valid UUID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    if (!isValidUUID) {
      setError('无法加载练习详情：此练习记录格式不支持。请开始新的练习以使用详情功能。');
      setLoading(false);
      return;
    }
    
    try {
      const response = await backendApi.get<{success: boolean, data: SessionDetails}>(`/leaderboard/session/${sessionId}/details`);
      if (response.success && response.data) {
        const detailsData = response.data.data || response.data;
        setDetails(detailsData as SessionDetails);
      } else {
        setError('获取练习详情失败：练习记录未找到或已过期。');
      }
    } catch (err: any) {
      console.error('Failed to fetch session details:', err);
      if (err.message?.includes('uuid') || err.message?.includes('UUID')) {
        setError('此练习记录格式不支持详细查看。');
      } else {
        setError('获取练习详情失败，请稍后重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (answerId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(answerId)) {
      newExpanded.delete(answerId);
    } else {
      newExpanded.add(answerId);
    }
    setExpandedQuestions(newExpanded);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseAnswerOptions = (options: any) => {
    if (!options) return {};
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch {
        return {};
      }
    }
    return options;
  };

  const getFilteredAnswers = () => {
    if (!details) return [];
    switch (activeTab) {
      case 'correct':
        return details.answers.filter(a => a.isCorrect);
      case 'incorrect':
        return details.answers.filter(a => !a.isCorrect);
      default:
        return details.answers;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">练习详情</h2>
            {details && (
              <p className="text-sm text-gray-500 mt-1">
                {details.session.userName} - {formatDate(details.session.createdAt)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                {error}
              </div>
            </div>
          ) : details ? (
            <div>
              {/* Statistics Bar */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{details.statistics.totalQuestions}</p>
                    <p className="text-xs text-gray-600">总题数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{details.statistics.correctCount}</p>
                    <p className="text-xs text-gray-600">正确</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{details.statistics.incorrectCount}</p>
                    <p className="text-xs text-gray-600">错误</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{details.statistics.correctRate}%</p>
                    <p className="text-xs text-gray-600">正确率</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatTime(details.statistics.totalTimeSeconds)}</p>
                    <p className="text-xs text-gray-600">总用时</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{formatTime(details.statistics.averageTimePerQuestion)}</p>
                    <p className="text-xs text-gray-600">平均用时</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 px-6 pt-4">
                <div className="flex space-x-6">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'all'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    全部题目 ({details.answers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('correct')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'correct'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    正确 ({details.statistics.correctCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('incorrect')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'incorrect'
                        ? 'border-red-600 text-red-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    错误 ({details.statistics.incorrectCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'knowledge'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    知识点分析
                  </button>
                </div>
              </div>

              {/* Content based on active tab */}
              <div className="p-6">
                {activeTab === 'knowledge' ? (
                  // Knowledge Point Breakdown
                  <div className="space-y-4">
                    {details.knowledgePointBreakdown.map((kp) => (
                      <div key={kp.knowledgePointId} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{kp.topic}</h4>
                            <p className="text-sm text-gray-500">{kp.location}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">{kp.correct}</p>
                              <p className="text-xs text-gray-500">正确</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-red-600">{kp.incorrect}</p>
                              <p className="text-xs text-gray-500">错误</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-600">
                                {kp.questions.length > 0 ? ((kp.correct / kp.questions.length) * 100).toFixed(0) : 0}%
                              </p>
                              <p className="text-xs text-gray-500">正确率</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${kp.questions.length > 0 ? (kp.correct / kp.questions.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Question List
                  <div className="space-y-4">
                    {getFilteredAnswers().map((answer, index) => (
                      <div key={answer.answerId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleQuestion(answer.answerId)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                                {answer.isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {answer.isCorrect ? '正确' : '错误'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  {formatTime(answer.timeSpentSeconds)}
                                </span>
                              </div>
                              <p className="text-gray-900 line-clamp-2">{answer.questionText}</p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Book className="w-3 h-3 mr-1" />
                                <span>{answer.knowledgePoint.topic}</span>
                                <span className="mx-2">•</span>
                                <span>{answer.quizType}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              {expandedQuestions.has(answer.answerId) ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {expandedQuestions.has(answer.answerId) && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            {/* Question Options (for choice questions) */}
                            {answer.answerOptions && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">选项：</p>
                                <div className="space-y-1">
                                  {Object.entries(parseAnswerOptions(answer.answerOptions)).map(([key, value]) => (
                                    <div 
                                      key={key} 
                                      className={`p-2 rounded text-sm ${
                                        answer.userAnswer === key 
                                          ? (answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                                          : answer.correctAnswer === key
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-white text-gray-700'
                                      }`}
                                    >
                                      <span className="font-medium">{key}.</span> {value as string}
                                      {answer.userAnswer === key && !answer.isCorrect && (
                                        <span className="ml-2 text-xs">(你的答案)</span>
                                      )}
                                      {answer.correctAnswer === key && (
                                        <span className="ml-2 text-xs">(正确答案)</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* User Answer vs Correct Answer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">学生答案：</p>
                                <p className={`p-2 rounded ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {answer.userAnswer || '未作答'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">正确答案：</p>
                                <p className="p-2 bg-green-100 text-green-800 rounded">
                                  {answer.correctAnswer}
                                </p>
                              </div>
                            </div>
                            
                            {/* Answer Explanation */}
                            {answer.answerExplanation && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">答案解析：</p>
                                <p className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
                                  {answer.answerExplanation}
                                </p>
                              </div>
                            )}
                            
                            {/* Metadata */}
                            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                              <span>知识点：{answer.knowledgePoint.location}</span>
                              <span className="mx-2">•</span>
                              <span>答题时间：{formatDate(answer.answeredAt)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}