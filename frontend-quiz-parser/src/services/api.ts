// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';

// Store JWT token in memory and localStorage
let authToken: string | null = null;

// Initialize token from localStorage on module load
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('jwt_token') || localStorage.getItem('token') || null;
}

export const setAuthToken = (token: string) => {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt_token', token);
  }
};

export const getAuthToken = () => {
  // Check localStorage if in-memory token is not available
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('jwt_token') || localStorage.getItem('token') || null;
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('token');
  }
};

// Base fetch wrapper with authentication
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  // Get the current auth token (check both memory and localStorage)
  const currentToken = getAuthToken();
  
  // Add auth token if available
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  
  // Add content-type for JSON requests
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    // Log detailed error information for debugging
    console.error(`API Error: ${response.status} ${response.statusText} for ${url}`);
    console.error(`Headers sent:`, headers);
    
    // Handle authentication errors
    if (response.status === 401) {
      clearAuthToken();
      throw new Error('Authentication required. Please login.');
    }
    
    if (response.status === 403) {
      throw new Error('Access denied. You need teacher permissions.');
    }
    
    if (response.status === 405) {
      throw new Error(`Method not allowed for ${endpoint}. Please check if the backend is running and accessible at ${API_BASE_URL}`);
    }
    
    // Try to get error message from response
    let errorMessage = `Request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }
    
    throw new Error(errorMessage);
  }
  
  return response;
};

// Authentication APIs
export const login = async (email: string, password: string) => {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

export const register = async (email: string, password: string, name?: string, role: 'student' | 'teacher' = 'teacher') => {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });
  
  const data = await response.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};