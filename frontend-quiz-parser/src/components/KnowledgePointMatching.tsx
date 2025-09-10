import React, { useEffect, useState, useRef } from 'react';
import { QuizItem, QuizWithKnowledgePoint, KnowledgePointMatchResult } from '../types/quiz';
import { matchKnowledgePoint } from '../services/localQuizService';
import { Brain, BookOpen, CheckCircle, AlertCircle, Loader2, ArrowRight, Target, ChevronDown, ChevronUp, Tag, Globe, Crown, Search, Edit3, X, Check, RefreshCw, Settings, Settings2, SlidersHorizontal, StopCircle } from 'lucide-react';
import { QuizImageDisplay } from './QuizImageDisplay';

interface KnowledgePointMatchingProps {
  quizItems: QuizItem[];
  onComplete: (quizWithKnowledgePoints: QuizWithKnowledgePoint[]) => void;
  onBack: () => void;
  imageMapping?: Record<string, string>; // UUID to URL mapping for images
}

export const KnowledgePointMatching: React.FC<KnowledgePointMatchingProps> = ({
  quizItems,
  onComplete,
  onBack,
  imageMapping = {}
}) => {
  const [quizWithKnowledgePoints, setQuizWithKnowledgePoints] = useState<QuizWithKnowledgePoint[]>([]);
  const [currentMatchingIndex, setCurrentMatchingIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [expandedCandidates, setExpandedCandidates] = useState<{[key: number]: boolean}>({});
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<{[key: number]: boolean}>({});
  const [browsingAllKnowledgePoints, setBrowsingAllKnowledgePoints] = useState<{[key: number]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState<{[key: number]: string}>({});
  const [selectedFilters, setSelectedFilters] = useState<{[key: number]: {
    volume?: string;
    unit?: string;
    lesson?: string;
  }}>({});
  const [targetHints, setTargetHints] = useState<{[key: number]: {
    volume?: string;
    unit?: string;
    lesson?: string;
    sub?: string;
  }}>({});
  const [showTargetSelector, setShowTargetSelector] = useState<{[key: number]: boolean}>({});
  const [hierarchyOptions, setHierarchyOptions] = useState<{[key: number]: {
    volumes: string[];
    units: string[];
    lessons: string[];
    subs: string[];
  }}>({});
  const [allKnowledgePoints, setAllKnowledgePoints] = useState<any[]>([]);
  const [showBatchTargetSelector, setShowBatchTargetSelector] = useState(false);
  const [batchTargetHints, setBatchTargetHints] = useState<{
    volume?: string;
    unit?: string;
    lesson?: string;
    sub?: string;
  }>({});
  const [batchHierarchyOptions, setBatchHierarchyOptions] = useState<{
    volumes: string[];
    units: string[];
    lessons: string[];
    subs: string[];
  }>({
    volumes: [],
    units: [],
    lessons: [],
    subs: []
  });
  const [isMatching, setIsMatching] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const shouldStopMatchingRef = useRef(false);
  const currentOperationRef = useRef<'initial' | 'batch' | 'failed' | null>(null);

  useEffect(() => {
    // Initialize quiz items with matching status
    const initialQuizItems: QuizWithKnowledgePoint[] = quizItems.map(item => ({
      ...item,
      matchingStatus: 'pending'
    }));
    setQuizWithKnowledgePoints(initialQuizItems);
    
    // Start matching process
    matchAllKnowledgePoints(initialQuizItems);
  }, [quizItems]);

  // Generate hierarchy options from local knowledge points
  const getLocalHierarchyOptions = (filters?: {
    volume?: string;
    unit?: string;
    lesson?: string;
  }) => {
    const options = {
      volumes: [] as string[],
      units: [] as string[],
      lessons: [] as string[],
      subs: [] as string[]
    };

    // If no knowledge points yet, return empty options
    if (allKnowledgePoints.length === 0) {
      return options;
    }

    // Get unique volumes
    const volumeSet = new Set<string>();
    allKnowledgePoints.forEach(kp => {
      if (kp.volume) volumeSet.add(kp.volume);
    });
    options.volumes = Array.from(volumeSet).sort();

    // Filter by volume if specified
    let filtered = allKnowledgePoints;
    if (filters?.volume) {
      filtered = filtered.filter(kp => kp.volume === filters.volume);
    }

    // Get unique units
    const unitSet = new Set<string>();
    filtered.forEach(kp => {
      if (kp.unit) unitSet.add(kp.unit);
    });
    options.units = Array.from(unitSet).sort();

    // Filter by unit if specified
    if (filters?.unit) {
      filtered = filtered.filter(kp => kp.unit === filters.unit);
    }

    // Get unique lessons
    const lessonSet = new Set<string>();
    filtered.forEach(kp => {
      if (kp.lesson) lessonSet.add(kp.lesson);
    });
    options.lessons = Array.from(lessonSet).sort();

    // Filter by lesson if specified
    if (filters?.lesson) {
      filtered = filtered.filter(kp => kp.lesson === filters.lesson);
    }

    // Get unique subs
    const subSet = new Set<string>();
    filtered.forEach(kp => {
      if (kp.sub) subSet.add(kp.sub);
    });
    options.subs = Array.from(subSet).sort();

    return options;
  };

  const matchAllKnowledgePoints = async (items: QuizWithKnowledgePoint[]) => {
    const updatedItems = [...items];
    setIsMatching(true);
    setIsStopping(false);
    setWasStopped(false);
    shouldStopMatchingRef.current = false;
    currentOperationRef.current = 'initial';
    
    for (let i = 0; i < items.length; i++) {
      // Check if we should stop
      if (shouldStopMatchingRef.current || currentOperationRef.current !== 'initial') {
        console.log(`Initial matching stopped at item ${i + 1} of ${items.length}`);
        setWasStopped(true);
        break;
      }
      
      setCurrentMatchingIndex(i);
      updatedItems[i] = { ...updatedItems[i], matchingStatus: 'loading' };
      setQuizWithKnowledgePoints([...updatedItems]);
      
      try {
        const matchingResult = await matchKnowledgePoint(items[i]);
        
        // Check again after async operation
        if (shouldStopMatchingRef.current || currentOperationRef.current !== 'initial') {
          console.log(`Initial matching stopped after API call for item ${i + 1}`);
          // Revert the loading status
          updatedItems[i] = { ...updatedItems[i], matchingStatus: items[i].matchingStatus || 'pending' };
          setWasStopped(true);
          break;
        }
        
        updatedItems[i] = {
          ...updatedItems[i],
          knowledgePoint: matchingResult.matched,
          matchingResult,
          matchingStatus: 'success'
        };
        
        // Store knowledge points locally if we get them
        if (matchingResult.candidates && matchingResult.candidates.length > 0) {
          // Check if we should still update state
          if (!shouldStopMatchingRef.current && currentOperationRef.current === 'initial') {
            setAllKnowledgePoints(prev => {
              const existing = new Map(prev.map(kp => [kp.id, kp]));
              matchingResult.candidates.forEach(kp => {
                if (!existing.has(kp.id)) {
                  existing.set(kp.id, kp);
                }
              });
              return Array.from(existing.values());
            });
          }
        }
      } catch (error) {
        console.error(`Knowledge point matching failed for item ${i}:`, error);
        if (!shouldStopMatchingRef.current && currentOperationRef.current === 'initial') {
          updatedItems[i] = {
            ...updatedItems[i],
            matchingStatus: 'error'
          };
        }
      }
      
      // Only update state if not stopped
      if (!shouldStopMatchingRef.current && currentOperationRef.current === 'initial') {
        setQuizWithKnowledgePoints([...updatedItems]);
      }
      
      // Add a small delay between requests to avoid overwhelming the API
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Only mark as completed if we weren't stopped
    if (currentOperationRef.current === 'initial' && !shouldStopMatchingRef.current) {
      setIsCompleted(true);
    }
    setIsMatching(false);
    setIsStopping(false);
    shouldStopMatchingRef.current = false;
    currentOperationRef.current = null;
  };

  // Re-match a single quiz item with optional target hints
  const rematchSingleItem = async (index: number, useTargetHints: boolean = false) => {
    const updatedItems = [...quizWithKnowledgePoints];
    updatedItems[index] = { 
      ...updatedItems[index], 
      matchingStatus: 'loading',
      knowledgePoint: undefined,
      matchingResult: undefined
    };
    setQuizWithKnowledgePoints(updatedItems);
    
    try {
      const hints = useTargetHints ? targetHints[index] : undefined;
      const matchingResult = await matchKnowledgePoint(updatedItems[index], hints);
      updatedItems[index] = {
        ...updatedItems[index],
        knowledgePoint: matchingResult.matched,
        matchingResult,
        matchingStatus: 'success'
      };
    } catch (error) {
      console.error(`Re-match failed for item ${index}:`, error);
      updatedItems[index] = {
        ...updatedItems[index],
        matchingStatus: 'error'
      };
    }
    
    setQuizWithKnowledgePoints(updatedItems);
    setShowTargetSelector(prev => ({ ...prev, [index]: false }));
  };

  // Re-match all failed items
  const rematchAllFailed = async () => {
    const failedIndices = quizWithKnowledgePoints
      .map((item, index) => item.matchingStatus === 'error' ? index : -1)
      .filter(index => index !== -1);
    
    if (failedIndices.length === 0) return;
    
    setIsCompleted(false);
    setIsMatching(true);
    setIsStopping(false);
    setWasStopped(false);
    shouldStopMatchingRef.current = false;
    currentOperationRef.current = 'failed';
    
    // Reset failed items to pending and clear their matches
    const updatedItems = quizWithKnowledgePoints.map((item, index) => 
      failedIndices.includes(index) 
        ? { 
            ...item, 
            matchingStatus: 'pending' as const,
            knowledgePoint: undefined,
            matchingResult: undefined
          }
        : item
    );
    setQuizWithKnowledgePoints(updatedItems);
    if (failedIndices.length > 0) {
      setCurrentMatchingIndex(failedIndices[0]);
    }
    
    for (const index of failedIndices) {
      // Check if we should stop
      if (shouldStopMatchingRef.current || currentOperationRef.current !== 'failed') {
        console.log(`Failed items re-matching stopped at index ${index}`);
        setWasStopped(true);
        break;
      }
      
      setCurrentMatchingIndex(index);
      updatedItems[index] = { ...updatedItems[index], matchingStatus: 'loading' };
      setQuizWithKnowledgePoints([...updatedItems]);
      
      try {
        const matchingResult = await matchKnowledgePoint(updatedItems[index]);
        
        // Check again after async operation
        if (shouldStopMatchingRef.current || currentOperationRef.current !== 'failed') {
          console.log(`Failed items re-matching stopped after API call for index ${index}`);
          updatedItems[index] = { ...updatedItems[index], matchingStatus: 'error' };
          setWasStopped(true);
          break;
        }
        
        updatedItems[index] = {
          ...updatedItems[index],
          knowledgePoint: matchingResult.matched,
          matchingResult,
          matchingStatus: 'success'
        };
      } catch (error) {
        console.error(`Re-match failed for item ${index}:`, error);
        if (!shouldStopMatchingRef.current && currentOperationRef.current === 'failed') {
          updatedItems[index] = {
            ...updatedItems[index],
            matchingStatus: 'error'
          };
        }
      }
      
      // Only update state if not stopped
      if (!shouldStopMatchingRef.current && currentOperationRef.current === 'failed') {
        setQuizWithKnowledgePoints([...updatedItems]);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Only mark as completed if we weren't stopped
    if (currentOperationRef.current === 'failed' && !shouldStopMatchingRef.current) {
      setIsCompleted(true);
    }
    setIsMatching(false);
    setIsStopping(false);
    shouldStopMatchingRef.current = false;
    currentOperationRef.current = null;
  };

  // Re-match all items with optional target hints
  const rematchAllItems = async (useTargetHints: boolean = false) => {
    if (!useTargetHints && !confirm('确定要重新匹配所有题目吗？这将覆盖当前的匹配结果。')) {
      return;
    }
    
    setIsCompleted(false);
    setIsMatching(true);
    setIsStopping(false);
    setWasStopped(false);
    shouldStopMatchingRef.current = false;
    currentOperationRef.current = 'batch';
    setShowBatchTargetSelector(false);
    setCurrentMatchingIndex(0); // Reset to start
    
    // Reset all items to pending status and clear existing matches
    const updatedItems = quizWithKnowledgePoints.map(item => ({
      ...item,
      matchingStatus: 'pending' as const,
      knowledgePoint: undefined,
      matchingResult: undefined
    }));
    setQuizWithKnowledgePoints(updatedItems);
    
    for (let i = 0; i < updatedItems.length; i++) {
      // Check if we should stop
      if (shouldStopMatchingRef.current || currentOperationRef.current !== 'batch') {
        console.log(`Batch re-matching stopped at item ${i + 1} of ${updatedItems.length}`);
        setWasStopped(true);
        break;
      }
      
      setCurrentMatchingIndex(i);
      updatedItems[i] = { ...updatedItems[i], matchingStatus: 'loading' };
      setQuizWithKnowledgePoints([...updatedItems]);
      
      try {
        // Only pass high-level constraints (volume/unit), not lesson/sub
        // This allows each item to find its best match within the broader range
        const hints = useTargetHints && batchTargetHints ? {
          volume: batchTargetHints.volume,
          unit: batchTargetHints.unit,
          // Only include lesson if specifically selected, but not sub
          ...(batchTargetHints.lesson && !batchTargetHints.sub ? { lesson: batchTargetHints.lesson } : {})
        } : undefined;
        
        const matchingResult = await matchKnowledgePoint(updatedItems[i], hints);
        
        // Check again after async operation
        if (shouldStopMatchingRef.current || currentOperationRef.current !== 'batch') {
          console.log(`Batch re-matching stopped after API call for item ${i + 1}`);
          // Keep the previous state for this item
          updatedItems[i] = quizWithKnowledgePoints[i];
          setWasStopped(true);
          break;
        }
        
        updatedItems[i] = {
          ...updatedItems[i],
          knowledgePoint: matchingResult.matched,
          matchingResult,
          matchingStatus: 'success'
        };
        
        // Store knowledge points locally if we get them
        if (matchingResult.candidates && matchingResult.candidates.length > 0) {
          // Check if we should still update state
          if (!shouldStopMatchingRef.current && currentOperationRef.current === 'batch') {
            setAllKnowledgePoints(prev => {
              const existing = new Map(prev.map(kp => [kp.id, kp]));
              matchingResult.candidates.forEach(kp => {
                if (!existing.has(kp.id)) {
                  existing.set(kp.id, kp);
                }
              });
              return Array.from(existing.values());
            });
          }
        }
      } catch (error) {
        console.error(`Re-match failed for item ${i}:`, error);
        if (!shouldStopMatchingRef.current && currentOperationRef.current === 'batch') {
          updatedItems[i] = {
            ...updatedItems[i],
            matchingStatus: 'error'
          };
        }
      }
      
      // Only update state if not stopped
      if (!shouldStopMatchingRef.current && currentOperationRef.current === 'batch') {
        setQuizWithKnowledgePoints([...updatedItems]);
      }
      
      // Add delay between requests
      if (i < updatedItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Only mark as completed if we weren't stopped
    if (currentOperationRef.current === 'batch' && !shouldStopMatchingRef.current) {
      setIsCompleted(true);
    }
    setIsMatching(false);
    setIsStopping(false);
    shouldStopMatchingRef.current = false;
    currentOperationRef.current = null;
    setBatchTargetHints({}); // Clear hints after use
  };

  const handleStopMatching = () => {
    shouldStopMatchingRef.current = true;
    setIsStopping(true); // Show stopping state immediately
    currentOperationRef.current = null; // This will immediately stop any running operation
    console.log('User requested to stop matching');
  };

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'single-choice':
        return { icon: Brain, label: '单选题', colorClasses: 'bg-indigo-100 text-indigo-600' };
      case 'multiple-choice':
        return { icon: Brain, label: '多选题', colorClasses: 'bg-purple-100 text-purple-600' };
      case 'fill-in-the-blank':
        return { icon: Brain, label: '填空题', colorClasses: 'bg-blue-100 text-blue-600' };
      case 'subjective':
        return { icon: Brain, label: '主观题', colorClasses: 'bg-green-100 text-green-600' };
      case 'other':
        return { icon: Brain, label: '其他题型', colorClasses: 'bg-gray-100 text-gray-600' };
      default:
        return { icon: Brain, label: '未知题型', colorClasses: 'bg-gray-100 text-gray-600' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const toggleCandidatesExpansion = (index: number) => {
    setExpandedCandidates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSelectCandidate = (quizIndex: number, candidateIndex: number) => {
    const updatedItems = [...quizWithKnowledgePoints];
    const candidate = updatedItems[quizIndex].matchingResult?.candidates[candidateIndex];
    
    if (candidate) {
      updatedItems[quizIndex] = {
        ...updatedItems[quizIndex],
        knowledgePoint: candidate,
        matchingResult: {
          ...updatedItems[quizIndex].matchingResult!,
          matched: candidate
        }
      };
      setQuizWithKnowledgePoints(updatedItems);
    }
    
    // Exit editing mode
    setEditingKnowledgePoint(prev => ({
      ...prev,
      [quizIndex]: false
    }));
  };

  const handleMarkAsNoMatch = (quizIndex: number) => {
    const updatedItems = [...quizWithKnowledgePoints];
    updatedItems[quizIndex] = {
      ...updatedItems[quizIndex],
      knowledgePoint: undefined,
      matchingResult: {
        ...updatedItems[quizIndex].matchingResult!,
        matched: undefined
      }
    };
    setQuizWithKnowledgePoints(updatedItems);
    
    // Exit editing mode
    setEditingKnowledgePoint(prev => ({
      ...prev,
      [quizIndex]: false
    }));
  };

  const toggleEditingMode = (quizIndex: number) => {
    setEditingKnowledgePoint(prev => ({
      ...prev,
      [quizIndex]: !prev[quizIndex]
    }));
    // Close browsing mode when opening editing mode
    if (!editingKnowledgePoint[quizIndex]) {
      setBrowsingAllKnowledgePoints(prev => ({ ...prev, [quizIndex]: false }));
    }
  };

  const toggleBrowseAllMode = (quizIndex: number) => {
    setBrowsingAllKnowledgePoints(prev => ({
      ...prev,
      [quizIndex]: !prev[quizIndex]
    }));
    // Close editing mode when opening browse all mode
    if (!browsingAllKnowledgePoints[quizIndex]) {
      setEditingKnowledgePoint(prev => ({ ...prev, [quizIndex]: false }));
    }
    // Initialize search and filters
    if (!browsingAllKnowledgePoints[quizIndex]) {
      setSearchQuery(prev => ({ ...prev, [quizIndex]: '' }));
      setSelectedFilters(prev => ({ ...prev, [quizIndex]: {} }));
    }
  };

  const getFilteredKnowledgePoints = (quizIndex: number) => {
    let filtered = [...allKnowledgePoints];
    
    const query = searchQuery[quizIndex] || '';
    const filters = selectedFilters[quizIndex] || {};
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(kp => 
        kp.topic?.toLowerCase().includes(lowerQuery) ||
        kp.volume?.toLowerCase().includes(lowerQuery) ||
        kp.unit?.toLowerCase().includes(lowerQuery) ||
        kp.lesson?.toLowerCase().includes(lowerQuery) ||
        kp.sub?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply filters
    if (filters.volume) {
      filtered = filtered.filter(kp => kp.volume === filters.volume);
    }
    if (filters.unit) {
      filtered = filtered.filter(kp => kp.unit === filters.unit);
    }
    if (filters.lesson) {
      filtered = filtered.filter(kp => kp.lesson === filters.lesson);
    }
    
    return filtered;
  };

  const handleSelectKnowledgePoint = (quizIndex: number, knowledgePoint: KnowledgePoint) => {
    const updatedItems = [...quizWithKnowledgePoints];
    updatedItems[quizIndex] = {
      ...updatedItems[quizIndex],
      knowledgePoint: knowledgePoint,
      matchingResult: {
        matched: knowledgePoint,
        candidates: [],
        keywords: [],
        country: '',
        dynasty: ''
      },
      matchingStatus: 'success'
    };
    setQuizWithKnowledgePoints(updatedItems);
    // Close browse mode after selection
    setBrowsingAllKnowledgePoints(prev => ({ ...prev, [quizIndex]: false }));
    setSearchQuery(prev => ({ ...prev, [quizIndex]: '' }));
    setSelectedFilters(prev => ({ ...prev, [quizIndex]: {} }));
  };

  const renderQuizContent = (item: QuizWithKnowledgePoint) => {
    const { icon: Icon, label, colorClasses } = getQuestionTypeInfo(item.type);
    
    // Handle different answer formats for display
    let correctAnswerIndices: number[] = [];
    if (Array.isArray(item.answer)) {
      if (typeof item.answer[0] === 'number') {
        correctAnswerIndices = item.answer as number[];
      } else {
        correctAnswerIndices = (item.answer as string[]).map(ans => 
          item.options?.findIndex(opt => opt === ans) ?? -1
        ).filter(idx => idx !== -1);
      }
    } else if (typeof item.answer === 'number') {
      correctAnswerIndices = [item.answer];
    } else if (typeof item.answer === 'string' && item.options) {
      const answerIndex = item.options.findIndex(opt => opt === item.answer);
      if (answerIndex !== -1) {
        correctAnswerIndices = [answerIndex];
      }
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`${colorClasses} rounded-full p-1.5`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        
        <div className="mb-3">
          <QuizImageDisplay 
            content={item.question}
            images={item.images}
            imageMapping={imageMapping}
            className="text-lg font-medium text-gray-800"
          />
        </div>
        
        {/* Options for choice questions */}
        {item.options && item.options.length > 0 && (
          <div className="space-y-2 mb-3">
            {item.options.map((option, optionIndex) => {
              const isCorrect = correctAnswerIndices.includes(optionIndex);
              const optionLabel = String.fromCharCode(65 + optionIndex);
              
              return (
                <div
                  key={optionIndex}
                  className={`p-2 rounded border ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
                      isCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {isCorrect ? '✓' : optionLabel}
                    </span>
                    <span className={isCorrect ? 'text-emerald-800 font-medium' : 'text-gray-700'}>
                      {optionLabel}. {option}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Answer display */}
        <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">
              {item.type === 'subjective' ? '参考答案:' : '正确答案:'}
            </span>
          </div>
          <div className="mt-1 text-emerald-800">
            {item.options && correctAnswerIndices.length > 0 ? (
              correctAnswerIndices.map(idx => 
                `${String.fromCharCode(65 + idx)}. ${item.options![idx]}`
              ).join(', ')
            ) : (
              typeof item.answer === 'string' ? item.answer : 
              Array.isArray(item.answer) ? item.answer.join(', ') : 
              String(item.answer)
            )}
          </div>
        </div>
      </div>
    );
  };

  // Count completed items, but consider 'loading' as completed if it was previously matched
  const completedCount = quizWithKnowledgePoints.filter((item, index) => {
    if (item.matchingStatus === 'success' || item.matchingStatus === 'error') {
      return true;
    }
    // If currently loading but has a previous match result, count as completed
    if (item.matchingStatus === 'loading' && item.matchingResult) {
      return true;
    }
    return false;
  }).length;

  const successCount = quizWithKnowledgePoints.filter(item => 
    item.matchingStatus === 'success'
  ).length;
  
  const errorCount = quizWithKnowledgePoints.filter(item => 
    item.matchingStatus === 'error'
  ).length;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">知识点匹配</h2>
              <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm">
                {completedCount}/{quizItems.length}
              </span>
            </div>
            {(isMatching || wasStopped) && (
              <div className="flex items-center gap-3">
                <div className="text-white text-sm">
                  {isStopping ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      正在停止...
                    </span>
                  ) : wasStopped ? (
                    <span className="text-yellow-100">
                      已停止 ({successCount}/{completedCount} 完成)
                    </span>
                  ) : (
                    `正在匹配第 ${currentMatchingIndex + 1} 题...`
                  )}
                </div>
                {isMatching && !isStopping && (
                  <button
                    onClick={handleStopMatching}
                    className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    title="停止匹配"
                  >
                    <StopCircle className="w-4 h-4 mr-1" />
                    停止
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">匹配进度</span>
              <span className="text-sm text-gray-500">
                {Math.round((completedCount / quizItems.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  completedCount === quizItems.length ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
                style={{ width: `${(completedCount / quizItems.length) * 100}%` }}
              />
            </div>
            {(isCompleted || wasStopped) && !isMatching && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {wasStopped ? (
                      <span className="text-sm text-amber-600">
                        ⚠️ 匹配已停止！成功匹配 {successCount}/{completedCount} 个知识点
                      </span>
                    ) : (
                      <span className="text-sm text-emerald-600">
                        ✅ 匹配完成！成功匹配 {successCount} 个知识点
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="text-sm text-red-600">
                        ❌ {errorCount} 个匹配失败
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowBatchTargetSelector(true);
                        setBatchTargetHints({});
                        // Load initial hierarchy options from local data
                        const options = getLocalHierarchyOptions();
                        setBatchHierarchyOptions(options);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors group"
                      title="设置匹配范围并重新匹配所有题目"
                    >
                      <SlidersHorizontal className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                      批量重新匹配
                    </button>
                    {errorCount > 0 && (
                      <button
                        onClick={rematchAllFailed}
                        className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        重新匹配失败项 ({errorCount})
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Batch Target Selector */}
                {showBatchTargetSelector && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700">设置批量匹配范围</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">分册</label>
                        <select
                          value={batchTargetHints.volume || ''}
                          onChange={(e) => {
                            const newVolume = e.target.value;
                            setBatchTargetHints({
                              volume: newVolume,
                              unit: '',
                              lesson: '',
                              sub: ''
                            });
                            // Get new options for this volume from local data
                            const options = getLocalHierarchyOptions({ volume: newVolume });
                            setBatchHierarchyOptions(options);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">全部分册</option>
                          {batchHierarchyOptions.volumes.map(vol => (
                            <option key={vol} value={vol}>{vol}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">单元</label>
                        <select
                          value={batchTargetHints.unit || ''}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            setBatchTargetHints(prev => ({
                              ...prev,
                              unit: newUnit,
                              lesson: '',
                              sub: ''
                            }));
                            // Get new options for this unit from local data
                            const options = getLocalHierarchyOptions({ 
                              volume: batchTargetHints.volume,
                              unit: newUnit 
                            });
                            setBatchHierarchyOptions(options);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!batchTargetHints.volume}
                        >
                          <option value="">全部单元</option>
                          {batchHierarchyOptions.units.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">课程</label>
                        <select
                          value={batchTargetHints.lesson || ''}
                          onChange={(e) => {
                            const newLesson = e.target.value;
                            setBatchTargetHints(prev => ({
                              ...prev,
                              lesson: newLesson,
                              sub: ''
                            }));
                            // Get new options for this lesson from local data
                            const options = getLocalHierarchyOptions({ 
                              volume: batchTargetHints.volume,
                              unit: batchTargetHints.unit,
                              lesson: newLesson 
                            });
                            setBatchHierarchyOptions(options);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!batchTargetHints.unit}
                        >
                          <option value="">全部课程</option>
                          {batchHierarchyOptions.lessons.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">子目</label>
                        <select
                          value={batchTargetHints.sub || ''}
                          onChange={(e) => setBatchTargetHints(prev => ({
                            ...prev,
                            sub: e.target.value
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!batchTargetHints.lesson}
                        >
                          <option value="">全部子目</option>
                          {batchHierarchyOptions.subs.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setShowBatchTargetSelector(false);
                          setBatchTargetHints({});
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => rematchAllItems(false)}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        忽略范围重新匹配
                      </button>
                      <button
                        onClick={() => rematchAllItems(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        在指定范围内匹配
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quiz Items with Knowledge Points */}
          <div className="space-y-6">
            {quizWithKnowledgePoints.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">题目 #{index + 1}</h3>
                  <div className="flex items-center gap-2">
                    {item.matchingStatus === 'error' && (
                      <button
                        onClick={() => rematchSingleItem(index)}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        重试
                      </button>
                    )}
                    {getStatusIcon(item.matchingStatus || 'pending')}
                  </div>
                </div>
                
                {/* Quiz Content */}
                {renderQuizContent(item)}
                
                {/* Error State */}
                {item.matchingStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-700">匹配失败</span>
                    </div>
                    <p className="text-sm text-red-600 mt-2">
                      无法匹配到合适的知识点。请检查网络连接或稍后重试。
                    </p>
                  </div>
                )}
                
                {/* Matching Results */}
                {item.matchingStatus === 'success' && item.matchingResult && (
                  <div className="space-y-4">
                    {/* Main Matched Knowledge Point or No Match State */}
                    <div className="bg-white rounded-lg border border-emerald-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium text-emerald-700">
                            {item.matchingResult.matched ? '匹配的知识点' : '无合适匹配'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!showTargetSelector[index] && (
                            <>
                              <button
                                onClick={async () => {
                                  setShowTargetSelector(prev => ({ ...prev, [index]: true }));
                                  // Initialize with current values or empty if no match
                                  setTargetHints(prev => ({
                                    ...prev,
                                    [index]: item.matchingResult?.matched ? {
                                      volume: item.matchingResult.matched.volume,
                                      unit: item.matchingResult.matched.unit,
                                      lesson: item.matchingResult.matched.lesson,
                                      sub: item.matchingResult.matched.sub,
                                    } : {
                                      volume: '',
                                      unit: '',
                                      lesson: '',
                                      sub: ''
                                    }
                                  }));
                                  // Load initial hierarchy options from local data
                                  const options = getLocalHierarchyOptions();
                                  setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                修改范围
                              </button>
                              <button
                                onClick={() => rematchSingleItem(index, false)}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                重新匹配
                              </button>
                              <button
                                onClick={() => toggleEditingMode(index)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                              >
                                <Search className="w-3 h-3 mr-1" />
                                {editingKnowledgePoint[index] ? '取消选择' : '手动选择'}
                              </button>
                              <button
                                onClick={() => toggleBrowseAllMode(index)}
                                className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                              >
                                <Globe className="w-3 h-3 mr-1" />
                                {browsingAllKnowledgePoints[index] ? '关闭浏览' : '浏览全部'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {item.matchingResult.matched ? (
                        <div>
                          {showTargetSelector[index] ? (
                            // Edit mode - show dropdown selectors
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">分册</label>
                                  <select
                                    value={targetHints[index]?.volume || item.matchingResult.matched.volume}
                                    onChange={async (e) => {
                                      const newVolume = e.target.value;
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          volume: newVolume,
                                          // Clear lower levels when volume changes
                                          unit: '',
                                          lesson: '',
                                          sub: '',
                                        }
                                      }));
                                      // Get new options for this volume from local data
                                      const options = getLocalHierarchyOptions({ volume: newVolume });
                                      setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">选择分册...</option>
                                    {hierarchyOptions[index]?.volumes.map(vol => (
                                      <option key={vol} value={vol}>{vol}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">单元</label>
                                  <select
                                    value={targetHints[index]?.unit || ''}
                                    onChange={async (e) => {
                                      const newUnit = e.target.value;
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          ...prev[index], 
                                          unit: newUnit,
                                          // Clear lower levels when unit changes
                                          lesson: '',
                                          sub: '',
                                        }
                                      }));
                                      // Get new options for this unit from local data
                                      const options = getLocalHierarchyOptions({ 
                                        volume: targetHints[index]?.volume,
                                        unit: newUnit 
                                      });
                                      setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!targetHints[index]?.volume}
                                  >
                                    <option value="">选择单元...</option>
                                    {hierarchyOptions[index]?.units.map(u => (
                                      <option key={u} value={u}>{u}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">课程</label>
                                  <select
                                    value={targetHints[index]?.lesson || ''}
                                    onChange={async (e) => {
                                      const newLesson = e.target.value;
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          ...prev[index], 
                                          lesson: newLesson,
                                          // Clear lower level when lesson changes
                                          sub: '',
                                        }
                                      }));
                                      // Get new options for this lesson from local data
                                      const options = getLocalHierarchyOptions({ 
                                        volume: targetHints[index]?.volume,
                                        unit: targetHints[index]?.unit,
                                        lesson: newLesson 
                                      });
                                      setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!targetHints[index]?.unit}
                                  >
                                    <option value="">选择课程...</option>
                                    {hierarchyOptions[index]?.lessons.map(l => (
                                      <option key={l} value={l}>{l}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">子目</label>
                                  <select
                                    value={targetHints[index]?.sub || ''}
                                    onChange={(e) => setTargetHints(prev => ({
                                      ...prev,
                                      [index]: { ...prev[index], sub: e.target.value }
                                    }))}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!targetHints[index]?.lesson}
                                  >
                                    <option value="">选择子目...</option>
                                    {hierarchyOptions[index]?.subs.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded p-2">
                                <span className="text-sm text-gray-700 font-medium">{item.matchingResult.matched.topic}</span>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setShowTargetSelector(prev => ({ ...prev, [index]: false }));
                                    setTargetHints(prev => ({ ...prev, [index]: {} }));
                                  }}
                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => rematchSingleItem(index, true)}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
                                >
                                  应用并重新匹配
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode - show current values
                            <div>
                              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                <div><span className="text-gray-500">分册:</span> <span className="text-gray-800">{item.matchingResult.matched.volume}</span></div>
                                <div><span className="text-gray-500">单元:</span> <span className="text-gray-800">{item.matchingResult.matched.unit}</span></div>
                                <div><span className="text-gray-500">课程:</span> <span className="text-gray-800">{item.matchingResult.matched.lesson}</span></div>
                                <div><span className="text-gray-500">子目:</span> <span className="text-gray-800">{item.matchingResult.matched.sub}</span></div>
                              </div>
                              <div className="bg-emerald-50 rounded p-3">
                                <span className="text-emerald-800 font-medium">{item.matchingResult.matched.topic}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {showTargetSelector[index] ? (
                            // Edit mode - show dropdown selectors for no match case
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">分册</label>
                                  <select
                                    value={targetHints[index]?.volume || ''}
                                    onChange={async (e) => {
                                      const newVolume = e.target.value;
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          volume: newVolume,
                                          unit: '',
                                          lesson: '',
                                          sub: '',
                                        }
                                      }));
                                      const options = getLocalHierarchyOptions({ volume: newVolume });
                                      setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">选择分册...</option>
                                    {hierarchyOptions[index]?.volumes.map(vol => (
                                      <option key={vol} value={vol}>{vol}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">单元</label>
                                  <select
                                    value={targetHints[index]?.unit || ''}
                                    onChange={async (e) => {
                                      const newUnit = e.target.value;
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          ...prev[index], 
                                          unit: newUnit,
                                          lesson: '',
                                          sub: '',
                                        }
                                      }));
                                      const options = getLocalHierarchyOptions({ 
                                        volume: targetHints[index]?.volume,
                                        unit: newUnit 
                                      });
                                      setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!targetHints[index]?.volume}
                                  >
                                    <option value="">选择单元...</option>
                                    {hierarchyOptions[index]?.units.map(u => (
                                      <option key={u} value={u}>{u}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">课程</label>
                                  <select
                                    value={targetHints[index]?.lesson || ''}
                                    onChange={async (e) => {
                                      const newLesson = e.target.value;
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          ...prev[index], 
                                          lesson: newLesson,
                                          sub: '',
                                        }
                                      }));
                                      const options = getLocalHierarchyOptions({ 
                                        volume: targetHints[index]?.volume,
                                        unit: targetHints[index]?.unit,
                                        lesson: newLesson 
                                      });
                                      setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!targetHints[index]?.unit}
                                  >
                                    <option value="">选择课程...</option>
                                    {hierarchyOptions[index]?.lessons.map(l => (
                                      <option key={l} value={l}>{l}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">子目</label>
                                  <select
                                    value={targetHints[index]?.sub || ''}
                                    onChange={(e) => {
                                      setTargetHints(prev => ({
                                        ...prev,
                                        [index]: { 
                                          ...prev[index], 
                                          sub: e.target.value
                                        }
                                      }));
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={!targetHints[index]?.lesson}
                                  >
                                    <option value="">选择子目...</option>
                                    {hierarchyOptions[index]?.subs.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setShowTargetSelector(prev => ({ ...prev, [index]: false }));
                                    setTargetHints(prev => ({ ...prev, [index]: {} }));
                                  }}
                                  className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => rematchSingleItem(index, true)}
                                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                  应用并重新匹配
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded p-3 text-center">
                              <span className="text-gray-600">当前题目未匹配到合适的知识点</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Manual Selection Interface */}
                    {editingKnowledgePoint[index] && item.matchingResult.candidates && item.matchingResult.candidates.length > 0 && (
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Edit3 className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-700">选择合适的知识点</span>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          {item.matchingResult.candidates.map((candidate, candidateIdx) => (
                            <div 
                              key={candidateIdx} 
                              className="bg-white rounded border border-gray-200 p-3 hover:border-blue-300 transition-colors cursor-pointer"
                              onClick={() => handleSelectCandidate(index, candidateIdx)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                    <div><span className="text-gray-500">分册:</span> <span className="text-gray-800">{candidate.volume}</span></div>
                                    <div><span className="text-gray-500">单元:</span> <span className="text-gray-800">{candidate.unit}</span></div>
                                    <div><span className="text-gray-500">课程:</span> <span className="text-gray-800">{candidate.lesson}</span></div>
                                    <div><span className="text-gray-500">子目:</span> <span className="text-gray-800">{candidate.sub}</span></div>
                                  </div>
                                  <div className="bg-gray-50 rounded p-2">
                                    <span className="text-gray-800 font-medium">{candidate.topic}</span>
                                  </div>
                                </div>
                                <button className="ml-3 p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={() => handleMarkAsNoMatch(index)}
                            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4 mr-2" />
                            标记为无合适匹配
                          </button>
                          
                          <button
                            onClick={() => toggleEditingMode(index)}
                            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Browse All Knowledge Points Interface */}
                    {browsingAllKnowledgePoints[index] && (
                      <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-purple-700">浏览所有知识点</span>
                          </div>
                          <button
                            onClick={() => toggleBrowseAllMode(index)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Search and Filter Controls */}
                        <div className="space-y-3 mb-4">
                          <div>
                            <input
                              type="text"
                              placeholder="搜索知识点..."
                              value={searchQuery[index] || ''}
                              onChange={(e) => setSearchQuery(prev => ({ ...prev, [index]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={selectedFilters[index]?.volume || ''}
                              onChange={(e) => setSelectedFilters(prev => ({
                                ...prev,
                                [index]: { ...prev[index], volume: e.target.value, unit: '', lesson: '' }
                              }))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                            >
                              <option value="">全部分册</option>
                              {getLocalHierarchyOptions().volumes.map(vol => (
                                <option key={vol} value={vol}>{vol}</option>
                              ))}
                            </select>
                            
                            <select
                              value={selectedFilters[index]?.unit || ''}
                              onChange={(e) => setSelectedFilters(prev => ({
                                ...prev,
                                [index]: { ...prev[index], unit: e.target.value, lesson: '' }
                              }))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                              disabled={!selectedFilters[index]?.volume}
                            >
                              <option value="">全部单元</option>
                              {getLocalHierarchyOptions({ volume: selectedFilters[index]?.volume }).units.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                            
                            <select
                              value={selectedFilters[index]?.lesson || ''}
                              onChange={(e) => setSelectedFilters(prev => ({
                                ...prev,
                                [index]: { ...prev[index], lesson: e.target.value }
                              }))}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
                              disabled={!selectedFilters[index]?.unit}
                            >
                              <option value="">全部课程</option>
                              {getLocalHierarchyOptions({ 
                                volume: selectedFilters[index]?.volume,
                                unit: selectedFilters[index]?.unit 
                              }).lessons.map(l => (
                                <option key={l} value={l}>{l}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        {/* Knowledge Points List */}
                        <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                          {(() => {
                            const filtered = getFilteredKnowledgePoints(index);
                            if (filtered.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                  <p>没有找到匹配的知识点</p>
                                </div>
                              );
                            }
                            return filtered.slice(0, 50).map((kp, kpIdx) => (
                              <div
                                key={kpIdx}
                                className="bg-white rounded border border-gray-200 p-3 hover:border-purple-300 transition-colors cursor-pointer"
                                onClick={() => handleSelectKnowledgePoint(index, kp)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                                      <div><span className="text-gray-500">分册:</span> <span className="text-gray-700">{kp.volume}</span></div>
                                      <div><span className="text-gray-500">单元:</span> <span className="text-gray-700">{kp.unit}</span></div>
                                      <div><span className="text-gray-500">课程:</span> <span className="text-gray-700">{kp.lesson}</span></div>
                                      <div><span className="text-gray-500">子目:</span> <span className="text-gray-700">{kp.sub}</span></div>
                                    </div>
                                    <div className="text-sm font-medium text-gray-800">{kp.topic}</div>
                                  </div>
                                  <Check className="w-4 h-4 text-purple-600 opacity-0 hover:opacity-100" />
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        
                        {getFilteredKnowledgePoints(index).length > 50 && (
                          <div className="text-center text-sm text-gray-500">
                            仅显示前50个结果，请使用筛选器缩小范围
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Keywords */}
                      {item.matchingResult.keywords.length > 0 && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3 md:col-span-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <Tag className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">关键词</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.matchingResult.keywords.map((keyword, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded text-sm font-medium">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Country and Dynasty - Smaller cards */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Country */}
                      {item.matchingResult.country && (
                        <div className="bg-white rounded border border-purple-200 p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <Globe className="w-3 h-3 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">国家</span>
                          </div>
                          <span className="text-xs text-purple-800">{item.matchingResult.country}</span>
                        </div>
                      )}
                      
                      {/* Dynasty */}
                      {item.matchingResult.dynasty && (
                        <div className="bg-white rounded border border-amber-200 p-2">
                          <div className="flex items-center space-x-1 mb-1">
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span className="text-xs font-medium text-amber-700">朝代</span>
                          </div>
                          <span className="text-xs text-amber-800">{item.matchingResult.dynasty}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Candidates (Collapsible) */}
                    {item.matchingResult.candidates && item.matchingResult.candidates.length > 0 && (
                      <div className={`bg-white rounded-lg border border-gray-200 ${editingKnowledgePoint[index] ? 'opacity-50' : ''}`}>
                        <button
                          onClick={() => toggleCandidatesExpansion(index)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                          disabled={editingKnowledgePoint[index]}
                        >
                          <div className="flex items-center space-x-2">
                            <Search className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {editingKnowledgePoint[index] ? '编辑模式中...' : `候选知识点 (${item.matchingResult.candidates.length})`}
                            </span>
                          </div>
                          {!editingKnowledgePoint[index] && (expandedCandidates[index] ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ))}
                        </button>
                        
                        {expandedCandidates[index] && !editingKnowledgePoint[index] && (
                          <div className="border-t border-gray-200 p-4 space-y-3">
                            {item.matchingResult.candidates.map((candidate, candidateIdx) => (
                              <div key={candidateIdx} className="bg-gray-50 rounded p-3 border">
                                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                  <div><span className="text-gray-500">分册:</span> <span className="text-gray-800">{candidate.volume}</span></div>
                                  <div><span className="text-gray-500">单元:</span> <span className="text-gray-800">{candidate.unit}</span></div>
                                  <div><span className="text-gray-500">课程:</span> <span className="text-gray-800">{candidate.lesson}</span></div>
                                  <div><span className="text-gray-500">子目:</span> <span className="text-gray-800">{candidate.sub}</span></div>
                                </div>
                                <div className="bg-white rounded p-2">
                                  <span className="text-gray-800 font-medium">{candidate.topic}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {item.matchingStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    {showTargetSelector[index] ? (
                      // Edit mode - show dropdown selectors for error case
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <Settings className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">设置匹配范围</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">分册</label>
                            <select
                              value={targetHints[index]?.volume || ''}
                              onChange={async (e) => {
                                const newVolume = e.target.value;
                                setTargetHints(prev => ({
                                  ...prev,
                                  [index]: { 
                                    volume: newVolume,
                                    unit: '',
                                    lesson: '',
                                    sub: '',
                                  }
                                }));
                                const options = getLocalHierarchyOptions({ volume: newVolume });
                                setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">选择分册...</option>
                              {hierarchyOptions[index]?.volumes.map(vol => (
                                <option key={vol} value={vol}>{vol}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">单元</label>
                            <select
                              value={targetHints[index]?.unit || ''}
                              onChange={async (e) => {
                                const newUnit = e.target.value;
                                setTargetHints(prev => ({
                                  ...prev,
                                  [index]: { 
                                    ...prev[index], 
                                    unit: newUnit,
                                    lesson: '',
                                    sub: '',
                                  }
                                }));
                                const options = getLocalHierarchyOptions({ 
                                  volume: targetHints[index]?.volume,
                                  unit: newUnit 
                                });
                                setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!targetHints[index]?.volume}
                            >
                              <option value="">选择单元...</option>
                              {hierarchyOptions[index]?.units.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">课程</label>
                            <select
                              value={targetHints[index]?.lesson || ''}
                              onChange={async (e) => {
                                const newLesson = e.target.value;
                                setTargetHints(prev => ({
                                  ...prev,
                                  [index]: { 
                                    ...prev[index], 
                                    lesson: newLesson,
                                    sub: '',
                                  }
                                }));
                                const options = getLocalHierarchyOptions({ 
                                  volume: targetHints[index]?.volume,
                                  unit: targetHints[index]?.unit,
                                  lesson: newLesson 
                                });
                                setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!targetHints[index]?.unit}
                            >
                              <option value="">选择课程...</option>
                              {hierarchyOptions[index]?.lessons.map(l => (
                                <option key={l} value={l}>{l}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">子目</label>
                            <select
                              value={targetHints[index]?.sub || ''}
                              onChange={(e) => setTargetHints(prev => ({
                                ...prev,
                                [index]: { ...prev[index], sub: e.target.value }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!targetHints[index]?.lesson}
                            >
                              <option value="">选择子目...</option>
                              {hierarchyOptions[index]?.subs.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowTargetSelector(prev => ({ ...prev, [index]: false }));
                              setTargetHints(prev => ({ ...prev, [index]: {} }));
                            }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => rematchSingleItem(index, true)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            应用并重新匹配
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm text-red-700">知识点匹配失败</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              // Initialize hierarchy options for this index
                              const options = getLocalHierarchyOptions({});
                              setHierarchyOptions(prev => ({ ...prev, [index]: options }));
                              setShowTargetSelector(prev => ({ ...prev, [index]: true }));
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-300"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            修改范围
                          </button>
                          <button
                            onClick={() => rematchSingleItem(index)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            重新匹配
                          </button>
                          <button
                            onClick={() => toggleEditingMode(index)}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            手动选择
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              返回题目
            </button>
            
            {isCompleted && (
              <button
                onClick={() => onComplete(quizWithKnowledgePoints)}
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                继续
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};