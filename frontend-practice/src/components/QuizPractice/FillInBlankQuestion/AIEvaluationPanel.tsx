import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { api } from '../../../services/api';

interface AIEvaluationPanelProps {
  questionId: string;
  sessionId?: string;
  answers: string[];
  showResult: boolean;
  userGaveUp: boolean;
  isAnswerCorrect: boolean;
  onAiApproved?: (userAnswer: string) => void;
}

export const AIEvaluationPanel: React.FC<AIEvaluationPanelProps> = ({
  questionId,
  sessionId,
  answers,
  showResult,
  userGaveUp,
  isAnswerCorrect,
  onAiApproved,
}) => {
  const [aiEvaluation, setAiEvaluation] = useState<{
    isCorrect: boolean;
    reasoning: string;
    message?: string;
    loading: boolean;
  } | null>(null);

  // Reset AI evaluation when question changes
  useEffect(() => {
    setAiEvaluation(null);
  }, [questionId]);

  const handleAiReevaluation = async () => {
    if (!sessionId || !questionId) {
      console.error('Missing sessionId or questionId for AI re-evaluation');
      return;
    }

    setAiEvaluation({ isCorrect: false, reasoning: '', loading: true });

    try {
      // Join answers with ||| for multiple blanks
      const userAnswer = answers.join('|||');

      const response = await api.practice.aiReevaluateAnswer(
        sessionId,
        questionId,
        userAnswer
      );

      if (response.success && response.data) {
        setAiEvaluation({
          isCorrect: response.data.isCorrect,
          reasoning: response.data.reasoning,
          message: response.data.message,
          loading: false
        });

        // If AI approved the answer, notify parent
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

  // Don't show anything if result is not displayed yet
  if (!showResult) {
    return null;
  }

  return (
    <>
      {/* AI Evaluation Result - always show if exists, regardless of correctness */}
      {aiEvaluation && (
        <div className="mt-3">
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
        </div>
      )}

      {/* AI Re-evaluation button - only show when answer is wrong and user tried */}
      {!isAnswerCorrect && !aiEvaluation && sessionId && !userGaveUp && answers.some(a => a && a.trim()) && (
        <div className="mt-3 mb-3 flex justify-end">
          <button
            onClick={handleAiReevaluation}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Brain className="w-4 h-4" />
            让AI重新评估我的答案
          </button>
        </div>
      )}
    </>
  );
};
