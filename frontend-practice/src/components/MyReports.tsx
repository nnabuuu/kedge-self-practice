import React, { useState, useEffect } from 'react';
import { Flag, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { QuizReportData } from './ReportModal';

interface QuizReport {
  id: string;
  quiz_id: string;
  user_id: string;
  report_type: QuizReportData['report_type'];
  reason?: string;
  user_answer?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  resolution_note?: string;
  quiz?: {
    id: string;
    question: string;
    type: string;
  };
  resolver?: {
    id: string;
    name: string;
  };
}

interface MyReportsProps {
  onClose: () => void;
}

const reportTypeLabels = {
  display_error: { label: '显示错误', icon: '🖼️', color: 'text-red-600' },
  wrong_answer: { label: '答案错误', icon: '❌', color: 'text-orange-600' },
  wrong_association: { label: '知识点错误', icon: '🔗', color: 'text-yellow-600' },
  duplicate: { label: '题目重复', icon: '📑', color: 'text-blue-600' },
  unclear_wording: { label: '表述不清', icon: '💭', color: 'text-purple-600' },
  other: { label: '其他问题', icon: '📝', color: 'text-gray-600' }
};

const statusConfig = {
  pending: { label: '待处理', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  reviewing: { label: '处理中', icon: AlertCircle, color: 'text-blue-600 bg-blue-50' },
  resolved: { label: '已解决', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  dismissed: { label: '已忽略', icon: XCircle, color: 'text-gray-500 bg-gray-50' }
};

export default function MyReports({ onClose }: MyReportsProps) {
  const [reports, setReports] = useState<QuizReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | QuizReport['status']>('all');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await api.getMyReports(params);
      if (response.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const startEdit = (report: QuizReport) => {
    setEditingReport(report.id);
    setEditReason(report.reason || '');
  };

  const cancelEdit = () => {
    setEditingReport(null);
    setEditReason('');
  };

  const saveEdit = async (reportId: string) => {
    try {
      const response = await api.updateMyReport(reportId, { reason: editReason });
      if (response.success) {
        await fetchReports();
        setEditingReport(null);
        setEditReason('');
      }
    } catch (error) {
      console.error('Failed to update report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return date.toLocaleDateString('zh-CN');
    } else if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  const filteredReports = reports;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">我的报告记录</h2>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              {filteredReports.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">筛选状态：</span>
            <div className="flex gap-2">
              {(['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`
                    px-3 py-1 text-sm rounded-full transition-colors
                    ${statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {status === 'all' ? '全部' : statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无报告记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const isExpanded = expandedReports.has(report.id);
                const isEditing = editingReport === report.id;
                const StatusIcon = statusConfig[report.status].icon;
                const reportType = reportTypeLabels[report.report_type];

                return (
                  <div
                    key={report.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Report Header */}
                    <div className="p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Status and Type */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusConfig[report.status].color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[report.status].label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm">
                              <span>{reportType.icon}</span>
                              <span className={reportType.color}>{reportType.label}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(report.created_at)}
                            </span>
                          </div>
                          
                          {/* Question Preview */}
                          <p className="text-gray-800 line-clamp-2 mb-2">
                            {report.quiz?.question || '题目信息加载中...'}
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(report.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  收起详情
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  查看详情
                                </>
                              )}
                            </button>
                            {report.status === 'pending' && !isEditing && (
                              <button
                                onClick={() => startEdit(report)}
                                className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                修改描述
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-50 border-t">
                        {/* Reason */}
                        {(report.reason || isEditing) && (
                          <div className="mt-3">
                            <label className="text-sm font-medium text-gray-600">问题描述：</label>
                            {isEditing ? (
                              <div className="mt-1">
                                <textarea
                                  value={editReason}
                                  onChange={(e) => setEditReason(e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                  maxLength={500}
                                />
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">{editReason.length}/500</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={cancelEdit}
                                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                                    >
                                      取消
                                    </button>
                                    <button
                                      onClick={() => saveEdit(report.id)}
                                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      保存
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-gray-700">{report.reason}</p>
                            )}
                          </div>
                        )}

                        {/* User Answer */}
                        {report.user_answer && (
                          <div className="mt-3">
                            <label className="text-sm font-medium text-gray-600">您的答案：</label>
                            <p className="mt-1 text-gray-700">{report.user_answer}</p>
                          </div>
                        )}

                        {/* Resolution Note */}
                        {report.resolution_note && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <label className="text-sm font-medium text-green-800">处理说明：</label>
                            <p className="mt-1 text-green-700">{report.resolution_note}</p>
                            {report.resolver && (
                              <p className="mt-2 text-xs text-green-600">
                                处理人：{report.resolver.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="mt-3 text-xs text-gray-500">
                          <div>创建时间：{new Date(report.created_at).toLocaleString('zh-CN')}</div>
                          {report.updated_at !== report.created_at && (
                            <div>更新时间：{new Date(report.updated_at).toLocaleString('zh-CN')}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}