import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Powered by <span className="font-semibold text-gray-800">KedgeTech</span>，用于CYEZ测试
          </p>
        </div>
      </div>
    </footer>
  );
};