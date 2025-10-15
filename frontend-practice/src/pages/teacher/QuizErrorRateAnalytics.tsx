import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Eye,
  AlertCircle,
  TrendingUp,
  FileText,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "../../services/backendApi";
import { authService } from "../../services/authService";
import { useToast, ToastContainer } from "../../components/Toast";

// Type definitions
interface QuizErrorRate {
  quiz_id: string;
  quiz_text: string;
  quiz_type: string;
  correct_answer: string;
  knowledge_point_id: string | null;
  knowledge_point_name: string | null;
  total_attempts: number;
  incorrect_attempts: number;
  error_rate: number;
}

interface ErrorRateSummary {
  total_questions: number;
  avg_error_rate: number;
  high_error_count: number;
  total_attempts: number;
}

interface QuizErrorDetails {
  quiz_id: string;
  question: string;
  type: string;
  correct_answer: string;
  options: any;
  knowledge_point: {
    id: string;
    name: string;
  } | null;
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  error_rate: number;
}

interface WrongAnswerDistribution {
  answer: string;
  count: number;
  percentage: number;
}

interface Subject {
  id: string;
  name: string;
  enabled: boolean;
}

interface KnowledgePoint {
  id: string;
  topic: string;
  volume?: string;
  unit?: string;
}

const QuizErrorRateAnalytics: React.FC = () => {
  const { showToast } = useToast();

  // Filter state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<string>("");
  const [timeFrame, setTimeFrame] = useState<string>("30d");
  const [minAttempts, setMinAttempts] = useState<number>(5);

  // Data state
  const [errorRates, setErrorRates] = useState<QuizErrorRate[]>([]);
  const [summary, setSummary] = useState<ErrorRateSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  // Detail modal state
  const [selectedQuiz, setSelectedQuiz] = useState<QuizErrorDetails | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerDistribution[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load knowledge points when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadKnowledgePoints();
    } else {
      setKnowledgePoints([]);
      setSelectedKnowledgePoint("");
    }
  }, [selectedSubject]);

  // Load error rates when filters change
  useEffect(() => {
    if (selectedSubject) {
      loadErrorRates();
    }
  }, [selectedSubject, selectedKnowledgePoint, timeFrame, minAttempts, currentPage]);

  const loadSubjects = async () => {
    try {
      const response = await api.getSubjects();
      if (response.success && response.data) {
        setSubjects(response.data.filter((s: Subject) => s.enabled));
        if (response.data.length > 0) {
          setSelectedSubject(response.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load subjects:", error);
      showToast("加载科目失败", "error");
    }
  };

  const loadKnowledgePoints = async () => {
    try {
      const response = await api.getKnowledgePointsBySubject(selectedSubject);
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      }
    } catch (error) {
      console.error("Failed to load knowledge points:", error);
    }
  };

  const loadErrorRates = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({
        subjectId: selectedSubject,
        timeFrame,
        minAttempts: minAttempts.toString(),
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (selectedKnowledgePoint) {
        params.append("knowledgePointId", selectedKnowledgePoint);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8718"}/v1/analytics/quiz-error-rates?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setErrorRates(data.data || []);
        setSummary(data.summary);
        setTotalPages(data.pagination.totalPages);
      } else {
        showToast("加载错误率数据失败", "error");
      }
    } catch (error) {
      console.error("Failed to load error rates:", error);
      showToast("加载错误率数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadQuizDetails = async (quizId: string) => {
    setDetailLoading(true);
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8718"}/v1/analytics/quiz/${quizId}/error-details?timeFrame=${timeFrame}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedQuiz(data.quiz);
        setWrongAnswers(data.wrongAnswerDistribution || []);
        setShowDetailModal(true);
      } else {
        showToast("加载题目详情失败", "error");
      }
    } catch (error) {
      console.error("Failed to load quiz details:", error);
      showToast("加载题目详情失败", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const token = authService.getToken();
      const params = new URLSearchParams({
        subjectId: selectedSubject,
        timeFrame,
        minAttempts: minAttempts.toString(),
      });

      if (selectedKnowledgePoint) {
        params.append("knowledgePointId", selectedKnowledgePoint);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8718"}/v1/analytics/quiz-error-rates/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quiz-error-rates-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("导出成功", "success");
      } else {
        showToast("导出失败", "error");
      }
    } catch (error) {
      console.error("Failed to export:", error);
      showToast("导出失败", "error");
    }
  };

  const getErrorRateColor = (rate: number) => {
    if (rate >= 60) return "text-red-600 bg-red-50";
    if (rate >= 40) return "text-orange-600 bg-orange-50";
    if (rate >= 20) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getErrorRateIcon = (rate: number) => {
    if (rate >= 60) return "🔴";
    if (rate >= 40) return "🟠";
    if (rate >= 20) return "🟡";
    return "🟢";
  };

  const timeFrameOptions = [
    { value: "7d", label: "最近7天" },
    { value: "30d", label: "最近30天" },
    { value: "3m", label: "最近3个月" },
    { value: "6m", label: "最近6个月" },
    { value: "all", label: "全部时间" },
  ];

  const quizTypeLabels: Record<string, string> = {
    single_choice: "单选题",
    multiple_choice: "多选题",
    fill_in_blank: "填空题",
    essay: "问答题",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                错题率分析
              </h1>
              <p className="text-gray-600 mt-2">查看题目错误率，优化教学质量</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={!selectedSubject || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              导出 CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                科目 *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择科目</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Knowledge Point Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                知识点（可选）
              </label>
              <select
                value={selectedKnowledgePoint}
                onChange={(e) => {
                  setSelectedKnowledgePoint(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!selectedSubject || knowledgePoints.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">全部知识点</option>
                {knowledgePoints.map((kp) => (
                  <option key={kp.id} value={kp.id}>
                    {kp.topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Frame Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间范围
              </label>
              <select
                value={timeFrame}
                onChange={(e) => {
                  setTimeFrame(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timeFrameOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Attempts Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最少答题次数
              </label>
              <input
                type="number"
                min="1"
                value={minAttempts}
                onChange={(e) => {
                  setMinAttempts(parseInt(e.target.value) || 1);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">题目总数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.total_questions}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">平均错误率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.avg_error_rate.toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">高错误率题目</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary.high_error_count}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">错误率 &gt; 60%</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">总答题次数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.total_attempts}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Question List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !selectedSubject ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Filter className="w-16 h-16 mb-4 opacity-20" />
              <p>请选择科目以查看错题率分析</p>
            </div>
          ) : errorRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
              <p>暂无符合条件的题目</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        排名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        错误率
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        题目
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        知识点
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        答题次数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {errorRates.map((quiz, index) => (
                      <tr key={quiz.quiz_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getErrorRateColor(
                              quiz.error_rate
                            )}`}
                          >
                            <span>{getErrorRateIcon(quiz.error_rate)}</span>
                            {quiz.error_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {quiz.quiz_text}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {quizTypeLabels[quiz.quiz_type] || quiz.quiz_type}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-gray-600 truncate">
                            {quiz.knowledge_point_name || "未分类"}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{quiz.total_attempts}</span>
                            <span className="text-xs text-red-600">
                              错误: {quiz.incorrect_attempts}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => loadQuizDetails(quiz.quiz_id)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    第 {currentPage} 页，共 {totalPages} 页
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">题目详细分析</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">题目内容</h4>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedQuiz.question}</p>
              </div>

              {/* Correct Answer */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-green-700 mb-2">正确答案</h4>
                <p className="text-green-900 font-medium">{selectedQuiz.correct_answer}</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">总答题次数</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedQuiz.total_attempts}
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">正确次数</p>
                  <p className="text-xl font-bold text-green-600">
                    {selectedQuiz.correct_count}
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">错误次数</p>
                  <p className="text-xl font-bold text-red-600">
                    {selectedQuiz.incorrect_count}
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">错误率</p>
                  <p className="text-xl font-bold text-orange-600">
                    {selectedQuiz.error_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Wrong Answer Distribution */}
              {wrongAnswers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    错误答案分布（前10）
                  </h4>
                  <div className="space-y-2">
                    {wrongAnswers.map((wa, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-sm text-gray-600 font-medium">
                          {wa.answer}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-red-500 h-full flex items-center justify-end pr-2"
                              style={{ width: `${wa.percentage}%` }}
                            >
                              <span className="text-xs text-white font-medium">
                                {wa.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-gray-600 text-right">
                          {wa.count} 次
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Point */}
              {selectedQuiz.knowledge_point && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">关联知识点</h4>
                  <p className="text-blue-900">{selectedQuiz.knowledge_point.name}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizErrorRateAnalytics;
