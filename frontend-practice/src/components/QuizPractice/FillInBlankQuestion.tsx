import React, { useState, useEffect, useRef } from 'react';
import { QuizQuestion } from '../../types/quiz';
import { CheckCircle2, XCircle, BookOpen, Brain, Lightbulb, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';
import { KnowledgePointDisplay } from './KnowledgePointDisplay';
import { preferencesService } from '../../services/preferencesService';

interface FillInBlankQuestionProps {
  question: QuizQuestion;
  answers: string[];
  showHints: boolean;
  showResult: boolean;
  isAnswerCorrect: () => boolean;
  sessionId?: string;
  userGaveUp?: boolean;
  onAnswerChange: (index: number, value: string) => void;
  onToggleHints: () => void;
  onAiApproved?: (userAnswer: string) => void;
  renderQuestionWithBlanks: (text: string) => React.ReactNode;
}

export const FillInBlankQuestion: React.FC<FillInBlankQuestionProps> = ({
  question,
  answers,
  showHints,
  showResult,
  isAnswerCorrect,
  sessionId,
  userGaveUp = false,
  onAnswerChange,
  onToggleHints,
  onAiApproved,
  renderQuestionWithBlanks
}) => {
  const blanksCount = (question.question.match(/____/g) || []).length;
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingPreference, setIsLoadingPreference] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging for hints
  React.useEffect(() => {
    if (question.hints) {
      console.log('Fill-in-blank question hints:', question.hints);
    }
  }, [question]);

  // Load hint preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const preference = await preferencesService.getHintPreference();
        if (preference === true && !showHints) {
          // Auto-show hints if user preference is set
          onToggleHints();
        }
      } catch (error) {
        console.error('Failed to load hint preference:', error);
      } finally {
        setIsLoadingPreference(false);
      }
    };
    loadPreference();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [aiEvaluation, setAiEvaluation] = useState<{
    isCorrect: boolean;
    reasoning: string;
    message?: string;
    loading: boolean;
  } | null>(null);

  // Handle setting preference to always show
  const handleAlwaysShow = async () => {
    try {
      await preferencesService.setHintPreference(true);
      if (!showHints) {
        onToggleHints();
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to save hint preference:', error);
    }
  };

  // Handle setting preference to never show
  const handleNeverShow = async () => {
    try {
      await preferencesService.setHintPreference(false);
      if (showHints) {
        onToggleHints();
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to save hint preference:', error);
    }
  };

  // Toggle hints with dropdown
  const handleToggleHints = () => {
    onToggleHints();
    setShowDropdown(true);
  };

  const handleAiReevaluation = async () => {
    if (!sessionId || !question.id) {
      console.error('Missing sessionId or questionId for AI re-evaluation');
      return;
    }

    setAiEvaluation({ isCorrect: false, reasoning: '', loading: true });

    try {
      // Join answers with ||| for multiple blanks
      const userAnswer = answers.join('|||');

      const response = await api.practice.aiReevaluateAnswer(
        sessionId,
        question.id,
        userAnswer
      );

      if (response.success && response.data) {
        setAiEvaluation({
          isCorrect: response.data.isCorrect,
          reasoning: response.data.reasoning,
          message: response.data.message,
          loading: false
        });

        // If AI approved the answer, notify parent to update alternative answers
        if (response.data.isCorrect && onAiApproved) {
          onAiApproved(userAnswer);
        }
      } else {
        setAiEvaluation({
          isCorrect: false,
          reasoning: response.error || 'AI评估失败，请稍后再试',
          loading: false
        });
      }
    } catch (error) {
      console.error('AI re-evaluation failed:', error);
      setAiEvaluation({
        isCorrect: false,
        reasoning: 'AI评估失败，请稍后再试',
        loading: false
      });
    }
  };

  return (
    <div className="mb-6">
      {/* Hint toggle button for fill-in-blank questions */}
      {question.hints && question.hints.length > 0 && question.hints.some(h => h !== null) && (
        <div className="mb-3 flex justify-end relative" ref={dropdownRef}>
          <button
            onClick={handleToggleHints}
            disabled={isLoadingPreference}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
              showHints
                ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : 'text-white bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 animate-pulse'
            } ${isLoadingPreference ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Lightbulb className={`w-5 h-5 ${showHints ? 'fill-current' : 'fill-current animate-bounce'}`} />
            <span className="text-base">{showHints ? '隐藏提示' : '显示提示'}</span>
            <span className="text-sm opacity-90">({question.hints.filter(h => h !== null).length})</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
              <button
                onClick={handleAlwaysShow}
                className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 text-gray-700 hover:text-blue-700"
              >
                <Lightbulb className="w-4 h-4" />
                <span>以后都显示</span>
              </button>
              <button
                onClick={handleNeverShow}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 hover:text-gray-900 border-t border-gray-100"
              >
                <XCircle className="w-4 h-4" />
                <span>以后都不显示</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {renderQuestionWithBlanks(question.question)}
      
      {question.images && question.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {question.images.map((url, index) => (
            <img key={index} src={url} alt={`图片 ${index + 1}`} className="max-w-sm rounded-lg shadow-md" />
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
        <span className="font-medium">提示：</span>
        {(() => {
          if (blanksCount === 0) {
            return "请在输入框中填写答案，填写后按 Enter 键提交";
          } else if (blanksCount > 1) {
            return "使用 Tab 键在空格之间切换，Shift+Tab 返回上一个空格。填写至少一个空格后按 Enter 键提交答案";
          } else {
            return "填写空格后按 Enter 键提交答案";
          }
        })()}
      </div>
      
      {/* Show result after submission */}
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg ${isAnswerCorrect() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center mb-2">
            {isAnswerCorrect() ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-semibold text-green-800">回答正确！</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-semibold text-red-800">回答错误</span>
              </>
            )}
          </div>
          
          {/* Show answer comparison */}
          {!isAnswerCorrect() && (
            <div className="mt-3">
              {/* AI Re-evaluation button - only show if user actually attempted (didn't give up) and provided some answer */}
              {sessionId && !aiEvaluation && !userGaveUp && answers.some(a => a && a.trim()) && (
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={handleAiReevaluation}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    让AI重新评估我的答案
                  </button>
                </div>
              )}
              
              {/* AI Evaluation Result */}
              {aiEvaluation && (
                <div className={`mb-3 p-4 rounded-lg ${
                  aiEvaluation.loading ? 'bg-gray-50 border border-gray-200' :
                  aiEvaluation.isCorrect ? 'bg-green-50 border border-green-200' : 
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  {aiEvaluation.loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-gray-600">AI正在评估您的答案...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center mb-2">
                        <Brain className={`w-5 h-5 mr-2 ${
                          aiEvaluation.isCorrect ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                        <span className={`font-semibold ${
                          aiEvaluation.isCorrect ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          AI评估结果: {aiEvaluation.isCorrect ? '答案可接受' : '答案仍需改进'}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        aiEvaluation.isCorrect ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {aiEvaluation.reasoning}
                      </p>
                      {aiEvaluation.message && (
                        <p className="text-xs mt-2 text-gray-600 italic">
                          💡 {aiEvaluation.message}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                {(() => {
                  // Extract order-independent-groups
                  const orderIndependentGroups = question.extra_properties?.['order-independent-groups'] as number[][] | undefined;

                  // Helper: find which group a position belongs to
                  const findGroup = (position: number): number | null => {
                    if (!orderIndependentGroups) return null;
                    const groupIndex = orderIndependentGroups.findIndex(group => group.includes(position));
                    return groupIndex >= 0 ? groupIndex : null;
                  };

                  // Helper: get group color
                  const getGroupColor = (groupIndex: number): string => {
                    const colors = ['bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200', 'bg-green-50 border-green-200', 'bg-yellow-50 border-yellow-200'];
                    return colors[groupIndex % colors.length];
                  };

                  return Array.isArray(question.answer) ? (
                    <>
                      {question.answer.map((correctAns, idx) => {
                        const groupIndex = findGroup(idx);
                        const hasGroup = groupIndex !== null;
                        const groupColor = hasGroup ? getGroupColor(groupIndex) : 'border-gray-200';

                        return (
                          <div key={idx} className={`bg-white rounded-lg p-3 border ${groupColor}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-gray-500">空格 {idx + 1}</div>
                              {hasGroup && (
                                <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                  <span>⇄</span>
                                  <span>可互换 (组 {groupIndex! + 1})</span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-1">你的答案</div>
                                <div className={`font-medium ${answers[idx] ? 'text-red-600' : 'text-gray-400'}`}>
                                  {answers[idx] || '(未填写)'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-1">正确答案</div>
                                <div className="font-medium text-green-600">
                                  {correctAns}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {orderIndependentGroups && orderIndependentGroups.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-800 mb-1">💡 提示</div>
                          <div className="text-xs text-blue-700">
                            标有 <span className="font-medium">⇄ 可互换</span> 的空格可以任意调换顺序，只要答案正确即可。
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">你的答案</div>
                        <div className={`font-medium ${answers[0] ? 'text-red-600' : 'text-gray-400'}`}>
                          {answers[0] || '(未填写)'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">正确答案</div>
                        <div className="font-medium text-green-600">
                          {question.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* Show explanation if available */}
          {!isAnswerCorrect() && question.explanation && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">💡 题目解析</span>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* 知识点 - 仅在答错时显示 */}
      {showResult && !isAnswerCorrect() && <KnowledgePointDisplay question={question} />}
    </div>
  );
};