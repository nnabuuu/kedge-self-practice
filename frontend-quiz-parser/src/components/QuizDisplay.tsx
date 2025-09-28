import React from 'react';
import { QuizItem } from '../types/quiz';
import { Brain, CheckCircle, Edit3, List, FileText, HelpCircle, Wand2, RefreshCw, Loader2, Undo2, RotateCcw, Sparkles } from 'lucide-react';
import { polishQuizItem, changeQuizType } from '../services/localQuizService';
import { QuizImageDisplay } from './QuizImageDisplay';
import { EditableQuizItem } from './EditableQuizItem';

interface QuizDisplayProps {
  quizItems: QuizItem[];
  onQuizItemUpdate?: (index: number, updatedItem: QuizItem) => void;
  imageMapping?: Record<string, string>; // UUID to URL mapping for new format
}

interface QuizItemWithHistory extends QuizItem {
  history?: QuizItem[];
}

export const QuizDisplay: React.FC<QuizDisplayProps> = ({ quizItems, onQuizItemUpdate, imageMapping = {} }) => {
  const [loadingStates, setLoadingStates] = React.useState<{[key: string]: boolean}>({});
  const [itemHistories, setItemHistories] = React.useState<{[key: number]: QuizItem[]}>({});
  const [batchPolishing, setBatchPolishing] = React.useState(false);
  const [batchProgress, setBatchProgress] = React.useState({ current: 0, total: 0 });

  const singleChoiceQuestions = quizItems.filter(item => item.type === 'single-choice');
  const multipleChoiceQuestions = quizItems.filter(item => item.type === 'multiple-choice');
  const fillInBlankQuestions = quizItems.filter(item => item.type === 'fill-in-the-blank');
  const subjectiveQuestions = quizItems.filter(item => item.type === 'subjective');
  const otherQuestions = quizItems.filter(item => item.type === 'other');

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'single-choice':
        return { icon: Brain, label: '单选题', colorClasses: 'bg-indigo-100 text-indigo-600' };
      case 'multiple-choice':
        return { icon: List, label: '多选题', colorClasses: 'bg-purple-100 text-purple-600' };
      case 'fill-in-the-blank':
        return { icon: Edit3, label: '填空题', colorClasses: 'bg-blue-100 text-blue-600' };
      case 'subjective':
        return { icon: FileText, label: '主观题', colorClasses: 'bg-green-100 text-green-600' };
      case 'other':
        return { icon: HelpCircle, label: '其他题型', colorClasses: 'bg-gray-100 text-gray-600' };
      default:
        return { icon: HelpCircle, label: '未知题型', colorClasses: 'bg-gray-100 text-gray-600' };
    }
  };

  const saveToHistory = (globalIndex: number, currentItem: QuizItem) => {
    setItemHistories(prev => ({
      ...prev,
      [globalIndex]: [...(prev[globalIndex] || []), { ...currentItem }]
    }));
  };

  const handlePolishQuestion = async (item: QuizItem, globalIndex: number) => {
    const loadingKey = `polish-${globalIndex}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      // Save current version to history
      saveToHistory(globalIndex, item);
      
      const polishedItem = await polishQuizItem(item);
      onQuizItemUpdate?.(globalIndex, polishedItem);
    } catch (error) {
      console.error('Polish question error:', error);
      alert(error instanceof Error ? error.message : '题目润色失败');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleChangeQuestionType = async (item: QuizItem, globalIndex: number, newType: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective') => {
    const loadingKey = `change-${globalIndex}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      // Save current version to history
      saveToHistory(globalIndex, item);
      
      const changedItem = await changeQuizType(item, newType);
      onQuizItemUpdate?.(globalIndex, changedItem);
    } catch (error) {
      console.error('Change question type error:', error);
      alert(error instanceof Error ? error.message : '题目类型修改失败');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleBatchPolish = async () => {
    setBatchPolishing(true);
    setBatchProgress({ current: 0, total: quizItems.length });
    
    try {
      for (let i = 0; i < quizItems.length; i++) {
        setBatchProgress({ current: i + 1, total: quizItems.length });
        
        // Save current version to history
        saveToHistory(i, quizItems[i]);
        
        try {
          const polishedItem = await polishQuizItem(quizItems[i]);
          onQuizItemUpdate?.(i, polishedItem);
        } catch (error) {
          console.error(`Failed to polish question ${i + 1}:`, error);
          // Continue with next question even if one fails
        }
        
        // Add delay between requests to avoid overwhelming the API
        if (i < quizItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setBatchPolishing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const handleRevertToVersion = (globalIndex: number, versionIndex: number) => {
    const history = itemHistories[globalIndex];
    if (history && history[versionIndex]) {
      const revertItem = history[versionIndex];
      onQuizItemUpdate?.(globalIndex, revertItem);
      
      // Remove this version and all versions after it from history
      setItemHistories(prev => ({
        ...prev,
        [globalIndex]: history.slice(0, versionIndex)
      }));
    }
  };

  const handleUndoLastChange = (globalIndex: number) => {
    const history = itemHistories[globalIndex];
    if (history && history.length > 0) {
      const lastVersion = history[history.length - 1];
      onQuizItemUpdate?.(globalIndex, lastVersion);
      
      // Remove the last version from history
      setItemHistories(prev => ({
        ...prev,
        [globalIndex]: history.slice(0, -1)
      }));
    }
  };

  const renderVersionControl = (globalIndex: number) => {
    const history = itemHistories[globalIndex] || [];
    const hasHistory = history.length > 0;
    
    if (!hasHistory) return null;
    
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">版本历史 ({history.length})</span>
          <button
            onClick={() => handleUndoLastChange(globalIndex)}
            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            <Undo2 className="w-3 h-3 mr-1" />
            撤销
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {history.map((_, versionIndex) => (
            <button
              key={versionIndex}
              onClick={() => handleRevertToVersion(globalIndex, versionIndex)}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
              title={`回退到版本 ${versionIndex + 1}`}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              v{versionIndex + 1}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleManualEdit = (globalIndex: number, updatedItem: QuizItem) => {
    // Save current version to history before updating
    saveToHistory(globalIndex, quizItems[globalIndex]);
    onQuizItemUpdate?.(globalIndex, updatedItem);
  };

  const renderEditingOptions = (item: QuizItem, globalIndex: number) => {
    const polishLoading = loadingStates[`polish-${globalIndex}`];
    const changeLoading = loadingStates[`change-${globalIndex}`];
    const isLoading = polishLoading || changeLoading;
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 items-start">
          <div className="flex-shrink-0">
            <EditableQuizItem
              item={item}
              onSave={(updatedItem) => handleManualEdit(globalIndex, updatedItem)}
            />
          </div>
          
          <button
            onClick={() => handlePolishQuestion(item, globalIndex)}
            disabled={isLoading || batchPolishing}
            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {polishLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-1" />
            )}
            润色题干
          </button>
          
          <div className="relative group">
            <button
              disabled={isLoading || batchPolishing}
              className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changeLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              调整题型
            </button>
            
            <div className="absolute bottom-full left-0 mb-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-32 transition-all duration-200">
              {item.type !== 'single-choice' && (
                <button
                  onClick={() => handleChangeQuestionType(item, globalIndex, 'single-choice')}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  单选题
                </button>
              )}
              {item.type !== 'multiple-choice' && (
                <button
                  onClick={() => handleChangeQuestionType(item, globalIndex, 'multiple-choice')}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  多选题
                </button>
              )}
              {item.type !== 'fill-in-the-blank' && (
                <button
                  onClick={() => handleChangeQuestionType(item, globalIndex, 'fill-in-the-blank')}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  填空题
                </button>
              )}
              {item.type !== 'subjective' && (
                <button
                  onClick={() => handleChangeQuestionType(item, globalIndex, 'subjective')}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  主观题
                </button>
              )}
            </div>
          </div>
        </div>
        
        {renderVersionControl(globalIndex)}
      </div>
    );
  };

  const renderLoadingOverlay = (globalIndex: number) => {
    const polishLoading = loadingStates[`polish-${globalIndex}`];
    const changeLoading = loadingStates[`change-${globalIndex}`];
    const isLoading = polishLoading || changeLoading;
    
    if (!isLoading) return null;
    
    return (
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-sm font-medium text-gray-700">
            {polishLoading ? '正在润色题干...' : '正在调整题型...'}
          </span>
        </div>
      </div>
    );
  };

  const renderFillInBlankQuestion = (item: QuizItem, index: number) => {
    const { icon: Icon, label, colorClasses } = getQuestionTypeInfo(item.type);
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    const hints = Array.isArray(item.hints) ? item.hints : [];
    const globalIndex = quizItems.findIndex(q => q === item);
    
    // Format question with hints
    let questionWithHints = item.question;
    if (hints.length > 0) {
      let blankIndex = 0;
      questionWithHints = item.question.replace(/_{4,}/g, (match) => {
        const hint = hints[blankIndex];
        blankIndex++;
        return hint && hint !== null ? `${match}（${hint}）` : match;
      });
    }
    
    return (
      <div key={index} className="relative bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {renderLoadingOverlay(globalIndex)}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${colorClasses} rounded-full p-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {label} #{index + 1}
            </h3>
          </div>
          <span className={`${colorClasses.replace('text-', 'text-').replace('-600', '-700')} px-3 py-1 rounded-full text-sm font-medium`}>
            {label}
          </span>
        </div>
        
        <div className="mb-4">
          <QuizImageDisplay 
            content={questionWithHints}
            images={item.images}
            imageMapping={imageMapping}
            className="text-gray-700 text-base leading-relaxed"
          />
        </div>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">正确答案:</span>
            </div>
            <div className="ml-7 space-y-1">
              {answers.map((ans, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-sm text-emerald-600">空格 {idx + 1}:</span>
                  <span className="text-emerald-800 font-semibold">{ans}</span>
                  {hints[idx] && hints[idx] !== null && (
                    <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                      提示：{hints[idx]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {renderEditingOptions(item, globalIndex)}
      </div>
    );
  };

  const renderChoiceQuestion = (item: QuizItem, index: number, isMultiple: boolean = false) => {
    const { icon: Icon, label, colorClasses } = getQuestionTypeInfo(item.type);
    const globalIndex = quizItems.findIndex(q => q === item);
    
    // Handle different answer formats
    let correctAnswerIndices: number[] = [];
    if (Array.isArray(item.answer)) {
      if (typeof item.answer[0] === 'number') {
        correctAnswerIndices = item.answer as number[];
      } else {
        // If answer is array of strings, find their indices in options
        correctAnswerIndices = (item.answer as string[]).map(ans => 
          item.options.findIndex(opt => opt === ans)
        ).filter(idx => idx !== -1);
      }
    } else if (typeof item.answer === 'number') {
      correctAnswerIndices = [item.answer];
    } else if (typeof item.answer === 'string') {
      // Find the index of the answer string in options
      const answerIndex = item.options.findIndex(opt => opt === item.answer);
      if (answerIndex !== -1) {
        correctAnswerIndices = [answerIndex];
      }
    }
    
    return (
      <div key={index} className="relative bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {renderLoadingOverlay(globalIndex)}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${colorClasses} rounded-full p-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {label} #{index + 1}
            </h3>
          </div>
          <span className={`${colorClasses.replace('text-', 'text-').replace('-600', '-700')} px-3 py-1 rounded-full text-sm font-medium`}>
            {label}
          </span>
        </div>
        
        <div className="mb-4">
          <QuizImageDisplay 
            content={item.question}
            images={item.images}
            imageMapping={imageMapping}
            className="text-gray-700 text-base leading-relaxed font-medium"
          />
        </div>
        
        {item.options && item.options.length > 0 && (
          <div className="mb-4 space-y-2">
            {item.options.map((option, optionIndex) => {
              const isCorrect = correctAnswerIndices.includes(optionIndex);
              const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D...
              
              return (
                <div
                  key={optionIndex}
                  className={`p-3 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-300'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">{optionLabel}</span>
                      )}
                    </div>
                    <QuizImageDisplay 
                      content={`${optionLabel}. ${option}`}
                      images={item.images}
                      imageMapping={imageMapping}
                      className={`${
                        isCorrect ? 'text-emerald-800 font-semibold' : 'text-gray-700'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">正确答案:</span>
            <span className="text-emerald-800 font-semibold">
              {correctAnswerIndices.map(idx => 
                item.options && item.options[idx] ? `${String.fromCharCode(65 + idx)}. ${item.options[idx]}` : ''
              ).join(', ')}
            </span>
          </div>
        </div>
        
        {renderEditingOptions(item, globalIndex)}
      </div>
    );
  };

  const renderSubjectiveQuestion = (item: QuizItem, index: number) => {
    const { icon: Icon, label, colorClasses } = getQuestionTypeInfo(item.type);
    const answer = typeof item.answer === 'string' ? item.answer : Array.isArray(item.answer) ? item.answer.join(', ') : '';
    const globalIndex = quizItems.findIndex(q => q === item);
    
    return (
      <div key={index} className="relative bg-white rounded-lg shadow-md border border-gray-200 p-6">
        {renderLoadingOverlay(globalIndex)}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${colorClasses} rounded-full p-2`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {label} #{index + 1}
            </h3>
          </div>
          <span className={`${colorClasses.replace('text-', 'text-').replace('-600', '-700')} px-3 py-1 rounded-full text-sm font-medium`}>
            {label}
          </span>
        </div>
        
        <div className="mb-4">
          <QuizImageDisplay 
            content={item.question}
            images={item.images}
            imageMapping={imageMapping}
            className="text-gray-700 text-base leading-relaxed font-medium"
          />
        </div>
        
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-emerald-700">参考答案:</span>
              <p className="text-emerald-800 font-medium mt-1">{answer}</p>
            </div>
          </div>
        </div>
        
        {renderEditingOptions(item, globalIndex)}
      </div>
    );
  };

  const renderQuestionSection = (questions: QuizItem[], sectionTitle: string, renderFunction: (item: QuizItem, index: number) => React.ReactNode) => {
    if (questions.length === 0) return null;
    
    const { icon: Icon, colorClasses } = getQuestionTypeInfo(questions[0].type);
    const iconColor = colorClasses.split(' ')[1]; // Extract text color class
    
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Icon className={`w-5 h-5 mr-2 ${iconColor.replace('-600', '-500')}`} />
          {sectionTitle} ({questions.length} 道)
        </h3>
        <div className="grid gap-4">
          {questions.map((item, index) => renderFunction(item, index))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">题目生成</h2>
              <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm">
                {quizItems.length} 道题
              </span>
            </div>
            
            {/* Batch Polish Button */}
            <button
              onClick={handleBatchPolish}
              disabled={batchPolishing}
              className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {batchPolishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  润色中 ({batchProgress.current}/{batchProgress.total})
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  一键润色全部
                </>
              )}
            </button>
          </div>
          
          {/* Batch Progress Bar */}
          {batchPolishing && (
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="grid gap-6">
            {renderQuestionSection(singleChoiceQuestions, '单选题', (item, index) => renderChoiceQuestion(item, index, false))}
            {renderQuestionSection(multipleChoiceQuestions, '多选题', (item, index) => renderChoiceQuestion(item, index, true))}
            {renderQuestionSection(fillInBlankQuestions, '填空题', renderFillInBlankQuestion)}
            {renderQuestionSection(subjectiveQuestions, '主观题', renderSubjectiveQuestion)}
            {renderQuestionSection(otherQuestions, '其他题型', renderSubjectiveQuestion)}
          </div>
        </div>
      </div>
    </div>
  );
};