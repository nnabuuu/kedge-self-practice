import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Upload, Eye, Edit, Trash2, Plus, Calendar, Tag, Target, ChevronLeft, ChevronRight, ExternalLink, X, Sparkles, Shuffle, MapPin, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';
import { preferencesService } from '../../services/preferencesService';
import { ApiService } from '../../services/api';
import KnowledgePointPicker from '../../components/KnowledgePointPicker';
import QuizDetailModal from '../../components/QuizDetailModal';
import QuizEditModal from '../../components/QuizEditModal';
import { useToast, ToastContainer } from '../../components/Toast';

interface Quiz {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other';
  question: string;
  options?: string[];
  answer: string | string[] | number | number[];
  alternative_answers?: string[]; // Alternative correct answers for fill-in-the-blank
  hints?: (string | null)[]; // Hints for fill-in-the-blank questions
  difficulty?: 'easy' | 'medium' | 'hard';
  knowledgePointId?: string;
  knowledge_point_id?: string; // Backend field name
  knowledgePoint?: {
    topic: string;
    lesson: string;
    unit: string;
    volume: string;
  };
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  images?: string[];
}

interface KnowledgePoint {
  id: string;
  topic: string;
  lesson: string;
  unit: string;
  volume: string;
}

interface QuizBankManagementProps {
  onBack?: () => void;
  initialKnowledgePointId?: string;
  initialQuizId?: string;  // Add this to automatically open a specific quiz for editing
  initialFilters?: {
    volume?: string;
    unit?: string;
    lesson?: string;
    knowledgePointId?: string;
  };
}

// Helper function to ensure API URL has /v1 suffix
const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718';
  return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
};

