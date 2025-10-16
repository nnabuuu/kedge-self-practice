import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, RotateCcw, Trash2, ChevronRight, ChevronDown, Layers, Eye, BarChart3, X } from 'lucide-react';
import { Subject, PracticeHistory as PracticeHistoryType, PracticeSession } from '../types/quiz';
import { useKnowledgePoints } from '../hooks/useApi';
import PracticeSessionDetailsModal from './PracticeSessionDetailsModal';
import QuizResults from './QuizResults';
import { useToast } from './Toast';
import backendApi from '../services/backendApi';

interface PracticeHistoryProps {
  subject: Subject;
  history: PracticeHistoryType[];
  onBack: () => void;
  onEnhancementRound: (knowledgePoints: string[]) => void;
  onDeleteHistory: (historyId: string) => void;
}

interface KnowledgePointStats {
  id: string;
  volume: string;
  unit: string;
  lesson: string;
  section: string;
  topic: string;
  correct: number;
  total: number;
}

interface GroupedStats {
  [volume: string]: {
    [unit: string]: {
      [lesson: string]: {
        [section: string]: KnowledgePointStats[];
      };
    };
  };
}

export default function PracticeHistory({ 
  subject, 
  history, 
  onBack, 
  onEnhancementRound, 
  onDeleteHistory 
}: PracticeHistoryProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const { info } = useToast();
  
  // State for session details modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSessionDetailsOpen, setIsSessionDetailsOpen] = useState(false);

  // State for quiz results summary
  const [summarySession, setSummarySession] = useState<PracticeSession | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Use API hook to get knowledge points
  const { data: knowledgePoints, loading: knowledgePointsLoading } = useKnowledgePoints(subject.id);

  const subjectHistory = history.filter(h => h.subjectId === subject.id);

  const handleViewSessionDetails = (sessionId: string) => {
    // Check if this is a valid UUID (backend session) or timestamp (legacy localStorage session)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

    if (!isValidUUID) {
      // This is a legacy session from localStorage (timestamp-based ID)
      info('详细查看功能仅支持新的练习记录。旧的练习记录暂时无法查看详情,请开始新的练习以使用此功能。');
      return;
    }

    setSelectedSessionId(sessionId);
    setIsSessionDetailsOpen(true);
  };

  const handleViewSummary = async (sessionId: string) => {
    // Check if this is a valid UUID (backend session) or timestamp (legacy localStorage session)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

    if (!isValidUUID) {
      info('查看总结功能仅支持新的练习记录。旧的练习记录暂时无法查看总结，请开始新的练习以使用此功能。');
      return;
    }

    setSummaryLoading(true);
    try {
      // Fetch session data from backend
      const response = await backendApi.getPracticeSession(sessionId);

      if (response.success && response.data) {
        const { session, quizzes, submittedAnswers } = response.data;

        // Convert backend answer objects to frontend answer array format
        // Backend: [{quiz_id, user_answer, is_correct}, ...]
        // Frontend: [answer1, answer2, ...] indexed by question position
        // Note: Backend stores answers as indices (0,1,2) for single/multiple choice
        //       Frontend displays them as letters (A,B,C)
        const mappedAnswers = new Array(quizzes.length).fill(null);
        if (submittedAnswers && submittedAnswers.length > 0) {
          submittedAnswers.forEach((answerObj: any) => {
            // Find the index of this quiz_id in the quizzes array
            const questionIndex = quizzes.findIndex((q: any) => q.id === answerObj.quiz_id);
            if (questionIndex >= 0) {
              const question = quizzes[questionIndex];
              let convertedAnswer = answerObj.user_answer;

              // Convert backend format to frontend format based on question type
              if (question.type === 'single-choice') {
                // Backend stores "0", "1", "2", etc. - convert to "A", "B", "C"
                const answerIndex = parseInt(convertedAnswer, 10);
                if (!isNaN(answerIndex)) {
                  convertedAnswer = String.fromCharCode(65 + answerIndex); // 65 is 'A'
                }
              } else if (question.type === 'multiple-choice') {
                // Backend stores "0,1,2" - convert to ["A", "B", "C"]
                const indices = convertedAnswer.split(',').map((s: string) => s.trim());
                convertedAnswer = indices.map((idx: string) => {
                  const num = parseInt(idx, 10);
                  return !isNaN(num) ? String.fromCharCode(65 + num) : idx;
                });
              } else if (question.type === 'fill-in-the-blank') {
                // Backend stores "answer1|||answer2|||answer3" - convert to array
                if (typeof convertedAnswer === 'string' && convertedAnswer.includes('|||')) {
                  convertedAnswer = convertedAnswer.split('|||');
                } else if (!Array.isArray(convertedAnswer)) {
                  convertedAnswer = [convertedAnswer];
                }
              }

              mappedAnswers[questionIndex] = convertedAnswer;
            }
          });
        }

        // Count correct/incorrect answers
        let correctCount = 0;
        let incorrectCount = 0;
        submittedAnswers.forEach((answerObj: any) => {
          if (answerObj.is_correct) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        });

        // Extract knowledge point IDs from quizzes since backend session doesn't provide them
        const knowledgePointIds = Array.from(new Set(
          quizzes
            .map(q => q.relatedKnowledgePointId || q.knowledge_point_id)
            .filter(Boolean)
        ));

        // Transform backend data to PracticeSession format
        const practiceSession: PracticeSession = {
          id: session.id,
          subjectId: session.subject_id || 'history',
          knowledgePoints: knowledgePointIds, // Extract from quizzes instead of session
          questions: quizzes,
          answers: mappedAnswers, // Use converted answers
          startTime: new Date(session.created_at),
          endTime: session.completed_at ? new Date(session.completed_at) : undefined,
          completed: session.status === 'completed',
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount
        };

        setSummarySession(practiceSession);
        setIsSummaryOpen(true);
      } else {
        info('获取练习总结失败，请稍后重试。');
      }
    } catch (error) {
      console.error('Failed to fetch session summary:', error);
      info('获取练习总结失败，请稍后重试。');
    } finally {
      setSummaryLoading(false);
    }
  };

  const getKnowledgePointById = (pointId: string) => {
    if (!knowledgePoints || !Array.isArray(knowledgePoints)) {
      return null;
    }
    return knowledgePoints.find(kp => kp.id === pointId);
  };

  const calculateKnowledgePointStats = (session: PracticeHistoryType): GroupedStats => {
    const stats: GroupedStats = {};
    
    // 创建统计映射
    const statsMap = new Map<string, { correct: number; total: number }>();
    
    // 初始化所有练习过的知识点统计
    session.knowledgePoints.forEach(kpId => {
      statsMap.set(kpId, { correct: 0, total: 0 });
    });

    // 根据题目和答案计算统计
    session.questions?.forEach((question, index) => {
      const kpId = question.relatedKnowledgePointId;
      
      if (session.knowledgePoints.includes(kpId)) {
        const stat = statsMap.get(kpId);
        if (stat) {
          stat.total++;
          if (session.answers && session.answers[index] === question.answer) {
            stat.correct++;
          }
        }
      }
    });
    
    // 构建分组结构
    session.knowledgePoints.forEach(kpId => {
      const kp = getKnowledgePointById(kpId);
      const stat = statsMap.get(kpId);
      
      if (kp && stat && stat.total > 0) {
        if (!stats[kp.volume]) {
          stats[kp.volume] = {};
        }
        if (!stats[kp.volume][kp.unit]) {
          stats[kp.volume][kp.unit] = {};
        }
        if (!stats[kp.volume][kp.unit][kp.lesson]) {
          stats[kp.volume][kp.unit][kp.lesson] = {};
        }
        if (!stats[kp.volume][kp.unit][kp.lesson][kp.section]) {
          stats[kp.volume][kp.unit][kp.lesson][kp.section] = [];
        }
        
        stats[kp.volume][kp.unit][kp.lesson][kp.section].push({
          id: kp.id,
          volume: kp.volume,
          unit: kp.unit,
          lesson: kp.lesson,
          section: kp.section,
          topic: kp.topic,
          correct: stat.correct,
          total: stat.total
        });
      }
    });

    return stats;
  };

  const toggleExpand = (type: 'session' | 'volume' | 'unit' | 'lesson', key: string, session?: PracticeHistoryType) => {
    const setters = {
      session: setExpandedSessions,
      volume: setExpandedVolumes,
      unit: setExpandedUnits,
      lesson: setExpandedLessons
    };
    
    const setter = setters[type];
    
    // Special handling for session expansion - expand all nested levels
    if (type === 'session' && session) {
      const isCurrentlyExpanded = expandedSessions.has(key);
      
      setExpandedSessions(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyExpanded) {
          // Collapse session and all its children
          newSet.delete(key);
        } else {
          // Expand session
          newSet.add(key);
        }
        return newSet;
      });
      
      // When expanding session, also expand all knowledge point sections
      if (!isCurrentlyExpanded) {
        const stats = calculateKnowledgePointStats(session);
        const newVolumes = new Set(expandedVolumes);
        const newUnits = new Set(expandedUnits);
        const newLessons = new Set(expandedLessons);
        
        // Expand all volumes, units, and lessons for this session
        Object.entries(stats).forEach(([volume, units]) => {
          newVolumes.add(`${session.id}-${volume}`);
          Object.entries(units).forEach(([unit, lessons]) => {
            newUnits.add(`${session.id}-${volume}-${unit}`);
            Object.entries(lessons).forEach(([lesson]) => {
              newLessons.add(`${session.id}-${volume}-${unit}-${lesson}`);
            });
          });
        });
        
        setExpandedVolumes(newVolumes);
        setExpandedUnits(newUnits);
        setExpandedLessons(newLessons);
      } else {
        // When collapsing session, also collapse all its children
        setExpandedVolumes(prev => {
          const newSet = new Set(prev);
          Array.from(newSet).forEach(item => {
            if (item.startsWith(`${session.id}-`)) {
              newSet.delete(item);
            }
          });
          return newSet;
        });
        
        setExpandedUnits(prev => {
          const newSet = new Set(prev);
          Array.from(newSet).forEach(item => {
            if (item.startsWith(`${session.id}-`)) {
              newSet.delete(item);
            }
          });
          return newSet;
        });
        
        setExpandedLessons(prev => {
          const newSet = new Set(prev);
          Array.from(newSet).forEach(item => {
            if (item.startsWith(`${session.id}-`)) {
              newSet.delete(item);
            }
          });
          return newSet;
        });
      }
    } else {
      // Regular toggle for other types
      setter(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    }
  };

  const renderKnowledgePointStats = (stats: GroupedStats, sessionId: string) => {
    return (
      <>
        {Object.entries(stats).map(([volume, units]) => (
      <div key={volume} className="mb-2">
        <button
          onClick={() => toggleExpand('volume', `${sessionId}-${volume}`)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <span className="font-bold text-blue-800 tracking-wide">{volume}</span>
          {expandedVolumes.has(`${sessionId}-${volume}`) ? (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-blue-600" />
          )}
        </button>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expandedVolumes.has(`${sessionId}-${volume}`) ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {expandedVolumes.has(`${sessionId}-${volume}`) && (
            <div className="ml-4 mt-2">
              {Object.entries(units).map(([unit, lessons]) => (
              <div key={unit} className="mb-2">
                <button
                  onClick={() => toggleExpand('unit', `${sessionId}-${volume}-${unit}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <span className="font-semibold text-gray-800 tracking-wide">{unit}</span>
                  {expandedUnits.has(`${sessionId}-${volume}-${unit}`) ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedUnits.has(`${sessionId}-${volume}-${unit}`) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  {expandedUnits.has(`${sessionId}-${volume}-${unit}`) && (
                    <div className="ml-4 mt-2">
                      {Object.entries(lessons).map(([lesson, sections]) => (
                      <div key={lesson} className="mb-2">
                        <button
                          onClick={() => toggleExpand('lesson', `${sessionId}-${volume}-${unit}-${lesson}`)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                        >
                          <span className="font-medium text-gray-700 tracking-wide">{lesson}</span>
                          {expandedLessons.has(`${sessionId}-${volume}-${unit}-${lesson}`) ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          expandedLessons.has(`${sessionId}-${volume}-${unit}-${lesson}`) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          {expandedLessons.has(`${sessionId}-${volume}-${unit}-${lesson}`) && (
                            <div className="ml-4 mt-2 space-y-2">
                              {Object.entries(sections).map(([section, topics]) => (
                              <div key={section} className="mb-2">
                                <div className="text-sm font-medium text-gray-600 mb-2 px-2 py-1 bg-blue-50 rounded">
                                  {section}
                                </div>
                                <div className="ml-2 space-y-1">
                                  {topics.map(topic => {
                                    const accuracy = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
                                    return (
                                      <div
                                        key={topic.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border hover:shadow-md transition-all duration-300"
                                      >
                                        <span className="text-gray-900 tracking-wide">{topic.topic}</span>
                                        <div className="flex items-center space-x-4">
                                          <div className="flex items-center space-x-2">
                                            <div className="flex items-center">
                                              <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                                              <span className="text-sm font-medium text-green-600">{topic.correct}</span>
                                            </div>
                                            <div className="flex items-center">
                                              <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                              <span className="text-sm font-medium text-red-600">{topic.total - topic.correct}</span>
                                            </div>
                                          </div>
                                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            accuracy >= 80 
                                              ? 'bg-green-100 text-green-800' 
                                              : accuracy >= 60 
                                              ? 'bg-yellow-100 text-yellow-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {accuracy}%
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    ))}
      </>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}小时${remainingMinutes}分钟`;
  };

  // Show loading state while knowledge points are being fetched
  if (knowledgePointsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <button
                onClick={onBack}
                className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium tracking-wide">返回</span>
              </button>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-wide">加载中...</h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 mt-4 tracking-wide">
                正在加载知识点数据...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subjectHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <button
                onClick={onBack}
                className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium tracking-wide">返回</span>
              </button>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-wide">暂无练习记录</h2>
              <p className="text-gray-600 mb-8 tracking-wide">
                您还没有完成任何{subject.name}练习。
              </p>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              >
                <span className="font-medium tracking-wide">开始第一次练习</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={onBack}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回</span>
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight tracking-wide">
              {subject.name}练习记录
            </h1>
            <p className="text-lg text-gray-600 tracking-wide">
              跟踪学习进度，回顾过往练习
            </p>
          </div>

          <div className="space-y-6">
            {subjectHistory.map((session, index) => {
              const knowledgePointStats = calculateKnowledgePointStats(session);
              const isExpanded = expandedSessions.has(session.id);
              
              return (
                <div
                  key={session.id}
                  className={`bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 ${
                    index === 0 ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''
                  }`}
                >
                  {index === 0 && (
                    <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                      最新记录
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center text-gray-600 text-sm mb-2 font-medium tracking-wide">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(session.date)}
                        <Clock className="w-4 h-4 ml-4 mr-2" />
                        {formatDuration(session.duration)}
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-lg font-semibold text-green-600">
                            {session.correctAnswers}
                          </span>
                          <span className="text-gray-600 ml-1 tracking-wide">正确</span>
                        </div>
                        <div className="flex items-center">
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span className="text-lg font-semibold text-red-600">
                            {session.wrongAnswers}
                          </span>
                          <span className="text-gray-600 ml-1 tracking-wide">错误</span>
                        </div>
                        <div className="text-sm text-gray-600 tracking-wide">
                          完成率 {session.completionRate}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewSummary(session.id)}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={summaryLoading}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        <span className="font-medium tracking-wide">{summaryLoading ? '加载中...' : '查看总结'}</span>
                      </button>
                      <button
                        onClick={() => handleViewSessionDetails(session.id)}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="font-medium tracking-wide">查看详情</span>
                      </button>
                      <button
                        onClick={() => onEnhancementRound(session.knowledgePoints)}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        <span className="font-medium tracking-wide">强化练习</span>
                      </button>
                      <button
                        onClick={() => onDeleteHistory(session.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => toggleExpand('session', session.id, session)}
                      className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 mb-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none border border-blue-200"
                    >
                      <div className="flex items-center space-x-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900 tracking-wide">知识点练习情况</h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!isExpanded && (
                          <span className="text-xs text-blue-600 mr-2">展开</span>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      {isExpanded && (
                        <div className="space-y-2 pt-2">
                          {renderKnowledgePointStats(knowledgePointStats, session.id)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Practice Session Details Modal */}
      {selectedSessionId && (
        <PracticeSessionDetailsModal
          sessionId={selectedSessionId}
          isOpen={isSessionDetailsOpen}
          onClose={() => {
            setIsSessionDetailsOpen(false);
            setSelectedSessionId(null);
          }}
        />
      )}

      {/* Quiz Results Summary Modal */}
      {isSummaryOpen && summarySession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">练习总结</h2>
              <button
                onClick={() => {
                  setIsSummaryOpen(false);
                  setSummarySession(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <QuizResults
                session={summarySession}
                onRestart={() => {
                  setIsSummaryOpen(false);
                  setSummarySession(null);
                }}
                onBackToHome={() => {
                  setIsSummaryOpen(false);
                  setSummarySession(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}