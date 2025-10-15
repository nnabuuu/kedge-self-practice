import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { QuizQuestion } from '../../../types/quiz';
import { KnowledgePointDisplay } from '../KnowledgePointDisplay';
import { preferencesService } from '../../../services/preferencesService';
import { AIEvaluationPanel } from './AIEvaluationPanel';
import { AnswerComparisonDisplay } from './AnswerComparisonDisplay';

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
  // Use Math.max(1, blanksCount) to ensure at least 1 blank for non-blank fill-in questions
  const blanksCount = Math.max(1, (question.question.match(/____/g) || []).length);
  const [isLoadingPreference, setIsLoadingPreference] = useState(true);

  // Debug logging for hints
  useEffect(() => {
    if (question.hints) {
      console.log('Fill-in-blank question hints:', question.hints);
    }
  }, [question]);

  // Load hint preference on mount and auto-show if preferred
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

  // Track hint visibility changes during session - store in sessionStorage
  useEffect(() => {
    if (!isLoadingPreference) {
      sessionStorage.setItem('hintPreference', String(showHints));
    }
  }, [showHints, isLoadingPreference]);

  return (
    <div className="mb-6">
      {/* Question text with blanks */}
      {renderQuestionWithBlanks(question.question)}

      {/* Question images */}
      {question.images && question.images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {question.images.map((url, index) => (
            <img key={index} src={url} alt={`图片 ${index + 1}`} className="max-w-sm rounded-lg shadow-md" />
          ))}
        </div>
      )}

      {/* Instructions/Prompt */}
      <div className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
        <span className="font-medium">提示：</span>
        {(() => {
          if (showResult) {
            return "按 Enter 键继续";
          } else if (blanksCount === 0) {
            return "请在输入框中填写答案，填写后按 Enter 键提交";
          } else if (blanksCount > 1) {
            return "使用 Tab 键在空格之间切换，Shift+Tab 返回上一个空格。填写至少一个空格后按 Enter 键提交答案";
          } else {
            return "填写空格后按 Enter 键提交答案";
          }
        })()}
      </div>

      {/* Result section */}
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg ${isAnswerCorrect() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {/* Result header */}
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

          {/* AI Evaluation Panel */}
          <AIEvaluationPanel
            questionId={question.id}
            sessionId={sessionId}
            answers={answers}
            showResult={showResult}
            userGaveUp={userGaveUp}
            isAnswerCorrect={isAnswerCorrect()}
            onAiApproved={onAiApproved}
          />

          {/* Answer Comparison */}
          <AnswerComparisonDisplay
            question={question}
            answers={answers}
            showResult={showResult}
            isAnswerCorrect={isAnswerCorrect()}
          />

          {/* Knowledge Point Display */}
          {question.knowledge_point && (
            <div className="mt-4">
              <KnowledgePointDisplay knowledgePoint={question.knowledge_point} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
