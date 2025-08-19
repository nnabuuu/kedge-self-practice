import React, { useState, useEffect } from 'react';
import { Subject, PracticeSession, PracticeHistory } from './types/quiz';
import { Teacher } from './types/teacher';
import { useLocalStorage } from './hooks/useLocalStorage';
import { authService } from './services/authService';
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

  // Check for existing authentication on app start
  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser && authService.isAuthenticated()) {
      setUserType(existingUser.role);
      setCurrentUser(existingUser);
      
      // Check if there's a saved screen preference (for page refresh)
      const savedScreen = sessionStorage.getItem('currentScreen');
      if (savedScreen && savedScreen !== 'login') {
        // Restore the previous screen if it exists
        setCurrentScreen(savedScreen as Screen);
        
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
        if (existingUser.role === 'student') {
          setCurrentScreen('home');
        } else if (existingUser.role === 'teacher') {
          // For teachers, default to home so they can choose where to go
          setCurrentScreen('home');
        } else {
          setCurrentScreen('home');
        }
      }
    }
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

  const handleLogin = (type: 'student' | 'teacher', userData: any) => {
    setUserType(type);
    setCurrentUser(userData);
    // Auto-route teachers to teacher dashboard, students to home
    setCurrentScreen(type === 'teacher' ? 'teacher-dashboard' : 'home');
  };

  const handleLogout = () => {
    authService.logout();
    setUserType(null);
    setCurrentUser(null);
    setCurrentScreen('login');
    // Keep the selected subject even after logout (user preference)
    // setSelectedSubject(null);  // Commented out to preserve subject selection
    setCurrentSession(null);
    // Clear session storage
    sessionStorage.removeItem('currentScreen');
    // Note: We keep lastSelectedSubject in localStorage
  };

  const handleStartPractice = () => {
    // If we have a saved subject, go directly to practice menu
    if (selectedSubject) {
      setCurrentScreen('practice-menu');
    } else {
      // Otherwise, go to subject selection
      setCurrentScreen('subject-selection');
    }
  };

  const handleTeacherLogin = () => {
    if (userType === 'teacher') {
      // Go to teacher dashboard with the last selected subject if available
      setCurrentScreen('teacher-dashboard');
    }
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setCurrentScreen('practice-menu');
  };

  const handleStartPracticeSession = () => {
    setSelectedKnowledgePoints([]);
    setCurrentScreen('knowledge-selection');
  };

  const handleViewHistory = () => {
    setCurrentScreen('practice-history');
  };

  const handleViewKnowledgeAnalysis = () => {
    setCurrentScreen('knowledge-analysis');
  };

  const handleStartQuiz = (knowledgePoints: string[], config: QuizConfig) => {
    setSelectedKnowledgePoints(knowledgePoints);
    setQuizConfig(config);
    setCurrentScreen('quiz-practice');
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
    setCurrentScreen('quiz-practice');
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
    setCurrentScreen('quiz-practice');
  };
  
  // Handler for wrong questions practice
  const handleWrongQuestionsPractice = (questionIds: string[]) => {
    // TODO: This needs a different approach - we need to load specific questions by ID
    // For now, we'll alert the user that this feature is coming soon
    alert('错题复习功能即将上线，敬请期待！');
  };

  const handleEndPractice = (session: PracticeSession) => {
    setCurrentSession(session);
    
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
      console.log('📝 [DEBUG] Practice saved to history:', historyEntry);
    }
    
    setCurrentScreen('quiz-results');
  };

  const handleReturnToMenu = () => {
    setCurrentSession(null);
    setCurrentScreen('practice-menu');
  };

  const handleRetryQuiz = () => {
    setCurrentScreen('quiz-practice');
  };

  const handleEnhancementRound = (knowledgePoints: string[]) => {
    setSelectedKnowledgePoints(knowledgePoints);
    setCurrentScreen('knowledge-selection');
  };

  const handleDeleteHistory = (historyId: string) => {
    setPracticeHistory(prev => prev.filter(h => h.id !== historyId));
  };

  const handleSaveToHistory = () => {
    if (currentSession && selectedSubject) {
      // Check if already saved (prevent duplicates)
      const alreadySaved = practiceHistory.some(h => h.id === currentSession.id);
      if (alreadySaved) {
        console.log('📝 [DEBUG] Practice already in history, skipping save');
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
      console.log('📝 [DEBUG] Practice saved to history from handleSaveToHistory:', historyEntry);
    }
  };

  const handleBack = () => {
    switch (currentScreen) {
      case 'subject-selection':
        setCurrentScreen('home');
        break;
      case 'practice-menu':
        setCurrentScreen('subject-selection');
        break;
      case 'knowledge-selection':
        setCurrentScreen('practice-menu');
        break;
      case 'quiz-practice':
        setCurrentScreen('knowledge-selection');
        break;
      case 'quiz-results':
        // 保存到历史记录并返回菜单
        handleSaveToHistory();
        setCurrentScreen('practice-menu');
        break;
      case 'knowledge-analysis':
        setCurrentScreen('practice-menu');
        break;
      case 'practice-history':
        setCurrentScreen('practice-menu');
        break;
      case 'teacher-dashboard':
        setCurrentScreen('home');
        break;
      default:
        setCurrentScreen('home');
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
            onStartPractice={handleStartPracticeSession}
            onQuickPractice={handleQuickPractice}
            onWeakPointsPractice={handleWeakPointsPractice}
            onWrongQuestionsPractice={handleWrongQuestionsPractice}
            onViewHistory={handleViewHistory}
            onViewKnowledgeAnalysis={handleViewKnowledgeAnalysis}
            onBack={handleBack}
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

  const handleRetryConnection = () => {
    setApiError(null);
    setRetryCount(0);
    // Force re-render of current screen
    const temp = currentScreen;
    setCurrentScreen('login');
    setTimeout(() => setCurrentScreen(temp), 0);
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