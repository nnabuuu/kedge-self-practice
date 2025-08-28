import React from 'react';
import { X, AlertTriangle, FileText } from 'lucide-react';

interface FileFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FileFormatModal: React.FC<FileFormatModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">不支持 .doc 格式</h2>
        </div>

        <div className="space-y-4 text-gray-600">
          <p>
            系统仅支持 <span className="font-semibold text-gray-900">.docx</span> 格式的文档（Word 2007 及以上版本）。
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              如何转换文件格式
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>在 Microsoft Word 中打开您的 .doc 文件</li>
              <li>点击菜单栏的「文件」→「另存为」</li>
              <li>在文件类型下拉菜单中选择「Word 文档 (*.docx)」</li>
              <li>点击「保存」</li>
              <li>上传新保存的 .docx 文件</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500">
              💡 <span className="font-medium">提示：</span>
              .docx 格式支持更好的图片处理和内容解析，转换后不会丢失任何内容。
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          我知道了
        </button>
      </div>
    </div>
  );
};