export default function QuizBankManagement({ onBack, initialKnowledgePointId, initialQuizId, initialFilters }: QuizBankManagementProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loadingKnowledgePoints, setLoadingKnowledgePoints] = useState(false);
  const { success, error, warning, info, toasts, removeToast } = useToast();
  const [selectedVolume, setSelectedVolume] = useState<string>(initialFilters?.volume || '');
  const [selectedUnit, setSelectedUnit] = useState<string>(initialFilters?.unit || '');
  const [selectedLesson, setSelectedLesson] = useState<string>(initialFilters?.lesson || '');
  const [selectedKnowledgePointId, setSelectedKnowledgePointId] = useState<string>(initialFilters?.knowledgePointId || initialKnowledgePointId || '');
  const [knowledgePointSearch, setKnowledgePointSearch] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input field
  const [isComposing, setIsComposing] = useState(false); // Track IME composition state
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedHintsFilter, setSelectedHintsFilter] = useState<string>('all'); // 'all', 'with-hints', 'without-hints'
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuizzes, setSelectedQuizzes] = useState<Set<string>>(new Set());
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingQuiz, setViewingQuiz] = useState<Quiz | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showKnowledgePointPicker, setShowKnowledgePointPicker] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newAlternativeAnswer, setNewAlternativeAnswer] = useState('');
  const [activeBlankTab, setActiveBlankTab] = useState(0);
  const [showPolishModal, setShowPolishModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [polishingQuiz, setPolishingQuiz] = useState<Quiz | null>(null);
  const [typeChangingQuiz, setTypeChangingQuiz] = useState<Quiz | null>(null);
  const [rematchingQuiz, setRematchingQuiz] = useState<Quiz | null>(null);
  const [polishedContent, setPolishedContent] = useState('');
  const [polishGuidance, setPolishGuidance] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [rematchHints, setRematchHints] = useState<{
    volume?: string;
    unit?: string;
    lesson?: string;
    sub?: string;
  }>({});
  const [hierarchyOptions, setHierarchyOptions] = useState<{
    volumes: string[];
    units: string[];
    lessons: string[];
    subs: string[];
  }>({ volumes: [], units: [], lessons: [], subs: [] });
  const [allKnowledgePoints, setAllKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const itemsPerPage = 10;
  
  // Track if data has been initially loaded
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Feature flags from settings
  const [enablePolish, setEnablePolish] = useState(true);
  const [enableQuizTypeAdjustment, setEnableQuizTypeAdjustment] = useState(true);

  // Fetch knowledge points and settings on mount
  useEffect(() => {
    fetchKnowledgePoints();
    loadSettings();
    
    // If initialQuizId is provided, load that specific quiz for editing
    if (initialQuizId) {
      loadQuizForEditing(initialQuizId);
    }
  }, []);
  
  // Load a specific quiz and open it for editing
  const loadQuizForEditing = async (quizId: string) => {
    try {
      console.log('Loading quiz for editing:', quizId);
      const token = authService.getToken();
      if (!token) return;
      
      const response = await fetch(`${getApiUrl()}/quiz/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const quiz = data.data;
          
          // Convert backend format to frontend format
          const formattedQuiz: Quiz = {
            id: String(quiz.id),
            type: quiz.type || 'single-choice',
            question: quiz.question,
            options: quiz.options || [],
            answer: quiz.answer,
            hints: quiz.hints,
            difficulty: quiz.difficulty,
            knowledgePointId: quiz.knowledge_point_id,
            knowledgePoint: quiz.knowledgePoint,
            tags: quiz.tags || [],
            images: quiz.images || []
          };
          
          console.log('Quiz loaded for editing:', formattedQuiz);
          
          // Set the quiz for editing and open the modal
          setEditingQuiz(formattedQuiz);
          setShowEditModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to load quiz for editing:', error);
    }
  };
  
  const loadSettings = async () => {
    try {
      const preferences = await preferencesService.getPreferences();
      setEnablePolish(preferences.quizManagement?.enablePolish ?? true);
      setEnableQuizTypeAdjustment(preferences.quizManagement?.enableQuizTypeAdjustment ?? true);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Keep default values if loading fails
    }
  };

  // Update filters when initialFilters prop changes
  useEffect(() => {
    if (initialFilters) {
      setSelectedVolume(initialFilters.volume || '');
      setSelectedUnit(initialFilters.unit || '');
      setSelectedLesson(initialFilters.lesson || '');
      setSelectedKnowledgePointId(initialFilters.knowledgePointId || '');
    }
  }, [initialFilters]);

  // Fetch quizzes from backend - only on initial load for mock data
  useEffect(() => {
    // Always fetch on initial load
    if (!dataLoaded) {
      fetchQuizzes();
      return;
    }
    
    // Always refetch when filters change
    
    // For real backend data, refetch when filters change
    fetchQuizzes();
  }, [currentPage, searchTerm, selectedType, selectedDifficulty, selectedTags, selectedKnowledgePointId, selectedVolume, selectedUnit, selectedLesson]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedDifficulty, selectedHintsFilter, selectedTags, selectedKnowledgePointId, selectedVolume, selectedUnit, selectedLesson]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      
      // Build query params
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      
      // If specific knowledge point is selected, use it
      if (selectedKnowledgePointId) {
        params.append('knowledge_point_id', selectedKnowledgePointId);
      } else if (selectedVolume || selectedUnit || selectedLesson) {
        // Otherwise, get all knowledge points matching the hierarchy filters
        const filteredKps = getFilteredKnowledgePoints();
        if (filteredKps.length > 0) {
          const kpIds = filteredKps.map(kp => kp.id).join(',');
          params.append('knowledge_point_id', kpIds);
        }
      }
      
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(
        `${getApiUrl()}/quiz?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response:', data);
        console.log('First quiz raw from API:', data.data?.[0]);
        // Check if we actually got quiz data
        if (data.data && data.data.length > 0) {
          // Check localStorage for any updates
          const cachedQuizzes = localStorage.getItem('cached_quizzes');
          let quizzesWithIds = data.data.map((quiz: any, index: number) => {
            console.log(`Quiz ${index}:`, quiz, 'has ID:', quiz.id);
            return {
              ...quiz,
              id: quiz.id || quiz._id || `quiz-${index}` // Fallback to generated ID if missing
            };
          });
          
          // Merge with cached updates if available
          if (cachedQuizzes) {
            try {
              const parsedCache = JSON.parse(cachedQuizzes);
              const cacheMap = new Map(parsedCache.map((q: Quiz) => [q.id, q]));
              quizzesWithIds = quizzesWithIds.map((quiz: Quiz) => {
                const cached = cacheMap.get(quiz.id);
                if (cached && cached.hints) {
                  // Preserve hints and other updated fields from cache
                  return { ...quiz, ...cached };
                }
                return quiz;
              });
              console.log('Merged with cached updates');
            } catch (e) {
              console.error('Failed to parse cached quizzes:', e);
            }
          }
          
          // Save to localStorage for future use
          localStorage.setItem('cached_quizzes', JSON.stringify(quizzesWithIds));
          
          console.log('Processed quizzes:', quizzesWithIds);
          setQuizzes(quizzesWithIds);
          setTotalPages(Math.ceil((data.count || data.data.length) / itemsPerPage));
          
          // Extract available tags from the quizzes
          const allTags = new Set<string>();
          quizzesWithIds.forEach((quiz: any) => {
            if (quiz.tags && Array.isArray(quiz.tags)) {
              quiz.tags.forEach((tag: string) => allTags.add(tag));
            }
          });
          setAvailableTags(Array.from(allTags).sort());
        } else {
          // No quizzes in database - show empty state
          console.log('No quizzes found in database');
          setQuizzes([]);
          setTotalPages(0);
          setAvailableTags([]);
        }
      } else {
        // API call failed - show empty state with error message
        console.log('API call failed with status:', response.status);
        setQuizzes([]);
        setTotalPages(0);
        setAvailableTags([]);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      // Show empty state on error
      setQuizzes([]);
      setTotalPages(0);
      setAvailableTags([]);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const fetchKnowledgePoints = async () => {
    try {
      setLoadingKnowledgePoints(true);
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(
        `${getApiUrl()}/knowledge-points/all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Knowledge points response:', data);
        if (data.knowledgePoints && Array.isArray(data.knowledgePoints)) {
          setKnowledgePoints(data.knowledgePoints);
          setAllKnowledgePoints(data.knowledgePoints); // Store all knowledge points for hierarchy generation
        }
      } else {
        console.error('Failed to fetch knowledge points:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
    } finally {
      setLoadingKnowledgePoints(false);
    }
  };

  // Helper functions for knowledge point hierarchical selection
  const getUniqueVolumes = () => {
    return [...new Set(knowledgePoints.map(kp => kp.volume))].sort();
  };

  const getUnitsForVolume = (volume: string) => {
    return [...new Set(knowledgePoints.filter(kp => kp.volume === volume).map(kp => kp.unit))].sort();
  };

  const getLessonsForVolumeAndUnit = (volume: string, unit: string) => {
    return [...new Set(knowledgePoints.filter(kp => kp.volume === volume && kp.unit === unit).map(kp => kp.lesson))].sort();
  };

  const getFilteredKnowledgePoints = () => {
    let filtered = knowledgePoints;

    // Apply hierarchical filters
    if (selectedVolume) {
      filtered = filtered.filter(kp => kp.volume === selectedVolume);
    }
    if (selectedUnit) {
      filtered = filtered.filter(kp => kp.unit === selectedUnit);
    }
    if (selectedLesson) {
      filtered = filtered.filter(kp => kp.lesson === selectedLesson);
    }

    // Apply search filter
    if (knowledgePointSearch) {
      const searchLower = knowledgePointSearch.toLowerCase();
      filtered = filtered.filter(kp => 
        kp.topic.toLowerCase().includes(searchLower) ||
        kp.lesson.toLowerCase().includes(searchLower) ||
        kp.unit.toLowerCase().includes(searchLower) ||
        kp.volume.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const initializeKnowledgePointFilters = (currentKnowledgePoint?: { volume?: string; unit?: string; lesson?: string }) => {
    if (currentKnowledgePoint) {
      setSelectedVolume(currentKnowledgePoint.volume || '');
      setSelectedUnit(currentKnowledgePoint.unit || '');
      setSelectedLesson(currentKnowledgePoint.lesson || '');
    } else {
      setSelectedVolume('');
      setSelectedUnit('');
      setSelectedLesson('');
    }
    setKnowledgePointSearch('');
  };

  const handleSelectQuiz = (quizId: string) => {
    const newSelected = new Set(selectedQuizzes);
    if (newSelected.has(quizId)) {
      newSelected.delete(quizId);
    } else {
      newSelected.add(quizId);
    }
    setSelectedQuizzes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuizzes.size === quizzes.length) {
      setSelectedQuizzes(new Set());
    } else {
      setSelectedQuizzes(new Set(quizzes.map(q => q.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedQuizzes.size === 0) {
      warning('请先选择要删除的题目');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedQuizzes.size} 道题目吗？此操作不可恢复。`)) {
      return;
    }
    
    const quizIdsToDelete = Array.from(selectedQuizzes);
    console.log('Batch deleting quizzes:', quizIdsToDelete);
    
    try {
      const token = localStorage.getItem('jwt_token');
      const deletePromises = quizIdsToDelete.map(async (quizId) => {
        try {
          const response = await fetch(
            `${getApiUrl()}/quiz/${quizId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.ok) {
            console.log(`Successfully deleted quiz ${quizId}`);
            return { quizId, success: true };
          } else {
            console.error(`Failed to delete quiz ${quizId}:`, response.status);
            return { quizId, success: false, error: `HTTP ${response.status}` };
          }
        } catch (error) {
          console.error(`Error deleting quiz ${quizId}:`, error);
          return { quizId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      // Wait for all delete operations to complete
      const results = await Promise.all(deletePromises);
      
      // Count successful deletions
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(`Batch delete completed: ${successful.length} successful, ${failed.length} failed`);
      
      if (failed.length > 0) {
        console.error('Failed deletions:', failed);
        warning(`删除完成：${successful.length} 道题目删除成功，${failed.length} 道题目删除失败。请检查网络连接或权限。`);
      } else {
        console.log('All quizzes deleted successfully');
      }
      
      // Remove successfully deleted quizzes from local state
      const successfulIds = new Set(successful.map(r => r.quizId));
      setQuizzes(prev => {
        const filtered = prev.filter(q => !successfulIds.has(q.id));
        console.log(`Removed ${successfulIds.size} quizzes from local state, remaining: ${filtered.length}`);
        return filtered;
      });
      
    } catch (error) {
      console.error('Batch delete error:', error);
      error('批量删除操作失败，请检查网络连接并重试。');
      
    }
    
    // Clear selection
    setSelectedQuizzes(new Set());
  };

  const handleNavigateToQuizParser = () => {
    authService.navigateToQuizParser();
  };

  const handleDeleteQuiz = async (quizId: string) => {
    console.log('Attempting to delete quiz with ID:', quizId);
    
    if (!quizId) {
      console.error('Cannot delete quiz: ID is undefined');
      error('无法删除题目：题目ID无效');
      return;
    }
    
    if (!confirm('确定要删除这道题目吗？此操作不可恢复。')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        `${getApiUrl()}/quiz/${quizId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Remove from local state
        setQuizzes(prev => {
          const filtered = prev.filter(q => q.id !== quizId);
          console.log(`Deleted quiz ${quizId}, remaining quizzes:`, filtered.length);
          return filtered;
        });
        // Clear selection if this quiz was selected
        setSelectedQuizzes(prev => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
      } else {
        // For now, just remove from local state even if API fails (mock data scenario)
        console.log('Delete API failed, removing from local state anyway');
        setQuizzes(prev => {
          const filtered = prev.filter(q => q.id !== quizId);
          console.log(`Deleted quiz ${quizId} (API failed), remaining quizzes:`, filtered.length);
          return filtered;
        });
        // Clear selection if this quiz was selected
        setSelectedQuizzes(prev => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      // Remove from local state anyway for demo purposes
      setQuizzes(prev => {
        const filtered = prev.filter(q => q.id !== quizId);
        console.log(`Deleted quiz ${quizId} (error), remaining quizzes:`, filtered.length);
        return filtered;
      });
      // Clear selection if this quiz was selected
      setSelectedQuizzes(prev => {
        const newSet = new Set(prev);
        newSet.delete(quizId);
        return newSet;
      });
    }
  };

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

    // Get unique subs (sections)
    const subSet = new Set<string>();
    filtered.forEach(kp => {
      if (kp.section) subSet.add(kp.section); // Note: frontend-practice uses 'section' not 'sub'
    });
    options.subs = Array.from(subSet).sort();

    return options;
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setNewTag(''); // Clear the new tag input
    setNewAlternativeAnswer(''); // Clear the new alternative answer input
    setActiveBlankTab(0); // Reset active tab
    setShowEditModal(true);
    // Fetch knowledge points for selection
    if (knowledgePoints.length === 0) {
      fetchKnowledgePoints();
    }
    // Initialize filters based on current knowledge point
    initializeKnowledgePointFilters(quiz.knowledgePoint);
  };

  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(
        `${getApiUrl()}/quiz/${updatedQuiz.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quiz: updatedQuiz })
        }
      );

      if (response.ok) {
        // Update in local state
        setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      } else {
        // For now, just update local state even if API fails (mock data scenario)
        console.log('Update API failed, updating local state anyway');
        setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
      }
    } catch (error) {
      console.error('Failed to update quiz:', error);
      // Update local state anyway for demo purposes
      setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
    }
    
    // Also persist to localStorage for mock data scenario
    const storedQuizzes = localStorage.getItem('cached_quizzes');
    if (storedQuizzes) {
      try {
        const parsedQuizzes = JSON.parse(storedQuizzes);
        const updatedQuizzes = parsedQuizzes.map((q: Quiz) => 
          q.id === updatedQuiz.id ? updatedQuiz : q
        );
        localStorage.setItem('cached_quizzes', JSON.stringify(updatedQuizzes));
        console.log('Updated quiz saved to localStorage');
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
    }
    
    setShowEditModal(false);
    setEditingQuiz(null);
    setNewTag('');
  };

  const handleAddTag = () => {
    if (newTag.trim() && editingQuiz) {
      const trimmedTag = newTag.trim();
      const currentTags = editingQuiz.tags || [];
      
      // Check if tag already exists
      if (!currentTags.includes(trimmedTag)) {
        setEditingQuiz({
          ...editingQuiz,
          tags: [...currentTags, trimmedTag]
        });
      }
      
      // Clear the input
      setNewTag('');
    }
  };

  const handleAddAlternativeAnswer = () => {
    if (newAlternativeAnswer.trim() && editingQuiz) {
      const trimmedAnswer = newAlternativeAnswer.trim();
      const currentAlternatives = editingQuiz.alternative_answers || [];
      
      // Check if answer already exists
      if (!currentAlternatives.includes(trimmedAnswer)) {
        setEditingQuiz({
          ...editingQuiz,
          alternative_answers: [...currentAlternatives, trimmedAnswer]
        });
      }
      
      // Clear the input
      setNewAlternativeAnswer('');
    }
  };

  // Handle polish quiz
  const handlePolishQuiz = (quiz: Quiz) => {
    setPolishingQuiz(quiz);
    setPolishedContent(quiz.question);
    setPolishGuidance(''); // Reset guidance
    setShowPolishModal(true);
  };

  const handleConfirmPolish = async () => {
    if (!polishingQuiz || !polishedContent.trim()) return;
    
    setIsPolishing(true);
    try {
      // Call GPT API to polish the question
      const apiUrl = getApiUrl();
      const token = authService.getToken();
      
      const response = await fetch(`${apiUrl}/gpt/polish-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          question: polishedContent,
          type: polishingQuiz.type,
          options: polishingQuiz.options,
          guidance: polishGuidance // Include user guidance
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPolishedContent(data.polishedQuestion || polishedContent);
      } else {
        // If API fails, just use the edited content
        console.error('Failed to polish question via API');
      }
    } catch (error) {
      console.error('Error polishing question:', error);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSavePolishedQuiz = async () => {
    if (!polishingQuiz) return;
    
    const updatedQuiz = {
      ...polishingQuiz,
      question: polishedContent
    };
    
    await handleSaveQuiz(updatedQuiz);
    setShowPolishModal(false);
    setPolishingQuiz(null);
    setPolishedContent('');
    setPolishGuidance(''); // Reset guidance
  };

  // Handle change quiz type
  const handleChangeQuizType = (quiz: Quiz) => {
    setTypeChangingQuiz(quiz);
    setShowTypeModal(true);
  };

  const handleRematchKnowledgePoint = async (quiz: Quiz) => {
    setRematchingQuiz(quiz);
    setRematchHints({
      volume: quiz.knowledgePoint?.volume || '',
      unit: quiz.knowledgePoint?.unit || '',
      lesson: quiz.knowledgePoint?.lesson || '',
      sub: ''
    });
    
    // Load initial hierarchy options from local data
    const options = getLocalHierarchyOptions();
    setHierarchyOptions(options);
    
    setShowRematchModal(true);
  };

  const handleConfirmRematch = async () => {
    if (!rematchingQuiz) return;
    
    setIsRematching(true);
    try {
      const response = await ApiService.matchKnowledgePoint(
        rematchingQuiz.question,
        rematchHints
      );
      
      if (response.success && response.data?.matched) {
        const updatedQuiz = {
          ...rematchingQuiz,
          knowledgePointId: response.data.matched.id,
          knowledge_point_id: response.data.matched.id,
          knowledgePoint: response.data.matched
        };
        
        await handleSaveQuiz(updatedQuiz);
        setShowRematchModal(false);
        setRematchingQuiz(null);
        setRematchHints({});
      } else {
        warning('未找到匹配的知识点，请调整筛选条件重试');
      }
    } catch (error) {
      console.error('Failed to rematch knowledge point:', error);
      error('重新匹配失败，请稍后重试');
    } finally {
      setIsRematching(false);
    }
  };

  const handleConfirmTypeChange = async (newType: Quiz['type']) => {
    if (!typeChangingQuiz) return;
    
    // Transform the quiz based on new type
    let updatedQuiz: Quiz = {
      ...typeChangingQuiz,
      type: newType
    };
    
    // Adjust the quiz structure based on new type
    if (newType === 'subjective' || newType === 'fill-in-the-blank') {
      // Remove options for non-choice questions
      delete updatedQuiz.options;
      // Convert answer to string if it was an array
      if (Array.isArray(updatedQuiz.answer)) {
        updatedQuiz.answer = '';
      }
    } else if (newType === 'single-choice' || newType === 'multiple-choice') {
      // Ensure options exist for choice questions
      if (!updatedQuiz.options || updatedQuiz.options.length === 0) {
        updatedQuiz.options = ['选项A', '选项B', '选项C', '选项D'];
        updatedQuiz.answer = newType === 'single-choice' ? 0 : [0];
      }
      // Adjust answer format
      if (newType === 'single-choice' && Array.isArray(updatedQuiz.answer)) {
        updatedQuiz.answer = updatedQuiz.answer[0] || 0;
      } else if (newType === 'multiple-choice' && !Array.isArray(updatedQuiz.answer)) {
        updatedQuiz.answer = [typeof updatedQuiz.answer === 'number' ? updatedQuiz.answer : 0];
      }
    }
    
    await handleSaveQuiz(updatedQuiz);
    setShowTypeModal(false);
    setTypeChangingQuiz(null);
  };

  const getQuizTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'single-choice': '单选题',
      'multiple-choice': '多选题',
      'fill-in-the-blank': '填空题',
      'subjective': '主观题',
      'other': '其他'
    };
    return typeMap[type] || type;
  };

  const getQuizTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'single-choice': 'bg-blue-100 text-blue-800',
      'multiple-choice': 'bg-purple-100 text-purple-800',
      'fill-in-the-blank': 'bg-green-100 text-green-800',
      'subjective': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labelMap: Record<string, string> = {
      'easy': '简单',
      'medium': '中等',
      'hard': '困难'
    };
    return labelMap[difficulty] || difficulty;
  };

  // Render question text with embedded images
  const renderQuestionWithImages = (text: string, images?: string[]) => {
    if (!text) return null;
    
    // Handle different image placeholder formats
    // Format 1: {{img:0}}, {{img:1}}, etc. (index-based)
    // Format 2: {{image:uuid}} (UUID-based)
    
    const parts = text.split(/(\{\{(?:img|image):[^}]+\}\})/g);
    
    return (
      <>
        {parts.map((part, index) => {
          // Check if this part is an image placeholder
          const imgMatch = part.match(/\{\{(?:img|image):([^}]+)\}\}/);
          
          if (imgMatch) {
            const imageRef = imgMatch[1];
            let imageUrl: string | undefined;
            
            // Check if it's an index (number)
            if (/^\d+$/.test(imageRef)) {
              const imageIndex = parseInt(imageRef);
              imageUrl = images?.[imageIndex];
            } else {
              // It's a UUID or filename, construct the URL
              // Check if it's already a full URL
              if (imageRef.startsWith('http') || imageRef.startsWith('/')) {
                imageUrl = imageRef;
              } else {
                // Use the simplified attachment API: /attachments/:fileId
                // Format: uuid.extension (e.g., 123e4567-e89b-12d3-a456-426614174000.png)
                const hasExtension = /\.\w+$/.test(imageRef);
                const fileId = hasExtension ? imageRef : `${imageRef}.png`; // Default to .png if no extension

                imageUrl = `${getApiUrl()}/attachments/${fileId}`;
              }
            }
            
            if (imageUrl) {
              // Add JWT token to image URL if needed for authentication
              const token = localStorage.getItem('jwt_token');
              const authenticatedUrl = token && imageUrl.includes('/attachments/') 
                ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
                : imageUrl;
                
              return (
                <div key={index} className="my-3">
                  <img
                    src={authenticatedUrl}
                    alt={`Quiz image ${imageRef}`}
                    className="max-w-full h-auto rounded-lg shadow-md"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=';
                      target.alt = 'Image not available';
                    }}
                  />
                </div>
              );
            } else {
              // No image URL available, show placeholder
              return (
                <div key={index} className="my-3 p-4 bg-gray-100 rounded-lg text-gray-500 text-sm">
                  <Tag className="w-4 h-4 inline mr-2" />
                  图片加载失败: {imageRef}
                </div>
              );
            }
          } else {
            // Regular text
            return <span key={index}>{part}</span>;
          }
        })}
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载题库中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">题库管理</h1>
            <p className="text-gray-600">管理和维护题目库</p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleNavigateToQuizParser}
                className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 group"
              >
                <Upload className="w-5 h-5 mr-2" />
                <span>批量导入题目</span>
                <ExternalLink className="w-4 h-4 ml-2 opacity-60 group-hover:opacity-100" />
              </button>
              
              {selectedQuizzes.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  <span>删除选中 ({selectedQuizzes.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Search Input - takes up more space */}
              <div className="lg:col-span-5 flex gap-2">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜索题目内容..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    onKeyDown={(e) => {
                      // Use onKeyDown instead of onKeyPress for better IME support
                      // Check if not composing (for Chinese/Japanese/Korean input)
                      if (e.key === 'Enter' && !isComposing) {
                        e.preventDefault();
                        setSearchTerm(searchInput);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => setSearchTerm(searchInput)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  搜索
                </button>
                {(searchTerm || searchInput) && (
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    title="清除搜索"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Type Select */}
              <div className="lg:col-span-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部题型</option>
                  <option value="single-choice">单选题</option>
                  <option value="multiple-choice">多选题</option>
                  <option value="fill-in-the-blank">填空题</option>
                  <option value="subjective">主观题</option>
                  <option value="other">其他</option>
                </select>
              </div>
              
              {/* Difficulty Select */}
              <div className="lg:col-span-2">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">全部难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
              
              {/* Hints Filter - Only show for fill-in-the-blank */}
              {(selectedType === 'fill-in-the-blank' || selectedType === 'all') && (
                <div className="lg:col-span-2">
                  <select
                    value={selectedHintsFilter}
                    onChange={(e) => setSelectedHintsFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">全部题目</option>
                    <option value="with-hints">有提示词</option>
                    <option value="without-hints">无提示词</option>
                  </select>
                </div>
              )}

              {/* Tags Filter */}
              <div className="lg:col-span-3">
                <div className="relative">
                  <Tag className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={selectedTags.length > 0 ? selectedTags[0] : 'all'}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setSelectedTags([]);
                      } else {
                        setSelectedTags([e.target.value]);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">全部标签</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Knowledge Point Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
              {/* Volume Select */}
              <div className="lg:col-span-3">
                <select
                  value={selectedVolume}
                  onChange={(e) => {
                    setSelectedVolume(e.target.value);
                    setSelectedUnit('');
                    setSelectedLesson('');
                    setSelectedKnowledgePointId('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部册别</option>
                  {getUniqueVolumes().map(volume => (
                    <option key={volume} value={volume}>{volume}</option>
                  ))}
                </select>
              </div>

              {/* Unit Select */}
              <div className="lg:col-span-3">
                <select
                  value={selectedUnit}
                  onChange={(e) => {
                    setSelectedUnit(e.target.value);
                    setSelectedLesson('');
                    setSelectedKnowledgePointId('');
                  }}
                  disabled={!selectedVolume}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">全部单元</option>
                  {selectedVolume && getUnitsForVolume(selectedVolume).map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* Lesson Select */}
              <div className="lg:col-span-3">
                <select
                  value={selectedLesson}
                  onChange={(e) => {
                    setSelectedLesson(e.target.value);
                    setSelectedKnowledgePointId('');
                  }}
                  disabled={!selectedUnit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">全部课程</option>
                  {selectedUnit && getLessonsForVolumeAndUnit(selectedVolume, selectedUnit).map(lesson => (
                    <option key={lesson} value={lesson}>{lesson}</option>
                  ))}
                </select>
              </div>

              {/* Knowledge Point Select */}
              <div className="lg:col-span-3">
                <select
                  value={selectedKnowledgePointId}
                  onChange={(e) => setSelectedKnowledgePointId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全部知识点</option>
                  {getFilteredKnowledgePoints().map(kp => (
                    <option key={kp.id} value={kp.id}>{kp.topic}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quiz List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6">
              {/* Table Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">题目列表</h3>
                <div className="text-sm text-gray-600">
                  共 {quizzes.length} 道题目
                </div>
              </div>

              {/* Select All Checkbox */}
              <div className="border-b border-gray-200 pb-3 mb-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedQuizzes.size === quizzes.length && quizzes.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">全选</span>
                </label>
              </div>

              {/* Quiz Items */}
              {(() => {
                // Apply filters
                let filteredQuizzes = quizzes;

                // Filter by search term
                if (searchTerm) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                    (quiz.knowledgePoint && (
                      quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                    ))
                  );
                }

                // Filter by type
                if (selectedType !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                }

                // Filter by hints (only for fill-in-the-blank questions)
                if (selectedHintsFilter !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => {
                    if (quiz.type !== 'fill-in-the-blank') return false;
                    const hasHints = quiz.hints && quiz.hints.filter(h => h !== null).length > 0;
                    return selectedHintsFilter === 'with-hints' ? hasHints : !hasHints;
                  });
                }

                // Filter by difficulty
                if (selectedDifficulty !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                }

                // Filter by tags
                if (selectedTags.length > 0) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                  );
                }

                // Calculate pagination for filtered results
                const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);

                return {
                  filteredQuizzes,
                  paginatedQuizzes,
                  totalFilteredPages
                };
              })().filteredQuizzes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {quizzes.length === 0 ? (
                    <>
                      <p className="text-gray-600 text-lg font-medium mb-2">题库为空</p>
                      <p className="text-gray-500 text-sm mb-6">您还没有导入任何题目，请先导入题目开始使用</p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={handleNavigateToQuizParser}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                        >
                          <Upload className="w-5 h-5" />
                          批量导入题目
                        </button>
                        <button
                          onClick={() => window.location.href = '/teacher/quiz-create'}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          手动创建题目
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-600">没有符合筛选条件的题目</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // Re-calculate for render (this is not ideal but needed due to current structure)
                    let filteredQuizzes = quizzes;
                    if (searchTerm) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                        (quiz.knowledgePoint && (
                          quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                        ))
                      );
                    }
                    if (selectedType !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                    }
                    if (selectedDifficulty !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                    }
                    if (selectedTags.length > 0) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                      );
                    }
                    
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    return filteredQuizzes.slice(startIndex, endIndex);
                  })().map((quiz) => (
                    <div key={quiz.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start space-x-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedQuizzes.has(quiz.id)}
                          onChange={() => handleSelectQuiz(quiz.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                        />
                        
                        {/* Quiz Content */}
                        <div className="flex-1">
                          {/* Tags and Labels */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-mono">
                              ID: {quiz.id}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuizTypeColor(quiz.type)}`}>
                              {getQuizTypeLabel(quiz.type)}
                            </span>
                            {quiz.type === 'fill-in-the-blank' && quiz.alternative_answers && quiz.alternative_answers.length > 0 && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {quiz.alternative_answers.length} 个替代答案
                              </span>
                            )}
                            {quiz.type === 'fill-in-the-blank' && quiz.hints && quiz.hints.filter(h => h !== null).length > 0 && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {quiz.hints.filter(h => h !== null).length} 个提示词
                              </span>
                            )}
                            {quiz.difficulty && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                                {getDifficultyLabel(quiz.difficulty)}
                              </span>
                            )}
                            {quiz.tags?.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                <Tag className="w-3 h-3 inline mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Question with image rendering */}
                          <div className="font-medium text-gray-900 mb-2">
                            {renderQuestionWithImages(quiz.question, quiz.images)}
                          </div>
                          
                          {/* Options for choice questions */}
                          {quiz.options && quiz.options.length > 0 && (
                            <div className="space-y-1 mb-3">
                              {quiz.options.map((option, index) => {
                                const isCorrect = Array.isArray(quiz.answer) 
                                  ? quiz.answer.includes(index)
                                  : quiz.answer === index;
                                return (
                                  <div key={index} className={`text-sm ${isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                    {String.fromCharCode(65 + index)}. {option}
                                    {isCorrect && <span className="ml-2">✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Answer for fill-in-the-blank */}
                          {quiz.type === 'fill-in-the-blank' && (
                            <div className="mb-3">
                              {(() => {
                                const blanksCount = (quiz.question.match(/_{2,}/g) || []).length;
                                const standardAnswers = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
                                const hints = quiz.hints || [];
                                
                                if (blanksCount > 1) {
                                  // Multiple blanks - show in table format
                                  return (
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="text-xs text-gray-600 border-b border-gray-200">
                                            <th className="text-left font-medium py-1 px-2 w-16">空格</th>
                                            <th className="text-left font-medium py-1 px-2">标准答案</th>
                                            {hints.some(h => h !== null) && (
                                              <th className="text-left font-medium py-1 px-2">提示词</th>
                                            )}
                                            {quiz.alternative_answers && quiz.alternative_answers.length > 0 && (
                                              <th className="text-left font-medium py-1 px-2">替代答案</th>
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.from({ length: blanksCount }, (_, idx) => {
                                            // Get alternative answers for this blank
                                            const altAnswers = (quiz.alternative_answers || [])
                                              .filter(a => a.startsWith(`[${idx}]`))
                                              .map(a => a.replace(`[${idx}]`, ''));
                                            
                                            return (
                                              <tr key={idx} className="border-t border-gray-200">
                                                <td className="py-1 px-2 text-gray-600 font-medium">{idx + 1}</td>
                                                <td className="py-1 px-2 text-blue-700 font-medium">
                                                  {standardAnswers[idx] || '-'}
                                                </td>
                                                {hints.some(h => h !== null) && (
                                                  <td className="py-1 px-2 text-purple-600">
                                                    {hints[idx] || '-'}
                                                  </td>
                                                )}
                                                {quiz.alternative_answers && quiz.alternative_answers.length > 0 && (
                                                  <td className="py-1 px-2 text-green-600 text-xs">
                                                    {altAnswers.length > 0 ? altAnswers.join(', ') : '-'}
                                                  </td>
                                                )}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                } else {
                                  // Single blank - inline display with badges
                                  return (
                                    <div className="flex flex-wrap gap-2">
                                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 rounded text-xs">
                                        <span className="font-medium text-blue-900 mr-1">答案:</span>
                                        <span className="text-blue-700">{standardAnswers[0]}</span>
                                      </span>
                                      {hints[0] && (
                                        <span className="inline-flex items-center px-2 py-1 bg-purple-50 rounded text-xs">
                                          <span className="font-medium text-purple-900 mr-1">提示:</span>
                                          <span className="text-purple-700">{hints[0]}</span>
                                        </span>
                                      )}
                                      {quiz.alternative_answers && quiz.alternative_answers.length > 0 && (
                                        <span className="inline-flex items-center px-2 py-1 bg-green-50 rounded text-xs">
                                          <span className="font-medium text-green-900 mr-1">替代:</span>
                                          <span className="text-green-700">{quiz.alternative_answers.join(', ')}</span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          
                          {/* Knowledge Point */}
                          {quiz.knowledgePoint && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Target className="w-4 h-4 mr-2 text-gray-400" />
                              <span>
                                {quiz.knowledgePoint.volume} / {quiz.knowledgePoint.unit} / {quiz.knowledgePoint.lesson} / {quiz.knowledgePoint.topic}
                              </span>
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{quiz.createdAt || '2024-01-15'}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditQuiz(quiz)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-300"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditQuiz(quiz)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-300"
                            title="编辑题目"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {enablePolish && (
                            <button 
                              onClick={() => handlePolishQuiz(quiz)}
                              className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-300"
                              title="润色题目"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}
                          {enableQuizTypeAdjustment && (
                            <button 
                              onClick={() => handleChangeQuizType(quiz)}
                              className="p-2 text-gray-400 hover:text-orange-600 transition-colors duration-300"
                              title="调整题型"
                            >
                              <Shuffle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleRematchKnowledgePoint(quiz)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors duration-300"
                            title="重新匹配知识点"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-300"
                            title="删除题目"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(() => {
                // Calculate filtered pagination info
                let filteredQuizzes = quizzes;
                if (searchTerm) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                    (quiz.knowledgePoint && (
                      quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                    ))
                  );
                }
                if (selectedType !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                }
                if (selectedDifficulty !== 'all') {
                  filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                }
                if (selectedTags.length > 0) {
                  filteredQuizzes = filteredQuizzes.filter(quiz =>
                    quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                  );
                }
                const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                return totalFilteredPages;
              })() > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {(() => {
                    // Calculate filtered pages for pagination buttons
                    let filteredQuizzes = quizzes;
                    if (searchTerm) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                        (quiz.knowledgePoint && (
                          quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                        ))
                      );
                    }
                    if (selectedType !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                    }
                    if (selectedDifficulty !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                    }
                    if (selectedTags.length > 0) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                      );
                    }
                    const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                    
                    return Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg font-medium transition-all duration-300 ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    });
                  })()}
                  
                  {(() => {
                    let filteredQuizzes = quizzes;
                    if (searchTerm) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                        (quiz.knowledgePoint && (
                          quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                        ))
                      );
                    }
                    if (selectedType !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                    }
                    if (selectedDifficulty !== 'all') {
                      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                    }
                    if (selectedTags.length > 0) {
                      filteredQuizzes = filteredQuizzes.filter(quiz =>
                        quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                      );
                    }
                    const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                    
                    return totalFilteredPages > 5 && (
                      <span className="text-gray-400">...</span>
                    );
                  })()}
                  
                  <button
                    onClick={() => {
                      // Calculate max page for filtered results
                      let filteredQuizzes = quizzes;
                      if (searchTerm) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                          (quiz.knowledgePoint && (
                            quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                          ))
                        );
                      }
                      if (selectedType !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                      }
                      if (selectedDifficulty !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                      }
                      if (selectedTags.length > 0) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                        );
                      }
                      const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                      setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1));
                    }}
                    disabled={(() => {
                      let filteredQuizzes = quizzes;
                      if (searchTerm) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                          (quiz.knowledgePoint && (
                            quiz.knowledgePoint.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.knowledgePoint.volume.toLowerCase().includes(searchTerm.toLowerCase())
                          ))
                        );
                      }
                      if (selectedType !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.type === selectedType);
                      }
                      if (selectedDifficulty !== 'all') {
                        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === selectedDifficulty);
                      }
                      if (selectedTags.length > 0) {
                        filteredQuizzes = filteredQuizzes.filter(quiz =>
                          quiz.tags && selectedTags.some(selectedTag => quiz.tags!.includes(selectedTag))
                        );
                      }
                      const totalFilteredPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
                      return currentPage === totalFilteredPages;
                    })()}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <QuizEditModal
        quiz={editingQuiz}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingQuiz(null);
        }}
        onSave={handleSaveQuiz}
        onDelete={(quizId: string) => {
          // Delete the quiz from local state
          setQuizzes(prev => prev.filter(q => q.id !== quizId));
          setShowEditModal(false);
          setEditingQuiz(null);
          console.log('Quiz deleted:', quizId);
        }}
      />

      {/* Polish Modal */}
      {showPolishModal && polishingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">润色题目</h2>
                <button
                  onClick={() => {
                    setShowPolishModal(false);
                    setPolishingQuiz(null);
                    setPolishedContent('');
                    setPolishGuidance('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">原始题目</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {polishingQuiz.question}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  润色指导（可选）
                </label>
                <textarea
                  value={polishGuidance}
                  onChange={(e) => setPolishGuidance(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="例如：让题目更贴近生活场景、增加历史背景、使语言更生动..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  提供具体的润色要求，AI会根据您的指导来优化题目
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  润色后的题目
                  {isPolishing && <span className="ml-2 text-blue-600">（AI正在润色中...）</span>}
                </label>
                <textarea
                  value={polishedContent}
                  onChange={(e) => setPolishedContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="编辑或等待AI润色..."
                />
              </div>
              
              {polishingQuiz.options && polishingQuiz.options.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
                  <div className="space-y-2">
                    {polishingQuiz.options.map((option, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleConfirmPolish}
                disabled={isPolishing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isPolishing ? 'AI润色中...' : 'AI润色'}
              </button>
              <button
                onClick={() => {
                  setShowPolishModal(false);
                  setPolishingQuiz(null);
                  setPolishedContent('');
                  setPolishGuidance('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePolishedQuiz}
                disabled={!polishedContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                保存润色结果
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-match Knowledge Point Modal */}
      {showRematchModal && rematchingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">重新匹配知识点</h2>
                <button
                  onClick={() => {
                    setShowRematchModal(false);
                    setRematchingQuiz(null);
                    setRematchHints({});
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Current Knowledge Point */}
              {rematchingQuiz.knowledgePoint && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">当前知识点</label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">
                      {rematchingQuiz.knowledgePoint.volume} / {rematchingQuiz.knowledgePoint.unit} / {rematchingQuiz.knowledgePoint.lesson}
                    </div>
                    <div className="font-medium text-gray-900">{rematchingQuiz.knowledgePoint.topic}</div>
                  </div>
                </div>
              )}
              
              {/* Target Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">设置匹配范围（留空表示不限制）</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">分册</label>
                    <select
                      value={rematchHints.volume || ''}
                      onChange={async (e) => {
                        const newVolume = e.target.value;
                        setRematchHints({
                          volume: newVolume,
                          unit: '',
                          lesson: '',
                          sub: ''
                        });
                        // Get new options from local data
                        if (newVolume) {
                          const options = getLocalHierarchyOptions({ volume: newVolume });
                          setHierarchyOptions(options);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">全部分册</option>
                      {hierarchyOptions.volumes.map(vol => (
                        <option key={vol} value={vol}>{vol}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">单元</label>
                    <select
                      value={rematchHints.unit || ''}
                      onChange={async (e) => {
                        const newUnit = e.target.value;
                        setRematchHints(prev => ({
                          ...prev,
                          unit: newUnit,
                          lesson: '',
                          sub: ''
                        }));
                        // Get new options from local data
                        if (newUnit) {
                          const options = getLocalHierarchyOptions({ 
                            volume: rematchHints.volume,
                            unit: newUnit 
                          });
                          setHierarchyOptions(options);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!rematchHints.volume}
                    >
                      <option value="">全部单元</option>
                      {hierarchyOptions.units.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">课程</label>
                    <select
                      value={rematchHints.lesson || ''}
                      onChange={async (e) => {
                        const newLesson = e.target.value;
                        setRematchHints(prev => ({
                          ...prev,
                          lesson: newLesson,
                          sub: ''
                        }));
                        // Get new options from local data
                        if (newLesson) {
                          const options = getLocalHierarchyOptions({ 
                            volume: rematchHints.volume,
                            unit: rematchHints.unit,
                            lesson: newLesson 
                          });
                          setHierarchyOptions(options);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!rematchHints.unit}
                    >
                      <option value="">全部课程</option>
                      {hierarchyOptions.lessons.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">子目</label>
                    <select
                      value={rematchHints.sub || ''}
                      onChange={(e) => setRematchHints(prev => ({ ...prev, sub: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={!rematchHints.lesson}
                    >
                      <option value="">全部子目</option>
                      {hierarchyOptions.subs.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Question Preview */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">题目内容</label>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-800">{rematchingQuiz.question}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRematchModal(false);
                  setRematchingQuiz(null);
                  setRematchHints({});
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRematch}
                disabled={isRematching}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRematching ? 'animate-spin' : ''}`} />
                {isRematching ? '匹配中...' : '重新匹配'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type Change Modal */}
      {showTypeModal && typeChangingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">调整题型</h2>
                <button
                  onClick={() => {
                    setShowTypeModal(false);
                    setTypeChangingQuiz(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">当前题型</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQuizTypeColor(typeChangingQuiz.type)}`}>
                    {getQuizTypeLabel(typeChangingQuiz.type)}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择新题型</label>
                <div className="space-y-2">
                  {(['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleConfirmTypeChange(type)}
                      disabled={type === typeChangingQuiz.type}
                      className={`w-full p-3 rounded-lg border transition-all ${
                        type === typeChangingQuiz.type
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getQuizTypeLabel(type)}</span>
                        <Shuffle className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>注意：</strong>调整题型可能会改变题目的选项和答案格式。
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTypeModal(false);
                  setTypeChangingQuiz(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Point Picker Modal */}
      <KnowledgePointPicker
        isOpen={showKnowledgePointPicker}
        onClose={() => setShowKnowledgePointPicker(false)}
        onSelect={(kp) => {
          setEditingQuiz({
            ...editingQuiz!,
            knowledgePointId: kp.id,
            knowledge_point_id: kp.id,
            knowledgePoint: {
              topic: kp.topic,
              lesson: kp.lesson,
              unit: kp.unit,
              volume: kp.volume
            }
          });
          setShowKnowledgePointPicker(false);
        }}
        currentKnowledgePoint={editingQuiz?.knowledgePoint ? {
          id: editingQuiz.knowledgePointId || editingQuiz.knowledge_point_id || '',
          topic: editingQuiz.knowledgePoint.topic,
          lesson: editingQuiz.knowledgePoint.lesson,
          unit: editingQuiz.knowledgePoint.unit,
          volume: editingQuiz.knowledgePoint.volume
        } : undefined}
        knowledgePoints={knowledgePoints}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}