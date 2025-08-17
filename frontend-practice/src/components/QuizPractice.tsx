import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, RotateCcw, BookOpen, Brain, Sparkles, MessageSquare, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Subject, QuizQuestion, PracticeSession, AIEvaluation } from '../types/quiz';
import { usePracticeSession, useKnowledgePoints } from '../hooks/useApi';

interface QuizConfig {
  questionType: 'new' | 'with-wrong' | 'wrong-only';
  questionCount: 'unlimited' | number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  showExplanation: boolean;
}

interface QuizPracticeProps {
  subject: Subject;
  selectedKnowledgePoints: string[];
  config: QuizConfig;
  onEndPractice: (session: PracticeSession) => void;
  onBack: () => void;
}

export default function QuizPractice({ 
  subject, 
  selectedKnowledgePoints, 
  config,
  onEndPractice, 
  onBack 
}: QuizPracticeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<string[]>([]);
  const [essayAnswer, setEssayAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(string | string[] | null)[]>([]);
  const [questionStartTimes, setQuestionStartTimes] = useState<Date[]>([]);
  const [questionDurations, setQuestionDurations] = useState<number[]>([]);
  const [localSessionId] = useState(() => Date.now().toString());
  const [startTime] = useState(() => new Date());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showStandardAnswer, setShowStandardAnswer] = useState(false);
  
  // 语音输入相关状态
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Function to parse and render question text with images
  const renderQuestionWithImages = (questionText: string, imageUrls?: string[]) => {
    // Pattern to match {{image:uuid}} or {{img:N}} placeholders
    const imagePattern = /\{\{(?:image|img):([a-f0-9-]+|\d+)\}\}/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = imagePattern.exec(questionText)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {questionText.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Determine image URL
      const imageRef = match[1];
      let imageUrl = '';
      
      // Check if it's a number (index) and we have imageUrls array
      if (/^\d+$/.test(imageRef) && imageUrls && imageUrls.length > 0) {
        const index = parseInt(imageRef, 10);
        if (index < imageUrls.length) {
          imageUrl = imageUrls[index];
        }
      } else {
        // It's a UUID, but we don't have the proper path structure
        // For now, we'll show a placeholder message
        imageUrl = '';
      }
      
      if (imageUrl) {
        // Ensure the URL is absolute
        const absoluteUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `http://localhost:8718${imageUrl}`;
        
        parts.push(
          <div key={`img-${imageRef}`} className="my-4">
            <img 
              src={absoluteUrl}
              alt="题目图片"
              className="max-w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.insertAdjacentHTML('afterbegin', 
                  `<div class="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                    <p class="font-medium">图片暂时无法显示</p>
                    <p class="text-sm mt-1">图片引用: ${imageRef}</p>
                  </div>`
                );
              }}
            />
          </div>
        );
      } else {
        // No valid URL, show placeholder
        parts.push(
          <div key={`img-${imageRef}`} className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 font-medium">📷 此处应有图片</p>
            <p className="text-amber-600 text-sm mt-1">
              图片标识: {imageRef}
            </p>
            <p className="text-amber-600 text-xs mt-2">
              提示: 图片可能尚未上传或路径配置有误
            </p>
          </div>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < questionText.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {questionText.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? <>{parts}</> : questionText;
  };

  // 使用Practice Session Hook获取题目数据
  // Memoize config to prevent infinite re-renders
  const practiceConfig = useMemo(() => 
    selectedKnowledgePoints.length > 0 ? {
      knowledge_point_ids: selectedKnowledgePoints,
      question_count: typeof config.questionCount === 'number' ? config.questionCount : 20,
      time_limit_minutes: config.timeLimit,
      strategy: 'random',
      shuffle_questions: config.shuffleQuestions,
      shuffle_options: true,
      allow_review: true,
      show_answer_immediately: config.showExplanation
    } : null,
    [selectedKnowledgePoints, config.questionCount, config.timeLimit, 
     config.shuffleQuestions, config.showExplanation]
  );

  const { 
    session, 
    questions: sessionQuestions, 
    loading: questionsLoading, 
    error: questionsError,
    sessionId,
    submitAnswer: submitSessionAnswer,
    completeSession
  } = usePracticeSession(practiceConfig);
  const { data: knowledgePointsData } = useKnowledgePoints(subject.id);

  useEffect(() => {
    // 检查浏览器是否支持语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setEssayAnswer(prev => prev + finalTranscript);
          setVoiceTranscript('');
        } else {
          setVoiceTranscript(interimTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        setIsListening(false);
        setVoiceTranscript('');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setVoiceTranscript('');
      };
    }
  }, []);

  // Convert session questions to frontend format
  const convertSessionQuestion = (sessionQuestion: any): QuizQuestion => {
    // Parse options if they exist
    let options: QuizQuestion['options'] | undefined;
    if (sessionQuestion.options && Array.isArray(sessionQuestion.options)) {
      // Convert array to object with A, B, C, D keys
      options = {};
      const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
      sessionQuestion.options.forEach((option: string, index: number) => {
        if (index < keys.length && options) {
          options[keys[index]] = option;
        }
      });
    }

    // Determine quiz type and answer format
    let type: QuizQuestion['type'] = 'single-choice';
    let answer: string | string[] | undefined;
    
    if (sessionQuestion.correct_answer) {
      if (Array.isArray(sessionQuestion.correct_answer)) {
        type = 'multiple-choice';
        answer = sessionQuestion.correct_answer;
      } else if (typeof sessionQuestion.correct_answer === 'string') {
        if (options) {
          type = 'single-choice';
          answer = sessionQuestion.correct_answer;
        } else {
          type = 'essay';
          answer = sessionQuestion.correct_answer;
        }
      }
    }

    return {
      id: sessionQuestion.quiz_id || sessionQuestion.id,
      type,
      question: sessionQuestion.question,
      options,
      answer,
      images: sessionQuestion.images || [],
      standardAnswer: type === 'essay' ? sessionQuestion.correct_answer : undefined,
      relatedKnowledgePointId: sessionQuestion.knowledge_point_id,
    };
  };

  useEffect(() => {
    if (sessionQuestions && sessionQuestions.length > 0) {
      console.log('🔄 [DEBUG] Converting session questions to frontend format:', sessionQuestions);
      
      const convertedQuestions = sessionQuestions.map(convertSessionQuestion);
      console.log('✅ [DEBUG] Converted questions:', convertedQuestions);
      
      setQuestions(convertedQuestions);
      setAnswers(new Array(convertedQuestions.length).fill(null));
      setQuestionStartTimes(new Array(convertedQuestions.length).fill(null));
      setQuestionDurations(new Array(convertedQuestions.length).fill(0));
    }
  }, [sessionQuestions]);

  // 记录当前题目开始时间
  useEffect(() => {
    if (questions.length > 0 && !questionStartTimes[currentQuestionIndex]) {
      const newStartTimes = [...questionStartTimes];
      newStartTimes[currentQuestionIndex] = new Date();
      setQuestionStartTimes(newStartTimes);
    }
  }, [currentQuestionIndex, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isSingleChoice = currentQuestion?.type === 'single-choice';
  const isMultipleChoice = currentQuestion?.type === 'multiple-choice';
  const isEssay = currentQuestion?.type === 'essay';

  // 计算当前题目用时
  const calculateQuestionDuration = () => {
    if (questionStartTimes[currentQuestionIndex]) {
      return Math.round((new Date().getTime() - questionStartTimes[currentQuestionIndex].getTime()) / 1000);
    }
    return 0;
  };

  const handleSingleChoiceSelect = async (answer: string) => {
    // 记录答题用时
    const duration = calculateQuestionDuration();
    const newDurations = [...questionDurations];
    newDurations[currentQuestionIndex] = duration;
    setQuestionDurations(newDurations);
    
    setSelectedAnswer(answer);
    // 单选题点击后直接显示答案
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    
    // Submit answer to practice session API if available
    if (sessionId && submitSessionAnswer && sessionQuestions && sessionQuestions[currentQuestionIndex]) {
      try {
        const questionId = sessionQuestions[currentQuestionIndex].id;
        console.log('📝 [DEBUG] Submitting single choice answer to session:', sessionId, questionId, answer, duration);
        await submitSessionAnswer(questionId, answer, duration);
      } catch (error) {
        console.error('❌ [DEBUG] Failed to submit single choice answer to session:', error);
        // Continue with local handling even if API submission fails
      }
    }
    
    setShowResult(true);
    setShowStandardAnswer(true);
  };

  const handleMultipleChoiceToggle = (option: string) => {
    setSelectedMultipleAnswers(prev => {
      if (prev.includes(option)) {
        return prev.filter(o => o !== option);
      } else {
        return [...prev, option].sort();
      }
    });
  };

  const handleEssayChange = (value: string) => {
    setEssayAnswer(value);
  };

  // 语音输入控制
  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert('您的浏览器不支持语音输入功能，请使用Chrome或Edge浏览器');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // 朗读题目
  const readQuestion = () => {
    if ('speechSynthesis' in window && currentQuestion) {
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // 模拟AI评价生成 - 更加针对性的评价
  const generateAIEvaluation = async (userAnswer: string, question: QuizQuestion): Promise<AIEvaluation> => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const standardAnswer = question.standardAnswer || '';
    const standardStructure = question.standardStructure || '';
    const criteria = question.evaluationCriteria || {};
    
    // 分析用户答案的特点
    const answerLength = userAnswer.length;
    const hasStructuredThinking = userAnswer.includes('1.') || userAnswer.includes('首先') || userAnswer.includes('其次');
    const hasExamples = userAnswer.includes('如') || userAnswer.includes('例如') || userAnswer.includes('比如');
    const hasKeyTerms = standardAnswer.split('').some(char => userAnswer.includes(char));
    
    // 基础评分逻辑
    let baseScore = 5; // 基础分5分
    if (answerLength > 100) baseScore += 1;
    if (answerLength > 200) baseScore += 1;
    if (hasStructuredThinking) baseScore += 1;
    if (hasExamples) baseScore += 1;
    if (hasKeyTerms) baseScore += 1;
    
    const finalScore = Math.min(10, Math.max(3, baseScore + Math.random() * 2 - 1));

    // 生成针对性的对比分析
    const comparison = generateComparison(userAnswer, standardAnswer, standardStructure, finalScore);
    
    // 生成各维度评分和分析
    const criteriaScores: { [key: string]: { score: number; analysis: string } } = {};
    Object.entries(criteria).forEach(([key, description]) => {
      const dimensionScore = Math.max(3, Math.min(10, finalScore + Math.random() * 2 - 1));
      criteriaScores[key] = {
        score: Math.round(dimensionScore),
        analysis: generateDimensionAnalysis(key, userAnswer, standardAnswer, dimensionScore)
      };
    });

    // 生成改进建议
    const improvementSuggestions = generateImprovementSuggestions(userAnswer, standardAnswer, finalScore);

    return {
      overallScore: Math.round(finalScore),
      comparison,
      criteriaScores,
      improvementSuggestions
    };
  };

  // 生成针对性对比分析
  const generateComparison = (userAnswer: string, standardAnswer: string, standardStructure: string, score: number): string => {
    if (score >= 8) {
      return `您的答案与标准答案在核心要点上高度吻合。${standardStructure ? `在逻辑结构方面，您的回答${userAnswer.includes('1.') || userAnswer.includes('首先') ? '体现了清晰的层次性，' : ''}与标准答案的逻辑框架基本一致。` : ''}建议在细节描述上进一步完善，使表达更加精确。`;
    } else if (score >= 6) {
      return `您的答案涵盖了标准答案的主要内容，但在完整性和深度上还有提升空间。${standardStructure ? `标准答案采用了系统性的分析框架，建议您在答题时也要注意逻辑层次的构建。` : ''}重点关注知识点之间的内在联系。`;
    } else {
      return `您的答案与标准答案存在较大差距。${standardStructure ? `标准答案的逻辑框架是：${standardStructure.split('\n')[0]}，建议您重新梳理答题思路。` : ''}建议系统复习相关知识点，理解基本概念后再进行练习。`;
    }
  };

  // 生成维度分析
  const generateDimensionAnalysis = (dimension: string, userAnswer: string, standardAnswer: string, score: number): string => {
    const analysisMap: { [key: string]: (userAnswer: string, score: number) => string } = {
      '结构描述': (answer, score) => {
        if (score >= 8) return '您准确描述了主要结构组成，体现了扎实的基础知识。';
        if (score >= 6) return '基本结构要点已涵盖，但部分细节描述可以更加精确。';
        return '结构描述不够完整，建议重点复习相关章节的基础概念。';
      },
      '功能分析': (answer, score) => {
        if (score >= 8) return '功能分析准确到位，体现了良好的生物学思维。';
        if (score >= 6) return '主要功能已提及，但功能机制的阐述可以更深入。';
        return '功能分析较为表面，需要加强对生物学原理的理解。';
      },
      '逻辑条理': (answer, score) => {
        const hasStructure = answer.includes('1.') || answer.includes('首先') || answer.includes('其次');
        if (score >= 8) return hasStructure ? '逻辑层次清晰，条理性强，体现了良好的科学思维。' : '内容逻辑合理，建议使用序号等方式使结构更加清晰。';
        if (score >= 6) return '基本逻辑清楚，但层次性有待加强。';
        return '逻辑条理需要改进，建议先列提纲再组织答案。';
      },
      '知识运用': (answer, score) => {
        if (score >= 8) return '知识运用恰当，体现了理论与实际的有机结合。';
        if (score >= 6) return '知识点掌握基本到位，但运用的灵活性有待提高。';
        return '知识运用不够准确，需要加强基础知识的学习。';
      }
    };

    return analysisMap[dimension]?.(userAnswer, score) || `在${dimension}方面${score >= 7 ? '表现良好' : score >= 5 ? '基本达标' : '需要加强'}。`;
  };

  // 生成改进建议
  const generateImprovementSuggestions = (userAnswer: string, standardAnswer: string, score: number): string[] => {
    const suggestions: string[] = [];
    
    if (userAnswer.length < 150) {
      suggestions.push('答案内容可以更加充实，建议增加具体的例子和详细说明');
    }
    
    if (!userAnswer.includes('1.') && !userAnswer.includes('首先') && !userAnswer.includes('其次')) {
      suggestions.push('建议使用序号或逻辑词汇组织答案，使结构更加清晰');
    }
    
    if (score < 7) {
      suggestions.push('重点复习相关章节的基础概念，加深对知识点的理解');
    }
    
    if (!userAnswer.includes('如') && !userAnswer.includes('例如')) {
      suggestions.push('可以结合具体实例进行说明，使答案更加生动具体');
    }
    
    if (score >= 7) {
      suggestions.push('继续保持良好的答题思路，可以尝试从更多角度分析问题');
    }
    
    return suggestions;
  };

  const handleSubmitAnswer = async () => {
    // 记录答题用时
    const duration = calculateQuestionDuration();
    const newDurations = [...questionDurations];
    newDurations[currentQuestionIndex] = duration;
    setQuestionDurations(newDurations);
    
    let currentAnswer: string | string[] | null = null;
    
    if (isMultipleChoice) {
      currentAnswer = selectedMultipleAnswers;
    } else if (isEssay) {
      currentAnswer = essayAnswer;
    }
    
    if (currentAnswer !== null && (
      (Array.isArray(currentAnswer) && currentAnswer.length > 0) ||
      (typeof currentAnswer === 'string' && currentAnswer.trim() !== '')
    )) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);
      
      // Submit answer to practice session API if available
      if (sessionId && submitSessionAnswer && sessionQuestions && sessionQuestions[currentQuestionIndex]) {
        try {
          const questionId = sessionQuestions[currentQuestionIndex].id;
          const answerString = Array.isArray(currentAnswer) ? currentAnswer.join(',') : currentAnswer;
          
          console.log('📝 [DEBUG] Submitting answer to session:', sessionId, questionId, answerString, duration);
          await submitSessionAnswer(questionId, answerString, duration);
        } catch (error) {
          console.error('❌ [DEBUG] Failed to submit answer to session:', error);
          // Continue with local handling even if API submission fails
        }
      }
      
      // 立即显示标准答案
      setShowStandardAnswer(true);
      setShowResult(true);
      
      // 如果是问答题，异步生成AI评价
      if (isEssay && currentQuestion && typeof currentAnswer === 'string') {
        setIsEvaluating(true);
        try {
          const evaluation = await generateAIEvaluation(currentAnswer, currentQuestion);
          setAiEvaluation(evaluation);
        } catch (error) {
          console.error('AI评价生成失败:', error);
        } finally {
          setIsEvaluating(false);
        }
      }
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleEndPractice();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setSelectedMultipleAnswers([]);
      setEssayAnswer('');
      setShowResult(false);
      setShowStandardAnswer(false);
      setAiEvaluation(null);
      setVoiceTranscript('');
    }
  };

  const handleEndPractice = async () => {
    // 确保最后一题的用时被记录
    if (!questionDurations[currentQuestionIndex] && questionStartTimes[currentQuestionIndex]) {
      const duration = calculateQuestionDuration();
      const newDurations = [...questionDurations];
      newDurations[currentQuestionIndex] = duration;
      setQuestionDurations(newDurations);
    }
    
    // Complete the session via the API if we have an active session
    if (sessionId && completeSession) {
      try {
        console.log('🏁 [DEBUG] Completing practice session:', sessionId);
        await completeSession();
      } catch (error) {
        console.error('❌ [DEBUG] Failed to complete session:', error);
      }
    }
    
    const session: PracticeSession = {
      id: sessionId || localSessionId,
      subjectId: subject.id,
      knowledgePoints: selectedKnowledgePoints,
      questions: questions,
      answers: answers,
      questionDurations: questionDurations,
      startTime: startTime,
      endTime: new Date(),
      completed: isLastQuestion
    };
    onEndPractice(session);
  };

  // 判断选择题是否正确
  const isChoiceCorrect = () => {
    if (isSingleChoice) {
      return selectedAnswer === currentQuestion?.answer;
    } else if (isMultipleChoice && Array.isArray(currentQuestion?.answer)) {
      const correctAnswers = currentQuestion.answer.sort();
      const userAnswers = selectedMultipleAnswers.sort();
      return JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);
    }
    return false;
  };

  // 加载状态
  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载题目中...</h2>
            <p className="text-gray-600 tracking-wide">正在获取练习题目</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (questionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-wide">加载失败</h2>
            <p className="text-gray-600 mb-6 tracking-wide">{questionsError}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              返回配置
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-100/80 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-wide">暂无题目</h2>
            <p className="text-gray-600 mb-6 tracking-wide">
              根据当前配置，所选知识点暂无可用题目。
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              返回配置
            </button>
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="group flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 ease-out bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/90 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium tracking-wide">返回配置</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg font-medium tracking-wide">
                第 {currentQuestionIndex + 1} 题，共 {questions.length} 题
              </div>
              <div className="text-sm text-gray-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg font-medium tracking-wide">
                {isSingleChoice ? '单选题' : isMultipleChoice ? '多选题' : '问答题'}
              </div>
              {isEssay && (
                <button
                  onClick={readQuestion}
                  className="p-2 text-gray-600 hover:text-blue-600 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  title="朗读题目"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleEndPractice}
                className="px-4 py-2 text-sm bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm text-gray-700 hover:text-gray-900 rounded-xl hover:bg-white/90 transition-all duration-300 ease-out shadow-lg hover:shadow-xl font-medium tracking-wide focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
              >
                结束练习
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mb-8 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium tracking-wide">
              <span>进度</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-tight tracking-wide">
              {renderQuestionWithImages(currentQuestion.question, currentQuestion.images)}
            </h2>

            {/* 单选题选项 */}
            {isSingleChoice && currentQuestion.options && (
              <div className="space-y-4 mb-8">
                {Object.entries(currentQuestion.options).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => !showResult && handleSingleChoiceSelect(key)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ease-out ${
                      showResult
                        ? key === currentQuestion.answer
                          ? 'border-green-500 bg-green-50 text-green-800 shadow-lg shadow-green-500/25'
                          : key === selectedAnswer && key !== currentQuestion.answer
                          ? 'border-red-500 bg-red-50 text-red-800 shadow-lg shadow-red-500/25'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                        : selectedAnswer === key
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-lg shadow-blue-500/25'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium tracking-wide">{key}. {option}</span>
                      {showResult && key === currentQuestion.answer && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {showResult && key === selectedAnswer && key !== currentQuestion.answer && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 多选题选项 */}
            {isMultipleChoice && currentQuestion.options && (
              <div className="space-y-4 mb-8">
                <div className="text-sm text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <span className="font-medium text-yellow-800">多选题提示：</span>
                  <span className="text-yellow-700">请选择所有正确答案，可以选择多个选项</span>
                </div>
                {Object.entries(currentQuestion.options).map(([key, option]) => {
                  const isSelected = selectedMultipleAnswers.includes(key);
                  const isCorrect = Array.isArray(currentQuestion.answer) && currentQuestion.answer.includes(key);
                  const shouldShowCorrect = showResult && isCorrect;
                  const shouldShowWrong = showResult && isSelected && !isCorrect;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => !showResult && handleMultipleChoiceToggle(key)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ease-out ${
                        shouldShowCorrect
                          ? 'border-green-500 bg-green-50 text-green-800 shadow-lg shadow-green-500/25'
                          : shouldShowWrong
                          ? 'border-red-500 bg-red-50 text-red-800 shadow-lg shadow-red-500/25'
                          : showResult
                          ? 'border-gray-200 bg-gray-50 text-gray-500'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-lg shadow-blue-500/25'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-medium tracking-wide">{key}. {option}</span>
                        </div>
                        {shouldShowCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {shouldShowWrong && (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 问答题输入框 */}
            {isEssay && (
              <div className="mb-8">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 tracking-wide">
                      请在下方输入您的答案：
                    </label>
                    {speechSupported && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleVoiceInput}
                          disabled={showResult}
                          className={`flex items-center px-3 py-1 rounded-lg text-sm transition-all duration-300 ease-out ${
                            isListening
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          } ${showResult ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'}`}
                          title={isListening ? '停止语音输入' : '开始语音输入'}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="w-4 h-4 mr-1" />
                              停止录音
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4 mr-1" />
                              语音输入
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={essayAnswer}
                      onChange={(e) => handleEssayChange(e.target.value)}
                      disabled={showResult}
                      placeholder="请详细回答问题，注意逻辑清晰、层次分明..."
                      className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
                    />
                    
                    {/* 语音输入实时显示 */}
                    {voiceTranscript && (
                      <div className="absolute bottom-2 left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-sm text-blue-800">正在识别：{voiceTranscript}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="tracking-wide">
                    建议字数：200-500字 | 当前字数：{essayAnswer.length}字
                  </div>
                  {isListening && (
                    <div className="flex items-center text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      正在录音...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 标准答案显示 - 立即显示 */}
            {showStandardAnswer && isEssay && currentQuestion.standardAnswer && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-bold text-blue-900 tracking-wide">标准答案</h4>
                </div>
                <div className="text-blue-800 whitespace-pre-line leading-relaxed tracking-wide">
                  {currentQuestion.standardAnswer}
                </div>
                {currentQuestion.standardStructure && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2 tracking-wide">答题思路分析：</h5>
                    <div className="text-sm text-blue-700 whitespace-pre-line tracking-wide">
                      {currentQuestion.standardStructure}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 选择题结果显示 */}
            {showResult && (isSingleChoice || isMultipleChoice) && config.showExplanation && (
              <div className={`p-6 rounded-xl mb-6 border ${
                isChoiceCorrect() 
                  ? 'bg-green-50 border-green-200 shadow-lg shadow-green-500/25' 
                  : 'bg-red-50 border-red-200 shadow-lg shadow-red-500/25'
              }`}>
                <div className="flex items-center mb-3">
                  {isChoiceCorrect() ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mr-2" />
                  )}
                  <span className={`font-bold text-lg tracking-wide ${
                    isChoiceCorrect() ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isChoiceCorrect() ? '回答正确！' : '回答错误'}
                  </span>
                </div>
                <p className={`mb-3 tracking-wide ${isChoiceCorrect() ? 'text-green-700' : 'text-red-700'}`}>
                  正确答案是：{Array.isArray(currentQuestion.answer) 
                    ? currentQuestion.answer.join('、') 
                    : currentQuestion.answer}
                </p>
                
                {/* 相关知识点信息 */}
                {showResult && knowledgePointsData && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    isChoiceCorrect() 
                      ? 'bg-green-100/50 border-green-300' 
                      : 'bg-red-100/50 border-red-300'
                  }`}>
                    {(() => {
                      const relatedKnowledgePoint = knowledgePointsData.find(kp => kp.id === currentQuestion.relatedKnowledgePointId);
                      if (!relatedKnowledgePoint) return null;
                      
                      return (
                        <>
                    <div className="flex items-center mb-2">
                      <BookOpen className={`w-5 h-5 mr-2 ${
                        isChoiceCorrect() ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <span className={`font-semibold tracking-wide ${
                        isChoiceCorrect() ? 'text-green-800' : 'text-red-800'
                      }`}>
                        相关知识点
                      </span>
                    </div>
                    <div className={`text-sm tracking-wide ${
                      isChoiceCorrect() ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <div className="space-y-1">
                        <div><span className="font-medium">册次：</span>{relatedKnowledgePoint.volume}</div>
                        <div><span className="font-medium">单元：</span>{relatedKnowledgePoint.unit}</div>
                        <div><span className="font-medium">课程：</span>{relatedKnowledgePoint.lesson}</div>
                        <div><span className="font-medium">知识点：</span>{relatedKnowledgePoint.topic}</div>
                      </div>
                    </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* 问答题AI评价显示 - 渐进式加载 */}
            {showResult && isEssay && (
              <div className="mb-6">
                {isEvaluating ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        <span className="text-purple-800 font-medium tracking-wide">AI正在分析您的答案...</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-center text-sm text-purple-600">
                      <div>🔍 分析答题逻辑和知识点掌握情况</div>
                      <div>📊 对比标准答案结构和内容</div>
                      <div>💡 生成个性化学习建议</div>
                    </div>
                  </div>
                ) : aiEvaluation ? (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <Brain className="w-6 h-6 text-purple-600 mr-2" />
                        <span className="font-bold text-lg text-purple-900 tracking-wide">AI智能评价</span>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-600">{aiEvaluation.overallScore}</div>
                        <div className="text-sm text-purple-600">总分 10分</div>
                      </div>
                    </div>

                    {/* 对比分析 */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-purple-800 mb-3 flex items-center tracking-wide">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        与标准答案对比分析
                      </h4>
                      <div className="bg-white/70 rounded-lg p-4">
                        <p className="text-purple-700 leading-relaxed tracking-wide">
                          {aiEvaluation.comparison}
                        </p>
                      </div>
                    </div>

                    {/* 各维度评分 */}
                    {Object.keys(aiEvaluation.criteriaScores).length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-purple-800 mb-3 tracking-wide">各维度评分 (10分制)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(aiEvaluation.criteriaScores).map(([key, criteria]) => (
                            <div key={key} className="bg-white/70 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-800 tracking-wide">{key}</span>
                                <span className="text-lg font-bold text-purple-600">{criteria.score}分</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed tracking-wide">{criteria.analysis}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 改进建议 */}
                    {aiEvaluation.improvementSuggestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-3 flex items-center tracking-wide">
                          <Sparkles className="w-4 h-4 mr-1" />
                          改进建议
                        </h4>
                        <div className="space-y-2">
                          {aiEvaluation.improvementSuggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start bg-white/70 rounded-lg p-3">
                              <span className="w-5 h-5 bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-sm text-purple-700 tracking-wide">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex justify-between">
              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={
                    (isMultipleChoice && selectedMultipleAnswers.length === 0) || 
                    (isEssay && essayAnswer.trim() === '') ||
                    isEvaluating
                  }
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-out tracking-wide ${
                    ((isMultipleChoice && selectedMultipleAnswers.length > 0) || (isEssay && essayAnswer.trim() !== '')) && !isEvaluating
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isEvaluating ? '评价中...' : '提交答案'}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={isEvaluating}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 ease-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  {isLastQuestion ? (
                    <>
                      <RotateCcw className="w-5 h-5 mr-2" />
                      完成练习
                    </>
                  ) : (
                    <>
                      下一题
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}