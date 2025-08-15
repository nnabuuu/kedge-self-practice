import React, { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { ParseResults } from './components/ParseResults';
import { QuizDisplay } from './components/QuizDisplay';
import { KnowledgePointMatching } from './components/KnowledgePointMatching';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { 
  uploadDocxFileWithImages, 
  extractQuizFromParagraphsLocal,
  batchSubmitQuizzesWithKnowledgePoints 
} from './services/localQuizService';
import { getAuthToken, setAuthToken } from './services/api';
import { exportToExcel } from './utils/exportUtils';
import { ParagraphData, QuizItem, QuizWithKnowledgePoint, UploadStatus } from './types/quiz';
import { BookOpen, ArrowRight, Download, User, LogOut, AlertCircle, Upload } from 'lucide-react';

function App() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [parseResults, setParseResults] = useState<ParagraphData[]>([]);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [imageMapping, setImageMapping] = useState<Record<string, string>>({});
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizWithKnowledgePoints, setQuizWithKnowledgePoints] = useState<QuizWithKnowledgePoint[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'parse' | 'quiz' | 'knowledge-point' | 'final'>('upload');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check for shared token from URL parameters (from frontend-practice)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedToken = urlParams.get('token');
    
    if (sharedToken) {
      // Store the shared token and sync with API service
      setAuthToken(sharedToken);
      
      // Get shared user data
      const sharedUserData = localStorage.getItem('shared_user_data');
      if (sharedUserData) {
        const userData = JSON.parse(sharedUserData);
        setCurrentUser(userData);
        setIsAuthenticated(true);
        
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
        
        console.log('Successfully authenticated via shared token from frontend-practice');
      }
    } else {
      // Check for existing authentication
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        
        // Try to get user data from local storage
        const userData = localStorage.getItem('user_data');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } else {
        // Check for shared token in localStorage
        const sharedToken = localStorage.getItem('shared_jwt_token');
        const sharedUserData = localStorage.getItem('shared_user_data');
        
        if (sharedToken && sharedUserData) {
          setAuthToken(sharedToken);
          const userData = JSON.parse(sharedUserData);
          setCurrentUser(userData);
          setIsAuthenticated(true);
          console.log('Authenticated using shared token from localStorage');
        }
      }
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    // Check authentication
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setUploadStatus({
        status: 'uploading',
        progress: 25,
        message: '正在上传文件...',
      });

      // Use backend with image support
      const response = await uploadDocxFileWithImages(file);
      const results = response.paragraphs;
      const images = response.images;
      const imageMap = response.imageMapping;
      
      console.log('=== Upload Response Debug ===');
      console.log('Paragraphs:', results);
      console.log('Images (legacy):', images);
      console.log('Image Mapping (UUID):', imageMap);
      console.log('Extracted Images:', response.extractedImages);
      
      setUploadStatus({
        status: 'processing',
        progress: 75,
        message: '正在处理文档...',
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      setParseResults(Array.isArray(results) ? results : []);
      setExtractedImages(images);
      setImageMapping(imageMap);
      setUploadStatus({
        status: 'success',
        progress: 100,
        message: '文档处理成功！',
      });
      
      setCurrentStep('parse');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : '上传失败',
      });
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setUploadStatus({
        status: 'processing',
        progress: 50,
        message: '正在生成题目...',
      });

      // Use backend with image support
      let items = await extractQuizFromParagraphsLocal(parseResults, extractedImages);
      
      console.log('=== Quiz Generation Debug ===');
      console.log('Generated quiz items:', items);
      console.log('Image mapping available:', imageMapping);
      
      // Don't add images array to items - they should use imageMapping instead
      // items = items.map(item => ({
      //   ...item,
      //   images: extractedImages
      // }));
      
      setQuizItems(items);
      setUploadStatus({
        status: 'success',
        progress: 100,
        message: '题目生成成功！',
      });
      
      setCurrentStep('quiz');
    } catch (error) {
      console.error('Quiz generation error:', error);
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : '题目生成失败',
      });
    }
  };

  const handleKnowledgePointComplete = async (quizWithKnowledgePoints: QuizWithKnowledgePoint[]) => {
    setQuizWithKnowledgePoints(quizWithKnowledgePoints);
    
    // Submit to backend
    try {
      setUploadStatus({
        status: 'processing',
        progress: 50,
        message: '正在提交题目到后端...',
      });

      const result = await batchSubmitQuizzesWithKnowledgePoints(quizWithKnowledgePoints);
      
      if (result.success) {
        setUploadStatus({
          status: 'success',
          progress: 100,
          message: `成功提交 ${result.successCount} 道题目到后端！`,
        });
      } else {
        setUploadStatus({
          status: 'error',
          progress: 0,
          message: `提交失败：${result.failCount} 道题目失败`,
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : '提交失败',
      });
    }
    
    setCurrentStep('final');
  };

  const handleBackToQuiz = () => {
    setCurrentStep('quiz');
  };

  const handleProceedToKnowledgePoint = () => {
    setCurrentStep('knowledge-point');
  };

  const handleReset = () => {
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: '',
    });
    setParseResults([]);
    setExtractedImages([]);
    setImageMapping({});
    setQuizItems([]);
    setQuizWithKnowledgePoints([]);
    setCurrentStep('upload');
  };

  const handleExportToExcel = () => {
    exportToExcel(quizWithKnowledgePoints);
  };

  const handleQuizItemUpdate = (index: number, updatedItem: QuizItem) => {
    setQuizItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = updatedItem;
      return newItems;
    });
  };

  const handleAuthSuccess = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    handleReset();
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', label: '上传文档', active: currentStep === 'upload' },
      { id: 'parse', label: '解析结果', active: currentStep === 'parse' },
      { id: 'quiz', label: '生成题目', active: currentStep === 'quiz' },
      { id: 'knowledge-point', label: '匹配知识点', active: currentStep === 'knowledge-point' },
      { id: 'final', label: '完成', active: currentStep === 'final' },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center space-x-2 ${
              step.active ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.active 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <span className="font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="w-5 h-5 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with Auth Status */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">题库解析系统</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auth Status */}
              {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {currentUser?.name || currentUser?.email || '已登录'}
                      {currentUser?.role && (
                        <span className="ml-1 text-xs text-blue-600">
                          ({currentUser.role === 'teacher' ? '教师' : '学生'})
                        </span>
                      )}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4" />
                      退出
                    </button>
                  </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <User className="w-4 h-4" />
                  登录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {renderStepIndicator()}

        {/* Authentication Warning */}
        {!isAuthenticated && currentStep === 'upload' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-800">
                需要先登录才能使用系统。请点击右上角登录按钮进行认证。
              </p>
            </div>
          </div>
        )}

        {/* Image Support Notice */}
        {extractedImages.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              已提取 {extractedImages.length} 张图片，将在题目中显示。
            </p>
          </div>
        )}

        {currentStep === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <FileUploader 
              onUpload={handleFileUpload}
              uploadStatus={uploadStatus}
              onReset={handleReset}
              disabled={!isAuthenticated}
            />
          </div>
        )}

        {currentStep === 'parse' && (
          <div className="space-y-8">
            <ParseResults 
              results={parseResults}
              onReset={handleReset}
              onGenerateQuiz={handleGenerateQuiz}
            />
          </div>
        )}

        {currentStep === 'quiz' && (
          <div className="space-y-8">
            <QuizDisplay 
              quizItems={quizItems}
              onQuizItemUpdate={handleQuizItemUpdate}
              imageMapping={imageMapping}
            />
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                重新开始
              </button>
              <button
                onClick={handleProceedToKnowledgePoint}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>继续匹配知识点</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'knowledge-point' && (
          <div className="space-y-8">
            <KnowledgePointMatching
              quizItems={quizItems}
              onComplete={handleKnowledgePointComplete}
              onBack={handleBackToQuiz}
              imageMapping={imageMapping}
            />
          </div>
        )}

        {currentStep === 'final' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">处理完成！</h2>
              <p className="text-gray-600 mb-6">
                成功生成 {quizWithKnowledgePoints.length} 道题目并匹配知识点
              </p>
              
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Upload className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800">
                  题目已成功提交到后端数据库
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleExportToExcel}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>导出为 Excel</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  处理新文档
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;