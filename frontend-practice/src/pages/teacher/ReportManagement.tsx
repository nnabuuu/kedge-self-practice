import React, { useState, useEffect } from 'react';
import { Flag, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Eye, MessageSquare, User, Calendar } from 'lucide-react';
import { api } from '../../services/backendApi';

interface QuizReport {
  id: string;
  quiz_id: string;
  user_id: string;
  user_name?: string;
  report_type: 'display_error' | 'wrong_answer' | 'wrong_association' | 'duplicate' | 'unclear_wording' | 'other';
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
    answer?: string | string[];
    knowledge_point?: string;
  };
  resolver?: {
    id: string;
    name: string;
  };
}

const reportTypeConfig = {
  display_error: { label: '显示错误', icon: '🖼️', color: 'bg-red-100 text-red-700' },
  wrong_answer: { label: '答案错误', icon: '❌', color: 'bg-orange-100 text-orange-700' },
  wrong_association: { label: '知识点错误', icon: '🔗', color: 'bg-yellow-100 text-yellow-700' },
  duplicate: { label: '题目重复', icon: '📑', color: 'bg-blue-100 text-blue-700' },
  unclear_wording: { label: '表述不清', icon: '💭', color: 'bg-purple-100 text-purple-700' },
  other: { label: '其他问题', icon: '📝', color: 'bg-gray-100 text-gray-700' }
};

const statusConfig = {
  pending: { label: '待处理', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: '处理中', icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  dismissed: { label: '已忽略', icon: XCircle, color: 'bg-gray-100 text-gray-700' }
};

export default function ReportManagement() {
  const [reports, setReports] = useState<QuizReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<QuizReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | QuizReport['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | QuizReport['report_type']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 50,
        offset: 0
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.report_type = typeFilter;
      
      const response = await api.reports.getManagementReports(params);
      
      if (response.success && response.data) {
        // Transform the data to match our component's interface
        const transformedReports: QuizReport[] = response.data.map((item: any) => ({
          id: item.id,
          quiz_id: item.quiz_id,
          user_id: item.user_id,
          user_name: item.user_name || item.student_name,
          report_type: item.report_type,
          reason: item.reason,
          user_answer: item.user_answer,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          resolution_note: item.resolution_note,
          quiz: item.quiz ? {
            id: item.quiz.id,
            question: item.quiz.question,
            type: item.quiz.type,
            answer: item.quiz.answer,
            knowledge_point: item.quiz.knowledge_point
          } : undefined,
          resolver: item.resolver
        }));
        
        setReports(transformedReports);
      } else {
        console.error('Failed to fetch reports:', response);
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: QuizReport['status']) => {
    try {
      const response = await api.reports.updateStatus(reportId, {
        status: newStatus,
        resolution_note: resolutionNote || undefined
      });
      
      if (response.success) {
        // Update local state
        setReports(prev => prev.map(r => 
          r.id === reportId ? { ...r, status: newStatus, resolution_note: resolutionNote } : r
        ));
        setShowDetailModal(false);
        setSelectedReport(null);
        setResolutionNote('');
        
        // Optionally refresh the list
        fetchReports();
      } else {
        console.error('Failed to update report status:', response);
      }
    } catch (error) {
      console.error('Failed to update report status:', error);
    }
  };

  const openDetailModal = (report: QuizReport) => {
    setSelectedReport(report);
    setResolutionNote(report.resolution_note || '');
    setShowDetailModal(true);
  };

  const filteredReports = reports.filter(report => {
    if (searchTerm && !report.quiz?.question.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const reviewingCount = reports.filter(r => r.status === 'reviewing').length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">问题报告管理</h2>
        <p className="text-gray-600">查看和处理学生提交的题目问题报告</p>
        
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">待处理</p>
                <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">处理中</p>
                <p className="text-2xl font-bold text-blue-700">{reviewingCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">已解决</p>
                <p className="text-2xl font-bold text-green-700">
                  {reports.filter(r => r.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总报告</p>
                <p className="text-2xl font-bold text-gray-700">{reports.length}</p>
              </div>
              <Flag className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索题目内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有状态</option>
          <option value="pending">待处理</option>
          <option value="reviewing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="dismissed">已忽略</option>
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有类型</option>
          <option value="display_error">显示错误</option>
          <option value="wrong_answer">答案错误</option>
          <option value="wrong_association">知识点错误</option>
          <option value="duplicate">题目重复</option>
          <option value="unclear_wording">表述不清</option>
          <option value="other">其他问题</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无报告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => {
            const StatusIcon = statusConfig[report.status].icon;
            const typeConfig = reportTypeConfig[report.report_type];
            
            return (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusConfig[report.status].color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[report.status].label}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {report.user_name || '未知用户'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2 line-clamp-2">
                      <span className="font-medium">题目：</span>
                      {report.quiz?.question}
                    </div>
                    
                    {report.reason && (
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">问题描述：</span>
                        {report.reason}
                      </div>
                    )}
                    
                    {report.quiz?.knowledge_point && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">知识点：</span>
                        {report.quiz.knowledge_point}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => openDetailModal(report)}
                    className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    处理
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">处理问题报告</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">题目</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedReport.quiz?.question}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">问题类型</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${reportTypeConfig[selectedReport.report_type].color}`}>
                    {reportTypeConfig[selectedReport.report_type].icon} {reportTypeConfig[selectedReport.report_type].label}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedReport.reason || '无描述'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生信息</label>
                  <div className="text-sm text-gray-600">
                    {selectedReport.user_name || '未知用户'} - {new Date(selectedReport.created_at).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="输入处理备注..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReport.id, 'dismissed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    忽略
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReport.id, 'reviewing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    标记处理中
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReport.id, 'resolved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    标记已解决
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}