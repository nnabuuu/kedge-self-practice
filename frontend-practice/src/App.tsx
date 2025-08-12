import React, { useState, useEffect } from 'react';
import { Subject, PracticeSession, PracticeHistory } from './types/quiz';
import { Teacher } from './types/teacher';
import { useLocalStorage } from './hooks/useLocalStorage';
import { authService } from './services/authService';
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
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<string[]>([]);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    questionType: 'new',
    questionCount: 20,
    shuffleQuestions: true,
    showExplanation: true
  });
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [practiceHistory, setPracticeHistory] = useLocalStorage<PracticeHistory[]>('practice-history', []);

  // Check for existing authentication on app start
  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    if (existingUser && authService.isAuthenticated()) {
      setUserType(existingUser.role);
      setCurrentUser(existingUser);
      setCurrentScreen('home');
    }
  }, []);

  const handleLogin = (type: 'student' | 'teacher', userData: any) => {
    setUserType(type);
    setCurrentUser(userData);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    authService.logout();
    setUserType(null);
    setCurrentUser(null);
    setCurrentScreen('login');
    setSelectedSubject(null);
    setCurrentSession(null);
  };

  const handleStartPractice = () => {
    setCurrentScreen('subject-selection');
  };

  const handleTeacherLogin = () => {
    if (userType === 'teacher') {
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

  const handleEndPractice = (session: PracticeSession) => {
    setCurrentSession(session);
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
      // 计算练习统计
      const correctAnswers = currentSession.answers.filter(
        (answer, index) => answer === currentSession.questions[index]?.answer
      ).length;
      
      const wrongAnswers = currentSession.answers.filter(
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
          />
        );
      
      case 'practice-menu':
        return selectedSubject ? (
          <PracticeMenu
            subject={selectedSubject}
            onStartPractice={handleStartPracticeSession}
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
            onBack={handleBack}
          />
        ) : null;
      
      default:
        return (
          <LoginPage onLogin={handleLogin} />
        );
    }
  };

  return (
    <div className="App">
      {renderScreen()}
    </div>
  );
}

export default App;