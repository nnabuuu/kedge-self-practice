import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadStatus } from '../types/quiz';

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  uploadStatus: UploadStatus;
  onReset: () => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  uploadStatus,
  onReset,
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    const docxFile = files.find(file => 
      file.name.toLowerCase().endsWith('.docx') || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (docxFile) {
      setSelectedFile(docxFile);
      onUpload(docxFile);
    }
  }, [onUpload, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onUpload(file);
    }
  }, [onUpload, disabled]);

  const handleReset = () => {
    setSelectedFile(null);
    onReset();
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
      case 'processing':
        return <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Upload className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-emerald-300 bg-emerald-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        if (disabled) {
          return 'border-gray-200 bg-gray-50';
        }
        return dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${getStatusColor()}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className={`absolute inset-0 w-full h-full opacity-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={disabled || uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          {selectedFile ? (
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
              {uploadStatus.status === 'idle' && (
                <button
                  onClick={handleReset}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                上传题目文档
              </h3>
              <p className={`mb-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                {disabled ? '请先登录后再上传文件' : '拖拽 DOCX 文件到此处，或点击选择文件'}
              </p>
            </div>
          )}
          
          {uploadStatus.status !== 'idle' && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{uploadStatus.message}</span>
                <span className="text-sm text-gray-500">{uploadStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {uploadStatus.status === 'success' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              上传其他文件
            </button>
          )}
        </div>
      </div>
    </div>
  );
};