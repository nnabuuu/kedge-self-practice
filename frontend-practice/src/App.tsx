import React, { useState, useEffect } from 'react';
import { Subject, PracticeSession, PracticeHistory } from './types/quiz';
import { Teacher } from './types/teacher';
import { useLocalStorage } from './hooks/useLocalStorage';
import { authService } from './services/authService';
import { api } from './services/api';
import { practiceAnalysisApi } from './services/practiceAnalysisApi';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectionError, useConnectionStatus } from './components/ConnectionError';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import SubjectSelection from './components/SubjectSelection';
import PracticeMenu from './components/PracticeMenu';
import KnowledgePointSelection from './components/KnowledgePointSelection';
import QuizPractice from './components/QuizPractice';
import QuizResults from './components/QuizResults';
import KnowledgeAnalysis from './components/KnowledgeAnalysis';
import PracticeHistoryComponent from './components/PracticeHistory';
import TeacherDashboard from './components/TeacherDashboard';

interface QuizConfig {
  questionType: 'new' | 'with-wrong' | 'wrong-only';
  questionCount: 'unlimited' | number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  showExplanation: boolean;
  quizTypes?: ('single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other')[];
}

type Screen = 
  | 'login'
  | 'home' 
  | 'subject-selection' 
  | 'practice-menu' 
  | 'knowledge-selection' 
  | 'quiz-practice' 
  | 'quiz-results'
  | 'knowledge-analysis'
  | 'practice-history'
  | 'teacher-dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(null);
  // Load saved subject from localStorage on init
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => {
    const saved = localStorage.getItem('lastSelectedSubject');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<string[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    questionType: 'new',
    questionCount: 20,
    shuffleQuestions: true,
    showExplanation: true
  });
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [practiceHistory, setPracticeHistory] = useLocalStorage<PracticeHistory[]>('practice-history', []);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isOnline, backendStatus } = useConnectionStatus();
  const [isNavigatingHistory, setIsNavigatingHistory] = useState(false);
  const [practiceSessionId, setPracticeSessionId] = useState<string | undefined>(undefined);

  // Check for existing authentication on app start
  useEffect(() => {
    let targetScreen: Screen = 'login';
    
    const existingUser = authService.getCurrentUser();
    if (existingUser && authService.isAuthenticated()) {
      setUserType(existingUser.role);
      setCurrentUser(existingUser);
      
      // Fetch fresh profile data
      authService.getUserProfile().then(response => {
        if (response.success && response.data) {
          setCurrentUser(response.data);
          
          // Restore last accessed subject from preferences if not already set
          if (!selectedSubject && response.data.preferences?.lastAccessedSubject) {
            const lastSubject = response.data.preferences.lastAccessedSubject;
            // Only restore if it was accessed recently (within last 7 days)
            const lastAccessDate = new Date(lastSubject.timestamp);
            const daysSinceAccess = (Date.now() - lastAccessDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceAccess < 7) {
              setSelectedSubject({
                id: lastSubject.id,
                name: lastSubject.name,
                icon: '📚', // Default icon, will be updated when subject selection is shown
                color: 'blue' // Default color
              });
            }
          }
        }
      });
      
      // Preload ALL practice analysis data for students
      if (existingUser.role === 'student') {
        practiceAnalysisApi.preloadAllData().then(results => {
          console.log('Practice analysis data preloaded on app start:', {
            hasWeakPoints: !!results.weakPoints,
            hasWrongQuestions: !!results.wrongQuestions,
            hasQuickSuggestion: !!results.quickSuggestion
          });
        }).catch(error => {
          console.error('Failed to preload practice analysis on start:', error);
        });
      }
      
      // Check if there's a saved screen preference (for page refresh)
      const savedScreen = sessionStorage.getItem('currentScreen');
      if (savedScreen && savedScreen !== 'login') {
        // Restore the previous screen if it exists
        targetScreen = savedScreen as Screen;
        setCurrentScreen(targetScreen);
        
        // Also restore subject if it was saved
        const savedSubject = sessionStorage.getItem('selectedSubject');
        if (savedSubject) {
          try {
            setSelectedSubject(JSON.parse(savedSubject));
          } catch (e) {
            console.error('Failed to restore subject:', e);
          }
        }
      } else {
        // Default behavior: students go to home, teachers get a choice
        targetScreen = 'home';
        setCurrentScreen('home');
      }
    }
    
    // Set initial browser history entry for the first page load
    // This ensures we always have a valid state when going back
    const initialState = {
      screen: targetScreen,
      subject: selectedSubject,
      knowledgePoints: selectedKnowledgePoints || []
    };
    window.history.replaceState(initialState, '', `#${targetScreen}`);
  }, []);

  // Save current screen to session storage when it changes
  useEffect(() => {
    if (currentScreen !== 'login') {
      sessionStorage.setItem('currentScreen', currentScreen);
    }
  }, [currentScreen]);

  // Save selected subject to localStorage whenever it changes (persists across sessions)
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem('lastSelectedSubject', JSON.stringify(selectedSubject));
    }
  }, [selectedSubject]);

  // Fetch subject information when we have a practiceSessionId but no selectedSubject
  useEffect(() => {
    if (practiceSessionId && !selectedSubject && currentScreen === 'quiz-practice') {
      // Fetch session data to get subject_id
      api.practice.getSession(practiceSessionId).then(response => {
        if (response.success && response.data?.session?.subject_id) {
          // Fetch all subjects and find the matching one
          api.subjects.getAll().then(subjectsResponse => {
            if (subjectsResponse.success && subjectsResponse.data) {
              const matchingSubject = subjectsResponse.data.find(
                s => s.id === response.data.session.subject_id
              );
              if (matchingSubject) {
                setSelectedSubject(matchingSubject);
              } else {
                // If no matching subject found, set a default one
                // This ensures QuizPractice component renders
                setSelectedSubject({
                  id: response.data.session.subject_id || 'unknown',
                  name: '练习',
                  icon: '📚',
                  color: 'blue'
                });
              }
            }
          });
        } else if (!response.data?.session?.subject_id) {
          // If session doesn't have subject_id, try to infer from knowledge points
          // or set a default subject to allow component to render
          setSelectedSubject({
            id: 'default',
            name: '练习',
            icon: '📚',
            color: 'blue'
          });
        }
      }).catch(error => {
        console.error('Failed to fetch session for subject:', error);
        // Set a default subject to prevent blank page
        setSelectedSubject({
          id: 'default',
          name: '练习',
          icon: '📚',
          color: 'blue'
        });
      });
    }
  }, [practiceSessionId, selectedSubject, currentScreen]);

  // Navigate to a screen and update browser history
  const navigateToScreen = (screen: Screen, updateHistory = true) => {
    if (screen === currentScreen) return;
    
    setCurrentScreen(screen);
    
    // Update browser history when not navigating via browser buttons
    if (updateHistory && !isNavigatingHistory) {
      const state = {
        screen,
        subject: selectedSubject,
        knowledgePoints: selectedKnowledgePoints
      };
      const url = `#${screen}`;
      window.history.pushState(state, '', url);
    }
  };

  // Handle browser back/forward button navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setIsNavigatingHistory(true);
      
      if (event.state) {
        // Restore state from history
        setCurrentScreen(event.state.screen);
        if (event.state.subject !== undefined) {
          setSelectedSubject(event.state.subject);
        }
        if (event.state.knowledgePoints !== undefined) {
          setSelectedKnowledgePoints(event.state.knowledgePoints);
        }
      } else {
        // Handle initial page or when state is null
        // This happens when we go back to the very first page load
        const hash = window.location.hash.slice(1) as Screen;
        if (hash && ['login', 'home', 'subject-selection', 'practice-menu', 'knowledge-selection', 
                     'quiz-practice', 'quiz-results', 'knowledge-analysis', 'practice-history', 
                     'teacher-dashboard'].includes(hash)) {
          setCurrentScreen(hash);
        } else if (authService.isAuthenticated()) {
          // If authenticated but no hash, go to home
          setCurrentScreen('home');
        } else {
          // Not authenticated and no hash, go to login
          setCurrentScreen('login');
        }
      }
      
      setTimeout(() => setIsNavigatingHistory(false), 100);
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  

  const handleLogin = async (type: 'student' | 'teacher', userData: any) => {
    setUserType(type);
    setCurrentUser(userData);
    
    // Fetch fresh user profile data after login
    authService.getUserProfile().then(response => {
      if (response.success && response.data) {
        setCurrentUser(response.data);
      }
    }).catch(error => {
      console.error('Failed to fetch user profile:', error);
    });
    
    // Preload ALL practice analysis data for students during login
    if (type === 'student') {
      // Load all data in parallel and cache it
      practiceAnalysisApi.preloadAllData().then(results => {
        console.log('Practice analysis data preloaded:', {
          hasWeakPoints: !!results.weakPoints,
          hasWrongQuestions: !!results.wrongQuestions,
          hasQuickSuggestion: !!results.quickSuggestion
        });
        
        // If we have quick suggestion data, also update user preferences
        if (results.quickSuggestion?.knowledge_point_ids?.length > 0) {
          authService.updatePreference('cachedQuickPractice', {
            knowledgePoints: results.quickSuggestion.knowledge_point_ids,
            timestamp: new Date().toISOString()
          }).catch(() => {
            // Silently fail - not critical
          });
        }
      }).catch(error => {
        console.error('Failed to preload practice analysis:', error);
      });
    }
    
    // Both students and teachers go to home page after login
    navigateToScreen('home');
  };

  const handleLogout = () => {
    authService.logout();
    practiceAnalysisApi.clearCache(); // Clear cached practice data
    setUserType(null);
    setCurrentUser(null);
    navigateToScreen('login');
    // Keep the selected subject even after logout (user preference)
    // setSelectedSubject(null);  // Commented out to preserve subject selection
    setCurrentSession(null);
    // Clear session storage
    sessionStorage.removeItem('currentScreen');
    // Note: We keep lastSelectedSubject in localStorage
  };

  const handleStartPractice = () => {
    // Always go to subject selection when starting from home page
    // This ensures users can choose or change their subject
    navigateToScreen('subject-selection');
  };

  const handleTeacherLogin = () => {
    if (userType === 'teacher') {
      // Go to teacher dashboard with the last selected subject if available
      navigateToScreen('teacher-dashboard');
    }
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    
    // Only navigate to practice menu if we're on subject selection page
    // If already on practice menu, just update the subject
    if (currentScreen === 'subject-selection') {
      navigateToScreen('practice-menu');
    }
    
    // Clear practice analysis cache when switching subjects to get fresh data
    practiceAnalysisApi.clearCache();
    
    // Reload practice analysis data for the new subject
    if (authService.isAuthenticated()) {
      practiceAnalysisApi.preloadAllData().then(results => {
        console.log('Practice analysis data reloaded for new subject:', {
          hasWeakPoints: !!results.weakPoints,
          hasWrongQuestions: !!results.wrongQuestions,
          hasQuickSuggestion: !!results.quickSuggestion
        });
      }).catch(error => {
        console.error('Failed to reload practice analysis:', error);
      });
      
      // Update user preference for last accessed subject
      authService.updatePreference('lastAccessedSubject', {
        id: subject.id,
        name: subject.name,
        timestamp: new Date().toISOString()
      }).catch(error => {
        console.error('Failed to update subject preference:', error);
      });
    }
  };

  const handleStartPracticeSession = () => {
    setSelectedKnowledgePoints([]);
    navigateToScreen('knowledge-selection');
  };

  const handleViewHistory = () => {
    navigateToScreen('practice-history');
  };

  const handleViewKnowledgeAnalysis = () => {
    navigateToScreen('knowledge-analysis');
  };

  const handleStartQuiz = (knowledgePoints: string[], config: QuizConfig) => {
    setSelectedKnowledgePoints(knowledgePoints);
    setQuizConfig(config);
    setPracticeSessionId(undefined); // Clear any previous session ID
    navigateToScreen('quiz-practice');
  };
  
  // Handler for quick practice (5-10 min with last knowledge points)
  const handleQuickPractice = (knowledgePoints: string[], questionCount: number) => {
    setSelectedKnowledgePoints(knowledgePoints);
    setQuizConfig({
      questionType: 'new',
      questionCount: questionCount,
      shuffleQuestions: true,
      showExplanation: true
    });
    navigateToScreen('quiz-practice');
  };
  
  // Handler for weak points practice
  const handleWeakPointsPractice = (knowledgePoints: string[]) => {
    setSelectedKnowledgePoints(knowledgePoints);
    setQuizConfig({
      questionType: 'new',
      questionCount: 15, // Medium length for reinforcement
      shuffleQuestions: true,
      showExplanation: true
    });
    navigateToScreen('quiz-practice');
  };
  
  // Handler for session-based quick practice
  const handleQuickPracticeSession = async (sessionId: string) => {
    try {
      setPracticeSessionId(sessionId);
      navigateToScreen('quiz-practice');
    } catch (error) {
      console.error('Failed to start quick practice session:', error);
      alert('启动快速练习失败，请重试。');
    }
  };
  
  // Handler for session-based weak points practice
  const handleWeakPointsSession = async (sessionId: string) => {
    try {
      setPracticeSessionId(sessionId);
      navigateToScreen('quiz-practice');
    } catch (error) {
      console.error('Failed to start weak points session:', error);
      alert('启动薄弱知识点练习失败，请重试。');
    }
  };
  
  // Handler for wrong questions practice
  const handleWrongQuestionsPractice = async (questionIds: string[]) => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        alert('请先登录后再使用错题练习功能。');
        navigateToScreen('login');
        return;
      }
      
      // Get all knowledge points for the subject to include in the session
      const kpResponse = await api.knowledgePoints.getBySubject(selectedSubject?.id || 'history');
      const knowledgePointIds = kpResponse.success && kpResponse.data 
        ? kpResponse.data.map(kp => kp.id)
        : ['kp_1']; // Fallback to at least one knowledge point
      
      // Create a wrong questions practice session using the backend API with question_type filter
      const response = await api.practice.createSession({
        subject_id: selectedSubject?.id,
        knowledge_point_ids: knowledgePointIds,
        question_count: 20,
        strategy: 'review',
        shuffle_questions: false,
        quiz_types: ['single-choice', 'multiple-choice', 'fill-in-the-blank', 'subjective', 'other'],
        question_type: 'wrong-only' // This will filter to only wrong questions
      });
      
      if (!response.success && response.error?.includes('Authentication required')) {
        alert('请先登录后再使用错题练习功能。');
        navigateToScreen('login');
        return;
      }
      
      if (response.success && response.data) {
        const { session, quizzes } = response.data;
        
        if (quizzes.length === 0) {
          alert('暂无错题记录。请先完成几次练习后再使用此功能。');
          return;
        }
        
        // Set the current session with the wrong questions
        setCurrentSession({
          id: session.id,
          questions: quizzes,
          answers: [],
          startTime: new Date(),
          config: {
            questionTypes: ['single-choice', 'multiple-choice', 'true-false', 'fill-blank'],
            questionCount: quizzes.length,
            timeLimit: undefined, // No time limit for review
            shuffleQuestions: false,
            strategy: 'review'
          },
          answeredQuestions: 0,
          totalQuestions: quizzes.length,
          correctAnswers: 0,
          incorrectAnswers: 0,
          score: 0,
          status: 'pending'
        });
        
        navigateToScreen('quiz-practice');
      } else {
        // If no wrong questions found or error occurred
        alert(response.error || '暂无错题记录。请先完成几次练习后再使用此功能。');
      }
    } catch (error) {
      console.error('Failed to create wrong questions session:', error);
      alert('创建错题练习失败，请稍后重试。');
    }
  };

  const handleEndPractice = (session: PracticeSession) => {
    setCurrentSession(session);
    setPracticeSessionId(undefined); // Clear the session ID after practice ends
    
    // Automatically save to history when practice completes
    if (selectedSubject) {
      // Use backend statistics if available, otherwise calculate locally
      const correctAnswers = session.correctAnswers !== undefined 
        ? session.correctAnswers
        : session.answers.filter(
            (answer, index) => answer === session.questions[index]?.answer
          ).length;
      
      const wrongAnswers = session.incorrectAnswers !== undefined
        ? session.incorrectAnswers
        : session.answers.filter(
            (answer, index) => answer !== null && answer !== session.questions[index]?.answer
          ).length;
      
      const totalQuestions = session.questions.length;
      const completionRate = totalQuestions > 0 
        ? Math.round((session.answers.filter(a => a !== null).length / totalQuestions) * 100) 
        : 0;
      
      const duration = session.endTime && session.startTime 
        ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
        : 0;
      
      const historyEntry: PracticeHistory = {
        id: session.id,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        knowledgePoints: session.knowledgePoints,
        questions: session.questions,
        answers: session.answers,
        questionDurations: session.questionDurations,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        completionRate,
        date: session.endTime || new Date(),
        duration
      };
      
      // Add to history (newest first)
      setPracticeHistory(prev => [historyEntry, ...prev]);
      
      // Update user preferences with practice statistics
      if (authService.isAuthenticated()) {
        authService.updatePreference('practiceStats', {
          lastPracticeDate: new Date().toISOString(),
          lastSubjectId: selectedSubject.id,
          lastKnowledgePoints: session.knowledgePoints,
          totalSessions: (practiceHistory.length + 1),
          recentAccuracy: Math.round((correctAnswers / totalQuestions) * 100)
        }).catch(error => {
          console.error('Failed to update practice stats:', error);
        });
      }
    }
    
    navigateToScreen('quiz-results');
  };

  const handleReturnToMenu = () => {
    setCurrentSession(null);
    navigateToScreen('practice-menu');
  };

  const handleRetryQuiz = () => {
    navigateToScreen('quiz-practice');
  };

  const handleEnhancementRound = (knowledgePoints: string[]) => {
    setSelectedKnowledgePoints(knowledgePoints);
    navigateToScreen('knowledge-selection');
  };

  const handleDeleteHistory = (historyId: string) => {
    setPracticeHistory(prev => prev.filter(h => h.id !== historyId));
  };

  const handleSaveToHistory = () => {
    if (currentSession && selectedSubject) {
      // Check if already saved (prevent duplicates)
      const alreadySaved = practiceHistory.some(h => h.id === currentSession.id);
      if (alreadySaved) {
        return;
      }
      
      // Use backend statistics if available, otherwise calculate locally
      const correctAnswers = currentSession.correctAnswers !== undefined 
        ? currentSession.correctAnswers
        : currentSession.answers.filter(
            (answer, index) => answer === currentSession.questions[index]?.answer
          ).length;
      
      const wrongAnswers = currentSession.incorrectAnswers !== undefined
        ? currentSession.incorrectAnswers
        : currentSession.answers.filter(
            (answer, index) => answer !== null && answer !== currentSession.questions[index]?.answer
          ).length;

      const completionRate = Math.round((currentSession.answers.filter(a => a !== null).length / currentSession.questions.length) * 100);
      
      const duration = currentSession.endTime 
        ? Math.round((currentSession.endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60))
        : 0;

      const historyEntry: PracticeHistory = {
        id: currentSession.id,
        subjectId: currentSession.subjectId,
        subjectName: selectedSubject.name,
        knowledgePoints: currentSession.knowledgePoints,
        questions: currentSession.questions,
        answers: currentSession.answers,
        questionDurations: currentSession.questionDurations,
        totalQuestions: currentSession.questions.length,
        correctAnswers,
        wrongAnswers,
        completionRate,
        date: currentSession.endTime || new Date(),
        duration
      };

      // 添加到历史记录（最新的在前面）
      setPracticeHistory(prev => [historyEntry, ...prev]);
    }
  };

  const handleBack = () => {
    switch (currentScreen) {
      case 'subject-selection':
        navigateToScreen('home');
        break;
      case 'practice-menu':
        navigateToScreen('subject-selection');
        break;
      case 'knowledge-selection':
        navigateToScreen('practice-menu');
        break;
      case 'quiz-practice':
        navigateToScreen('knowledge-selection');
        break;
      case 'quiz-results':
        // 保存到历史记录并返回菜单
        handleSaveToHistory();
        navigateToScreen('practice-menu');
        break;
      case 'knowledge-analysis':
        navigateToScreen('practice-menu');
        break;
      case 'practice-history':
        navigateToScreen('practice-menu');
        break;
      case 'teacher-dashboard':
        navigateToScreen('home');
        break;
      default:
        navigateToScreen('home');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginPage onLogin={handleLogin} />
        );
      
      case 'home':
        return (
          <HomePage 
            onStartPractice={handleStartPractice}
            onTeacherLogin={userType === 'teacher' ? handleTeacherLogin : undefined}
            onLogout={handleLogout}
            currentUser={currentUser}
            userType={userType}
          />
        );
      
      case 'subject-selection':
        return (
          <SubjectSelection 
            onSelectSubject={handleSelectSubject}
            onBack={handleBack}
            currentSubject={selectedSubject}
          />
        );
      
      case 'practice-menu':
        return selectedSubject ? (
          <PracticeMenu
            subject={selectedSubject}
            currentUser={currentUser}
            onStartPractice={handleStartPracticeSession}
            onQuickPractice={handleQuickPractice}
            onWeakPointsPractice={handleWeakPointsPractice}
            onWrongQuestionsPractice={handleWrongQuestionsPractice}
            onQuickPracticeSession={handleQuickPracticeSession}
            onWeakPointsSession={handleWeakPointsSession}
            onViewHistory={handleViewHistory}
            onViewKnowledgeAnalysis={handleViewKnowledgeAnalysis}
            onBack={handleBack}
            onSelectSubject={handleSelectSubject}
          />
        ) : null;
      
      case 'knowledge-selection':
        return selectedSubject ? (
          <KnowledgePointSelection
            subject={selectedSubject}
            preSelectedPoints={selectedKnowledgePoints}
            onStartQuiz={handleStartQuiz}
            onBack={handleBack}
          />
        ) : null;
      
      case 'quiz-practice':
        return selectedSubject ? (
          <QuizPractice
            subject={selectedSubject}
            selectedKnowledgePoints={selectedKnowledgePoints}
            config={quizConfig}
            practiceSessionId={practiceSessionId}
            onEndPractice={handleEndPractice}
            onBack={handleBack}
          />
        ) : null;
      
      case 'quiz-results':
        return selectedSubject && currentSession ? (
          <QuizResults
            subject={selectedSubject}
            session={currentSession}
            onReturnToMenu={handleReturnToMenu}
            onRetryQuiz={handleRetryQuiz}
            onEnhancementRound={handleEnhancementRound}
            onViewHistory={() => {
              handleSaveToHistory();
              navigateToScreen('practice-history');
            }}
            onViewKnowledgeAnalysis={() => {
              handleSaveToHistory();
              navigateToScreen('knowledge-analysis');
            }}
            onReturnHome={() => {
              handleSaveToHistory();
              navigateToScreen('home');
            }}
          />
        ) : null;
      
      case 'knowledge-analysis':
        return selectedSubject ? (
          <KnowledgeAnalysis
            subject={selectedSubject}
            history={practiceHistory}
            onBack={handleBack}
            onEnhancementRound={handleEnhancementRound}
          />
        ) : null;
      
      case 'practice-history':
        return selectedSubject ? (
          <PracticeHistoryComponent
            subject={selectedSubject}
            history={practiceHistory}
            onBack={handleBack}
            onEnhancementRound={handleEnhancementRound}
            onDeleteHistory={handleDeleteHistory}
          />
        ) : null;
      
      case 'teacher-dashboard':
        return userType === 'teacher' && currentUser ? (
          <TeacherDashboard
            teacher={currentUser}
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
            onBack={handleBack}
          />
        ) : null;
      
      default:
        return (
          <LoginPage onLogin={handleLogin} />
        );
    }
  };

  // Handle API errors globally
  const handleApiError = (error: string) => {
    setApiError(error);
    setRetryCount(prev => prev + 1);
  };

  const handleRetryConnection = async () => {
    setApiError(null);
    setRetryCount(0);
    
    // Check if backend is actually available
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL?.endsWith('/v1')
        ? import.meta.env.VITE_API_BASE_URL
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1`;
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        // Backend is available, reload the page to reset all states
        window.location.reload();
      } else {
        // Backend still not available
        setApiError('后端服务仍不可用');
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      // Network error or backend not running
      setApiError('无法连接到后端服务');
      setRetryCount(prev => prev + 1);
    }
  };

  // Show connection error if backend is offline
  if (!isOnline || backendStatus === 'offline' || apiError) {
    return (
      <ErrorBoundary>
        <div className="App min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <ConnectionError
            error={apiError || (!isOnline ? '网络连接已断开' : '后端服务不可用')}
            onRetry={handleRetryConnection}
            retryCount={retryCount}
            maxRetries={3}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {renderScreen()}
      </div>
    </ErrorBoundary>
  );
}

export default App;