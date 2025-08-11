import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { ParseResults } from './components/ParseResults';
import { QuizDisplay } from './components/QuizDisplay';
import { KnowledgePointMatching } from './components/KnowledgePointMatching';
import { Footer } from './components/Footer';
import { uploadDocxFile, extractQuizFromParagraphs } from './services/quizService';
import { exportToExcel } from './utils/exportUtils';
import { ParagraphData, QuizItem, QuizWithKnowledgePoint, UploadStatus } from './types/quiz';
import { BookOpen, ArrowRight, Download } from 'lucide-react';

function App() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [parseResults, setParseResults] = useState<ParagraphData[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizWithKnowledgePoints, setQuizWithKnowledgePoints] = useState<QuizWithKnowledgePoint[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'parse' | 'quiz' | 'knowledge-point' | 'final'>('upload');

  const handleFileUpload = async (file: File) => {
    try {
      setUploadStatus({
        status: 'uploading',
        progress: 25,
        message: '正在上传文件...',
      });

      const results = await uploadDocxFile(file);
      
      setUploadStatus({
        status: 'processing',
        progress: 75,
        message: '正在处理文档...',
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      setParseResults(Array.isArray(results) ? results : []);
      setUploadStatus({
        status: 'success',
        progress: 100,
        message: '文档处理成功！',
      });
      
      setCurrentStep('parse');
    } catch (error) {
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

      const quiz = await extractQuizFromParagraphs(parseResults);
      
      console.log('Quiz generated successfully:', quiz);
      
      // 先设置题目数据
      setQuizItems(quiz);
      
      // 添加短暂延迟确保状态更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 然后更新状态并跳转
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

  const handleKnowledgePointComplete = (quizWithKnowledgePoints: QuizWithKnowledgePoint[]) => {
    setQuizWithKnowledgePoints(quizWithKnowledgePoints);
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
              <ArrowRight className="w-5 h-5 text-gray-300" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">题目解析器</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            上传您的 DOCX 题目文档，自动提取题目并识别高亮答案
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Main Content */}
        <div className="space-y-8">
          {currentStep === 'upload' && (
            <FileUploader
              onUpload={handleFileUpload}
              uploadStatus={uploadStatus}
              onReset={handleReset}
            />
          )}

          {currentStep === 'parse' && parseResults.length > 0 && (
            <div className="space-y-6">
              <ParseResults results={parseResults} />
              <div className="text-center">
                <button
                  onClick={handleGenerateQuiz}
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-md"
                  disabled={uploadStatus.status === 'processing'}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  {uploadStatus.status === 'processing' ? '正在生成题目...' : '生成题目'}
                </button>
              </div>
              {uploadStatus.status === 'processing' && (
                <div className="text-center">
                  <div className="w-full max-w-xs mx-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">{uploadStatus.message}</span>
                      <span className="text-sm text-gray-500">{uploadStatus.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadStatus.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'quiz' && quizItems.length > 0 && (
            <div className="space-y-6">
              <QuizDisplay 
                quizItems={quizItems} 
                onQuizItemUpdate={handleQuizItemUpdate}
              />
              <div className="text-center">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleProceedToKnowledgePoint}
                    className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-md"
                  >
                    匹配知识点
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-md"
                  >
                    上传其他文档
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'knowledge-point' && quizItems.length > 0 && (
            <KnowledgePointMatching
              quizItems={quizItems}
              onComplete={handleKnowledgePointComplete}
              onBack={handleBackToQuiz}
            />
          )}

          {currentStep === 'final' && quizWithKnowledgePoints.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="text-center">
                  <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">处理完成！</h2>
                  <p className="text-gray-600 mb-6">
                    已成功生成 {quizWithKnowledgePoints.length} 道题目并完成知识点匹配
                  </p>
                  <div className="flex justify-center space-x-4 mb-6">
                    <button
                      onClick={() => setCurrentStep('quiz')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      查看题目
                    </button>
                    <button
                      onClick={() => setCurrentStep('knowledge-point')}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      查看知识点
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      重新开始
                    </button>
                  </div>
                  
                  {/* Export Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <button
                      onClick={handleExportToExcel}
                      className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-md"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      导出为 Excel 文件
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;