import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ConnectionErrorProps {
  error: string;
  onRetry: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      // Use /v1/health endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}/health`, {
        method: 'GET'
      });
      setConnectionStatus(response.ok ? 'online' : 'offline');
    } catch {
      setConnectionStatus('offline');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkConnection();
    
    // Wait a bit for the status to update
    setTimeout(async () => {
      // Check again after a short delay
      await checkConnection();
      setIsRetrying(false);
      onRetry();
    }, 500);
  };

  const getErrorMessage = () => {
    if (error.toLowerCase().includes('network')) {
      return '无法连接到服务器，请检查网络连接';
    }
    if (error.toLowerCase().includes('unauthorized')) {
      return '认证失败，请重新登录';
    }
    if (error.toLowerCase().includes('not found')) {
      return '请求的资源不存在';
    }
    if (error.toLowerCase().includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    return error || '发生未知错误';
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        {connectionStatus === 'checking' ? (
          <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
        ) : connectionStatus === 'offline' ? (
          <WifiOff className="h-12 w-12 text-red-500" />
        ) : (
          <AlertCircle className="h-12 w-12 text-orange-500" />
        )}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {connectionStatus === 'offline' ? '无法连接到服务器' : '加载失败'}
      </h2>

      <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
        {getErrorMessage()}
      </p>

      {connectionStatus === 'offline' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md max-w-md">
          <p className="text-sm text-yellow-800">
            请确保后端服务正在运行：
          </p>
          <ul className="text-xs text-yellow-700 mt-2 space-y-1">
            <li>• 检查数据库是否已启动 (PostgreSQL on port 7543)</li>
            <li>• 检查 API 服务是否运行 (nx run api-server:serve)</li>
            <li>• 确认服务地址: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1'}</li>
          </ul>
        </div>
      )}

      {retryCount > 0 && retryCount < maxRetries && (
        <p className="text-xs text-gray-500 mb-4">
          重试 {retryCount}/{maxRetries} 次
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRetrying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              重试中...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              重试
            </>
          )}
        </button>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          刷新页面
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-500 max-w-md w-full">
          <summary className="cursor-pointer hover:text-gray-700">
            错误详情（开发模式）
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify({ error, connectionStatus, retryCount }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

// Connection status hook
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check backend status
    const checkBackend = async () => {
      try {
        // Use /v1/health endpoint with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718'}/v1/health`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setBackendStatus(response.ok ? 'online' : 'offline');
      } catch {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    // Check more frequently when offline, less frequently when online
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      interval = setInterval(() => {
        checkBackend();
      }, backendStatus === 'offline' ? 5000 : 30000); // 5s when offline, 30s when online
    };
    
    startPolling();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [backendStatus]);

  return { isOnline, backendStatus };
};