import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface EssayQuestionProps {
  essayAnswer: string;
  showResult: boolean;
  speechSupported: boolean;
  isListening: boolean;
  voiceTranscript: string;
  onAnswerChange: (value: string) => void;
  onToggleVoiceInput: () => void;
  onReadQuestion: () => void;
}

export const EssayQuestion: React.FC<EssayQuestionProps> = ({
  essayAnswer,
  showResult,
  speechSupported,
  isListening,
  voiceTranscript,
  onAnswerChange,
  onToggleVoiceInput,
  onReadQuestion
}) => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 tracking-wide">
            请在下方输入您的答案：
          </label>
          {speechSupported && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleVoiceInput}
                disabled={showResult}
                className={`flex items-center px-3 py-1 rounded-lg text-sm transition-all duration-300 ease-out ${
                  isListening
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                } ${showResult ? 'opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'}`}
                title={isListening ? '停止语音输入' : '开始语音输入'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-1" />
                    停止录音
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-1" />
                    语音输入
                  </>
                )}
              </button>
              <button
                onClick={onReadQuestion}
                className="flex items-center px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm transition-all duration-300 ease-out focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
                title="朗读题目"
              >
                <Volume2 className="w-4 h-4 mr-1" />
                朗读题目
              </button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <textarea
            value={essayAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={showResult}
            placeholder="请详细回答问题，注意逻辑清晰、层次分明..."
            className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
          />
          
          {/* 语音输入实时显示 */}
          {voiceTranscript && (
            <div className="absolute bottom-2 left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-blue-800">正在识别：{voiceTranscript}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="tracking-wide">
          建议字数：200-500字 | 当前字数：{essayAnswer.length}字
        </div>
        {isListening && (
          <div className="flex items-center text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            正在录音...
          </div>
        )}
      </div>
    </div>
  );
};