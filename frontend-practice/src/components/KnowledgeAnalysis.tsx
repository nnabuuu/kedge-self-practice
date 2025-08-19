import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send, Bot, User, TrendingUp, Target, BookOpen, Brain, Sparkles, BarChart3, Zap, CheckCircle2, XCircle, Clock, Award } from 'lucide-react';
import { Subject, PracticeHistory } from '../types/quiz';
import { useKnowledgePoints } from '../hooks/useApi';

interface KnowledgeAnalysisProps {
  subject: Subject;
  history: PracticeHistory[];
  onBack: () => void;
  onEnhancementRound: (knowledgePoints: string[]) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface KnowledgePointStats {
  id: string;
  volume: string;
  unit: string;
  lesson: string;
  section: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers?: number;
  accuracy: number;
  lastPracticed?: Date;
  masteryLevel: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

export default function KnowledgeAnalysis({ 
  subject, 
  history, 
  onBack, 
  onEnhancementRound 
}: KnowledgeAnalysisProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: `你好！我是你的${subject.name}学习助手。我可以帮你分析学习情况，制定学习计划，解答学习中的疑问。有什么我可以帮助你的吗？`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Use API hook to get knowledge points
  const { data: knowledgePoints = [], loading: knowledgePointsLoading } = useKnowledgePoints(subject.id);

  // 获取当前学科的练习历史
  const subjectHistory = history.filter(h => h.subjectId === subject.id);

  // 计算知识点统计 - 只分析最近20次练习中的错题
  const calculateKnowledgePointStats = (): KnowledgePointStats[] => {
    // Check if knowledgePoints is null or undefined
    if (!knowledgePoints || knowledgePoints.length === 0) {
      return [];
    }

    const statsMap = new Map<string, {
      totalQuestions: number;
      correctAnswers: number;
      wrongAnswers: number;
      lastPracticed?: Date;
    }>();

    // 只分析最近20次练习
    const recentSessions = subjectHistory.slice(0, 20);

    // 统计练习数据
    recentSessions.forEach(session => {
      session.questions?.forEach((question, index) => {
        const kpId = question.relatedKnowledgePointId;
        
        // 只跟踪练习过的知识点
        if (!statsMap.has(kpId)) {
          statsMap.set(kpId, {
            totalQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0
          });
        }
        
        const stat = statsMap.get(kpId)!;
        stat.totalQuestions++;
        
        if (session.answers && session.answers[index] === question.answer) {
          stat.correctAnswers++;
        } else if (session.answers && session.answers[index] !== null) {
          stat.wrongAnswers++;
        }
        
        const sessionDate = session.date instanceof Date ? session.date : new Date(session.date);
        if (!stat.lastPracticed || sessionDate > stat.lastPracticed) {
          stat.lastPracticed = sessionDate;
        }
      });
    });

    // 只返回有错题的知识点
    const results: KnowledgePointStats[] = [];
    
    statsMap.forEach((stat, kpId) => {
      // 只包含有错题的知识点
      if (stat.wrongAnswers > 0) {
        const kp = knowledgePoints.find(k => k.id === kpId);
        if (kp) {
          const accuracy = stat.totalQuestions > 0 
            ? Math.round((stat.correctAnswers / stat.totalQuestions) * 100) 
            : 0;
          
          let masteryLevel: 'excellent' | 'good' | 'needs-improvement' | 'poor';
          if (accuracy >= 90) masteryLevel = 'excellent';
          else if (accuracy >= 75) masteryLevel = 'good';
          else if (accuracy >= 60) masteryLevel = 'needs-improvement';
          else masteryLevel = 'poor';

          results.push({
            id: kp.id,
            volume: kp.volume,
            unit: kp.unit,
            lesson: kp.lesson,
            section: kp.section,
            topic: kp.topic,
            totalQuestions: stat.totalQuestions,
            correctAnswers: stat.correctAnswers,
            wrongAnswers: stat.wrongAnswers,
            accuracy,
            lastPracticed: stat.lastPracticed,
            masteryLevel
          });
        }
      }
    });
    
    // 按错误率排序（错误率高的在前）
    return results.sort((a, b) => {
      const errorRateA = (a.wrongAnswers || 0) / a.totalQuestions;
      const errorRateB = (b.wrongAnswers || 0) / b.totalQuestions;
      return errorRateB - errorRateA;
    });
  };

  const knowledgePointStats = calculateKnowledgePointStats();

  // 获取薄弱知识点
  const weakKnowledgePoints = knowledgePointStats
    .filter(stat => stat.masteryLevel === 'poor' || stat.masteryLevel === 'needs-improvement')
    .map(stat => stat.id);

  // 获取优势知识点
  const strongKnowledgePoints = knowledgePointStats
    .filter(stat => stat.masteryLevel === 'excellent')
    .length;

  // 计算总体学习统计
  const totalQuestions = knowledgePointStats.reduce((sum, stat) => sum + stat.totalQuestions, 0);
  const totalCorrect = knowledgePointStats.reduce((sum, stat) => sum + stat.correctAnswers, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const practiceCount = subjectHistory.length;

  // 模拟AI回复
  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('薄弱') || message.includes('不会') || message.includes('错题')) {
      if (weakKnowledgePoints.length > 0) {
        const weakTopics = knowledgePointStats
          .filter(stat => weakKnowledgePoints.includes(stat.id))
          .slice(0, 3)
          .map(stat => stat.topic);
        return `根据你的练习数据分析，你在以下知识点还需要加强：${weakTopics.join('、')}。建议你重点复习这些内容，可以通过专项练习来提高掌握程度。`;
      } else {
        return '从你的练习数据来看，各个知识点掌握都不错！继续保持这种学习状态。';
      }
    }
    
    if (message.includes('学习计划') || message.includes('怎么学') || message.includes('建议')) {
      return `基于你当前的学习情况（总体准确率${overallAccuracy}%），我建议：\n1. 继续保持定期练习的习惯\n2. 重点关注准确率较低的知识点\n3. 可以尝试错题重练来巩固薄弱环节\n4. 建议每周至少进行2-3次练习`;
    }
    
    if (message.includes('进步') || message.includes('提高') || message.includes('成绩')) {
      return `你已经完成了${practiceCount}次练习，总体准确率达到${overallAccuracy}%。${strongKnowledgePoints}个知识点掌握优秀！继续努力，相信你会取得更大进步。`;
    }
    
    if (message.includes('时间') || message.includes('多久')) {
      return '建议每次练习控制在15-30分钟，这样既能保持专注度，又不会产生疲劳感。可以根据自己的时间安排，每天或隔天进行一次练习。';
    }
    
    // 默认回复
    return '我理解你的问题。基于你的学习数据，我建议你可以多关注那些准确率较低的知识点，通过针对性练习来提高。如果有具体的学习问题，随时可以问我！';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // 模拟AI思考时间
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMasteryText = (level: string) => {
    switch (level) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'needs-improvement': return '需加强';
      case 'poor': return '较差';
      default: return '未知';
    }
  };

  // Show loading state
  if (knowledgePointsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载分析数据中...</h2>
            <p className="text-gray-600 tracking-wide">正在获取知识点数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={onBack}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回</span>
            </button>
          </div>

          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight tracking-wide">
              {subject.name}知识点分析
            </h1>
            <p className="text-lg text-gray-600 tracking-wide">
              全面分析学习情况，获得个性化学习建议
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* 左侧：学习概览和知识点分析 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 学习概览 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center tracking-wide">
                  <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                  学习概览
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{overallAccuracy}%</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">总体准确率</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/25">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{totalQuestions}</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">练习题目</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{strongKnowledgePoints}</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">优秀知识点</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/25">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{practiceCount}</div>
                    <div className="text-sm text-gray-600 font-medium tracking-wide">练习次数</div>
                  </div>
                </div>
              </div>

              {/* 知识点详细分析 */}
              <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-wide">
                      <BookOpen className="w-6 h-6 text-blue-500 mr-2" />
                      知识点掌握情况
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 ml-8">
                      最近20次练习中的薄弱知识点
                    </p>
                  </div>
                  {weakKnowledgePoints.length > 0 && (
                    <button
                      onClick={() => onEnhancementRound(weakKnowledgePoints)}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      <span className="font-medium tracking-wide">强化薄弱点</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {knowledgePointStats.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">太棒了！</h3>
                      <p className="text-gray-600">最近20次练习中没有错题，继续保持！</p>
                    </div>
                  ) : (
                    knowledgePointStats.map(stat => (
                    <div key={stat.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1 tracking-wide">{stat.topic}</div>
                        <div className="text-sm text-gray-600">
                          {stat.volume} • {stat.unit} • {stat.lesson} • {stat.section}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {stat.totalQuestions > 0 ? (
                            <>
                              练习 {stat.totalQuestions} 题，正确 {stat.correctAnswers} 题
                              {stat.lastPracticed && (
                                <span className="ml-2">• 最后练习：{
                                  stat.lastPracticed instanceof Date 
                                    ? stat.lastPracticed.toLocaleDateString() 
                                    : new Date(stat.lastPracticed).toLocaleDateString()
                                }</span>
                              )}
                            </>
                          ) : (
                            '尚未练习'
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{stat.accuracy}%</div>
                          <div className={`text-xs px-2 py-1 rounded-full font-medium ${getMasteryColor(stat.masteryLevel)}`}>
                            {getMasteryText(stat.masteryLevel)}
                          </div>
                        </div>
                        {stat.totalQuestions > 0 && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">{stat.correctAnswers}</span>
                            <XCircle className="w-4 h-4 text-red-500 ml-2" />
                            <span className="text-sm font-medium text-red-600">{stat.totalQuestions - stat.correctAnswers}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )))}
                  
                </div>
              </div>
            </div>

            {/* 右侧：AI学习助手 */}
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 flex flex-col h-fit lg:sticky lg:top-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-wide">
                  <Brain className="w-6 h-6 text-purple-500 mr-2" />
                  AI学习助手
                </h2>
                <p className="text-sm text-gray-600 mt-2 tracking-wide">
                  基于你的学习数据提供个性化建议
                </p>
              </div>
              
              {/* 聊天消息区域 */}
              <div className="flex-1 p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {chatMessages.map(message => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start space-x-2 max-w-xs ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-blue-500' 
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-line tracking-wide">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-2 max-w-xs">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-3 rounded-2xl bg-gray-100">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 输入区域 */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="问我任何学习相关的问题..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm tracking-wide"
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 快速问题建议 */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    '我的薄弱点是什么？',
                    '如何制定学习计划？',
                    '学习建议'
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors duration-300 tracking-wide"
                      disabled={isTyping}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}