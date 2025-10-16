import React from 'react';
import { BookMarked } from 'lucide-react';
import { QuizQuestion } from '../../types/quiz';

interface KnowledgePointDisplayProps {
  question: QuizQuestion;
}

export const KnowledgePointDisplay: React.FC<KnowledgePointDisplayProps> = ({ question }) => {
  if (!question.knowledgePoint) return null;

  return (
    <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-center mb-3">
        <BookMarked className="w-5 h-5 text-amber-600 mr-2" />
        <span className="font-semibold text-amber-800">📚 相关知识点</span>
      </div>
      <div className="space-y-2 text-sm">
        {question.knowledgePoint.volume && (
          <div className="flex">
            <span className="text-amber-600 font-medium min-w-[60px]">分册：</span>
            <span className="text-amber-700">{question.knowledgePoint.volume}</span>
          </div>
        )}
        {question.knowledgePoint.unit && (
          <div className="flex">
            <span className="text-amber-600 font-medium min-w-[60px]">单元：</span>
            <span className="text-amber-700">{question.knowledgePoint.unit}</span>
          </div>
        )}
        {question.knowledgePoint.lesson && (
          <div className="flex">
            <span className="text-amber-600 font-medium min-w-[60px]">课：</span>
            <span className="text-amber-700">{question.knowledgePoint.lesson}</span>
          </div>
        )}
        {question.knowledgePoint.section && (
          <div className="flex">
            <span className="text-amber-600 font-medium min-w-[60px]">子目：</span>
            <span className="text-amber-700">{question.knowledgePoint.section}</span>
          </div>
        )}
        {question.knowledgePoint.topic && (
          <div className="flex">
            <span className="text-amber-600 font-medium min-w-[60px]">知识点：</span>
            <span className="text-amber-700 font-semibold">{question.knowledgePoint.topic}</span>
          </div>
        )}
      </div>
    </div>
  );
};
